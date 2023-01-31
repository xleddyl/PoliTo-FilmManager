const constants = require('../utils/constants')

class Draft {
   constructor(id, reviewId, reviewerId, open, proposedRating, proposedReview, judgments) {
      if (id) this.id = id

      this.reviewId = reviewId
      this.reviewerId = reviewerId
      this.open = open === 1 ? true : false
      this.proposedRating = proposedRating
      this.proposedReview = proposedReview

      if(judgments.length !== 0) this.judgments = judgments

      var selfLink =
         constants.SERVER_URL +
         ':' +
         constants.SERVER_PORT +
         '/api/films/public/' +
         this.filmId +
         '/reviews/' +
         this.reviewId +
         '/drafts/' +
         this.id
      this.self = selfLink
   }
}

module.exports = Draft
