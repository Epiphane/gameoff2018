var Promise    = require('promise');
var express    = require('express');

module.exports = function(db, auth) {
   var app       = new express();
   var User      = db.User;

   app.get('/', auth.hasRole('admin'), function(req, res) {
      User.findAll({ where: {} }).then(function(users) {
         return users.map(function(user) { return user.profile; })
      }).then(function(users) {
         res.json(users);
      });
   });

   app.get('/me', auth.isAuthenticated(), function(req, res) {
      res.status(200).json(req.user.profile);
   });

   return app;
}
