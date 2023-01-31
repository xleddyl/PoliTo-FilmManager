'use strict'

const passport = require('passport')
const LocalStrategy = require('passport-local')
const utils = require('../utils/writer.js')
const Users = require('../service/UsersService')

// Set up local strategy to verify, search in the DB a user with a matching password, and retrieve its information by userDao.getUser (i.e., id, username, name).
passport.use(
   new LocalStrategy(
      {
         usernameField: 'email',
         passwordField: 'password',
      },
      async function verify(username, password, done) {
         Users.getUserByEmail(username)
            .then((user) => {
               if (user === undefined) {
                  return done(null, false, { message: 'Unauthorized access.' })
               } else {
                  if (!Users.checkPassword(user, password)) {
                     return done(null, false, { message: 'Unauthorized access.' })
                  } else {
                     return done(null, user)
                  }
               }
            })
            .catch((err) => done(err))
      }
   )
)

module.exports.authenticateUser = function authenticateUser(req, res, next) {
   if (req.query.type == 'login') {
      passport.authenticate('local', (err, user, info) => {
         if (err) return next(err)
         if (!user) {
            // display wrong login messages
            return res.status(401).json(info)
         }
         // success, perform the login
         req.login(user, (err) => {
            if (err) return next(err)
            return res.json({ id: user.id, name: user.name, email: req.body.email })
         })
      })(req, res, next)
   } else if (req.query.type == 'logout') {
      if (!req.isAuthenticated()) {
         res.status(401).json({ error: 'Not authorized' })
      } else {
         const email = req.user.email
         Users.getUserByEmail(email).then((user) => {
            if (user === undefined) {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'Unauthorized access.' }] },
                  401
               )
            } else {
               req.logout(() => {
                  res.status(200).json({})
               })
            }
         })
      }
   } else {
      utils.writeJson(
         res,
         { errors: [{ param: 'Server', msg: 'value for the query parameter not accepted' }] },
         400
      )
   }
}

module.exports.getUsers = function getUsers(req, res, next) {
   Users.getUsers()
      .then(function (response) {
         if (!response) {
            utils.writeJson(res, response, 404)
         } else {
            utils.writeJson(res, response)
         }
      })
      .catch(function (response) {
         utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
      })
}

module.exports.getUser = function getUser(req, res, next) {
   Users.getUserById(req.params.userId)
      .then(function (response) {
         if (!response) {
            utils.writeJson(res, response, 404)
         } else {
            utils.writeJson(res, response)
         }
      })
      .catch(function (response) {
         utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
      })
}
