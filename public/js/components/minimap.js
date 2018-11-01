define([
   'constants/materials',
   'helpers/terrain',
], function(
   MATERIALS,
   TerrainHelper
) {
   return Juicy.Component.create('Minimap', {
      constructor: function(entity) {
         // For drawing
         this.canvas = document.createElement('canvas');
         this.context = this.canvas.getContext('2d');
         this.pixels = null;

         entity.setSize = this.setSize.bind(this);
         entity.setPixel = this.setPixel.bind(this);
      },

      setSize: function(width, height) {
         this.canvas.width = width;
         this.canvas.height = height;

         this.pixels = new ImageData(new Uint8ClampedArray(4 * width * height), width, height);
      },

      getColor: function(tile) {
         return MATERIALS[tile].pixel;
      },

      setPixel: function(index, tile) {
         var pixels = this.pixels.data;
         var color = this.getColor(tile);

         pixels[4 * index] = color[0];
         pixels[4 * index + 1] = color[1];
         pixels[4 * index + 2] = color[2];
         pixels[4 * index + 3] = color[3];
      },

      generate: function(world) {
         var self = this;
         world.tiles.forEach(function(tile, index) {
            self.setPixel(index, tile);
         });
      },

      render: function(context, x, y, w, h) {
         this.context.putImageData(this.pixels, 0, 0);
         this.context.imageSmoothingEnabled = false;

         context.drawImage(this.canvas, x, y, w, h, x, y, w, h);
      }
   });
});