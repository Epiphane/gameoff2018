'use strict';

/*
 * NOTE: Only works with HTML5 Canvas
 * (Like you use anything else anyway...)
 */
(function(window, document) {
   /* -------------------- Animation frames ----------------- */
   var requestAnimationFrame = (function() {
      return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback) {
            window.setTimeout(callback, 1000 / 60);
         };
      })();

   /* Base object */
   var Juicy = window.Juicy = {};

   /* ----------------------- Sounds ------------------------ */
   var Sounds = window.Sounds = {};

   var musicMuted = false;
   var sfxMuted = false;
   Juicy.toggleMute = function(musicOrSfx) {
      var loopExpected = (musicOrSfx === 'music');
      var muting = false;
      if (loopExpected) {
         muting = musicMuted = !musicMuted;
      }
      else {
         muting = sfxMuted = !sfxMuted;
      }

      for (var key in Sounds) {
         var sound = Sounds[key];

         sound.elements.forEach(function(element) {
            // console.log(element.loop)
            if (element.loop === loopExpected) {

               element.volume = (muting ? 0 : sound.volume);
            }
         });
      }

      return muting;
   };

   var SoundMultiSample = function(src, count, loop, volume) {
      this.elements = [];
      this.volume = volume || 1;

      for (var i = 0; i < count; i ++) {
         var sound = document.createElement('audio');
         sound.volume = volume || 1;
         if (loop) {
            sound.loop = "loop";
         }
         var source = document.createElement("source");
         source.src = src;
         sound.appendChild(source);
         sound.load();
         this.elements.push(sound);
      }

      this.index = 0;
   };

   SoundMultiSample.prototype.play = function() {
      this.elements[this.index].play();

      this.index = (this.index + 1) % this.elements.length;
   };

   SoundMultiSample.prototype.pause = function() {
      this.elements.forEach(function(el) {
         el.pause();
      });
   };

   SoundMultiSample.prototype.stop = function() {
      this.elements.forEach(function(el) {
         el.pause();
         el.currentTime = 0;
      });
   };

   var Sound = Juicy.Sound = function(name, src, loop) {
      if (typeof(src) !== 'string') {
         src = name;
         loop = src;
      }

      this.name = src;

      if (!Sounds[name]) {
         Sound.load(name, src, loop);
      }
   };

   Sound.load = function(name, src, loop, samples, volume) {
      Sounds[name] = new SoundMultiSample(src, samples || 1, loop, volume || 1);
      return Sounds[name];
   };

   Sound.play = Sound.prototype.play = function(name) {
      name = this.name || name;
      Sounds[name].play();
   };

   Sound.pause = Sound.prototype.pause = function(name) {
      name = this.name || name;
      Sounds[name].pause();
   };

   Sound.stop = Sound.prototype.stop = function(name) {
      name = this.name || name;
      Sounds[name].stop();
   };

   /* -------------------- Game Handler --------------------- */
   /*
    * init(canvas, width, height) - Construct new game
    *  [Helper]
    *    getCoords(event)         - Compute relative location
    *    update   ()              - Update game logic
    *    render   ()              - Render game objects
    *  [Constructor]
    *    setCanvas(canvas)        - Set HTML canvas element
    *    setInput (input_handler) - Set input manager
    *  [Useful]
    *    setState (state)         - Set running game state
    *    resize   ()              - Automatically resize canvas
    *    run      ()              - Begin game running
    */
   var Game = Juicy.Game = {};
   var Game_scale = new THREE.Vector2(1);
   var Game_mouse = new THREE.Vector2(0);
   var Game_running  = false;
   var Game_state    = false;
   var Game_lastTime = false;
   var Game_canvas   = null;
   var Game_renderer = null;
   var Game_fps      = 0;

   // Set up document-wide input for game
   var keyState = {};
   var KEYS     = {};
   var CODES    = {};
   var listener = {};
   document.onkeydown = function(evt) {
      if ([37, 38, 39, 40].indexOf(evt.keyCode) >= 0)
         evt.preventDefault();
      keyState[evt.keyCode] = true;

      var method = 'key_down_' + CODES[evt.keyCode];
      if (Game_state && Game_state[method])
         Game_state[method](CODES[evt.keyCode]);
   };
   document.onkeyup = function(evt) {
      keyState[evt.keyCode] = false;

      var method = 'key_' + CODES[evt.keyCode];
      if (Game_state && Game_state[method])
         Game_state[method](CODES[evt.keyCode]);

      if (Game_state && Game_state.keyPressed)
         Game_state.keyPressed(evt.keyCode);
   };

   Game.init = function(renderer, width, height, keys) {
      Game_running = false;
      Game.width   = width;
      Game.height  = height;
      Game.setRenderer(renderer);

      Game.fps_alpha = 0.95;
      Game.debug     = false;

      // Input stuff
      KEYS     = keys || {};
      CODES    = {};
      for (var key in keys) {
         CODES[keys[key]] = key;
      }

      return this; // Enable chaining
   };

   Game.setDebug = function(debug) {
      Game.debug = debug;

      return this;
   };

   Game.getState = function() {
      return Game_state;
   };

   Game.getFPS = function() {
      if (!Game.debug) {
         throw new Error('Game must be in debug mode!');
      }
      return Game_fps;
   }

   Game.keyDown = function(key) {
      if (typeof(key) === 'string') {
         return keyState[KEYS[key]];
      }
      else {
         for (var k = 0; k < key.length; k ++) {
            if (Game.keyDown(key[k]))
               return true;
         }

         return false;
      }
   };

   Game.on = function(action, keys, callback) {
      if (action === 'key') {
         if (typeof(keys) !== 'object')
            keys = [keys];

         for (var i = 0; i < keys.length; i ++) {
            var key = keys[i];

            Game_state['key_' + key] = callback;
         }
      }
      else {
         if (listener[action]) {
            document.removeEventListener(action, listener[action]);
         }

         document.addEventListener(action, listener[action] = keys);
      }

      return this; // Enable chaining
   };

   var Game_clear = function() {
      for (var action in listener) {
         document.removeEventListener(action, listener[action]);
      }
      listener = {};
   };

   Game.getCanvasCoords = function(evt) {
      var canvasRect = Game_canvas.getBoundingClientRect();
      var mx = evt.clientX - canvasRect.left;
      var my = evt.clientY - canvasRect.top;

      return new THREE.Vector2(Math.floor(mx * Game.width /  Game_canvas.width), Math.floor(my * Game.height / Game_canvas.height));
   };

   Game.setRenderer = function(renderer) {
      Game_renderer = renderer;
      Game_canvas   = renderer.domElement;

      var startDrag = false;
      Game_canvas.onmousedown = function(evt) {
         startDrag = evt;
         Game.trigger('dragstart', evt);
      };
      Game_canvas.onmouseup = function(evt) {
         var startPos = Game.getCanvasCoords(startDrag);
         var endPos   = Game.getCanvasCoords(evt);

         if (startPos.sub(endPos).length() <= 2) {
            Game.trigger('click', evt);
         }
         else {
            Game.trigger('dragend', evt);
         }

         startDrag = false;
      };
      Game_canvas.onmousemove = function(evt) {
         Game_mouse = Game.getCanvasCoords(evt);

         if (startDrag) {
            Game.trigger('drag', evt);
         }
      }

      // Game.resize();
      return this; // Enable chaining
   };

   Game.resize = function() {
      var parent = Game_canvas.parentElement;
      var width  = parent.width  || parent.clientWidth;
      var height = parent.height || parent.clientHeight;

      Game_canvas.width  = width;
      Game_canvas.height = height;
      Game_scale = new THREE.Vector2(Game_canvas.width  / Game.width, Game_canvas.height / Game.height);

      // Make sure we re-render
      if (Game_state)
         Game_state.__hasRendered = false;

      return this; // Enable chaining
   };

   Game.setState = function(state) {
      Game_clear();

      Game_state = state;
      Game_state.game = Game;
      Game_state.init();
      Game_state.__hasRendered = false;

      return this; // Enable chaining
   };

   Game.trigger = function(evt, pos) {
      if (Game_state && Game_state[evt])
         Game_state[evt](Game.getCanvasCoords(pos));
   };

   Game.update = function() {
      if (!Game_running)
         return;

      requestAnimationFrame(Game.update);
      var nextTime = new Date().getTime();
      if (Game.debug && nextTime !== Game_lastTime) {
         var fps = 1000 / (nextTime - Game_lastTime);
         Game_fps = Game.fps_alpha * Game_fps + (1 - Game.fps_alpha) * fps;

         if (Game.debug instanceof Node) {
            Game.debug.innerHTML = 'FPS: ' + Math.floor(Game_fps);
         }
      }

      var dt = (nextTime - Game_lastTime) / 1000;
      if (dt > 0.2) {
        Game_lastTime = nextTime;
        return;
      }

      try {
         var updated = !Game_state.update(dt, Game) || Game_state.updated;
         Game_state.updated = false;

         Game_lastTime = nextTime;

         if (updated || !Game_state.__hasRendered) {
            Game.render();
            Game_state.__hasRendered = true;
         }
      }
      catch (e) {
         console.error(e);
         console.error(e.stack);
         // Game.pause();
      }
   };

   Game.render = function() {
      Game_state.render(Game_renderer);

      return this; // Enable chaining
   };

   Game.run = function() {
      if (Game_running)
         return;

      Game_running = true;
      Game_lastTime = new Date().getTime();

      Game.update();

      return this; // Enable chaining
   };

   Game.pause = function() {
      Game_running = false;
   };

   /* -------------------- Game State ----------------------- */
   /*
    * new State() - Construct new state
    *  [Constructor]
    *    init   ()          - Run every time the state is swapped to.
    *  [Useful]
    *    click  (evt)       - When the user clicks the state
    *    update (dt, input) - Run before rendering. Use for logic.
    *                         IMPORTANT: return true if you don't want to re-render
    *    render (context)   - Run after  update.    Use for graphics
    */
   var State = Juicy.State = function(width, height) {
      this.scene = new THREE.Scene();

      this.width = width;
      this.height = height;
      this.camera = null;
      this.ready = true;

      this.perspective();
      this.lookAt(new THREE.Vector3(0, 0, -10), new THREE.Vector3(0, 0, 0));
   };
   State.prototype.init    = // function() {}
   State.prototype.update  = function() {};
   State.prototype.render  = function(renderer) {
      if (!this.ready)
         return;

      renderer.render(this.scene, this.camera);
   };

   State.prototype.perspective = function(fov, near, far) {
      fov  = fov  || 45;
      near = near || 0.1;
      far  = far  || 1000;
      this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, near, far);
   };

   State.prototype.orthographic = function(scale, near, far) {
      scale = scale || 1;
      near  = near  || -500;
      far   = far   || 1000;
      this.camera = new THREE.OrthographicCamera(-this.width / scale,
                                                  this.width / scale,
                                                  this.height / scale,
                                                 -this.height / scale, near, far);

   };

   State.prototype.lookAt = function(position, lookAt) {
      this.camera.position.copy(position);

      this.camera.lookAt(lookAt);;
   };

   State.prototype.moveCamera = function(dist) {
      this.camera.position.add(dist);
   };

   /* -------------------- Game Entity ----------------------- */
   /*
    * new Entity(components) - Construct new entity
    *  [Static Properties]
    *    components       - Array of component constructors
    *  [Constructor]
    *    addComponent (c[, name]) - Add a component to the entity
    *  [Useful]
    *    getComponent (c) - Get an (updated) component.
    *    update (dt, c)   - Calls update on all components, or just c
    *    render (context) - Calls render on all components
    */
   var untitledComponents = 0;
   var Entity = Juicy.Entity = function(components) {
      THREE.Object3D.call(this);

      // Extra catch
      if (typeof(components) === 'string')
         components = [components];

      this.components = {};
      this.updated    = {};

      components = components || this.__proto__.components;

      for (var i = 0; i < components.length; i ++) {
         this.addComponent(components[i]);
      }

      if (this.init)
         this.init();
   };
   Entity.prototype = Object.create(THREE.Object3D.prototype);
   Entity.prototype.constructor = Entity;
   Entity.prototype.setPosition = function(x, y, z) {
      this.positon.set(x, y, z);
   };
   Entity.prototype.components = [];
   Entity.prototype.addComponent = function(c, name) {
      if (typeof(c) === 'function')
         c = new c(this);
      else if (typeof(c) === 'string') {
         if (Juicy.Components[c])
            c = new Juicy.Components[c](this);
         else
            throw 'Component ' + c + ' does not exist';
      }

      if (!c.__proto__.cName) {
         c.__proto__.cName = '_component_' + untitledComponents.toString();
         untitledComponents ++;
      }

      name = name || c.__proto__.cName;
      if (this.components[name])
         throw 'Component ' + name + ' already exists';
      else {
         c.entity = this;
         this.components[name] = c;
      }

      if (c.ready) {
         this.add(c);
      }
      else {
         c.onReady = function() {
            this.add(c);
         }.bind(this);
      }
   };
   Entity.prototype.getComponent = function(name) {
      return this.components[name];
   };
   Entity.prototype.updateComponent = function(dt, name, game) {
      if (!this.updated[name]) {
         this.updated[name] = true;
         this.components[name].update(dt, game);
      }
      return this.components[name];
   };
   Entity.prototype.update = function(dt, game) {
      this.updated = {};
      for(var key in this.components) {
         if (!this.updated[key]) {
            this.updateComponent(dt, key, game);
         }
      }
   };

   /* -------------------- Game Component -------------------- */
   /*
    * new Component(entity) - Construct new component on an entity
    *  [Static Properties]
    *    name             - Name of the component
    *  [Useful]
    *    update (dt)      - Update component (if applicable)
    *    render (context) - Render component (if applicable)
    *
    * Component.create(name, prototype, static[, force])
    *    - Extend and register by name. Force to override another component
    */
   var Component = Juicy.Component = function() {
      THREE.Object3D.call(this);
      this.ready = false;
      this.onReady();
   };
   Component.prototype = Object.create(THREE.Object3D.prototype);
   Component.prototype.constructor = Component;
   Component.prototype.cName   = 0;
   Component.prototype.update = function() {};
   Component.prototype.ready = true;
   Component.prototype.onReady = function() {};

   var MeshComponent = function(geometry, material) {
      THREE.Mesh.call(this, geometry, material);
   };
   MeshComponent.prototype = Object.create(THREE.Mesh.prototype);
   MeshComponent.prototype.constructor = SpriteComponent;
   MeshComponent.prototype.cName  = Component.prototype.cName;
   MeshComponent.prototype.ready = true;
   MeshComponent.prototype.update = Component.prototype.update;

   var SpriteComponent = function(url) {
      var self = this;

      this.ready = false;
      this.imageScale = 1;
      window.x = new THREE.TextureLoader();
      var image = x.load('textures/' + url, function() {
         self.setScale(self.imageScale);
         self.ready = true;
         self.onReady();
      });
      image.minFilter = THREE.NearestFilter;
      image.maxFilter = THREE.NearestFilter;

      var material = new THREE.SpriteMaterial({ map: image, transparent: true });

      THREE.Sprite.call(this, material);
   };
   SpriteComponent.prototype = Object.create(THREE.Sprite.prototype);
   SpriteComponent.prototype.constructor = SpriteComponent;
   SpriteComponent.prototype.cName  = Component.prototype.cName;
   SpriteComponent.prototype.update = Component.prototype.update;
   SpriteComponent.prototype.onReady = function() {};
   SpriteComponent.prototype.setScale = function(scale) {
      this.imageScale = scale;

      if (this.material.map.image) {
         var w = this.material.map.image.width;
         var h = this.material.map.image.height;
         var ratio = h / w;
         if (this.material.map.repeat.x !== 1 ||
            this.material.map.repeat.y !== 1) {
            ratio = 1;
         }
         this.scale.set(this.imageScale * this.material.map.image.width * this.material.map.repeat.x,
                        this.imageScale * this.material.map.image.height * this.material.map.repeat.y,
                        1);
      }
   };

   // Map of names to components
   Juicy.Components = {};
   Juicy.Components.Mesh = MeshComponent;
   Juicy.Components.Sprite = SpriteComponent;
   Component.create = function(name, protoProps, staticProps) {
      protoProps.cName = protoProps.cName || name;

      return Juicy.Components[name] = this.extend(protoProps, staticProps)
   };

   /* Credit to Underscore.js */
   var combine = function(obj) {
      for (var index = 1; index < arguments.length; index++) {
         var source = arguments[index];
         for (var key in source) {
            obj[key] = source[key];
         }
      }
   };

   /* Credit to Backbone.js */
   var extend = function(protoProps, staticProps) {
      var parent  = this;
      var child;

      if (protoProps.constructor !== protoProps.__proto__.constructor)
         child = protoProps.constructor;
      else
         child = function() { return parent.apply(this, arguments); };

      combine(child, parent, staticProps || {});

      var Surrogate = function(){ this.constructor = child; };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate;

      if (protoProps)
         combine(child.prototype, protoProps);

      child.prototype.__super__ = parent.prototype;

      return child;
   };

   State.extend = Entity.extend = Component.extend = extend;
   Juicy.Components.Mesh.extend = extend;
   Juicy.Components.Sprite.extend = extend;

   /* -------------------- Sprite Entity -------------------- */
   var Sprite = Juicy.Sprite = Entity.extend({
      constructor: function(url, components) {
         Entity.call(this, components);

         this.addComponent(new SpriteComponent(url));
      }
   });

   /* -------------------- Mesh Entity -------------------- */
   var Mesh = Juicy.Mesh = Entity.extend({
      constructor: function(geometry, material, components) {
         Entity.call(this, components);

         this.addComponent(new MeshComponent(geometry, material));
      }
   });

   /* -------------------- Typical Components --------------- */
   Component.create('Box', {
      constructor: function() {
         this.fillStyle = 'white';
      },
      render: function(context, x, y, w, h) {
         context.fillStyle = this.fillStyle;
         context.fillRect(x, y, w, h);
      }
   });

   Component.create('Text', {
      constructor: function() {
         this.canvas = document.createElement('canvas');
         this.context = this.canvas.getContext('2d');

         // Text info
         var info = this.text = {};

         info.font = '32px Arial';
         info.text = '';
         info.fillStyle = 'white';

         // For accessing outside of this component
         this.opacity = 1;
      },
      set: function(config) {
         var info    = this.text;
         var entity  = this.entity;
         var context = this.context;
         var canvas  = this.canvas;

         // Set attributes
         info.font = config.font           || info.font;
         info.text = config.text           || info.text;
         info.fillStyle = config.fillStyle || info.fillStyle;

         // Measure the text size
         context.font      = info.font;
         context.fillStyle = info.fillStyle;
         var size = context.measureText(info.text);

         // Resize canvas
         entity.width  = canvas.width = Math.ceil(size.width);
         entity.height = canvas.height = Math.ceil(parseInt(info.font) * 5 / 3);

         // Draw text
         context.textBaseline = 'top';
         context.font        = info.font;
         context.fillStyle   = info.fillStyle;
         context.fillText(info.text, 0, 0);
      },
      render: function(context) {
         // Save original alpha
         var originalAlpha = context.globalAlpha;
         context.globalAlpha = this.opacity;

         arguments[0] = this.canvas;
         context.drawImage.apply(context, arguments);

         context.globalAlpha = originalAlpha;
      }
   });

})(window, document);
