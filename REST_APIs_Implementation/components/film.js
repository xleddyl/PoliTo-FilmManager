const constants = require('../utils/constants')

class Film {
   constructor(id, title, owner, privateFilm, watchDate, rating, favorite) {
      if (id) this.id = id

      this.title = title
      this.owner = owner
      this.private = privateFilm === 1 ? true : false

      if (watchDate) this.watchDate = watchDate
      if (rating) this.rating = rating
      if (favorite) this.favorite = favorite === 1 ? true : false

      var selfLink = privateFilm
         ? constants.SERVER_URL + ':' + constants.SERVER_PORT + '/api/films/private/' + this.id
         : constants.SERVER_URL + ':' + constants.SERVER_PORT + '/api/films/public/' + this.id
      this.self = selfLink
   }
}

module.exports = Film
