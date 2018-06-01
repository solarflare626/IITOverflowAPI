'use strict';
var Minio = require("minio");
const multiparty = require('multiparty');
var minioClient = new Minio.Client({
  endPoint: '128.199.115.0',
  port: 9000,
  secure: false,
  accessKey: 'OWI7D81ET1SIFG3C2S9M',
  secretKey: 'T8/j4VMAAm6vpJSfhwN9YK18vHLnQG3XiAMXyJcE'
});

var hash = require('object-hash');


/**
 * Helper method which takes the request object and returns a promise with a file.
 */
const getFileFromRequest = (req) => new Promise((resolve, reject) => {
  const form = new multiparty.Form();
  form.parse(req, (err, fields, files) => {
    if (err) reject(err);
    if(typeof files == "undefined")reject('File was not found in form data.');
    else{
      if(typeof files['file'] == "undefined") reject('File was not found in form data.');
      else{
        /*const file = files['file'][0]; // get the file from the returned files object
        if (!file) Promise.reject('File was not found in form data.');*/
         resolve(files['file']);
      }
      
    }
  });
});
module.exports = function(Comment) {
	Comment.observe('after save', function(ctx, next) {
    
    //console.log(ctx.instance.user);
    var c = {};
    c.comment = ctx.instance;
     Comment.app.models.user.findById(c.comment.userId, function(findErr, userData) {
      if (findErr)
        return null;

      c.user = userData;
      Comment.app.models.Answer.findById(c.comment.answerId, function(findErr, answerData) {
        if (findErr)
          return null;
        c.answer = answerData;
        Comment.app.models.Question.findById(c.answer.questionId, function(findErr, questionData) {
          if (findErr)
            return null;

          c.question = questionData;

          Comment.app.models.Notification.create({type:"newComment",commentId:c.comment.id,answerId:c.comment.answerId,questionId:c.answer.questionId,userId:c.comment.userId},function(err,model){
            if(err){
                return next(err);
            }
           
            Comment.app.io.of('/notification').emit('newComment',c);
              
              return model;
              
          });
          
          return questionData;
        
        });
        
        return userData;
      
      });

        
      return userData;
     
    });
      
    next();
  });

  Comment.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
      
    next();
  });
  Comment.observe('before delete', function(ctx, next) {
    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);
      Comment.find({ where:ctx.where }, function(err, models) {
        console.log('found some answers:', models);
        models.forEach(model => {

          Comment.app.models.Notification.destroyAll({commentId: model.id},function(err, deleted) {
            if (err) console.log("Error",err);
            console.log("Deleted Comment notifications",deleted);

          });
          
        });
        
        // loop through models and delete other things maybe?
      });
    next();
  });
  Comment.uploadFile= async(req, id, cb) =>{
    
    //return req.files;
    
    const files = await getFileFromRequest(req);
    var uploaded = [];
    
    function asyncFunction (file,id, callback) {
      var url = Date.now()+"_"+id+"_"+hash(file)+"_"+ file.originalFilename;  
        
      minioClient.fPutObject('files',url ,file.path, 'application/octet-stream', function(err, etag) {
          
          if(err){
            callback(err);
          }else{
          Comment.app.models.Attachment.create({
              url:url,
              fileType: "Comment",
              fileId:id
          }).then( function(attachment) {
            uploaded.push(attachment);
            callback();
          });
          }
      });
        
        
      
    }
    let uploads = files.map((file)=>{
      return new Promise((resolve) => {
        asyncFunction(file,id, resolve);
      });
    })

    return await Promise.all(uploads).then(() => {
      //console.log(uploaded);
       return uploaded;
    });

  }

  Comment.remoteMethod(
    'uploadFile', {
        http: {
            path: '/:id/uploadFile',
            verb: 'post'
        },
          accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'id', type: 'string'}],
        returns: {
            root : true,
            type: 'array'
        }
    }
);
};
