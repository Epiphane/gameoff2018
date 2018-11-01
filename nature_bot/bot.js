var log = require('./log');
var Update = require('./update');
var World = require('./world');
var Components = require('./components');
var ActionController = require('../server/controller/action');

var NatureBot = function(domain, socket, config) {
   this.domain  = domain;
   this.running = false;
   this.socket  = socket;
   this.world   = new World(domain);
   this.friends = {};
   this.ticks   = 0;

   this.components = config.components.map((info) => {
      if (typeof(info) === 'string') info = { name: info };

      var name = info.name;
      if (!Components[name]) {
         log.error('Component ' + name + ' not found in the components/ directory');
      }

      var component = new Components[name](info);
      component.name = name;
      return component;
   });
};

NatureBot.prototype.updatePlayerPos = function(position) {
   var friend = this.friends[position.uuid];
   if (!friend) {
      friend = { x: position.x, y: position.y };
      this.friends[position.uuid] = friend;
   }
   friend.x = position.x;
   friend.y = position.y;
};

NatureBot.prototype.deletePlayer = function(uuid) {
   delete this.friends[uuid];
};

NatureBot.prototype.start = function() {
   if (this.running) {
      log.error('NatureBot is already running');
      return false;
   }

   var self = this;
   return this.world.fetch().then(() => {
      return self.init();
   }).then(() => {
      self.running = true;
      log.info('NatureBot started');
      self.tick();
   }).catch((e) => {
      log.error('Error: ' + e.message);
      log.info('NatureBot stopped');
   });
};

NatureBot.prototype.init = function() {
   var world  = this.world;
   var socket = this.socket;
   return Promise.all(this.components.map((component) => {
      log.info('Initializing ' + component.name);
      return component.init(world, socket);
   })).catch((e) => {
      log.error(e.stack);
   });
};

NatureBot.prototype.tick = function() {
   if (!this.running) {
      return;
   }

   var world  = this.world;
   var friends  = this.friends;
   var socket = this.socket;
   Promise.all(this.components.map((component) => component.tick(world, friends))).then((updates) => {
      return updates.map((update) => {
         if (update instanceof Update) {
            return [update];
         }
         else {
            return update;
         }
      });
   }).then((updatesAsArrays) => {
      return [].concat.apply([], updatesAsArrays);
   }).then((updates) => {
      return updates.filter((update) => !!update);
   }).then((updates) => {
      if (updates.length === 0) {
         log.verbose('No updates for server');
         return;
      }

      log.verbose('Sending updates to server: ' + updates);
      socket.emit('updates', updates.map((update) => update.serialize()));

      var update_id = this.ticks++;
      socket.once('update_' + update_id, function(result, message) {
         if (result === 'fail') {
            log.error('Error on update[' + update_id + ']: ' + message)
         }
      });
   }).catch((e) => {
      log.error('Tick error: ' + e.message);
   });

   setTimeout(this.tick.bind(this), 250);
};

NatureBot.prototype.stop = function() {
   this.running = false;
};

NatureBot.prototype.update = function(updates) {
   this.world.update(updates);
};

module.exports = NatureBot;
