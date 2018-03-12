'use strict';

module.exports = function(Category) {
	Category.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Category.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
