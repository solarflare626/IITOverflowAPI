'use strict';

module.exports = function(Questionattachment) {
	Questionattachment.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Questionattachment.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
