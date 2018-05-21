'use strict';

const CLIENT_ID = '976545483152-vsg906t0vnk04b5gra3861c98jqi7hcq.apps.googleusercontent.com';
const {
    OAuth2Client
} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);



async function verify(myIdToken) {
    const ticket = await client.verifyIdToken({
        idToken: myIdToken,
        audience: ['976545483152-sl04nepnigt5mi15g5ahkqrholfiprjk.apps.googleusercontent.com',
            '976545483152-sqe7ionbfs9t8jnq8a6mrnvclsdsg222.apps.googleusercontent.com',
            '976545483152-3u1fctn90tf0qvjevud1hkfu3jdneog0.apps.googleusercontent.com',
            '976545483152-fhtdk4qhsb5akkuakilskicqkpiap77i.apps.googleusercontent.com',
            '976545483152-vsg906t0vnk04b5gra3861c98jqi7hcq.apps.googleusercontent.com',
            '976545483152-dfnc1ma10h0umdfrrchdkqgmsmat2j8j.apps.googleusercontent.com'
        ],
         // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]

    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    

    return payload;
    //return callback(userid);
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
}


var Minio = require("minio");
const multiparty = require('multiparty');
var minioClient = new Minio.Client({
  endPoint: '128.199.115.0',
  port: 9000,
  secure: false,
  accessKey: 'OWI7D81ET1SIFG3C2S9M',
  secretKey: 'T8/j4VMAAm6vpJSfhwN9YK18vHLnQG3XiAMXyJcE'
});

var minioUrl= 'http://128.199.115.0:9000';
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

module.exports = function(User) {


    User.observe('before save', function(ctx, next) {
        if (ctx.instance) {
          ctx.instance.createdAt = new Date();
        } else {
          ctx.data.updatedAt = new Date();
        }
          
        next();
      });
    User.updateProfile= async(req, id, cb) =>{
        
        const files = await getFileFromRequest(req);
        var uploaded;
        
        function asyncFunction (file,id, callback) {
          var url = Date.now()+"_"+id+"_"+hash(file)+"_"+ file.originalFilename;  
            
          minioClient.fPutObject('profile',url ,file.path, 'application/octet-stream', function(err, etag) {
              
              if(err){
                callback(err);
              }else{
                User.upsertWithWhere({
                    'id': id
                }, {
                    picture: minioUrl+ '/profile/' + url
                }).then( function(user) {
                    //uploaded.push(user);
                    uploaded = user;
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
           return uploaded;
        });
    
      }
    
      User.remoteMethod(
        'updateProfile', {
            http: {
                path: '/:id/updateProfile',
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

    User.uploadProfilePic = function(ctx,options, id, cb) {
    	if(!options) options = {};
        	ctx.req.params.container = 'profile';
       /*	User.app.models.container.createContainer({"name":"profile"}, function(err1, fileObj2) {
       			console.log("asdfs");

       	});*/
        User.app.models.container.upload(ctx.req,ctx.result,options, function(err, fileObj) {

            if (err) {
                cb(err);
            } else {

                var fileInfo = fileObj.files.file[0];

                User.upsertWithWhere({
                    'id': id
                }, {
                    picture: "api/containers/profile/download/" + fileInfo.name
                }, function(err, obj) {
                    if (err !== null) {
                        cb(err);
                    } else {
                        cb(null, obj);
                    }
                });
            }
        });




        return "callback('findErr')";

    }
    
    User.remoteMethod(
        'uploadProfilePic', {
            http: {
                path: '/:id/uploadProfilePic',
                verb: 'post'
            },
            accepts: [{
                arg: 'ctx',
                type: 'object',
                http: {
                    source: 'context'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: {
                    source: 'query'
                }
            }, {
                arg: 'id',
                type: 'string'
            }],
            returns: {
                arg: 'status',
                type: 'string'
            }
        }
    );
    User.addToLogin = function(credentials, include, callback) {




       // console.log("IDTOKEN: ", credentials.idToken);

        verify(credentials.idToken).then(data => {
            if(!data.hd || data.hd != "g.msuiit.edu.ph"){
                var error = new Error("Must use msuiit google suite domain");
                error.status = 403;
                return callback(error);

            }

           // console.log("Data", data);

            var account = {
                "email": data.email,
                "password": "secret",
                "displayname": data.name,
                picture: data.picture
            }
            User.findOrCreate({
                where: {
                    email: account.email
                }
            }, account, function(findErr, userData) {
                if (findErr)
                    return callback(findErr);



                //console.log("exists");
                return User.login(account, include, function(loginErr, loginToken) {
                    if (loginErr)
                        return callback(loginErr);
                    /* If we got to this point, the login call was successfull and we
                     * have now access to the token generated by the login function.
                     *
                     * This means that now we can add extra logic and manipulate the
                     * token before returning it. Unfortunately, the login function
                     * does not return the user data, so if we need it we need to hit
                     * the datasource again to retrieve it.
                     */

                    // If needed, here we can use loginToken.userId to retrieve
                    // the user from the datasource
                    return User.findById(loginToken.userId, function(findErr, userData) {
                        if (findErr)
                            return callback(findErr);

                        // Here you can do something with the user info, or the token, or both

                        // Return the access token
                        return callback(null, loginToken.toObject());
                    });
                });

                // Here you can do something with the user info, or the token, or both

                // Return the access token

                //return callback(null, loginToken.toObject());
            });

            // Invoke the default login function


        }).catch(error => {

            return callback(error);
        });




    };

    /** Register a path for the new login function
     */
    User.remoteMethod('addToLogin', {
        'http': {
            'path': '/OAuthLogin',
            'verb': 'post'
        },
        'accepts': [{
            'arg': 'credentials',
            'type': 'object',
            'description': 'Login credentials',
            'required': true,
            'http': {
                'source': 'body'
            }
        }, {
            'arg': 'include',
            'type': 'string',
            'description': 'Related objects to include in the response. See the description of return value for more details.',
            'http': {
                'source': 'query'
            }
        }],
        'returns': [{
            'arg': 'token',
            'type': 'object',
            'root': true
        }]
    });



    User.followable = function(ctx, id, cb) {
        User.findById(id,{
            include: {
              relation: 'interests'
            }
          }, function(findErr, userData) {
            if (findErr)
                return cb(findErr);



            // Here you can do something with the user info, or the token, or both

            // Return the access token
            
             var interests =[] ;

             userData.toJSON().interests.forEach(element => {
                interests.push(element.id);
            });
            
            

             var q = "select user.displayname,user.id, user.picture from interest join user on interest.userId=user.id  where user.id!="+id+" and interest.categoryId in ("+interests+") group by user.id";
             User.dataSource.connector.query(q, interests,  function (err, users) {

                if (err) console.error(err);
    
                return cb(err, users);
    
            });

             

        });


        
        
        

       
    }
    
    User.remoteMethod(
        'followable', {
            http: {
                path: '/:id/followable',
                verb: 'get'
            },
            accepts: [{
                arg: 'ctx',
                type: 'object',
                http: {
                    source: 'context'
                }
            }, {
                arg: 'id',
                type: 'string'
            }],
            returns: { 
                root : true,
                type: 'Array'
            }
        }
    );
};