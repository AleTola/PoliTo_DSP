'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');
var constants = require('../utils/constants.js');

module.exports.getFilmReviews = function getFilmReviews (req, res, next) {

    //retrieve a list of reviews
    var numOfReviews = 0;
    var next=0;

    Reviews.getFilmReviewsTotal(req.params.filmId)
        .then(function(response) {
          
            numOfReviews = response;
            Reviews.getFilmReviews(req)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfReviews / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response,
                        next: "/api/films/public/" + req.params.taskId +"?pageNo=" + next
                    });
                }
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });
  
};


module.exports.getSingleReview = function getSingleReview (req, res, next) {

    Reviews.getSingleReview(req.params.filmId, req.params.reviewerId)
        .then(function(response) {
            utils.writeJson(res, response);
        })
        .catch(function(response) {
            if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};


module.exports.deleteSingleReview = function deleteSingleReview (req, res, next) {

  Reviews.deleteSingleReview(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if(response == "403A"){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if(response == "403B"){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so the invitation cannot be deleted anymore.' }], }, 403);
      }
      else if (response == 404){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
};

module.exports.issueFilmReview = function issueFilmReview (req, res, next) {
  var differentFilm = false;
  for(var i = 0; i < req.body.length; i++){
    if(req.params.filmId != req.body[i].filmId){
      differentFilm = true;
    }
  }
  if(differentFilm){
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The filmId field of the review object is different from the filmdId path parameter.' }], }, 409);
  }
  else {
    Reviews.issueFilmReview(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      if(response == 403){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
      }
      else if (response == 409){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user with ID reviewerId does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
  }
};

module.exports.updateSingleReview = function updateSingleReview (req, res, next) {
  
  Reviews.getSingleReview(req.params.filmId, req.params.reviewerId)
    .then(function(response) {
      const completedVar = response.completed ;

      if(req.params.reviewerId != req.user.id)
      {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 400);
      }
      else if(req.body.completed == undefined) 
      {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is absent.' }], }, 400);
      } 
      else if(req.body.completed === false && completedVar === true) 
      {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but the review is already set as completed.' }], }, 400);
      }
      /*
      else if(req.body.completed == true && (req.body.reviewDate == undefined || req.body.rating == undefined || req.body.review == undefined) ) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is true, but the fileds are not all completed.' }], }, 400);
      }
      else if(req.body.completed == false && (req.body.reviewDate != undefined && req.body.rating != undefined && req.body.review != undefined) ) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but the review is completed.' }], }, 400);
      }*/
      else {
        Reviews.updateSingleReview(req.body, req.params.filmId, req.params.reviewerId)
        .then(function(response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function(response) {
            if(response == 403){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
            }
            else if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
      }
  });
};

module.exports.selectFilm = function selectFilm(req, res, next) {
  var userId = req.params.userId;
  var filmId = req.body.id;
  if(filmId == undefined){
    utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': 'Missing filmId'}],}, 400);
  }
  Reviews.selectFilm(userId, filmId)
      .then(function(response) {
            utils.writeJson(res, response, 204);
      })
      .catch(function(response) {
        if(response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
        }
        else if (response == 409){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist 7.' }], }, 409);
        } 
        else {
          utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
        }
      });
};