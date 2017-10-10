var Twitter = require('twitter');
var credentials = require('./config/auth.js');

 
var client = new Twitter({
    consumer_key: credentials.consumerKey,
    consumer_secret: credentials.consumerSecret,
    access_token_key: credentials.accessTokenKey,
    access_token_secret: credentials.accessTokenSecret
});
 
var params = {screen_name: '20Minutes'};
client.get('statuses/user_timeline', params, function(error, tweets, response) {
  if (!error) {
    console.log(tweets);
  }
});