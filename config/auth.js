
// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '291006944737467', // your App ID
        'clientSecret'  : '7619464f8210722726597fe6b1c4bd5a', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'hEfSMSVRwwkrzCb314iJZSkfq',
        'consumerSecret'    : 'aOWRku9U3cTFtSMM5ic4drko99Q5LPhJNdMp39TlnnRVYlFFbb',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '576264998393-uo7vc1trm7moj4v8msl9sspuhm9tjqpb.apps.googleusercontent.com',
        'clientSecret'  : 'VbGvnUn9PJ5TgPdMIJWc3i_w',
        'callbackURL'   : 'http://127.0.0.1:8080/auth/google/callback'
    }

}