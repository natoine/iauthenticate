// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'sessionsecret' : 'natoineiauthenticatesessionpassport', //passport needs this for sessions
    'facebookAuth' : {
        'clientID'      : '', // your App ID
        'clientSecret'  : '', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : '',
        'consumerSecret'    : '',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '',
        'clientSecret'  : '',
        'callbackURL'   : 'http://127.0.0.1:8080/auth/google/callback'
    },
	'APIAI_TOKEN' : '3', // your Client access token from dialogflow (Api.ai)
	
	'API_OPENWEATHER' : {
        'consumerKey'       : '572a91d106726c152b30397f8298898f',
    },
	
	//'API_OPENWEATHER':'572a91d106726c152b30397f8298898f'

}