// load up the user model
const User            = require('../models/user')

//to send emails
const mailSender = require('../utils/mailSender')

const TIMINGTOCHANGEPWD = 3600000

const security = require('../utils/securityMiddleware')

module.exports = function(app, express) {

	// get an instance of the router for clientfiles routes
	const pwdRoutes = express.Router()

        // =====================================
    // PWD RECOVERY ==============================
    // =====================================
    // show the pwd recovery form
    pwdRoutes.get('/pwdrecovery', function(req, res) {
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
    pwdRoutes.post('/pwdrecovery' , function(req, res) {

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
                            var subject = "iauthenticate pwd recovery ok"
                            var html = "you seem to have lost your pwd. "
                                 + "Click on the following link to change your password : " 
                                 + "<a href=\"" + mailSender.urlService + "/pwdrecovery?token=" 
                                 + user.local.pwdrecotoken
                                 + "\">Password change</a>"
                            mailSender.sendMail(email, subject, html, function(error, response){
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
                        var subject = "iauthenticate pwd recovery notok"
                        var html = "someone thinks you use our service"
                        mailSender.sendMail(email, subject, html, function(error, response){
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
    pwdRoutes.post('/pwdchangerecovery' , function(req, res) {
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
                        newpwd = req.body.password
                        if(newpwd.length != 0)
                        {
                            user.local.password = user.generateHash(newpwd)
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
                                    res.redirect("/login")
                                }
                            })
                        }
                        else
                        {
                            req.flash('pwdrecoverylinkMessage', 'Bad pwd, try again')
                            res.render('pwdrecoverylink' , 
                            { message: req.flash('pwdrecoverylinkMessage'), 
                                email: user.local.email, token: req.body.token })
                        }
                    }
                }
            })
    })

    // =====================================
    // CHANGE PWD ==============================
    // =====================================


    pwdRoutes.get('/changepwd', security.isLoggedInAndActivated, function(req, res) {
        res.render('changepwd.ejs', {email: req.user.local.email, message: req.flash('changepwdMessage')})
    })

    pwdRoutes.post('/changepwd', security.isLoggedInAndActivated, function(req, res){
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

	// apply the routes to our application
	app.use('/', pwdRoutes)
}