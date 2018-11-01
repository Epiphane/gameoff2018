define([
   'constants/tiles',
   'helpers/atlas'
], function(
   TILE,
   Atlas
) {
   var waiting = 0;
   var onReadyCallbacks = [];
   function waitForImageLoad(image) {
      waiting ++;

      image.onload = function() {
         waiting --;

         if (waiting === 0) {
            while (onReadyCallbacks.length) {
               (onReadyCallbacks.shift())();
            }
         }
      }
   }

   var TerrainAtlas = new Image();
       TerrainAtlas.src = './images/terrain.png';
   waitForImageLoad(TerrainAtlas);

   var TerrainHelper = { tilesize: 32 };

   TerrainHelper.ready = function() {
      return waiting === 0;
   };

   TerrainHelper.onReady = function(callback) {
      if (TerrainHelper.ready)
         callback();
      else
         onReadyCallbacks.push(callback);
   };

   TerrainHelper.terrainAt = function(world, x, y) {
      if (x < 0) return TILE.WATER;//x = 0;
      if (y < 0) return TILE.WATER;//y = 0;
      if (x >= world.width) return TILE.WATER;//x = world.width - 1;
      if (y >= world.height) return TILE.WATER;//y = world.height - 1;

      return world.tiles[x + y * world.width];
   };

   TerrainHelper.drawOffset = function(context, dx, dy, offset) {
      var tile_size = TerrainHelper.tilesize;
      context.drawImage(TerrainAtlas, 
                        offset[0] * tile_size, 
                        offset[1] * tile_size, 
                        tile_size, 
                        tile_size,
                        dx,
                        dy,
                        tile_size,
                        tile_size);
   };

   TerrainHelper.draw = function(context, world, x, y) {
      var tiles = [
         TerrainHelper.terrainAt(world, x,   y),
         TerrainHelper.terrainAt(world, x+1, y),
         TerrainHelper.terrainAt(world, x,   y+1),
         TerrainHelper.terrainAt(world, x+1, y+1)
      ];
      var elevations = [
         world.getElevation(x,   y),
         world.getElevation(x+1, y),
         world.getElevation(x,   y+1),
         world.getElevation(x+1, y+1)
      ];
      var offsets = Atlas.getOffsets(tiles, elevations, x ^ y);

      var tile_size = TerrainHelper.tilesize;
      offsets.forEach(function(offset) {
         TerrainHelper.drawOffset(context, x * tile_size, y * tile_size, offset);
      });
   };

   return TerrainHelper;
})