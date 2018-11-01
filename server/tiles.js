const TILES = [
   'GRASS',
   'WATER',
   'SAND',
   'DIRT',
   'SOIL',
   'STONE',
   'SOIL_WET',
   'SNOW',
   'ICE'
   // Just add more here,
   // then reference nature_bot/materials.js
];

module.exports = {};

TILES.forEach((tile, index) => {
   module.exports[tile] = index;
});