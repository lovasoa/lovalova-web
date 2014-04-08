// Generated by CoffeeScript 1.7.1

/* lovalova.coffee
@author: Ophir LOJKINE (lovasoa)
@license: GPLv3
@description: small game in which you are a small square that has to avoid long rectangles
 */

(function() {
  var AnimatedRectangle, Font, Game, GameManager, GameUI, LinkedList, Rectangle, Score, conf, keyboard, requestAnimationFrame,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  conf = {
    world: {
      acceleration: 2000,
      skin_friction: 0.005,
      dry_friction: 2,
      bgcolor: [0, 0, 0]
    },
    hero: {
      size: [20, 20],
      color: [122, 122, 198]
    }
  };

  Score = (function() {
    function Score() {
      this.current = this.best = 0;
    }

    Score.prototype.update = function(newscore) {
      this.current = parseInt(newscore) || 0;
      return this.best = Math.max(this.current, this.best);
    };

    Score.prototype.save = function() {
      return localStorage.setItem('lovalova.score.best', this.best);
    };

    Score.prototype.load = function() {
      var oldbest;
      oldbest = 0 | localStorage.getItem('lovalova.score.best');
      return this.best = Math.max(oldbest, this.best);
    };

    return Score;

  })();

  Rectangle = (function() {
    function Rectangle(pos, size) {
      this.pos = pos;
      this.size = size;
    }

    Rectangle.prototype.collision = function(r) {
      return this.pos[0] + this.size[0] > r.pos[0] && this.pos[0] < r.pos[0] + r.size[0] && this.pos[1] + this.size[1] > r.pos[1] && this.pos[1] < r.pos[1] + r.size[1];
    };

    return Rectangle;

  })();

  AnimatedRectangle = (function(_super) {
    __extends(AnimatedRectangle, _super);

    function AnimatedRectangle() {
      this.speed = [0, 0];
      AnimatedRectangle.__super__.constructor.apply(this, arguments);
    }

    AnimatedRectangle.prototype.animate = function(dt) {
      this.pos[0] += this.speed[0] * dt;
      return this.pos[1] += this.speed[1] * dt;
    };

    AnimatedRectangle.prototype.impulse = function(accel, dt) {
      this.speed[0] += accel[0] * dt;
      return this.speed[1] += accel[1] * dt;
    };

    return AnimatedRectangle;

  })(Rectangle);

  LinkedList = (function() {
    function LinkedList() {
      this.first = null;
      this.last = null;
    }

    LinkedList.prototype.append = function(val) {
      this.last = {
        value: val,
        prev: this.last,
        next: null
      };
      if (this.last.prev !== null) {
        this.last.prev.next = this.last;
      }
      return this.first = this.first || this.last;
    };

    LinkedList.prototype.remove = function(e) {
      if (e.next !== null) {
        e.next.prev = e.prev;
      }
      if (e.prev !== null) {
        e.prev.next = e.next;
      }
      if (e === this.last) {
        this.last = this.last.prev;
      }
      if (e === this.first) {
        return this.first = this.first.next;
      }
    };

    LinkedList.prototype.forEach = function(func) {
      var cur, _results;
      cur = this.first;
      _results = [];
      while (cur !== null) {
        func(cur.value, cur);
        _results.push(cur = cur.next);
      }
      return _results;
    };

    return LinkedList;

  })();

  Font = (function() {
    function Font(height, name) {
      this.height = height;
      this.name = name;
    }

    Font.prototype.toString = function() {
      return "" + this.height + "px " + this.name;
    };

    return Font;

  })();

  GameUI = (function() {
    function GameUI(game, canvas) {
      this.game = game;
      this.canvas = canvas;
      this.refreshsize();
      this.ctx = this.canvas.getContext('2d');
      this.font = new Font(14, 'sans-serif');
    }

    GameUI.prototype.fillRect = function(rect, color) {
      var strcolor;
      if (color == null) {
        color = [0, 0, 0];
      }
      strcolor = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
      if (this.ctx.fillStyle !== strcolor) {
        this.ctx.fillStyle = strcolor;
      }
      return this.ctx.fillRect(0 | rect.pos[0], 0 | rect.pos[1], 0 | rect.size[0], 0 | rect.size[1]);
    };

    GameUI.prototype.strokeRect = function(rect, color) {
      var strcolor;
      if (color == null) {
        color = [0, 0, 0];
      }
      strcolor = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
      if (this.ctx.strokeStyle !== strcolor) {
        this.ctx.strokeStyle = strcolor;
      }
      return this.ctx.strokeRect(0 | rect.pos[0], 0 | rect.pos[1], 0 | rect.size[0], 0 | rect.size[1]);
    };

    GameUI.prototype.writeText = function(txt, pos, color, font) {
      var strfont;
      if (color == null) {
        color = [255, 255, 255];
      }
      if (font == null) {
        font = this.font;
      }
      this.ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ",1)";
      strfont = font.toString();
      if (this.ctx.font !== strfont) {
        this.ctx.font = strfont;
      }
      return this.ctx.fillText(txt, pos[0], pos[1] + font.height);
    };

    GameUI.prototype.draw = function(running) {
      var enn, node;
      this.fillRect(this.screenRect, conf.world.bgcolor);
      this.writeText("Score: " + this.game.score.current + " | Best : " + this.game.score.best, [0, 0]);
      if (this.game.loose) {
        this.writeText('You loose! Press space to try again', [100, 100]);
        return;
      }
      this.fillRect(this.game.hero, conf.hero.color);
      node = {
        next: this.game.ennemies.first
      };
      while (node = node.next) {
        enn = node.value;
        this.strokeRect(enn, [0 | enn.speed[0] * 255 / 150, 0 | enn.speed[1] * 255 / 150, 255]);
      }
      if (running !== true) {
        return this.writeText('Game paused. Press p to resume.', [100, 100]);
      }
    };

    GameUI.prototype.refreshsize = function() {
      return this.screenRect = new Rectangle([0, 0], [this.canvas.width, this.canvas.height]);
    };

    return GameUI;

  })();

  Game = (function() {
    function Game(screen) {
      var x;
      this.screen = screen;
      this.score = new Score;
      this.score.load();
      this.ennemies = new LinkedList;
      this.loose = false;
      this.hero = new AnimatedRectangle((function() {
        var _i, _len, _ref, _results;
        _ref = this.screen;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x / 2);
        }
        return _results;
      }).call(this), conf.hero.size);
      this.timeRunning = 0;
    }

    Game.prototype.update = function(dt) {
      var accel, directions, dirfriction, e, horiz, i, impulsion, j, n, newenn, node, _i, _j, _k, _results;
      if (this.loose) {
        return;
      }
      this.timeRunning += dt;
      this.score.update(this.timeRunning);
      directions = [['left', 'right'], ['up', 'down']];
      impulsion = [0, 0];
      for (i = _i = 0; _i <= 1; i = ++_i) {
        dirfriction = this.hero.speed[i] > 0 ? -1 : 1;
        impulsion[i] += dirfriction * conf.world.skin_friction * Math.pow(this.hero.speed[i], 2);
        impulsion[i] -= conf.world.dry_friction * this.hero.speed[i];
        if (this.hero.pos[i] > this.screen[i] - this.hero.size[i]) {
          this.hero.pos[i] = this.screen[i] - this.hero.size[i];
          this.hero.speed[i] = -Math.abs(this.hero.speed[i]);
        }
        if (this.hero.pos[i] < 0) {
          this.hero.pos[i] = 0;
          this.hero.speed[i] = Math.abs(this.hero.speed[i]);
        }
        for (j = _j = 0; _j <= 1; j = ++_j) {
          if (keyboard.isCharCodeDown(keyboard.charCodes[directions[i][j]])) {
            accel = (2 * j - 1) * conf.world.acceleration;
            impulsion[i] += accel;
          }
        }
      }
      this.hero.impulse(impulsion, dt);
      this.hero.animate(dt);
      if (Math.random() < 0.02 + 0.01 * Math.sqrt(this.score.current)) {
        horiz = Math.random() > 0.5;
        newenn = new AnimatedRectangle([0, 0], [3, 3]);
        for (n = _k = 0; _k <= 1; n = ++_k) {
          if (horiz === (n === 0)) {
            newenn.pos[n] = Math.random() * this.screen[n];
            newenn.size[n] = 20 + Math.random() * 100;
            newenn.speed[1 - n] = 50 + Math.random() * 100;
          }
        }
        this.ennemies.append(newenn);
      }
      node = {
        next: this.ennemies.first
      };
      _results = [];
      while (node = node.next) {
        e = node.value;
        e.animate(dt);
        if (e.pos[0] > this.screen[0] || e.pos[1] > this.screen[1]) {
          this.ennemies.remove(node);
        }
        if (e.collision(this.hero)) {
          _results.push(this.end());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Game.prototype.end = function() {
      this.loose = true;
      return this.score.save();
    };

    return Game;

  })();

  GameManager = (function() {
    function GameManager(canvas) {
      this.canvas = canvas;
      this.animate = __bind(this.animate, this);
      this.game = new Game([this.canvas.width, this.canvas.height]);
      this.gameui = new GameUI(this.game, this.canvas);
      this.running = true;
      document.body.addEventListener('keydown', (function(_this) {
        return function(e) {
          switch (String.fromCharCode(e.keyCode)) {
            case ' ':
              _this.game.constructor([_this.canvas.width, _this.canvas.height]);
              return _this.gameui.draw();
            case 'P':
              _this.running = !_this.running;
              _this.lastTime = null;
              return requestAnimationFrame(_this.animate);
          }
        };
      })(this));
      window.onblur = (function(_this) {
        return function() {
          return _this.running = false;
        };
      })(this);
      requestAnimationFrame(this.animate);
    }

    GameManager.prototype.animate = function(curTime) {
      var dt;
      if (this.lastTime == null) {
        this.lastTime = curTime;
      }
      dt = (curTime - this.lastTime) / 1000;
      this.lastTime = curTime;
      this.game.update(dt);
      this.gameui.draw(this.running);
      if (this.running) {
        return requestAnimationFrame(this.animate);
      }
    };

    return GameManager;

  })();

  keyboard = {
    pressed: {},
    charCodes: {
      left: String.fromCharCode(37),
      up: String.fromCharCode(38),
      right: String.fromCharCode(39),
      down: String.fromCharCode(40),
      ctrl: String.fromCharCode(17),
      alt: String.fromCharCode(18),
      tab: String.fromCharCode(9),
      enter: String.fromCharCode(13)
    },
    isCharCodeDown: function(key) {
      return this.pressed[key] === true;
    },
    isLetterDown: function(letter) {
      return this.isCharCodeDown(letter.charCodeAt(0));
    }
  };

  window.onkeydown = function(e) {
    keyboard.pressed[String.fromCharCode(e.keyCode || e.key)] = true;
    return e.preventDefault();
  };

  window.onkeyup = function(e) {
    e.preventDefault();
    return keyboard.pressed[String.fromCharCode(e.keyCode || e.key)] = false;
  };

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fun) {
    return setTimeout(fun, 10, Date.now() + 10);
  };

  window.GameManager = GameManager;

}).call(this);

//# sourceMappingURL=lovalova.map
