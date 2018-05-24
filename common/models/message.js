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
       Message.findById(ctx.instance.id,function(err,model){

        Message.app.models.user.findById(ctx.instance.senderId,function(err,user){
          var q = {};
          q.message = model;
          q.user = user;
          delete q.user.password;
          Message.app.models.Participant.findOne({where:{and:[{conversationId:q.message.conversationId},{userId:{neq:q.message.senderId}}]}},function (err, users) {

            console.log("users:",users);
            if(err){
              console.log(err);
              next();
            }else{
            var a = {};
            a.user = JSON.parse(users);
             console.log("userId",a.user);
             Message.app.userSockets["user_" + a.user.userId].forEach(element => {
               console.log("sending to ",a.user.userId);
               Message.app.io.of('/chat').to(element.id).emit('message',q);
               
             
             });
            }
            
          });
          /*Message.app.models.Participant.find({where:{conversationId:q.message.conversationId}},function (err, users) {
            if(err){
              console.log(err);
              next();
            }else{
            var a = {};
            a.user = JSON.parse(users);
             console.log("userId",a.user);
             /*Message.app.userSockets["user_" + a.user.userid].forEach(element => {
               console.log("sending to ",a.user.userid);
               Message.app.io.of('/chat').to(element.id).emit('message',q);
               
             
             });}
             next();
          });*/
  
         
          
          
        

        });
        
       });

        
       
      });


    }

    
  });
};
