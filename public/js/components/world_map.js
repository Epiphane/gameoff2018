define([
   'helpers/terrain',
   'helpers/occupant',
], function(
   TerrainHelper,
   OccupantHelper
) {
   return Juicy.Component.create('WorldMap', {
      constructor: function(entity) {
         // For drawing
         this.tile_canvas = document.createElement('canvas');
         this.tile_context = this.tile_canvas.getContext('2d');

         this.occ_canvas = document.createElement('canvas');
         this.occ_context = this.occ_canvas.getContext('2d');

         this.staging = document.createElement('canvas');
         this.staging.width = 5 * OccupantHelper.tilesize;
         this.staging.height = 6 * OccupantHelper.tilesize;
         this.staging_context = this.staging.getContext('2d');

         var self = this;
         self.mainChar = self.friends = null;
         self.character = null;
         entity.setMainChar = function(mainChar) {
            self.mainChar = mainChar;
            self.character = mainChar.getComponent('Character');
         };
         entity.setFriends = function(friends) { self.friends = friends; };

         this.needsUpdate = [];
      },

      generate: function(world) {
         this.tile_canvas.width  = world.width * TerrainHelper.tilesize;
         this.tile_canvas.height = world.height * TerrainHelper.tilesize;

         this.occ_canvas.width  = world.width * TerrainHelper.tilesize;
         this.occ_canvas.height = world.height * TerrainHelper.tilesize;

         for (var j = 0; j < world.height; j ++) {
            for (var i = 0; i < world.width; i ++) {
               TerrainHelper.draw(this.tile_context, world, i, j);
               OccupantHelper.draw(this.occ_context, world, i, j);
            }
         }
      },

      updateTile: function(world, index) {
         var x = index % world.width;
         var y = Math.floor(index / world.width);

         for (var j = y - 1; j <= y + 1; j ++) {
            for (var i = x - 1; i <= x + 1; i ++) {
               if (i < 0 || j < 0) continue;

               TerrainHelper.draw(this.tile_context, world, i, j);
            }
         }
      },

      updateOccupants: function(world, index) {
         var x = index % world.width;
         var y = Math.floor(index / world.width);
         var bounds = {
            x: (x - 2.5) * OccupantHelper.tilesize, 
            y: (y - 4.5) * OccupantHelper.tilesize
         };

         this.occ_context.clearRect(bounds.x, bounds.y, this.staging.width, this.staging.height);

         this.staging_context.save();
         this.staging_context.clearRect(0, 0, this.staging.width, this.staging.height);
         this.staging_context.translate(-bounds.x, -bounds.y);

         for (var j = y - 4; j <= y + 6; j ++) {
            for (var i = x - 4; i <= x + 4; i ++) {
               if (i < 0 || j < 0) continue;

               OccupantHelper.draw(this.staging_context, world, i, j);
               
               this.staging_context.save();
               this.staging_context.translate(-TerrainHelper.tilesize / 2, -TerrainHelper.tilesize / 2);
               for (var friendID in this.friends) {
                  var friendCharacter = this.friends[friendID].getComponent('Character');
                  if (friendCharacter.tileX === i && friendCharacter.tileY === j) {
                     this.friends[friendID].render(this.staging_context);
                  }
               }

               if (this.character.tileX === i && this.character.tileY === j) {
                  this.mainChar.render(this.staging_context)
               }
               this.staging_context.restore();
            }
         }

         this.occ_context.drawImage(this.staging, bounds.x, bounds.y);
         this.staging_context.restore();
      },

      update: function() {
         this.needsUpdate = [];
      },

      render: function(context, x, y, w, h) {
         context.drawImage(this.tile_canvas, 
                           x, y, w, h, /* source */
                           x, y, w, h  /* dest */);

         context.drawImage(this.occ_canvas, 
                           x, y, w, h, /* source */
                           x, y, w, h  /* dest */);

         // context.translate(-TerrainHelper.tilesize / 2, TerrainHelper.tilesize-TerrainHelper.tilesize / 2);
         // this.mainChar.render(context);
         // for (var friendID in this.friends) {
         //    this.friends[friendID].render(context);
         // }
      }
   });
});