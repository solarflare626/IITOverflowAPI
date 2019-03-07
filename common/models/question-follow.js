'use strict';

module.exports = function(Questionfollow) {
Questionfollow.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Questionfollow.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };
};
