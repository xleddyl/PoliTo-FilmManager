const constants = require('../utils/constants')

class Review {
   constructor(id, filmId, reviewers, completed, reviewDate, rating, coop, review) {
      if (id) this.id = id
      this.filmId = filmId
      this.completed = completed === 1 ? true : false
      this.coop = coop === 1 ? true : false
      this.reviewer = undefined
      this.reviewers = undefined

      if (coop) this.reviewers = reviewers
      else this.reviewer = reviewers[0]

      if (reviewDate) this.reviewDate = reviewDate
      if (rating) this.rating = rating
      if (review) this.review = review

      var selfLink =
         constants.SERVER_URL +
         ':' +
         constants.SERVER_PORT +
         '/api/films/public/' +
         this.filmId +
         '/reviews/' +
         this.id
      this.self = selfLink
   }
}

module.exports = Review
