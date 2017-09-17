// load up the user model
const User            = require('../application/models/user')

//to send emails
const smtpTransport = require('../config/mailer')

const TIMINGTOCHANGEPWD = 3600000

// application/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        req.logout()
        res.render('index.ejs')// load the index.ejs file
    })

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') })
    })

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }))

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') })
    })

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/signup', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }))

    // =====================================
    // PWD RECOVERY ==============================
    // =====================================
    // show the pwd recovery form
    app.get('/pwdrecovery', function(req, res) {
        const token = req.query.token
        if(!token)
        {
            res.render('pwdrecovery.ejs', 
                { messagedanger: req.flash('pwdrecoveryMessage') , 
                messageok: req.flash('pwdrecoveryokMessage') })
        }
        else
        {
            User.findOne({ 'local.pwdrecotoken' :  token }, function(err, user) 
            {
                // if there are any errors, return the error
                if (err)
                {
                    console.log(err)
                    req.flash('pwdrecoveryMessage', 'An error occured, try later')
                    res.render('pwdrecovery.ejs' , 
                        { messagedanger: req.flash('pwdrecoveryMessage') , messageok: ""})
                }
                if (user) 
                {
                    const now = new Date().getTime()
                    if( now - user.local.timepwdreco > TIMINGTOCHANGEPWD ) 
                    {
                        req.flash('pwdrecoveryMessage', 
                            'too late ! more than one hour since you asked to change pwd')
                        res.render('pwdrecovery.ejs' , 
                            { messagedanger: req.flash('pwdrecoveryMessage') , messageok: "" })
                    }
                    else
                    {
                        res.render('pwdrecoverylink.ejs' , 
                            { message: req.flash('pwdrecoverylinkMessage'), 
                                email: user.local.email, token: token })
                    }
                }
                else
                {
                    res.redirect('/')
                }
            })
        }
    })

    //process the pwd recovery form
    app.post('/pwdrecovery' , function(req, res) {

        const email = req.body.email
        //check to see if email is correctly spelled
        const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        if(!email.match(mailformat)) {
            req.flash('pwdrecoveryMessage', 'That email is not correctly spelled')
            res.render('pwdrecovery.ejs', { messagedanger: req.flash('pwdrecoveryMessage') , messageok: ""})
        }
        else 
        {
            User.findOne({ 'local.email' :  email }, function(err, user) 
            {
                // if there are any errors, return the error
                if (err)
                {
                    console.log(err)
                    req.flash('pwdrecoveryMessage', 'An error occured, try later')
                    res.render('pwdrecovery.ejs', 
                        { messagedanger: req.flash('pwdrecoveryMessage') , messageok: "" })
                }
                // check to see if theres already a user with that email
                if (user) 
                {
                    const now = new Date().getTime()
                    user.local.timepwdreco = now
                    user.local.pwdrecotoken = user.generatePwdRecoToken(email , now)
                    user.save(function(err) 
                    {
                        if (err)
                        {
                            console.log(err)
                            //flash
                            req.flash('pwdrecoveryMessage', 'An error occured, try later')
                            req.flash('pwdrecoveryokMessage', '')
                            res.render('pwdrecovery.ejs', 
                                { messageok: req.flash('pwdrecoveryokMessage') , 
                                messagedanger: req.flash('pwdrecoveryMessage') })
                        }
                        else
                        {
                            //sends an email to recover password
                            const mailOptions =
                            {
                                to : email,
                                subject : "iauthenticate pwd recovery ok",
                                text : "you seem to have lost your pwd. "
                                 + "Click on the following link to change your password : " 
                                 + "http://localhost:8080/pwdrecovery?token=" + user.local.pwdrecotoken
                            }
                            smtpTransport.sendMail(mailOptions, function(error, response){
                                if(error)
                                {
                                    console.log(error)
                                    //flash
                                    req.flash('pwdrecoveryMessage', 'An error occured, try later')
                                    req.flash('pwdrecoveryokMessage', '')
                                    res.render('pwdrecovery.ejs', 
                                        { messageok: req.flash('pwdrecoveryokMessage') , 
                                        messagedanger: req.flash('pwdrecoveryMessage') })
                                }
                            })

                            //flash
                            req.flash('pwdrecoveryokMessage', 'An email has been sent')
                            req.flash('pwdrecoveryMessage', '')
                            res.render('pwdrecovery.ejs', 
                                { messageok: req.flash('pwdrecoveryokMessage') , 
                                messagedanger: req.flash('pwdrecoveryMessage') })
                        }
                    })      
                } 
                else {
                    //sends an email to prevent a missuse of email
                    const mailOptions =
                    {
                        to : email,
                        subject : "iauthenticate pwd recovery notok",
                        text : "someone thinks you use our service"
                    }
                    smtpTransport.sendMail(mailOptions, function(error, response){
                        if(error)
                        {
                            console.log(error)
                        }
                    })
                    //flash
                    req.flash('pwdrecoveryokMessage', 'An email has been sent')
                    res.render('pwdrecovery.ejs', 
                        { messageok: req.flash('pwdrecoveryokMessage') , 
                        messagedanger: "" })
                }

            })
        }
    })
   
    //process the pwd recovery form
    app.post('/pwdchangerecovery' , function(req, res) {
        User.findOne({ 'local.email' :  req.body.email }, function(err, user) 
            {
                // if there are any errors, return the error
                if (err)
                {
                    console.log(err)
                    req.flash('pwdrecoveryMessage', 'An error occured, try later')
                    res.render('pwdrecovery.ejs', 
                        { messagedanger: req.flash('pwdrecoveryMessage') , messageok: "" })
                }
                if (user) 
                {
                    const now = new Date().getTime()
                    if( user.local.pwdrecotoken.localeCompare(req.body.token)!=0 || 
                        now - user.local.timepwdreco > TIMINGTOCHANGEPWD )
                    {
                        req.flash('pwdrecoveryMessage', 
                            'You have taken too long time or are not authorized to change. Try again.')
                        req.flash('pwdrecoveryokMessage', '')
                        res.render('pwdrecovery.ejs', { messageok: req.flash('pwdrecoveryokMessage') ,
                         messagedanger: req.flash('pwdrecoveryMessage') })
                    }
                    else
                    {
                        user.local.password = user.generateHash(req.body.password)
                        user.local.pwdrecotoken = ""
                        user.local.timepwdreco = ""
                        user.local.mailvalidated = true //validate account in the same time. Afterall, if a guy recovers pwd but is not activated, we have verified its email in the same time.
                        user.save(function(err) {
                            if (err)
                            {
                                console.log(err)
                                //flash
                                req.flash('pwdrecoveryMessage', 'An error occured, try later')
                                req.flash('pwdrecoveryokMessage', '')
                                res.render('pwdrecovery.ejs', { messageok: req.flash('pwdrecoveryokMessage') , 
                                    messagedanger: req.flash('pwdrecoveryMessage') })
                            }
                            else
                            {
                                req.flash('loginMessage', 'pwd changed. Try to login.')
                                res.render('login.ejs', { message: req.flash('loginMessage') })
                            }
                        })
                    }
                }
            })
    })

   // =====================================
    // CHANGE PWD ==============================
    // =====================================


    app.get('/changepwd', isLoggedInAndActivated, function(req, res) {
        res.render('changepwd.ejs', {email: req.user.local.email, message: req.flash('changepwdMessage')})
    })

    app.post('/changepwd', isLoggedInAndActivated, function(req, res){
        const user = req.user
        if(!user.validPassword(req.body.currentpassword))
        {
            req.flash('changepwdMessage', 'not the right password')
            res.render('changepwd.ejs', {email: user.local.email, message: req.flash('changepwdMessage')})
        }
        else
        {
            user.local.password = user.generateHash(req.body.newpassword)
            user.save(function(err) 
            {
                if (err) 
                {
                    console.log(err)
                    //flash
                    req.flash('changepwdMessage', 'An error occured, try later')
                    res.render('changepwd.ejs', {email: user.local.email, message: req.flash('changepwdMessage')})
                }
                else
                {
                    req.flash('loginMessage', 'pwd changed. Try to login.')
                    res.render('login.ejs', { message: req.flash('loginMessage') })
                }
            })
        }
    })

    // =====================================
    // ACTIVATE ACCOUNT ==============================
    // =====================================
    app.get('/activateaccount', function(req, res) {
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
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedInAndActivated, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        })
    })

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }))

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }))

