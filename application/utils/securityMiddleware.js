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
        //console.log("req.cookies.useremail" + req.cookies.useremail)
        // if user has cookies
        if(req.cookies.useremail && req.cookies.remembermetoken)
        {
            console.log("ok rememberme")
            User.findOne({'local.email' : req.cookies.useremail, 'local.remembermetoken' : req.cookies.remembermetoken}, function(err, user){
                if(user) 
                {
                    req.session.passport = {}
                    req.session.passport.user = user._id
                    console.log("rememberme isauthenticated ? " + req.isAuthenticated())
                    res.clearCookie('remembermetoken')
                    res.clearCookie('useremail')
                    tokenrem = user.generatesRememberMeToken()
                    user.local.remembermetoken = tokenrem
                    user.save(function(err){
                        if(err) 
                        {
                            console.log("unable to save rememberme token - error : " + err)
                            return next(req, res)
                        }
                        else
                        {
                            res.cookie("useremail", user.local.email)
                            res.cookie("remembermetoken", user.local.remembermetoken, {maxAge: 604800000})//7 days
                            return next(req, res)
                        }
                    })
                    //return next(req, res)
                }
                else return next(req, res)
            })
        }
        else return next(req, res)
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
