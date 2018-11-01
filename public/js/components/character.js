define([
   'constants/materials',
   'components/sprite',
   'helpers/occupant',
   'helpers/terrain',
   'helpers/math'
], function(
   MATERIALS,
   SpriteComponent,
   OccupantHelper,
   TerrainHelper,
   MathUtil
) {
   return Juicy.Component.create('Character', {
      tileX: 0,
      tileY: 0,
      targetTileX: 0,
      targetTileY: 0,

      // Walk cycle frame stuff
      walkAnimSpeed: 4,
      walkStartFrame: 0,
      walkEndFrame: 3,
      walkOffset: 1,

      attackAnimSpeed: 4,
      attackStartFrame: 6,
      attackEndFrame: 9,

      direction: 0,
      moving: false,
      mouseTarget: null,

      // How many ticks it takes to go from one tile to the next
      ticksPerMovement: 14,
      ticksMoved: 0,

      emotion: null,

      isMoving: function() {
         return true;
      },

      isAttacking: function() {
         return false;
      },

      /*
       * If the sprite has different rows for each direction,
       * you can add specialized code here.
       */
      getDirectionFrame: function() {
         return 9 * this.direction;
      },

      sendPosition: function(conn) {
         localStorage.setItem('spawn', JSON.stringify([this.targetTileX, this.targetTileY]));
         if (conn) {
            conn.emit('player_pos', {
               x: this.targetTileX,
               y: this.targetTileY,
               direction: this.direction,
               uuid: this.entity.uuid
            });
         }
      },

      walkToTile: function(world, newTileX, newTileY) {
         if (newTileX < 0) newTileX = 0;
         if (newTileY < 0) newTileY = 0;
         if (newTileX >= world.width) newTileX = world.width - 1;
         if (newTileY >= world.height) newTileY = world.height - 1;

         this.targetTileX = newTileX;
         this.targetTileY = newTileY;
         this.targetX = this.targetTileX * TerrainHelper.tilesize;
         this.targetY = this.targetTileY * TerrainHelper.tilesize;
         this.premoveX = this.entity.position.x;
         this.premoveY = this.entity.position.y;

         this.moving = true;
         this.ticksMoved = 0;
      },

      move: function(world, dx, dy, conn) {
         // Cancel mouse movement
         this.mouseTarget = null;

         if (this.moving === false) {
            if (dx ===  1) this.direction = 2;
            if (dx === -1) this.direction = 1;
            if (dy ===  1) this.direction = 0;
            if (dy === -1) this.direction = 3;

            if (!OccupantHelper.isBlocked(world, this.tileX + dx, this.tileY + dy) &&
                (dx === 0 || dy === 0 ||
                !OccupantHelper.isBlocked(world, this.tileX, this.tileY + dy) ||
                !OccupantHelper.isBlocked(world, this.tileX + dx, this.tileY))) {
               this.walkToTile(world, this.tileX + dx, this.tileY + dy);

               this.sendPosition(conn);
            }
            // Try moving just up
            else if (dx !== 0 && dy !== 0 && !OccupantHelper.isBlocked(world, this.tileX, this.tileY + dy)) {
               this.walkToTile(world, this.tileX, this.tileY + dy);

               this.sendPosition(conn);
            }
            // or left
            else if (dx !== 0 && dy !== 0 && !OccupantHelper.isBlocked(world, this.tileX + dx, this.tileY)) {
               this.walkToTile(world, this.tileX + dx, this.tileY);

               this.sendPosition(conn);
            }
         }
      },

      doWalkAnim: function() {
         if (this.moving) {
            // Animate through the character's walk cycle every three frames
            if (this.entity.state.ticks % this.walkAnimSpeed === 0) {
               var walkCycleLength = this.walkEndFrame - this.walkStartFrame;
               this.walkOffset = ++this.walkOffset % walkCycleLength;
            }

            this.entity.getComponent('Image').frame = this.walkStartFrame + this.walkOffset;
         }
         else {
            this.entity.getComponent('Image').frame = this.walkStartFrame;
         }
      },

      update: function() {
         this.doWalkAnim();

         if (!this.moving && this.mouseTarget !== null) {
            if (this.tileX === this.mouseTarget.x &&
               this.tileY === this.mouseTarget.y) {
               this.mouseTarget = null; // Done!
            }

            // Find next step w A-star
            var nextTile = window.astar(this.entity.state.game, this.entity.state.world,
               {x: this.tileX, y: this.tileY}, this.mouseTarget);

            if (nextTile === null) {
               this.mouseTarget = null; // Unreachable target
            }

            this.walkToTile(nextTile.x, nextTile.y);
         }

         if (this.moving) {
            this.ticksMoved ++;
            this.entity.position.x = MathUtil.lerp(this.premoveX, this.targetX,
                this.ticksMoved / this.ticksPerMovement);
            this.entity.position.y = MathUtil.lerp(this.premoveY, this.targetY,
                this.ticksMoved / this.ticksPerMovement);

            if (this.ticksMoved >= this.ticksPerMovement) {
               this.moving = false;
               this.premoveX = this.entity.position.x;
               this.premoveY = this.entity.position.y;
               this.tileX = this.targetTileX;
               this.tileY = this.targetTileY;
            }

         }
         else {
            this.entity.position.x = this.tileX * TerrainHelper.tilesize;
            this.entity.position.y = this.tileY * TerrainHelper.tilesize;
         }

         this.entity.getComponent('Image').frame += this.getDirectionFrame();

         var world = this.entity.state.world;
         var tileX = Math.round(this.entity.position.x / TerrainHelper.tilesize);
         var tileY = Math.round(this.entity.position.y / TerrainHelper.tilesize);
         world.getComponent('WorldMap').updateOccupants(world, tileX + tileY * world.width);
      },

      render: function(context) {
         if (this.entity.state.world.ready) {
            var tileX = Math.round(this.entity.position.x / TerrainHelper.tilesize);
            var tileY = Math.round(this.entity.position.y / TerrainHelper.tilesize);

            var tile = this.entity.state.world.getTile(tileX, tileY);
            var material = MATERIALS[tile];
            var elevation = this.entity.state.world.getElevation(tileX, tileY) / 10;
                elevation += material.height;
            context.translate(0, Math.floor(-elevation));
         }
      },
   });
});
