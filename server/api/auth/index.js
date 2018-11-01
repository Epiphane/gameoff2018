var express  = require('express');
var passport = require('passport');

module.exports = function(db, auth) {
   // Passport Configuration
   require('./local/passport').setup(db.User);

   var router = express.Router();

   router.use('/local', require('./local')(auth));

   return router;
};