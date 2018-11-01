define([
], function(
) {
   var ContentManager = function(content_div) {
      this.content = content_div;
   };

   ContentManager.prototype.onScreen = function(connection, layout) {
      if (this.screen instanceof BattleScreen && layout.isBattle) {
         this.screen.update(layout);
      }
      else {
         return this.setScreen(this.buildScreen(connection, layout));
      }
   };

   ContentManager.prototype.onUpdate = function(updates) {
      if (this.screen instanceof BattleScreen) {
         this.screen.queueUpdates(updates);
      }
      else {
         console.error('Don\'t know how to update a non-BattleScreen');
      }
   };

   ContentManager.prototype.buildScreen = function(connection, layout) {
      if (layout.isBattle) {
         return new BattleScreen(connection, layout);
      }
      else {
         return new DynamicScreen(connection, layout);
      }
   };

   ContentManager.prototype.setScreen = function(newScreen) {
      this.content.empty();

      this.content.append(this.screen = newScreen);

      newScreen.onShow();
   };

   ContentManager.prototype.load = function() {
      this.setScreen(this.loading);
   };

   ContentManager.prototype.enterName = function(connection, saved) {
      this.setScreen(new EnterNameScreen(connection, saved));
   };

   return ContentManager;
});