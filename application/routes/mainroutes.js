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
    mainRoutes.get('/', function(req, res) {
        if(req.isAuthenticated() && req.user.isActivated()) 
        {
            console.log('already auth - redirect to profile')
            res.redirect('/profile')
        }
        else if(req.cookies.remembermetoken)
        {
            console.log("cookies ! remember me")
            useremail = req.cookies.useremail
            token = req.cookies.remembermetoken
            //find user
            User.findOne({"local.email" : useremail, "local.remembermetoken" : token}, function(err, user) {
                if(err)
                {
                    res.clearCookie('remembermetoken')
                    res.clearCookie('useremail')
                    res.render('index.ejs')
                }
                else
                {
                    if(user)
                    {
                        console.log("cookies ! ok dont need to log in")
                        //consumes token remember me and creates a new one
                        tokenrem = user.generatesRememberMeToken()
                        user.local.remembermetoken = tokenrem
                        user.save(function(err) 
                        {
                            if(err) 
                            {
                                console.log("unable to save rememberme token - error : " + err)
                                res.clearCookie('remembermetoken')
                                res.clearCookie('useremail')
                                res.render('index.ejs')
                            }
                            else 
                            {
                                //stores rememberme token in cookie with user email
                                res.clearCookie('useremail')
                                res.clearCookie('remembermetoken')
                                res.cookie("useremail", user.local.email)
                                res.cookie("remembermetoken", user.local.remembermetoken, {maxAge: 604800000})//7 days
                                req.session.passport.user = user
                                console.log("req.user.local.email : " + req.user.local.email)
                                res.redirect('/profile')
                            }
                        })
                    }
                    else
                    {
                        res.clearCookie('remembermetoken')
                        res.clearCookie('useremail')
                        res.render('index.ejs')
                    }
                }
            })
        }
        else res.render('index.ejs')// load the index.ejs file
    })

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    mainRoutes.get('/profile', security.isLoggedInAndActivated, function(req, res) {
        console.log("profile cookies : " + req.cookies.useremail + " " + req.cookies.remembermetoken)
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        })
    })

    // apply the routes to our application
    app.use('/', mainRoutes)

}