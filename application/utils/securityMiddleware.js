const User            = require('../models/user')

module.exports = {

    // route middleware to make sure a user is logged in
    isLoggedIn: function(req, res, next) {

        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next()

        // if they aren't redirect them to the home page
        res.redirect('/')
    },

    rememberme: function(req, res, next) {
        // if user has cookies
        if(req.cookies.useremail && req.cookies.remembermetoken)
        {
            User.findOne({'local.email' : req.cookies.useremail, 'local.remembermetoken' : req.cookies.remembermetoken}, function(err, user){
                res.clearCookie('remembermetoken')
                res.clearCookie('useremail')    
                if(user) 
                {
                    req.login(user, function(err)
                    {
                        if(err) return next()
                        else 
                        {
                            tokenrem = user.generatesRememberMeToken()
                            user.local.remembermetoken = tokenrem
                            user.save(function(err){
                                if(err) 
                                {
                                    console.log("unable to save rememberme token - error : " + err)
                                    return next()
                                }
                                else
                                {
                                    res.cookie("useremail", user.local.email)
                                    res.cookie("remembermetoken", user.local.remembermetoken, {maxAge: 604800000})//7 days
                                    return next()
                                }
                            })
                        }
                    })
                }
                else return next()
            })
        }
        else return next()
    },

    isLoggedInAndActivated: function(req, res, next) {
        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated() && req.user.isActivated())
        {
            if(req.user.local.email || req.user.facebook.token || req.user.twitter.token || req.user.google.token)
            return next()
        }

        // if they aren't redirect them to the home page
        res.redirect('/')
    }

}
