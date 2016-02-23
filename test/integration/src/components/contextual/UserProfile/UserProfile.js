import React from 'react';

import UserSegment from '../../../segments/UserSegment.js';
import connect from 'soya/lib/data/redux/connect';
import { SERVER } from 'soya/lib/data/RenderType';

class UserProfile extends React.Component {
  static connectId() {
    return 'UserProfile';
  }

  static getSegmentDependencies(config) {
    return [UserSegment];
  }

  static subscribeQueries(nextProps, subscribe) {
    var hydrationOption = null;
    if (nextProps.loadAtClient) {
      hydrationOption = {
        SERVER: false
      };
    }

    subscribe(UserSegment.id(), { username: nextProps.username }, 'user',
      hydrationOption);
  }

  render() {
    if (!this.props.result.user.loaded) {
      return <div>
        User data is loading....
      </div>
    }

    return <div>
      <ul>
        <li>User name: {this.props.result.user.data.username}</li>
        <li>First name: {this.props.result.user.data.firstName}</li>
        <li>Last name: {this.props.result.user.data.lastName}</li>
        <li>Email: {this.props.result.user.data.email}</li>
      </ul>
    </div>
  }
}

export default connect(UserProfile);