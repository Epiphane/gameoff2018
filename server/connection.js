var _               = require('lodash');
var WorldController = require('./controller/world');
var ActionController= require('./controller/action');
var Inventory       = require('./controller/inventory');

module.exports = function(io, db) {
   var connections = {};

   var Connection = function(socket) {
      this.socket = socket;
      this.name = null;
      this.game = null;
      this.elevated = (process.env.NODE_ENV === 'development');
      this.inventory = new Inventory();
      this.position = null;

      if (this.elevated) {
         this.inventory.addItem('sandbox');
      }

      socket.on('disconnect', this.disconnect.bind(this));
      socket.on('updates', this.update.bind(this));
      socket.on('elevate', this.elevate.bind(this));
      socket.on('action', this.action.bind(this));
      socket.on('remake', this.remake.bind(this));
      socket.on('player_pos', this.positionChanged.bind(this));
      socket.on('emote', this.emote.bind(this));
   };

   Connection.prototype.logout = function() {

   };

   Connection.prototype.disconnect = function() {
      // Drop something random I guess
      var inventory = this.inventory
      var items = inventory.toArray();
      var random = items.find((entry) => !isNaN(entry._id) && entry.count > 0);

      if (!!this.position) {
         if (random) {
            WorldController.getWorld().then((world) => {
               ActionController.action(world, this.position.x + this.position.y * world.width, 'drop_' + random._id, inventory);
            })
         }

         io.emit('player_leave', this.position.uuid);
      }
   };

   Connection.prototype.update = function(updates, _id) {
      if (!this.elevated) {
         return;
      }

      var socket = this.socket;
      WorldController.update(updates).then((updates) => {
         // TODO error handling...?
         socket.broadcast.emit('updates', updates);
         socket.emit('update_' + _id, 'success');
      }).catch((e) => {
         console.error('Error performing update: ' + e.message);
         socket.emit('update_' + _id, 'fail', e.message);
      })
   };

   Connection.prototype.elevate = function(message) {
      if (message === process.env.ELEVATED_SECRET) {
         this.elevated = true;
      }
      else {
         console.log('Rejecting secret ' + message);
      }
      this.socket.emit('elevated', this.elevated);
   };

   Connection.prototype.positionChanged = function(newPosition) {
      this.position = newPosition;

      this.socket.broadcast.emit('player_pos_update', newPosition)
   };

   Connection.prototype.emote = function(emote) {
      this.socket.broadcast.emit('emote', emote)
   };

   Connection.prototype.action = function(index, action, _id) {
      var socket = this.socket;
      var inventory = this.inventory;

      WorldController.getWorld().then((world) => {
         return ActionController.action(world, index, action, inventory);
      }).then((result) => {
         if (!result.executed) {
            if (_id) socket.emit('action_' + _id, 'fail', result.reason);
         }
         else {
            if (_id) socket.emit('action_' + _id, 'success');
            socket.broadcast.emit('updates', result.updates);
         }
      });
   };

   Connection.prototype.remake = function(properties) {
      var socket = this.socket;
      if (!this.elevated) {
         socket.emit('remake', false, { message: 'Not Authorized' });
         return;
      }

      WorldController.remake(properties).then(() => {
         io.emit('remake', true);
      }).catch((e) => {
         console.error(e);
         socket.emit('remake', false, { message: e.message });
      })
   };

   Connection.prototype.handle = function(message) {
      this.handler.apply(this, arguments);
   };

   return Connection;
};
