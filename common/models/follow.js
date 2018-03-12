'use strict';

module.exports = function(Follow) {
	Follow.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Follow.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
