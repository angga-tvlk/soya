import React from 'react';
import Page from 'soya/lib/page/Page';
import RenderResult from 'soya/lib/page/RenderResult';
import ReactRenderer from 'soya/lib/page/react/ReactRenderer';
import register from 'soya/lib/client/Register';
import ReduxStore from 'soya/lib/data/redux/ReduxStore';
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';
import smokesignals from 'soya/lib/event/smokesignals';
import Form from 'soya/lib/data/redux/form/Form';
import FormSegment from 'soya/lib/data/redux/form/FormSegment';

import ContactForm from '../../../components/contextual/ContactForm/ContactForm.js'

// TODO: Figure out how to do promise polyfill.
import style from '../../../shared/sitewide.css';

const FORM_ID = 'contact';
const REUSE_FORM_ID = 'kontakte';

class Component extends React.Component {
  componentWillMount() {
    this.actions = this.props.reduxStore.register(FormSegment);
    this._form = new Form(this.props.reduxStore, FORM_ID);
    this._kontakteForm = new Form(this.props.reduxStore, REUSE_FORM_ID);
  }

  render() {
    return <div>
      <h1>Simple Form</h1>
      <h3>Basic Use Cases</h3>
      <ul>
        <li>Two way data binding. Data from each field should bind to redux state, and vice-versa.</li>
        <li><a href="javascript:void(0)" onClick={this.replaceValues.bind(this)}>Click here</a> to set values to the redux store, form inputs should also update.</li>
        <li><a href="javascript:void(0)" onClick={this.clearValues.bind(this)}>Click here</a> to clear values in redux store, form inputs should also update.</li>
        <li>Sync validation should also work for each field, required/optional validation also works.</li>
        <li>Per-field submit validation should work on <i>Base City</i> (set values first, then click submit button).</li>
        <li>Async validation should also work for phone number field (value must contain 021).</li>
        <li>Form can be <a href="javascript:void(0)" onClick={this.enableForm.bind(this)}>enabled</a> and <a href="javascript:void(0)" onClick={this.disableForm.bind(this)}>disabled</a>, input fields listen to changes in enabled/disabled state.</li>
        <li>Form-wide validation (acquaintance cannot borrow money) will be run on submit.</li>
        <li>On submission, all per-field sync, async and submit validation should be run, along with custom form-wide validation.</li>
      </ul>
      <ContactForm form={this._form} formName="Contact Us" reduxStore={this.props.reduxStore} config={this.props.config} />
      <h3>Reusing Form</h3>
      <ul>
        <li>Reusing the same form component, but saving it on another name.</li>
        <li>Setting values to the first form doesn't set it to the other.</li>
        <li><a href="javascript:void(0)" onClick={this.replaceKontakteForm.bind(this)}>Setting values to this form doesn't</a> set it to the first one.</li>
      </ul>
      <ContactForm form={this._kontakteForm} formName="Kontakte Form" reduxStore={this.props.reduxStore} config={this.props.config} />
      <DebugPanel top right bottom>
        <DevTools store={this.props.reduxStore._store} monitor={LogMonitor} />
      </DebugPanel>
    </div>
  }

  replaceValues() {
    this.props.reduxStore.dispatch(this.actions.setValues(FORM_ID, {
      name: 'Rick Christie',
      phoneNumber: '123 456 789',
      message: 'Bring me back that Meteora LP that you borrowed!',
      relationship: 'girlfriend',
      call: ['evening', 'night'],
      from: 'Jayakarta (CGK)',
      target: {
        sms: true,
        email: true
      },
      type: 'borrowing'
    }));
  }

  replaceKontakteForm() {
    this.props.reduxStore.dispatch(this.actions.setValues(REUSE_FORM_ID, {
      name: '',
      phoneNumber: '',
      nickname: 'Long Winded Man',
      message: '',
      relationship: 'acquaintance',
      call: ['morning'],
      from: 'Surabaya (SUB)',
      target: { email: true },
      type: 'friend'
    }));
  }

  enableForm() {
    this._form.enable();
  }

  disableForm() {
    this._form.disable();
  }

  clearValues() {
    this.props.reduxStore.dispatch(this.actions.clear(FORM_ID));
  }
}

class SimpleForm extends Page {
  static get pageName() {
    return 'SimpleForm';
  }

  createStore(initialState) {
    var reduxStore = new ReduxStore(Promise, initialState, this.config, this.cookieJar);
    return reduxStore;
  }

  render(httpRequest, routeArgs, store, callback) {
    var reactRenderer = new ReactRenderer();
    reactRenderer.head = '<title>Simple Form Test</title>';
    reactRenderer.body = React.createElement(Component, {
      reduxStore: store,
      config: this.config
    });
    var renderResult = new RenderResult(reactRenderer);
    callback(renderResult);
  }
}

register(SimpleForm);
export default SimpleForm;