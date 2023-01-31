'use strict'

const utils = require('../utils/writer.js')
const Drafts = require('../service/DraftsService')
const constants = require('../utils/constants.js')

module.exports.getDrafts = function getDrafts(req, res, next) {
   let numOfDtafts = 0
   let nextPage = 0
   let prevPage = 0

   Drafts.getDraftsTotal(req.params.filmId, req.params.reviewId)
      .then(function (response) {
         numOfDtafts = response
         Drafts.getDrafts(req)
            .then(function (response) {
               if (req.query.pageNo == null) var pageNo = 1
               else var pageNo = req.query.pageNo
               var totalPage = Math.ceil(numOfDtafts / constants.OFFSET)
               nextPage = Number(pageNo) + 1 > totalPage ? undefined : Number(pageNo) + 1
               prevPage = Number(pageNo) - 1 <= 0 ? undefined : Number(pageNo) - 1
               if (pageNo > totalPage || pageNo < 0) {
                  utils.writeJson(
                     res,
                     { errors: [{ param: 'Server', msg: 'The page does not exist.' }] },
                     404
                  )
               } else {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfDtafts,
                     drafts: response,
                     nextPage:
                        nextPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public/' +
                        req.params.filmId +
                        '/reviews/' +
                        req.params.reviewId +
                        '/drafts/' +
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
                        req.params.reviewId +
                        '/drafts/' +
                        '?pageNo=' +
                        prevPage,
                  })
               }
            })
            .catch(function (response) {
               if (response == 403) {
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
               } else {
                  utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
               }
            })
      })
      .catch(function (response) {
         utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
      })
}

module.exports.getDraft = function getDraft(req, res, next) {
   Drafts.getDraft(req.params.filmId, req.params.reviewId, req.params.draftId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response)
      })
      .catch(function (response) {
         if (response == 404) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The draft does not exist.' }] },
               404
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
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.createDraft = function createDraft(req, res, next) {
   if (req.params.reviewId != req.body.reviewId) {
      utils.writeJson(
         res,
         {
            errors: [
               {
                  param: 'Server',
                  msg: 'The reviewId field of the draft object is different from the reviewId path parameter.',
               },
            ],
         },
         409
      )
   } else {
      Drafts.createDraft(req.body, req.params.filmId, req.params.reviewId, req.user.id)
         .then(function (response) {
            utils.writeJson(res, response, 201)
         })
         .catch(function (response) {
            if (response == '403A') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The user is not assigned to this review' }] },
                  403
               )
            } else if (response == '403B') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'Another draft has already been opened' }] },
                  403
               )
            } else if (response == '403C') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The review has been already completed' }] },
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
                           msg: 'The review is not a coop one (not the right endpoint)',
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

module.exports.judgeDraft = function judgeDraft(req, res, next) {
   if (req.params.draftId != req.body.draftId) {
      utils.writeJson(
         res,
         {
            errors: [
               {
                  param: 'Server',
                  msg: 'The draftId field of the judgment object is different from the draftId path parameter.',
               },
            ],
         },
         409
      )
   } else {
      if (req.body.agree === undefined) req.body.agree = true
      Drafts.judgeDraft(
         req.body,
         req.params.filmId,
         req.params.reviewId,
         req.params.draftId,
         req.user.id
      )
         .then(function (response) {
            utils.writeJson(res, response, 201)
         })
         .catch(function (response) {
            if (response == '403A') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The user is not assigned to this review' }] },
                  403
               )
            } else if (response == '403B') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The selected draft is closed' }] },
                  403
               )
            } else if (response == '403C') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The review has already been completed' }] },
                  403
               )
            } else if (response == '403D') {
               utils.writeJson(
                  res,
                  { errors: [{ param: 'Server', msg: 'The user has already judged this draft' }] },
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
                           msg: 'The review is not a coop one (not the right endpoint)',
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
