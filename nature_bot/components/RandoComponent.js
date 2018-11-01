module.exports = function(TILE, OCCUPANT) {
   var RandoComponent = function(params) {
   };

   RandoComponent.prototype.init = function(world) {
      
   };

   RandoComponent.prototype.tick = function(world, players) {
      return world.setTileAt(Math.floor(Math.random() * 20), Math.floor(Math.random() * 20), Math.floor(Math.random() * 4));
   };

   return RandoComponent;
}