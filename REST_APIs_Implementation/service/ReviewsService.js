'use strict'

const Review = require('../components/review')
const db = require('../components/db')
const constants = require('../utils/constants.js')

/**
 * Retrieve the reviews of the film with ID filmId
 *
 * Input:
 * - req: the request of the user
 * Output:
 * - list of the reviews
 *
 **/
exports.getFilmReviews = async function (req) {
   return new Promise((resolve, reject) => {
      let sql = `
        SELECT r.id, r.filmId, completed, reviewDate, rating, coop, review, c.total_rows
        FROM reviews r, (SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? ) c
        WHERE  r.filmId = ?`
      const params = getPagination(req)
      if (params.length != 2) sql = sql + ' LIMIT ?,?'
      db.all(sql, params, async (err, rows) => {
         if (err) {
            reject(err)
         } else {
            const reviews = await Promise.all(
               rows.map(async (review) => {
                  const reviewers = await getReviewers(review.id)
                  return createReviewObject(review, reviewers)
               })
            )
            resolve(reviews)
         }
      })
   })
}

/**
 * Retrieve the number of reviews of the film with ID filmId
 *
 * Input:
 * - filmId: the ID of the film whose reviews need to be retrieved
 * Output:
 * - total number of reviews of the film with ID filmId
 *
 **/
exports.getFilmReviewsTotal = function (filmId) {
   return new Promise((resolve, reject) => {
      const sqlNumOfReviews = `
         SELECT count(*) total FROM reviews WHERE filmId = ?
      `
      db.get(sqlNumOfReviews, [filmId], (err, size) => {
         if (err) {
            reject(err)
         } else {
            resolve(size.total)
         }
      })
   })
}

/**
 * Retrieve the review of the film having filmId as ID and reviewId as ID
 *
 * Input:
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewId: ID of the review
 * Output:
 * - the requested review
 *
 **/
exports.getReview = async function (filmId, reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT id, filmId, completed, reviewDate, rating, coop, review
         FROM reviews
         WHERE filmId = ? AND id = ?
      `
      db.all(sql, [filmId, reviewId], async (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else {
            const review = rows[0]
            const reviewers = await getReviewers(review.id)
            resolve(createReviewObject(review, reviewers))
         }
      })
   })
}

/**
 * Delete a review invitation
 *
 * Input:
 * - filmId: ID of the film
 * - reviewId: ID of the review
 * - owner : ID of user who wants to remove the review
 * Output:
 * - no response expected for this operation
 *
 **/
exports.deleteReview = function (filmId, reviewId, owner) {
   return new Promise((resolve, reject) => {
      const sql1 = `
         SELECT f.owner, r.completed
         FROM films f, reviews r
         WHERE f.id = r.filmId AND f.id = ? AND r.id = ?
      `
      db.all(sql1, [filmId, reviewId], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else if (owner != rows[0].owner) {
            reject('403A')
         } else if (rows[0].completed == 1) {
            reject('403B')
         } else {
            const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND id = ?'
            db.run(sql2, [filmId, reviewId], (err) => {
               if (err) reject(err)
               else resolve(null)
            })
         }
      })
   })
}

/**
 * Issue a film review to a user (or a group of users)
 *
 *
 * Input:
 * - invitaitions: list (or one) review invitations
 * - user: ID of the user who wants to issue the review
 * Output:
 * - array of created reviews
 *
 **/
exports.issueFilmReview = function (invitations, user) {
   return new Promise((resolve, reject) => {
      const sql1 = `
         SELECT owner, private
         FROM films
         WHERE id = ?
      `
      db.all(sql1, [invitations[0].filmId], async (err, rows) => {
         if (err) {
            reject(err)
         } else if (rows.length === 0) {
            reject(404)
         } else if (user != rows[0].owner) {
            reject(403)
         } else if (rows[0].private == 1) {
            reject(404)
         } else {
            const single = []
            const coop = []
            const all = []
            const reviewsIds = []

            for (let i = 0; i < invitations.length; i++) {
               if (invitations[i].coop) {
                  coop.push(invitations[i].reviewersId)
                  all.push(...invitations[i].reviewersId)
               } else {
                  single.push(invitations[i].reviewerId)
                  all.push(invitations[i].reviewerId)
               }
            }

            const duplicates = all.filter((v, i) => all.indexOf(v) !== i)
            if (duplicates.length !== 0) return reject('409')
            const reviewingAgain = (
               await Promise.all(
                  all.map(async (reviewer) => await isReviewing(invitations[0].filmId, reviewer))
               )
            ).reduce((prev, curr) => prev || curr)
            if (reviewingAgain) return reject('409')

            await Promise.all(
               single.map(async (reviewer) => {
                  const id = await issueSingleReview(invitations[0].filmId, reviewer)
                  reviewsIds.push(id)
               })
            )
            await Promise.all(
               coop.map(async (reviewers) => {
                  const id = await issueCoopReview(invitations[0].filmId, reviewers)
                  reviewsIds.push(id)
               })
            )

            const issuedReviews = await Promise.all(
               reviewsIds.map(async (id) => await this.getReview(invitations[0].filmId, id))
            )
            resolve(issuedReviews)
         }
      })
   })
}

/**
 * Complete and update a review
 *
 * Input:
 * - review: review object (with only the needed properties)
 * - filmID: the ID of the film to be reviewed
 * - reviewId: ID of the review
 * - user: ID of the user who wants to issue the review
 * Output:
 * - no response expected for this operation
 *
 **/
exports.updateReview = function (review, filmId, reviewId, user) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT id, completed, coop
         FROM reviews
         WHERE filmId = ? AND id = ?
      `
      db.all(sql, [filmId, reviewId], async function (err, rows) {
         if (err) reject(err)
         if (rows.length === 0) return reject(404)
         if (rows[0].completed) return reject(400)
         if (rows[0].coop) return reject(418)

         try {
            const reviewer = (await getReviewers(reviewId))[0]
            if (reviewer !== user) return reject(403)
            await completeReview(review, reviewId, filmId)
            resolve(null)
         } catch (err) {
            reject(err)
         }
      })
   })
}