// =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'))

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
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
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }))

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }))


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) { 
        req.logout()
        res.redirect('/')
    })

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', isLoggedInAndActivated, function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') })
        })
        app.post('/connect/local', isLoggedInAndActivated, passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }))

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', isLoggedInAndActivated, passport.authorize('facebook', { scope : 'email' }))

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback', isLoggedInAndActivated,
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }))

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', isLoggedInAndActivated, passport.authorize('twitter', { scope : 'email' }))

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback', isLoggedInAndActivated,
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }))

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', isLoggedInAndActivated, passport.authorize('google', { scope : ['profile', 'email'] }))

        // the callback after google has authorized the user
        app.get('/connect/google/callback', isLoggedInAndActivated,
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
    app.get('/unlink/local', isLoggedInAndActivated, function(req, res) {
        var user            = req.user
        user.local.email    = undefined
        user.local.password = undefined
        user.save(function(err) {
            res.redirect('/profile')
        })
    })

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedInAndActivated, function(req, res) {
        var user            = req.user
        user.facebook.token = undefined
        user.save(function(err) {
            res.redirect('/profile')
        })
    })

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedInAndActivated, function(req, res) {
        var user           = req.user
        user.twitter.token = undefined
        user.save(function(err) {
           res.redirect('/profile')
        })
    })

    // google ---------------------------------
    app.get('/unlink/google', isLoggedInAndActivated, function(req, res) {
        var user          = req.user
        user.google.token = undefined
        user.save(function(err) {
           res.redirect('/profile')
        })
    })


}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next()

    // if they aren't redirect them to the home page
    res.redirect('/')
}

function isLoggedInAndActivated(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated() && req.user.isActivated())
    {
        if(req.user.local.email || req.user.facebook.token || req.user.twitter.token || req.user.google.token)
        return next()
    }

    // if they aren't redirect them to the home page
    res.redirect('/')
}