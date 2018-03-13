'use strict';

module.exports = function(Answer) {
	Answer.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Answer.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
