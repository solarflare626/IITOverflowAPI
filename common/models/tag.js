'use strict';

module.exports = function(Tag) {
	Tag.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Tag.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
