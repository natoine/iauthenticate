const jwt    = require('jsonwebtoken')
// load up the user model
const User            = require('../application/models/user')

const expiresTokenJWT = "2 days"

// application/routes.js
module.exports = function(app, express) {

	// get an instance of the router for api routes
	const apiRoutes = express.Router()

	// =====================================
    // API with TOKEN ===============================
    // =====================================
    
	// route to authenticate a user (POST http://localhost:8080/api/authenticatelocal)
	// expects an email and password parameter in x-www-form-urlencoded
	apiRoutes.post('/authenticatelocal', function(req, res) {
		email = req.body.email
		password = req.body.password

		User.findOne({ 'local.email' :  email }, function(err, user) {
			if (err) throw err

		    if (!user) {
		      res.json({ success: false, message: 'Authentication failed. User not found.' })
		    } else if (user) {
		    	// if the user is found but the password is wrong
            	if (!user.validPassword(password))
            	{
            		res.json({ success: false, message: 'Authentication failed. Wrong password.' })
      			} else {
						// if user is found and password is right
						if(!user.apitoken)
						{
							res.json({ success: false, message: 'Authentication failed. Not authorized to use token.' })
						} else {
							// create a token with only our given payload
							// we don't want to pass in the entire user since that has the password
							const payload = { id: user._id }
							var token = jwt.sign(payload, app.get('jwtSecret'), 
								{ expiresIn: expiresTokenJWT })
							// return the information including token as JSON
	        				res.json({
	          					success: true,
	          					message: 'Enjoy your token!',
	          					token: token
	        				})
	        			}
      			}

		    }
		})
	})

	//route middleware to verify a token
	//routes written under this one will always go through this one
	//So, others route ( under that middleware one) will need a token in header x-access-token
	//you need to invoke the previous route to get a token
	apiRoutes.use(function(req, res, next) {
		// check header or url parameters or post parameters for token
		var token = req.body.token || req.query.token || req.headers['x-access-token']
		// decode token
	 	if (token) {
			// verifies secret and checks exp
	    	jwt.verify(token, app.get('jwtSecret'), function(err, decoded) {      
	      		if (err) {
	        		return res.json({ success: false, message: 'Failed to authenticate token.' })    
	      		} else {
	        		// if everything is good, save to request for use in other routes
	        		req.decoded = decoded    
	        		next()
	      		}
	    	})
		} else {
			// if there is no token
	    	// return an error
	    	return res.status(403).send({ 
	        	success: false, 
	        	message: 'No token provided.' 
	    	})
	  	}
	})

	apiRoutes.get('/', function(req, res) {
		//console.log("token decoded : " + req.decoded.id)
	  	res.json({ message: 'Welcome to the petitsEmprunts API !' })
	})

    //list all users
    apiRoutes.get('/users', function(req, res) {
        User.find({}, function(err, users) {
            res.json(users)
        })
    })

    // apply the routes to our application with the prefix /api
	app.use('/api', apiRoutes)

}