'use strict';

module.exports = function(Interest) {
	Interest.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Interest.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };


};
