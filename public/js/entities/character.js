define([
   'components/character',
   'components/sprite',
   'components/emotion'
], function(
   CharComponent,
   SpriteComponent,
   EmotionComponent
) {
   return Juicy.Entity.extend({
      components: [CharComponent, 'Image', EmotionComponent],

      init: function() {
         this.action = 0;
         this.getComponent('Image').TILE_WIDTH  = 32;
         this.getComponent('Image').TILE_HEIGHT = 32;
         this.setImage('./images/player.png');
         this.getComponent('Emotion').init();
      },
   })
})
