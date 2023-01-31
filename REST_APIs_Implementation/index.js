'use strict'

const path = require('path')
const http = require('http')
const cors = require('cors')
const fs = require('fs')
const oas3Tools = require('oas3-tools')
const { Validator, ValidationError } = require('express-json-validator-middleware')
const constants = require('./utils/constants')

/** Authentication-related imports **/
const passport = require('passport')
const session = require('express-session')

const userController = require(path.join(__dirname, 'controllers/UsersController'))
const filmController = require(path.join(__dirname, 'controllers/FilmsController'))
const reviewController = require(path.join(__dirname, 'controllers/ReviewsController'))
const draftController = require(path.join(__dirname, 'controllers/DraftsController'))

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/

const corsOptions = {
   origin: 'http://localhost:3000',
   credentials: true,
}

/*** Passport ***/

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, cb) {
   // this user is id + username + name
   cb(null, user)
})

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, cb) {
   // this user is id + email + name
   // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
   // e.g.: return userDao.getUserById(id).then(user => cb(null, user)).catch(err => cb(err, null));
   return cb(null, user) // this will be available in req.user
})

/*** Defining authentication verification middleware ***/

const isLoggedIn = (req, res, next) => {
   if (req.isAuthenticated()) {
      return next()
   }
   return res.status(401).json({ error: 'Not authorized' })
}

/*** Defining JSON validator middleware ***/

const filmSchema = JSON.parse(
   fs.readFileSync(path.join('../', 'JSON_Schemas', 'film.json')).toString()
)
const userSchema = JSON.parse(
   fs.readFileSync(path.join('../', 'JSON_Schemas', 'user.json')).toString()
)
const reviewSchema = JSON.parse(
   fs.readFileSync(path.join('../', 'JSON_Schemas', 'review.json')).toString()
)
const draftSchema = JSON.parse(
   fs.readFileSync(path.join('../', 'JSON_Schemas', 'draft.json')).toString()
)
const judgmentSchema = JSON.parse(
   fs.readFileSync(path.join('../', 'JSON_Schemas', 'judgment.json')).toString()
)
const arrayOfReviews = {
   type: 'array',
   minItems: 1,
   items: {
      ...reviewSchema,
   },
}

const validator = new Validator({ allErrors: false })
validator.ajv.addSchema([
   userSchema,
   filmSchema,
   reviewSchema,
   draftSchema,
   judgmentSchema,
   arrayOfReviews,
])
const addFormats = require('ajv-formats').default
addFormats(validator.ajv)
const validate = validator.validate

/*** Swagger configuration ***/

const options = {
   routing: {
      controllers: path.join(__dirname, './controllers'),
   },
}

const expressAppConfig = oas3Tools.expressAppConfig(
   path.join(__dirname, '../REST_APIs_Design/openapi.yaml'),
   options
)
const app = expressAppConfig.getApp()

// Creating the session

app.use(cors(corsOptions))
app.use(
   session({
      secret: constants.SECRET,
      resave: false,
      saveUninitialized: false,
   })
)
app.use(passport.authenticate('session'))

// Routes

// film
app.get('/api/films/public', filmController.getPublicFilms)
app.get('/api/films/private', isLoggedIn, filmController.getPrivateFilms)
app.get('/api/films/public/invited', isLoggedIn, filmController.getInvitedFilms) // modified WRT lab1 sol (implementation)
app.get('/api/films/public/:filmId', filmController.getPublicFilm)
app.get('/api/films/private/:filmId', isLoggedIn, filmController.getPrivateFilm)
app.post('/api/films', isLoggedIn, validate({ body: filmSchema }), filmController.createFilm)
app.put('/api/films/public/:filmId', isLoggedIn, validate({ body: filmSchema }),filmController.updatePublicFilm)
app.put('/api/films/private/:filmId', isLoggedIn, validate({ body: filmSchema }),filmController.updatePrivateFilm)
app.delete('/api/films/public/:filmId', isLoggedIn, filmController.deletePublicFilm) // fixed lab1 solution
app.delete('', isLoggedIn, filmController.deletePrivateFilm) // fixed lab1 solution
// user
app.get('/api/users', isLoggedIn, userController.getUsers)
app.get('/api/users/:userId', isLoggedIn, userController.getUser)
app.post('/api/users/authenticator', userController.authenticateUser)
// review
app.get('/api/films/public/:filmId/reviews', reviewController.getReviews) // modified WRT lab1 sol (implementation)
app.get('/api/films/public/:filmId/reviews/:reviewId', reviewController.getReview) // modified WRT lab1 sol (implementation + route)
app.post('/api/films/public/:filmId/reviews', isLoggedIn, validate({ body: arrayOfReviews }),reviewController.issueReviews) // modified WRT lab1 sol (implementation)
app.put('/api/films/public/:filmId/reviews/:reviewId',validate({ body: reviewSchema }), isLoggedIn, reviewController.updateReview) // modified WRT lab1 sol (implementation + route)
app.delete('/api/films/public/:filmId/reviews/:reviewId', isLoggedIn, reviewController.deleteReview) // modified WRT lab1 sol (implementation + route)
// draft
app.get('/api/films/public/:filmId/reviews/:reviewId/drafts', isLoggedIn, draftController.getDrafts) // NEW
app.get('/api/films/public/:filmId/reviews/:reviewId/drafts/:draftId', isLoggedIn, draftController.getDraft) // NEW
app.post('/api/films/public/:filmId/reviews/:reviewId/drafts', isLoggedIn, validate({body: draftSchema}), draftController.createDraft) // NEW
app.put('/api/films/public/:filmId/reviews/:reviewId/drafts/:draftId', isLoggedIn, validate({body: judgmentSchema}), draftController.judgeDraft) // NEW


// Error handlers for validation and authentication errors

app.use(function (err, req, res, next) {
   if (err instanceof ValidationError) {
      res.status(400).send(err)
   } else next(err)
})

app.use(function (err, req, res, next) {
   if (err.name === 'UnauthorizedError') {
      const authErrorObj = { errors: [{ param: 'Server', msg: 'Authorization error' }] }
      res.status(401).json(authErrorObj)
   } else next(err)
})

// Initialize the Swagger middleware

http.createServer(app).listen(constants.SERVER_PORT, constants.SERVER_URL, function () {
   console.log(
      'Your server is listening on port %d (%s://%s:%d)',
      constants.SERVER_PORT,
      constants.SERVER_PROTOCOL,
      constants.SERVER_URL,
      constants.SERVER_PORT
   )
   console.log(
      'Swagger-ui is available on %s://%s:%d/docs',
      constants.SERVER_PROTOCOL,
      constants.SERVER_URL,
      constants.SERVER_PORT
   )
})
