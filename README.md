# DSP Exam Call 1 - Edoardo Alberti (s305922)

The structure of this repository is the following:

- [JSON_Schemas](./JSON_Schemas/) contains the JSON schemas
- [REST_APIs_Design](./REST_APIs_Design/) contains the full Open API documentation of the REST APIs, including examples of JSON documents to be used when invoking the operations in the form of insomnia/postman collections
- [REST_APIs_Implementation](./REST_APIs_Implementation/) contains the code of the Film Manager service application

## Introduction

My solution for this exam call is based on the code provided in [this repository](https://github.com/polito-DSP-2022-23/lab01-json-rest), which is the official solution for [Lab01](./Lab01.pdf).

I've extended the REST APIs, by introducing the possibility to have reviews that must be completed by more than one user in a cooperative way, according to the following specifications (a full and detailed explanation can be found [here](./DSP_20230201.pdf)):

1. When a film owner assigns a review, the review may be assigned either to a single user or to more users, in which case the review is cooperative and the review process follows the specifications provided here
2. An assignee of a cooperative review can create a review draft including a proposed review rating and a proposed review textual description
3. When a draft is created, it is said to be open, and each one of the other co-assignees of the review can express either an agreement or a disagreement on the draft. A disagreement must include a text which expresses the reason for disagreement, while an agreement has no associated text
4. When a draft has received agreement or disagreement from all the review co-assignees, the draft becomes closed, and no additional activity is possible on it
5. Only one draft at a time can be open for each review
6. If a draft gets closed with the agreement of all co-assignees, the corresponding review is automatically and immediately updated, with the rating and review text taken from the draft

## Design choices

The choices that I made are the following:

- Add two new schemas ([draft](./JSON_Schemas/draft.json) and [judgment](./JSON_Schemas/judgment.json)) wich will contain schemas for drafts objects and their relative judgments
- Modify the [review](./JSON_Schemas/review.json) schema in order to have an extra field called `coop` which will indicate if the review is a co-operative one or not. Based on the boolean value of `coop`, `reviewersId` or `reviewerId` will be present in mutual exclusion as a reference to the actual reviewers/reviewer of the review
- Modify the [database](./REST_APIs_Implementation/database/database.sql) in order to decouple the `reviewerId` from the `reviews` table (thus allowing to have multiple reviewers assigned to the same review). I've also added some new constraints in order to facilitate the INSERT and DELETE operations (default values/on delete rules)

## API routes

From lines `118-143` inside [index.js](./REST_APIs_Implementation/index.js) there are the routes of the Film Manager application. I've added comments to indicate the ones that I've created and the ones that I've modified with respect to the provided Lab01 solution

### New

- `GET` `/api/films/public/:filmId/reviews/:reviewId/drafts`
- `GET` `/api/films/public/:filmId/reviews/:reviewId/drafts/:draftId`
- `POST` `/api/films/public/:filmId/reviews/:reviewId/drafts`
- `PUT` `/api/films/public/:filmId/reviews/:reviewId/drafts/:draftId`

### Modified

- `GET` `/api/films/public/invited`
  - implementation
- `GET` `/api/films/public/:filmId/reviews`
  - implementation
- `GET` `/api/films/public/:filmId/reviews/:reviewId`
  - route and implementation
- `POST` `/api/films/public/:filmId/reviews`
  - implementation
- `PUT` `/api/films/public/:filmId/reviews/:reviewId`
  - route and implementation
- `DELETE` `/api/films/public/:filmId/reviews/:reviewId`
  - route and implementation

### Extra

I've also fixed two endpoints:

- `DELETE` `/api/films/public/:filmId`
- `DELETE` `/api/films/private/:filmId`

There was a bug that allowed the user to delete a film regardless of its state (public/private):\
For example we would have been able to delete a private film from `/api/films/public/:filmId`.

Moreover the manual deletion of the eventual associated `reviews` table entry is no longer needed thanks to the introduced constraints.

## Operations example

I will now showcase the new features by performing a sequence of operations on the Film Manager application:

1. **Login**

   - _request_

      `POST /api/users/authenticator?type=login`

      ```json
      {
         "email": "user.dsp@polito.it",
         "password": "password"
      }
      ```

   - _response_

      `200 OK`

      ```json
      {
         "id": 1,
         "name": "User",
         "email": "user.dsp@polito.it"
      }
      ```

2. **Issue a normal and a co-operative film reviews**

   - _request_

      `POST /api/films/public/9/reviews`

      ```json
      [
         {
            "filmId": 9,
            "coop": true,
            "reviewersId": [1, 2]
         },
         {
            "filmId": 9,
            "reviewerId": 3
         }
      ]
      ```

   - _response_

      `201 Created`

      ```json
      [
         {
            "id": 11,
            "filmId": 9,
            "completed": false,
            "coop": false,
            "reviewer": 3,
            "self": "http://localhost:3001/api/films/public/9/reviews/11"
         },
         {
            "id": 12,
            "filmId": 9,
            "completed": false,
            "coop": true,
            "reviewers": [1, 2],
            "self": "http://localhost:3001/api/films/public/9/reviews/12"
         }
      ]
      ```

3. **Open a draft on a review that is not co-op**

   - _request_

      `POST /api/films/public/9/reviews/11/drafts`

      ```json
      {
         "reviewId": 11,
         "reviewerId": 1,
         "proposedRating": 6,
         "proposedReview": "A review that should make sense"
      }
      ```

   - _response_

      `418 I'm a Teapot`

      ```json
      {
         "errors": [
            {
               "param": "Server",
               "msg": "The review is not a coop one (not the right endpoint)"
            }
         ]
      }
      ```

4. **Open a draft on the correct review**

   - _request_

      `POST /api/films/public/9/reviews/12/drafts`

      ```json
      {
         "reviewId": 12,
         "reviewerId": 1,
         "proposedRating": 6,
         "proposedReview": "A comment that should make sense"
      }
      ```

   - _response_

      `201 Created`

5. **User 2 agrees with the newly created draft**

   - _skipped_

6. **Retrieve the draft**

   - _request_

      `GET /api/films/public/9/reviews/12/drafts/1`

   - _response_

      `200 OK`

      ```json
      {
         "id": 1,
         "reviewId": 12,
         "reviewerId": 1,
         "open": false,
         "proposedRating": 6,
         "proposedReview": "A review that should make sense",
         "judgments": [
            {
               "reviewerId": 1,
               "agree": true
            },
            {
               "reviewerId": 2,
               "agree": true
            }
         ],
         "self": "http://localhost:3001/api/films/public/undefined/reviews/12/drafts/1"
      }
      ```

7. **Retrieve the review**

   - _request_

      `GET /api/films/public/9/reviews/12`

   - _response_

      `200 OK`

      ```json
      {
         "id": 12,
         "filmId": 9,
         "completed": true,
         "coop": true,
         "reviewers": [1, 2],
         "reviewDate": "2023-01-20",
         "rating": 6,
         "review": "A review that should make sense",
         "self": "http://localhost:3001/api/films/public/9/reviews/12"
      }
      ```

---

To test the APIs, an Insomnia/Postman collection can be found [here](./REST_APIs_Design/examples/)
