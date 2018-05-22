'use strict';

module.exports = function(Participant) {
    Participant.observe('before save', function(ctx, next) {
        if (ctx.instance) {
          ctx.instance.created_at = new Date();
          ctx.instance.last_read = new Date();
        } else {
          ctx.data.created_at = new Date();
          
        }
          
        next();
      });

};
