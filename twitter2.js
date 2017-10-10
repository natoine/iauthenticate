var Twitter = require('twitter');
var credentials = require('./config/auth.js');

 
var client = new Twitter({
    consumer_key: credentials.twitterAuth.consumerKey,
    consumer_secret: credentials.twitterAuth.consumerSecret,
    access_token_key: credentials.twitterAuth.accessTokenKey,
    access_token_secret: credentials.twitterAuth.accessTokenSecret
});
 
var params = {screen_name: '20Minutes'};
client.get('statuses/user_timeline', params, function(error, tweets, response) {
  if (!error) {
    console.log(tweets);
  }
});