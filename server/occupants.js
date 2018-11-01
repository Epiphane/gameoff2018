const OCCUPANTS = [
   'NONE',
   'WHEAT_SEED',
   'WHEAT_SPROUT',
   'WHEAT_GROWING',
   'WHEAT_COMPLEAT',
   'STUMP',
   'TREE',
   'CACTUS',
   'STONE',
   'ROCK',
   'MARBLE',
   'TIKI',
   'REEDS_1',
   'REEDS_2',
   'MUSHROOM',
   'PILLAR',
   'LILLYPAD',
   'CORN_STALK',
   'CROSS',
   'LOG',
   // Just add more here,
   // Then reference public/js/helpers/occupant.js
];

module.exports = {};

OCCUPANTS.forEach((occupant, index) => {
   module.exports[occupant] = index;
});