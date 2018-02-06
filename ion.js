'use strict';

let ApiAiApp = require('actions-on-google').ApiAiApp;
exports.echoNumber = (req, res) => {
  const app = new ApiAiApp({request: req, response: res});

  // Create functions to handle requests here
  const WELCOME_INTENT = 'input.welcome';  // the action name from the API.AI intent
  //const NUMBER_INTENT = 'input.number';  // the action name from the API.AI intent
  //const NUMBER_ARGUMENT = 'input.mynum'; // the action name from the API.AI intent
  const TEST_INTENT = 'input.test';

  function welcomeIntent (app) {
    app.ask('Welcome to number echo! Say a number.');
  }

  // function numberIntent (app) {
  //   let number = app.getArgument(NUMBER_ARGUMENT);
  //   app.tell('You said ' + number);
  // }

  function testIntent(app)
  {
    app.tell('5 + 5 = 10');
  }
}

let actionMap = new Map();
actionMap.set(WELCOME_INTENT, welcomeIntent);
actionMap.set(TEST_INTENT, testIntent);
app.handleRequest(actionMap);
