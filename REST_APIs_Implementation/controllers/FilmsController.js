'use strict'

const utils = require('../utils/writer.js')
const Films = require('../service/FilmsService')
const constants = require('../utils/constants.js')

module.exports.getPublicFilms = function getPublicFilms(req, res, next) {
   let numOfFilms = 0
   let nextPage = 0
   let prevPage = 0

   Films.getPublicFilmsTotal()
      .then(function (response) {
         numOfFilms = response
         Films.getPublicFilms(req)
            .then(function (response) {
               if (req.query.pageNo == null) var pageNo = 1
               else var pageNo = req.query.pageNo
               var totalPage = Math.ceil(numOfFilms / constants.OFFSET)
               nextPage = Number(pageNo) + 1 > totalPage ? undefined : Number(pageNo) + 1
               prevPage = Number(pageNo) - 1 <= 0 ? undefined : Number(pageNo) - 1
               if (pageNo > totalPage || pageNo < 0) {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: {},
                  })
               } else {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: response,
                     nextPage:
                        nextPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
                        nextPage,
                     prevPage:
                        prevPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
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

module.exports.getInvitedFilms = function getInvitedFilms(req, res, next) {
   let numOfFilms = 0
   let nextPage = 0
   let prevPage = 0

   Films.getInvitedFilmsTotal(req.user.id)
   .then(function (response) {
         numOfFilms = response
         Films.getInvitedFilms(req)
            .then(function (response) {
               if (req.query.pageNo == null) var pageNo = 1
               else var pageNo = req.query.pageNo
               var totalPage = Math.ceil(numOfFilms / constants.OFFSET)
               nextPage = Number(pageNo) + 1 > totalPage ? undefined : Number(pageNo) + 1
               prevPage = Number(pageNo) - 1 <= 0 ? undefined : Number(pageNo) - 1
               if (pageNo > totalPage || pageNo < 0) {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: {},
                  })
               } else {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: response,
                     nextPage:
                        nextPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
                        nextPage,
                     prevPage:
                        prevPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
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

module.exports.getPrivateFilms = function getPrivateFilms(req, res, next) {
   let numOfFilms = 0
   let nextPage = 0
   let prevPage = 0

   Films.getPrivateFilmsTotal(req.user.id)
      .then(function (response) {
         numOfFilms = response
         Films.getPrivateFilms(req)
            .then(function (response) {
               if (req.query.pageNo == null) var pageNo = 1
               else var pageNo = req.query.pageNo
               var totalPage = Math.ceil(numOfFilms / constants.OFFSET)
               nextPage = Number(pageNo) + 1 > totalPage ? undefined : Number(pageNo) + 1
               prevPage = Number(pageNo) - 1 <= 0 ? undefined : Number(pageNo) - 1
               if (pageNo > totalPage || pageNo < 0) {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: {},
                  })
               } else {
                  utils.writeJson(res, {
                     totalPages: totalPage,
                     currentPage: pageNo,
                     totalItems: numOfFilms,
                     films: response,
                     nextPage:
                        nextPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
                        nextPage,
                     prevPage:
                        prevPage === undefined ?
                        undefined :
                        constants.SERVER_URL +
                        ':' +
                        constants.SERVER_PORT +
                        '/api/films/public?pageNo=' +
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

module.exports.createFilm = function createFilm(req, res, next) {
   var film = req.body
   var owner = req.user.id
   Films.createFilm(film, owner)
      .then(function (response) {
         utils.writeJson(res, response, 201)
      })
      .catch(function (response) {
         utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
      })
}

module.exports.getPrivateFilm = function getPrivateFilm(req, res, next) {
   Films.getPrivateFilm(req.params.filmId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response)
      })
      .catch(function (response) {
         if (response == 403) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The user is not the owner of the film.' }] },
               403
            )
         } else if (response == 404) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.updatePrivateFilm = function updatePrivateFilm(req, res, next) {
   Films.updatePrivateFilm(req.body, req.params.filmId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response, 204)
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
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else if (response == 409) {
            utils.writeJson(
               res,
               {
                  errors: [
                     { param: 'Server', msg: 'The visibility of the film cannot be changed.' },
                  ],
               },
               409
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.deletePrivateFilm = function deletePrivateFilm(req, res, next) {
   Films.deletePrivateFilm(req.params.filmId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response, 204)
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
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else if (response == 409) {
            utils.writeJson(
               res,
               {
                  errors: [
                     { param: 'Server', msg: 'The visibility of the film cannot be changed.' },
                  ],
               },
               409
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.getPublicFilm = function getPublicFilm(req, res, next) {
   Films.getPublicFilm(req.params.filmId)
      .then(function (response) {
         utils.writeJson(res, response)
      })
      .catch(function (response) {
         if (response == 404) {
            utils.writeJson(
               res,
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.updatePublicFilm = function updatePublicFilm(req, res, next) {
   Films.updatePublicFilm(req.body, req.params.filmId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response, 204)
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
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}

module.exports.deletePublicFilm = function deletePublicFilm(req, res, next) {
   Films.deletePublicFilm(req.params.filmId, req.user.id)
      .then(function (response) {
         utils.writeJson(res, response, 204)
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
               { errors: [{ param: 'Server', msg: 'The film does not exist.' }] },
               404
            )
         } else {
            utils.writeJson(res, { errors: [{ param: 'Server', msg: response }] }, 500)
         }
      })
}
