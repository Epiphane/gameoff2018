define([
], function(
) {
   var MathUtil = {};

   MathUtil.lerp = function(curr, dest, howFar) {
      return curr + (dest - curr) * howFar;
   };

   MathUtil.makeUuid = function() {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
   };

   MathUtil.dirFromTwoPoints = function(start, finish) {
      
   };

   MathUtil.DIR = {
      DOWN: 0,
      LEFT: 1,
      RIGHT: 2,
      UP: 3
   };

   return MathUtil;
})
