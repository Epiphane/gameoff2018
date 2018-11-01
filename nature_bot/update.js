var log = require('./log');
var request = require('request-promise');

var Update = module.exports = function(type, index, value) {
   this.type = type;
   this.index = index;
   this.value = value;
};

Update.prototype.toString = function() {
   return (this.type === 0 ? 'Tile' : 'Occ') + ':' + this.index + ':' + this.value;
};

Update.prototype.serialize = function() {
   return [this.type, this.index, this.value];
};

Update.Tile = function(index, value) {
   return new Update(0, index, value);
};

Update.Occupant = function(index, value) {
   return new Update(1, index, value);
};
