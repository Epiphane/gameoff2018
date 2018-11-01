define([
], function(
) {
   return Juicy.Component.create('Sprite', {
      init: function() {

      },
      
      render: function(context) {
            context.fillStyle = 'blue';
            context.fillRect(this.entity.position.x, this.entity.position.y, 10, 10);
      },
   });
});
