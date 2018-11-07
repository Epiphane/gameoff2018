define([
   'constants/materials',
   'constants/occupants',
], function(
   MATERIALS,
   OCCUPANT
) {
   var OccupantMap = {
   // 'NAME MATCHING server/occupants.js': {
   //    block: how many horizontal tiles it makes inaccessible, 0=you can walk over it
   //    offset: [x, y] referring to a tile coordinate in images/occupants.png
   //    size:   [x, y] referring to a tile width/height in images/occupants.png
   //    anchor: [x, y] referring to the tile that gets drawn at the occupant's location
   //
   //    For any 1x1 occupant, you only need the block and offset
   //    For anything with a size, you're probably good with just the offset and size
   // }
      'NONE':           { block: 0 },
      'WHEAT_SEED':     { block: 0, offset: [0, 0] },
      'WHEAT_SPROUT':   { block: 0, offset: [1, 0] },
      'WHEAT_GROWING':  { block: 0, offset: [2, 0] },
      'WHEAT_COMPLEAT': { block: 1, offset: [3, 0], size: [1, 2] },
      'STUMP':          { block: 0, offset: [7, 0] },
      'TREE':           { block: 1, offset: [4, 0], size: [3, 5], anchor: [1, 1] },
      'STONE':          { block: 2, offset: [2, 2], size: [2, 2] },
      'ROCK':           { block: 1, offset: [2, 1] },
      'TIKI':           { block: 2, offset: [0, 1], size: [2, 3] },
      'REEDS_1':        { block: 1, offset: [0, 4], size: [1, 3] },
      'REEDS_2':        { block: 1, offset: [0, 4], size: [1, 3] },
      'MUSHROOM':       { block: 0, offset: [1, 4] },
      'PILLAR':         { block: 1, offset: [2, 4], size: [1, 3] },
      'INVIS':          { block: 1 },
      'MARBLE':         { block: 1, offset: [1, 5] },
      'LILLYPAD':       { block: 0, offset: [1, 6] },
      'CORN_STALK':     { block: 1, offset: [4, 5], size: [1, 2] },
      'CROSS':          { block: 1, offset: [5, 5], size: [1, 2] },
      'CACTUS':         { block: 2, offset: [6, 5], size: [2, 2] },
      'LOG':            { block: 0, offset: [7, 1] },
   };
   var OccupantArray = [];
   for (var key in OCCUPANT) {
      OccupantArray[OCCUPANT[key]] = OccupantMap[key];
   }

   var OccupantImage = new Image();
       OccupantImage.src = './images/occupants.png';

   var OccupantHelper = { tilesize: 32 };

   OccupantHelper.occupantAt = function(world, x, y) {
      if (x < 0) return 0;
      if (y < 0) return 0;
      if (x >= world.width) return 0;
      if (y >= world.height) return 0;

      return world.occupants[x + y * world.width];
   };

   OccupantHelper.drawOffset = function(context, dx, dy, dwidth, dheight, offset) {
      var tile_size = OccupantHelper.tilesize;
      context.drawImage(OccupantImage, 
                        offset[0] * tile_size, 
                        offset[1] * tile_size, 
                        dwidth * tile_size, 
                        dheight * tile_size,
                        dx,
                        dy,
                        dwidth * tile_size,
                        dheight * tile_size);
   };

   OccupantHelper.draw = function(context, world, x, y, dx, dy) {
      var tile_size = OccupantHelper.tilesize;
      var occupant = OccupantHelper.occupantAt(world, x, y);

      if (!occupant || occupant === OCCUPANT.INVIS || occupant === OCCUPANT.NONE)
         return;

      // OCCUPANT WORLD STREET
      var occupantInfo = OccupantArray[occupant];
      var offset = occupantInfo.offset;
      var size   = occupantInfo.size   || [1, 1];
      var anchor = occupantInfo.anchor || [0, 0];

      var dx = (x - 0.5 - anchor[0]) * OccupantHelper.tilesize;
      var dy = (y + 0.5 + anchor[1] - size[1]) * OccupantHelper.tilesize;

      var tile = world.getTile(x, y);
      var material = MATERIALS[tile];
      dy += Math.floor(-1.5 * material.height);

      OccupantHelper.drawOffset(context, dx, dy, size[0], size[1], offset);
   };

   OccupantHelper.isBlocked = function(world, x, y) {
      for (var dx = -2; dx <= 0; dx ++) {
         var occupant = OccupantHelper.occupantAt(world, x + dx, y);

         if (OccupantArray[occupant].block + dx > 0) {
            return true;
         }
      }

      return false;
   }

   return OccupantHelper;
})