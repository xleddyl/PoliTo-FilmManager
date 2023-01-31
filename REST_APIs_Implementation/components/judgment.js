const constants = require('../utils/constants')

class Judgment {
   constructor(reviewerId, agree, comment) {
      this.reviewerId = reviewerId
      this.agree = agree === 1 ? true : false

      if (comment) this.comment = comment
   }
}

module.exports = Judgment
