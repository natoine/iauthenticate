// load up the user model
const User            = require('../models/user')

//to send emails
const mailSender = require('../utils/mailSender')

const TIMINGTOCHANGEPWD = 3600000

const security = require('../utils/securityMiddleware')

// application/routes.js
module.exports = function(app, express) {

    // get an instance of the router for clientfiles routes
    const mainRoutes = express.Router()

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    mainRoutes.get('/', security.rememberme, function(req, res) {
            //console.log("get / passport.user: " + req.session.passport.user)
            console.log("isAuthenticated ? " + req.isAuthenticated())
            if(req.isAuthenticated() && req.user.isActivated()) 
            {
                res.redirect('/profile')
            }
            else res.render('index.ejs')// load the index.ejs file
    })

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    mainRoutes.get('/profile', security.rememberme, security.isLoggedInAndActivated, function(req, res) {
        console.log("render /profile")
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        })
    })

    // apply the routes to our application
    app.use('/', mainRoutes)

}