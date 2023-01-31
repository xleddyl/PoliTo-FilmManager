BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
   id INTEGER NOT NULL,
   email TEXT NOT NULL,
   name TEXT NOT NULL,
   hash TEXT NOT NULL,
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS films (
   id INTEGER NOT NULL,
   title TEXT NOT NULL,
   owner INTEGER NOT NULL,
   private BIT(1) NOT NULL DEFAULT 1,
   watchDate TEXT,
   rating INTEGER CHECK(rating BETWEEN 1 AND 10),
   favorite BIT(1) DEFAULT 0,
   PRIMARY KEY(id),
   FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
   id INTEGER,
   filmId INTEGER NOT NULL,
   completed BIT(1) NOT NULL DEFAULT 0,
   reviewDate TEXT,
   rating INTEGER CHECK(rating BETWEEN 1 AND 10),
   coop BIT(1) NOT NULL DEFAULT 0,
   review VARCHAR(1000),
   PRIMARY KEY(id),
   FOREIGN KEY(filmId) REFERENCES films(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviewers (
   id INTEGER,
   reviewId INTEGER NOT NULL,
   reviewerId INTEGER NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
   FOREIGN KEY(reviewerId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drafts (
   id INTEGER,
   reviewId INTEGER NOT NULL,
   reviewerId INTEGER NOT NULL,
   open BIT(1) NOT NULL,
   proposedRating INTEGER CHECK(proposedRating BETWEEN 1 AND 10) NOT NULL,
   proposedReview VARCHAR(1000) NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
   FOREIGN KEY(reviewerId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS judgments (
   id INTEGER,
   draftId INTEGER NOT NULL,
   reviewerId INTEGER NOT NULL,
   agree BIT(1) NOT NULL DEFAULT 1,
   comment VARCHAR(1000),
   PRIMARY KEY(id),
   FOREIGN KEY(draftId) REFERENCES reviews(id) ON DELETE CASCADE,
   FOREIGN KEY(reviewerId) REFERENCES users(id) ON DELETE CASCADE
);


INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (1, "Your Name", 1, 1, "2021-10-03", 9, 1);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (2, "Heaven's Feel", 2, 0, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (3, "You Can (Not) Redo", 1, 0, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (4, "Weathering with you", 1, 1, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (5, "Aria of a Starless Night", 3, 1, "2022-07-20", 8, 0);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (6, "Spirited Away", 5, 0, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (7, "5 Centimeters Per Second", 5, 0, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (8, "Nausicaa", 5, 1, "2020-03-15", 9, 0);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (9, "The Garden of Words", 1, 0, NULL, NULL, NULL);
INSERT INTO films (id, title, owner, private, watchDate, rating, favorite) VALUES (10, "Paradox Spirital", 4, 1, "2021-12-26", 10, 1);

INSERT INTO users (id, email, name, hash) VALUES (1, "user.dsp@polito.it", "User", "$2a$10$.hw.euW0lGhWtNfigv5U9uEcwc1cfgH3DK7.zReNHPvi5xpJRfPc2");
INSERT INTO users (id, email, name, hash) VALUES (2, "frank.stein@polito.it", "Frank", "$2a$10$YBUtQ7qWvOo9xBuJfLWAkeTHmQHZe0uB0NM/7zAITHCccGVAfOkEm");
INSERT INTO users (id, email, name, hash) VALUES (3, "karen.makise@polito.it", "Karen", "$2a$10$d9pllxqTsXoAXJwE14VzzeJPJc6Z1igrR2/jfa1IQeAb5pNPfYViS");
INSERT INTO users (id, email, name, hash) VALUES (4, "rene.regeay@polito.it", "Rene", "$2a$10$WJcNTzEY1rIePhRVKdfkYeSkVJ20PLMEktgdjVPJq9qUeP1ZdSrPi");
INSERT INTO users (id, email, name, hash) VALUES (5, "beatrice.golden@polito.it", "Beatrice", "$2a$10$wQtLnqD224VS3US.LCrWXOWfASq6PZJHEpViYV6GEKUXWxMZNmSTW");
INSERT INTO users (id, email, name, hash) VALUES (6, "arthur.pendragon@polito.it", "Arthur", "$2a$10$uFVLA5yq4LZTB.gglOqsReDsm.KgeRrhcSy4T45Dlh.yWyR.uYA7a");

INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (1, 2, 1, "2022-03-04", 10, 0, "This film is a perfect conclusion for the trilogy.");
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (2, 3, 1, "2022-01-23", 9, 0, "I appreciated the plot twists, but I did not understand so much the ending. I am eagerly waiting for the sequel.");
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (3, 4, 0, "2020-01-01", NULL, 0, NULL);
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (4, 3, 1, "2022-04-04", 8, 0, "I would have preferred that this film did not adopt the widescreen cinema standard resolution.");
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (5, 2, 1, "2022-04-04", 10, 0, "I could not stop watching until the very end. However, you must watch the prequels before this film to really understand it.");
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (6, 6, 0, NULL, NULL, 0, NULL);
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (7, 7, 1, "2022-03-04", 7, 0, "The ending feels rushed and it should have better explained the life decisions of the characters.");
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (8, 6, 0, NULL, NULL, 0, NULL);
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (9, 9, 0, NULL, NULL, 0, NULL);
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (10, 9, 1, "2022-04-04", 9, 0, "Even if the film is short, it provides a deep characterizaition for the two main characters.");

INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (1, 1, 5);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (2, 2, 1);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (3, 3, 1);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (4, 4, 2);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (5, 5, 2);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (6, 6, 1);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (7, 7, 5);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (8, 8, 5);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (9, 9, 4);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (10, 10, 5);


/* CUSTOM DATA
-- coop review
INSERT INTO reviews (id, filmId, completed, reviewDate, rating, coop, review) VALUES (11, 3, 0, NULL, NULL, 1, NULL);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (11, 11, 1);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (12, 11, 3);
INSERT INTO reviewers (id, reviewId, reviewerId) VALUES (13, 11, 4);
INSERT INTO drafts (id, reviewId, reviewerId, open, proposedRating, proposedReview) VALUES (1, 11, 3, 1, 9, "Wish it was real...");
INSERT INTO judgments (id, draftId, reviewerId, agree, comment) VALUES (1, 1, 3, 1, NULL);
INSERT INTO judgments (id, draftId, reviewerId, agree, comment) VALUES (2, 1, 4, 1, NULL);
*/



COMMIT;