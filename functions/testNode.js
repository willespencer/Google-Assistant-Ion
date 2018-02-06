var http = require("http");
var port = 3000;
var serverUrl = "localhost";
var simpleoauth2 = require("simple-oauth2");
const express = require('express');
const app = express();

// PORT SETUP
app.set('port', process.env.PORT || 8080 );

// SO THAT EXPRESS KNOWS IT IS SITTING BEHIND A PROXY
app.set('trust proxy', 1) // trust first proxy

var server = http.createServer(function(req, res) {
  console.log("Request: " + req.url);


  // make sure these variables are set
  var ion_client_id = 'T5vMCDrT0yWrL3x521dqsfWwRa12wP9nWPUF8JG8';
  var ion_client_secret = 'fuwhzESBwTPTumtXZinWQZ4AwCJoZjq6uoboASv2DFQwFtkZTJwLoHBNKLmuA2qLcf7uTH2m5eHE33R2ZrghzJz5mdXTr3qIg1QX7sKMpFmf991WKWSxitXHa6mT1HJZ';
  var ion_redirect_uri = 'https://oauth-redirect.googleusercontent.com/r/research-project-fadba';

  var oauth = simpleoauth2.create({
      client: {
          id: ion_client_id,
          secret: ion_client_secret
      },
      auth: {
          tokenHost: 'https://ion.tjhsst.edu/oauth'
      }
  });

  // 1) redirect the user to login_url to begin authentication
  var login_url = oauth.authorizationCode.authorizeURL({
      scope: "read", // remove scope: read if you also want write access
      redirect_uri: ion_redirect_uri
  });

  var refresh_token;
  var access_token;
  var expires_in;

  const request = require('request'); //added
  // 2) on the ion_redirect_uri endpoint, add the following code to process the authentication
  app.get('/login', (req, res) => {
    var code = req.query["code"]; // GET parameter
    oauth.authorizationCode.getToken({code: code, redirect_uri: ion_redirect_uri}, (error, result) => {
      const token = oauth.accessToken.create(result);

      // you will want to save these variables in your session if you want to make API requests
      //refresh_token = token.token.refresh_token;
      //access_token = token.token.access_token;
      //console.log(access_token);
    //  expires_in = token.token.expires_in;

      // log the user in
    });
  });

  // 3) when making an API request, add access_token as a POST parameter
  app.get('/', function (req, res, next) {
      // Update or initialize number of visits tracked by cookie
      req.session.views = (req.session.views || 0) + 1;

      if (typeof req.session.token != 'undefined') {
          // IF THE USER HAS NOT LOGGED IN!
          var access_token = req.session.token.token.access_token;
          console.log(access_token);

          // ASK ION FOR THE USER NAME
          request.get({url:'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token}, function (e, r, body) {
              console.log('AS STRING:' + body);

              var res_object = JSON.parse(body);
              console.log('AS OBJECT:' + res_object);

              // get the user name
              user_name = res_object['short_name'];
              console.log(user_name);
              render_page(req, res, user_name);
          })

      } else {
          // NOT LOGGED IN YET
          user_name = 'NEW USER';
          render_page(req, res, user_name);
      }

  });

  // var headers = {
  //     'User-Agent':       'Super Agent/0.0.1',
  //     'Content-Type':     'application/x-www-form-urlencoded'
  // }
  //
  // // Configure the request
  // var options = {
  //     url: 'https://ion.tjhsst.edu/api/blocks/',
  //     //host: 'ion.tjhsst.edu',
  //     //path:'/api/blocks',
  //     method: 'POST',
  //     headers: headers,
  //     form: {'access_token': access_token}
  // }
  //
  // // Start the request
  // request(options, function (error, response, body) {
  //     if (!error && response.statusCode == 200) {
  //         // Print out the response body
  //         console.log(body)
  //     }
  //     else{
  //         console.log("ERROR", error);
  //     }
  // })


  // 4) to refresh the access_token, use the following code
  var token = oauth.accessToken.create({
      "access_token": access_token,
      "refresh_token": refresh_token,
      "expires_in": expires_in
  });

  if (token.expired()) {
      token.refresh((err, result) => {
          token = result;
          // the new access token
          var access_token = token.token.access_token;
      });
  }

});

console.log("Listening at " + serverUrl + ":" + port);
server.listen(port, serverUrl);
