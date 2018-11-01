define([
], function(
) {
   return Juicy.Component.create('Emotion', {
      init: function() {
         this.lifeLeft = 0;
         this.active = false;
         this.TILE_WIDTH = this.TILE_HEIGHT = 32;
         this.emotionImage = new Image();
         this.emotionImage.src = './images/emojis.png';
         this.emojiFrame = 0;
         this.DONE_LOADIN = false;
         var self = this;
         this.emotionImage.onload = function() {
            self.DONE_LOADIN = true;
         }

         this.tileCols = 41;
      },

      update: function() {
         this.lifeLeft --;
         if (this.lifeLeft < 0) {
            this.active = false;
         }
      },

      doY: function() {
         if (this.lifeLeft < 20) {
            return -this.lifeLeft;
         }
         else if (this.lifeLeft > 80) {
            return this.lifeLeft - 100;
         }
         else {
            return -20;
         }
      },

      doAlpha: function() {
         if (this.lifeLeft < 10) {
            return this.lifeLeft/10;
         }
         else if (this.lifeLeft > 80) {
            return (100 - this.lifeLeft)/20;
         }
         else {
            return 1;
         }
      },

      render: function(context) {
         var drawnWidth  = this.TILE_WIDTH;
         var drawnHeight = this.TILE_HEIGHT;
         var sheetX = (this.emojiFrame % this.tileCols) * this.TILE_WIDTH;
         var sheetY = Math.floor(this.emojiFrame / this.tileCols) * this.TILE_HEIGHT;

         if (this.DONE_LOADIN && this.lifeLeft > 0) {
            context.globalAlpha = this.doAlpha();
            context.drawImage(this.emotionImage, sheetX, sheetY,
                drawnWidth, drawnHeight, 0, this.doY() - 10, drawnWidth, drawnHeight);
         }
      },
   });
});
