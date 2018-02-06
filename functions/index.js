
'use strict';

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const simpleoauth2 = require('simple-oauth2');
const request = require('request');
const fs = require('fs');
admin.initializeApp(functions.config().firebase);

let DialogflowApp = require('actions-on-google').DialogflowApp;

const WELCOME_INTENT = 'input.welcome';  // the action name from the API.AI intent
const TEST_INTENT = 'input.test';
const GOING_INTENT = 'input.going';
const SCHEDULE_INTENT = 'input.schedule';
const PICTURE_INTENT = 'input.picture';
const FIND_INTENT = 'input.find';
const FIND2_INTENT = 'input.find2';

// Create functions to handle requests here
function welcomeIntent (app) {
  const access_token = app.getUser().accessToken;
  var name;

  var my_ion_request = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
  request.get( {url:my_ion_request}, function (e, r, body) {
    const lastSeen = app.getLastSeen();
    console.log(lastSeen);
    var res_object = JSON.parse(body);
    var nick =  res_object.nickname;
    if(nick.length > 0)
      name = nick;
    else
      name = res_object.first_name;

    if(app.getLastSeen()) //user has used app before
      app.ask('Hey ' + name + '! What can I do for you today? I can help you sign up for eighth periods and view other TJ Ion information. Just ask me a question.');
    else
      app.ask('Nice to meet you ' + name + '! I can help you sign up for eighth periods and view other TJ Ion information. Just ask me a question.');
  });


}

function findIntent(app){

  var obj = new Object();
  //var jsonString= JSON.stringify(obj);

  // Get content from file
  var contents = fs.readFileSync("classification.json");
  // Define to JSON type
  var json = JSON.parse(contents);

  var categories = [] //list of all categories (to avoid hardcoding)

  for (var key in json) { //loops through all eighth period ids
    if (json.hasOwnProperty(key)) { //makes sure it is an actual key
      var prop = json[key];

      if(!obj.hasOwnProperty(prop)) //checks if created object does not have this classification
      {
        var array = [key];//creates new array
        obj[prop] = array;
        categories.push(prop);
      }
      else
      {
        obj[prop].push(key); //adds number to prop array
      }
    }
  }

  console.log(obj);

  var categoryString = "";
  for(var x = 0; x < categories.length - 1; x++)
  {
    categoryString += categories[x] + ", ";
  }
  categoryString += categories[categories.length - 1];


  app.ask(app.buildRichResponse()
    .addSimpleResponse({speech: 'What Category of 8th period would you like? ' + categoryString,
      displayText: 'What Category of 8th period would you like'})
    .addSuggestions(categories) //suggestions at bottom of categories
    .addSuggestionLink('Suggestion Link', 'https://assistant.google.com/')
  );
}

function find2Intent(app)
{
  req.body.result.parameters['date'];
}

function pictureIntent(app)
{
  const access_token = app.getUser().accessToken;

  var my_ion_request = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
  request.get( {url:my_ion_request}, function (e, r, body) {
    var res_object = JSON.parse(body);
    var picUrl = res_object.picture;
    console.log(picUrl);

    app.ask(app.buildRichResponse()// Create a basic card and add it to the rich response
    .addSimpleResponse('Here you go.')
      .addBasicCard(app.buildBasicCard("This is you!")
        .setImage(picUrl, "Picture of the user")
      )
    );
  });
}

function goingIntent(app){
  const access_token = app.getUser().accessToken;

  var my_ion_request = 'https://ion.tjhsst.edu/api/signups/user?format=json&access_token='+access_token;

  request.get( {url:my_ion_request}, function (e, r, body) {
    var date = new Date();
    var year = Number(date.getFullYear().toString());
    var month = Number((date.getMonth() + 1).toString()); //returns 0-11
    var day = Number(date.getDate().toString());

    var res_object = JSON.parse(body);
    var index = 0;
    var block;
    var blockDate;
    while(true) //loop to determine upcoming block date
    {
      block = res_object[index];
      blockDate = block.block.date;
      var blockYear = Number(blockDate.slice(0, 4));
      var blockMonth =  Number(blockDate.slice(5, 7));
      var blockDay = Number(blockDate.slice(8, 10));
      if(blockYear > year)
        break; //new year
      else if(blockYear == year && blockMonth > month)
        break; //new month
      else if(blockYear == year && blockMonth == month && blockDay >= day)
        break; //same or higher day
      else
        index +=1; //continues searching
    }
    var output = "You are currently signed up for " + block.activity.title;

    index += 1;
    block = res_object[index];
    while(block.block.date == blockDate) // loops through all other blocks on same date
    {
      output += " and " + block.activity.title;
      index += 1;
      block = res_object[index];
    }
    output += ".";

    app.tell(output);
  });

}

function scheduleIntent(app)
{
  var my_ion_request = 'https://ion.tjhsst.edu/api/schedule?format=json'; //no access token for schedule

  request.get( {url:my_ion_request}, function (e, r, body) {
    var res_object = JSON.parse(body);
    var day = res_object.results[0].day_type;
    var output = "<speak>" + "Today is a " + day.name + "<break strength='medium'/>\n";
    if(day.blocks.length > 0)
    {
      output += "Today's schedule is... <break strength='weak'/>\n"
      for(var x = 0; x < day.blocks.length; x++)
      {
        var start = day.blocks[x].start;
        if(Number(start.substr(0, start.indexOf(':'))) > 12) //changes from 24 hour time to 12 hour time
          start = (Number(start.substr(0, start.indexOf(':'))) - 12) + start.substr(start.indexOf(':'));
        var end = day.blocks[x].end;
        if(Number(end.substr(0, end.indexOf(':'))) > 12) //changes from 24 hour time to 12 hour time
          end = (Number(end.substr(0, end.indexOf(':'))) - 12) + end.substr(end.indexOf(':'));
        output += day.blocks[x].name + ", " + start + "-" + end + " <break strength='weak'/>\n";
      }
    }
    output += "</speak>";
    app.tell(output);
  });
}

function testIntent(app)
{
  const access_token = app.getUser().accessToken;

  var my_ion_request = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
  request.get( {url:my_ion_request}, function (e, r, body) {
    console.log(e);
    console.log(body);
    app.tell(body);
      // var res_object = JSON.parse(body);
      //
      // // from this javascript object, extract the user's name
      // user_name = res_object['short_name'];
      //
      // app.ask(user_name);

  });
}


const actionMap = new Map();
actionMap.set(WELCOME_INTENT, welcomeIntent);
actionMap.set(TEST_INTENT, testIntent);
actionMap.set(GOING_INTENT, goingIntent);
actionMap.set(SCHEDULE_INTENT, scheduleIntent);
actionMap.set(PICTURE_INTENT, pictureIntent);
actionMap.set(FIND_INTENT, findIntent);
actionMap.set(FIND2_INTENT, find2Intent);


const factsAboutGoogle = functions.https.onRequest((request, response) => {
  const app = new DialogflowApp({ request, response });
  console.log(`Request headers: ${JSON.stringify(request.headers)}`);
  console.log(`Request body: ${JSON.stringify(request.body)}`);


  app.handleRequest(actionMap);
});

module.exports = {
  factsAboutGoogle
};
