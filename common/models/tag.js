'use strict';

module.exports = function(Tag) {
	Tag.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
      
    next();
  });

};
