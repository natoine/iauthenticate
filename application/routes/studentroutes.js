// load up the user model
const User = require('../models/user')
const mongoose = require('mongoose')
const Humeur = require('../models/humeur')
const TweetDb = require('../models/tweets')
const Tchat = require('../models/tchat')
var Twitter = require('twitter');
var weather = require('openweather-apis');
var credentials = require('../config/auth.js');

const http = require('http')
const csv = require('csv-express');

const js2xmlparser = require("js2xmlparser")
const libxmljs = require("libxmljs")

// file system to write in file
const fs = require("fs")

// Get a reply from API.ai
const apiai = require('apiai')(credentials.APIAI_TOKEN);

// openweather
const apiow = require('openweather-apis');
apiow.setAPPID(credentials.API_OPENWEATHER);

const security = require('../utils/securityMiddleware')

// application/routes.js
module.exports = function(app, passport) {

    // =====================================
    // XML Actualités ROUTES without login. Permet de récupérer les actualités sans login.=====================
    // =====================================
	app.get('/lemonde', function(req, res) {	
		console.log('debut xml');
		var options = {
		  hostname: 'www.lemonde.fr',
		  path: '/international/rss_full.xml'
		}
		http.get(options, function(httpresponse){
				console.log("httpresponse : " + httpresponse.statusCode)
				console.log("httpresponse : " + httpresponse.headers['content-type'])
				
				var xmlLeMonde = '';
				httpresponse.on('data', function (chunk) 
				{
					xmlLeMonde += chunk
				})
            httpresponse.on('end', function() {
                var xmlDoc = libxmljs.parseXml(xmlLeMonde)

                var gchild = xmlDoc.get('//channel')

                var children = gchild.childNodes();
                var itemsTab = new Array()

                var k = 0
                for (var i=0; i<children.length; i++) {
                    var item = children[i].childNodes()
                    if (item.length>12) {
                        var attrTab = new Array()
                        for (var j=1; j<(item.length); j=j+2) {
                            if (j==11) {
                                attrName = item[j].name()
                                attrValue = item[j].attr('url').value()
                                attrTab[attrName] = attrValue
                            } else {
                                attrName = item[j].name()
                                attrValue = item[j].text()
                                attrTab[attrName] = attrValue
                            }
                        }
                        itemsTab[k] = attrTab
                        k++
                    }
                }

                res.render('flux.ejs', {xmlLeMonde: itemsTab});
            })
				httpresponse.on('error', function (e) {
					console.log('problem with request: ' + e.message);
                    res.render('flux.ejs', {xmlLeMonde: e.message});
				})
				//parser le xml xmlLeMonde et construire un json de ce qu'on veut garder jsonLeMonde
				//passer le jsonLeMonde en argument du render
				//res.render('flux.ejs');
		})
		
	})

// =============================================================================
// API =========================================================================
// =============================================================================

	// Twitter
	app.get('/api/tweets/', (req, res) => {
		TweetDb.find(function(err, tweets) {
            if (err) res.send(err);
			res.json(tweets);
        });
	});
	app.get('/api/tweets/:user', (req, res) => {
		TweetDb.find({user : req.params.user},function (err, tweets) {
			if (err) res.send(err);
			res.json(tweets);
		});
	});
	// Humeurs
	app.get('/api/humeurs/', (req, res) => {
		Humeur.find(function(err, humeurs) {
            if (err) res.send(err);
			res.json(humeurs);
        });
	});
	app.get('/api/humeurs/:user/', (req, res) => {
		Humeur.find({user : req.params.user},function(err, humeurs) {
            if (err) res.send(err);
			res.json(humeurs);
        });
	});
    
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
        newmood.long = req.body.long
        newmood.meteo = req.body.meteo
        newmood.temp = req.body.temp
        newmood.vent = req.body.vent
        newmood.city = req.body.city
        newmood.save(function(err) {
           res.redirect('/humeur')
        })
           
    })
	
	//Récupération des tweets
    app.get('/humeur/tweets', security.isLoggedInTwitterAndActivated, function(req, res) {
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
					TweetDb.count({tweet_id: tweet.id}, function (err, count){ 
						if(count>0){
							//tweet exists
							return
						}
						else{
							//console.log(tweet)
							newtweet = new TweetDb()
							newtweet.tweet_id = tweet.id
							newtweet.tweet = tweet.text 
							newtweet.user = tweet.user.screen_name
							newtweet.date = tweet.created_at
							newtweet.save(function(errSave){
								if (errSave){
									console.log("Problème lors de la sauvegarde des tweets en get");
								}
							})
						}
					})
					
				})
				//tweets.map(tweet => {console.log(tweet.created_at),console.log(tweet.user.screen_name),console.log(tweet.text)})
				//console.log(params.screen_name)
				res.render('tweets.ejs' , {tweets: tweets, twitter_user: params.screen_name})
			}
			else if(!params.screen_name){
				console.log("nom pas defini")
				res.redirect('/humeur/tweets')
			}
			else {
				console.log("problème lors de la récupération des tweets, vérifiez le statut de confidentialité du profil")
				res.redirect('/humeur/tweets')
			}
		});  
    })
	
	app.post('/humeur/tweets', security.isLoggedInTwitterAndActivated, function(req, res) {
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
				tweets.forEach(function(tweet) {
					TweetDb.count({tweet_id: tweet.id}, function (err, count){ 
						if(count>0){
							//tweet exists
							return
						}
						else{
							//console.log(tweet)
							newtweet = new TweetDb()
							newtweet.tweet_id = tweet.id
							newtweet.tweet = tweet.text 
							newtweet.user = tweet.user.screen_name
							newtweet.date = tweet.created_at
							newtweet.save(function(errSave){
								if (errSave){
									console.log("Problème lors de la sauvegarde des tweets en post");
								}
							})
						}
					})
					
				})
				//tweets.map(tweet => {console.log(tweet.created_at),console.log(tweet.user.screen_name),console.log(tweet.text)})
				//console.log(params.screen_name)
				res.render('tweets.ejs' , {tweets: tweets, twitter_user: params.screen_name})
			}
			else if(!params.screen_name){
				console.log("nom pas defini")
				res.redirect('/humeur/tweets', {errMsg: "rien error"})
			}
			else {
				console.log("problème lors de la récupération des tweets en post, vérifiez le statut de confidentialité du profil")
				res.redirect('/humeur/tweets')
			}
		}); 
    })

// Récupérer toutes les humeurs--
    app.get('/listhumeur',  function(req, res) {
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

    // ================================================
    // // Visualisation graphique =====================
    // ================================================
	
    
    // visualisation graphqiue ----------------------
    app.get('/graph_mood', isLoggedInAndActivated, function(req, res) {
		var user = req.user
		var humeur = new Humeur();
		var list;
		var list_humeurs = require("../ressources/humeurs.json")
		console.log(list_humeurs.humeurs[1])
		Humeur.find({'user' : req.user},
		function(err, docs){
			user.moods = docs;
			res.render('graph_mood.ejs',{
				moods : user.moods , list : list_humeurs
			})
		});
	})
	
    // =================================================
    // Visualisation graphique =========================
    // =================================================

	app.get('/humeur', function(req, res) {
        res.render('humeur.ejs', {rspApiow: ''})
    });
	
	app.post('/humeur/tweets2', security.isLoggedInTwitterAndActivated, function(req, res) {
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