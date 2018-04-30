'use strict';

module.exports = function(Answerdownvote) {
	Answerdownvote.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Answerdownvote.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };
 
};
