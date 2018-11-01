define([
   'constants/tiles',
   'constants/occupants',
   'helpers/terrain',
   'helpers/atlas',
   'controller/action'
], function(
   TILE,
   OCCUPANT,
   TerrainHelper,
   TerrainAtlas,
   ActionController
) {
   var Icons = new Image();
       Icons.src = './images/ui_icons.png';

   var Items = new Image();
       Items.src = './images/occupants.png';

   var actions = {
   // 'ACTION_NAME FROM controller/Action.js': {
   //    text: What's shown on the UI. Keep it <= 8 characters.
   //    icon: A tile offset in images/ui_icons.png
   // }
      'dig_grass':      { text: 'Dig',      icon: [0, 0] },
      'dig_dirt':       { text: 'Dig',      icon: [1, 0] },
      'dig_sand':       { text: 'Dig',      icon: [2, 0] },
      'shore_up_dirt':  { text: 'Shore Up', icon: [3, 1] },
      'shore_up_sand':  { text: 'Shore Up', icon: [2, 1] },
      'plow_dirt':      { text: 'Plow',     icon: [3, 0] },
      'water_soil':     { text: 'Water',    icon: [6, 2] },
      'plant_wheat':    { text: 'Plant',    icon: [2, 2] },
      'plant_sapling':  { text: 'Plant',    icon: [0, 2] },
      'plant_tree':     { text: 'Plant',    icon: [1, 2] },
      'grow_wheat':     { text: 'Grow',     icon: [6, 2] },
      'harvest_wheat':  { text: 'Harvest',  icon: [2, 2] },
      'chop_tree':      { text: 'Chop',     icon: [3, 3] },
      'take_log':       { text: 'Take',     icon: [3, 3] },
      'do_nothing':     { text: 'Nothing',  icon: [0, 0] }
   };

   var inventory = {
      // If you want something to show up in the inventory, add an entry here
      // it's simple name: [x, y] offset in images/occupants.png as well
      // Also the name needs to refer to an occupant lol
      'LOG': [7, 1]
   };
   var inventoryArray = [];
   for (var key in inventory) {
      inventoryArray[OCCUPANT[key]] = inventory[key];
   }

   return Juicy.Component.create('UI', {
      constructor: function() {
         this.actions = [];

         // this.inventory is set externally
      },

      update: function(dt, game) {
         if (!this.entity.state.world.ready)
            return;

         var x = this.entity.state.mainChar.getComponent('Character').targetTileX;
         var y = this.entity.state.mainChar.getComponent('Character').targetTileY;

         this.actions = ActionController.available(this.entity.state.world, x, y, this.entity.state.inventory);

         this.inventoryItems = this.inventory.toArray().filter(function(entry) {
            return !isNaN(entry._id) && entry.count > 0 && !!inventoryArray[entry._id];
         });
         this.inventoryHeight = Math.ceil(this.inventoryItems.length / 5) * 50;
      },

      render: function(context) {
         context.fillStyle = 'white';

         var currentAction = this.entity.action;
         var inventoryHeight = this.inventoryHeight;
         this.actions.forEach(function(action_id, index) {
            var action = actions[action_id];

            context.font = '16px Pixellari, monospace';
            context.fillText((index + 1) + '.', 7, (index + 1) * 50 - 6 + inventoryHeight);

            context.fillStyle = currentAction === action_id ? 'red' : 'white';

            context.font = '32px Pixellari, monospace';
            context.fillText(action.text, 70, (index + 1) * 50 + inventoryHeight);

            var sx = action.icon[0] * TerrainHelper.tilesize;
            var sy = action.icon[1] * TerrainHelper.tilesize;
            context.drawImage(Icons, sx, sy, TerrainHelper.tilesize, TerrainHelper.tilesize,
               30, index * 50 + 23 + inventoryHeight, TerrainHelper.tilesize, TerrainHelper.tilesize);
         });

         this.inventoryItems.forEach(function(entry, index) {
            var item = inventoryArray[entry._id];

            var sx = item[0] * TerrainHelper.tilesize;
            var sy = item[1] * TerrainHelper.tilesize;
            context.drawImage(Items, sx, sy, TerrainHelper.tilesize, TerrainHelper.tilesize,
               10 + 39 * (index % 5), 15 + 39 * Math.floor(index / 5), TerrainHelper.tilesize, TerrainHelper.tilesize);

            context.fillStyle = 'white';
            context.font = '16px Pixellari, monospace';
            context.fillText(entry.count, 30 + 39 * (index % 5), 45 + 39 * Math.floor(index / 5));
         });
      },

      keypress: function(keyCode) {
         // Clamp to 0-9
         keyCode -= 48;
         if (keyCode === 0) keyCode = 10;
         keyCode --;

         if (keyCode < this.actions.length) {
            this.entity.state.action(this.actions[keyCode]);
         }
      },

      click: function(point) {
         if (point.y < 0 || point.y > this.inventoryHeight + this.actions.length * 50)
            return;

         if (point.y >= this.inventoryHeight) {
            var index = Math.floor((point.y - this.inventoryHeight) / 50);
            this.entity.state.action(this.actions[index]);
         }
         else {
            this.entity.state.action('drop_19')
         }
      }
   });
});
