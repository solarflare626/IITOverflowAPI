'use strict';

module.exports = function(Answerupvote) {
Answerupvote.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

  Answerupvote.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

};
