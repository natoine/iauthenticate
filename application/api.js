// load up the user model
const User            = require('../application/models/user')

// application/routes.js
module.exports = function(app, express) {

	// get an instance of the router for api routes
	const apiRoutes = express.Router()

	// =====================================
    // API with TOKEN ===============================
    // =====================================
    
	apiRoutes.get('/', function(req, res) {
	  	res.json({ message: 'Welcome to the coolest API on earth!' })
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