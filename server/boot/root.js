'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
  
  
};
module.exports = function(app) {
	var mysqlDs = app.dataSources.mysqlIDs;
  var User= app.models.user;
  var Category= app.models.Category;
  var Tag= app.models.Tag;
  var Follow= app.models.Follow;

  mysqlDs.autoupdate('user', function(err) {
      if (err) throw err;
      console.log('\nAutoupdated table `user`.');
      // at this point the database table `Book` should have one foreign key `authorId` integrated
      mysqlDs.autoupdate('Follow', function(err) {
      if (err) throw err;
      console.log('\nAutoupdated table `Follow`.');
      // at this point the database table `Book` should have one foreign key `authorId` integrated
    });
  });
  mysqlDs.autoupdate('Category', function(err) {
      if (err) throw err;
      console.log('\nAutoupdated table `Category`.');
      // at this point the database table `Book` should have one foreign key `authorId` integrated
      mysqlDs.autoupdate('Tag', function(err) {
      if (err) throw err;
      console.log('\nAutoupdated table `Tag`.');
      // at this point the database table `Book` should have one foreign key `authorId` integrated
    });

  });
  
};