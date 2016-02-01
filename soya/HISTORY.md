# Version 0.0.x

## 0.0.27

- LocalSegment implementation for browser-only redux store state:
  - Checking whether a piece is loaded or not is now relegated to each Segment
    implementation. This means there are no longer contract between ReduxStore
    and Segment implementation on how the segment piece should be structured.
  - Segment implementation now has shouldHydrate() method. If it returns false,
    ReduxStore will not try to hydrate its queries.
  - If Segment.createLoadAction() returns null, it just returns the previous
    segment piece and doesn't do dispatch.
  - Uses react immutability helper.
  - https://bitbucket.org/bentomas/smokesignals.js
  - Create test case: modal windows.
- Decided to include smokesignals as default event emitter library. Other
  libraries uses singleton, which makes hot-reload and history navigation a
  pain to code (you have to manually destroy subscription at component unmount).
- Added isReactChildrenEqual() to redux helpers, compares type and props of
  children.
- Added _replaceState() method to redux store, for testing and reproducing bugs.

## 0.0.26

- Segment instantiation is now done by ReduxStore.
  - Segment equality check is done by checking the given constructor function.
  - DataComponent returns array of Segment constructor functions.
  - Segment.getName() becomes a static id() method.
  - Remove Segment._activate(), constructor is used instead.
- Removed custom ActionCreator class, Segment becomes the class that is
  responsible for both Reducer and Action Creator of a state tree segment.
  - MapSegment.getActionCreator() now just returns an object with bound
    function.
- Prevent double querying.
  - Separate subscribe and query function.
  - User can do manual query through ReduxStore.query(), which checks segment
    state first.
  - ReduxStore.query() also re-uses Promises cached by dispatch(), ensuring that
    at any given time, there are no more than 1 identical query.
  - User can force load with query() and action creator.
- Removed query registration from Segment, it's now the responsibility of
  ReduxStore.
- Removed query options. They complicate things, cache and poll will be
  implemented without using query options.
- Add clear components and force load link to runtime components test.
- Change _createCleanAction() to _createSyncCleanAction(). Also change other
  method names to signify that they're supposed to be sync.
- Created QueryDependencies, tested serial and parallel segment dependencies.
  - ReduxStore.register() also register Segment dependencies recursively.
  - ReduxStore.dispatch() process QueryDependencies.
  - Recursive QueryDependencies tested to be working.
  - Function based QueryDependencies tested to be working.
  - Recursive SegmentDependencies tested to be working.
- Render context (inServer) is passed to Page.
- Cookies now set with universal CookieJar instance, whose lifecycle is
  maintained by the framework.
- Segments can now store and access cookies universally via CookieJar.
- Made CSS modules configurable.

## 0.0.23

- Access CSS class names no longer with helper function:
  - https://github.com/webpack/style-loader/pull/77#issuecomment-148506208

## 0.0.22

- Change registerSegments() into createSegments(), a static method.
- Create ReduxStore.registerDataComponent() to allow conditional runtime
  creation of DataComponents.
- Move Segment equality check to ReduxStore().

## 0.0.21

- Client resolve functions working again.
- Append module.hot.accept() automatically on Page files.
- Separated Segment registration and query subscription at ReduxStore.
- Hot-reload Segment and ActionCreator now works.
- DataComponent now assumes immutability on props and state, overrides
  shouldComponentUpdate() by default.
- DataComponent now uses componentWillReceiveProps() to update internal state
  with segment pieces.
- DataComponent now has shouldSubscriptionsUpdate() - which determines whether
  we should unsubscribe everything and re-run subscribeQueries() again.
- Simplified RenderType to just CLIENT and SERVER.
- Removed HydrationType, CLIENT subscription now *always* load data, while
  SERVER subscription *never* loads. Server hydration is done explicitly with
  Store.hydrate().
- Added Store._setRenderType(), making ReduxStore behavior different between
  client and server.
  - At SERVER, handleChange *never* triggers callback.
  - At SERVER, subscription doesn't load automatically.

## 0.0.20

- Hot-loading done at Page level without react-hot-loader.