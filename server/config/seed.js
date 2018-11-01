/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var sqldb = require('../sqldb');
var fs = require('fs');

var World    = sqldb.World;

module.exports = function() {
   return (function(dbSync) {
      return dbSync().then(() => {
         console.log('Creating World...');
      });
   })(() => {
      console.log('Dropping all tables...');
      return sqldb.sequelize.drop({ cascade: true }).then(() => {
         console.log('Syncing tables...');
         return sqldb.sequelize.sync({ force: true });
      });
   }).then(() => {
      console.log('Seed complete!');
   });
};