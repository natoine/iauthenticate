
// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'sessionsecret' : process.env.sessionsecretIAUTH, //passport needs this for sessions
    'jwtsecret' : process.env.jwtsecretIAUTH ,
    'facebookAuth' : {
        'clientID'      : process.env.clientIDFB, // your App ID
        'clientSecret'  : process.env.clientSecretFB, // your App Secret
        'callbackURL'   : process.env.callbackURLFB
    },

    'twitterAuth' : {
        'consumerKey'       : process.env.consumerKeyTw,
        'consumerSecret'    : process.env.consumerSecretTw,
        'callbackURL'       : process.env.callbackURLTw
    },

    'googleAuth' : {
        'clientID'      : process.env.clientIDGG,
        'clientSecret'  : process.env.clientSecretGG,
        'callbackURL'   : process.env.callbackURLGG
    }

}