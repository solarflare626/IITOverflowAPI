'use strict';

var Minio = require("minio");
var minioClient = new Minio.Client({
  endPoint: '128.199.115.0',
  port: 9000,
  secure: true,
  accessKey: 'OWI7D81ET1SIFG3C2S9M',
  secretKey: 'T8/j4VMAAm6vpJSfhwN9YK18vHLnQG3XiAMXyJcE'
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

  Question.uploadFile= function(req, res, id, cb) {
    
    

 
    cb([req,res]);


    return "Error";


  }

  Question.remoteMethod(
    'uploadFile', {
        http: {
            path: '/:id/uploadFile',
            verb: 'post'
        },
        accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}},
        {arg: 'id', type: 'string'}],
        returns: {
            arg: 'status',
            type: 'string'
        }
    }
);

  
};
