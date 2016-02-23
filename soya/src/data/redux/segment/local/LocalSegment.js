import Segment from '../../Segment.js';
import ActionNameUtil from '../ActionNameUtil.js';

import update from 'react-addons-update';

var Promise;

/**
 * You can query LocalSegment by specifying keys separated by dots. Examples:
 * "key", "key.subKey", etc.
 *
 * @CLIENT_SERVER
 */
export default class LocalSegment extends Segment {
  /**
   * @type {Object}
   */
  _config;

  /**
   * @type {CookieJar}
   */
  _cookieJar;

  /**
   * @type {string}
   */
  _initActionType;

  /**
   * @type {string}
   */
  _cleanActionType;

  /**
   * @type {string}
   */
  _updateActionType;

  /**
   * @param {Object} config
   * @param {CookieJar} cookieJar
   * @param {Promise} PromiseImpl
   */
  constructor(config, cookieJar, PromiseImpl) {
    super(config, cookieJar, PromiseImpl);
    this._config = config;
    this._cookieJar = cookieJar;
    Promise = PromiseImpl;

    // Since segment name is guaranteed never to clash by ReduxStore, we can
    // safely use segment name as action type.
    var id = this.constructor.id();
    this._initActionType = ActionNameUtil.generate(id, 'INIT');
    this._cleanActionType = ActionNameUtil.generate(id, 'CLEAN');
    this._updateActionType = ActionNameUtil.generate(id, 'UPDATE');
  }

  /**
   * @returns {boolean}
   */
  static shouldHydrate() {
    return false;
  }

  /**
   * @returns {Object | Array | string | number | void}
   */
  static createInitialData() {
    return null;
  }

  /**
   * @param {any} query
   * @return {string}
   */
  _generateQueryId(query) {
    if (typeof query != 'string') {
      throw new Error('Local segment query must be string. Found: \'' + query + '\'.');
    }
    return query;
  }

  /**
   * @param {any} piece
   * @return {boolean}
   */
  _isLoaded(piece) {
    // Since this is a local segment, all segment pieces are always already
    // loaded and ready to be used.
    return true;
  }

  /**
   * @param {string} queryId
   * @return {Object}
   */
  _createSyncInitAction(queryId) {
    return {
      type: this._initActionType,
      queryId: queryId,
      payload: this.constructor.createInitialData()
    };
  }

  /**
   * @return {Object}
   */
  _createSyncCleanAction() {
    return {
      type: this._cleanActionType
    };
  }

  /**
   * No need for loading. This is local segment after all.
   *
   * @param {any} query
   * @param {string} queryId
   * @return {void | Object | Thunk}
   */
  _createLoadAction(query, queryId) {
    return null;
  }

  /**
   * Returns an object containing data and errors.
   *
   * @param {any} state
   * @param {string} queryId
   * @return {any}
   */
  _getPieceObject(state, queryId) {
    if (typeof state == 'object' && typeof queryId == 'string' && queryId != '') {
      var i, segment = state, splitQuery = queryId.split('.');
      for (i = 0; i < splitQuery.length; i++) {
        if (segment.hasOwnProperty(splitQuery[i])) {
          segment = segment[splitQuery[i]];
        } else {
          return null;
        }
      }
      return segment;
    }
    return state;
  }

  /**
   * Compares two segment states, returns true if the segment state is
   * different.
   *
   * @param {any} segmentStateA
   * @param {any} segmentStateB
   * @return {boolean}
   */
  _isStateEqual(segmentStateA, segmentStateB) {
    // Since we use react immutability helper.
    return segmentStateA === segmentStateB;
  }

  /**
   * Compares pieces of two state. If they are equal return null, otherwise
   * return piece of the current segment state.
   *
   * @param prevSegmentState
   * @param segmentState
   * @param queryId
   * @return {any}
   */
  _comparePiece(prevSegmentState, segmentState, queryId) {
    // If state is equal, nothing has changed, since our reducer always
    // re-creates the object.
    if (this._isStateEqual(prevSegmentState, segmentState)) {
      return null;
    }

    var prevSegmentPiece = this._getPieceObject(prevSegmentState, queryId);
    var segmentPiece = this._getPieceObject(segmentState, queryId);
    if (segmentPiece === prevSegmentPiece) {
      return null;
    }

    return [segmentPiece];
  }

  /**
   * Returns a reducer function. Called only once by Store, on registration
   * of a new segment.
   *
   * Reducer is responsible for:
   * 1) Initializing default segment state.
   * 2) Handling changes to segment state.
   *
   * NOTE: We could easily convert this into reduce() method. However in the
   * spirit of redux, reducers should be stateless functions. Let state of
   * subscription, queries, etc. be handled by others. We're making it
   * much simpler this way, methinks.
   *
   * @return {Function}
   */
  _getReducer() {
    var initActionType = this._initActionType;
    var cleanActionType = this._cleanActionType;
    var updateActionType = this._updateActionType;
    var initialData = this.constructor.createInitialData();
    return function(state, action) {
      if (state == null) return initialData;
      switch (action.type) {
        case initActionType:
        case cleanActionType:
          // Since there are no concept of loading in local segment, init and
          // clean does the same thing, which is populating the segment with
          // initial data.
          return initialData;
          break;
        case updateActionType:
          // Update using react immutability helper.
          return update(state, action.commands);
          break;
      }
      return state;
    }
  }

  /**
   * Returns an object containing action functions. Unlike reducer,
   * ActionCreator can be stateful objects. This is allowed since ActionCreator
   * has to deal with caching and AJAX requests.
   *
   * @return {Object}
   */
  _getActionCreator() {
    var updateActionType = this._updateActionType;
    return {
      createUpdateAction(commands) {
        return {
          type: updateActionType,
          commands: commands
        }
      }
    };
  }
}