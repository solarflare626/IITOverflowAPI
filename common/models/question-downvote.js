'use strict';

module.exports = function(Questiondownvotes) {
	Questiondownvotes.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
      
    next();
  });

};
