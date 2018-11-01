'use strict';

var Promise = require('promise');
var sqldb = require('../sqldb');
var TILE  = require('../tiles');
var OCCUPANT  = require('../occupants');
var World = sqldb.World;

var RemakeWorld = require('../../nature_bot/components/RemakeWorld')(TILE, OCCUPANT);

var worldInMemory = null;
var WorldController = module.exports = function() {};

WorldController.populate = function(world) {
   return world.update(RemakeWorld.remake(world.width, world.height));
};

WorldController.remake = function(properties) {
   return WorldController.getWorld().then((world) => {
      if (properties) {
         return world.update(properties);
      }
      else {
         return WorldController.populate(world);
      }
   });
};

WorldController.create = function() {
   return World.create({
      _id: 1,
      width: 100,
      height: 100
   }).then((world) => {
      return WorldController.populate(world);
   })
};

WorldController.getWorld = function() {
   return Promise.resolve(worldInMemory).then((world) => {
      return world || World.findById(1);
   }).then((world) => {
      return world || WorldController.create();
   }).then((world) => {
      worldInMemory = world;

      return world;
   });
};

WorldController.update = function(updates) {
   return WorldController.getWorld().then((world) => {
      return world.performUpdates(updates);
   });
};

WorldController.incrementScore = function() {
   return World.findById(1)
   .then((world) => {
      world.increment({score: 1});
   })
   .then((world) => {
      return world.score;
   });
};

module.exports = WorldController;
