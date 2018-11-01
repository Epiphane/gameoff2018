'use strict';

(function() {
   // This object is imported both server- and client-side.
   // This means any functionality you add here is reflected on both (w00t)

   /**
    * TL;DR for adding new actions:
    *
    * 1) Add the relevant entry in public/js/components/ui.js (go check it out)
    * 2) Modify ActionController.available to add your action when applicable:
    *      actions.push(my_action);
    * 3) Add a function to ActionController with the same name:
    *      ActionController.my_action = function(world, index, inventory) {
    *         // Do whatever you want! just return a promise at the end
    *         // If you don't want to return, return ActionController.done();
    *         // ActionController.do_nothing is an example of this
    *
    *         Examples:
    *         return ActionController.setTiles(world, [index1, index2], TILE.DIRT);
    *
    *         return ActionController.setTile(world, index, TILE.WATER).then(() => {
    *            return ActionController.setOccupant(world, index, OCCUPANT.STUMP);
    *         });
    *      }
    */

   var ActionController = {};

   ActionController.init = function(TILE, OCCUPANT) {

      ActionController.getTile = function(world, x, y) {
         if (x < 0) x = 0;
         if (y < 0) y = 0;
         if (x >= world.width) x = world.width - 1;
         if (y >= world.width) y = world.width - 1;

         return world.tiles[x + y * world.width];
      }

      ActionController.getOccupant = function(world, x, y) {
         if (x < 0) x = 0;
         if (y < 0) y = 0;
         if (x >= world.width) x = world.width - 1;
         if (y >= world.width) y = world.width - 1;
         return null;
         // return world.occupants[x + y * world.width];
      }

      ActionController.available = function(world, x, y, inventory) {
         var inventory = inventory;
         var currentTile = ActionController.getTile(world, x, y);
         var above = ActionController.getTile(world, x, y - 1);
         var below = ActionController.getTile(world, x, y + 1);
         var left  = ActionController.getTile(world, x - 1, y);
         var right = ActionController.getTile(world, x + 1, y);
         var tl = ActionController.getTile(world, x - 1, y - 1);
         var tr = ActionController.getTile(world, x + 1, y - 1);
         var bl = ActionController.getTile(world, x - 1, y + 1);
         var br = ActionController.getTile(world, x + 1, y + 1);
         var neighbors = [above, below, left, right];
         var close = [above, below, left, right, tl, tr, bl, br];

         var currentOccupant = ActionController.getOccupant(world, x, y);
         var occupants = [
            currentOccupant,
            ActionController.getOccupant(world, x-1, y),
            ActionController.getOccupant(world, x+1, y),
            ActionController.getOccupant(world, x, y-1),
            ActionController.getOccupant(world, x, y+1)
         ];

         var actions = [];

         if (inventory.hasItem('sandbox')) {
            for (var tile in TILE) {
               actions.push('place_' + tile);
            }
         }

         switch (currentTile) {
         case TILE.GRASS:
                                                      actions.push('dig_grass');
            if (inventory.hasItem('seed_tree'))     { actions.push('plant_tree'); }
            break;

         case TILE.SOIL:
         case TILE.SOIL_WET:
                                                      actions.push('water_soil');
            if (inventory.hasItem('seed_wheat'))    { actions.push('plant_wheat'); }
            if (inventory.hasItem('seed_sapling'))  { actions.push('plant_sapling'); }
         case TILE.DIRT:
            if (close.findIndex(function(other) { return other === TILE.WATER; }) >= 0)
               actions.push('dig_dirt');

            if (currentTile === TILE.DIRT) {
               var acceptable = [TILE.SOIL, TILE.SOIL_WET, TILE.DIRT, TILE.GRASS];
               if (neighbors.every(function(neighbor) { return acceptable.indexOf(neighbor) >= 0; })) {
                  actions.push('plow_dirt');
               }
            }
            break;

         case TILE.SAND:
            if (close.findIndex(function(other) { return other === TILE.WATER; }) >= 0)
               actions.push('dig_sand');
            break;

         case TILE.WATER:
            if (close.findIndex(function(other) { return other === TILE.DIRT || other === TILE.GRASS; }) >= 0)
               actions.push('shore_up_dirt');
            if (close.findIndex(function(other) { return other === TILE.SAND; }) >= 0)
               actions.push('shore_up_sand');
            break;
         }

         switch (currentOccupant) {
         case OCCUPANT.WHEAT_SEED:
         case OCCUPANT.WHEAT_SPROUT:
         case OCCUPANT.WHEAT_GROWING:
            actions.push('grow_wheat');
            break;

         case OCCUPANT.WHEAT_COMPLEAT:
            actions.push('harvest_wheat');
            break;

         case OCCUPANT.LOG:
            actions.push('take_log');
            break;
         }

         if (occupants.findIndex(function(occupant) { return occupant === OCCUPANT.TREE; }) >= 0) {
            actions.push('chop_tree');
         }

         return actions;
      };

      // This will "Gracefully" ensure that you only do actions at the right time
      ActionController.assert = function(assertion, message) {
         if (!assertion)
            throw new Error('Assertion failed: ' + (message || ''));
      };

      ActionController.getOccupantIndex = function(world, index) {
         return ActionController.getOccupant(world, index % world.width, Math.floor(index / world.width));
      };

      ActionController.getCloseTiles = function(world, index) {
         var x = index % world.width;
         var y = Math.floor(index / world.width);
         var above = ActionController.getTile(world, x, y - 1);
         var below = ActionController.getTile(world, x, y + 1);
         var left  = ActionController.getTile(world, x - 1, y);
         var right = ActionController.getTile(world, x + 1, y);
         var tl = ActionController.getTile(world, x - 1, y - 1);
         var tr = ActionController.getTile(world, x + 1, y - 1);
         var bl = ActionController.getTile(world, x - 1, y + 1);
         var br = ActionController.getTile(world, x + 1, y + 1);
         return [above, below, left, right, tl, tr, bl, br];
      };

      ActionController.done = function() {
         if (typeof($) !== 'undefined') {
            return $.Deferred().resolve([]);
         }
         else {
            return require('promise').resolve([]);
         }
      };

      ActionController.setTiles = function(world, indices, tile) {
         indices.forEach(function(index) {
            ActionController.assert(index >= 0 && index < world.width * world.height, 'index ' + index + ' is out of bounds');
         });

         return world.setTiles(indices, tile);
      };

      ActionController.setTile = function(world, index, tile) {
         return ActionController.setTiles(world, [index], tile);
      };

      ActionController.setOccupants = function(world, indices, tile) {
         indices.forEach(function(index) {
            ActionController.assert(index >= 0 && index < world.width * world.height, 'index ' + index + ' is out of bounds');
         });

         return world.setOccupants(indices, tile);
      };

      ActionController.setOccupant = function(world, index, tile) {
         return ActionController.setOccupants(world, [index], tile);
      };

      ActionController.dig_grass = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.GRASS, 'dig_grass must be on grass');

         var occupant = ActionController.getOccupantIndex(world, index);

         return ActionController.setTile(world, index, TILE.DIRT).then((update1) => {
            if (occupant === OCCUPANT.STUMP) {
               return ActionController.setOccupant(world, index, OCCUPANT.NONE).then((update2) => {
                  return update1.concat(update2);
               })
            }
         });
      };

      ActionController.dig_dirt = function(world, index, inventory) {
         ActionController.assert([TILE.DIRT, TILE.SOIL, TILE.SOIL_WET].indexOf(world.tiles[index]) >= 0, 'dig_dirt must be on dirt');

         var close = ActionController.getCloseTiles(world, index);
         ActionController.assert(close.findIndex(function(other) { return other === TILE.WATER; }) >= 0, 'dig_dirt must be next to water');

         return ActionController.setTile(world, index, TILE.WATER);
      };

      ActionController.dig_sand = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.SAND, 'dig_sand must be on sand');

         var close = ActionController.getCloseTiles(world, index);
         ActionController.assert(close.findIndex(function(other) { return other === TILE.WATER; }) >= 0, 'dig_sand must be next to water');

         return ActionController.setTile(world, index, TILE.WATER);
      };

      ActionController.shore_up_dirt = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.WATER, 'shore_up must be on water');

         var close = ActionController.getCloseTiles(world, index);
         ActionController.assert(close.findIndex(function(other) { return other === TILE.DIRT || other === TILE.GRASS; }) >= 0, 'shore_up must be next to dirt');

         return ActionController.setTile(world, index, TILE.DIRT);
      };

      ActionController.shore_up_sand = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.WATER, 'shore_up must be on water');

         var close = ActionController.getCloseTiles(world, index);
         ActionController.assert(close.findIndex(function(other) { return other === TILE.SAND; }) >= 0, 'shore_up must be next to sand');

         return ActionController.setTile(world, index, TILE.SAND);
      };

      ActionController.plow_dirt = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.DIRT, 'plow_dirt must be on dirt');

         return ActionController.setTile(world, index, TILE.SOIL);
      };

      ActionController.water_soil = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.SOIL, 'water_soil must be on soil');

         return ActionController.setTile(world, index, TILE.SOIL_WET);
      };

      ActionController.water_soil = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.SOIL || world.tiles[index] === TILE.SOIL_WET, 'plant_wheat must be on soil');

         return ActionController.setTile(world, index, TILE.SOIL_WET);
      };

      ActionController.plant_wheat = function(world, index, inventory) {
         ActionController.assert(world.tiles[index] === TILE.SOIL || world.tiles[index] === TILE.SOIL_WET, 'plant_wheat must be on soil');

         return ActionController.setOccupant(world, index, OCCUPANT.WHEAT_SEED)
      };

      ActionController.grow_wheat = function(world, index, inventory) {
         var occupant = world.occupants[index];
         ActionController.assert(occupant >= OCCUPANT.WHEAT_SEED && occupant <= OCCUPANT.WHEAT_COMPLEAT, 'grow_wheat must be used on wheat');

         return ActionController.setOccupant(world, index, occupant + 1);
      };

      ActionController.chop_tree = function(world, index, inventory) {
         var x = index % world.width;
         var y = Math.floor(index / world.width);
         var trees = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].map(function(offset) {
            var occupant = ActionController.getOccupant(world, x + offset[0], y + offset[1]);

            if (occupant === OCCUPANT.TREE) {
               return index + offset[0] + offset[1] * world.width;
            }
            else {
               return -1;
            }
         }).filter(function(index) { return index >= 0; });

         return ActionController.setOccupants(world, trees, OCCUPANT.STUMP).then((update1) => {
            return ActionController.setOccupants(world, trees.map((i) => i - world.width), OCCUPANT.LOG).then((update2) => {
               return update1.concat(update2);
            })
         })
      };

      ActionController.take_log = function(world, index, inventory) {
         ActionController.assert(world.occupants[index] === OCCUPANT.LOG, 'take_log must be used on a log');

         inventory.addItem(OCCUPANT.LOG);

         return ActionController.setOccupant(world, index, OCCUPANT.NONE);
      }

      ActionController.do_nothing = function() {
         console.log('do nothing');
         return ActionController.done().then(() => {
            console.log('did nothing');
         });
      };

      ActionController.placeTile = function(world, index, inventory, tile) {
         ActionController.assert(TILE.hasOwnProperty(tile), 'tile ' + tile + ' is not valid');
         ActionController.assert(inventory.hasItem('sandbox'), 'cannot place tiles without the sandbox');

         return ActionController.setTile(world, index, TILE[tile]);
      };

      ActionController.dropItem = function(world, index, inventory, item) {
         ActionController.assert(inventory.hasItem(item), 'cannot drop an item you dont have');

         inventory.removeItem(item);

         return ActionController.setOccupant(world, index, item);
      };

      ActionController.action = function(world, index, action, inventory) {
         var x = index % world.width;
         var y = Math.floor(index / world.width);
         var availableActions = ActionController.available(world, x, y, inventory);

         if (action.indexOf('drop_') === 0) {
            return ActionController.dropItem(world, index, inventory, parseInt(action.substr(5))).then((updates) => {
               return { executed: true, updates: updates };
            }).catch((e) => {
               return { executed: false, reason: e.message };
            });
         }
         else if (availableActions.indexOf(action) < 0) {
            return { executed: false, reason: 'Action ' + action + ' not available.' };
         }
         else if (action.indexOf('place_') === 0) {
            return ActionController.placeTile(world, index, inventory, action.substr(6)).then((updates) => {
               return { executed: true, updates: updates };
            }).catch((e) => {
               return { executed: false, reason: e.message };
            });
         }
         else if (!ActionController.hasOwnProperty(action)) {
            return { executed: false, reason: 'ActionController.' + action + ' does not exist.' };
         }
         else {
            return ActionController[action](world, index, inventory).then((updates) => {
               return { executed: true, updates: updates };
            }).catch((e) => {
               return { executed: false, reason: e.message };
            });
         }
      };

      return ActionController;
   };

   // web AND server woahh
   if (typeof(exports) === 'object') {
      module.exports = ActionController.init(require('../tiles'), require('../occupants'));
   }
   else {
      define(['constants/tiles', 'constants/occupants'], function(TILE, OCCUPANTS) { return ActionController.init(TILE, OCCUPANTS); });
   }

})();
