define([
   'constants/tiles',
   'constants/materials',
   'helpers/terrain',
   'helpers/atlas',
   'controller/action'
], function(
   TILE,
   MATERIALS,
   TerrainHelper,
   TerrainAtlas,
   ActionController
) {
   var Icons = new Image();
       Icons.src = './images/ui_icons.png';

   var actions = {
      'dig_grass':      { text: 'Dig',      icon: [0, 0] },
      'dig_dirt':       { text: 'Dig',      icon: [1, 0] },
      'dig_sand':       { text: 'Dig',      icon: [2, 0] },
      'shore_up':       { text: 'Shore Up', icon: [2, 1] },
      'plow_dirt':      { text: 'Plow',     icon: [3, 0] },
      'water_soil':     { text: 'Water',    icon: [6, 2] },
      'plant_wheat':    { text: 'Plant',    icon: [2, 2] },
      'plant_sapling':  { text: 'Plant',    icon: [0, 2] },
      'plant_tree':     { text: 'Plant',    icon: [1, 2] },
      'grow_wheat':     { text: 'Grow',     icon: [6, 2] },
      'harvest_wheat':  { text: 'Harvest',  icon: [6, 2] }
   };

   return Juicy.Component.create('UI', {
      constructor: function() {
      },

      render: function(context) {
         context.fillStyle = 'white';

         var currentAction = this.entity.action;
         MATERIALS.forEach(function(material, index) {
            context.fillStyle = currentAction === material.key ? 'red' : 'white';
            
            context.font = '16px Pixellari, monospace';
            context.fillText((index + 1) + '.', 7, (index + 1) * 50 - 6);

            context.font = '32px Pixellari, monospace';
            context.fillText(material.key, 70, (index + 1) * 50);

            TerrainHelper.drawOffset(context, 30, index * 50 + 23, material.offset_basic);
         });
      },

      keypress: function(keyCode) {
         // Clamp to 0-9
         keyCode -= 48;
         if (keyCode === 0) keyCode = 10;
         keyCode --;

         if (keyCode < MATERIALS.length) {
            this.entity.action = MATERIALS[keyCode].key;
         }
      },

      click: function(point) {
         if (point.y < 0 || point.y > MATERIALS.length * 50)
            return;

         var index = Math.floor(point.y / 50);
         this.entity.action = MATERIALS[index].key;
      }
   });
});
