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
  var lbTables = ['user', 'Follow', 'Category', 'Tag','Question','CustomToken'];
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