'use strict';

module.exports = function (Message) {
  Message.observe('before save', function (ctx, next) {
    if (ctx.instance) {
      ctx.instance.created_at = new Date();
    } else {
      ctx.data.created_at = new Date();
    }



    next();
  });
  Message.observe('after save', function (ctx, next) {
    if (ctx.instance) {


      Message.app.models.Conversation.upsertWithWhere({
        'id': ctx.instance.conversationId
      }, {
        updatedAt: new Date()
      }, function (err, obj) {

        next();
       
      });


    }

    
  });
};
