'use strict'

const sqlite = require('sqlite3').verbose()
const path = require('path')

const DBSOURCE = path.join(__dirname, '../database/database.db')

const db = new sqlite.Database(DBSOURCE, (err) => {
   if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
   }

   db.exec('PRAGMA foreign_keys = ON;', function (error) {
      if (error) {
         console.error("Pragma statement didn't work.")
      }
   })
})

module.exports = db
