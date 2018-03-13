'use strict';

module.exports = function(Questiontag) {
	Questiontag.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Questiontag.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
