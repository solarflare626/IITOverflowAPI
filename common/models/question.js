'use strict';

module.exports = function(Question) {
	Question.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

 	Question.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };
};
