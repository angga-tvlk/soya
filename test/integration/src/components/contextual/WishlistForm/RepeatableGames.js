import React from 'react';
import createRepeatable from 'soya/lib/data/redux/form/createRepeatable';

import TextField from '../../common/TextField/TextField';
import RepeatableReviews from './RepeatableReviews.js';
import RepeatableAdd from '../../common/RepeatableAdd/RepeatableAdd';
import style from './style.css';

export class GamesFieldSet extends React.Component {
  render() {
    return <div className={style.repeatable}>
      <div>
        <a href="javascript:void(0)" onClick={this.props.removeListItem.bind(null, this.props.index)}>Remove</a>
        <a href="javascript:void(0)" onClick={this.props.reorderListItemInc.bind(null, this.props.index, 1)}>Down</a>
        <a href="javascript:void(0)" onClick={this.props.reorderListItemDec.bind(null, this.props.index, 1)}>Up</a>
      </div>
      <h5>Game {this.props.index + 1}</h5>
      <TextField form={this.props.form} name={this.props.name(['name'])} label="Name"
                 reduxStore={this.props.reduxStore} config={this.props.config} />
      <TextField form={this.props.form} name={this.props.name(['genre'])} label="Genre"
                 reduxStore={this.props.reduxStore} config={this.props.config} />
      <RepeatableReviews form={this.props.form} name={this.props.name(['reviews'])} minLength={1}
                         reduxStore={this.props.reduxStore} config={this.props.config} />
      <RepeatableAdd form={this.props.form} reduxStore={this.props.reduxStore}
                     name={this.props.name(['reviews'])} minLength={1} maxLength={3}
                     label={'Tambah Review'} />
    </div>;
  }
}

export default createRepeatable(GamesFieldSet);