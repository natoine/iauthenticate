// app/models/user.js
// load the things we need
const mongoose = require('mongoose')
const bcrypt   = require('bcrypt-nodejs')

// define the schema for our user model
const humeurSchema = mongoose.Schema({

        user       : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
        emotion     : String,
        date 	   : Number,
        lat 	   : Number,
        long	   : Number,    
        city	   : String
        
})



// methods ======================

// create the model for users and expose it to our app
const configDB = require('../../config/database.js')
const db = mongoose.createConnection(configDB.url)
//module.exports = mongoose.model('User', userSchema)
module.exports = db.model('Humeur', humeurSchema)
