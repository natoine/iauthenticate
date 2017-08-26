// server.js

// set up ======================================================================
// get all the tools we need
const express  = require('express')
const app      = express()
const port     = process.env.PORT || 8080
const mongoose = require('mongoose')
const passport = require('passport')
const flash    = require('connect-flash')

const morgan       = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser   = require('body-parser') // deprecated
const session      = require('express-session')

const configDB = require('./config/database.js')

// configuration ===============================================================
//mongoose.connect("mongodb://localhost/iauthenticate") // works but deprecated
//mongoose.connect(configDB.url) // connect to our database
const db = mongoose.createConnection(configDB.url)

require('./config/passport')(passport)
// pass passport for configuration

// set up our express application
app.use(morgan('dev')) // log every request to the console
app.use(cookieParser()) // read cookies (needed for auth)
app.use(bodyParser()) // get information from html forms

app.set('view engine', 'ejs') // set up ejs for templating

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })) // session secret, should be in config
app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
app.use(flash()) // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./application/routes.js')(app, passport)
// load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port)
console.log('The magic happens on port ' + port)
