define([
], function(
) {
   var noop = function() {};

   var ConnectionManager = function() {
      this.socket = new io();

      this.eventsRegistered = [];
      this.callbacks = {};
   };

   ConnectionManager.prototype.emit = function(type, data) {
      this.socket.emit.apply(this.socket, arguments);
   };

   ConnectionManager.prototype.send = function(message) {
      this.emit('message', message);
   };

   ConnectionManager.prototype.on = function(event, callback) {
      this.callbacks[event] = callback;

      if (this.eventsRegistered.indexOf(event) < 0) {
         var self = this;
         self.socket.on(event, function(data) {
            self.callbacks[event](data);
         })

         this.eventsRegistered.push(event);
      }
   };

   ConnectionManager.prototype.off = function(event, callback) {
      this.callbacks[event] = noop;
   };

   ConnectionManager.prototype.onOnce = function(event, callback) {
      var self = this;
      
      this.socket.once(event, callback);
      // this.callbacks[event] = function() {
      //    self.off(event);

      //    callback.apply(self, arguments);
      // }
   };

   return ConnectionManager;
});