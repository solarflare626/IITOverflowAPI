'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
  
  
};
module.exports = function(app) {
	var mysqlDs = app.dataSources.mysqlIDs;
  var user= app.models.user;
  var CustomToken= app.models.CustomToken;
  var Category= app.models.Category;
  var Tag= app.models.Tag;
  var Follow= app.models.Follow;
  var Question= app.models.Question;
  var Answer= app.models.Answer;
  var Comment =app.models.Comment;

  var AnswerDownvote =app.models.AnswerDownvote;
  var AnswerUpvote =app.models.AnswerUpvote;
  var Conversation=app.models.Conversation;
  var Expert =app.models.Expert;
  var Interest =app.models.Interest;
  var Message=app.models.Message;
  var QuestionDownvote =app.models.QuestionDownvote;
  var QuestionUpvote =app.models.QuestionUpvote;
  var QuestionFollow=app.models.QuestionFollow;
  var QuestionTag=app.models.QuestionTag;
  var Notification=app.models.Notification;


  var lbTables = ['Notification','user', 'Follow', 'Category', 'Tag','Question','CustomToken','Answer','Comment','AnswerDownvote','AnswerUpvote','Conversation','Expert','Interest','Message','QuestionDownvote','QuestionUpvote','QuestionFollow','QuestionTag'];
  mysqlDs.autoupdate(lbTables, function(er) {
    if (er) throw er;
    
      
      for (var table in lbTables) {
        console.log('\nAutoupdated table '+ lbTables[table]+ '.');
      }
    //mysqlDs.disconnect();
  });

  delete app.models.user.validations.password;
  delete app.models.user.validations.username;
  
};