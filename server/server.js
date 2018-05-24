'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();
//require('loopback-counts-mixin')(app);
app.use(loopback.token({
  model: app.models.CustomToken
}));

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');

    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });




};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.



boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    //app.start();
    app.io = require('socket.io')(app.start());
    app.userSockets = {};
    var userSockets = app.userSockets;
    app.io.of('/chat').on('connection', function(socket){
        socket.on('connected', function (user) {
        console.log("user " + user.id + " has connected");

        socket.userId = user.id;
        if (userSockets["user_" + user.id]) {
          userSockets["user_" + user.id].push(socket);
        } else {
          userSockets["user_" + user.id] = [];
          userSockets["user_" + user.id].push(socket);
        }
        console.log( userSockets["user_" + user.id].length);

      });

      socket.on('messageSent', function (data) {
        console.log(data);
        socket.broadcast.emit('message', data);
      });
      socket.on('disconnect', function () {
        if (userSockets["user_" + socket.userId]) {
          console.log("a user has disconnected", socket.userId);
          var index = userSockets["user_" + socket.userId].indexOf(socket);

          userSockets["user_" + socket.userId].splice(index, 1);


        }
      });
      
      
  });


    app.io.of('/notification').on('connection', function (socket) {
      socket.on('postQuestion', function (data) {
        console.log("new Question emitted");
        socket.broadcast.emit('newQuestion', data);
      });

      socket.on('postAnswer', function (data) {
        socket.broadcast.emit('newAnswer', data);
      });


      socket.on('postComment', function (data) {
        socket.broadcast.emit('newComment', data);
      });

      
    });

  }
});
