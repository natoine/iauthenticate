// load up the user model
const User            = require('../models/user')

//to send emails
const mailSender = require('../utils/mailSender')

const TIMINGTOCHANGEPWD = 3600000

const security = require('../utils/securityMiddleware')

// application/routes.js
module.exports = function(app, express) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        req.logout()
        res.render('index.ejs')// load the index.ejs file
    })

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', security.isLoggedInAndActivated, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        })
    })

}