/**
 * Utility functions
 */

const completeReview = function (review, reviewId, filmId) {
   return new Promise((resolve, reject) => {
      const sql = `
         UPDATE reviews
         SET completed = ?, reviewDate = ?, rating = ?, review = ?
         WHERE id = ? AND filmId = ?
      `
      db.run(
         sql,
         [true, review.reviewDate, review.rating, review.review, reviewId, filmId],
         function (err) {
            if (err) reject(500)
            else resolve(null)
         }
      )
   })
}

const issueSingleReview = function (filmId, reviewerId) {
   return new Promise(async (resolve, reject) => {
      const sql = `
         INSERT INTO reviews(filmId) VALUES(?)
      `
      db.run(sql, [filmId], async function (err) {
         if (err) {
            reject('500')
         } else {
            const reviewId = this.lastID
            try {
               await createReviewerEntry(reviewId, reviewerId)
               resolve(reviewId)
            } catch (err) {
               reject('500')
            }
         }
      })
   })
}

const issueCoopReview = function (filmId, reviewersId) {
   return new Promise(async (resolve, reject) => {
      const sql = `
         INSERT INTO reviews(filmId, coop) VALUES(?, ?)
      `
      db.run(sql, [filmId, true], async function (err) {
         if (err) {
            reject('500')
         } else {
            const reviewId = this.lastID
            try {
               await Promise.all(
                  reviewersId.map(async (reviewerId) => {
                     await createReviewerEntry(reviewId, reviewerId)
                  })
               )
               resolve(reviewId)
            } catch (err) {
               reject('500')
            }
         }
      })
   })
}

const isReviewing = function (filmId, reviewerId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT *
         FROM reviews r, reviewers rs
         WHERE r.id = rs.reviewId
            AND r.filmId = ?
            AND rs.reviewerId = ?
      `
      db.all(sql, [filmId, reviewerId], function (err, rows) {
         if (err) reject(err)
         else resolve(rows.length !== 0)
      })
   })
}

const createReviewerEntry = function (reviewId, reviewerId) {
   return new Promise((resolve, reject) => {
      const sql = `
         INSERT INTO reviewers(reviewId, reviewerId) VALUES (?, ?)
      `
      db.run(sql, [reviewId, reviewerId], function (err) {
         if (err) reject('500')
         else resolve(null)
      })
   })
}

const getPagination = function (req) {
   let pageNo = parseInt(req.query.pageNo)
   const size = parseInt(constants.OFFSET)
   const limits = []
   limits.push(req.params.filmId)
   limits.push(req.params.filmId)
   if (req.query.pageNo == null) {
      pageNo = 1
   }
   limits.push(size * (pageNo - 1))
   limits.push(size)
   return limits
}

const createReviewObject = function (review, reviewers) {
   return new Review(
      review.id,
      review.filmId,
      reviewers,
      review.completed,
      review.reviewDate,
      review.rating,
      review.coop,
      review.review
   )
}

const getReviewers = function (reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
        SELECT reviewerId FROM reviewers WHERE reviewId = ?
      `
      db.all(sql, [reviewId], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else {
            resolve(rows.map((row) => row.reviewerId))
         }
      })
   })
}
