'use strict';

module.exports = function(Questiondownvotes) {
	Questiondownvotes.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Questiondownvotes.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
