import Compiler from '../Compiler';
import CompileResult from '../CompileResult';
import EntryPoint from '../../EntryPoint';
import WebpackAssetServer from './WebpackAssetServer';

var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var COMMONS_ENTRY_NAME = '__commons';

/**
 * @SERVER
 */
export default class WebpackCompiler extends Compiler {
  /**
   * @type {{[key: string]: any}}
   */
  _frameworkConfig;

  /**
   * @type {string}
   */
  _absoluteClientBuildDir;

  /**
   * @type {string}
   */
  _assetHostPath;

  /**
   * @type {{[key: string]: string}}
   */
  _clientReplace;

  /**
   * @type {Array<Function>}
   */
  _clientResolve;

  /**
   * @type {WebpackAssetServer}
   */
  _assetServer;

  /**
   * @type {any}
   */
  _react;

  /**
   * @type {any}
   */
  _webpack;

  /**
   * @type {Logger}
   */
  _logger;

  /**
   * @type {?Function}
   */
  _webpackDevMiddleware;

  /**
   * @type {?Function}
   */
  _webpackHotMiddleware;

  /**
   * @type {boolean}
   */
  _firstCompileDone;

  /**
   * @param {Logger} logger
   * @param {Object} frameworkConfig
   * @param {any} webpack
   * @param {any} react
   * @param {Function} webpackDevMiddleware
   * @param {Function} webpackHotMiddleware
   */
  constructor(logger, frameworkConfig, webpack, react,
              webpackDevMiddleware, webpackHotMiddleware) {
    super();
    this._logger = logger;
    this._react = react;
    this._webpack = webpack;
    this._webpackDevMiddleware = webpackDevMiddleware;
    this._webpackHotMiddleware = webpackHotMiddleware;
    this._frameworkConfig = frameworkConfig;
    this._clientReplace = frameworkConfig.clientReplace;
    this._clientResolve = frameworkConfig.clientResolve;
    this._absoluteClientBuildDir = frameworkConfig.absoluteClientBuildDir;
    this._assetHostPath = frameworkConfig.assetHostPath;
    this._assetServer = new WebpackAssetServer(this._assetHostPath, this._absoluteClientBuildDir, logger);
    this._firstCompileDone = false;

    if (this._frameworkConfig.hotReload && (!webpackDevMiddleware || !webpackHotMiddleware)) {
      throw new Error('Hot reload flag is true, yet webpack dev/hot middleware is not passed to WebpackCompiler.');
    }

    this._cleanTempDir();
  }

