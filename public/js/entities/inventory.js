define([
   'components/inventory'
], function(
   InventoryComponent
) {
   return Juicy.Entity.extend({
      components: [InventoryComponent]
   });
});