module.exports = {

    // route middleware to make sure a user is logged in
    isLoggedIn: function(req, res, next) {

        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next()

        // if they aren't redirect them to the home page
        res.redirect('/')
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
