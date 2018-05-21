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
module.exports = function(Answer) {
	

  Answer.observe('after save', function(ctx, next) {
    
    //console.log(ctx.instance.user);
    var a = {};
    a.answer = ctx.instance;
     Answer.app.models.user.findById(a.answer.userId, function(findErr, userData) {
      if (findErr)
        return null;

      a.user = userData;
        Answer.app.models.Question.findById(a.answer.questionId, function(findErr, questionData) {
          if (findErr)
            return null;
          a.question = questionData;
          Answer.app.io.of('/notification').emit('newAnswer',a);
          return userData;
        
        });
      return userData;
     
    });
      
    next();
  });

  Answer.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
      
    next();
  });

  Answer.observe('before delete', function(ctx, next) {
    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);
      Answer.find({ where:ctx.where }, function(err, models) {
        console.log('found some answers:', models);
        models.forEach(model => {
          model.comments.destroyAll({}, function(err, info) {
            if (err) console.log("Error",err);
            console.log("Deleted comments",info);
          });
          
        });
        
        // loop through models and delete other things maybe?
      });
    next();
  });

  Answer.uploadFile= async(req, id, cb) =>{
    
    //return req.files;
    
    const files = await getFileFromRequest(req);
    var uploaded = [];
    
    function asyncFunction (file,id, callback) {
      var url = Date.now()+"_"+id+"_"+hash(file)+"_"+ file.originalFilename;  
        
      minioClient.fPutObject('files',url ,file.path, 'application/octet-stream', function(err, etag) {
          
          if(err){
            callback(err);
          }else{
          Answer.app.models.Attachment.create({
              url:url,
              fileType: "Answer",
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

  Answer.remoteMethod(
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
