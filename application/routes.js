// load up the user model
const User = require('../application/models/user')
const mongoose = require('mongoose')
const Humeur = require('../application/models/humeur')
const TweetDb = require('../application/models/tweets')
const Tchat = require('../application/models/tchat')
var Twitter = require('twitter');
var weather = require('openweather-apis');
var credentials = require('../config/auth.js');

const configDB = require('../config/database.js')
const db = mongoose.createConnection(configDB.url)

const http = require('http')
const csv = require('csv-express');

const js2xmlparser = require("js2xmlparser");

// file system to write in file
const fs = require("fs")

// Get a reply from API.ai
const apiai = require('apiai')(credentials.APIAI_TOKEN);

// openweather
const apiow = require('openweather-apis');
apiow.setAPPID(credentials.API_OPENWEATHER);

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
        successRedirect : '/humeur', // redirect to the secure profile section
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
                                html : "you seem to have lost your pwd. "
                                 + "Click on the following link to change your password : " 
                                 + "<a href=\"http://localhost:8080/pwdrecovery?token=" + user.local.pwdrecotoken
                                 + "\">Password change</a>"
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
            successRedirect : '/humeur',
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
            successRedirect : '/humeur',
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
                    successRedirect : '/humeur',
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
            successRedirect : '/humeur', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }))

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', isLoggedInAndActivated, passport.authorize('facebook', { scope : 'email' }))

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback', isLoggedInAndActivated,
            passport.authorize('facebook', {
                successRedirect : '/humeur',
                failureRedirect : '/'
            }))

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', isLoggedInAndActivated, passport.authorize('twitter', { scope : 'email' }))

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback', isLoggedInAndActivated,
            passport.authorize('twitter', {
                successRedirect : '/humeur',
                failureRedirect : '/'
            }))

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', isLoggedInAndActivated, passport.authorize('google', { scope : ['profile', 'email'] }))

        // the callback after google has authorized the user
        app.get('/connect/google/callback', isLoggedInAndActivated,
            passport.authorize('google', {
                successRedirect : '/humeur',
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
    
    // Récupérer l'humer ----------------------
    app.get('/humeur', isLoggedInAndActivated, function(req, res) {
            var user = req.user
            var humeur = new Humeur();
            var list;
            var list_humeurs = require("../ressources/humeurs.json")
            var key = credentials.API_OPENWEATHER.consumerKey
            console.log(list_humeurs.humeurs[1])
            Humeur.find({'user' : req.user},
            function(err, docs){
                user.moods = docs;
                 res.render('humeur.ejs',{
            moods : user.moods, list : list_humeurs, key : key
        })
                
    
    });
        
            
           
      
    })
    
    app.post('/humeur', isLoggedInAndActivated, function(req, res) {

        var newmood = new Humeur()
        newmood.emotion = req.body.mood
        newmood.user = req.user
        newmood.date = new Date().getTime()
        newmood.lat = req.body.lat
        newmood.meteo = req.body.meteo
        newmood.temp = req.body.temp
        newmood.vent = req.body.vent
        newmood.city = req.body.city
        newmood.save(function(err) {
           res.redirect('/humeur')
        })
           
    })
	
	//Récupération des tweets
    app.get('/humeur/tweets', isLoggedInTwitterAndActivated, function(req, res) {
		var client = new Twitter({
			consumer_key: credentials.twitterAuth.consumerKey,
			consumer_secret: credentials.twitterAuth.consumerSecret,
			access_token_key: credentials.twitterAuth.accessTokenKey,
			access_token_secret: credentials.twitterAuth.accessTokenSecret
		});
		var params = {screen_name: req.user.twitter.username};
		//var params = {screen_name: '20Minutes'};
		client.get('statuses/user_timeline', params, function(error, tweets, response) {
			if (!error) {
				tweets.forEach(function(tweet) {
					newtweet = new TweetDb()
					newtweet.tweet = tweet.text 
					newtweet.user = tweet.user.screen_name
					newtweet.date = tweet.created_at
					newtweet.save
				})
				//tweets.map(tweet => {console.log(tweet.created_at),console.log(tweet.user.screen_name),console.log(tweet.text)})
				//console.log(params.screen_name)
				res.render('tweets.ejs' , {tweets: tweets, twitter_user: params.screen_name})
				
			}
			else {
				console.log("problème lors de la récupération des tweets, vérifiez le statut de confidentialité du profil")
				res.redirect('/')
			}
		});  
    })
	
	app.post('/humeur/tweets', isLoggedInTwitterAndActivated, function(req, res) {
        var client = new Twitter({
			consumer_key: credentials.twitterAuth.consumerKey,
			consumer_secret: credentials.twitterAuth.consumerSecret,
			access_token_key: credentials.twitterAuth.accessTokenKey,
			access_token_secret: credentials.twitterAuth.accessTokenSecret
		});
		//var params = {screen_name: req.user.twitter.username};
		var params = {screen_name: req.body.newtweets};
		client.get('statuses/user_timeline', params, function(error, tweets, response) {
			if (!error) {
				//tweets.map(tweet => {console.log(tweet.created_at),console.log(tweet.user.screen_name),console.log(tweet.text)})
				//console.log(params.screen_name)
				res.render('tweets.ejs' , {tweets: tweets, twitter_user: params.screen_name})
			}
			else {
				console.log("problème pour la récupération des tweets, vérifiez le statut de confidentialité du profil")
				res.redirect('/')
			}
		}); 
    })



// Récupérer toutes les humeurs--
    app.get('/listhumeur', isLoggedInAndActivated, function(req, res) {
		var user = req.user
		var humeur = new Humeur();
		var list;
		var list_humeurs = require("../ressources/humeurs.json")
		console.log(list_humeurs.humeurs[1])
		Humeur.find({}, function(err, docs){
			user.moods = docs;

			res.render('listhumeur.ejs',{
				moods : user.moods ,list : list_humeurs
			})
		});
    })

    // ================================================
    // Récupérer toutes les humeurs en JSON ===========
    // ================================================

    app.get('/moodsJSON', isLoggedInAndActivated, function(req, res) {
        Humeur.find({}, function(err, docs){
            var userMoods = docs

            var modsJson = JSON.stringify(userMoods, null, '\t')
            var myFile = process.cwd()+"/tmp/moods.json"

            fs.writeFile(myFile, modsJson, function (err) {
                if (err) {
                    return console.log('error writing file: ' + err);
                } else {
                    console.log('file written, just check it');
                }
            });

            res.json(userMoods)
        });
    })
    // ================================================
    // Fin les humeurs en JSON ========================
    // ================================================


    // Récupérer les humeurs en fichier CSV
    app.get('/humeursCSV', function(req, res, next) {
        var filename = "humeurs.csv";

        Humeur.find().lean().exec({}, function(err, docs) {
            if (err)
                res.send(err);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader("Content-Disposition", 'attachment; filename='+filename);
            res.csv(docs, true);
        });
    });

    // Récupérer les humeurs en XML
    app.get('/humeursXML', isLoggedInAndActivated, function(req, res) {
        var user = req.user

        Humeur.find().lean().exec({}, function(err, docs) {
            user.moods = docs
            if (err)
                res.send(err);
            else {
                var moodsTmp = JSON.stringify(user.moods)
                var jsonObj = JSON.parse(moodsTmp)

                var xml = js2xmlparser.parse("emotionsList", jsonObj)
                console.log(xml)
                res.set('Content-Type', 'text/xml');
                res.send(xml)

            }
        });
    });

    // ================================================
    // // Chatbot Api.AI ==============================
    // ================================================
    app.get('/chatbot', isLoggedInAndActivated, function(req, res) {
        Tchat.find({}, function(err, docs) {
            var styleDisp = ''
            console.log(docs)
            if (docs.length<1)
                styleDisp = 'none'
            else
                styleDisp = 'block'
            res.render('chatApiai.ejs', {
                listTchat: docs, StyleDisplay: styleDisp
            })
        })
    });

    app.post('/chatbot', function(req, res) {
        var textQuery = req.body.textMsg

        var request = apiai.textRequest(textQuery, {
            sessionId: 'uniqueSessionId'
        });

        request.on('response', function(response) {
            var rspApiai = response.result.fulfillment.speech
            console.log("POST response")
            console.log(rspApiai)

            var newTchat = new Tchat()
            newTchat.user = req.user
            newTchat.date = new Date().getTime()
            newTchat.textMsg = textQuery
            newTchat.rspApiai = rspApiai

            newTchat.save(function(err) {
                res.redirect('/chatbot')
            })

        });

        request.on('error', function(error) {
            console.log(error.message)
            var listTchatErr = [{textMsg: '', rspApiai:error.message, date:new Date().getTime()}]
            res.render('chatApiai.ejs', {
                listTchat: listTchatErr, StyleDisplay: 'block'
            })
        });

        request.end();

    })
    // =================================================
    // Fin chatbot api.ai ==============================
    // =================================================
	
	
	

	app.get('/humeur', function(req, res) {
        res.render('humeur.ejs', {rspApiow: ''})
    });
	
	app.post('/humeur/tweets2', isLoggedInTwitterAndActivated, function(req, res) {
        var client = new Twitter({
			consumer_key: credentials.twitterAuth.consumerKey,
			consumer_secret: credentials.twitterAuth.consumerSecret,
			access_token_key: credentials.twitterAuth.accessTokenKey,
			access_token_secret: credentials.twitterAuth.accessTokenSecret
		});
		//var params = {screen_name: req.user.twitter.username};
		var params = {screen_name: req.body.newtweets};
		client.get('statuses/user_timeline', params, function(error, tweets, response) {
			if (!error) {
				//tweets.map(tweet => {console.log(tweet.created_at),console.log(tweet.user.screen_name),console.log(tweet.text)})
				//console.log(params.screen_name)
				res.render('tweets.ejs' , {tweets: tweets, twitter_user: params.screen_name})
			}
			else {
				console.log("problème pour la récupération des tweets, vérifiez le statut de confidentialité du profil")
				res.redirect('/')
			}
		}); 
    })
    
	// Nuage de points meteo ----------------------
    app.get('/meteo', isLoggedInAndActivated, function(req, res) {
		var user = req.user
		var humeur = new Humeur();
		var list;
		var list_humeurs = require("../ressources/humeurs.json")
		console.log(list_humeurs.humeurs[1])
		Humeur.find({'user' : req.user},
		function(err, docs){
			user.moods = docs;
			res.render('meteo.ejs',{
				moods : user.moods , list : list_humeurs
			})
		});
	})
	
    app.post('/humeur', function(req, res) {
        var textQuery = req.body.textMsg

        var request = apiow.textRequest(textQuery, {
            sessionId: 'uniqueSessionId'
        });

        request.on('response', function(response) {
            console.log("POST response")
            console.log(response.result.fulfillment.speech);
            res.render('humeur.ejs', {rspApiow: response.result.fulfillment.speech})
        });

        request.on('error', function(error) {
            console.log(error)
            res.render('humeur.ejs', {rspApiow: error})
        });

        request.end();

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

function isLoggedInTwitterAndActivated(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated() && req.user.isActivated())
    {
        if(req.user.twitter.username){
			console.log(req.user.twitter.username, "logged in")
			return next()
		}
        else{
			res.redirect('/')
		}
    }

    // if they aren't redirect them to the home page
    res.redirect('/')
}
