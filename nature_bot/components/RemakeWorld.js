var Promise          = require('promise');
var seedrandom       = require('seedrandom');
var FastSimplexNoise = require('fast-simplex-noise').default;

module.exports = function(TILE, OCCUPANT, MATERIAL) {
   var RemakeWorld = function(params) {
      this.height = params.height || 100;
      this.width  = params.width  || 100;
   };

   var Cell = function(x, y, elevation) {
      this.x         = x;
      this.y         = y;
      this.tile      = TILE.WATER;
      this.occupant  = OCCUPANT.NONE;
      this.moisture  = 0;
      this.elevation = -1;
      this.distToFreshWater = -1;
      // this.elevation = elevation.scaled2D(x, y);

      this.ocean = false;
      this.coast = false;
   };

   Cell.prototype.toString = function() {
      return '[' + this.x + ',' + this.y + ']: ' + this.tile + ' ' + this.elevation + 'ft';
   }

   var Map = function(width, height) {
      var self = this;

      this.width  = width;
      this.height = height;

      for (var j = 0; j < height; j ++) {
         var row = [];
         for (var i = 0; i < width; i ++) {
            row.push(new Cell(i, j/*, elevation */));
         }
         this.push(row);
      }

      this.forEachCell((cell, x, y) => {
         cell.neighbors = [
            self.get(x - 1, y),
            self.get(x + 1, y),
            self.get(x, y - 1),
            self.get(x, y + 1)
         ].filter((cell) => !!cell); // Kick out nullbies

         cell.diagonal = [
            self.get(x - 1, y - 1),
            self.get(x + 1, y - 1),
            self.get(x - 1, y + 1),
            self.get(x + 1, y + 1)
         ].filter((cell) => !!cell); // Kick out nullbies
      })
   };

   Map.prototype = Object.create(Array.prototype);

   Map.prototype.cells = function() {
      return [].concat.apply([], this.map((row) => row));
   };

   Map.prototype.tiles = function() {
      return this.cells().map((cell) => cell.tile);
   };

   Map.prototype.occupants = function() {
      return this.cells().map((cell) => cell.occupant);
   };

   Map.prototype.get = function(x, y) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height)
         return null;

      return this[y][x];
   };

   Map.prototype.forEachCell = function(callback) {
      this.forEach((row, y) => 
         row.forEach((cell, x) => 
            callback(cell, x, y)
         )
      );
   };

   RemakeWorld.sections = [
      {
         water: { frequency: 0.03, max: 1, min: 0, octaves: 8 },
         water_pow: 5,
         moisture: 4
      },
      {
         water: { frequency: 0.02, max: 1, min: 0, octaves: 8 },
         water_pow: 4,
         moisture: 2
      },
      {
         water: { frequency: 0.04, max: 1, min: 0, octaves: 8 },
         water_pow: 4,
         moisture: 1
      },
      {
         water: { frequency: 0.02, max: 1, min: 0, octaves: 8 },
         water_pow: 4,
         moisture: 4
      },
   ];

   RemakeWorld.getBiome = function(cell) {
      if (cell.ocean) {
         return 'OCEAN';
      } else if (cell.water) {
         if (cell.elevation < 0.1) return 'MARSH';
         if (cell.elevation > 0.8) return 'ICE';
         return 'LAKE';
      } else if (cell.coast) {
         return 'BEACH';
      } else if (cell.elevation > 0.8) {
         return 'SNOW';
         if (cell.moisture > 0.50) return 'SNOW';
         else if (cell.moisture > 0.33) return 'TUNDRA';
         else if (cell.moisture > 0.16) return 'BARE';
         else return 'SCORCHED';
      } else if (cell.elevation > 0.6) {
         return 'BARE';
         if (cell.moisture > 0.66) return 'TAIGA';
         else if (cell.moisture > 0.33) return 'SHRUBLAND';
         else return 'TEMPERATE_DESERT';
      } else if (cell.elevation > 0.3) {
         if (cell.moisture > 0.83) return 'TEMPERATE_RAIN_FOREST';
         else if (cell.moisture > 0.50) return 'TEMPERATE_DECIDUOUS_FOREST';
         else if (cell.moisture > 0.16) return 'GRASSLAND';
         else return 'TEMPERATE_DESERT';
      } else {
         if (cell.moisture > 0.66) return 'TROPICAL_RAIN_FOREST';
         else if (cell.moisture > 0.33) return 'TROPICAL_SEASONAL_FOREST';
         else if (cell.moisture > 0.16) return 'GRASSLAND';
         else return 'SUBTROPICAL_DESERT';
      }
   };

   RemakeWorld.simpleBiome = function(biome) {
      switch (biome) {
      case 'OCEAN':
      case 'MARSH':
      case 'LAKE':
         return 'WATER';

      case 'ICE':
         return 'ICE';

      case 'BEACH':
         return 'BEACH';

      case 'SNOW':
         return 'SNOW';

      case 'TUNDRA':
      case 'BARE':
      case 'SCORCHED':
      case 'TAIGA':
         return 'ROCKY';

      case 'SHRUBLAND':
      case 'GRASSLAND':
         return 'PLAIN';

      case 'TEMPERATE_DESERT':
      case 'TROPICAL_SEASONAL_FOREST':
      case 'SUBTROPICAL_DESERT':
         return 'DESERT';

      case 'TEMPERATE_RAIN_FOREST':
      case 'TEMPERATE_DECIDUOUS_FOREST':
      case 'TROPICAL_RAIN_FOREST':
         return 'FOREST';
      }
   };

   RemakeWorld.getTile = function(cell) {
      switch (cell.biome) {
      case 'WATER':
      case 'ICE':
      case 'SNOW':
      case 'GRASS':
         return TILE[cell.biome];
      case 'FOREST':
      case 'PLAIN':
         return TILE.GRASS;
      case 'BEACH':
      case 'DESERT':
         return TILE.SAND;
      case 'ROCKY':
         return TILE.STONE;
      }
   };

   RemakeWorld.remake = function(width, height) {
      var map = new Map(width, height);

      // Don't use a real timestamp cause seed is stored as an int lul
      var seed = new Date().getTime() % 5000;//Math.random();
      Math.seedrandom(seed);
      // Math.seedrandom(4205);
      // Math.seedrandom(396);
      // Math.seedrandom(474);

      var tiles = [];
      var occupants = [];

      var horizontal_sections = 2;
      var vertical_sections = 2;
      var sections = horizontal_sections * vertical_sections;
      var section_width = width / horizontal_sections;
      var section_height = height / vertical_sections;

      var waterNoise = [];
      for (var i = 0; i < sections; i ++)
         waterNoise.push(new FastSimplexNoise(RemakeWorld.sections[i].water));

      var waterNoiseAll = new FastSimplexNoise({ frequency: 0.03, max: 1, min: 0, octaves: 8 });

      // Define a coastline
      map.forEachCell((cell, x, y) => {
         cell.local_x = x % section_width;
         cell.local_y = y % section_height;
         cell.section_x = Math.floor(x / section_width);
         cell.section_y = Math.floor(y / section_width);
         cell.section = cell.section_x + horizontal_sections * cell.section_y;
         cell.center_vector = {
            x: 2 * (cell.local_x - section_width  / 2) / section_width,
            y: 2 * (cell.local_y - section_height / 2) / section_height
         };
         cell.total_dist = Math.sqrt(
            4 * (cell.x / map.width  - 0.5) * (cell.x / map.width  - 0.5) +
            4 * (cell.y / map.height - 0.5) * (cell.y / map.height - 0.5));
         cell.center_vector.length = Math.sqrt(
            cell.center_vector.x * cell.center_vector.x +
            cell.center_vector.y * cell.center_vector.y);

         var water = waterNoise[cell.section].scaled2D(x, y);
         var waterAll = waterNoiseAll.scaled2D(x, y);

         cell.water = !((water > 0.3 + 0.4 * Math.pow(cell.center_vector.length, RemakeWorld.sections[cell.section].water_pow))
            || (water > 0.3 + 0.4 * Math.pow(cell.total_dist, 2)));
         if (x === 0 || y === 0 || x === width - 1 || y === height - 1)
            cell.water = true;

         cell.tile = cell.water ? TILE.WATER : TILE.STONE;
      });

      // Compute the elevation of all tiles, and determine what's ocean
      map.get(0, 0).ocean = true;
      map.get(0, 0).elevation = 0;
      var tileQueue = [map.get(0, 0)];
      while (tileQueue.length) {
         var cell = tileQueue.shift();

         var neighborFunc = function(step) {
            return function(neighbor) {
               if (cell.water) {
                  if (neighbor.water) {
                     if (neighbor.elevation < 0 || neighbor.elevation > cell.elevation + 0.0001) {
                        neighbor.elevation = cell.elevation + 0.0001;
                        neighbor.ocean     = (neighbor.elevation < 1);
                        tileQueue.push(neighbor);
                     }
                  }
                  else if (neighbor.elevation < 0 || neighbor.elevation > cell.elevation + step) {
                     neighbor.coast    |= cell.ocean;
                     neighbor.elevation = cell.elevation + step;

                     tileQueue.push(neighbor);
                  }
               }
               else {
                  if (neighbor.water) {
                     if (neighbor.elevation < 0 || neighbor.elevation > cell.elevation + 0.0001) {
                        neighbor.elevation = cell.elevation + 0.0001;

                        tileQueue.push(neighbor);
                     }
                  }
                  else if (neighbor.elevation < 0 || neighbor.elevation > cell.elevation + step) {
                     neighbor.elevation = cell.elevation + step;
                     tileQueue.push(neighbor);
                  }
               }
            }
         };

         cell.neighbors.forEach(neighborFunc(1));
         cell.diagonal.forEach(neighborFunc(Math.sqrt(2)));
      }

      var cells = map.cells().filter((cell) => !cell.ocean).sort((a, b) => a.elevation - b.elevation);
      cells.forEach((element, index) => {
         element.elevation = Math.min(1, Math.max(0, 1 - Math.sqrt(1 - index / cells.length)));
      });

      // Compute the direction water flows
      map.forEachCell((cell) => {
         cell.isValley       = true;
         cell.lowestNeighbor = cell;

         cell.neighbors.forEach((neighbor) => {
            if (neighbor.elevation < cell.lowestNeighbor.elevation) {
               cell.isValley = false;
               cell.lowestNeighbor = neighbor;
               cell.diagonalNeighbor = null;
            }
         });

         cell.diagonal.forEach((neighbor) => {
            if (neighbor.elevation < cell.lowestNeighbor.elevation) {
               cell.isValley = false;
               cell.lowestNeighbor = neighbor;

               var dx = neighbor.x - cell.x;
               var dy = neighbor.y - cell.y;
               var join1 = map.get(cell.x, neighbor.y);
               var join2 = map.get(neighbor.x, cell.y);
               cell.diagonalNeighbor = join1.elevation > join2.elevation ? join2 : join1;
            }
         });
      });

      var proportion = Math.floor(cells.length / 2);
      // Create a few river
      for (var i = 0; i < 8; i ++) {
         var start = Math.floor(Math.random() * proportion);
         var riverhead = cells[cells.length - proportion + start];
         while (!riverhead.ocean && riverhead !== riverhead.lowestNeighbor) {
            riverhead.water = true;
            if (riverhead.diagonalNeighbor)
               riverhead.diagonalNeighbor.water = true;

            riverhead = riverhead.lowestNeighbor;
         }
      }

      // Compute the moisture of all tiles
      var tileQueue = map.cells().filter((cell) => cell.water && !cell.ocean);
      tileQueue.forEach((cell) => cell.distToFreshWater = 0);
      while (tileQueue.length) {
         var cell = tileQueue.shift();

         var neighborFunc = function(step) {
            return function(neighbor) {
               if (neighbor.distToFreshWater < 0 || neighbor.distToFreshWater > cell.distToFreshWater + step) {
                  neighbor.distToFreshWater = cell.distToFreshWater + step;
                  tileQueue.push(neighbor);
               }
            }
         }

         cell.neighbors.forEach(neighborFunc(1));
         cell.diagonal.forEach(neighborFunc(Math.sqrt(2)));
      }

      var cells = map.cells().sort((a, b) => a.distToFreshWater - b.distToFreshWater);
      cells.forEach((element, index) => {
         element.moisture = RemakeWorld.sections[element.section].moisture * (1 - index / cells.length);
         if (element.moisture < 0) element.moisture = 0;
         if (element.moisture > 1) element.moisture = 1;
      });

      // Determine biomes
      map.forEachCell((cell) => {
         cell.biome = RemakeWorld.simpleBiome(RemakeWorld.getBiome(cell));
         cell.tile = RemakeWorld.getTile(cell);

         cell.elevation = Math.floor(cell.elevation * 100);
         cell.material = MATERIAL[cell.tile];
         cell.grade = Math.floor(cell.elevation / (cell.material.grade || 10));
      });

      function match(cell, dx, dy) {
         var other = map.get(cell.x + dx, cell.y + dy);

         return other.biome === cell.biome && other.grade === cell.grade;
      }

      function isFree(cell, width) {
         while (width-- > 0) {
            var other = map.get(cell.x + width, cell.y);

            if (other.occupant) return false;
         }

         return true;
      }

      function shuffle(a) {
         var j, x, i;
         for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
         }
      }

      var tikiPlaced = false;
      var cells = map.cells();
      shuffle(cells);
      cells.forEach((cell) => {
         if (cell.biome === 'DESERT' && Math.random() > 0.9)
            cell.occupant = OCCUPANT.CACTUS;

         if (cell.biome === 'FOREST' && Math.random() > 0.9) {
            if (match(cell, -1, 0) && match(cell, 1, 0) && match(cell, 0, -1)) {
               cell.occupant = OCCUPANT.TREE;
            }
         }

         if (cell.biome === 'ROCKY') {
            if (!tikiPlaced && isFree(cell, 2) && match(cell, -1, 0) && match(cell, 1, 0) && match(cell, 0, -1) && match(cell, 1, -1)) {
               cell.occupant = OCCUPANT.TIKI;
               tikiPlaced = true;
            }
         }
      });

      var cells = map.cells();
      return {
         seed: seed,
         tiles: cells.map((cell) => cell.tile),
         elevation: cells.map((cell) => cell.elevation),
         moisture: cells.map((cell) => cell.moisture),
         occupants: cells.map((cell) => cell.occupant)
      };
   }

   RemakeWorld.prototype.init = function(world, socket) {
      var self = this;
      return new Promise(function(resolve, reject) {
         socket.emit('remake', RemakeWorld.remake(self.width, self.height));
         socket.once('remake', function(success, err) {
            if (!success) {
               reject(err);
            }
            else {
               resolve();
            }
         })
      });
   };

   RemakeWorld.prototype.tick = function(world, players) {};

   return RemakeWorld;
}