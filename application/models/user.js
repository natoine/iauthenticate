// app/models/user.js
// load the things we need
const mongoose = require('mongoose')
const bcrypt   = require('bcrypt-nodejs')

// define the schema for our user model
const userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
        mailvalidated: Boolean, 
        activationtoken: String,
        timepwdreco  : Number,
        pwdrecotoken : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

})

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password)
}

//generate password recovery token
userSchema.methods.generatePwdRecoToken = function(email , timepwdreco) {
    return bcrypt.hashSync(email + timepwdreco, bcrypt.genSaltSync(8), null)
}

//checking if user is activated
userSchema.methods.isActivated = function() {
    return this.local.mailvalidated
}

// create the model for users and expose it to our app
const configDB = require('../../config/database.js')
const db = mongoose.createConnection(configDB.url)
//module.exports = mongoose.model('User', userSchema)
module.exports = db.model('User', userSchema)