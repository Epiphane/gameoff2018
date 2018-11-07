define([
   'helpers/terrain',
   'entities/ui',
   'entities/world',
   'entities/minimap',
   'entities/character',
   'controller/action',
   'controller/inventory',
   'helpers/math'
], function(
   TerrainHelper,
   UI,
   World,
   Minimap,
   Character,
   ActionController,
   Inventory,
   MathUtil
) {
   return Juicy.State.extend({
      constructor: function(connection) {
         this.sandbox = location.search.indexOf('sandbox') >= 0;
         this.holistic = location.search.indexOf('holistic') >= 0;
         this.connection = connection;

         this.minimap = new Minimap(this);
         this.world = new World(this, this.minimap);

         this.lastDrag = null;
         this.friends = {};

         var self = this;
         connection.on('connect', this.fetch.bind(this));
         connection.on('remake', this.fetch.bind(this));

         connection.on('updates', function(updates) {
            self.world.performUpdates(updates);
         });

         connection.on('emote', function(whoWhich) {
            if (self.friends[whoWhich.who]) {
               self.doEmote(self.friends[whoWhich.who], whoWhich.which);
            }
         });

         connection.on('player_pos_update', function(newPosition) {
            var movingFriend = self.friends[newPosition.uuid];
            if (!movingFriend) {
               movingFriend = new Character(self);
               self.friends[newPosition.uuid] = movingFriend;
            }
            movingFriend.getComponent('Character').walkToTile(self, newPosition.x, newPosition.y);
            movingFriend.getComponent('Character').direction = newPosition.direction;
         });

         connection.on('player_leave', function(uuid) {
            delete self.friends[uuid];
         });

         this.cooldown = 0.2;
         this.timer = 0;
         this.ticks = 0;
         this.action_id = 0;

         this.camera = new Juicy.Point();

         this.inventory = new Inventory();
         if (this.sandbox)
            this.inventory.addItem('sandbox');

         this.ui = new UI(this, this.sandbox);
         this.ui.getComponent('UI').inventory = this.inventory;
         this.mainChar = new Character(this);
         this.mainChar.uuid = MathUtil.makeUuid();

         this.world.setMainChar(this.mainChar);
         this.world.setFriends(this.friends);

         this.minimapFrame = new Juicy.Entity(this, ['Image']);
         this.minimapFrame.setImage('./images/frame.png');
      },

      fetch: function() {
         var self = this;
         $.get('/api/world').then(function(world) {
            self.world.set(world);

            self.placeMainChar();
         });
      },

      placeMainChar: function() {
         var character = this.mainChar.getComponent('Character');

         var spawn = JSON.parse(localStorage.getItem('spawn') || 'null');
         if (!spawn) {
            var rando = Math.random();
            if (rando < 0.25) {
               spawn = [this.world.width / 4, this.world.height / 4];
            }
            else if (rando < 0.5) {
               spawn = [this.world.width * 3 / 4, this.world.height / 4];
            }
            else if (rando < 0.75) {
               spawn = [this.world.width / 4, this.world.height * 3 / 4];
            }
            else {
               spawn = [this.world.width * 3 / 4, this.world.height * 3 / 4];
            }
         }

         character.targetTileX = character.tileX = Math.floor(spawn[0]);
         character.targetTileY = character.tileY = Math.floor(spawn[1]);
         this.mainChar.position.x = character.tileX * TerrainHelper.tilesize;
         this.mainChar.position.y = character.tileY * TerrainHelper.tilesize;
         character.sendPosition(this.connection);

         this.camera.x = this.mainChar.position.x;
         this.camera.y = this.mainChar.position.y;
      },

      key_SPACE: function() {
         this.connection.emit('remake');
      },

      doEmote: function(player, which) {
         player.getComponent('Emotion').lifeLeft = 100;
         player.getComponent('Emotion').emojiFrame = which;
      },

      emote: function(which) {
         this.connection.emit('emote', {who: this.mainChar.uuid, which: which});
         this.doEmote(this.mainChar, which);
      },

      keypress: function(e) {
         // Numbah?
         if (e.keyCode >= 48 && e.keyCode <= 57) {
            this.ui.getComponent('UI').keypress(e.keyCode);
         }
      },

      update: function(dt, game) {
         if (!this.world)
            return;

         var speed = 55;
         var character = this.mainChar.getComponent('Character');

         if (!character.moving) {
            var dx = 0, dy = 0;

            if (game.keyDown('LEFT')) {
               dx --;
            }
            if (game.keyDown('RIGHT')) {
               dx ++
            }
            if (game.keyDown('UP')) {
               dy --;
            }
            if (game.keyDown('DOWN')) {
               dy ++;
            }

            if (dx !== 0 || dy !== 0) {
               character.move(this.world, dx, dy, this.connection);
            }
         }

         this.mainChar.update();
         var LEEWAY = 4 * TerrainHelper.tilesize;
         if (this.mainChar.position.x < this.camera.x - LEEWAY)
            this.camera.x = this.mainChar.position.x + LEEWAY;
         if (this.mainChar.position.x > this.camera.x + LEEWAY)
            this.camera.x = this.mainChar.position.x - LEEWAY;
         if (this.mainChar.position.y < this.camera.y - LEEWAY)
            this.camera.y = this.mainChar.position.y + LEEWAY;
         if (this.mainChar.position.y > this.camera.y + LEEWAY)
            this.camera.y = this.mainChar.position.y - LEEWAY;

         for (var friendID in this.friends) {
            this.friends[friendID].update();
         }
         this.world.update(dt);
         this.ticks ++;

         this.ui.update(dt);
      },

      doAction: function(action, index) {
         var self = this;
         var _id = ++this.action_id;

         // Do the action client-side as well
         var localExecute = ActionController.action(this.world, index, action, this.inventory);
         if (!localExecute.then) localExecute = $.Deferred().resolve(localExecute);
         localExecute.then(function(localResult) {
            // TODO I wonder how much delay this introduces to sending out actions
            if (localResult.executed) {
               // We can ignore the updates cause they already happened lol

               self.connection.emit('action', index, action, _id);
               self.connection.onOnce('action_' + _id, function(response, message) {
                  if (response === 'fail') {
                     console.error('Server rejected action_' + _id + ': ' + message);
                     console.error('Backtracking is unimplemented');
                  }
               })
            }
            else {
               console.error('Invalid action: ' + localResult.reason);
            }
         });
      },

      action: function(action) {
         var x = this.mainChar.getComponent('Character').targetTileX;
         var y = this.mainChar.getComponent('Character').targetTileY;
         var index = x + y * this.world.width;

         return this.doAction(action, index);
      },

      activate: function(point) {
         if (!this.world)
            return;

         if (this.holistic) {
            point.x = Math.floor(point.x / this.mapScale / TerrainHelper.tilesize + 0.5);
            point.y = Math.floor(point.y / this.mapScale / TerrainHelper.tilesize + 0.5);
         }
         else {
            point.x = Math.floor((point.x + this.camera.x - this.viewport_w / 2) / TerrainHelper.tilesize + 0.5);
            point.y = Math.floor((point.y + this.camera.y - this.viewport_h / 2) / TerrainHelper.tilesize + 0.5);
         }

         if (point.x < 0 || point.y < 0) return;

         // Sandbox off by default
         if (!this.sandbox) {
            return;
            if (point.x === 0) point.x = 1;
            if (point.y === 0) point.y = 1;
            if (point.x === this.world.width) point.x = this.world.width - 1;
            if (point.y === this.world.height) point.y = this.world.height - 1;

            this.mainChar.getComponent('Character').mouseTarget = point;
         }
         else {
            if (!this.lastDrag) {
               this.lastDrag = point.add(new Juicy.Point(0, 1));
            }

            while (!this.lastDrag.isEqual(point)) {
               var dist = point.sub(this.lastDrag);
               this.lastDrag.x += Math.sign(dist.x);
               this.lastDrag.y += Math.sign(dist.y);

               var index = this.lastDrag.x + this.lastDrag.y * this.world.width;

               if (this.ui.action !== 'none') {
                  this.doAction('place_' + this.ui.action, index);
               }
            }
         }
      },

      mousewheel: function(e) {
         var dir = Math.sign(e.wheelDelta);
         var horizontal = e.getModifierState('Shift');

         var SCROLL_SLOW = 0.5;

         if (horizontal) {
            this.camera.x -= e.wheelDeltaY * SCROLL_SLOW;
            this.camera.y -= e.wheelDeltaX * SCROLL_SLOW;
         }
         else {
            this.camera.x -= e.wheelDeltaX * SCROLL_SLOW;
            this.camera.y -= e.wheelDeltaY * SCROLL_SLOW;
         }
      },

      dragstart: function(point) {
         if (point.x > this.ui.position.x)
            return;

         this.activate(point);
      },

      drag: function(point) {
         if (point.x > this.ui.position.x)
            return;

         this.activate(point);
      },

      dragend: function(point) {
         this.lastDrag = null;
      },

      click: function(point) {
         if (point.x > this.ui.position.x) {
            this.ui.click(point);

            return;
         }

         this.activate(point);
         this.lastDrag = null;
      },

      render: function(context, width, height) {
         if (!this.world.ready || !TerrainHelper.ready) {
            return;
         }

         this.viewport_w = width;
         this.viewport_h = height;

         if (this.camera.x - width / 2 < 0)
            this.camera.x = width / 2;
         if (this.camera.y - height / 2 < 0)
            this.camera.y = height / 2;
         if (this.camera.x + width / 2 > this.world.width * TerrainHelper.tilesize)
            this.camera.x = this.world.width * TerrainHelper.tilesize - width / 2;
         if (this.camera.y + height / 2 > this.world.height * TerrainHelper.tilesize)
            this.camera.y = this.world.height * TerrainHelper.tilesize - height / 2;

         // Draw pre-rendered map
         context.save();
         if (this.holistic) {
            this.mapScale = height / (this.world.height * TerrainHelper.tilesize);
            context.scale(this.mapScale, this.mapScale);
            this.world.render(context, 0, 0, this.world.width * TerrainHelper.tilesize, this.world.height * TerrainHelper.tilesize);
         }
         else {
            context.translate(-this.camera.x + width / 2, -this.camera.y + height / 2);
            this.world.render(context, this.camera.x - width / 2, this.camera.y - height / 2, width, height);
         }
         context.restore();

         // Minimap frame
         this.minimapFrame.position.x = width - this.minimapFrame.width;
         this.minimapFrame.render(context);

         // Minimap
         {
            context.save();
            context.translate(this.minimapFrame.position.x + 4, this.minimapFrame.position.y + 4);
            context.scale(2, 2);

            this.minimap.render(context, 0, 0, this.world.width, this.world.height);

            // Cool lil black box over the minimap
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, this.world.width, this.world.height);

            this.minimap.render(context,
               (this.camera.x - width / 2) / TerrainHelper.tilesize,
               (this.camera.y - height / 2) / TerrainHelper.tilesize,
               Math.floor(width / TerrainHelper.tilesize),
               Math.floor(height / TerrainHelper.tilesize));

            context.restore();
         }

         this.ui.position.x = width - this.minimapFrame.width;
         this.ui.position.y = this.minimapFrame.height;
         this.ui.height = height - this.minimapFrame.height;
         this.ui.render(context);
      }
   })
})
