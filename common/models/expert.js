'use strict';

module.exports = function(Expert) {
	Expert.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Expert.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };
};
