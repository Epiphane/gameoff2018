var http      = require('http');
var io        = require('socket.io');
var ioClient  = require('socket.io-client');
var env       = require('../server/config/environment')
var log       = require('./log');
var NatureBot = require('./bot');
var config    = require('./config');

var domain    = process.env.DOMAIN;
var secret    = process.env.ELEVATED_SECRET;
if (env.env === 'production') {
   domain = env.production_url;
}

if (!secret) {
   log.warning('ELEVATED_SECRET is not set, trying to load local.env.js');
   var localEnv = require('../server/config/local.env');
   secret = localEnv.ELEVATED_SECRET;
}

var socket    = ioClient.connect("http://localhost:3000/");
var bot       = new NatureBot(domain, socket, config);

socket.on('connect', function() {
   log.info('Connected to server');
   socket.emit('elevate', secret);
});

socket.on('disconnect', function() {
   log.info('Disconnected from server');
   bot.stop();
});

socket.on('elevated', function(result) {
   if (result) {
      log.info('Elevation token accepted');
      bot.start();
   }
   else {
      log.error('Elevation token rejected');
      process.exit(1);
   }
});

socket.on('updates', function(updates) {
   log.verbose('Received updates: ' + JSON.stringify(updates));
   bot.update(updates);
});

socket.on('player_pos_update', function(newPosition) {
   bot.updatePlayerPos(newPosition);
});

socket.on('player_leave', function(uuid) {
   bot.deletePlayer(uuid);
});
