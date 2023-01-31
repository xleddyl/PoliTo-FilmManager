'use strict'

const utils = require('../utils/writer.js')
const Reviews = require('../service/ReviewsService')
const constants = require('../utils/constants.js')

module.exports.getReviews = function getReviews(req, res, next) {
   //retrieve a list of reviews
   let numOfReviews = 0
   let nextPage = 0
   let prevPage = 0

   Reviews.getFilmReviewsTotal(req.params.filmId)
      .then(function (response) {
         numOfReviews = response
         Reviews.getFilmReviews(req)
            .then(function (response) {
               if (req.query.pageNo == null) var pageNo = 1
               else var pageNo = req.query.pageNo
               var totalPage = Math.ceil(numOfReviews / constants.OFFSET)
               nextPage = Number(pageNo) + 1 > totalPage ? undefined : Number(pageNo) + 1
               prevPage = Number(pageNo) - 1 <= 0 ? undefined : Number(pageNo) - 1
               if (pageNo > totalPage || pageNo < 0 ) {
                  utils.writeJson(
                     res,
                     { errors: [{ param: 'Server', msg: 'The page does not exist.' }] },
                     404
                  )
               } else {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfReviews,
                     reviews: response,
                     nextPage:
                        nextPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public/' +
                        req.params.filmId +
                        '/reviews/' +
                        '?pageNo=' +
                        nextPage,
                     prevPage:
                        prevPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public/' +
                        req.params.filmId +
                        '/reviews/' +
                        '?pageNo=' +
                        prevPage,
                  })
               }
            })
            .catch(function (response) {
               utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
            })
      })
      .catch(function (response) {
         utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
      })
}

module.exports.getReview = function getReview(req, res, next) {
   Reviews.getReview(req.params.filmId, req.params.reviewId)
      .then(function (response) {
         utils.writeJson(res, response)
      })
      .catch(function (response) {
         if (response == 404) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The review does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.deleteReview = function deleteReview(req, res, next) {
   Reviews.deleteReview(req.params.filmId, req.params.reviewId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response, 204)
      })
      .catch(function (response) {
         if (response == '403A') {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The user is not the owner of the film' }] },
               403
            )
         } else if (response == '403B') {
            utils.writeJson(
               res,
               {
                  errors: [
                     {
                        param: 'Server',
                        msg: 'The review has been already completed, so the invitation cannot be deleted anymore.',
                     },
                  ],
               },
               403
            )
         } else if (response == 404) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The review does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.issueReviews = function issueReviews(req, res, next) {
   let differentFilm = false

   for (let i = 0; i < req.body.length; i++) {
      if (req.params.filmId != req.body[i].filmId) {
         differentFilm = true
      }
   }

   if (differentFilm) {
      utils.writeJson(
         res,
         {
            errors: [
               {
                  param: 'Server',
                  msg: 'The filmId field of the review object is different from the filmdId path parameter.',
               },
            ],
         },
         409
      )
   } else {
      Reviews.issueFilmReview(req.body, req.user.id)
         .then(function (response) {
            utils.writeJson(res, response, 201)
         })
         .catch(function (response) {
            if (response == 403) {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The user is not the owner of the film' }] },
                  403
               )
            } else if (response == 404) {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The public film does not exist.' }] },
                  404
               )
            } else if (response == 409) {
               utils.writeJson(
                  res,
                  {
                     errors: [
                        {
                           param: 'Server',
                           msg: 'One or more users do not exist or are already assigned to a review on this film',
                        },
                     ],
                  },
                  404
               )
            } else {
               utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
            }
         })
   }
}

module.exports.updateReview = function updateReview(req, res, next) {
   if (req.body.completed == undefined) {
      utils.writeJson(
         res,
         { errors: [{ param: 'Server', msg: 'The completed property is absent.' }] },
         400
      )
   } else if (req.body.completed == false) {
      utils.writeJson(
         res,
         {
            errors: [
               {
                  param: 'Server',
                  msg: 'The completed property is false, but it should be set to true.',
               },
            ],
         },
         400
      )
   } else {
      Reviews.updateReview(req.body, req.params.filmId, req.params.reviewId, req.user.id)
         .then(function (response) {
            utils.writeJson(res, response, 204)
         })
         .catch(function (response) {
            if (response == 400) {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'Review already completed' }] },
                  400
               )
            } else if (response == 403) {
               utils.writeJson(
                  res,
                  {
                     errors: [
                        {
                           param: 'Server',
                           msg: 'The user is not assigned to this review for the film',
                        },
                     ],
                  },
                  403
               )
            } else if (response == 404) {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The review does not exist.' }] },
                  404
               )
            } else if (response == 418) {
               utils.writeJson(
                  res,
                  {
                     errors: [
                        {
                           param: 'Server',
                           msg: 'The review is a coop one (not the right endpoint)',
                        },
                     ],
                  },
                  418
               )
            } else {
               utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
            }
         })
   }
}
