// load up the user model
const User            = require('../models/user')

//to send emails
const mailSender = require('../utils/mailSender')

const TIMINGTOCHANGEPWD = 3600000

const security = require('../utils/securityMiddleware')

const Humeur = require('../models/humeur')

// application/routes.js
module.exports = function(app, express) {

    // get an instance of the router for clientfiles routes
    const mainRoutes = express.Router()

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    mainRoutes.get('/', function(req, res) {
        req.logout() 

        //gather moods
        Humeur.find({}, function(err,docs){
            console.log("Liste d'humeurs " + docs)
            var moodsTmp = JSON.stringify(docs)

            res.render('index.ejs', { humeurs: moodsTmp })// load the index.ejs file
        })
        //res.render('index.ejs')// load the index.ejs file
    })

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    mainRoutes.get('/profile', security.isLoggedInAndActivated, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        })
    })

    // apply the routes to our application
    app.use('/', mainRoutes)

}