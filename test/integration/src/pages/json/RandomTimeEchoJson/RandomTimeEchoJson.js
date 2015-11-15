import Page from 'soya/lib/page/Page';
import RenderResult from 'soya/lib/page/RenderResult';
import JsonRenderer from 'soya/lib/page/json/JsonRenderer.js';
import register from 'soya/lib/client/Register';

class RandomTimeEchoJson extends Page {
  static get pageName() {
    return 'RandomTimeEchoJson';
  }

  render(httpRequest, routeArgs, store, callback) {
    // Return the value provided by request.
    var value = routeArgs.value;
    var jsonRenderer = new JsonRenderer(value);
    var renderResult = new RenderResult(jsonRenderer);

    // Randomly decide when to return a response.
    setTimeout(callback.bind({}, renderResult), this.getRandomInt(10, 1000));
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

register(RandomTimeEchoJson);
export default RandomTimeEchoJson;