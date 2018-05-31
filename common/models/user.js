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

                console.log(userData);



            // Here you can do something with the user info, or the token, or both

            // Return the access token
            
             var interests =[] ;

             userData.toJSON().interests.forEach(element => {
                interests.push(element.id);
            });
            
            

             var q = "select public.user.displayname, public.user.email,public.user.id, public.user.picture from interest join public.user on interest.userId=public.user.id  where public.user.id!="+id+" and interest.categoryId in ("+interests+") group by public.user.id order by public.user.displayname ASC;";
            // q = "SELECT table_schema || '.' || table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema');";
            // q = "Select * from public.user";
           
             User.dataSource.connector.query(q, [],  function (err, users) {

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

    User.chatlist= function(req, id, cb){
        
       var q =  "SELECT (Select updatedAt from conversation where conversation.id = me.conversationId) as last_activity,(Select message from message where conversationId = me.conversationId order by created_at desc limit 1) as lastmessage,(Select CAST(count(*) AS INTEGER) from message as m where m.conversationId = me.conversationId and m.created_at > me.last_read and m.senderId != me.userId ) as unread,me.conversationId as id,other.userId,u.displayname, u.picture as profilePic FROM participant as me join participant as other on other.conversationId = me.conversationId  join public.user as u on u.id = other.userId where me.userId = "+id+" and other.userId != "+id+" order by last_activity DESC";
    
       User.dataSource.connector.query(q, [],  function (err, users) {

        if (err){ console.error(err)
            return cb(err);
        }
        else{
            users.forEach(element => {
                element.id = "solo_"+element.id;
                if(User.app.userSockets["user_" + element.userid]){
                    if(User.app.userSockets["user_" + element.userid].length != 0){
                        console.log("online")
                        element.online = true;
                     } else{
                         console.log("offline 1");
                        element.online = false;
                     }
                }else{
                    console.log("offline 2");
                    element.online = false;
                }
            });
        return cb(null,users);
        }

        });
    
    }
    
      User.remoteMethod(
        'chatlist', {
            http: {
                path: '/:id/chatlist',
                verb: 'get'
            },
              accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}},
            {arg: 'id', type: 'string'}],
            returns: {
                root : true,
                type: 'Array'
            }
        }
    );

    User.getConvo= function(req, id,convoId, cb){
        
       // var q =  "SELECT (Select message from message where conversationId = me.conversationId order by created_at desc limit 1) as lastmessage,(Select CAST(count(*) AS INTEGER) from message as m where m.conversationId = me.conversationId and m.created_at > me.last_read and m.senderId != me.userId ) as unread,me.conversationId as id,other.userId,u.displayname, u.picture as profilePic FROM participant as me join participant as other on other.conversationId = me.conversationId  join public.user as u on u.id = other.userId where me.userId = "+id+" and other.userId != "+id+"";
        var q = "select message.*,u.picture, u.displayname from message join public.user as u on u.id = senderId where conversationId="+convoId+" order by message.created_at ASC";
        User.dataSource.connector.query(q, [],  function (err, users) {
 
         if (err) {console.error(err);
            cb(err);
        }
 
         User.app.models.Participant.upsertWithWhere({
            'userId': id,
            'conversationId': convoId
          }, {
            last_read: new Date()
          }, function (err, obj) {
    
            return cb(null,users);
           
          });
         
 
         });
     
     }
     
       User.remoteMethod(
         'getConvo', {
             http: {
                 path: '/:id/conversation/:convoId',
                 verb: 'get'
             },
               accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}},
             {arg: 'id', type: 'string'},{arg: 'convoId', type: 'string'}],
             returns: {
                 root : true,
                 type: 'Array'
             }
         }
     );

     User.sendMessage= function(msg, id,convoId, cb){
        // console.log(msg);

         User.app.models.Message.create({conversationId:convoId,senderId:id,message:msg},function(err,model){
             if(err){
                 return cb(err);
             }
            
           //  console.log(model);
             return cb(null,model);
         });
      
      }
      
        User.remoteMethod(
          'sendMessage', {
              http: {
                  path: '/:id/conversation/:convoId',
                  verb: 'post'
              },
                accepts: [{arg: 'msg', type: 'string'},
              {arg: 'id', type: 'string'},{arg: 'convoId', type: 'string'}],
              returns: {
                  root : true,
                  type: 'object'
              }
          }
      );

      User.getNotifications= function(req, id, cb){
        
        // var q =  "SELECT (Select message from message where conversationId = me.conversationId order by created_at desc limit 1) as lastmessage,(Select CAST(count(*) AS INTEGER) from message as m where m.conversationId = me.conversationId and m.created_at > me.last_read and m.senderId != me.userId ) as unread,me.conversationId as id,other.userId,u.displayname, u.picture as profilePic FROM participant as me join participant as other on other.conversationId = me.conversationId  join public.user as u on u.id = other.userId where me.userId = "+id+" and other.userId != "+id+"";
         //var q = "select message.*,u.picture, u.displayname from message join public.user as u on u.id = senderId where conversationId="+convoId+" order by message.created_at ASC";
         User.findById(id,{include:[{relation: "following"},{relation:"interests"},{relation:"questionsfollowed"}]},function(err,me){
            var followed_users = [];
            var followed_questions = [];
            var interests = [];
            me = me.toJSON();

            if(Array.isArray(me.following)) {

                me.following.forEach(element => {
                    followed_users.push(element.id);
                });
                

            }
            if(Array.isArray(me.interests)) {
                me.interests.forEach(element => {
                    interests.push(element.id);
                });

            }
            if(Array.isArray(me.questionsfollowed)) {
                me.questionsfollowed.forEach(element => {
                    followed_questions.push(element.id);
                });

            }
           //return cb(null,interests);
       // var q = "select notif.id from notification as notif full join answer on (answer.id = notif.answerId) full join comment on (comment.id = notif.commentId) full join question on (question.id = notif.questionId) where notif.userId != 9 and ( (notif.type = 'newQuestion' and (question.userId in (1,2) or question.categoryId in(11,29))) or (notif.type = 'newAnswer' and(question.userId = 9 or question.id in (28))) or (notif.type = 'newComment' and (answer.userId =9))) order by notif.createdAt DESC"
        var q = "select notif.id from notification as notif full join answer on (answer.id = notif.answerId) full join comment on (comment.id = notif.commentId) full join question on (question.id = notif.questionId) where notif.userId != " +id+" and ";
        q+= "( (notif.type = 'newQuestion' and (question.categoryId in("+interests.toString()+") " +(followed_users.length > 0 ?"or question.userId in ("+followed_users.toString()+")": "")+" )) or (notif.type = 'newAnswer' and(question.userId = "+id+" "+(followed_questions.length > 0 ? "or question.id in ("+followed_questions.toString()+")" : "")+ ")) or (notif.type = 'newComment' and (answer.userId ="+id+"))) order by notif.createdAt DESC";
         
         User.dataSource.connector.query(q, [],  function (err, temp_notifications) {
  
          if (err) {console.error(err);
             cb(err);
         }
            
            var notifId = [];
            if(Array.isArray(temp_notifications)) {
                temp_notifications.forEach(element => {
                    notifId.push(element.id);
                });
                User.app.models.Notification.find({where:{id:{inq:notifId}},include:[{relation:"user"},{relation:"answer"},{relation:"comment"},{relation:"question"}]},function(err,notifs){
                    return cb(null,notifs);
                });
            
            }
            
           
          
  
          });
        });
      
      }
      
        User.remoteMethod(
          'getNotifications', {
              http: {
                  path: '/:id/notifications',
                  verb: 'get'
              },
                accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}},
              {arg: 'id', type: 'string'}],
              returns: {
                  root : true,
                  type: 'Array'
              }
          }
      );

      User.leaderboard= function(req, cb){
        
        // var q =  "SELECT (Select message from message where conversationId = me.conversationId order by created_at desc limit 1) as lastmessage,(Select CAST(count(*) AS INTEGER) from message as m where m.conversationId = me.conversationId and m.created_at > me.last_read and m.senderId != me.userId ) as unread,me.conversationId as id,other.userId,u.displayname, u.picture as profilePic FROM participant as me join participant as other on other.conversationId = me.conversationId  join public.user as u on u.id = other.userId where me.userId = "+id+" and other.userId != "+id+"";
         //var q = "select message.*,u.picture, u.displayname from message join public.user as u on u.id = senderId where conversationId="+convoId+" order by message.created_at ASC";
        var q = "Select u.displayname, u.id, u.email,u.picture, (Select count(*) from answerupvote as ansu join answer as ans on(ansu.answerId=ans.id) where ans.userId=u.id) as points from public.user as u order by points DESC";
         User.dataSource.connector.query(q, [],  function (err, users) {
  
          if (err) {console.error(err);
             return cb(err);
         }
  
         
             return cb(null,users);
            
           
          
  
          });
      
      }
      
        User.remoteMethod(
          'leaderboard', {
              http: {
                  path: '/leaderboard',
                  verb: 'get'
              },
                accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}}],
              returns: {
                  root : true,
                  type: 'Array'
              }
          }
      );

      
};