define([
   'components/ui',
   'components/ui_sandbox',
], function(
   UIComponent,
   UISandboxComponent
) {
   return Juicy.Entity.extend({
      components: ['Box'],

      constructor: function(game, sandbox) {
         Juicy.Entity.call(this, game);

         if (sandbox) {
            this.addComponent(UISandboxComponent);
         }
         else {
            this.addComponent(UIComponent);
         }
      },

      init: function() {
         this.getComponent('Box').fillStyle = 'rgba(0, 0, 0, 0.9)';
         this.width = this.height = 208;

         this.action = 'none';
      },

      click: function(point) {
         this.getComponent('UI').click(point.sub(this.position));
      }
   })
})