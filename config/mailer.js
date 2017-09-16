// config/mailer.js

const nodemailer = require('nodemailer')

const smtpTransport = nodemailer.createTransport({
	    service: "gmail",
	    host: "smtp.gmail.com",
	    auth: {
	        user: "YOURUSERNAME",
	        pass: "YOURPASSWORD"
	    }
	})

module.exports = smtpTransport
