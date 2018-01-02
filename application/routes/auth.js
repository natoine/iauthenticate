// load up the user model
const User            = require('../models/user')

const security = require('../utils/securityMiddleware')

module.exports = function(app, express, passport) {

	// get an instance of the router for clientfiles routes
	const authRoutes = express.Router()

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    authRoutes.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') })
    })

    // process the login form
    authRoutes.post('/login', passport.authenticate('local-login', {
        //successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }),
    function(req, res, next){
        console.log("next")
        if(req.body.rememberme == "yes") 
        {
            user = req.user
            //generates rememberme token
            tokenrem = user.generatesRememberMeToken()
            user.local.remembermetoken = tokenrem
            user.save(function(err) 
            {
                if (err) 
                {
                    console.log("unable to save rememberme token - error : " + err)
                    res.redirect('/profile')
                }
                else 
                {
                    //stores rememberme token in cookie with user email
                    res.clearCookie('useremail')
                    res.clearCookie('remembermetoken')
                    res.cookie("useremail", user.local.email)
                    res.cookie("remembermetoken", user.local.remembermetoken, {maxAge: 604800000})//7 days
                    res.redirect('/profile')
                }
            })
        }
        else 
        {
            res.clearCookie('useremail')
            res.clearCookie('remembermetoken')
            res.redirect('/profile')
        }
    })

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    authRoutes.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') })
    })

    // process the signup form
    authRoutes.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/signup', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }))

    // =====================================
    // ACTIVATE ACCOUNT ==============================
    // =====================================
    authRoutes.get('/activateaccount', function(req, res) {
        const token = req.query.token
        User.findOne({ 'local.activationtoken' : token }, function(err, user) 
            {
                // if there are any errors, return the error
                if (err)
                {
                    console.log(err)
                    req.flash('activateAccountDangerMessage', 'An error occured, try later')
                    res.render('activateaccount.ejs', 
                        { messagedanger: req.flash('activateAccountDangerMessage') , messageok: "" })
                }
                if(user)
                {
                    if(user.local.email.localeCompare(req.query.email)==0)
                    {
                        if(user.isActivated())
                        {
                            res.redirect('/')
                        }
                        else
                        {
                            user.local.mailvalidated = true
                            user.save(function(err) 
                            {
                                if (err) 
                                {
                                    console.log(err)
                                    //flash
                                    req.flash('activateAccountDangerMessage', 'An error occured, try later')
                                    res.render('activateaccount.ejs', 
                                        { messagedanger: req.flash('activateAccountDangerMessage') , 
                                        messageok: "" })
                                }
                                else
                                {
                                    req.flash('activateAccountOkMessage', 'Account activated !')
                                    res.render('activateaccount.ejs', 
                                        { messagedanger: "" , messageok: req.flash('activateAccountOkMessage') })
                                }
                            })
                        }    
                    }
                    else res.redirect('/')    
                }
                else res.redirect('/')
            })
    })

        // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    authRoutes.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }))

    // handle the callback after facebook has authenticated the user
    authRoutes.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }))

// =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    authRoutes.get('/auth/twitter', passport.authenticate('twitter'))

    // handle the callback after twitter has authenticated the user
    authRoutes.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }))

 // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    authRoutes.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }))

    // the callback after google has authenticated the user
    authRoutes.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }))


    // =====================================
    // LOGOUT ==============================
    // =====================================
    authRoutes.get('/logout', function(req, res) { 
        res.clearCookie('remembermetoken')
        res.clearCookie('useremail')
        req.logout()
        res.redirect('/')
    })

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // localy --------------------------------
        authRoutes.get('/connect/local', security.isLoggedInAndActivated, function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') })
        })

        authRoutes.post('/connect/local', security.isLoggedInAndActivated, passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }))

    // facebook -------------------------------

        // send to facebook to do the authentication
        authRoutes.get('/connect/facebook', security.isLoggedInAndActivated, passport.authorize('facebook', { scope : 'email' }))

        // handle the callback after facebook has authorized the user
        authRoutes.get('/connect/facebook/callback', security.isLoggedInAndActivated,
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }))

    // twitter --------------------------------

        // send to twitter to do the authentication
        authRoutes.get('/connect/twitter', security.isLoggedInAndActivated, passport.authorize('twitter', { scope : 'email' }))

        // handle the callback after twitter has authorized the user
        authRoutes.get('/connect/twitter/callback', security.isLoggedInAndActivated,
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }))

    // google ---------------------------------

        // send to google to do the authentication
        authRoutes.get('/connect/google', security.isLoggedInAndActivated, passport.authorize('google', { scope : ['profile', 'email'] }))

        // the callback after google has authorized the user
        authRoutes.get('/connect/google/callback', security.isLoggedInAndActivated,
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }))

        // =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    authRoutes.get('/unlink/local', security.isLoggedInAndActivated, function(req, res) {
        var user            = req.user
        user.local.email    = undefined
        user.local.password = undefined
        user.save(function(err) {
            res.redirect('/profile')
        })
    })

    // facebook -------------------------------
    authRoutes.get('/unlink/facebook', security.isLoggedInAndActivated, function(req, res) {
        var user            = req.user
        user.facebook.token = undefined
        user.save(function(err) {
            res.redirect('/profile')
        })
    })

    // twitter --------------------------------
    authRoutes.get('/unlink/twitter', security.isLoggedInAndActivated, function(req, res) {
        var user           = req.user
        user.twitter.token = undefined
        user.save(function(err) {
           res.redirect('/profile')
        })
    })

    // google ---------------------------------
    authRoutes.get('/unlink/google', security.isLoggedInAndActivated, function(req, res) {
        var user          = req.user
        user.google.token = undefined
        user.save(function(err) {
           res.redirect('/profile')
        })
    })

	// apply the routes to our application
	app.use('/', authRoutes)

}