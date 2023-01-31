'use strict'

const User = require('../components/user')
const db = require('../components/db')
const bcrypt = require('bcrypt')

/**
 * Retrieve a user by her email
 *
 * Input:
 * - email: email of the user
 * Output:
 * - the user having the specified email
 *
 */
exports.getUserByEmail = function (email) {
   return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?'
      db.all(sql, [email], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) resolve(undefined)
         else {
            const user = createUser(rows[0])
            resolve(user)
         }
      })
   })
}

/**
 * Retrieve a user by her ID
 *
 * Input:
 * - id: ID of the user
 * Output:
 * - the user having the specified ID
 *
 */
exports.getUserById = function (id) {
   return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email FROM users WHERE id = ?'
      db.all(sql, [id], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) resolve(undefined)
         else {
            const user = createUser(rows[0])
            resolve(user)
         }
      })
   })
}

/**
 * Retrieve all the users
 *
 * Input:
 * - none
 * Output:
 * - the list of all the users
 *
 */
exports.getUsers = function () {
   return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email FROM users'
      db.all(sql, [], (err, rows) => {
         if (err) {
            reject(err)
         } else {
            if (rows.length === 0) resolve(undefined)
            else {
               let users = rows.map((row) => createUser(row))
               resolve(users)
            }
         }
      })
   })
}

/**
 * Logs a user in or out
 * The user who wants to log in or out sends the user data to the authenticator which performs the operation.
 *
 * body User The data of the user who wants to perform log in or log out. For login the structure must contain email and password. For logout, the structure must contain the user id.
 * type String The operation type (\"login\" or \"logout\") (optional)
 * no response value expected for this operation
 **/
exports.authenticateUser = function (body, type) {
   return new Promise(function (resolve, reject) {
      resolve()
   })
}

/**
 * Utility functions
 */

const createUser = function (row) {
   const id = row.id
   const name = row.name
   const email = row.email
   const hash = row.hash
   return new User(id, name, email, hash)
}

exports.checkPassword = function (user, password) {
   let hash = bcrypt.hashSync(password, 10)
   return bcrypt.compareSync(password, user.hash)
}
