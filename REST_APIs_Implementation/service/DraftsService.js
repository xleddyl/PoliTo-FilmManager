'use strict'

const Judgment = require('../components/judgment')
const Draft = require('../components/draft')
const db = require('../components/db')
const constants = require('../utils/constants.js')

/**
 * Retrieve the drafts of the review with ID reviewId of the film with ID filmId
 *
 * Input:
 * - req: the request of the user
 * Output:
 * - list of the drafts
 *
 **/
exports.getDrafts = async function (req) {
   return new Promise(async (resolve, reject) => {
      if (!(await isReviewer(req.params.reviewId, req.user.id))) return reject(403)

      let sql = `
         SELECT d.id, d.reviewId, d.reviewerId, d.open, d.proposedRating, d.proposedReview
         FROM drafts d, reviews r
         WHERE d.reviewId = r.id AND r.filmId = ? AND d.reviewId = ?
      `
      const params = getPagination(req)
      if (params.length != 2) sql = sql + ' LIMIT ?,?'
      db.all(sql, params, async (err, rows) => {
         if (err) reject(err)
         else {
            const drafts = await Promise.all(
               rows.map(async (d) => {
                  const judgments = await getJudgments(d.id)
                  return new Draft(
                     d.id,
                     d.reviewId,
                     d.reviewerId,
                     d.open,
                     d.proposedRating,
                     d.proposedReview,
                     judgments
                  )
               })
            )
            resolve(drafts)
         }
      })
   })
}

/**
 * Retrieve the number of drafts of the review with ID reviewId of the film with ID filmId
 *
 * Input:
 * - filmId: the ID of the film whose review need to be retrieved
 * - reviewId: the ID of the review whose drafts need to be retrieved
 * Output:
 * - total number of drafts of the review with ID reviewId
 *
 **/
exports.getDraftsTotal = async function (filmId, reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT count(*) total
         FROM drafts d, reviews r
         WHERE r.id = d.reviewId AND r.filmId = ? AND d.reviewId = ?
      `
      db.get(sql, [filmId, reviewId], (err, row) => {
         if (err) reject(err)
         else resolve(row.total)
      })
   })
}

/**
 * Retrieve the draft with ID draftId of the review with ID reviewId of the film with ID filmId
 *
 * Input:
 * - filmId: the ID of the film whose review need to be retrieved
 * - reviewId: the ID of the review whose drafts need to be retrieved
 * - draftId: the ID of the draft
 * - user: the ID of the user performing the operation
 * Output:
 * - draft with ID draftId
 *
 **/
exports.getDraft = async function (filmId, reviewId, draftId, user) {
   return new Promise(async (resolve, reject) => {
      if (!(await isReviewer(reviewId, user))) return reject(403)

      const sql = `
         SELECT d.id, d.reviewId, d.reviewerId, d.open, d.proposedRating, d.proposedReview
         FROM drafts d, reviews r
         WHERE d.reviewId = r.id AND r.filmId = ? AND d.reviewId = ? AND d.id = ?
      `
      db.all(sql, [filmId, reviewId, draftId], async (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else {
            const judgments = await getJudgments(rows[0].id)
            const draft = new Draft(
               rows[0].id,
               rows[0].reviewId,
               rows[0].reviewerId,
               rows[0].open,
               rows[0].proposedRating,
               rows[0].proposedReview,
               judgments
            )
            resolve(draft)
         }
      })
   })
}

/**
 * Create a draft on the review with ID reviewID for the film with ID filmId
 *
 * Input:
 * - draft: draft object
 * - filmId: the ID of the film whose review need to be retrieved
 * - reviewId: the ID of the review whose drafts need to be retrieved
 * - user: the ID of the user performing the operation
 * Output:
 * - no response expected for this operation
 */
exports.createDraft = async function (draft, filmId, reviewId, user) {
   return new Promise(async (resolve, reject) => {
      try {
         if (!(await isCoopReview(filmId, draft.reviewId))) return reject(418)
         if (!(await isReviewer(draft.reviewId, user))) return reject('403A')
         if (await anotherDraftOpen(reviewId)) return reject('403B')
         if (await isReviewCompleted(reviewId)) return reject('403C')
      } catch (err) {
         return reject(err)
      }

      const sql = `
         INSERT INTO drafts(reviewId, reviewerId, open, proposedRating, proposedReview)
         VALUES(?, ?, 1, ?, ?)
      `
      db.run(
         sql,
         [draft.reviewId, user, draft.proposedRating, draft.proposedReview],
         function (err) {
            if (err) return reject(err)
            const sql2 = `
            INSERT INTO judgments(draftId, reviewerId, agree)
            VALUES(?, ?, 1)
         `
            db.run(sql2, [this.lastID, user], function (err) {
               if (err) return reject(err)
               resolve(null)
            })
         }
      )
   })
}

/**
 * Judge a draft on the review with ID reviewID for the film with ID filmId
 *
 * Input:
 * - judgment: judgment object
 * - filmId: the ID of the film whose review need to be retrieved
 * - reviewId: the ID of the review whose drafts need to be retrieved
 * - draftId: the ID of the draft
 * - user: the ID of the user performing the operation
 * Output:
 * - no response expected for this operation
 */
exports.judgeDraft = async function (judgment, filmId, reviewId, draftId, user) {
   return new Promise(async (resolve, reject) => {
      try {
         if (!(await isCoopReview(filmId, reviewId))) return reject(418)
         if (!(await isReviewer(reviewId, user))) return reject('403A')
         if (!(await isDraftOpen(draftId))) return reject('403B')
         if (await isReviewCompleted(reviewId)) return reject('403C')
         if (await hasJudged(draftId, user)) return reject('403D')
      } catch (err) {
         return reject(err)
      }

      const sql = `
         INSERT INTO judgments(draftId, reviewerId, agree ${judgment.agree ? '' : ',comment'})
         VALUES (?, ?, ? ${judgment.agree ? '' : ',?'})
      `
      const params = [judgment.draftId, user, judgment.agree]
      if (judgment.agree) params.push(judgment.comment)
      db.run(sql, params, async function (err) {
         if (err) return reject(err)
         try {
            if (await allReviewersJudged(judgment.draftId)) {
               if (await allReviewersAgreed(judgment.draftId)) {
                  await confirmDraft(judgment.draftId)
               }
               await closeDraft(judgment.draftId)
            }
         } catch (err) {
            return reject(err)
         }
         resolve(null)
      })
   })
}

/**
 * Utility functions
 */

const confirmDraft = function (draftId) {
   return new Promise((resolve, reject) => {
      let date = new Date()
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0') //January is 0!
      const yyyy = date.getFullYear()
      date = yyyy + '-' + mm + '-' + dd

      const sql = `
         SELECT *
         FROM drafts
         WHERE id = ?
      `
      db.all(sql, [draftId], (err, rows) => {
         if (err) return reject(err)
         const sql1 = `
            UPDATE reviews
            SET completed = 1, reviewDate = ?, rating = ?, review = ?
            WHERE id = ?
         `
         db.run(
            sql1,
            [date, rows[0].proposedRating, rows[0].proposedReview, rows[0].reviewId],
            function (err) {
               if (err) reject(500)
               else resolve(null)
            }
         )
      })
   })
}

const closeDraft = function (draftId) {
   return new Promise((resolve, reject) => {
      const sql3 = `
         UPDATE drafts
         SET open = 0
         WHERE id = ?
      `
      db.run(sql3, [draftId], function (err) {
         if (err) reject(err)
         else resolve(null)
      })
   })
}

const isReviewCompleted = function (reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT completed
         FROM reviews
         WHERE id = ?
      `
      db.all(sql, [reviewId], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else resolve(rows[0].completed === 1 ? true : false)
      })
   })
}

