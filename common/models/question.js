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
        const file = files['file'][0]; // get the file from the returned files object
        if (!file) Promise.reject('File was not found in form data.');
        else resolve(files['file']);
      }
      
    }
  });
});

module.exports = function(Question) {
	Question.beforeCreate = function (next, model) {
    model.createdAt = Date.now();
    next();
  };

 	Question.beforeUpdate = function (next, model) {
    model.updatedAt = Date.now();
    next();
  };

  Question.uploadFile= async(req, id, cb) =>{
    
    //return req.files;
    const files = await getFileFromRequest(req);

    files.forEach(file => {
      console.log(file);
    });

  

    
    return files;
   // cb(req.files[0].file.name);
   /* req.files.file.forEach(element => {
      console.log(JSON.stringify(element));
    });

    cb(JSON.stringify(req.files.file));*/
   /*minioClient.presignedPutObject('files', req.query.name, (err, url) => {
      if (err) cb( err);
      

      cb({"status": url});
  });*/

 
    //cb([req,res]);
      //cb("gaga");
     //ssss cb(req.);
    //return "Error";


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
            type: 'object'
        }
    }
);

  
};
