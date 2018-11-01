requirejs.config({
   baseUrl: 'js',
   paths: {
   }
});

require([
   'connection_manager',
   'content_manager',
   'screens/game'
], function(
   ConnectionManager,
   ContentManager,
   GameScreen
) {
   window.GAME_WIDTH = 800;
   window.GAME_HEIGHT = 800;

   // Juicy.Game.init(document.getElementById('game-canvas'), GAME_WIDTH, GAME_HEIGHT, {
   //    LEFT: 37,
   //    UP: 38,
   //    RIGHT: 39,
   //    DOWN: 40,
   //    SPACE: 32,
   //
   //    W: 87,
   //    A: 65,
   //    S: 83,
   //    D: 68,
   // });

   // document.getElementById('game-canvas').getContext('2d').imageSmoothingEnabled = false;

   window.onmousewheel = function(e) {
      Juicy.Game.trigger('mousewheel', e);
   };

   // On window resize, fill it with the game again!
   window.onresize = function() {
      Juicy.Game.resize();
   };

   var Music = new buzz.sound("/audio/FubSong", {
       formats: [ "mp3" ]
   });

   Music.play().loop();

   window.muted = JSON.parse(localStorage.getItem('mute') || 'false');
   if (muted) {
      Music.mute();
      $('#mute-link').text('unmute');
   }
   window.toggleMute = function() {
      muted = !muted;
      localStorage.setItem('mute', muted);

      if (muted) {
         Music.mute();
         $('#mute-link').text('unmute');
      }
      else {
         Music.unmute();
         $('#mute-link').text('mute');
      }
   }

   // Initialize connection to server
   var connection = new ConnectionManager();

   var disconnect = $('#disconnect');
   connection.on('disconnect', function() {
      disconnect.show();
   });
   connection.on('reconnect', function() {
      disconnect.hide();
   });

   // Juicy.Game.setState(new GameScreen(connection)).run();


   window.connectMobile = function() {
      connection.emit('become_mobile', {name: "who cares"});
      $("#pop-da-corn").show(0);
      $("#choose-your-fate").hide(0);
   };

   window.do_pop = function() {
      connection.emit('do_pop');

      // do juicy animation here or something
      console.log("hi mom");
   };

   window.connectBig = function() {
      connection.emit('become_desktop');
      $("#pop-da-corn").hide(0);
      $("#choose-your-fate").hide(0);
   };

   connection.on('hi_there', function(data) {
      console.log("yeah this is happening" + JSON.stringify(data));

      $("#dumb-number").html(data)
   });

   connection.on('world_state', function(world) {
      $("#dumb-number").html(world.score);
   });
})
