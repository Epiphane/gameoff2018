var Promise    = require('promise');
var express    = require('express');

var WorldController = require('../../controller/world');

module.exports = function(db, auth) {
   var app       = new express();
   
   app.get('/', function(req, res) {
      WorldController.getWorld().then((world) => res.json(world));
   });

   return app;
}
