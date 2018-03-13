'use strict';

module.exports = function(Questionupvote) {
	Questionupvote.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Questionupvote.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
