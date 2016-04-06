import MapSegment from 'soya/lib/data/redux/segment/map/MapSegment.js';
import Thunk from 'soya/lib/data/redux/Thunk.js';
import QueryDependencies from 'soya/lib/data/redux/QueryDependencies.js';

// TODO: Figure out how to do polyfill.
// TODO: Figure out how to load client-side libraries like jQuery!
import request from 'superagent';

import { BookingSegmentId } from './ids.js';
import LifetimeSessionSegment from './LifetimeSessionSegment.js';

export default class BookingSegment extends MapSegment {
  static id() {
    return BookingSegmentId;
  }

  static getSegmentDependencies() {
    return [LifetimeSessionSegment];
  }

  _generateQueryId(query) {
    return query.bookingId;
  }

  _generateThunkFunction(thunk) {
    var queryId = thunk.queryId;
    var query = thunk.query;
    var dependencies = QueryDependencies.serial(Promise);
    dependencies.add('context', LifetimeSessionSegment.id(), null);
    thunk.dependencies = dependencies;
    thunk.func = (dispatch) => {
      var result = new Promise((resolve, reject) => {
        // Note: can already use lifetime and session in this request.
        request.get('http://localhost:8000/api/booking/' + encodeURIComponent(query.bookingId)).end((err, res) => {
          var payload = JSON.parse(res.text);
          if (res.ok) {
            dispatch(this._createSyncLoadActionObject(queryId, payload));
            resolve();
          } else if (res.notFound) {
            dispatch(this._createSyncLoadActionObject(queryId, null, [payload.error]));
          }
        });
      });
      return result;
    };
  }
}