import React from 'react';
import Page from 'soya/lib/page/Page';
import RenderResult from 'soya/lib/page/RenderResult';
import ReactRenderer from 'soya/lib/page/react/ReactRenderer.js';
import register from 'soya/lib/client/Register';
import ReduxStore from 'soya/lib/data/redux/ReduxStore.js';
import RandomTimeEchoString from '../../../components/contextual/RandomTimeEchoString/RandomTimeEchoString.js';
import FibonacciSequence from '../../../components/contextual/FibonacciSequence/FibonacciSequence.js';
import FibonacciTotal from '../../../components/contextual/FibonacciTotal/FibonacciTotal.js';
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';

// TODO: Figure out how to do promise polyfill.
import style from '../../../shared/sitewide.css';

class Component extends React.Component {
  render() {
    return <div>
      <h1>Server Segment Dependencies</h1>
      <h3>Serial Dependency</h3>
      <ul>
        <li>HTML response should already contain the text 'Quick Fox' fetched serially below.</li>
        <li>Redux store state should already contain letters for 'Quick Fox'.</li>
      </ul>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Quick Fox'} />
      <h3>Parallel Dependency</h3>
      <ul>
        <li>HTML response should already contain an anagram of text 'Jumps Over', fetched parallely below.</li>
        <li>Redux store state should already contain letters for 'Jumps Over'.</li>
      </ul>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Jumps Over'} isParallel={true} />
      <h3>Recursive <code>QueryDependencies</code></h3>
      <ul>
        <li>This tests recursive characteristics of <code>QueryDependencies</code> class.</li>
        <li>Test are organized as <code>[Parent]-[Child]</code>. Letter 's' will be replaced with 'soya' with recursive <code>QueryDependencies</code>.</li>
        <li>If Child is Serial, the string 'soya' should be ordered correctly, otherwise it should be an anagram.</li>
      </ul>
      <h4>Serial-Serial</h4>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Olsen'} shouldReplace={true} />
      <h4>Serial-Parallel</h4>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Olsen'} shouldReplace={true} isReplaceParallel={true} />
      <h4>Parallel-Serial</h4>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Olsen'} shouldReplace={true} isParallel={true} />
      <h4>Parallel-Parallel</h4>
      <RandomTimeEchoString reduxStore={this.props.reduxStore} config={this.props.config} value={'Olsen'} shouldReplace={true} isParallel={true} isReplaceParallel={true} />
      <h3>Serial Function Dependencies</h3>
      <ul>
        <li>We have an addition API, and we're going to create a Fibonacci sequence using it.</li>
        <li>Since it's Fibonacci, the next number in the sequence can only be calculated if we know the previous two numbers.</li>
        <li>We expect the Fibonacci sequence is correct, and it must be present in the HTML.</li>
      </ul>
      <FibonacciSequence reduxStore={this.props.reduxStore} config={this.props.config} number={10} />
      <h3>Recursive Segment Dependencies</h3>
      <FibonacciTotal reduxStore={this.props.reduxStore} config={this.props.config} number={10} />
      <DebugPanel top right bottom>
        <DevTools store={this.props.reduxStore._store} monitor={LogMonitor} />
      </DebugPanel>
    </div>;
  }
}

class ServerSegmentDependencies extends Page {
  static get pageName() {
    return 'ServerSegmentDependencies';
  }

  createStore(initialState) {
    var reduxStore = new ReduxStore(Promise, initialState, this.config, this.cookieReader);
    return reduxStore;
  }

  render(httpRequest, routeArgs, store, callback) {
    var reactRenderer = new ReactRenderer();
    reactRenderer.head = '<title>Segment Dependencies Test</title>';
    reactRenderer.body = React.createElement(Component, {
      reduxStore: store,
      config: this.config
    });
    var renderResult = new RenderResult(reactRenderer);
    callback(renderResult);
  }
}

register(ServerSegmentDependencies);
export default ServerSegmentDependencies;