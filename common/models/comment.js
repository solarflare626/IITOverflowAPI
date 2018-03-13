'use strict';

module.exports = function(Comment) {
	Comment.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Comment.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
