define([
   'constants/tiles',
   'constants/materials'
], function(
   TILE,
   MATERIALS
) {
   var AtlasHelper = {};

   /**
    * tiles is a number representing 4 pieces of info:
    *   0x1 means the top left is applicable
    *   0x2 means the top right
    *   0x4 means the bottom left
    *   0x8 means the bottom right
    * inverse refers to whether this is an "above" offset or a "below" offset
    */
   AtlasHelper.getOffsetFromApplicableTiles = function(tiles, inverse) {
      switch (tiles) {
      case 0x1: return !inverse ? [3, 2] : [0, 1];
      case 0x2: return !inverse ? [0, 3] : [1, 1];
      case 0x4: return !inverse ? [3, 1] : [0, 2];
      case 0x8: return !inverse ? [0, 0] : [1, 2];

      case 0x3: return !inverse ? [2, 2] : [2, 1];
      case 0x5: return !inverse ? [3, 3] : [2, 3];
      case 0x9: return !inverse ? [1, 3] : [3, 0];
      
      case 0x6: return !inverse ? [1, 0] : [2, 0];
      case 0xA: return !inverse ? [2, 3] : [3, 3];

      case 0xC: return !inverse ? [2, 1] : [2, 2];
      
      case 0x7: return !inverse ? [1, 2] : [0, 0];
      case 0xB: return !inverse ? [0, 2] : [3, 1];
      case 0xD: return !inverse ? [1, 1] : [0, 3];
      case 0xE: return !inverse ? [0, 1] : [3, 2];

      case 0xF: 
         console.error('You should only get offset for non-basic tiles');
         return null;
      }
   };

   /**
    * Returns a list of offsets, in draw order (bottom up).
    * AtlasHelper takes care of actually combining the images correctly
    */
    window.AtlasHelper = AtlasHelper
   AtlasHelper.getOffsets = function(tiles, elevations, i) {
      var infos = tiles.map(function(tile, index) {
         return { 
            tile: tile,
            mat: MATERIALS[tile], 
            elevation: elevations[index] || 0,
            grade: Math.floor((elevations[index] || 0) / (MATERIALS[tile].grade || 10)),
            flag: 1 << index,
            drawn: false
         };
      }).sort(function(a, b) { return 100 * (a.mat.height - b.mat.height) + a.elevation - b.elevation });

      var offsets = [];
      var base    = infos[0];
      var flags   = 0;
      var index   = 0;
      // infos.forEach(function(info) {
      //    if (!info.drawn && 
      //         info.mat.key === base.mat.key && 
      //        (info.elevation < base.elevation + 10 || !!base.mat.stack)) {
      //       flags += info.flag;
      //       info.drawn = true;
      //    }
      // });
      var step = 10;
      while (index < infos.length && infos[index].mat.key === base.mat.key && infos[index].grade === base.grade) {
         flags += infos[index].flag;
         index ++;
      }
      if (base.mat.key === 'WATER' && flags !== 0xF) {
         var offset = base.mat.offset_below;
         var b_off = AtlasHelper.getOffsetFromApplicableTiles(flags, true /* inverse */);
         offsets.push([offset[0] + b_off[0], offset[1] + b_off[1]]);
      }
      else {
         offsets.push([base.mat.offset_basic[0] + i % 3, base.mat.offset_basic[1]]);
      }

      // return offsets;

      // Now do the rest (non-base)
      while (index < infos.length) {
         var tile  = infos[index];
         var flags = 0;
         while (index < infos.length && infos[index].mat.key === tile.mat.key && infos[index].grade === tile.grade) {
            flags += infos[index].flag;
            index ++;
         }

         var off = AtlasHelper.getOffsetFromApplicableTiles(flags);
         offsets.push([tile.mat.offset_above[0] + off[0], tile.mat.offset_above[1] + off[1]]);
      }

      // var baseMaterial = null;
      // var minHeight = 100;
      // var maxHeight = 0;
      // infos.forEach(function(info) {
      //    if (info.elevation < minHeight) { minHeight = info.elevation; baseMaterial =  }
      //    if (info.elevation > maxHeight) { maxHeight = info.elevation; }
      // });

      // var baseHeight = Math.min.apply(Math, mats);

      // var baseTiles  = 0;
      // mats.forEach(function(mat, i) { if (mat.height === baseHeight) { baseTiles += (1 << i); } });
      // var offset = [];
      // var candidate = mats.find((mat) => mat.height === baseHeight);
      // if (baseTiles === 0xF || candidate.key !== 'WATER') {
      //    Object.assign(offset, candidate.offset_basic);
      //    offset[0] += i % 3;
      // }
      // else {
      //    Object.assign(offset, candidate.offset_below);
      //    var b_off = AtlasHelper.getOffsetFromApplicableTiles(baseTiles, true /* inverse */);
      //    offset[0] += b_off[0];
      //    offset[1] += b_off[1];
      // }

      // var offsets = [offset];

      // while (++baseHeight <= maxHeight) {
      //    var tiles    = 0;
      //    var material = null;
      //    mats.forEach(function(mat, i) { 
      //       if (mat.height === baseHeight) { tiles += (1 << i); material = mat; } 
      //    });

      //    if (material) {
      //       var off = AtlasHelper.getOffsetFromApplicableTiles(tiles);
      //       off[0] += material.offset_above[0];
      //       off[1] += material.offset_above[1];

      //       offsets.push(off);
      //    }
      // }

      return offsets;
   };

   return AtlasHelper;
});