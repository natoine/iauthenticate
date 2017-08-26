// config/passport.js

// load all the things we need
const LocalStrategy   = require('passport-local').Strategy

// load up the user model
const User            = require('../application/models/user')

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id)
    })

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user)
        })
    })

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        console.log("trying to persist user :" + email)
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            console.log("nextTick")

/////pour comprendre ce qui ne marche pas

            var newUser            = new User()
            newUser.local.email    = email
            newUser.local.password = newUser.generateHash(password)
            console.log(newUser)
            newUser.save(function(err) {
                console.log("called save")
                    if (err)
                        console.log(err)
                        //throw err
                    return done(null, newUser)
                })

///////////

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
       /* User.findOne({ 'local.email' :  email }, function(err, user) {
            console.log("findOne")
            // if there are any errors, return the error
            if (err)
                return done(err)

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'))
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User()

                // set the user's local credentials
                newUser.local.email    = email
                newUser.local.password = newUser.generateHash(password)

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err
                    return done(null, newUser)
                })
            }

        })    */

        })

    }))

}