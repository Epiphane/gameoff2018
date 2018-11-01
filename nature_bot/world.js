var Update  = require('./update');
var log     = require('./log');
var request = require('request-promise');

var World = module.exports = function(domain) {
   this.domain = domain;
   this.width = 0;
   this.height = 0;
   this.tiles = [];
   this.ready = false;
};

World.prototype.fetch = function() {
   var self = this;
   return request({
      uri: this.domain + '/api/world',
      json: true
   }).then((res) => {
      Object.assign(self, res);
      self.ready = true;
      log.info('World fetched. Size [' + self.width + ',' + self.height + ']');
   }).catch((err) => {
      log.error(err);
   })
};

World.prototype.getTileAt = function(x, y) {
   return this.tiles[x + y * this.width];
};

World.prototype.setTileAt = function(x, y, value) {
   return this.setTile(x + y * this.width, value);
};

World.prototype.getOccupant = function(x, y) {
   return this.occupants[x + y * this.width];
};

World.prototype.setTile = function(index, value) {
   log.verbose('Setting tile[' + index + '] = ' + value);
   this.tiles[index] = value;

   return Promise.resolve(Update.Tile(index, value));
};

World.prototype.setOccupant = function(index, value) {
   log.verbose('Setting occupant[' + index + '] = ' + value);
   this.occupants[index] = value;

   return Promise.resolve(Update.Occupant(index, value));
};

World.prototype.update = function(updates) {
   if (!this.ready) {
      // We should just queue these
      log.error('Getting an update before the world is initialized');
      return;
   }

   var self = this;
   updates.forEach(function(info) {
      switch (info[0]) {
      case 0: // tile
         self.setTile(info[1], info[2]);
         break;
      case 1: // occupant
         self.setOccupant(info[1], info[2]);
         break;
      }
   });
}