const hasJudged = function (draftId, user) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT id
         FROM judgments
         WHERE reviewerId = ?
           AND draftId = ?
      `
      db.all(sql, [user, draftId], (err, rows) => {
         if (err) reject(err)
         else resolve(rows.length !== 0)
      })
   })
}

const allReviewersAgreed = function (draftId) {
   return new Promise((resolve, reject) => {
      const sql = `
      SELECT agree
      FROM judgments
      WHERE draftId = ?
   `
      db.all(sql, [draftId], (err, rows) => {
         if (err) return reject(err)
         const res = rows
            .map((row) => (row.agree === 1 ? true : false))
            .reduce((prev, curr) => prev && curr)
         resolve(res)
      })
   })
}

const allReviewersJudged = function (draftId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT count(*) reviewers_count
         FROM drafts d, reviews r, reviewers rs
         WHERE d.id = ?
           AND d.reviewId = r.id
           AND r.id = rs.reviewId
      `
      db.get(sql, [draftId], (err, row1) => {
         if (err) return reject(err)
         const sql1 = `
            SELECT count(*) judgments_count
            FROM drafts d, judgments j
            WHERE d.id = ?
              AND d.id = j.draftId
         `
         db.get(sql1, [draftId], (err, row2) => {
            if (err) reject(err)
            else resolve(row1.reviewers_count === row2.judgments_count)
         })
      })
   })
}

const anotherDraftOpen = function (reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT d.id
         FROM drafts d, reviews r
         WHERE d.reviewId = r.id
           AND r.id = ?
           AND d.open = 1
      `
      db.all(sql, [reviewId], (err, rows) => {
         if (err) reject(err)
         else resolve(rows.length !== 0)
      })
   })
}

const isDraftOpen = function (draftId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT open
         FROM drafts
         WHERE id = ?
      `
      db.all(sql, [draftId], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else resolve(rows[0].open)
      })
   })
}

const isCoopReview = function (filmId, reviewId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT coop
         FROM reviews
         WHERE id = ? AND filmId = ?
      `
      db.all(sql, [reviewId, filmId], (err, rows) => {
         if (err) reject(err)
         else if (rows.length === 0) reject(404)
         else resolve(rows[0].coop)
      })
   })
}

const isReviewer = function (reviewId, user) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT *
         FROM reviews r, reviewers rs
         WHERE rs.reviewId = r.id
           AND r.id = ?
           AND rs.reviewerId = ?
      `
      db.all(sql, [reviewId, user], (err, rows) => {
         if (err) reject(err)
         else resolve(rows.length !== 0)
      })
   })
}

const getPagination = function (req) {
   let pageNo = parseInt(req.query.pageNo)
   const size = parseInt(constants.OFFSET)
   const limits = []
   limits.push(req.params.filmId)
   limits.push(req.params.reviewId)
   if (req.query.pageNo == null) {
      pageNo = 1
   }
   limits.push(size * (pageNo - 1))
   limits.push(size)
   return limits
}

const getJudgments = function (draftId) {
   return new Promise((resolve, reject) => {
      const sql = `
         SELECT reviewerId, agree, comment
         FROM judgments
         WHERE draftId = ?
      `
      db.all(sql, [draftId], (err, rows) => {
         if (err) reject(err)
         else resolve(rows.map((j) => new Judgment(j.reviewerId, j.agree, j.comment)))
      })
   })
}