  /**
   * @param {any} webpack
   * @param {Object} frameworkConfig
   * @returns {Object}
   */
  static createServerBuildConfig(webpack, frameworkConfig) {
    var nodeModules = {};
    var absProjectDir = frameworkConfig.absoluteProjectDir;
    var absEntryPointFile = path.join(frameworkConfig.absoluteProjectDir, 'server.js');
    var absBuildTargetDir = frameworkConfig.absoluteServerBuildDir;
    fs.readdirSync(path.join(absProjectDir, 'node_modules'))
      .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
      })
      .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
      });

    var definePlugin = new webpack.DefinePlugin({
      __PROJECT_DIRNAME__: JSON.stringify(absProjectDir)
    });

    return {
      entry: absEntryPointFile,
      target: 'node',
      output: {
        path: absBuildTargetDir,
        publicPath: frameworkConfig.assetProtocol + '://' + frameworkConfig.assetHostPath,
        filename: 'index.js'
      },
      node: {
        __dirname: true,
        __filename: true
      },
      devtool: 'sourcemap',
      module: {
        loaders: [
          WebpackCompiler.getBabelLoaderConfig(),
          WebpackCompiler.getFileLoaderConfig(frameworkConfig),
          { test: /\.css$/, loader: "css-loader" }
        ]
      },
      plugins: [
        definePlugin,
        new webpack.BannerPlugin('require("source-map-support").install();',
          { raw: true, entryOnly: false }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin()
      ],
      externals: nodeModules
    };
  }

  /**
   * @return {Object}
   */
  static getBabelLoaderConfig() {
    var result = {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        optional: ['runtime'],
        blacklist: [],
        retainLines: true,
        comments: false
      }
    };
    return result;
  };

  /**
   * Only called at client side. Adds babel plugins like react-transform and
   * client resolve operations.
   *
   * @return {Object}
   */
  getBabelLoaderExtras() {
    var result = {
      plugins: [
        {
          transformer: this._createPlugin(),
          position: 'after'
        }
      ],
      extra: {}
    };

    if (this._frameworkConfig.hotReload) {
      result.plugins.push('react-transform');
      result.extra['react-transform'] = {
        transforms: [
          //{
          //  'transform': 'react-transform-hmr',
          //  'imports': ['react'],
          //  'locals':  ['module']
          //},
          {
            'transform': 'react-transform-catch-errors',
            'imports': ['react', 'redbox-react']
          }
        ]
      };
    }
    return result;
  }

  static getFileLoaderConfig(config) {
    var test;
    if (config.staticAssetRegex) {
      test = config.staticAssetRegex;
    } else {
      test = /(\.jpg|\.png|\.jpeg|\.gif|\.ico|\.svg|\.eot|\.woff|\.woff2|\.ttf)$/;
    }
    return {
      test: test,
      loader: "file-loader?name=[path][name]-[hash].[ext]"
    };
  }

  /**
   * 1) Create configuration with one common file for webpack.
   * 2) Compile webpack from source to temporary location, with CSS loader
   *    and file loader.
   * 3) Read all files to AssetServer - AssetServer could just read the
   *    files, but cache everything.
   *
   *    TODO: Make babel optional
   *    TODO: Allow user setting of loaders.
   *
   * @param {Array<EntryPoint>} entryPoints
   * @param {Function} updateCompileResultCallback
   * @return {Array<Function>}
   */
  run(entryPoints, updateCompileResultCallback) {
    var i, j, entryPoint, entryPointList = [];
    var configuration = {
      entry: {},
      output: {
        path: this._absoluteClientBuildDir,
        filename: "[name]-[chunkhash].js",
        publicPath: this._frameworkConfig.assetProtocol + '://' + this._assetHostPath
      },
      module: {
        loaders: [
          WebpackCompiler.getBabelLoaderConfig(),
          WebpackCompiler.getFileLoaderConfig(this._frameworkConfig),
          { test: /\.css$/, loader: "style-loader?returnComplete=true!css-loader" }
        ]
      },
      babel: this.getBabelLoaderExtras(),
      resolve: { alias: {} },
      plugins: [ new this._webpack.optimize.OccurenceOrderPlugin() ]
    };



    for (i in this._clientReplace) {
      if (!this._clientReplace.hasOwnProperty(i)) continue;
      configuration.resolve.alias[i] = this._clientReplace[i];
    }

    if (this._frameworkConfig.hotReload) {
      configuration.plugins.push(new this._webpack.HotModuleReplacementPlugin());
    }

    configuration.plugins.push(new this._webpack.NoErrorsPlugin());
    configuration.plugins.push(new this._webpack.optimize.CommonsChunkPlugin(
      COMMONS_ENTRY_NAME, 'common-[hash].js', entryPointList
    ));

    if (this._frameworkConfig.minifyJs) {
      configuration.plugins.push(new this._webpack.optimize.UglifyJsPlugin({}));
    }

    var pageToRequire;
    for (i = 0; i < entryPoints.length; i++) {
      entryPoint = entryPoints[i];
      pageToRequire = path.join(entryPoint.rootAbsolutePath, entryPoint.name + '.js');
      configuration.entry[entryPoint.name] = pageToRequire;
      entryPointList.push(entryPoint.name);
    }

    var compiler = this._webpack(configuration);
    var self = this;

    compiler.plugin('done', (stats) => {
      if (stats.compilation.errors.length > 0) {
        // Error occured. Print error messages.
        this._printErrorMessages(stats);
        return;
      }

      var i, chunkMap = {};
      for (i = 0; i < stats.compilation.chunks.length; i++) {
        chunkMap[stats.compilation.chunks[i].name] = stats.compilation.chunks[i];
      }
      var commonsChunk = chunkMap[COMMONS_ENTRY_NAME];

      var compileResult = new CompileResult(), entryPointChunk, entryPointName, pageDep;
      for (i = 0; i < entryPointList.length; i++) {
        entryPointName = entryPointList[i];
        if (!chunkMap.hasOwnProperty(entryPointName)) {
          var error = new Error('Unable to determine dependency, entry point ' + entryPointName + ' does not have webpack chunk!');
          if (this._firstCompileDone) {
            // If this is a webpack hot reload compilation, don't throw the
            // error, just log to the user.
            this._logger.error('Hot reload ->', error);
            return;
          }
          throw error;
        }
        entryPointChunk = chunkMap[entryPointName];

        pageDep = {
          cssDependencies: [],
          jsDependencies: []
        };

        for (j = 0; j < commonsChunk.files.length; j++) {
          pageDep.jsDependencies.push(self._assetServer.toUrlWithProtocol(
            commonsChunk.files[j], this._frameworkConfig.assetProtocol
          ));
        }
        for (j = 0; j < entryPointChunk.files.length; j++) {
          pageDep.jsDependencies.push(self._assetServer.toUrlWithProtocol(
            entryPointChunk.files[j], this._frameworkConfig.assetProtocol
          ));
        }

        compileResult.pages[entryPointName] = pageDep;
      }

      // Sets the flag, we have completed the very first compilation. Next
      // compilation error should not trigger errors.
      this._firstCompileDone = true;

      updateCompileResultCallback(compileResult);
    });

    compiler.plugin('failed', (err) => {
      // Error ocurred. Print error messages.
      this._printErrorMessages(err);
    });

    var middlewares = [];

    if (this._frameworkConfig.hotReload) {
      // Let webpack-dev-middleware handles watching, storing output and serving
      // asset requests. Meanwhile, webpack hot middleware should be accepting
      // connection from the client.
      middlewares.push(this._webpackDevMiddleware(compiler, {
        noInfo: true,
        publicPath: configuration.output.publicPath
      }));
      middlewares.push(this._webpackHotMiddleware(compiler));
    } else {
      // Middleware for regular webpack asset server.
      middlewares.push((request, response, next) => {
        var handledByAssetServer = this._assetServer.handle(request, response);
        if (!handledByAssetServer) {
          next();
        }
      });

      // We only need to run if we are not hot reloading, since
      // webpack-dev-middleware already runs watch() for us.
      compiler.run(function() {
        // No-op. We'll use the above 'done' and 'failed' hook to notify
        // application for successes and failures.
      });
    }

    return middlewares;
  }

  _cleanTempDir() {
    // Remove everything in the directory.
    rimraf.sync(this._absoluteClientBuildDir);

    // Ensure directory exists.
    try {
      fs.mkdirSync(this._absoluteClientBuildDir);
    } catch(e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  /**
   * @param {any} stats
   */
  _printErrorMessages(stats) {
    if (this._firstCompileDone) {
      // Second compilation is only done when we are using hot reload.
      // We should not stop the server if an exception happens.
      return;
    }
    var error = new Error('Webpack compilation error!');
    this._logger.error('Webpack compilation error -> ', error, [stats.compilation.errors]);
    throw error;
  }

  _createPlugin() {
    var self = this;
    return function({ Plugin, types: t }) {
      return new Plugin("soya-webpack-compiler", {
        visitor: {
          CallExpression(node, parent) {
            if (t.isIdentifier(node.callee, { name: "require" })) {
              var requireValue = node.arguments[0].value;
              if (self._clientResolve) {
                var i, resolved;
                for (i = 0; i < self._clientResolve.length; i++) {
                  // TODO: Pass also the absolute path of currently parsed file.
                  resolved = self._clientResolve[i](requireValue);
                  if (resolved != null) {
                    node.arguments[0].value = resolved;
                    return;
                  }
                }
              }
            }
          }
        }
      });
    };
  }
}