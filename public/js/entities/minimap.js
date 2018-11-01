define([
   'constants/materials',
   'components/minimap',
   'helpers/terrain',
], function(
   MATERIALS,
   Minimap,
   TerrainHelper
) {
   return Juicy.Entity.extend({
      components: [Minimap],

      set: function(properties) {
         Object.assign(this, properties);

         self.minimap.width = this.width;
         self.minimap.height = this.height;
         self.minimapPixels = new ImageData(new Uint8ClampedArray(4 * this.width * this.height), this.width, this.height);

         this.ready = true;
      },

      generate: function(world) {
         // var minimap = this.getComponent('Minimap');
         //
         // minimap.setSize(world.width, world.height);
         // minimap.generate(world);
      }
   });
});
