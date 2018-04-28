'use strict';

module.exports = function(Attachment) {
	Attachment.beforeCreate = function (next, model) {
        model.createdAt = Date.now();
        next();
      };
    
    Attachment.beforeUpdate = function (next, model) {
        model.updatedAt = Date.now();
        next();
      };
};
