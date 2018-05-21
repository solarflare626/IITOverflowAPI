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


module.exports = function(Question) {


  Question.observe('after save', function(ctx, next) {
    var q = {};
    q.question = ctx.instance;
     Question.app.models.user.findById(q.question.userId, function(findErr, userData) {
      if (findErr)
        return null;

      // Here you can do something with the user info, or the token, or both


      //console.log(userData);
      // Return the access token
      q.user = userData;
      Question.app.io.of('/notification').emit('newQuestion',q);
      return userData;
     
    });
      
    next();
  });

  Question.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
      
    next();
  });
  Question.observe('before delete', function(ctx, next) {
    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);
      Question.find({ where:ctx.where }, function(err, models) {
        console.log('found some questions:', models);
        models.forEach(model => {
          model.answers.destroyAll({}, function(err, info) {
            if (err) console.log("Error",err);
            console.log("deleted answers",info);
          });
          
        });
        
        // loop through models and delete other things maybe?
      });
    next();
  });
  




  Question.uploadFile= async(req, id, cb) =>{
    
    //return req.files;
    
    const files = await getFileFromRequest(req);
    var uploaded = [];
    
    function asyncFunction (file,id, callback) {
      var url = Date.now()+"_"+id+"_"+hash(file)+"_"+ file.originalFilename;  
        
      minioClient.fPutObject('files',url ,file.path, 'application/octet-stream', function(err, etag) {
          
          if(err){
            callback(err);
          }else{
          Question.app.models.Attachment.create({
              url:url,
              fileType: "Question",
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

  Question.remoteMethod(
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
