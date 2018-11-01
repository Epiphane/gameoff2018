const path = require('path');
const TILE = require('../../server/tiles');
const OCCUPANT = require('../../server/occupants');
const MATERIALS = require('../materials');
require('fs').readdirSync(__dirname).forEach(function (file) {
   /* If its the current file ignore it */
   if (file === 'index.js') return;

   var name = path.basename(file, '.js').replace(/[_^]([a-z])/g, function (g) { return g[1].toUpperCase(); });
   name = name.charAt(0).toUpperCase() + name.slice(1);

   /* Store module with its name (from filename) */
   module.exports[name] = require(path.join(__dirname, file))(TILE, OCCUPANT, MATERIALS);
});