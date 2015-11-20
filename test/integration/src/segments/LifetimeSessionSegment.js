import MapSegment from 'soya/lib/data/redux/segment/map/MapSegment.js';
import Thunk from 'soya/lib/data/redux/Thunk.js';
import Cookie from 'soya/lib/http/Cookie.js';

// TODO: Figure out how to do polyfill.
// TODO: Figure out how to load client-side libraries like jQuery!
import request from 'superagent';

var SESSION_COOKIE_NAME = 'session';
var LIFETIME_COOKIE_NAME = 'lifetime';

export default class LifetimeSessionSegment extends MapSegment {
  static id() {
    return 'user';
  }

  _generateQueryId(query) {
    return 'default';
  }

  _generateThunkFunction(thunk) {
    var queryId = thunk.queryId;
    var lifetimeCookie = this._cookieJar.read(LIFETIME_COOKIE_NAME);
    var sessionCookie = this._cookieJar.read(SESSION_COOKIE_NAME);
    if (lifetimeCookie != null && sessionCookie != null) {
      // Just re-use what we already have in cookie.
      thunk.func = function(dispatch) {
        dispatch(this._createSyncLoadActionObject(queryId, {
          lifetime: lifetimeCookie,
          session: sessionCookie
        }));
      };
      return;
    }

    thunk.func = (dispatch) => {
      var result = new Promise((resolve, reject) => {
        request.get('http://localhost:8000/api/context').end((err, res) => {
          if (res.ok) {
            var payload = JSON.parse(res.text);
            dispatch(this._createSyncLoadActionObject(queryId, payload));
            var sessionCookie = Cookie.createSession(SESSION_COOKIE_NAME, payload.session);
            var lifetimeCookie = Cookie.createExpireInDays(LIFETIME_COOKIE_NAME, payload.lifetime, 10 * 360);
            this._cookieJar.set(sessionCookie);
            this._cookieJar.set(lifetimeCookie);
            resolve();
          } else {
            reject(new Error('Unable to fetch user data!'));
          }
        });
      });
      return result;
    };
  }
}