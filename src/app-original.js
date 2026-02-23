"use strict";

import {
    LANG,
    BASE_PATH,
    BGM_INFO,
    RESOURCE_PATHS,
    STAGE_IDS,
    GAME_DIMENSIONS,
    STAGE_DIMENSIONS,
    ANIMATION,
    FPS,
} from "./constants.js";
import { SCENE_IDS } from "./enums/scene-ids.js";
import { CUSTOM_EVENTS } from "./events/custom-events.js";
import { PLAYER_STATES, BOSS_STATES } from "./enums/player-boss-states.js";

    var i = {
        LANG: LANG,
        BASE_PATH: BASE_PATH,
        boss_bison_bgm_info: BGM_INFO.boss_bison_bgm,
        boss_barlog_bgm_info: BGM_INFO.boss_barlog_bgm,
        boss_sagat_bgm_info: BGM_INFO.boss_sagat_bgm,
        boss_vega_bgm_info: BGM_INFO.boss_vega_bgm,
        boss_goki_bgm_info: BGM_INFO.boss_goki_bgm,
        boss_fang_bgm_info: BGM_INFO.boss_fang_bgm,
        RESOURCE: RESOURCE_PATHS,
        SCENE_NAME_LOAD: SCENE_IDS.LOAD,
        SCENE_NAME_TITLE: SCENE_IDS.TITLE,
        SCENE_NAME_HOWTOPLAY: SCENE_IDS.HOWTOPLAY,
        SCENE_NAME_DEMO: SCENE_IDS.DEMO,
        SCENE_NAME_ADV: SCENE_IDS.ADV,
        SCENE_NAME_GAME: SCENE_IDS.GAME,
        SCENE_NAME_ENDING: SCENE_IDS.ENDING,
        SCENE_NAME_RESULT: SCENE_IDS.RESULT,
        STAGE_PROLOGUE_ID: STAGE_IDS.PROLOGUE,
        STAGE_ENDING_ID: STAGE_IDS.ENDING,
        STAGE_SPENDING_ID: STAGE_IDS.SPENDING,
        GAME_WIDTH: GAME_DIMENSIONS.WIDTH,
        GAME_HEIGHT: GAME_DIMENSIONS.HEIGHT,
        GAME_CENTER: GAME_DIMENSIONS.CENTER_X,
        GAME_MIDDLE: GAME_DIMENSIONS.CENTER_Y,
        BASE_ANIMATION_SPEED: ANIMATION.BASE_SPEED,
        STAGE_WIDTH: STAGE_DIMENSIONS.WIDTH,
        STAGE_HEIGHT: STAGE_DIMENSIONS.HEIGHT,
        STAGE_CENTER: STAGE_DIMENSIONS.CENTER_X,
        STAGE_MIDDLE: STAGE_DIMENSIONS.CENTER_Y,
        FPS: FPS
    };
    function n(t) {
        return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function a(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function s(t, e) {
        return !e || "object" !== n(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function r(t) {
        return (r = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function h(t, e) {
        return (h = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var l = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = s(this, r(e).call(this))).id = t,
            o.on("added", o.atCastAdded),
            o.on("removed", o.atCastRemoved),
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && h(t, e)
        }(e, PIXI.Container),
        o = e,
        (i = [{
            key: "atCastAdded",
            value: function(t) {
                this.parentNode,
                this.castAdded()
            }
        }, {
            key: "atCastRemoved",
            value: function(t) {
                this.parentNode,
                this.castRemoved()
            }
        }, {
            key: "castAdded",
            value: function() {}
        }, {
            key: "castRemoved",
            value: function() {}
        }]) && a(o.prototype, i),
        n && a(o, n),
        e
    }();
    function u(t) {
        return (u = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function c(t, e) {
        return !e || "object" !== u(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function f(t) {
        return (f = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function d(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function p(t, e, o) {
        return e && d(t.prototype, e),
        o && d(t, o),
        t
    }
    function m(t, e) {
        return (m = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var y = function(t) {
        function e(t, o) {
            var i;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (i = c(this, f(e).call(this))).shadowReverse = !0,
            i.speed = 0,
            i.hp = 1,
            i.deadFlg = !1,
            i.character = new PIXI.extras.AnimatedSprite(t),
            i.character.animationSpeed = .1,
            i.unit = new PIXI.Container,
            i.unit.interactive = !0,
            i.unit.name = "unit",
            i.unit.hitArea = new PIXI.Rectangle(0,0,i.character.width,i.character.height),
            i.shadowOffsetY = 0,
            i.shadow = new PIXI.extras.AnimatedSprite(t),
            i.shadow.animationSpeed = .1,
            i.shadow.tint = 0,
            i.shadow.alpha = .5,
            void 0 !== o) {
                i.explosion = new PIXI.extras.AnimatedSprite(o);
                var n = (i.unit.height + 50) / i.explosion.height;
                n >= 1 && (n = 1),
                i.explosion.scale.set(n + .2),
                i.explosion.animationSpeed = .4,
                i.explosion.loop = !1
            }
            return i.addChild(i.unit),
            i.unit.addChild(i.shadow),
            i.unit.addChild(i.character),
            i
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && m(t, e)
        }(e, l),
        p(e, null, [{
            key: "CUSTOM_EVENT_DEAD",
            get: function() {
                return CUSTOM_EVENTS.DEAD
            }
        }, {
            key: "CUSTOM_EVENT_DEAD_COMPLETE",
            get: function() {
                return CUSTOM_EVENTS.DEAD_COMPLETE
            }
        }, {
            key: "CUSTOM_EVENT_PROJECTILE_ADD",
            get: function() {
                return CUSTOM_EVENTS.PROJECTILE_ADD
            }
        }]),
        p(e, [{
            key: "castAdded",
            value: function(t) {
                this.character.play(),
                this.shadow.play(),
                "true" == D.hitAreaFlg && (this.hitbox = new PIXI.Graphics,
                this.hitbox.lineStyle(1, 16773120),
                this.hitbox.drawRect(this.unit.hitArea.x, this.unit.hitArea.y, this.unit.hitArea.width, this.unit.hitArea.height),
                this.unit.addChild(this.hitbox)),
                this.shadowReverse ? (this.shadow.scale.y = -1,
                this.shadow.y = 2 * this.shadow.height - this.shadowOffsetY) : this.shadow.y = this.shadow.height - this.shadowOffsetY
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                this.character.destroy(),
                this.shadow.destroy(),
                this.unit.removeChild(this.shadow),
                this.unit.removeChild(this.character),
                this.removeChild(this.unit)
            }
        }]),
        e
    }()
      , g = {
        play: function(t) {
            if (!D.lowModeFlg) {
                var e = B && B.resource && "object" == typeof B.resource ? B.resource : "undefined" != typeof globalThis && globalThis.__GAME_RESOURCES__ && "object" == typeof globalThis.__GAME_RESOURCES__ ? globalThis.__GAME_RESOURCES__ : null;
                e && e[t] && e[t].sound && "function" == typeof e[t].sound.play && e[t].sound.play()
            }
        },
        bgmPlay: function(t, e, o) {
            if (!D.lowModeFlg) {
                var i, n = (B && B.resource && "object" == typeof B.resource ? B.resource : "undefined" != typeof globalThis && globalThis.__GAME_RESOURCES__ && "object" == typeof globalThis.__GAME_RESOURCES__ ? globalThis.__GAME_RESOURCES__ : null), a = n && n[t] && n[t].sound ? n[t].sound : null, r = !1;
                if (!a || "function" != typeof a.play)
                    return;
                !function t() {
                    r ? ((i = a.play({
                        start: e / 48e3,
                        end: o / 48e3
                    })).on("progress", s),
                    i.on("end", t.bind(this))) : ((i = a.play({
                        start: 0,
                        end: o / 48e3
                    })).on("end", t.bind(this)),
                    i.on("progress", s),
                    r = !0)
                }()
            }
            function s(t) {}
        },
        stop: function(t) {
            if (!D.lowModeFlg) {
                var e = B && B.resource && "object" == typeof B.resource ? B.resource : "undefined" != typeof globalThis && globalThis.__GAME_RESOURCES__ && "object" == typeof globalThis.__GAME_RESOURCES__ ? globalThis.__GAME_RESOURCES__ : null;
                e && e[t] && e[t].sound && "function" == typeof e[t].sound.stop && e[t].sound.stop()
            }
        }
    };
    function b(t) {
        return (b = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function v(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function _(t, e) {
        return !e || "object" !== b(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function w(t, e, o) {
        return (w = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = x(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function x(t) {
        return (x = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function T(t, e) {
        return (T = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var S = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = _(this, x(e).call(this, t.texture, t.explosion))).name = t.name,
            o.unit.name = t.name,
            o.damage = t.damage,
            o.speed = t.speed,
            o.hp = t.hp,
            o.score = t.score,
            o.spgage = t.spgage,
            o.guardTexture = t.guard,
            o.deadFlg = !1,
            o.shadow.visible = !1,
            o.unit.hitArea = new PIXI.Rectangle(0,0,o.unit.width,o.unit.height),
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && T(t, e)
        }(e, y),
        o = e,
        (i = [{
            key: "loop",
            value: function() {
                this.rotX ? (this.unit.x += this.rotX * this.speed,
                this.unit.y += this.rotY * this.speed) : "meka" == this.name ? (this.cont++,
                this.cont >= this.start && (this.targetX || (this.targetX = this.player.x),
                this.unit.x += .009 * (this.targetX - this.unit.x),
                this.unit.y += Math.cos(this.cont / 5) + 2.5 * this.speed)) : this.unit.y += this.speed
            }
        }, {
            key: "onDamage",
            value: function(t, e) {
                this.deadFlg || (this.hp -= t,
                this.hp <= 0 ? (this.dead.bind(this)(e),
                this.deadFlg = !0) : (TweenMax.to(this.character, .1, {
                    tint: 16711680
                }),
                TweenMax.to(this.character, .1, {
                    delay: .1,
                    tint: 16777215
                }))),
                void 0 !== this.explosion && (this.explosion.onComplete = function(t) {
                    this.removeChild(t)
                }
                .bind(this, this.explosion),
                this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2,
                this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2 - 10,
                "infinity" == e && (this.explosion.textures = this.guardTexture),
                this.addChild(this.explosion),
                this.explosion.play()),
                "infinity" == e ? (g.stop("se_guard"),
                g.play("se_guard")) : this.name == M.SHOOT_NAME_NORMAL || this.name == M.SHOOT_NAME_3WAY ? (g.stop("se_damage"),
                g.play("se_damage")) : this.name == M.SHOOT_NAME_BIG && (g.stop("se_damage"),
                g.play("se_damage"))
            }
        }, {
            key: "dead",
            value: function(t) {
                this.emit(y.CUSTOM_EVENT_DEAD),
                this.unit.removeChild(this.character),
                this.unit.removeChild(this.shadow),
                this.removeChild(this.unit),
                void 0 !== this.explosion && (this.explosion.onComplete = this.explosionComplete.bind(this),
                this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2,
                this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2 - 10,
                this.addChild(this.explosion),
                this.explosion.play())
            }
        }, {
            key: "explosionComplete",
            value: function() {
                this.removeChild(this.explosion),
                this.explosion.destroy(),
                this.emit(y.CUSTOM_EVENT_DEAD_COMPLETE)
            }
        }, {
            key: "castAdded",
            value: function(t) {
                w(x(e.prototype), "castAdded", this).call(this)
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                w(x(e.prototype), "castRemoved", this).call(this)
            }
        }]) && v(o.prototype, i),
        n && v(o, n),
        e
    }();
    // returns the type of the value passed as an argument, with special handling for Symbol instances
    function C(t) {
        return (C = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function k(t, e) {
        return !e || "object" !== C(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function I(t, e, o) {
        return (I = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = O(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function O(t) {
        return (O = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    // define properties on an object with specific attributes
    function E(t, e) {
        // loops through each element in the e array and defines a property on the t object using Object.defineProperty()
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            // If the property descriptor has a value property, the writable property is set to true
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function P(t, e, o) {
        // if e is truthy, add properties to the prototype of t
        return e && E(t.prototype, e),
        // add properties to t if o is truthy
        o && E(t, o),
        t
    }
    function A(t, e) {
        return (A = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var M = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== C(t.texture[0])) {
                for (var n = 0; n < t.texture.length; n++) {
                    (a = PIXI.Texture.fromFrame(t.texture[n])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                    t.texture[n] = a
                }
                for (n = 0; n < t.shootNormal.texture.length; n++) {
                    (a = PIXI.Texture.fromFrame(t.shootNormal.texture[n])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                    t.shootNormal.texture[n] = a
                }
                for (n = 0; n < t.shootBig.texture.length; n++) {
                    (a = PIXI.Texture.fromFrame(t.shootBig.texture[n])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                    t.shootBig.texture[n] = a
                }
                for (n = 0; n < t.barrier.texture.length; n++) {
                    var a;
                    (a = PIXI.Texture.fromFrame(t.barrier.texture[n])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                    t.barrier.texture[n] = a
                }
                t.barrierEffectTexture = PIXI.Texture.fromFrame("barrierEffect.gif"),
                t.hit = [PIXI.Texture.fromFrame("hit0.gif"), PIXI.Texture.fromFrame("hit1.gif"), PIXI.Texture.fromFrame("hit2.gif"), PIXI.Texture.fromFrame("hit3.gif"), PIXI.Texture.fromFrame("hit4.gif")],
                t.guard = [PIXI.Texture.fromFrame("guard0.gif"), PIXI.Texture.fromFrame("guard1.gif"), PIXI.Texture.fromFrame("guard2.gif"), PIXI.Texture.fromFrame("guard3.gif"), PIXI.Texture.fromFrame("guard4.gif")]
            }
            return (o = k(this, O(e).call(this, t.texture, t.explosion))).unit.name = t.name,
            o.hp = t.hp,
            o.maxHp = t.maxHp,
            o.shootNormalData = t.shootNormal,
            o.shootNormalData.texture = t.shootNormal.texture,
            o.shootNormalData.explosion = t.hit,
            o.shootNormalData.guard = t.guard,
            o.shootBigData = t.shootBig,
            o.shootBigData.texture = t.shootBig.texture,
            o.shootBigData.explosion = t.hit,
            o.shootBigData.guard = t.guard,
            o.shoot3wayData = t.shoot3way,
            o.shoot3wayData.texture = t.shootNormal.texture,
            o.shoot3wayData.explosion = t.hit,
            o.shoot3wayData.guard = t.guard,
            o.barrier = new PIXI.extras.AnimatedSprite(t.barrier.texture),
            o.barrier.animationSpeed = .15,
            o.barrier.hitArea = new PIXI.Rectangle(2,2,o.barrier.width,o.barrier.height),
            o.barrier.interactive = !1,
            o.barrier.buttonMode = !1,
            o.barrier.play(),
            o.barrier.visible = !1,
            o.barrierEffect = new PIXI.Sprite(t.barrierEffectTexture),
            o.barrierEffect.visible = !1,
            o.barrierEffect.interactive = !1,
            o.barrierEffect.buttonMode = !1,
            o.barrierEffect.anchor.set(.5),
            o.shootOn = 0,
            o.bulletList = [],
            o.bulletFrameCnt = 0,
            o.bulletIdCnt = 0,
            o.shootSpeed = 0,
            o.shootInterval = 0,
            o.shootData = {},
            o.shootMode,
            o._percent = 0,
            o.unitX = 0,
            o.unitY = 0,
            o.unit.hitArea = new PIXI.Rectangle(7,20,o.unit.width - 14,o.unit.height - 40),
            o.character.animationSpeed = .35,
            o.shadow.animationSpeed = .35,
            o.shadowOffsetY = 5,
            o.damageAnimationFlg = !1,
            o.barrierFlg = !1,
            o.screenDragFlg = !1,
            o.beforeX = 0,
            o.beforeY = 0,
            o.keyDownFlg = !1,
            o.keyDownCode = "",
            o.dragAreaRect = new PIXI.Graphics,
            o.dragAreaRect.beginFill(16777215, 0),
            o.dragAreaRect.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            o.dragAreaRect.endFill(),
            o.dragAreaRect.interactive = !0,
            o
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && A(t, e)
        }(e, y),
        // add array of properties to e
        P(e, null, [{
            key: "SHOOT_NAME_NORMAL",
            get: function() {
                return PLAYER_STATES.SHOOT_NAME_NORMAL
            }
        }, {
            key: "SHOOT_NAME_BIG",
            get: function() {
                return PLAYER_STATES.SHOOT_NAME_BIG
            }
        }, {
            key: "SHOOT_NAME_3WAY",
            get: function() {
                return PLAYER_STATES.SHOOT_NAME_3WAY
            }
        }, {
            key: "SHOOT_SPEED_NORMAL",
            get: function() {
                return PLAYER_STATES.SHOOT_SPEED_NORMAL
            }
        }, {
            key: "SHOOT_SPEED_HIGH",
            get: function() {
                return PLAYER_STATES.SHOOT_SPEED_HIGH
            }
        }, {
            key: "BARRIER",
            get: function() {
                return PLAYER_STATES.BARRIER
            }
        }]),
        P(e, [{
            key: "onScreenDragStart",
            value: function(t) {
                this.unitX = B.Manager.game.renderer.plugins.interaction.eventData.data.global.x,
                this.screenDragFlg = !0
            }
        }, {
            key: "onScreenDragMove",
            value: function(t) {
                this.screenDragFlg && (this.unitX = B.Manager.game.renderer.plugins.interaction.eventData.data.global.x,
                this.unitX <= this.unit.hitArea.width / 2 && (this.unitX = this.unit.hitArea.width / 2),
                this.unitX >= i.GAME_WIDTH - this.unit.hitArea.width / 2 && (this.unitX = i.GAME_WIDTH - this.unit.hitArea.width / 2))
            }
        }, {
            key: "onScreenDragEnd",
            value: function(t) {
                this.screenDragFlg = !1
            }
        }, {
            key: "onKeyDown",
            value: function(t) {
                this.keyDownFlg = !0,
                this.keyDownCode = t.keyCode,
                t.preventDefault()
            }
        }, {
            key: "onKeyUp",
            value: function(t) {
                this.keyDownFlg = !1,
                t.preventDefault()
            }
        }, {
            key: "loop",
            value: function() {
                if (this.keyDownFlg) {
                    switch (this.keyDownCode) {
                    case 37:
                        this.unitX -= 6;
                        break;
                    case 39:
                        this.unitX += 6
                    }
                    this.unitX <= this.unit.hitArea.width / 2 && (this.unitX = this.unit.hitArea.width / 2),
                    this.unitX >= i.GAME_WIDTH - this.unit.hitArea.width / 2 && (this.unitX = i.GAME_WIDTH - this.unit.hitArea.width / 2)
                }
                this.unit.x += .09 * (this.unitX - (this.unit.x + this.unit.width / 2)),
                this.unit.y += .09 * (this.unitY - this.unit.y),
                this.barrier.x = this.unit.x + this.unit.width / 2 - this.barrier.width / 2,
                this.barrier.y = this.unit.y - 15,
                this.bulletFrameCnt++,
                this.shootOn && this.bulletFrameCnt % (this.shootInterval - this.shootSpeed) == 0 && this.shoot();
                for (var t = 0; t < this.bulletList.length; t++) {
                    var e = this.bulletList[t];
                    e.unit.x += 3.5 * Math.cos(e.unit.rotation),
                    e.unit.y += 3.5 * Math.sin(e.unit.rotation),
                    (e.unit.y <= 40 || e.unit.x <= -e.unit.width || e.unit.x >= i.GAME_WIDTH) && (this.bulletRemove(e),
                    this.bulletRemoveComplete(e))
                }
            }
        }, {
            key: "shoot",
            value: function() {
                switch (this.shootMode) {
                case e.SHOOT_NAME_NORMAL:
                    (o = new S(this.shootNormalData)).unit.rotation = 270 * Math.PI / 180,
                    o.unit.x = this.unit.x + 5 * Math.sin(o.unit.rotation) + 14,
                    o.unit.y = this.unit.y + 5 * Math.sin(o.unit.rotation) + 11,
                    o.name = e.SHOOT_NAME_NORMAL,
                    o.id = this.bulletIdCnt++,
                    o.shadowReverse = !1,
                    o.shadowOffsetY = 0,
                    o.on(y.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, o)),
                    o.on(y.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, o)),
                    this.addChild(o),
                    this.bulletList.push(o),
                    g.stop("se_shoot"),
                    g.play("se_shoot");
                    break;
                case e.SHOOT_NAME_BIG:
                    (o = new S(this.shootBigData)).unit.rotation = 270 * Math.PI / 180,
                    o.unit.x = this.unit.x + 5 * Math.sin(o.unit.rotation) + 10,
                    o.unit.y = this.unit.y + 5 * Math.sin(o.unit.rotation) + 22,
                    o.name = e.SHOOT_NAME_BIG,
                    o.id = this.bulletIdCnt++,
                    o.shadowReverse = !1,
                    o.shadowOffsetY = 0,
                    o.on(y.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, o)),
                    o.on(y.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, o)),
                    this.addChild(o),
                    this.bulletList.push(o),
                    g.stop("se_shoot_b"),
                    g.play("se_shoot_b");
                    break;
                case e.SHOOT_NAME_3WAY:
                    for (var t = 0; t < 3; t++) {
                        var o = new S(this.shoot3wayData);
                        0 == t ? (o.unit.rotation = 280 * Math.PI / 180,
                        o.unit.x = this.unit.x + 5 * Math.cos(o.unit.rotation) + 14,
                        o.unit.y = this.unit.y + 5 * Math.sin(o.unit.rotation) + 11) : 1 == t ? (o.unit.rotation = 270 * Math.PI / 180,
                        o.unit.x = this.unit.x + 5 * Math.cos(o.unit.rotation) + 10,
                        o.unit.y = this.unit.y + 5 * Math.sin(o.unit.rotation) + 11) : 2 == t && (o.unit.rotation = 260 * Math.PI / 180,
                        o.unit.x = this.unit.x + 5 * Math.cos(o.unit.rotation) + 6,
                        o.unit.y = this.unit.y + 5 * Math.sin(o.unit.rotation) + 11),
                        o.id = this.bulletIdCnt++,
                        o.shadowReverse = !1,
                        o.shadowOffsetY = 0,
                        o.on(y.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, o)),
                        o.on(y.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, o)),
                        this.addChild(o),
                        this.bulletList.push(o)
                    }
                    g.stop("se_shoot"),
                    g.play("se_shoot")
                }
            }
        }, {
            key: "bulletRemove",
            value: function(t) {
                for (var e = 0; e < this.bulletList.length; e++)
                    t.id == this.bulletList[e].id && this.bulletList.splice(e, 1)
            }
        }, {
            key: "bulletRemoveComplete",
            value: function(t) {
                t.off(y.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, t)),
                t.off(y.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, t)),
                this.removeChild(t)
            }
        }, {
            key: "shootModeChange",
            value: function(t) {
                switch (this.shootMode = t,
                this.shootMode) {
                case e.SHOOT_NAME_NORMAL:
                    this.shootData = this.shootNormalData,
                    this.shootInterval = this.shootData.interval;
                    break;
                case e.SHOOT_NAME_BIG:
                    this.shootData = this.shootBigData,
                    this.shootInterval = this.shootData.interval;
                    break;
                case e.SHOOT_NAME_3WAY:
                    this.shootData = this.shoot3wayData,
                    this.shootInterval = this.shootData.interval
                }
                g.play("g_powerup_voice")
            }
        }, {
            key: "shootSpeedChange",
            value: function(t) {
                switch (t) {
                case e.SHOOT_SPEED_NORMAL:
                    this.shootSpeed = 0;
                    break;
                case e.SHOOT_SPEED_HIGH:
                    this.shootSpeed = 15
                }
                g.play("g_powerup_voice")
            }
        }, {
            key: "setUp",
            value: function(t, o, i) {
                switch (this.hp = t,
                this._percent = this.hp / this.maxHp,
                this.shootMode = o,
                this.shootMode) {
                case e.SHOOT_NAME_NORMAL:
                    this.shootData = this.shootNormalData,
                    this.shootInterval = this.shootData.interval;
                    break;
                case e.SHOOT_NAME_BIG:
                    this.shootData = this.shootBigData,
                    this.shootInterval = this.shootData.interval;
                    break;
                case e.SHOOT_NAME_3WAY:
                    this.shootData = this.shoot3wayData,
                    this.shootInterval = this.shootData.interval
                }
                switch (i) {
                case e.SHOOT_SPEED_NORMAL:
                    this.shootSpeed = 0;
                    break;
                case e.SHOOT_SPEED_HIGH:
                    this.shootSpeed = 15
                }
            }
        }, {
            key: "shootStop",
            value: function() {
                this.shootOn = 0
            }
        }, {
            key: "shootStart",
            value: function() {
                this.shootOn = 1
            }
        }, {
            key: "barrierStart",
            value: function() {
                g.play("se_barrier_start"),
                this.barrierFlg = !0,
                this.barrier.alpha = 0,
                this.barrier.visible = !0,
                this.barrierEffect.x = this.unit.x + this.unit.width / 2,
                this.barrierEffect.y = this.unit.y - 15 + this.barrier.height / 2,
                this.barrierEffect.alpha = 1,
                this.barrierEffect.visible = !0,
                this.barrierEffect.scale.set(.5),
                TweenMax.to(this.barrierEffect.scale, .4, {
                    x: 1,
                    y: 1,
                    ease: Quint.easeOut
                }),
                TweenMax.to(this.barrierEffect, .5, {
                    alpha: 0
                }),
                this.tl && (this.tl.kill(),
                this.tl = null),
                this.tl = new TimelineMax({
                    onComplete: function() {
                        this.barrier.visible = !1,
                        this.barrierFlg = !1,
                        this.barrierEffect.visible = !1,
                        g.play("se_barrier_end")
                    },
                    onCompleteScope: this
                }),
                this.tl.to(this.barrier, .3, {
                    alpha: 1
                }, "+=0").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=4.0").to(this.barrier, 1, {
                    alpha: 1
                }, "+=0").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=1").to(this.barrier, 1, {
                    alpha: 1
                }, "+=0").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.5").to(this.barrier, .5, {
                    alpha: 1
                }, "+=0").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.5").to(this.barrier, .5, {
                    alpha: 1
                }, "+=0").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 1
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 1
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 1
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 1
                }, null, this, "+=0.1").call(function() {
                    this.barrier.alpha = 0
                }, null, this, "+=0.1")
            }
        }, {
            key: "barrierHitEffect",
            value: function() {
                this.barrier.tint = 16711680,
                TweenMax.to(this.barrier, .2, {
                    tint: 16777215
                }),
                g.play("se_guard")
            }
        }, {
            key: "spFire",
            value: function() {}
        }, {
            key: "onDamage",
            value: function(t) {
                if (this.barrierFlg)
                    ;
                else if (!0 !== this.damageAnimationFlg) {
                    if (this.hp -= t,
                    this.hp <= 0 && (this.hp = 0),
                    this._percent = this.hp / this.maxHp,
                    this.hp <= 0)
                        this.dead();
                    else {
                        var e = new TimelineMax({
                            onComplete: function() {
                                this.damageAnimationFlg = !1
                            }
                            .bind(this)
                        });
                        e.to(this.unit, .15, {
                            delay: 0,
                            y: this.unit.y + 2,
                            tint: 16711680,
                            alpha: .2
                        }),
                        e.to(this.unit, .15, {
                            delay: 0,
                            y: this.unit.y - 2,
                            tint: 16777215,
                            alpha: 1
                        }),
                        e.to(this.unit, .15, {
                            delay: .05,
                            y: this.unit.y + 2,
                            tint: 16711680,
                            alpha: .2
                        }),
                        e.to(this.unit, .15, {
                            delay: 0,
                            y: this.unit.y - 2,
                            tint: 16777215,
                            alpha: 1
                        }),
                        e.to(this.unit, .15, {
                            delay: .05,
                            y: this.unit.y + 2,
                            tint: 16711680,
                            alpha: .2
                        }),
                        e.to(this.unit, .15, {
                            delay: 0,
                            y: this.unit.y + 0,
                            tint: 16777215,
                            alpha: 1
                        }),
                        e.to(this.unit, .15, {
                            delay: .05,
                            y: this.unit.y + 2,
                            tint: 16711680,
                            alpha: .2
                        }),
                        e.to(this.unit, .15, {
                            delay: 0,
                            y: this.unit.y + 0,
                            tint: 16777215,
                            alpha: 1
                        }),
                        g.play("g_damage_voice"),
                        g.play("se_damage")
                    }
                    this.damageAnimationFlg = !0
                }
            }
        }, {
            key: "dead",
            value: function() {
                this.emit(y.CUSTOM_EVENT_DEAD),
                this.shootStop(),
                this.explosion.onComplete = this.explosionComplete.bind(this),
                this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2,
                this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2,
                this.addChild(this.explosion),
                this.explosion.play(),
                this.removeChild(this.unit),
                this.removeChild(this.shadow);
                for (var t = 0; t < this.bulletList.length; t++) {
                    var e = this.bulletList[t];
                    this.removeChild(e)
                }
                g.play("se_explosion"),
                g.play("g_continue_no_voice0")
            }
        }, {
            key: "explosionComplete",
            value: function() {
                this.emit(y.CUSTOM_EVENT_DEAD_COMPLETE),
                this.removeChild(this.explosion)
            }
        }, {
            key: "castAdded",
            value: function(t) {
                I(O(e.prototype), "castAdded", this).call(this),
                this.addChild(this.barrier),
                this.addChild(this.barrierEffect),
                this.addChild(this.dragAreaRect),
                this.dragAreaRect.on("pointerdown", this.onScreenDragStart.bind(this)),
                this.dragAreaRect.on("pointerup", this.onScreenDragEnd.bind(this)),
                this.dragAreaRect.on("pointerupoutside", this.onScreenDragEnd.bind(this)),
                this.dragAreaRect.on("pointermove", this.onScreenDragMove.bind(this)),
                this.keyDownListener = this.onKeyDown.bind(this),
                this.keyUpListener = this.onKeyUp.bind(this),
                document.addEventListener("keydown", this.keyDownListener),
                document.addEventListener("keyup", this.keyUpListener),
                this.damageAnimationFlg = !1
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                I(O(e.prototype), "castRemoved", this).call(this),
                this.dragAreaRect.off("pointerdown", this.onScreenDragStart.bind(this)),
                this.dragAreaRect.off("pointerup", this.onScreenDragEnd.bind(this)),
                this.dragAreaRect.off("pointerupoutside", this.onScreenDragEnd.bind(this)),
                this.dragAreaRect.off("pointermove", this.onScreenDragMove.bind(this)),
                document.removeEventListener("keydown", this.keyDownListener),
                document.removeEventListener("keyup", this.keyUpListener),
                this.keyDownListener = null,
                this.keyUpListener = null
            }
        }, {
            key: "percent",
            get: function() {
                return this._percent
            },
            set: function(t) {
                this._percent = t
            }
        }]),
        e
    }()
      , D = {
        baseUrl: "",
        lowModeFlg: !1,
        hitarea: !1,
        debugFlg: "game.capcom.com" !== location.hostname,
        player: null,
        playerHp: 0,
        playerMaxHp: 0,
        spDamage: 0,
        combo: 0,
        maxCombo: 0,
        stageId: 0,
        akebonoCnt: 0,
        spgage: 0,
        score: 0,
        continueCnt: 0,
        highScore: 0,
        frame: 0,
        beforeHighScore: 0,
        shootMode: M.SHOOT_NAME_NORMAL,
        enemyBulletList: []
    }
      , B = {
        resource: "",
        Manager: ""
    }
      , F = {
        dlog: function(t) {},
        nowSec: function() {
            new Date;
            return Date.now()
        },
        tweet: function(t) {
            var e = ""
              , o = ""
              , n = "";
            "ja" == i.LANG ? (e = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=ja"),
            o = encodeURIComponent("シャド研,SFVAE,aprilfool,エイプリルフール"),
            n = 1 == t ? encodeURIComponent("エイプリルフール 2019 世界大統領がSTGやってみた\n今回のSCORE:" + D.score + "\nHISCORE:" + D.highScore + "\n") : encodeURIComponent("エイプリルフール 2019 世界大統領がSTGやってみた\nHISCORE:" + D.highScore + "\n")) : (e = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=en"),
            o = encodeURIComponent("ShadalooCRI, SFVAE, aprilfool"),
            n = 1 == t ? encodeURIComponent("APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\nSCORE:" + D.score + "\nBEST:" + D.highScore + "\n") : encodeURIComponent("APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\nBEST:" + D.highScore + "\n"));
            var a = "https://twitter.com/intent/tweet?url=" + e + "&hashtags=" + o + "&text=" + n;
            if (!window.open(a, "tweetwindow", "width=650, height=470, personalbar=0, toolbar=0, scrollbars=1, sizable=1")) {
                var s = '<form id="tmpForm" target="_blank" method="GET" action="https://twitter.com/intent/tweet"><input type="hidden" name="shareUrl" value="' + decodeURIComponent(e) + '" /><input type="hidden" name="hashtags" value="' + decodeURIComponent(o) + '" /><input type="hidden" name="text" value="' + decodeURIComponent(n) + '" /></form>';
                $(s).appendTo($("body:last")).submit(),
                $("body").remove("#tmpForm")
            }
        }
    };
    function R(t) {
        return (R = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function G(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function j(t, e) {
        return !e || "object" !== R(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function X(t) {
        return (X = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function H(t, e) {
        return (H = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    // N is a class that extends the PIXI.Container class
    // (container for scenes in a game)
    // PIXI.Container is a class that extends the PIXI.DisplayObject class
    // PIXI.DisplayObject is a class that extends the PIXI.utils.EventEmitter class
    var N = function(t) {
        function e(t) {
            var o;
            // Ensure that `this` is an instance of `e`
            // and set the `id` property of the `N` instance to `t`
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            // t is used to set the id property of the N instance
            (o = j(this, X(e).call(this))).id = t,
            o.on("added", o.atSceneAdded),
            o.on("removed", o.atSceneRemoved),
            o
        }

        var o, i, n;
    
        // Inherit from `PIXI.Container`
        function inherit(subClass, superClass) {
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    writable: true,
                    configurable: true
                }
            });
            superClass && H(subClass, superClass);
        }
        inherit(e, PIXI.Container);
    
        // Define class methods
        e.prototype.addScene = function(t, e) {
            B.Manager.addScene(t, e);
        };
    
        e.prototype.atSceneAdded = function(t) {
            this.sceneAdded();
        };
    
        e.prototype.sceneAdded = function() {
            F.dlog(this.constructor.name + ".sceneAdded() Start.");
            this.run();
            B.Manager.game.ticker.add(this.loop, this);
            B.Manager.game.ticker.start();
            F.dlog(this.constructor.name + ".sceneAdded() End.");
        };
    
        e.prototype.atSceneRemoved = function(t) {
            this.sceneRemoved();
        };
    
        e.prototype.sceneRemoved = function() {
            for (B.Manager.game.ticker.remove(this.loop, this),
                B.Manager.game.ticker.stop(); this.children[0]; ) {
                if ("loop"in this.children[0] && "function" == typeof this.children[0].loop) {
                    B.Manager.game.ticker.remove(this.children[0].loop, this.children[0]);
                }
                this.removeChild(this.children[0]);
            }
        };
    
        e.prototype.loop = function() {
            D.frame = 59 == D.frame ? 0 : D.frame + 1;
        };
    
        e.prototype.nextScene = function() {
            B.Manager.game.stage.removeChild(B.Scene);
        };
    
        return e;
    }();
    function L(t) {
        return (L = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function W(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function U(t, e) {
        return !e || "object" !== L(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function V(t) {
        return (V = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Y(t, e) {
        return (Y = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var K = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = U(this, V(e).call(this, t))).on("added", o.atCastAdded),
            o.on("removed", o.atCastRemoved),
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Y(t, e)
        }(e, PIXI.Sprite),
        o = e,
        (i = [{
            key: "atCastAdded",
            value: function(t) {
                this.castAdded()
            }
        }, {
            key: "atCastRemoved",
            value: function(t) {
                this.castRemoved()
            }
        }, {
            key: "castAdded",
            value: function() {}
        }, {
            key: "castRemoved",
            value: function() {}
        }]) && W(o.prototype, i),
        n && W(o, n),
        e
    }();
    function Q(t) {
        return (Q = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function z(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function q(t, e) {
        return !e || "object" !== Q(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function J(t, e, o) {
        return (J = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Z(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Z(t) {
        return (Z = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function tt(t, e) {
        return (tt = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var et = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = q(this, Z(e).call(this, PIXI.Texture.fromFrame("howtoBtn0.gif")))).textureDefault = PIXI.Texture.fromFrame("howtoBtn0.gif"),
            t.textureOver = PIXI.Texture.fromFrame("howtoBtn1.gif"),
            t.textureDown = PIXI.Texture.fromFrame("howtoBtn2.gif"),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && tt(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_cursor"),
                this.texture = this.textureDefault,
                window.howtoModalOpen()
            }
        }, {
            key: "castAdded",
            value: function(t) {
                J(Z(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                J(Z(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && z(o.prototype, i),
        n && z(o, n),
        e
    }();
    function ot(t) {
        return (ot = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function it(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function nt(t, e) {
        return !e || "object" !== ot(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function at(t, e, o) {
        return (at = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = st(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function st(t) {
        return (st = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function rt(t, e) {
        return (rt = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var ht = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = nt(this, st(e).call(this, PIXI.Texture.fromFrame("staffrollBtn0.gif")))).textureDefault = PIXI.Texture.fromFrame("staffrollBtn0.gif"),
            t.textureOver = PIXI.Texture.fromFrame("staffrollBtn1.gif"),
            t.textureDown = PIXI.Texture.fromFrame("staffrollBtn2.gif"),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && rt(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_cursor"),
                this.texture = this.textureDefault
            }
        }, {
            key: "castAdded",
            value: function(t) {
                at(st(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                at(st(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && it(o.prototype, i),
        n && it(o, n),
        e
    }();
    function lt(t) {
        return (lt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function ut(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ct(t, e) {
        return !e || "object" !== lt(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ft(t, e, o) {
        return (ft = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = dt(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function dt(t) {
        return (dt = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function pt(t, e) {
        return (pt = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var mt = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = ct(this, dt(e).call(this, PIXI.Texture.fromFrame("staffrollCloseBtn.gif")))).anchor.set(.5),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && pt(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                TweenMax.to(this, .3, {
                    rotation: 360 * Math.PI / 180
                })
            }
        }, {
            key: "onOut",
            value: function(t) {
                TweenMax.to(this, .3, {
                    rotation: 0
                })
            }
        }, {
            key: "onDown",
            value: function(t) {}
        }, {
            key: "onUp",
            value: function(t) {
                TweenMax.to(this, .3, {
                    rotation: 0
                }),
                g.play("se_cursor")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                ft(dt(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                ft(dt(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && ut(o.prototype, i),
        n && ut(o, n),
        e
    }();
    function yt(t) {
        return (yt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function gt(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function bt(t, e) {
        return !e || "object" !== yt(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function vt(t, e, o) {
        return (vt = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = _t(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function _t(t) {
        return (_t = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function wt(t, e) {
        return (wt = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var xt = function(t) {
        function e(t, o) {
            var i;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (i = bt(this, _t(e).call(this, PIXI.Texture.fromFrame(t)))).url = o,
            i.interactive = !0,
            i.buttonMode = !0,
            i
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && wt(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.tint = 11184810
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.tint = 16777215
            }
        }, {
            key: "onDown",
            value: function(t) {}
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_cursor"),
                window.open().location.href = this.url
            }
        }, {
            key: "castAdded",
            value: function(t) {
                vt(_t(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                vt(_t(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && gt(o.prototype, i),
        n && gt(o, n),
        e
    }();
    function Tt(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    var St = function() {
        function t() {
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, t)
        }
        var e, o, i;
        return e = t,
        i = [{
            key: "hitTestFunc",
            value: function(t, e) {
                var o, i, n, a;
                return !1,
                t.centerX = t.x + t.hitArea.width / 2,
                t.centerY = t.y + t.hitArea.height / 2,
                e.centerX = e.x + e.hitArea.width / 2,
                e.centerY = e.y + e.hitArea.height / 2,
                t.offsetX = t.hitArea.x,
                t.offsetY = t.hitArea.y,
                e.offsetX = e.hitArea.x,
                e.offsetY = e.hitArea.y,
                t.halfWidth = t.hitArea.width / 2,
                t.halfHeight = t.hitArea.height / 2,
                e.halfWidth = e.hitArea.width / 2,
                e.halfHeight = e.hitArea.height / 2,
                n = t.centerX - e.centerX + t.offsetX - e.offsetX,
                a = t.centerY - e.centerY + t.offsetY - e.offsetY,
                o = t.halfWidth + e.halfWidth,
                i = t.halfHeight + e.halfHeight,
                Math.abs(n) < o && Math.abs(a) < i
            }
        }],
        (o = null) && Tt(e.prototype, o),
        i && Tt(e, i),
        t
    }();
    function Ct(t) {
        return (Ct = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function kt(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function It(t, e, o) {
        return (It = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ot(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Ot(t) {
        return (Ot = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Et(t, e) {
        return (Et = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    function Pt(t) {
        if (void 0 === t)
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return t
    }
    var At = function(t) {
        function e() {
            var t, o, n;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            o = this,
            (t = !(n = Ot(e).call(this)) || "object" !== Ct(n) && "function" != typeof n ? Pt(o) : n).interactive = !0,
            t.bg = new PIXI.Graphics,
            t.bg.beginFill(0, .9),
            t.bg.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.bg.endFill(),
            t.addChild(t.bg);
            var a = [PIXI.Texture.fromFrame("staffrollG0.gif"), PIXI.Texture.fromFrame("staffrollG1.gif"), PIXI.Texture.fromFrame("staffrollG2.gif"), PIXI.Texture.fromFrame("staffrollG3.gif"), PIXI.Texture.fromFrame("staffrollG4.gif"), PIXI.Texture.fromFrame("staffrollG5.gif"), PIXI.Texture.fromFrame("staffrollG6.gif"), PIXI.Texture.fromFrame("staffrollG7.gif")];
            return t.wakingG = new PIXI.extras.AnimatedSprite(a),
            t.wakingG.animationSpeed = .2,
            t.wakingG.x = i.GAME_CENTER - t.wakingG.width / 2,
            t.wakingG.y = 55,
            t.wakingG.play(),
            t.namePanel = new PIXI.Sprite(PIXI.Texture.fromFrame("staffrollName.gif")),
            t.namePanel.x = 15,
            t.namePanel.y = 90,
            t.namePanelBg = new PIXI.Graphics,
            t.namePanelBg.beginFill(4605510, .66),
            t.namePanelBg.drawRect(0, 0, t.namePanel.width, t.namePanel.height),
            t.namePanelBg.endFill(),
            t.namePanelBg.x = t.namePanel.x,
            t.namePanelBg.y = t.namePanel.y,
            t.addChild(t.namePanelBg),
            t.addChild(t.wakingG),
            t.addChild(t.namePanel),
            t.namePanelMask = new PIXI.Graphics,
            t.namePanelMask.beginFill(4605510),
            t.namePanelMask.drawRect(0, 0, t.namePanel.width, t.namePanel.height),
            t.namePanelMask.endFill(),
            t.namePanelMask.x = t.namePanel.x,
            t.namePanelMask.y = t.namePanel.y,
            t.namePanel.mask = t.namePanelMask,
            t.closeBtn = new mt,
            t.closeBtn.on("pointerup", t.close.bind(Pt(Pt(t)))),
            t.closeBtn.x = i.GAME_WIDTH - t.closeBtn.width - 15 + 12,
            t.closeBtn.y = 102,
            t.addChild(t.closeBtn),
            t.tweetNakayama = new xt("staffrollTwitterBtn.gif","https://twitter.com/takaNakayama"),
            t.tweetNakayama.x = 165,
            t.tweetNakayama.y = 28,
            t.namePanel.addChild(t.tweetNakayama),
            t.tweetBengus = new xt("staffrollTwitterBtn.gif","https://twitter.com/bengasu"),
            t.tweetBengus.x = 131,
            t.tweetBengus.y = 186,
            t.namePanel.addChild(t.tweetBengus),
            t.tweetOshikiri = new xt("staffrollTwitterBtn.gif","https://twitter.com/rereibara"),
            t.tweetOshikiri.x = 178,
            t.tweetOshikiri.y = 214,
            t.namePanel.addChild(t.tweetOshikiri),
            t.tweetGangan = new xt("staffrollLinkBtn.gif","https://magazine.jp.square-enix.com/biggangan/introduction/highscoregirl/"),
            t.tweetGangan.x = 153,
            t.tweetGangan.y = 239,
            t.namePanel.addChild(t.tweetGangan),
            t.tweetHiscoreGirl = new xt("staffrollLinkBtn.gif","http://hi-score-girl.com/"),
            t.tweetHiscoreGirl.x = 161,
            t.tweetHiscoreGirl.y = 265,
            t.namePanel.addChild(t.tweetHiscoreGirl),
            t.tl,
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Et(t, e)
        }(e, l),
        o = e,
        (n = [{
            key: "close",
            value: function() {
                this.tl && (this.tl.pause(),
                this.tl.kill()),
                this.closeBtn.visible = !1,
                this.tl = new TimelineMax({
                    onComplete: function() {
                        this.parent.removeChild(this)
                    },
                    onCompleteScope: this
                }),
                this.tl.to(this.namePanel, .5, {
                    y: this.namePanelBg.y + this.namePanel.height,
                    ease: Quint.easeIn
                }, "-=0.0"),
                this.tl.to(this.namePanelBg.scale, .8, {
                    y: 0,
                    ease: Quint.easeOut
                }, "-=0.1"),
                this.tl.to(this.wakingG, 1, {
                    alpha: 0,
                    y: 100
                }, "-=0.2"),
                this.tl.to(this.bg, .2, {
                    alpha: 0
                }, "-=0.5")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                It(Ot(e.prototype), "castAdded", this).call(this),
                this.bg.alpha = 0,
                this.wakingG.alpha = 1,
                this.wakingG.y = -this.wakingG.height,
                this.namePanelBg.scale.y = 0,
                this.namePanel.y = this.namePanelBg.y + this.namePanel.height,
                this.closeBtn.visible = !0,
                this.closeBtn.alpha = 0,
                this.closeBtn.rotation = 360 * Math.PI / 180,
                this.closeBtn.scale.set(2),
                this.tl = new TimelineMax,
                this.tl.to(this.bg, .2, {
                    alpha: 1
                }),
                this.tl.to(this.wakingG, .8, {
                    y: 55
                }),
                this.tl.to(this.namePanelBg.scale, 1, {
                    y: 1,
                    ease: Elastic.easeOut
                }, "-=0.1"),
                this.tl.to(this.namePanel, 1, {
                    y: 90,
                    ease: Quint.easeOut
                }, "-=0.8"),
                this.tl.to(this.closeBtn, .6, {
                    rotation: 0,
                    alpha: 1
                }, "-=0.5"),
                this.tl.to(this.closeBtn.scale, .6, {
                    x: 1,
                    y: 1
                }, "-=0.5")
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                It(Ot(e.prototype), "castRemoved", this).call(this)
            }
        }]) && kt(o.prototype, n),
        a && kt(o, a),
        e
    }();
    function Mt(t) {
        return (Mt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Dt(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Bt(t, e) {
        return !e || "object" !== Mt(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Ft(t, e, o) {
        return (Ft = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Rt(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Rt(t) {
        return (Rt = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Gt(t, e) {
        return (Gt = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var jt = function(t) {
        function e() {
            var t;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Bt(this, Rt(e).call(this))).hitArea = new PIXI.Rectangle(0,50,i.GAME_WIDTH,i.GAME_HEIGHT - 170);
            var o = PIXI.Texture.fromFrame("titleStartText.gif");
            return o.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
            t.img = new PIXI.Sprite(o),
            t.img.x = i.GAME_CENTER,
            t.img.y = 330,
            t.img.anchor.set(.5),
            t.flashCover = new PIXI.Graphics,
            t.flashCover.beginFill(16777215, 1),
            t.flashCover.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT - 120),
            t.flashCover.alpha = 0,
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Gt(t, e)
        }(e, l),
        o = e,
        (n = [{
            key: "onOver",
            value: function(t) {
                this.img.scale.x = 1.05,
                this.img.scale.y = 1.05
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.img.scale.x = 1,
                this.img.scale.y = 1
            }
        }, {
            key: "onDown",
            value: function(t) {}
        }, {
            key: "onUp",
            value: function(t) {
                TweenMax.killTweensOf(this.flashCover),
                g.play("se_decision"),
                this.onFlash()
            }
        }, {
            key: "onFlash",
            value: function() {
                this.flashCover.alpha = .3,
                TweenMax.to(this.flashCover, 1.5, {
                    alpha: 0
                })
            }
        }, {
            key: "castAdded",
            value: function(t) {
                Ft(Rt(e.prototype), "castAdded", this).call(this),
                this.addChild(this.img),
                this.addChild(this.flashCover),
                this.tl = new TimelineMax({
                    repeat: -1,
                    yoyo: !0
                }),
                this.tl.to(this.img, .3, {
                    delay: .1,
                    alpha: 0
                }).to(this.img, .8, {
                    alpha: 1
                }),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                Ft(Rt(e.prototype), "castRemoved", this).call(this),
                this.removeChild(this.img),
                this.removeChild(this.flashCover),
                this.tl && this.tl.kill(),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && Dt(o.prototype, n),
        a && Dt(o, a),
        e
    }();
    function Xt(t) {
        return (Xt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ht(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Nt(t, e) {
        return !e || "object" !== Xt(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Lt(t, e, o) {
        return (Lt = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Wt(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Wt(t) {
        return (Wt = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Ut(t, e) {
        return (Ut = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Vt = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Nt(this, Wt(e).call(this, PIXI.Texture.fromFrame("twitterBtn0.gif")))).textureDefault = PIXI.Texture.fromFrame("twitterBtn0.gif"),
            t.textureOver = PIXI.Texture.fromFrame("twitterBtn1.gif"),
            t.textureDown = PIXI.Texture.fromFrame("twitterBtn2.gif"),
            t.interactive = !0,
            t.buttonMode = !0,
            t.anchor.set(.5),
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Ut(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_cursor"),
                this.texture = this.textureDefault
            }
        }, {
            key: "castAdded",
            value: function(t) {
                Lt(Wt(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                Lt(Wt(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && Ht(o.prototype, i),
        n && Ht(o, n),
        e
    }();
    function Yt(t) {
        return (Yt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Kt(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Qt(t, e) {
        return !e || "object" !== Yt(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function zt(t) {
        return (zt = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function $t(t, e) {
        return ($t = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var qt = function(t) {
        function e(t) {
            var o;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = Qt(this, zt(e).call(this))).maxDigit = t,
            o.textureList = [];
            for (var i = 0; i <= 9; i++)
                o.textureList[i] = PIXI.Texture.fromFrame("bigNum" + String(i) + ".gif");
            o.numSpList = [];
            for (var n = 0; n < t; n++) {
                var a = new PIXI.Sprite(o.textureList[0]);
                a.x = (t - 1 - n) * (a.width - 1),
                o.addChild(a),
                o.numSpList[n] = a
            }
            return o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && $t(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "setNum",
            value: function(t) {
                for (var e = String(t), o = 0; o < this.maxDigit; o++) {
                    var i = e.substr(o, 1);
                    i ? this.numSpList[e.length - 1 - o].texture = this.textureList[Number(i)] : this.numSpList[o].texture = this.textureList[0]
                }
            }
        }, {
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {}
        }]) && Kt(o.prototype, i),
        n && Kt(o, n),
        e
    }()
      , Jt = {
        stage0: {
            part: [{
                background: "0",
                text: "君の闘いは我が闘い\nハイスコアを求めるのは\n地球人民の本能"
            }, {
                background: "Done",
                text: "STG(シューティングゲーム)\nやってみた！"
            }]
        },
        stage1: {
            part: [{
                background: "1",
                text: "君こそハイスコア\nそして、私でもあることが"
            }, {
                background: "Done",
                text: "お分かりいただけただろう！"
            }]
        },
        stage2: {
            part: [{
                background: "2",
                text: "地球人民はハイスコアを\n追い求めるからこそ美しい"
            }, {
                background: "Done",
                text: "美しさとは君であり\nそして私なのだ！"
            }]
        },
        stage3: {
            part: [{
                background: "3",
                text: "おお地球人民よ！\nハイスコアを求める地球人民よ"
            }, {
                background: "3",
                text: "私こそがハイスコア\nそう、君こそが\nハイスコアなのだ"
            }, {
                background: "Done",
                text: "存分に語り合おうではないか！"
            }]
        },
        stage4: {
            part: [{
                background: "Done",
                text: "Thank you for playing"
            }, {
                background: "Done",
                text: "ありがとう！\nハイスコアは私であり\n君であった！"
            }]
        },
        stage5: {
            part: [{
                background: "Done",
                text: "ありがとう！\nハイスコアは私であり\n君であった！！"
            }]
        }
    }
      , Zt = {
        stage0: {
            part: [{
                background: "0",
                text: "Your fight is our fight.\nIt is up to the citizens \nof the world to challenge \nthe high score"
            }, {
                background: "Done",
                text: "in this shooting \ngame (STG)!"
            }]
        },
        stage1: {
            part: [{
                background: "1",
                text: "Through achieving\nthe high score,\nboth you and I,"
            }, {
                background: "Done",
                text: "can come to a mutual \nunderstanding!"
            }]
        },
        stage2: {
            part: [{
                background: "2",
                text: "The people of Earth, \ncoming together to \nachieve the high score, \nis truly a beautiful thing."
            }, {
                background: "Done",
                text: "This beauty is something \nthat both you as well as I,\nboth possess!"
            }]
        },
        stage3: {
            part: [{
                background: "3",
                text: "Now, citizens of the \nearth!\nYou fine people who \nchallenge the high score."
            }, {
                background: "3",
                text: "My high score\nis also your high score."
            }, {
                background: "Done",
                text: "Let us talk to\nour heart's content!"
            }]
        },
        stage4: {
            part: [{
                background: "Done",
                text: "Thank you for playing."
            }, {
                background: "Done",
                text: "This high score belongs\n to me,\nand it also belongs to you!"
            }]
        },
        stage5: {
            part: [{
                background: "Done",
                text: "This high score belongs\n to me,\nand it also belongs to you!"
            }]
        }
    };
    function te(t) {
        return (te = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function ee(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function oe(t, e) {
        return !e || "object" !== te(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ie(t, e, o) {
        return (ie = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = ne(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function ne(t) {
        return (ne = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ae(t, e) {
        return (ae = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var se = function(t) {
        function e() {
            var t;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = oe(this, ne(e).call(this))).hitGra = new PIXI.Graphics,
            t.hitGra.beginFill(16711680, 0),
            t.hitGra.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.hitGra.endFill(),
            t.addChild(t.hitGra),
            t.flashCover = new PIXI.Graphics,
            t.flashCover.beginFill(16777215, 1),
            t.flashCover.drawRect(0, 0, t.hitGra.width, t.hitGra.height),
            t.flashCover.alpha = 0,
            t.addChild(t.flashCover);
            var o = new PIXI.TextStyle({
                fontSize: 16,
                fontFamily: "sans-serif",
                fontWeight: "bold",
                lineHeight: 18,
                fill: 16777215
            });
            return t.actionText = new PIXI.Text(null,o),
            t.actionText.x = i.GAME_WIDTH - t.actionText.width,
            t.actionText.y = i.GAME_HEIGHT - t.actionText.height - 20,
            t.addChild(t.actionText),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && ae(t, e)
        }(e, l),
        o = e,
        (n = [{
            key: "nextPart",
            value: function() {
                this.actionText.text = "Next▼",
                this.actionText.x = i.GAME_WIDTH - this.actionText.width - 10
            }
        }, {
            key: "nextScene",
            value: function() {
                this.actionText.text = "LET'S GO! ▶︎",
                this.actionText.x = i.GAME_WIDTH - this.actionText.width - 10
            }
        }, {
            key: "onOver",
            value: function(t) {}
        }, {
            key: "onOut",
            value: function(t) {}
        }, {
            key: "onDown",
            value: function(t) {}
        }, {
            key: "onUp",
            value: function(t) {}
        }, {
            key: "castAdded",
            value: function(t) {
                ie(ne(e.prototype), "castAdded", this).call(this),
                this.tl = new TimelineMax({
                    repeat: -1,
                    yoyo: !0
                }),
                this.tl.to(this.actionText, .4, {
                    delay: .2,
                    alpha: 0
                }).to(this.actionText, .8, {
                    alpha: 1
                }),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                ie(ne(e.prototype), "castRemoved", this).call(this),
                this.tl.kill(),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && ee(o.prototype, n),
        a && ee(o, a),
        e
    }();
    function re(t) {
        return (re = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function he(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function le(t, e) {
        return !e || "object" !== re(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ue(t, e, o) {
        return (ue = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = ce(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function ce(t) {
        return (ce = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function fe(t, e) {
        return (fe = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var de = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = le(this, ce(e).call(this, PIXI.Texture.fromFrame("continueYes.gif")))).textureDefault = PIXI.Texture.fromFrame("continueYes.gif"),
            t.textureOver = PIXI.Texture.fromFrame("continueYesOver.gif"),
            t.textureDown = PIXI.Texture.fromFrame("continueYesDown.gif"),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && fe(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_correct"),
                this.texture = this.textureDefault
            }
        }, {
            key: "castAdded",
            value: function(t) {
                ue(ce(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                ue(ce(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && he(o.prototype, i),
        n && he(o, n),
        e
    }();
    function pe(t) {
        return (pe = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function me(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ye(t, e) {
        return !e || "object" !== pe(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ge(t, e, o) {
        return (ge = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = be(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function be(t) {
        return (be = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ve(t, e) {
        return (ve = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var _e = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = ye(this, be(e).call(this, PIXI.Texture.fromFrame("continueNo.gif")))).textureDefault = PIXI.Texture.fromFrame("continueNo.gif"),
            t.textureOver = PIXI.Texture.fromFrame("continueNoOver.gif"),
            t.textureDown = PIXI.Texture.fromFrame("continueNoDown.gif"),
            t.interactive = !0,
            t.buttonMode = !0,
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && ve(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                g.play("se_cursor"),
                this.texture = this.textureDefault
            }
        }, {
            key: "castAdded",
            value: function(t) {
                ge(be(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                ge(be(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && me(o.prototype, i),
        n && me(o, n),
        e
    }();
    function we(t) {
        return (we = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function xe(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Te(t, e) {
        return !e || "object" !== we(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Se(t, e, o) {
        return (Se = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ce(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Ce(t) {
        return (Ce = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ke(t, e) {
        return (ke = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Ie = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Te(this, Ce(e).call(this))).interactive = !0,
            t.buttonMode = !0,
            t.textureDefault = PIXI.Texture.fromFrame("gotoTitleBtn0.gif"),
            t.textureOver = PIXI.Texture.fromFrame("gotoTitleBtn1.gif"),
            t.textureDown = PIXI.Texture.fromFrame("gotoTitleBtn2.gif"),
            t.btn = new PIXI.Sprite(t.textureDefault),
            t.addChild(t.btn),
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && ke(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                g.play("se_over"),
                this.btn.texture = this.textureOver
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.btn.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.btn.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {
                this.interactive = !1,
                this.buttonMode = !1,
                g.play("se_correct"),
                this.btn.texture = this.textureDefault
            }
        }, {
            key: "castAdded",
            value: function(t) {
                Se(Ce(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                Se(Ce(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && xe(o.prototype, i),
        n && xe(o, n),
        e
    }();
    function Oe(t) {
        return (Oe = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ee(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Pe(t, e) {
        return !e || "object" !== Oe(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Ae(t, e, o) {
        return (Ae = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Me(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Me(t) {
        return (Me = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function De(t, e) {
        return (De = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Be = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Pe(this, Me(e).call(this))).sceneSwitch = 0,
            t.countDown = 9,
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && De(t, e)
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {}
        }, {
            key: "onCountDown",
            value: function() {
                this.countDown < 0 ? this.selectNo.bind(this)() : (this.tl = new TimelineMax({
                    onComplete: this.onCountDown,
                    onCompleteScope: this
                }),
                this.tl.to(this.cntText, .4, {
                    delay: .4,
                    alpha: 0
                }).call(function() {
                    this.cntText.texture = PIXI.Texture.fromFrame("countdown" + this.countDown + ".gif"),
                    g.play(["voice_countdown" + this.countDown]),
                    this.countDown--
                }, null, this, "+=0").to(this.cntText, .8, {
                    alpha: 1
                }))
            }
        }, {
            key: "run",
            value: function() {
                g.bgmPlay("bgm_continue", 102735, 698597),
                this.bg = new PIXI.Graphics,
                this.bg.beginFill(0, 1),
                this.bg.drawRect(0, 0, i.STAGE_WIDTH, i.STAGE_HEIGHT),
                this.addChild(this.bg),
                this.continueTitle = new PIXI.Sprite(PIXI.Texture.fromFrame("continueTitle.gif")),
                this.continueTitle.x = 0,
                this.continueTitle.y = 70,
                this.addChild(this.continueTitle),
                this.loseFaceTexture = [PIXI.Texture.fromFrame("continueFace0.gif"), PIXI.Texture.fromFrame("continueFace1.gif")],
                this.loseFaceGrayTexture = [PIXI.Texture.fromFrame("continueFace2.gif")],
                this.loseFaceSmileTexture = [PIXI.Texture.fromFrame("continueFace3.gif")],
                this.loseFace = new PIXI.extras.AnimatedSprite(this.loseFaceTexture),
                this.loseFace.x = 20,
                this.loseFace.y = this.continueTitle.y + this.continueTitle.height + 38,
                this.loseFace.animationSpeed = .05,
                this.loseFace.play(),
                this.addChild(this.loseFace),
                this.cntTextBg = new PIXI.Sprite(PIXI.Texture.fromFrame("countdownBg.gif")),
                this.cntTextBg.x = this.cntTextBg.x + this.cntTextBg.width + 20,
                this.cntTextBg.y = this.continueTitle.y + this.continueTitle.height + 30,
                this.addChild(this.cntTextBg),
                this.cntText = new PIXI.Sprite(PIXI.Texture.fromFrame("countdown9.gif")),
                this.cntText.x = this.cntTextBg.x,
                this.cntText.y = this.cntTextBg.y,
                this.cntText.alpha = 0,
                this.addChild(this.cntText),
                this.yesText = new de,
                this.yesText.x = i.GAME_CENTER - this.yesText.width / 2 - 50,
                this.yesText.y = i.GAME_MIDDLE - this.yesText.height / 2 + 70,
                this.yesText.on("pointerup", this.selectYes.bind(this)),
                this.addChild(this.yesText),
                this.noText = new _e,
                this.noText.x = i.GAME_CENTER - this.noText.width / 2 + 50,
                this.noText.y = i.GAME_MIDDLE - this.noText.height / 2 + 70,
                this.noText.on("pointerup", this.selectNo.bind(this)),
                this.addChild(this.noText),
                this.continueTitle.alpha = this.loseFace.alpha = this.cntTextBg.alpha = this.yesText.alpha = this.noText.alpha = 0,
                TweenMax.to([this.continueTitle, this.loseFace, this.cntTextBg, this.yesText, this.noText], .8, {
                    alpha: 1
                });
                var t = B.resource.recipe.data["ja" == i.LANG ? "continueComment" : "continueCommentEn"]
                  , e = t[Math.floor(Math.random() * t.length)]
                  , o = new PIXI.TextStyle({
                    fontFamily: "sans-serif",
                    fontSize: 15,
                    fontWeight: "bold",
                    lineHeight: 17,
                    fill: 16777215,
                    wordWrap: !0,
                    wordWrapWidth: 230,
                    breakWords: !0,
                    align: "center",
                    padding: 10
                });
                this.commentText = new PIXI.Text(e,o),
                this.commentText.x = i.GAME_CENTER - this.commentText.width / 2,
                this.commentText.y = i.GAME_HEIGHT - 120,
                this.addChild(this.commentText),
                this.onCountDown.bind(this)()
            }
        }, {
            key: "selectYes",
            value: function() {
                this.countDown < 0 && (this.countDown = 0),
                g.stop("voice_countdown" + this.countDown),
                this.tl.kill(),
                this.sceneSwitch = 1,
                this.nextSceneAnim();
                var t = Math.floor(3 * Math.random());
                g.play(["g_continue_yes_voice" + String(t)])
            }
        }, {
            key: "selectNo",
            value: function() {
                this.countDown < 0 && (this.countDown = 0),
                g.stop("voice_countdown" + this.countDown),
                D.lowModeFlg || (g.bgm_continue.volume = 0,
                TweenMax.to(g.bgm_continue, 1.5, {
                    volume: .25,
                    delay: 2.8
                })),
                g.play("voice_gameover"),
                g.play("bgm_gameover"),
                this.tl.kill(),
                this.countDown = 0,
                this.cntText.alpha = .2,
                this.cntText.texture = PIXI.Texture.fromFrame("countdown0.gif"),
                this.loseFace.textures = this.loseFaceGrayTexture,
                this.removeChild(this.commentText),
                this.gameOverTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("continueGameOver.gif")),
                this.gameOverTxt.x = i.GAME_CENTER - this.gameOverTxt.width / 2,
                this.gameOverTxt.y = i.GAME_MIDDLE - this.gameOverTxt.height / 2 - 35,
                this.gameOverTxt.alpha = 0,
                this.addChild(this.gameOverTxt),
                this.tl = new TimelineMax({
                    onComplete: function() {
                        var t = this;
                        D.score > D.highScore && (D.highScore = D.score,
                        document.cookie = "afc2019_highScore=" + D.score + "; expires=Tue, 02 Apr 2019 7:00:00 UTC; secure;",
                        this.continueNewrecord = new PIXI.Sprite(PIXI.Texture.fromFrame("continueNewrecord.gif")),
                        this.continueNewrecord.x = 0,
                        this.continueNewrecord.y = this.loseFace.y + this.loseFace.height + 10,
                        this.addChild(this.continueNewrecord));
                        this.scoreTitleTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("scoreTxt.gif")),
                        this.scoreTitleTxt.x = 32,
                        this.scoreTitleTxt.y = this.loseFace.y + this.loseFace.height + 30,
                        this.addChild(this.scoreTitleTxt),
                        this.bigNumTxt = new qt(10),
                        this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3,
                        this.bigNumTxt.y = this.scoreTitleTxt.y - 2,
                        this.bigNumTxt.setNum(D.score),
                        this.addChild(this.bigNumTxt),
                        this.twText = new Vt,
                        this.twText.x = i.GAME_CENTER,
                        this.twText.y = this.scoreTitleTxt.y + this.twText.height / 2 + 20,
                        this.twText.on("pointerup", this.tweet.bind(this)),
                        this.addChild(this.twText),
                        this.gotoTitleBtn = new Ie,
                        this.gotoTitleBtn.x = i.GAME_CENTER - this.gotoTitleBtn.width / 2,
                        this.gotoTitleBtn.y = i.GAME_MIDDLE - this.gotoTitleBtn.height / 2 + 160,
                        this.gotoTitleBtn.on("pointerup", function() {
                            t.nextSceneAnim()
                        }),
                        this.addChild(this.gotoTitleBtn)
                    },
                    onCompleteScope: this
                }),
                this.tl.to(this, .07, {
                    x: 0,
                    y: 10
                }).call(function() {
                    this.bg.beginFill(7798784, 1),
                    this.bg.drawRect(0, 0, i.STAGE_WIDTH, i.STAGE_HEIGHT)
                }, null, this, "+=0").to(this, .07, {
                    x: 0,
                    y: -5
                }).call(function() {
                    this.bg.beginFill(0, 1),
                    this.bg.drawRect(0, 0, i.STAGE_WIDTH, i.STAGE_HEIGHT)
                }, null, this, "+=0").to(this, .07, {
                    x: 0,
                    y: 3
                }).call(function() {
                    this.bg.beginFill(7798784, 1),
                    this.bg.drawRect(0, 0, i.STAGE_WIDTH, i.STAGE_HEIGHT)
                }, null, this, "+=0").to(this, .07, {
                    x: 0,
                    y: 0
                }).call(function() {
                    this.bg.beginFill(0, 1),
                    this.bg.drawRect(0, 0, i.STAGE_WIDTH, i.STAGE_HEIGHT)
                }, null, this, "+=0").to(this.gameOverTxt, 1, {
                    delay: .3,
                    alpha: 1.5
                }).call(function() {
                    var t = Math.floor(2 * Math.random());
                    g.play(["g_continue_no_voice" + String(t)])
                }, null, this, "+=0"),
                this.removeChild(this.yesText),
                this.removeChild(this.noText)
            }
        }, {
            key: "tweet",
            value: function() {
                F.tweet(1)
            }
        }, {
            key: "nextSceneAnim",
            value: function(t) {
                1 == this.sceneSwitch ? (this.yesText.interactive = !1,
                this.yesText.buttonMode = !1,
                this.noText.interactive = !1,
                this.noText.buttonMode = !1,
                this.loseFace.textures = this.loseFaceSmileTexture) : (this.gotoTitleBtn.off("pointerup"),
                this.gotoTitleBtn.interactive = !1,
                this.gotoTitleBtn.buttonMode = !1),
                TweenMax.to(this, 1.5, {
                    alpha: 0,
                    delay: .3,
                    onComplete: this.nextScene,
                    onCompleteScope: this
                })
            }
        }, {
            key: "sceneRemoved",
            value: function() {
                g.stop("bgm_continue"),
                F.dlog("ContinueScene.sceneRemoved() Start."),
                Ae(Me(e.prototype), "sceneRemoved", this).call(this),
                1 == this.sceneSwitch ? (D.playerMaxHp = B.resource.recipe.data.playerData.maxHp,
                D.playerHp = D.playerMaxHp,
                D.shootMode = B.resource.recipe.data.playerData.defaultShootName,
                D.shootSpeed = B.resource.recipe.data.playerData.defaultShootSpeed,
                D.continueCnt++,
                D.score = D.continueCnt,
                B.Scene = new Ki) : B.Scene = new mn,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("ContinueScene.sceneRemoved() End.")
            }
        }]) && Ee(o.prototype, n),
        a && Ee(o, a),
        e
    }();
    function Fe(t) {
        return (Fe = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Re(t, e) {
        return !e || "object" !== Fe(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Ge(t) {
        return (Ge = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function je(t, e) {
        return (je = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Xe = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = Re(this, Ge(e).call(this, t))).interactive = !0,
            o.animationSpeed = .08,
            o.hitArea = new PIXI.Rectangle(0,0,t[0].width,t[0].height),
            o.play(),
            o
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && je(t, e)
        }(e, PIXI.extras.AnimatedSprite),
        e
    }();
    function He(t) {
        return (He = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ne(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Le(t, e) {
        return !e || "object" !== He(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function We(t, e, o) {
        return (We = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ue(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Ue(t) {
        return (Ue = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Ve(t, e) {
        return (Ve = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Ye = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== He(t.texture[0])) {
                for (var i = 0; i < t.texture.length; i++) {
                    (a = PIXI.Texture.fromFrame(t.texture[i])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                    t.texture[i] = a
                }
                if (t.projectileData && t.projectileData.texture)
                    for (var n = 0; n < t.projectileData.texture.length; n++) {
                        var a;
                        (a = PIXI.Texture.fromFrame(t.projectileData.texture[n])).baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                        t.projectileData.texture[n] = a
                    }
            }
            switch ((o = Le(this, Ue(e).call(this, t.texture, t.explosion))).name = t.name,
            o.interval = t.interval,
            o.score = t.score,
            o.hp = t.hp,
            o.speed = t.speed,
            o.spgage = t.spgage,
            o.projectileData = t.projectileData,
            o.itemName = t.itemName,
            o.itemTexture = t.itemTexture,
            o.whitefilter = new PIXI.filters.ColorMatrixFilter,
            o.whitefilter.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            t.name) {
            case "baraA":
            case "baraB":
                o.shadow.visible = !1;
                break;
            case "drum":
                o.unit.hitArea = new PIXI.Rectangle(7,2,o.unit.width - 14,o.unit.height - 2);
                break;
            case "launchpad":
                o.unit.hitArea = new PIXI.Rectangle(8,0,o.unit.width - 16,o.unit.height)
            }
            return o.shadowReverse = t.shadowReverse,
            o.shadowOffsetY = t.shadowOffsetY,
            o.playerBigBulletCnt = 0,
            o.bulletFrameCnt = 0,
            o.shootFlg = !0,
            o.hardleFlg = !1,
            o.interval <= -1 && (o.hardleFlg = !0),
            o.deadFlg = !1,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Ve(t, e)
        }(e, y),
        o = e,
        (n = [{
            key: "loop",
            value: function(t) {
                switch (this.bulletFrameCnt++,
                this.shootFlg && !this.hardleFlg && this.bulletFrameCnt % this.interval == 0 && this.shoot(),
                this.unit.y += this.speed,
                this.name) {
                case "soliderA":
                    this.unit.y >= i.GAME_HEIGHT / 1.5 && (D.player && D.player.unit || "undefined" != typeof globalThis && globalThis.__GAME_STATE__ && globalThis.__GAME_STATE__.player && globalThis.__GAME_STATE__.player.unit) && (this.unit.x += .005 * ((D.player && D.player.unit ? D.player.unit : globalThis.__GAME_STATE__.player.unit).x - this.unit.x));
                    break;
                case "soliderB":
                    this.unit.y <= 10 && (this.unit.x >= i.GAME_WIDTH / 2 ? (this.unit.x = i.GAME_WIDTH,
                    this.posName = "right") : (this.unit.x = -this.unit.width,
                    this.posName = "left")),
                    this.unit.y >= i.GAME_HEIGHT / 3 && ("right" == this.posName ? this.unit.x -= 1 : "left" == this.posName && (this.unit.x += 1))
                }
            }
        }, {
            key: "shoot",
            value: function() {
                if (!this.projectileData)
                    return;
                this.emit(y.CUSTOM_EVENT_PROJECTILE_ADD),
                g.stop("se_shoot"),
                g.play("se_shoot")
            }
        }, {
            key: "onDamage",
            value: function(t) {
                "infinity" == this.hp ? (TweenMax.to(this.character, .05, {
                    filters: [this.whitefilter]
                }),
                TweenMax.to(this.character, .3, {
                    delay: .1,
                    filters: null
                })) : this.deadFlg || (this.hp -= t,
                this.hp <= 0 ? (this.dead.bind(this)(),
                this.deadFlg = !0) : (TweenMax.to(this.character, .1, {
                    tint: 16711680
                }),
                TweenMax.to(this.character, .1, {
                    delay: .1,
                    tint: 16777215
                })))
            }
        }, {
            key: "dead",
            value: function() {
                "infinity" == this.hp || (this.emit(y.CUSTOM_EVENT_DEAD),
                this.shootFlg = !1,
                this.explosion.onComplete = this.explosionComplete.bind(this),
                this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2,
                this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2,
                this.addChild(this.explosion),
                this.explosion.play(),
                this.unit.removeChild(this.shadow),
                this.unit.removeChild(this.character),
                this.removeChild(this.unit),
                g.stop("se_damage"),
                g.play("se_explosion"))
            }
        }, {
            key: "explosionComplete",
            value: function() {
                this.explosion.destroy(),
                this.removeChild(this.explosion),
                this.emit(y.CUSTOM_EVENT_DEAD_COMPLETE)
            }
        }, {
            key: "castAdded",
            value: function(t) {
                We(Ue(e.prototype), "castAdded", this).call(this)
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                We(Ue(e.prototype), "castRemoved", this).call(this)
            }
        }]) && Ne(o.prototype, n),
        a && Ne(o, a),
        e
    }();
    function Ke(t) {
        return (Ke = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Qe(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ze(t, e) {
        return !e || "object" !== Ke(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function $e(t, e, o) {
        return ($e = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = qe(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function qe(t) {
        return (qe = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Je(t, e) {
        return (Je = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Ze = function(t) {
        function e(t) {
            var o;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = ze(this, qe(e).call(this, t.anim.idle, t.explosion))).name = t.name,
            o.unit.name = BOSS_STATES.UNIT_NAME,
            o.name = t.name,
            o.interval = t.interval,
            o.score = t.score,
            o.hp = t.hp,
            o.spgage = t.spgage,
            o.animList = t.anim,
            o.projectileData = t.projectileData;
            for (var i = [], n = 0; n < 3; n++)
                i[n] = PIXI.Texture.fromFrame("boss_dengerous" + n + ".gif");
            return o.dengerousBalloon = new PIXI.extras.AnimatedSprite(i),
            o.dengerousBalloon.animationSpeed = .2,
            o.dengerousBalloon.pivot.y = o.dengerousBalloon.height,
            o.dengerousBalloon.scale.set(0),
            o.shadowReverse = t.shadowReverse,
            o.shadowOffsetY = t.shadowOffsetY,
            o.shootOn = !0,
            o.bulletFrameCnt = 0,
            o.moveFlg = !1,
            o.deadFlg = !1,
            o.gokiFlg = !1,
            o.dengerousFlg = !1,
            o.unit.hitArea = new PIXI.Rectangle(5,5,o.unit.width - 10,o.unit.height - 10),
            o.tlShoot,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Je(t, e)
        }(e, y),
        o = e,
        (n = [{
            key: "shoot",
            value: function() {
                this.emit(y.CUSTOM_EVENT_PROJECTILE_ADD),
                g.stop("se_shoot"),
                g.play("se_shoot")
            }
        }, {
            key: "onTheWorld",
            value: function(t) {
                t ? this.tlShoot.pause() : this.hp >= 1 && this.tlShoot.resume()
            }
        }, {
            key: "onDamage",
            value: function(t) {
                this.deadFlg || (this.hp -= t,
                this.hp <= 0 ? (this.dead.bind(this)(),
                this.deadFlg = !0) : (TweenMax.isTweening(this.character) && TweenMax.killTweensOf(this.character, {
                    tint: !0
                }),
                TweenMax.to(this.character, .1, {
                    tint: 16773120
                }),
                TweenMax.to(this.character, .1, {
                    delay: .2,
                    tint: 16777215
                }),
                this.hp <= D.spDamage && (this.dengerousFlg || (this.unit.addChild(this.dengerousBalloon),
                this.dengerousBalloon.play(),
                TweenMax.to(this.dengerousBalloon.scale, 1, {
                    x: 1,
                    y: 1,
                    ease: Elastic.easeOut
                }),
                this.dengerousFlg = !0))))
            }
        }, {
            key: "dead",
            value: function() {
                if (this.hp <= 0) {
                    this.gokiFlg || this.emit(y.CUSTOM_EVENT_DEAD),
                    this.character.stop(),
                    this.shadow.stop(),
                    this.explotionCnt = 0,
                    g.stop("se_damage");
                    for (var t = 0; t < 5; t++)
                        TweenMax.delayedCall(.25 * t, function() {
                            var t = new PIXI.extras.AnimatedSprite(this.explosion.textures);
                            t.scale.set(1),
                            t.animationSpeed = .15,
                            t.loop = !1,
                            t.onComplete = this.explosionComplete.bind(this, t),
                            t.x = this.unit.x + Math.random() * this.unit.hitArea.width - t.width / 2,
                            t.y = this.unit.y + Math.random() * this.unit.hitArea.height - t.height / 2,
                            this.addChild(t),
                            t.play(),
                            g.play("se_explosion")
                        }, null, this);
                    var e = this.unit.x
                      , o = this.unit.y;
                    (new TimelineMax).call(function() {
                        this.unit.x = e + 4,
                        this.unit.y = o + -2
                    }, null, this, "+=0.0").call(function() {
                        this.unit.x = e + -3,
                        this.unit.y = o + 1
                    }, null, this, "+=0.08").call(function() {
                        this.unit.x = e + 2,
                        this.unit.y = o + -1
                    }, null, this, "+=0.07").call(function() {
                        this.unit.x = e + -2,
                        this.unit.y = o + 1
                    }, null, this, "+=0.05").call(function() {
                        this.unit.x = e + 1,
                        this.unit.y = o + 1
                    }, null, this, "+=0.05").call(function() {
                        this.unit.x = e + 0,
                        this.unit.y = o + 0
                    }, null, this, "+=0.04").call(function() {
                        this.unit.x = e + 4,
                        this.unit.y = o + -2
                    }, null, this, "+=0.0").call(function() {
                        this.unit.x = e + -3,
                        this.unit.y = o + 1
                    }, null, this, "+=0.08").call(function() {
                        this.unit.x = e + 2,
                        this.unit.y = o + -1
                    }, null, this, "+=0.07").call(function() {
                        this.unit.x = e + -2,
                        this.unit.y = o + 1
                    }, null, this, "+=0.05").call(function() {
                        this.unit.x = e + 1,
                        this.unit.y = o + 1
                    }, null, this, "+=0.05").call(function() {
                        this.unit.x = e + 0,
                        this.unit.y = o + 0
                    }, null, this, "+=0.04").to(this.unit, 1, {
                        delay: .5,
                        alpha: 0
                    }),
                    this.onDead()
                }
            }
        }, {
            key: "explosionComplete",
            value: function(t) {
                this.removeChild(t),
                4 == this.explotionCnt && (this.unit.removeChild(this.shadow),
                this.removeChild(this.unit)),
                this.explotionCnt++
            }
        }, {
            key: "castAdded",
            value: function(t) {
                $e(qe(e.prototype), "castAdded", this).call(this),
                this.unit.x = i.GAME_WIDTH / 2 - this.unit.width / 2,
                this.unit.y = -298,
                this.moveFlg = !0
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                $e(qe(e.prototype), "castRemoved", this).call(this)
            }
        }]) && Qe(o.prototype, n),
        a && Qe(o, a),
        e
    }();
    function to(t) {
        return (to = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function eo(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function oo(t, e) {
        return !e || "object" !== to(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function io(t, e, o) {
        return (io = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = no(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function no(t) {
        return (no = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ao(t, e) {
        return (ao = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var so = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== to(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.attack.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.attack[a]);
                    t.anim.attack[a] = s
                }
            }
            return (o = oo(this, no(e).call(this, t))).unit.hitArea = new PIXI.Rectangle(10,20,o.unit.width - 20,o.unit.height - 30),
            o.dengerousBalloon.y = 20,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && ao(t, e)
        }(e, Ze),
        o = e,
        (n = [{
            key: "loop",
            value: function(t) {
                this.moveFlg ? (this.unit.y >= i.GAME_HEIGHT / 4 && (this.unit.y = i.GAME_HEIGHT / 4,
                this.moveFlg = !1),
                this.unit.y += 1) : (this.shootOn && this.bulletFrameCnt % this.interval == 0 && (this.shootOn = !1,
                g.play("boss_bison_voice_add"),
                TweenMax.delayedCall(1, function() {
                    this.shootStart()
                }
                .bind(this))),
                this.bulletFrameCnt++)
            }
        }, {
            key: "shootStart",
            value: function() {
                this.tlShoot && this.tlShoot.kill();
                var t = i.GAME_HEIGHT / 4
                  , e = i.GAME_HEIGHT - this.unit.height + 30;
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var o = Math.random();
                if (o >= 0 && .6 >= o) {
                    var n = Math.random() > .6 ? i.GAME_CENTER - this.unit.hitArea.width / 2 : (i.GAME_WIDTH - this.unit.hitArea.width) * Math.random();
                    this.tlShoot.to(this.unit, .3, {
                        x: n
                    }),
                    this.tlShoot.addCallback(this.onStraightAttack, "+=0", null, this),
                    this.tlShoot.to(this.unit, .5, {
                        y: t - 10
                    }),
                    this.tlShoot.addCallback(this.onStraightAttackVoice, "+=0", null, this),
                    this.tlShoot.to(this.unit, .35, {
                        y: e
                    }),
                    this.tlShoot.to(this.unit, .2, {
                        y: t
                    }),
                    this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this),
                    this.tlShoot.addCallback(function() {}, "+=0.5", null, this)
                } else
                    o >= .61 && .8 >= o ? (this.tlShoot.to(this.unit, .4, {
                        x: 0,
                        y: t - 20
                    }),
                    this.tlShoot.to(this.unit, .4, {
                        x: 170,
                        y: t + 0
                    }, "+=0.2"),
                    this.tlShoot.addCallback(this.onFaintVoice, "-=0.2", null, this),
                    this.tlShoot.to(this.unit, .4, {
                        x: 0,
                        y: t + 30
                    }),
                    this.tlShoot.to(this.unit, .4, {
                        x: 170,
                        y: t + 60
                    }),
                    this.tlShoot.addCallback(this.onFaintAttack, "+=0", null, this),
                    this.tlShoot.to(this.unit, .3, {
                        x: 170,
                        y: e
                    }, "+=0.2"),
                    this.tlShoot.to(this.unit, .2, {
                        y: t
                    }),
                    this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this),
                    this.tlShoot.addCallback(function() {}, "+=1", null, this)) : o >= .81 && 1 >= o && (this.tlShoot.to(this.unit, .4, {
                        x: 170,
                        y: t - 20
                    }),
                    this.tlShoot.to(this.unit, .4, {
                        x: 0,
                        y: t + 0
                    }, "+=0.2"),
                    this.tlShoot.addCallback(this.onFaintVoice, "-=0.2", null, this),
                    this.tlShoot.to(this.unit, .4, {
                        x: 170,
                        y: t + 30
                    }),
                    this.tlShoot.to(this.unit, .4, {
                        x: 0,
                        y: t + 60
                    }),
                    this.tlShoot.addCallback(this.onFaintAttack, "+=0", null, this),
                    this.tlShoot.to(this.unit, .3, {
                        x: 0,
                        y: e
                    }, "+=0.2"),
                    this.tlShoot.to(this.unit, .2, {
                        y: t
                    }),
                    this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this),
                    this.tlShoot.addCallback(function() {}, "+=1", null, this))
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onStraightAttack",
            value: function() {
                this.character.textures = this.animList.attack,
                this.shadow.textures = this.animList.attack,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onStraightAttackVoice",
            value: function() {
                g.play("boss_bison_voice_punch")
            }
        }, {
            key: "onFaintVoice",
            value: function() {
                g.play("boss_bison_voice_faint")
            }
        }, {
            key: "onFaintAttack",
            value: function() {
                this.character.textures = this.animList.attack,
                this.shadow.textures = this.animList.attack,
                this.character.play(),
                this.shadow.play(),
                g.play("boss_bison_voice_faint_punch")
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_bison_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                io(no(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                io(no(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]) && eo(o.prototype, n),
        a && eo(o, a),
        e
    }();
    function ro(t) {
        return (ro = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function ho(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function lo(t, e) {
        return !e || "object" !== ro(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function uo(t, e, o) {
        return (uo = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = co(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function co(t) {
        return (co = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function fo(t, e) {
        return (fo = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var po = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== ro(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.charge.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.charge[a]);
                    t.anim.charge[a] = s
                }
                for (var r = 0; r < t.anim.attack.length; r++) {
                    var h = PIXI.Texture.fromFrame(t.anim.attack[r]);
                    t.anim.attack[r] = h
                }
                for (var l = 0; l < t.anim.shoot.length; l++) {
                    var u = PIXI.Texture.fromFrame(t.anim.shoot[l]);
                    t.anim.shoot[l] = u
                }
                for (var c = 0; c < t.projectileData.texture.length; c++)
                    t.projectileData.texture[c] = PIXI.Texture.fromFrame(t.projectileData.texture[c])
            }
            return (o = lo(this, co(e).call(this, t))).unit.hitArea = new PIXI.Rectangle(30,20,o.unit.width - 60,o.unit.height - 30),
            o.dengerousBalloon.x = 30,
            o.dengerousBalloon.y = 20,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && fo(t, e)
        }(e, Ze),
        o = e,
        (n = [{
            key: "loop",
            value: function(t) {
                this.moveFlg ? (this.unit.y >= i.GAME_HEIGHT / 4 && (this.unit.y = i.GAME_HEIGHT / 4,
                this.moveFlg = !1),
                this.unit.y += 1) : (this.shootOn && this.bulletFrameCnt % this.interval == 0 && (this.shootOn = !1,
                this.character.stop(),
                this.shadow.stop(),
                g.play("boss_barlog_voice_add"),
                TweenMax.delayedCall(1, function() {
                    this.shootStart()
                }
                .bind(this))),
                this.bulletFrameCnt++)
            }
        }, {
            key: "shootStart",
            value: function() {
                var t = D.player && D.player.unit ? D.player.unit : "undefined" != typeof globalThis && globalThis.__GAME_STATE__ && globalThis.__GAME_STATE__.player && globalThis.__GAME_STATE__.player.unit ? globalThis.__GAME_STATE__.player.unit : {
                    x: i.GAME_CENTER,
                    width: 0
                }
                  , e = this.unit.width - this.unit.hitArea.width
                  , o = t.x + t.width / 2 - this.unit.width / 2;
                o - e / 2 <= -e / 2 && (o = -e / 2),
                o >= i.GAME_WIDTH - this.unit.hitArea.width - e / 2 && (o = i.GAME_WIDTH - this.unit.hitArea.width - e / 2);
                var n = i.GAME_HEIGHT / 4
                  , a = i.GAME_HEIGHT - this.unit.height + 34;
                this.tlShoot && this.tlShoot.kill(),
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var s = Math.random();
                if (s >= 0 && .3 >= s) {
                    var r = Math.random() * (i.GAME_WIDTH - this.unit.width)
                      , h = Math.random() * (i.GAME_HEIGHT - 400) + 60;
                    this.tlShoot.addCallback(this.onMove, "+=0.0", null, this),
                    this.tlShoot.to(this.unit, .6, {
                        x: r,
                        y: h
                    }),
                    this.tlShoot.addCallback(this.onMoveStop, "+=0.1", null, this)
                } else
                    s >= .31 && .8 >= s ? (this.tlShoot.addCallback(this.onMove, "+=0.0", null, this),
                    this.tlShoot.to(this.unit, .3, {
                        x: o
                    }),
                    this.tlShoot.addCallback(this.onShoot, "+=0.4", null, this),
                    this.tlShoot.addCallback(this.onMoveStop, "+=0.5", null, this)) : s >= .81 && 1 >= s && (this.tlShoot.addCallback(this.onMove, "+=0.0", null, this),
                    this.tlShoot.to(this.unit, .5, {
                        x: o
                    }),
                    this.tlShoot.addCallback(this.onCharge, "+=0.0", null, this),
                    this.tlShoot.addCallback(this.onAttack, "+=0.7", null, this),
                    this.tlShoot.to(this.unit, .3, {
                        y: n - 70
                    }, "+=0.0"),
                    this.tlShoot.to(this.unit, .6, {
                        y: a
                    }, "+=0.1"),
                    this.tlShoot.to(this.unit, .2, {
                        y: n
                    }, "+=0.0"),
                    this.tlShoot.addCallback(this.onMoveStop, "+=0.0", null, this))
            }
        }, {
            key: "onMove",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onMoveStop",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.stop(),
                this.shadow.stop()
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle
            }
        }, {
            key: "onCharge",
            value: function() {
                this.character.textures = this.animList.charge,
                this.shadow.textures = this.animList.charge,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onAttack",
            value: function() {
                this.character.textures = this.animList.attack,
                this.shadow.textures = this.animList.attack,
                this.character.play(),
                this.shadow.play(),
                g.play("boss_barlog_voice_barcelona")
            }
        }, {
            key: "onAttackVoice",
            value: function() {}
        }, {
            key: "onShoot",
            value: function() {
                this.character.textures = this.animList.shoot,
                this.shadow.textures = this.animList.shoot,
                this.character.play(),
                this.shadow.play(),
                this.shoot(),
                g.play("boss_barlog_voice_projectile")
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_barlog_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                uo(co(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                uo(co(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]) && ho(o.prototype, n),
        a && ho(o, a),
        e
    }();
    function mo(t) {
        return (mo = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function yo(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function go(t, e) {
        return !e || "object" !== mo(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function bo(t, e, o) {
        return (bo = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = vo(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function vo(t) {
        return (vo = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function _o(t, e) {
        return (_o = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var wo = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== mo(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.charge.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.charge[a]);
                    t.anim.charge[a] = s
                }
                for (var r = 0; r < t.anim.shoot.length; r++) {
                    var h = PIXI.Texture.fromFrame(t.anim.shoot[r]);
                    t.anim.shoot[r] = h
                }
                for (var l = 0; l < t.anim.attack.length; l++) {
                    var u = PIXI.Texture.fromFrame(t.anim.attack[l]);
                    t.anim.attack[l] = u
                }
                for (var c = 0; c < t.projectileDataA.texture.length; c++)
                    t.projectileDataA.texture[c] = PIXI.Texture.fromFrame(t.projectileDataA.texture[c]);
                for (var f = 0; f < t.projectileDataB.texture.length; f++)
                    t.projectileDataB.texture[f] = PIXI.Texture.fromFrame(t.projectileDataB.texture[f])
            }
            return (o = go(this, vo(e).call(this, t))).projectileDataA = t.projectileDataA,
            o.projectileDataB = t.projectileDataB,
            o.projectileData = o.projectileDataA,
            o.unit.hitArea = new PIXI.Rectangle(20,20,o.unit.width - 40,o.unit.height - 20),
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && _o(t, e)
        }(e, Ze),
        o = e,
        (n = [{
            key: "loop",
            value: function(t) {
                this.moveFlg ? (this.unit.y >= i.GAME_HEIGHT / 4 && (this.unit.y = i.GAME_HEIGHT / 4,
                this.moveFlg = !1),
                this.unit.y += 1) : (this.shootOn && this.bulletFrameCnt % this.interval == 0 && (this.shootOn = !1,
                g.play("boss_sagat_voice_add"),
                TweenMax.delayedCall(1, function() {
                    this.shootStart()
                }
                .bind(this))),
                this.bulletFrameCnt++)
            }
        }, {
            key: "shootStart",
            value: function() {
                this.tlShoot && this.tlShoot.kill();
                var t = D.player && D.player.unit ? D.player.unit : "undefined" != typeof globalThis && globalThis.__GAME_STATE__ && globalThis.__GAME_STATE__.player && globalThis.__GAME_STATE__.player.unit ? globalThis.__GAME_STATE__.player.unit : {
                    x: i.GAME_CENTER,
                    width: 0
                }
                  , e = this.unit.width - this.unit.hitArea.width
                  , o = t.x + t.width / 2 - this.unit.width / 2;
                o - e / 2 <= -e / 2 && (o = -e / 2),
                o >= i.GAME_WIDTH - this.unit.hitArea.width - e / 2 && (o = i.GAME_WIDTH - this.unit.hitArea.width - e / 2);
                var n = i.GAME_HEIGHT / 4
                  , a = i.GAME_HEIGHT - this.unit.height + 70;
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var s = Math.random();
                s >= 0 && .3 >= s ? (this.projectileData = this.projectileDataA,
                this.tlShoot.to(this.unit, .25, {
                    x: -20
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.to(this.unit, .25, {
                    x: 10
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.to(this.unit, .25, {
                    x: 35
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.to(this.unit, .25, {
                    x: 80
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.to(this.unit, .25, {
                    x: 120
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.to(this.unit, .25, {
                    x: 160
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.25", null, this),
                this.tlShoot.addCallback(function() {
                    this.onIdle()
                }, "+=0.3", null, this)) : s >= .31 && .6 >= s ? (this.projectileData = this.projectileDataA,
                this.tlShoot.to(this.unit, .25, {
                    x: o
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onCharge, "+=0.2", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.2", null, this),
                this.tlShoot.addCallback(function() {
                    this.onIdle()
                }, "+=0.3", null, this)) : s >= .61 && .8 >= s ? (this.projectileData = this.projectileDataB,
                this.tlShoot.to(this.unit, .25, {
                    x: o
                }),
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onBigShoot, "+=1.3", null, this),
                this.tlShoot.addCallback(function() {
                    this.onIdle()
                }, "+=0.3", null, this)) : s >= .81 && 1 >= s && (this.tlShoot.to(this.unit, .4, {
                    x: o,
                    y: n - 20
                }),
                this.tlShoot.addCallback(this.onTigerKnee, "+=0.0", null, this),
                this.tlShoot.to(this.unit, .3, {
                    y: a
                }, "+=0.5"),
                this.tlShoot.addCallback(this.onTigerKneeVoice, "-=0.2", null, this),
                this.tlShoot.to(this.unit, .2, {
                    y: n
                }, "+=0.05"),
                this.tlShoot.addCallback(this.onIdle, "+=0.0", null, this))
            }
        }, {
            key: "onCharge",
            value: function() {
                this.character.textures = this.animList.charge,
                this.shadow.textures = this.animList.charge,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onShoot",
            value: function() {
                this.character.textures = this.animList.shoot,
                this.shadow.textures = this.animList.shoot,
                this.character.play(),
                this.shadow.play(),
                this.shoot(),
                g.play("boss_sagat_voice_projectile0")
            }
        }, {
            key: "onBigShoot",
            value: function() {
                this.character.textures = this.animList.shoot,
                this.shadow.textures = this.animList.shoot,
                this.character.play(),
                this.shadow.play(),
                this.shoot(),
                g.play("boss_sagat_voice_projectile1")
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onTigerKnee",
            value: function() {
                this.character.textures = this.animList.attack,
                this.shadow.textures = this.animList.attack
            }
        }, {
            key: "onTigerKneeVoice",
            value: function() {
                g.play("boss_sagat_voice_kick")
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_sagat_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                bo(vo(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                bo(vo(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]) && yo(o.prototype, n),
        a && yo(o, a),
        e
    }();
    function xo(t) {
        return (xo = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function To(t, e) {
        return !e || "object" !== xo(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function So(t, e, o) {
        return (So = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Co(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Co(t) {
        return (Co = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ko(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Io(t, e, o) {
        return e && ko(t.prototype, e),
        o && ko(t, o),
        t
    }
    function Oo(t, e) {
        return (Oo = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Eo = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== xo(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.attack.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.attack[a]);
                    t.anim.attack[a] = s
                }
                for (var r = 0; r < t.anim.shoot.length; r++) {
                    var h = PIXI.Texture.fromFrame(t.anim.shoot[r]);
                    t.anim.shoot[r] = h
                }
                for (var l = 0; l < t.projectileDataA.texture.length; l++)
                    t.projectileDataA.texture[l] = PIXI.Texture.fromFrame(t.projectileDataA.texture[l]);
                for (var u = 0; u < t.projectileDataB.texture.length; u++)
                    t.projectileDataB.texture[u] = PIXI.Texture.fromFrame(t.projectileDataB.texture[u]);
                t.projectileDataB.name = "psychoField",
                t.projectileData = t.projectileDataA
            }
            return (o = To(this, Co(e).call(this, t))).projectileDataA = t.projectileDataA,
            o.projectileDataB = t.projectileDataB,
            o.unit.hitArea = new PIXI.Rectangle(20,13,o.unit.width - 40,o.unit.height - 20),
            o.dengerousBalloon.y = 15,
            o.vegaBlur = new PIXI.filters.BlurFilter,
            o.vegaBlur.blur = 0,
            o.character.filters = [o.vegaBlur],
            o.gokiFlg = t.gokiFlg,
            o
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Oo(t, e)
        }(e, Ze),
        Io(e, null, [{
            key: "CUSTOM_EVENT_GOKI",
            get: function() {
                return CUSTOM_EVENTS.GOKI
            }
        }]),
        Io(e, [{
            key: "loop",
            value: function(t) {
                this.moveFlg ? (this.unit.y >= i.GAME_HEIGHT / 4 && (this.unit.y = i.GAME_HEIGHT / 4,
                this.moveFlg = !1),
                this.unit.y += 1) : (this.shootOn && this.bulletFrameCnt % this.interval == 0 && (this.shootOn = !1,
                this.gokiFlg ? this.emit(e.CUSTOM_EVENT_GOKI) : (g.play("boss_vega_voice_add"),
                TweenMax.delayedCall(1, function() {
                    this.shootStart()
                }
                .bind(this)))),
                this.bulletFrameCnt++)
            }
        }, {
            key: "shootStart",
            value: function() {
                this.tlShoot && this.tlShoot.kill();
                var t = D.player && D.player.unit ? D.player.unit : "undefined" != typeof globalThis && globalThis.__GAME_STATE__ && globalThis.__GAME_STATE__.player && globalThis.__GAME_STATE__.player.unit ? globalThis.__GAME_STATE__.player.unit : {
                    x: i.GAME_CENTER,
                    width: 0
                }
                  , e = this.unit.width - this.unit.hitArea.width
                  , o = t.x + t.width / 2 - this.unit.width / 2;
                o - e / 2 <= -e / 2 && (o = -e / 2),
                o >= i.GAME_WIDTH - this.unit.hitArea.width - e / 2 && (o = i.GAME_WIDTH - this.unit.hitArea.width - e / 2);
                var n = i.GAME_HEIGHT / 4;
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var a = Math.random();
                a >= 0 && .1 >= a ? (this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 10
                }),
                this.tlShoot.addCallback(this.onWarp, "+=0", null, this),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 0
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 10
                }, "+=0.2"),
                this.tlShoot.addCallback(function() {
                    this.unit.x = i.GAME_WIDTH - this.unit.width
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 10
                }, "+=0.2"),
                this.tlShoot.addCallback(function() {
                    this.unit.x = Math.floor(Math.random() * (i.GAME_WIDTH - this.unit.width))
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.addCallback(function() {}, "+=0.5", null, this)) : a >= .11 && .4 >= a ? (this.projectileData = this.projectileDataA,
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 0,
                    g.play("boss_vega_voice_projectile"),
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 160,
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 16,
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 128,
                    g.play("boss_vega_voice_projectile"),
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 32,
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = 96,
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.vegaBlur, .1, {
                    delay: .3,
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = i.GAME_CENTER - this.unit.width / 2,
                    g.play("boss_vega_voice_projectile"),
                    this.onPsychoShoot()
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.addCallback(function() {}, "+=4.0", null, this)) : a >= .41 && .7 >= a ? (this.projectileData = this.projectileDataB,
                this.tlShoot.to(this.unit, .3, {
                    x: i.GAME_CENTER - this.unit.width / 2,
                    y: n + 10
                }),
                this.tlShoot.addCallback(function() {
                    this.onPsychoFieldAttack()
                }, "+=0.5", null, this),
                this.tlShoot.addCallback(this.onPsychoShoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this),
                this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this),
                this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this),
                this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this),
                this.tlShoot.addCallback(this.onIdle, "+=0.0", null, this),
                this.tlShoot.addCallback(function() {}, "+=3.0", null, this)) : a >= .71 && 1 >= a && (this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 15
                }),
                this.tlShoot.addCallback(function() {
                    this.unit.x = o
                }, "+=0", null, this),
                this.tlShoot.to(this.vegaBlur, .1, {
                    blur: 0
                }),
                this.tlShoot.to(this.unit, .2, {
                    y: n - 20
                }),
                this.tlShoot.addCallback(this.onAttack, "+=0", null, this),
                this.tlShoot.to(this.unit, .9, {
                    y: i.GAME_HEIGHT - 15
                }),
                this.tlShoot.addCallback(this.onIdle, "+=0.0", null, this),
                this.tlShoot.addCallback(function() {
                    this.unit.x = i.GAME_CENTER - this.unit.width / 2,
                    this.unit.y = -this.unit.height
                }, "+=0.0", null, this),
                this.tlShoot.to(this.unit, 1, {
                    y: n
                }),
                this.tlShoot.addCallback(function() {}, "+=1", null, this))
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onPsychoShoot",
            value: function() {
                this.shoot()
            }
        }, {
            key: "onPsychoFieldShoot",
            value: function() {
                this.shoot()
            }
        }, {
            key: "onWarp",
            value: function() {
                g.play("boss_vega_voice_warp")
            }
        }, {
            key: "onAttack",
            value: function() {
                g.play("boss_vega_voice_crusher"),
                this.character.textures = this.animList.attack,
                this.shadow.textures = this.animList.attack,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onPsychoFieldAttack",
            value: function() {
                g.play("boss_vega_voice_shoot"),
                this.character.textures = this.animList.shoot,
                this.shadow.textures = this.animList.shoot,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_vega_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                So(Co(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                So(Co(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]),
        e
    }();
    function Po(t) {
        return (Po = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ao(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Mo(t, e) {
        return !e || "object" !== Po(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Do(t, e, o) {
        return (Do = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Bo(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Bo(t) {
        return (Bo = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Fo(t, e) {
        return (Fo = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Ro = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== Po(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.syngoku.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.syngoku[a]);
                    t.anim.syngoku[a] = s
                }
                for (var r = 0; r < t.anim.syngokuFinish.length; r++) {
                    var h = PIXI.Texture.fromFrame(t.anim.syngokuFinish[r]);
                    t.anim.syngokuFinish[r] = h
                }
                for (var l = 0; l < t.anim.syngokuFinishTen.length; l++) {
                    var u = PIXI.Texture.fromFrame(t.anim.syngokuFinishTen[l]);
                    t.anim.syngokuFinishTen[l] = u
                }
                for (var c = 0; c < t.anim.shootA.length; c++) {
                    var f = PIXI.Texture.fromFrame(t.anim.shootA[c]);
                    t.anim.shootA[c] = f
                }
                for (var d = 0; d < t.anim.shootB.length; d++) {
                    var p = PIXI.Texture.fromFrame(t.anim.shootB[d]);
                    t.anim.shootB[d] = p
                }
                for (var m = 0; m < t.projectileDataA.texture.length; m++)
                    t.projectileDataA.texture[m] = PIXI.Texture.fromFrame(t.projectileDataA.texture[m]);
                for (var y = 0; y < t.projectileDataB.texture.length; y++)
                    t.projectileDataB.texture[y] = PIXI.Texture.fromFrame(t.projectileDataB.texture[y]);
                t.projectileData = t.projectileDataA
            }
            o = Mo(this, Bo(e).call(this, t)),
            t.projectileDataA.explosion = t.explosion,
            t.projectileDataB.explosion = t.explosion,
            o.unit.hitArea = new PIXI.Rectangle(15,20,o.unit.width - 30,o.unit.height - 24),
            o.dengerousBalloon.x = 5,
            o.dengerousBalloon.y = 20,
            o.projectileDataA = t.projectileDataA,
            o.projectileDataB = t.projectileDataB,
            o.shungokuHitEffectTextureList = [];
            for (var g = 0; g < 5; g++)
                o.shungokuHitEffectTextureList[g] = PIXI.Texture.fromFrame("hit" + String(g) + ".gif");
            return o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Fo(t, e)
        }(e, Ze),
        o = e,
        (n = [{
            key: "loop",
            value: function(t) {}
        }, {
            key: "shootStart",
            value: function() {
                this.tlShoot && this.tlShoot.kill();
                var t = D.player && D.player.unit ? D.player.unit : "undefined" != typeof globalThis && globalThis.__GAME_STATE__ && globalThis.__GAME_STATE__.player && globalThis.__GAME_STATE__.player.unit ? globalThis.__GAME_STATE__.player.unit : {
                    x: i.GAME_CENTER,
                    width: 0
                }
                  , e = this.unit.width - this.unit.hitArea.width
                  , o = t.x + t.width / 2 - this.unit.width / 2;
                o - e / 2 <= -e / 2 && (o = -e / 2),
                o >= i.GAME_WIDTH - this.unit.hitArea.width - e / 2 && (o = i.GAME_WIDTH - this.unit.hitArea.width - e / 2),
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var n = Math.random();
                if (n >= 0 && .34 >= n)
                    this.tlShoot.to(this.unit, .4, {
                        x: o
                    }),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        g.play("boss_goki_voice_projectile0"),
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        g.play("boss_goki_voice_projectile0"),
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        g.play("boss_goki_voice_projectile0"),
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onShootA, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataA,
                        this.shoot()
                    }, "+=0.32", null, this),
                    this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
                else if (n >= .35 && .64 >= n)
                    this.tlShoot.to(this.unit, .4, {
                        x: o
                    }),
                    this.tlShoot.addCallback(this.onShootB, "+=0", null, this),
                    this.tlShoot.addCallback(function() {
                        this.projectileData = this.projectileDataB,
                        this.shoot()
                    }, "+=0.4", null, this),
                    this.tlShoot.addCallback(this.onIdle, "+=0.8", null, this);
                else if (n >= .65 && .89 >= n)
                    this.tlShoot.addCallback(this.ashuraSenku, "+=0.4", null, this),
                    this.tlShoot.to(this.unit, 1.2, {
                        y: i.GAME_HEIGHT - this.unit.height + 80
                    }),
                    this.tlShoot.to(this.unit, .7, {
                        x: Math.random() * (i.GAME_WIDTH - this.unit.width),
                        y: i.GAME_HEIGHT / 4
                    }, "+=0.2"),
                    this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
                else if (n >= .9 && 1 >= n) {
                    var a = Math.random > .5 ? 60 : i.GAME_HEIGHT / 4;
                    this.tlShoot.addCallback(this.ashuraSenku, "+=0", null, this),
                    this.tlShoot.to(this.unit, .7, {
                        x: Math.random() * (i.GAME_WIDTH - this.unit.width),
                        y: a
                    }),
                    this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this)
                }
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onShootA",
            value: function() {
                this.character.textures = this.animList.shootA,
                this.shadow.textures = this.animList.shootA,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !1,
                this.shadow.loop = !1
            }
        }, {
            key: "onShootB",
            value: function() {
                this.character.textures = this.animList.shootB,
                this.shadow.textures = this.animList.shootB,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !1,
                this.shadow.loop = !1,
                g.play("boss_goki_voice_projectile1")
            }
        }, {
            key: "ashuraSenku",
            value: function() {
                this.character.textures = this.animList.syngoku,
                this.shadow.textures = this.animList.syngoku,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !1,
                this.shadow.loop = !1,
                g.play("boss_goki_voice_ashura")
            }
        }, {
            key: "toujou",
            value: function() {
                g.play("boss_goki_voice_add")
            }
        }, {
            key: "shungokusatsu",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
                g.play("boss_goki_voice_syungokusatu0");
                var o = new PIXI.Graphics;
                o.beginFill(0),
                o.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
                o.endFill(),
                this.addChild(o);
                var n = new PIXI.Graphics;
                n.beginFill(16777215),
                n.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
                n.endFill(),
                n.alpha = 0,
                this.addChild(n);
                for (var a = new TimelineMax, s = 0; s < 10; s++)
                    a.addCallback(function() {
                        var e = new PIXI.extras.AnimatedSprite(this.shungokuHitEffectTextureList);
                        e.x = t.x + Math.random() * t.width,
                        e.y = t.y + Math.random() * (t.height / 2),
                        e.animationSpeed = .15,
                        e.loop = !1,
                        e.onComplete = this.effectComplete.bind(this, e),
                        e.play(),
                        g.play("se_damage"),
                        this.addChild(e)
                    }, "+=" + String(.05), null, this),
                    a.addCallback(function() {
                        n.alpha = .2
                    }, "+=" + String(0), null, this),
                    a.addCallback(function() {
                        n.alpha = 0
                    }, "+=" + String(.06), null, this);
                a.addCallback(function() {
                    e ? (this.character.textures = this.animList.syngokuFinishTen,
                    this.shadow.textures = this.animList.syngokuFinishTen) : (this.character.textures = this.animList.syngokuFinish,
                    this.shadow.textures = this.animList.syngokuFinish)
                }, "+=0", null, this),
                a.to(o, .3, {
                    alpha: 0
                }, "+=0.7"),
                a.addCallback(function() {
                    g.play("boss_goki_voice_syungokusatu1")
                }, "-=0.15", null, this),
                a.addCallback(function() {
                    this.character.textures = this.animList.idle,
                    this.shadow.textures = this.animList.idle,
                    this.character.play(),
                    this.shadow.play(),
                    this.character.loop = !0,
                    this.shadow.loop = !0
                }, "+=1.5", null, this)
            }
        }, {
            key: "effectComplete",
            value: function(t) {
                t.alpha = 0,
                this.removeChild(t)
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_goki_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                Do(Bo(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax,
                this.character.textures = this.animList.syngoku,
                this.shadow.textures = this.animList.syngoku,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !1,
                this.shadow.loop = !1
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                Do(Bo(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]) && Ao(o.prototype, n),
        a && Ao(o, a),
        e
    }();
    function Go(t) {
        return (Go = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function jo(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Xo(t, e) {
        return !e || "object" !== Go(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Ho(t, e, o) {
        return (Ho = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = No(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function No(t) {
        return (No = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Lo(t, e) {
        return (Lo = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Wo = function(t) {
        function e(t) {
            var o;
            if (function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            "object" !== Go(t.anim.idle[0])) {
                for (var i = 0; i < t.anim.idle.length; i++) {
                    var n = PIXI.Texture.fromFrame(t.anim.idle[i]);
                    t.anim.idle[i] = n
                }
                for (var a = 0; a < t.anim.wait.length; a++) {
                    var s = PIXI.Texture.fromFrame(t.anim.wait[a]);
                    t.anim.wait[a] = s
                }
                for (var r = 0; r < t.anim.charge.length; r++) {
                    var h = PIXI.Texture.fromFrame(t.anim.charge[r]);
                    t.anim.charge[r] = h
                }
                for (var l = 0; l < t.anim.shoot.length; l++) {
                    var u = PIXI.Texture.fromFrame(t.anim.shoot[l]);
                    t.anim.shoot[l] = u
                }
                for (var c = 0; c < t.projectileDataA.texture.length; c++)
                    t.projectileDataA.texture[c] = PIXI.Texture.fromFrame(t.projectileDataA.texture[c]);
                t.projectileDataA.name = "beam",
                t.projectileDataA.cnt = 0;
                for (var f = 0; f < t.projectileDataB.texture.length; f++)
                    t.projectileDataB.texture[f] = PIXI.Texture.fromFrame(t.projectileDataB.texture[f]);
                t.projectileDataB.name = "smoke",
                t.projectileDataB.cnt = 0;
                for (var d = 0; d < t.projectileDataC.texture.length; d++)
                    t.projectileDataC.texture[d] = PIXI.Texture.fromFrame(t.projectileDataC.texture[d]);
                t.projectileDataC.name = "meka",
                t.projectileData = t.projectileDataA
            }
            return (o = Xo(this, No(e).call(this, t))).unit.hitArea = new PIXI.Rectangle(35,55,o.unit.width - 70,o.unit.height - 70),
            o.dengerousBalloon.x = 70,
            o.dengerousBalloon.y = 40,
            o.projectileDataA = t.projectileDataA,
            o.projectileDataB = t.projectileDataB,
            o.projectileDataC = t.projectileDataC,
            o.unit.removeChild(o.shadow),
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Lo(t, e)
        }(e, Ze),
        o = e,
        (i = [{
            key: "loop",
            value: function(t) {
                this.moveFlg ? (this.unit.y >= 48 && (this.moveFlg = !1),
                this.unit.y += .7) : (this.shootOn && this.bulletFrameCnt % this.interval == 0 && (this.shootOn = !1,
                g.play("boss_fang_voice_add"),
                TweenMax.delayedCall(1, function() {
                    this.shootStart()
                }
                .bind(this))),
                this.bulletFrameCnt++)
            }
        }, {
            key: "shootStart",
            value: function() {
                this.tlShoot && this.tlShoot.kill(),
                this.tlShoot = new TimelineMax({
                    delay: .5,
                    onComplete: this.shootStart,
                    onCompleteScope: this
                });
                var t = Math.random();
                t >= 0 && .3 >= t ? (this.projectileData = this.projectileDataA,
                this.tlShoot.addCallback(this.onCharge, "+=0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this),
                this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this),
                this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this),
                this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this),
                this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this),
                this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this),
                this.tlShoot.addCallback(function() {}, "+=1", null, this)) : t >= .31 && .7 >= t ? (this.projectileData = this.projectileDataC,
                g.play("boss_fang_voice_beam1"),
                this.tlShoot.addCallback(this.shoot, "+=0.0", null, this),
                this.tlShoot.addCallback(this.onWait, "+=0.5", null, this),
                this.tlShoot.addCallback(function() {}, "+=4", null, this)) : t >= .71 && 1 >= t && (this.projectileData = this.projectileDataB,
                this.tlShoot.addCallback(this.onSmoke, "+=0", null, this),
                this.tlShoot.addCallback(this.onWait, "+=1.0", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(this.shoot, "+=0.3", null, this),
                this.tlShoot.addCallback(function() {}, "+=7", null, this))
            }
        }, {
            key: "onCharge",
            value: function() {
                this.character.textures = this.animList.charge,
                this.shadow.textures = this.animList.charge,
                this.character.play(),
                this.shadow.play()
            }
        }, {
            key: "onBeamVoice2",
            value: function() {
                g.play("boss_fang_voice_beam0")
            }
        }, {
            key: "onBeamVoice",
            value: function() {
                g.play("boss_fang_voice_beam1")
            }
        }, {
            key: "onShoot",
            value: function() {
                this.character.textures = this.animList.shoot,
                this.shadow.textures = this.animList.shoot,
                this.character.play(),
                this.shadow.play(),
                this.shoot(),
                this.character.loop = !1,
                this.shadow.loop = !1
            }
        }, {
            key: "onSmoke",
            value: function() {
                g.play("boss_fang_voice_projectile")
            }
        }, {
            key: "onIdle",
            value: function() {
                this.character.textures = this.animList.idle,
                this.shadow.textures = this.animList.idle,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !0,
                this.shadow.loop = !0
            }
        }, {
            key: "onWait",
            value: function() {
                this.character.textures = this.animList.wait,
                this.shadow.textures = this.animList.wait,
                this.character.play(),
                this.shadow.play(),
                this.character.loop = !0,
                this.shadow.loop = !0
            }
        }, {
            key: "onDead",
            value: function() {
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill()),
                g.play("boss_fang_voice_ko")
            }
        }, {
            key: "castAdded",
            value: function(t) {
                Ho(No(e.prototype), "castAdded", this).call(this),
                this.tlShoot = new TimelineMax,
                this.unit.y = -249
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                Ho(No(e.prototype), "castRemoved", this).call(this),
                this.tlShoot && (this.tlShoot.pause(),
                this.tlShoot.kill())
            }
        }]) && jo(o.prototype, i),
        n && jo(o, n),
        e
    }();
    function Uo(t) {
        return (Uo = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Vo(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Yo(t, e) {
        return !e || "object" !== Uo(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Ko(t) {
        return (Ko = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Qo(t, e) {
        return (Qo = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var zo = function(t) {
        function e(t, o) {
            var i;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (i = Yo(this, Ko(e).call(this))).textureList = [];
            for (var n = 0; n <= 9; n++) {
                var a = PIXI.Texture.fromFrame("smallNum" + String(n) + ".gif");
                a.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                i.textureList[n] = a
            }
            for (var s = String(t), r = 0, h = 0; h < s.length; h++) {
                var l = s.substr(h, 1)
                  , u = new PIXI.Sprite(i.textureList[Number(l)]);
                r = h * (u.width - 2),
                u.x = r,
                i.addChild(u)
            }
            var c = new PIXI.Sprite(PIXI.Texture.fromFrame("smallNumKakeru.gif"));
            c.x = r + 8,
            i.addChild(c);
            for (var f = String(o), d = 0; d < f.length; d++) {
                var p = f.substr(d, 1)
                  , m = new PIXI.Sprite(i.textureList[Number(p)]);
                m.x = c.x + c.width + 1 + d * (m.width - 1),
                i.addChild(m)
            }
            return i
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Qo(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {}
        }]) && Vo(o.prototype, i),
        n && Vo(o, n),
        e
    }();
    function $o(t) {
        return ($o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function qo(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Jo(t, e) {
        return !e || "object" !== $o(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Zo(t) {
        return (Zo = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function ti(t, e) {
        return (ti = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var ei = function(t) {
        function e(t) {
            var o;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = Jo(this, Zo(e).call(this))).maxDigit = t,
            o.textureList = [];
            for (var i = 0; i <= 9; i++)
                o.textureList[i] = PIXI.Texture.fromFrame("smallNum" + String(i) + ".gif");
            o.numSpList = [];
            for (var n = 0; n < t; n++) {
                var a = new PIXI.Sprite(o.textureList[0]);
                a.x = (t - 1 - n) * (a.width - 2),
                o.addChild(a),
                o.numSpList[n] = a
            }
            return o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && ti(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "setNum",
            value: function(t) {
                for (var e = String(t), o = 0; o < this.maxDigit; o++) {
                    var i = e.substr(o, 1);
                    i ? (this.numSpList[e.length - 1 - o].texture = this.textureList[Number(i)],
                    this.numSpList[o].alpha = 1) : (this.numSpList[o].texture = this.textureList[0],
                    this.numSpList[o].alpha = .5)
                }
            }
        }, {
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {}
        }]) && qo(o.prototype, i),
        n && qo(o, n),
        e
    }();
    function oi(t) {
        return (oi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function ii(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ni(t, e) {
        return !e || "object" !== oi(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ai(t) {
        return (ai = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function si(t, e) {
        return (si = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var ri = function(t) {
        function e() {
            var t;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = ni(this, ai(e).call(this))).numTextureList = [];
            for (var o = 0; o <= 9; o++)
                t.numTextureList[o] = PIXI.Texture.fromFrame("comboNum" + String(o) + ".gif");
            return t.nowDisplayNumList = [],
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && si(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "setNum",
            value: function(t) {
                if (this.nowDisplayNumList.length)
                    for (var e = 0; e < this.nowDisplayNumList.length; e++)
                        this.removeChild(this.nowDisplayNumList[e]);
                for (var o = String(t), i = 0; i < o.length; i++) {
                    var n = o.substr(i, 1)
                      , a = new PIXI.Sprite(this.numTextureList[n]);
                    a.x = i * a.width,
                    this.addChild(a),
                    this.nowDisplayNumList[i] = a
                }
            }
        }, {
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {}
        }]) && ii(o.prototype, i),
        n && ii(o, n),
        e
    }();
    function hi(t) {
        return (hi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function li(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ui(t, e, o) {
        return (ui = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = ci(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function ci(t) {
        return (ci = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function fi(t, e) {
        return (fi = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    function di(t) {
        if (void 0 === t)
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return t
    }
    var pi = function(t) {
        function e() {
            var t, o, i;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            o = this,
            (t = !(i = ci(e).call(this)) || "object" !== hi(i) && "function" != typeof i ? di(o) : i).hudCabtnBg1 = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtnBg1.gif")),
            t.hudCabtnBg1.x = 32,
            t.hudCabtnBg1.y = 32,
            t.hudCabtnBg1.alpha = 0,
            t.hudCabtnBg1.anchor.set(.5),
            t.hudCabtnBg0 = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtnBg0.gif")),
            t.hudCabtnBg0.x = -18,
            t.hudCabtnBg0.y = -18,
            t.hudCabtnBg0.alpha = 0,
            t.spGageBarBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtn100per.gif")),
            t.spGageBarMask = new PIXI.Graphics,
            t.spGageBarMask.drawRect(0, 0, 50, -50),
            t.spGageBarMask.x = 8,
            t.spGageBarMask.y = 58,
            t.spGageBarMask.scale.y = 0,
            t.spGageBar = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtn0per.gif")),
            t.spGageBar.mask = t.spGageBarMask,
            t.overCircle = new PIXI.Graphics,
            t.overCircle.beginFill(16777215),
            t.overCircle.drawCircle(33, 33, 28),
            t.overCircle.endFill(),
            t.overCircle.alpha = 0,
            t.okFlg = !1,
            t.isClear = !1,
            t.timeline = new TimelineMax({
                repeat: -1,
                yoyo: di(di(t))
            }),
            t.timeline.to(t.hudCabtnBg1, .4, {
                alpha: 1
            }),
            t.timeline.to(t.hudCabtnBg1, .4, {
                alpha: 0
            }),
            t.timeline.pause(),
            t.hitArea = new PIXI.Rectangle(5,5,t.spGageBarBg.width - 10,t.spGageBarBg.height - 12),
            t
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && fi(t, e)
        }(e, l),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                TweenMax.to(this.overCircle, .1, {
                    alpha: .65
                }),
                TweenMax.to(this.overCircle, .3, {
                    delay: .1,
                    alpha: 0
                })
            }
        }, {
            key: "onDown",
            value: function(t) {
                var e = this.x
                  , o = this.y;
                TweenMax.to(this, .001, {
                    delay: 0,
                    x: e,
                    y: o - 1
                }),
                TweenMax.to(this, .001, {
                    delay: .05,
                    x: e - 1,
                    y: o + 1
                }),
                TweenMax.to(this, .001, {
                    delay: .1,
                    x: e + 1,
                    y: o - 1
                }),
                TweenMax.to(this, .001, {
                    delay: .15,
                    x: e,
                    y: o
                })
            }
        }, {
            key: "setPercent",
            value: function(t) {
                this.spGageBarMask.scale.y = t,
                t >= 1 && (this.okFlg || this.onPrepearOk(),
                this.okFlg = !0)
            }
        }, {
            key: "onPrepearOk",
            value: function() {
                this.hudCabtnBg0.alpha = 1,
                this.hudCabtnBg1.alpha = 1,
                this.hudCabtnBg1.scale.set(1.4),
                TweenMax.to(this.hudCabtnBg1.scale, .5, {
                    x: 1,
                    y: 1
                }),
                this.timeline.resume(),
                this.isClear || this.onActive()
            }
        }, {
            key: "spFire",
            value: function() {
                this.onDeactive.bind(this)(),
                this.okFlg = !1,
                this.timeline.pause(),
                this.hudCabtnBg1.alpha = 0,
                this.hudCabtnBg0.alpha = 0
            }
        }, {
            key: "onActive",
            value: function() {
                this.interactive = !0,
                this.buttonMode = !0,
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerdown", this.onDown.bind(this))
            }
        }, {
            key: "onDeactive",
            value: function() {
                this.interactive = !1,
                this.buttonMode = !1,
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerdown", this.onDown.bind(this))
            }
        }, {
            key: "castAdded",
            value: function(t) {
                ui(ci(e.prototype), "castAdded", this).call(this),
                this.addChild(this.hudCabtnBg1),
                this.addChild(this.hudCabtnBg0),
                this.addChild(this.spGageBarBg),
                this.addChild(this.spGageBarMask),
                this.addChild(this.spGageBar),
                this.addChild(this.overCircle)
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                ui(ci(e.prototype), "castRemoved", this).call(this),
                this.removeChild(this.hudCabtnBg1),
                this.removeChild(this.hudCabtnBg0),
                this.removeChild(this.spGageBarBg),
                this.removeChild(this.spGageBarMask),
                this.removeChild(this.spGageBar),
                this.removeChild(this.overCircle)
            }
        }]) && li(o.prototype, i),
        n && li(o, n),
        e
    }();
    function mi(t) {
        return (mi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function yi(t, e) {
        return !e || "object" !== mi(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function gi(t) {
        return (gi = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function bi(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function vi(t, e, o) {
        return e && bi(t.prototype, e),
        o && bi(t, o),
        t
    }
    function _i(t, e) {
        return (_i = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var wi = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = yi(this, gi(e).call(this))).hudBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudBg0.gif")),
            t.hudDamageBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudBg1.gif")),
            t.hudDamageBg.alpha = 0,
            t.hpBar = new PIXI.Sprite(PIXI.Texture.fromFrame("hpBar.gif")),
            t.hpBar.x = 49,
            t.hpBar.y = 7,
            t.hpBar.scale.x = .5,
            t.spgaBtn = new pi,
            t.spgaBtn.x = i.GAME_WIDTH - 70,
            t.spgaBtn.y = i.GAME_MIDDLE + 15,
            t.scoreTitleTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("smallScoreTxt.gif")),
            t.scoreTitleTxt.x = 30,
            t.scoreTitleTxt.y = 25,
            t.scoreNumTxt = new ei(10),
            t.scoreNumTxt.x = t.scoreTitleTxt.x + t.scoreTitleTxt.width + 2,
            t.scoreNumTxt.y = t.scoreTitleTxt.y,
            t.scoreNumTxt.setNum(99),
            t.comboBar = new PIXI.Sprite(PIXI.Texture.fromFrame("comboBar.gif")),
            t.comboBar.x = 149,
            t.comboBar.y = 32,
            t.comboNumTxt = new ri(2),
            t.comboNumTxt.x = 194,
            t.comboNumTxt.y = 19,
            t.comboNumTxt.setNum(99),
            t.comboTimeCnt = 0,
            t.comboFlg = !1,
            t._scoreRatio = 0,
            t._scoreCount = 0,
            t._highScore = 0,
            t._comboCount = 0,
            t._maxComb = 0,
            t._spgageCount = 0,
            t.spgageFlg = !1,
            t.spFireFlg = !1,
            t.scoreViewWrap = new PIXI.Container,
            t
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && _i(t, e)
        }(e, l),
        vi(e, null, [{
            key: "CUSTOM_EVENT_SP_FIRE",
            get: function() {
                return CUSTOM_EVENTS.SP_FIRE
            }
        }]),
        vi(e, [{
            key: "onKeyUp",
            value: function(t) {
                switch (t.keyCode) {
                case 32:
                    this.spgageFlg && this.spFire.bind(this)()
                }
                t.preventDefault()
            }
        }, {
            key: "scoreView",
            value: function(t) {
                var e = new zo(t.score,this._scoreRatio);
                this.scoreViewWrap.addChild(e),
                e.x = Math.floor(t.unit.x + t.unit.width / 2 - e.width / 2),
                e.y = Math.floor(t.unit.y + t.unit.height / 2 - e.height),
                TweenMax.to(e, .8, {
                    y: e.y - 20,
                    onComplete: function() {
                        this.scoreViewWrap.removeChild(e)
                    },
                    onCompleteScope: this
                })
            }
        }, {
            key: "loop",
            value: function() {
                this.comboTimeCnt -= .1,
                this.comboTimeCnt <= 0 && (this.comboTimeCnt = 0,
                1 == this.comboFlg && (this.comboCount = 0,
                this.comboFlg = !1)),
                this.comboBar.scale.x = this.comboTimeCnt / 100
            }
        }, {
            key: "spPrepareOk",
            value: function() {
                var t = new TimelineMax;
                t.to(this.hpBar, .1, {
                    tint: 16711680,
                    ease: Linear.easeNone
                }),
                t.to(this.hpBar, .4, {
                    tint: 16777215,
                    ease: Linear.easeNone
                }),
                this.spgageFlg = !0
            }
        }, {
            key: "spFire",
            value: function() {
                this.spgageFlg && (g.play("se_sp"),
                this.spgageCount = 0,
                this.spgageFlg = !1,
                this.spgaBtn.spFire(),
                this.emit(e.CUSTOM_EVENT_SP_FIRE))
            }
        }, {
            key: "onDamage",
            value: function(t) {
                TweenMax.to(this.hpBar.scale, .5, {
                    x: t
                });
                var e = new TimelineMax;
                e.to(this.hudDamageBg, .1, {
                    alpha: 1
                }),
                e.to(this.hudDamageBg, .1, {
                    alpha: 0
                }, "+=0.1"),
                e.to(this.hudDamageBg, .1, {
                    alpha: 1
                }, "+=0.1"),
                e.to(this.hudDamageBg, .1, {
                    alpha: 0
                }, "+=0.1"),
                e.to(this.hpBar, .1, {
                    tint: 16711680,
                    ease: Linear.easeNone
                }, "-=0.7"),
                e.to(this.hpBar, .4, {
                    tint: 16777215,
                    ease: Linear.easeNone
                }, "-=0.6")
            }
        }, {
            key: "recovery",
            value: function(t) {
                TweenMax.to(this.hpBar.scale, 1, {
                    x: t
                })
            }
        }, {
            key: "spBtnActive",
            value: function() {
                this.spgaBtn.onActive(),
                this.spgaBtn.on("pointerup", this.spFire.bind(this)),
                document.addEventListener("keyup", this.onKeyUpListener)
            }
        }, {
            key: "spBtnDeactive",
            value: function() {
                arguments.length > 0 && void 0 !== arguments[0] && arguments[0] && (this.spgaBtn.isClear = !0),
                this.spgaBtn.onDeactive(),
                this.spgaBtn.off("pointerup", this.spFire.bind(this)),
                document.removeEventListener("keyup", this.onKeyUpListener)
            }
        }, {
            key: "setPercent",
            value: function(t) {
                this.hpBar.scale.x = t
            }
        }, {
            key: "castAdded",
            value: function(t) {
                this.spgageFlg = !1,
                this.spFireFlg = !1,
                this.comboTimeCnt = 0,
                this.addChild(this.hudBg),
                this.addChild(this.hudDamageBg),
                this.addChild(this.hpBar),
                this.addChild(this.spgaBtn),
                this.addChild(this.scoreTitleTxt),
                this.addChild(this.scoreNumTxt),
                this.addChild(this.comboBar),
                this.addChild(this.comboNumTxt),
                this.addChildAt(this.scoreViewWrap, 5),
                this.onKeyUpListener = this.onKeyUp.bind(this)
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                this.removeChild(this.hudBg),
                this.removeChild(this.hudDamageBg),
                this.removeChild(this.hpBar),
                this.removeChild(this.spgaBtn),
                this.removeChild(this.scoreTitleTxt),
                this.removeChild(this.scoreNumTxt),
                this.removeChild(this.comboBar),
                this.removeChild(this.comboNumTxt),
                this.removeChild(this.scoreViewWrap),
                this.onKeyUpListener = null
            }
        }, {
            key: "spgageCount",
            get: function() {
                return this._spgageCount
            },
            set: function(t) {
                this.spFireFlg || (0 == t ? this._spgageCount = t : this._spgageCount += t,
                this._spgageCount >= 100 && (this._spgageCount = 100,
                this.spgageFlg || (this.spPrepareOk(),
                this.spgageFlg)),
                this.spgaBtn.setPercent(this._spgageCount / 100))
            }
        }, {
            key: "scoreCount",
            get: function() {
                return this._scoreCount
            },
            set: function(t) {
                this._scoreRatio = Math.ceil(this._comboCount / 10),
                this._scoreRatio <= 1 && (this._scoreRatio = 1),
                0 == t ? this._scoreCount = t : this._scoreCount += t * this._scoreRatio,
                this.scoreNumTxt.setNum(this._scoreCount),
                this._highScore < this._scoreCount && (this._highScore = this._scoreCount)
            }
        }, {
            key: "highScore",
            get: function() {
                return this._highScore
            },
            set: function(t) {
                this._highScore = t
            }
        }, {
            key: "comboCount",
            get: function() {
                return this._comboCount
            },
            set: function(t) {
                0 == t ? this._comboCount = 0 : (this.comboTimeCnt = 100,
                this._comboCount += t,
                this.comboFlg = !0),
                this.comboNumTxt.setNum(this._comboCount),
                this._comboCount >= this._maxComb && (this._maxComb = this._comboCount)
            }
        }, {
            key: "maxCombCount",
            get: function() {
                return this._maxComb
            },
            set: function(t) {
                this._maxComb = t
            }
        }]),
        e
    }();
    function xi(t) {
        return (xi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ti(t, e) {
        return !e || "object" !== xi(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Si(t) {
        return (Si = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Ci(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function ki(t, e, o) {
        return e && Ci(t.prototype, e),
        o && Ci(t, o),
        t
    }
    function Ii(t, e) {
        return (Ii = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Oi = function(t) {
        function e() {
            var t;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Ti(this, Si(e).call(this))).interactive = !1,
            t.buttonMode = !1,
            t.gameStartBg = new PIXI.Graphics,
            t.gameStartBg.beginFill(16777215, .2),
            t.gameStartBg.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.gameStartBg.visible = !1,
            t.gameStartBg.alpha = 0,
            t.stageNumList = [];
            for (var o = 0; o < 4; o++) {
                var n = PIXI.Texture.fromFrame("stageNum" + String(o + 1) + ".gif");
                n.scaleMode = PIXI.SCALE_MODES.NEAREST,
                t.stageNumList[o] = n
            }
            t.stageNum = new PIXI.Sprite,
            t.stageNum.x = 0,
            t.stageNum.y = i.GAME_HEIGHT / 2 - 20,
            t.stageNum.visible = !1;
            var a = PIXI.Texture.fromFrame("stageFight.gif");
            return a.scaleMode = PIXI.SCALE_MODES.NEAREST,
            t.stageFight = new PIXI.Sprite(a),
            t.stageFight.x = t.stageFight.width / 2,
            t.stageFight.y = i.GAME_HEIGHT / 2 + t.stageFight.height / 2 - 20,
            t.stageFight.visible = !1,
            t.stageFight.anchor.set(.5),
            t.stageClearBg = new PIXI.Graphics,
            t.stageClearBg.beginFill(16777215, .4),
            t.stageClearBg.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.stageClearBg.visible = !1,
            t.stageClearBg.alpha = 0,
            t.stageClearText = new PIXI.Sprite(PIXI.Texture.fromFrame("stageclear.gif")),
            t.stageClearText.x = i.GAME_WIDTH / 2 - t.stageClearText.width / 2,
            t.stageClearText.y = i.GAME_HEIGHT / 2 - t.stageClearText.height,
            t.stageTimeoverBg = new PIXI.Graphics,
            t.stageTimeoverBg.beginFill(16777215, .4),
            t.stageTimeoverBg.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.stageTimeoverBg.visible = !1,
            t.stageTimeoverBg.alpha = 0,
            t.stageTimeoverText = new PIXI.Sprite(PIXI.Texture.fromFrame("stageTimeover.gif")),
            t.stageTimeoverText.x = i.GAME_WIDTH / 2 - t.stageTimeoverText.width / 2,
            t.stageTimeoverText.y = i.GAME_HEIGHT / 2 - t.stageTimeoverText.height,
            t.knockoutK = new PIXI.Sprite(PIXI.Texture.fromFrame("knockoutK.gif")),
            t.knockoutK.x = i.GAME_CENTER - t.knockoutK.width / 2,
            t.knockoutK.y = i.GAME_MIDDLE,
            t.knockoutK.anchor.set(.5),
            t.knockoutK.visible = !1,
            t.knockoutO = new PIXI.Sprite(PIXI.Texture.fromFrame("knockoutO.gif")),
            t.knockoutO.x = i.GAME_CENTER + t.knockoutO.width / 2,
            t.knockoutO.y = i.GAME_MIDDLE,
            t.knockoutO.anchor.set(.5),
            t.knockoutO.visible = !1,
            t
        }
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Ii(t, e)
        }(e, l),
        ki(e, null, [{
            key: "EVENT_START",
            get: function() {
                return CUSTOM_EVENTS.EVENT_START
            }
        }, {
            key: "EVENT_RESTART",
            get: function() {
                return CUSTOM_EVENTS.EVENT_RESTART
            }
        }]),
        ki(e, [{
            key: "gameStart",
            value: function(t) {
                var o, n, a = !1;
                4 == t ? (n = 3,
                a = !0,
                (o = new PIXI.Graphics).beginFill(0, 1),
                o.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
                this.addChild(o),
                g.play("voice_another_fighter")) : n = t,
                this.gameStartBg.visible = !0,
                this.stageNum.texture = this.stageNumList[n],
                this.stageNum.visible = !0,
                this.stageNum.alpha = 0,
                this.stageFight.visible = !0,
                this.stageFight.alpha = 0,
                this.stageFight.scale.set(1.2);
                var s = new TimelineMax({
                    onComplete: function() {
                        this.gameStartBg.visible = !1,
                        this.emit(e.EVENT_START)
                    }
                    .bind(this)
                });
                a && s.to(o, .3, {
                    alpha: 0
                }, "+=3"),
                s.to(this.gameStartBg, .3, {
                    alpha: 1
                }),
                s.addCallback(function() {
                    g.play(["voice_round" + n])
                }, "+=0", null, this),
                s.to(this.stageNum, .3, {
                    alpha: 1
                }),
                s.to(this.stageNum, .1, {
                    delay: 1,
                    alpha: 0
                }),
                s.to(this.stageFight, .2, {
                    alpha: 1
                }, "-=0.1"),
                s.to(this.stageFight.scale, .2, {
                    x: 1,
                    y: 1
                }, "-=0.2"),
                s.addCallback(function() {
                    g.play("voice_fight")
                }, "+=0", null, this),
                s.to(this.stageFight.scale, .2, {
                    x: 1.5,
                    y: 1.5
                }, "+=0.4"),
                s.to(this.stageFight, .2, {
                    alpha: 0
                }, "-=0.2"),
                s.to(this.gameStartBg, .2, {
                    alpha: 0
                }, "-=0.1")
            }
        }, {
            key: "akebonofinish",
            value: function() {
                this.knockoutK.visible = !0,
                this.knockoutK.scale.set(0),
                this.knockoutO.visible = !0,
                this.knockoutO.scale.set(0);
                var t = new TimelineMax;
                t.to(this.knockoutK.scale, .4, {
                    x: 1,
                    y: 1,
                    ease: Back.easeOut
                }),
                t.to(this.knockoutO.scale, .4, {
                    x: 1,
                    y: 1,
                    ease: Back.easeOut
                }, "-=0.25"),
                g.play("voice_ko"),
                g.play("se_finish_akebono")
            }
        }, {
            key: "stageClear",
            value: function() {
                this.stageClearBg.visible = !0,
                TweenMax.to(this.stageClearBg, .5, {
                    delay: .3,
                    alpha: 1
                })
            }
        }, {
            key: "timeover",
            value: function() {
                this.stageTimeoverBg.visible = !0,
                TweenMax.to(this.stageTimeoverBg, .5, {
                    delay: .3,
                    alpha: 1
                })
            }
        }, {
            key: "onRestart",
            value: function(t) {
                TweenMax.to(this.gameOverBg, .5, {
                    alpha: 0,
                    onComplete: function() {
                        this.gameOverBg.visible = !1
                    }
                    .bind(this)
                }),
                this.emit(e.EVENT_RESTART)
            }
        }, {
            key: "castAdded",
            value: function(t) {
                this.addChild(this.gameStartBg),
                this.gameStartBg.addChild(this.stageNum),
                this.gameStartBg.addChild(this.stageFight),
                this.addChild(this.stageClearBg),
                this.stageClearBg.addChild(this.stageClearText),
                this.addChild(this.stageTimeoverBg),
                this.stageTimeoverBg.addChild(this.stageTimeoverText),
                this.addChild(this.knockoutK),
                this.addChild(this.knockoutO)
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                this.removeChild(this.gameStartBg),
                this.gameStartBg.removeChild(this.stageNum),
                this.gameStartBg.removeChild(this.stageFight),
                this.removeChild(this.stageClearBg),
                this.stageClearBg.removeChild(this.stageClearText),
                this.removeChild(this.stageTimeoverBg),
                this.stageTimeoverBg.removeChild(this.stageTimeoverText),
                this.removeChild(this.knockoutK),
                this.removeChild(this.knockoutO)
            }
        }]),
        e
    }();
    function Ei(t) {
        return (Ei = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Pi(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Ai(t, e) {
        return !e || "object" !== Ei(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Mi(t) {
        return (Mi = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Di(t, e) {
        return (Di = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    // StageBg
    var Bi = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = Ai(this, Mi(e).call(this))).allStagebgTexturesList = t,
            o.bg,
            o.scrollAmount = 0,
            o.scrollCount = 0,
            o.moveFlg = !1,
            o.bossAppearFlg = !1,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Di(t, e)
        }(e, l),
        o = e,
        (n = [{
            key: "init",
            value: function(t) {
                this.moveFlg = !0,
                this.bossAppearFlg = !1,
                this.scrollAmount = 0;
                var e = this.allStagebgTexturesList[t][1]
                  , o = this.allStagebgTexturesList[t][0];
                // background tiled sprite
                this.bg = new PIXI.extras.TilingSprite(e),
                this.bg.width = i.GAME_WIDTH,
                this.bg.height = i.GAME_HEIGHT,
                this.addChild(this.bg),
                // background static sprite
                this.bgEnd = new PIXI.Sprite(o),
                this.bgEnd.y = -this.bgEnd.height,
                this.addChild(this.bgEnd);
                var n = [];
                n[0] = PIXI.Texture.fromFrame("akebonoBg0.gif"),
                n[1] = PIXI.Texture.fromFrame("akebonoBg1.gif"),
                n[2] = PIXI.Texture.fromFrame("akebonoBg2.gif"),
                this.akebonoBg = new PIXI.extras.AnimatedSprite(n),
                this.akebonoBg.animationSpeed = .7
            }
        }, {
            key: "loop",
            value: function(t) {
                // updates the position of the background based on the scroll amount
                this.scrollAmount = t,
                this.moveFlg && (this.bg.tilePosition.y += this.scrollAmount),
                this.bossAppearFlg && (this.scrollCount += t,
                this.bg.y += this.scrollAmount,
                this.bgEnd.y += this.scrollAmount,
                this.scrollAmount >= 214 && (this.scrollAmount = 0),
                this.bgEnd.y >= 42 && (this.bossAppearFlg = !1))
            }
        }, {
            key: "bossScene",
            value: function() {
                this.moveFlg = !1,
                this.bossAppearFlg = !0
            }
        }, {
            key: "akebonofinish",
            value: function() {
                this.akebonoBg.play(),
                this.addChild(this.akebonoBg)
            }
        }, {
            key: "akebonoGokifinish",
            value: function() {
                this.akebonoBg.play(),
                this.addChild(this.akebonoBg),
                this.akebonoTen = new PIXI.Sprite(PIXI.Texture.fromFrame("akebonoTen.gif")),
                this.akebonoTen.anchor.set(.5),
                this.akebonoTen.x = 27 + this.akebonoTen.width / 2,
                this.akebonoTen.y = 113 + this.akebonoTen.height / 2,
                this.akebonoTen.scale.set(1.2),
                this.addChild(this.akebonoTen),
                this.akebonoTenShock = new PIXI.Sprite(PIXI.Texture.fromFrame("akebonoTen.gif")),
                this.akebonoTenShock.anchor.set(.5),
                this.akebonoTenShock.x = 27 + this.akebonoTenShock.width / 2,
                this.akebonoTenShock.y = 113 + this.akebonoTenShock.height / 2,
                this.akebonoTenShock.alpha = 0,
                this.addChild(this.akebonoTenShock);
                var t = new TimelineMax;
                t.to(this.akebonoTen.scale, .3, {
                    x: 1,
                    y: 1,
                    ease: Quint.easeIn
                }),
                t.to(this.akebonoTenShock, .001, {
                    alpha: 1
                }),
                t.to(this.akebonoTenShock, .6, {
                    alpha: 0,
                    ease: Quint.easeOut
                }),
                t.to(this.akebonoTenShock.scale, .4, {
                    x: 1.5,
                    y: 1.5,
                    ease: Quint.easeOut
                }, "-=0.6"),
                t.to(this.akebonoTen, .3, {
                    alpha: 0,
                    ease: Quint.easeOut
                })
            }
        }, {
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {
                this.akebonoBg && (this.akebonoBg.destroy(),
                this.removeChild(this.akebonoBg)),
                this.akebonoTen && (this.removeChild(this.akebonoTen),
                this.removeChild(this.akebonoTenShock)),
                this.removeChild(this.bg),
                this.removeChild(this.bgEnd)
            }
        }]) && Pi(o.prototype, n),
        a && Pi(o, a),
        e
    }();
    function Fi(t) {
        return (Fi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Ri(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Gi(t, e) {
        return !e || "object" !== Fi(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function ji(t) {
        return (ji = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Xi(t, e) {
        return (Xi = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Hi = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = Gi(this, ji(e).call(this))).cutinBg = new PIXI.Graphics,
            t.cutinBg.beginFill(0, .9),
            t.cutinBg.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.addChild(t.cutinBg),
            t.cutin = new PIXI.Sprite,
            t.cutin.y = i.GAME_HEIGHT / 2 - 71,
            t.addChild(t.cutin),
            t.flash = new PIXI.Graphics,
            t.flash.beginFill(15658734, 1),
            t.flash.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
            t.addChild(t.flash),
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Xi(t, e)
        }(e, l),
        o = e,
        (n = [{
            key: "start",
            value: function() {
                this.cutinBg.alpha = 0,
                this.flash.alpha = 0,
                this.cutin.texture = null,
                (new TimelineMax).to(this.cutinBg, .25, {
                    alpha: 1
                }).call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin0.gif")
                }, null, this, "+=0.00").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin1.gif")
                }, null, this, "+=0.08").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin2.gif")
                }, null, this, "+=0.08").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin3.gif")
                }, null, this, "+=0.08").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin4.gif")
                }, null, this, "+=0.08").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin5.gif")
                }, null, this, "+=0.08").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin6.gif")
                }, null, this, "+=0.3").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin7.gif")
                }, null, this, "+=0.1").call(function() {
                    this.cutin.texture = PIXI.Texture.fromFrame("cutin8.gif")
                }, null, this, "+=0.1").to(this.flash, .3, {
                    delay: .3,
                    alpha: 1
                })
            }
        }, {
            key: "castAdded",
            value: function(t) {}
        }, {
            key: "castRemoved",
            value: function(t) {}
        }]) && Ri(o.prototype, n),
        a && Ri(o, a),
        e
    }();
    function Ni(t) {
        return (Ni = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Li(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Wi(t, e, o) {
        return (Wi = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ui(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Ui(t) {
        return (Ui = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Vi(t, e) {
        return (Vi = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    function Yi(t) {
        if (void 0 === t)
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return t
    }
    var Ki = function(t) {
        function e(t) {
            // GameScene init
            var o, n, a;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            n = this,
            // the Ui function returns the prototype of the object passed as an argument
            // the Ni function returns the type of the value passed as an argument, with special handling for Symbol instances
            (o = !(a = Ui(e).call(this)) || "object" !== Ni(a) && "function" != typeof a ? Yi(n) : a).waveInterval = 80,
            o.waveCount,
            o.frameCnt,
            o.frameCntUp = 1,
            o.stageBgAmountMove = .7,
            o.enemyWaveFlg = !1,
            o.theWorldFlg = !1,
            o.sceneSwitch = 0,
            o.enemyHitTestList,
            o.itemHitTestList,
            o.explosionTextures = [];
            for (var s = 0; s < 7; s++) {
                var r = PIXI.Texture.fromFrame("explosion0" + s + ".gif");
                o.explosionTextures[s] = r
            }
            o.spExplosionTextures = [];
            for (var h = 0; h < 8; h++) {
                var l = PIXI.Texture.fromFrame("spExplosion0" + h + ".gif");
                o.spExplosionTextures[h] = l
            }
            o.itemTextureList = {},
            o.itemTextureList.powerupBig = [PIXI.Texture.fromFrame("powerupBig0.gif"), PIXI.Texture.fromFrame("powerupBig1.gif")],
            o.itemTextureList.powerup3way = [PIXI.Texture.fromFrame("powerup3way0.gif"), PIXI.Texture.fromFrame("powerup3way1.gif")],
            o.itemTextureList.barrier = [PIXI.Texture.fromFrame("barrierItem0.gif"), PIXI.Texture.fromFrame("barrierItem1.gif")],
            o.itemTextureList.speedup = [PIXI.Texture.fromFrame("speedupItem0.gif"), PIXI.Texture.fromFrame("speedupItem1.gif")];
            for (var u = [], c = 0; c < 5; c++) {
                var f = [];
                f[0] = new PIXI.Texture.fromImage(B.resource["stage_end" + c].url),
                f[1] = new PIXI.Texture.fromImage(B.resource["stage_loop" + c].url),
                u.push(f)
            }
            o.stageBg = new Bi(u),
            o.addChildAt(o.stageBg, 0);
            // Normalize legacy recipe keys before gameplay objects are instantiated.
            var p = B.resource.recipe.data;
            if (p.enemyData)
                for (var d0 in p.enemyData)
                    if (Object.prototype.hasOwnProperty.call(p.enemyData, d0)) {
                        var v = p.enemyData[d0];
                        v && void 0 === v.projectileData && (v.projectileData = void 0 !== v.bulletData ? v.bulletData : null)
                    }
            if (p.bossData)
                for (var y0 in p.bossData)
                    if (Object.prototype.hasOwnProperty.call(p.bossData, y0)) {
                        var m0 = p.bossData[y0];
                        m0 && (void 0 === m0.projectileData && (m0.projectileData = void 0 !== m0.bulletData ? m0.bulletData : null),
                        void 0 === m0.projectileDataA && (m0.projectileDataA = m0.bulletDataA),
                        void 0 === m0.projectileDataB && (m0.projectileDataB = m0.bulletDataB),
                        void 0 === m0.projectileDataC && (m0.projectileDataC = m0.bulletDataC))
                    }
            // Set up player
            var d = p.playerData;
            return d.explosion = o.explosionTextures,
            o.player = new M(d),
            o.player.on(M.CUSTOM_EVENT_DEAD, o.gameover.bind(Yi(Yi(o)))),
            o.player.on(M.CUSTOM_EVENT_DEAD_COMPLETE, o.gameoverComplete.bind(Yi(Yi(o)))),
            D.player = o.player,
            // Set up containers
            o.unitContainer = new PIXI.Container,
            o.addChildAt(o.unitContainer, 1),
            o.bulletContainer = new PIXI.Container,
            o.addChildAt(o.bulletContainer, 2),
            // Set up HUD
            o.hud = new wi,
            o.hud.on(wi.CUSTOM_EVENT_SP_FIRE, o.spFire.bind(Yi(Yi(o)))),
            o.addChildAt(o.hud, 3),
            // Set up title screen
            o.title = new Oi,
            o.title.on(Oi.EVENT_START, o.gameStart.bind(Yi(Yi(o)))),
            o.addChildAt(o.title, 4),
            // Set up cutin container
            o.cutinCont = new Hi,
            // Set up ca line
            o.spLine = new PIXI.Graphics,
            o.spLine.beginFill(16711680),
            o.spLine.drawRect(0, 0, 3, 3),
            o.spLine.pivot.y = 3,
            o.spLine.endFill(),
            // Set up cover
            o.cover = new PIXI.extras.TilingSprite(PIXI.Texture.fromFrame("stagebgOver.gif"),i.STAGE_WIDTH,i.STAGE_HEIGHT),
            o.addChildAt(o.cover, 4),
            // Set up boss
            o.boss,
            o.bossTimerCountDown = 99,
            o.bossTimerFrameCnt = 0,
            o.bossTimerStartFlg = !1,
            o
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            // creates a new object with N.prototype as prototype, constructor property set to e
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Vi(t, e)
        // N is the superclass e inherits from
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {
                // GameScene update
                if (Wi(Ui(e.prototype), "loop", this).call(this),
                !this.theWorldFlg) {
                    this.player.loop(),
                    this.hud.loop();
                    for (var t = 0; t < this.enemyHitTestList.length; t++) {
                        var o = this.enemyHitTestList[t];
                        o.loop(this.stageBgAmountMove);
                        var n = -o.unit.width / 2
                          , a = i.GAME_WIDTH - o.unit.width / 2;
                        if (o.unit.y >= 40 && o.unit.x >= n && o.unit.x <= a)
                            for (var s = 0; s < this.player.bulletList.length; s++) {
                                var r = this.player.bulletList[s];
                                if (B.Manager.interact.hitTestRectangle(o.unit, r.unit))
                                    switch (this.player.shootMode) {
                                    case M.SHOOT_NAME_NORMAL:
                                        o.onDamage(r.damage),
                                        r.onDamage(1, o.hp);
                                        break;
                                    case M.SHOOT_NAME_BIG:
                                        null == o["bulletid" + r.id] ? (o["bulletid" + r.id] = 0,
                                        o["bulletframeCnt" + r.id] = 0,
                                        o.onDamage(r.damage),
                                        r.onDamage(1, o.hp)) : (o["bulletframeCnt" + r.id]++,
                                        o["bulletframeCnt" + r.id] % 15 == 0 && (o["bulletid" + r.id]++,
                                        o["bulletid" + r.id] <= 1 && (o.onDamage(r.damage),
                                        r.onDamage(1, o.hp))));
                                        break;
                                    case M.SHOOT_NAME_3WAY:
                                        o.onDamage(r.damage),
                                        r.onDamage(1, o.hp);
                                        break;
                                    default:
                                        o.onDamage(1),
                                        r.onDamage(1, o.hp)
                                    }
                            }
                        if (this.player.barrierFlg)
                            B.Manager.interact.hitTestRectangle(o.unit, this.player.barrier) && (this.player.barrierHitEffect(),
                            o.dead());
                        else if (B.Manager.interact.hitTestRectangle(o.unit, this.player.unit))
                            if ("goki" == o.name) {
                                this.hud.spBtnDeactive(),
                                this.theWorldFlg = !0,
                                this.boss && this.boss.onTheWorld(this.theWorldFlg),
                                this.boss.shungokusatsu(this.player.unit, !0),
                                this.player.alpha = 0,
                                this.hud.spgaBtn.alpha = 0;
                                for (var h = 0; h < this.player.bulletList.length; h++) {
                                    var l = this.player.bulletList[h];
                                    this.player.removeChild(l)
                                }
                                TweenMax.delayedCall(1.8, function() {
                                    this.player.alpha = 1
                                }, null, this),
                                TweenMax.delayedCall(1.9, function() {
                                    this.stageBg.akebonoGokifinish()
                                }, null, this),
                                TweenMax.delayedCall(2.7, function() {
                                    this.playerDamage(100)
                                }, null, this),
                                TweenMax.delayedCall(3, function() {
                                    this.title.akebonofinish()
                                }, null, this)
                            } else
                                this.playerDamage(1);
                        (o.unit.x <= -50 || o.unit.x >= i.GAME_WIDTH + 33 || o.unit.y <= -33 || o.unit.y >= i.GAME_HEIGHT) && BOSS_STATES.UNIT_NAME !== o.unit.name && (this.unitContainer.removeChild(o),
                        this.enemyHitTestList.splice(t, 1))
                    }
                    for (var u = 0; u < this.itemHitTestList.length; u++) {
                        var c = this.itemHitTestList[u];
                        if (c.y += 1,
                        B.Manager.interact.hitTestRectangle(c, this.player.unit)) {
                            switch (c.name) {
                            case M.SHOOT_SPEED_HIGH:
                                D.shootSpeed = c.name,
                                this.player.shootSpeedChange(D.shootSpeed);
                                break;
                            case M.BARRIER:
                                this.player.barrierStart();
                                break;
                            default:
                                this.player.shootMode !== c.name && (D.shootSpeed = M.SHOOT_SPEED_NORMAL,
                                this.player.shootSpeedChange(D.shootSpeed)),
                                D.shootMode = c.name,
                                this.player.shootModeChange(D.shootMode)
                            }
                            this.unitContainer.removeChild(c),
                            this.itemHitTestList.splice(u, 1)
                        }
                        c.y >= i.GAME_HEIGHT - 10 && (this.unitContainer.removeChild(c),
                        this.itemHitTestList.splice(u, 1))
                    }
                    this.stageBg.loop(this.stageBgAmountMove),
                    this.enemyWaveFlg && (this.frameCnt % this.waveInterval == 0 && this.enemyWave(),
                    this.frameCnt += this.frameCntUp),
                    this.bossTimerStartFlg && (this.bossTimerFrameCnt % 60 == 0 && (this.bossTimerCountDown <= 0 && (this.bossTimerStartFlg = !1,
                    this.timeoverComplete.bind(this)()),
                    this.bigNumTxt.setNum(this.bossTimerCountDown),
                    this.bossTimerCountDown--),
                    this.bossTimerFrameCnt++)
                }
            }
        }, {
            key: "enemyWave",
            value: function() {
                this.waveCount >= this.stageEnemyPositionList.length ? this.bossAdd() : this.enemyAdd()
            }
        }, {
            key: "enemyAdd",
            value: function() {
                for (var t = this.stageEnemyPositionList[this.waveCount], e = 0; e < t.length; e++) {
                    var o = t[e];
                    if ("00" !== o) {
                        var i = String(o).substr(0, 1)
                          , n = String(o).substr(1, 2)
                          , a = B.resource.recipe.data.enemyData["enemy" + i];
                        switch (a.explosion = this.explosionTextures,
                        n) {
                        case "1":
                            a.itemName = M.SHOOT_NAME_BIG,
                            a.itemTexture = this.itemTextureList.powerupBig;
                            break;
                        case "2":
                            a.itemName = M.SHOOT_NAME_3WAY,
                            a.itemTexture = this.itemTextureList.powerup3way;
                            break;
                        case "3":
                            a.itemName = M.SHOOT_SPEED_HIGH,
                            a.itemTexture = this.itemTextureList.speedup;
                            break;
                        case "9":
                            a.itemName = M.BARRIER,
                            a.itemTexture = this.itemTextureList.barrier;
                            break;
                        default:
                            a.itemName = null,
                            a.itemTexture = null
                        }
                        var s = new Ye(a);
                        s.unit.x = 32 * e,
                        s.unit.y = -32,
                        s.on(Ye.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, s)),
                        s.on(Ye.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, s)),
                        s.on(Ye.CUSTOM_EVENT_PROJECTILE_ADD, this.projectileAdd.bind(this, s)),
                        this.unitContainer.addChild(s),
                        this.enemyHitTestList.push(s)
                    }
                }
                this.waveCount++
            }
        }, {
            key: "projectileAdd",
            value: function(t) {
                if (!t || !t.projectileData)
                    return;
                switch (t.projectileData.name) {
                case "beam":
                    for (var e = 0; e < 2; e++) {
                        var o = 0 == e ? 121 : 141
                          , n = new S(t.projectileData)
                          , a = n.character.width
                          , s = n.character.height
                          , r = void 0;
                        switch (t.projectileData.cnt) {
                        case 0:
                            r = 105,
                            n.unit.hitArea = new PIXI.Rectangle(2.7 * -s,a / 2 - 10,s,a / 2);
                            break;
                        case 1:
                            r = 90,
                            n.unit.hitArea = new PIXI.Rectangle(-s,a / 2,s,a / 2);
                            break;
                        case 2:
                            r = 75,
                            n.unit.hitArea = new PIXI.Rectangle(.7 * s,a / 2 - 5,s,a / 2)
                        }
                        n.character.rotation = r * Math.PI / 180,
                        n.rotX = Math.cos(r * Math.PI / 180),
                        n.rotY = Math.sin(r * Math.PI / 180),
                        n.unit.x = t.unit.x + o,
                        n.unit.y = t.unit.y + 50,
                        n.on(S.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, n)),
                        n.on(S.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, n)),
                        this.unitContainer.addChild(n),
                        this.enemyHitTestList.push(n)
                    }
                    t.projectileData.cnt >= 2 ? t.projectileData.cnt = 0 : t.projectileData.cnt++;
                    break;
                case "smoke":
                    var h = 60 * Math.random() + 60
                      , l = new S(t.projectileData);
                    l.unit.hitArea = new PIXI.Rectangle(20,20,l.character.width - 40,l.character.height - 40),
                    l.rotX = Math.cos(h * Math.PI / 180),
                    l.rotY = Math.sin(h * Math.PI / 180),
                    l.unit.x = t.unit.x + t.unit.width / 2 - 50,
                    l.unit.y = t.unit.y + 45,
                    l.on(S.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, l)),
                    l.on(S.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, l)),
                    l.character.loop = !1,
                    l.character.onComplete = function() {
                        l.character.gotoAndPlay(6)
                    }
                    .bind(this),
                    this.unitContainer.addChild(l),
                    this.enemyHitTestList.push(l);
                    break;
                case "meka":
                    for (var u = 0; u < 32; u++) {
                        var c = new S(t.projectileData);
                        c.cont = 0,
                        c.start = 10 * u,
                        c.player = this.player.unit,
                        c.unit.x = t.unit.hitArea.x + t.unit.hitArea.width / 2,
                        c.unit.y = t.unit.hitArea.y + t.unit.hitArea.height,
                        c.unit.scale.set(0);
                        var f = Math.random() * (i.GAME_WIDTH - 2 * t.unit.hitArea.x)
                          , d = Math.random() * t.unit.hitArea.height + t.unit.hitArea.y;
                        TweenMax.to(c.unit, .3, {
                            x: f,
                            y: d
                        }),
                        TweenMax.to(c.unit.scale, .3, {
                            x: 1,
                            y: 1
                        }),
                        c.on(S.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, c)),
                        c.on(S.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, c)),
                        this.unitContainer.addChild(c),
                        this.enemyHitTestList.push(c)
                    }
                    break;
                case "psychoField":
                    for (var p = 0; p < 72; p++) {
                        var m = new S(t.projectileData);
                        m.rotX = Math.cos(p / 72 * 360 * Math.PI / 180),
                        m.rotY = Math.sin(p / 72 * 360 * Math.PI / 180),
                        m.unit.x = 50 * m.rotX + t.unit.x + t.unit.hitArea.width / 2 + m.unit.width / 2,
                        m.unit.y = 50 * m.rotY + t.unit.y + t.unit.hitArea.height / 2,
                        m.on(S.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, m)),
                        m.on(S.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, m)),
                        this.unitContainer.addChild(m),
                        this.enemyHitTestList.push(m)
                    }
                    break;
                default:
                    var y = new S(t.projectileData);
                    y.unit.x = t.unit.x + t.unit.width / 2 - y.unit.width / 2,
                    y.unit.y = t.unit.y + t.unit.hitArea.height / 2,
                    y.on(S.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this, y)),
                    y.on(S.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this, y)),
                    this.unitContainer.addChild(y),
                    this.enemyHitTestList.push(y)
                }
            }
        }, {
            key: "projectileAllRemove",
            value: function() {}
        }, {
            key: "enemyRemove",
            value: function(t) {
                if (this.hud.comboCount = 1,
                this.hud.scoreCount = t.score,
                this.hud.spgageCount = t.spgage,
                this.hud.scoreView(t),
                t.itemName) {
                    var e = new Xe(t.itemTexture);
                    e.x = t.unit.x,
                    e.y = t.unit.y,
                    e.name = t.itemName,
                    this.unitContainer.addChild(e),
                    this.itemHitTestList.push(e)
                }
                for (var o = 0; o < this.enemyHitTestList.length; o++)
                    t == this.enemyHitTestList[o] && this.enemyHitTestList.splice(o, 1)
            }
        }, {
            key: "enemyRemoveComplete",
            value: function(t) {
                t.off(Ye.CUSTOM_EVENT_DEAD, this.enemyRemove.bind(this)),
                t.off(Ye.CUSTOM_EVENT_DEAD_COMPLETE, this.enemyRemoveComplete.bind(this)),
                t.off(Ye.CUSTOM_EVENT_PROJECTILE_ADD, this.projectileAdd.bind(this)),
                this.unitContainer.removeChild(t)
            }
        }, {
            key: "bossAdd",
            value: function() {
                if (3 == D.stageId && 0 == D.continueCnt) {
                    (o = B.resource.recipe.data.bossData["boss" + D.stageId]).explosion = this.explosionTextures,
                    o.gokiFlg = !0,
                    o.continueCnt = D.continueCnt;
                    var t = new Eo(o);
                    t.on(Eo.CUSTOM_EVENT_GOKI, function e() {
                        this.theWorldFlg = !0,
                        this.hud.spBtnDeactive();
                        for (var o = 0; o < this.player.bulletList.length; o++) {
                            var n = this.player.bulletList[o];
                            this.player.bulletRemove(n),
                            this.player.bulletRemoveComplete(n)
                        }
                        this.boss.toujou();
                        var a = new TimelineMax;
                        a.to(this.boss.unit, 1, {
                            x: i.GAME_CENTER + this.boss.width / 4
                        }),
                        a.addCallback(function() {
                            this.boss.shungokusatsu(t.unit),
                            this.hud.spgaBtn.alpha = 0,
                            this.player.alpha = 0;
                            for (var e = 0; e < this.player.bulletList.length; e++) {
                                var o = this.player.bulletList[e];
                                this.player.removeChild(o)
                            }
                        }, "+=1.5", null, this),
                        a.addCallback(function() {
                            this.hud.spgaBtn.alpha = 1,
                            this.player.alpha = 1,
                            t.off(Eo.CUSTOM_EVENT_GOKI, e.bind(this)),
                            t.hp = 0,
                            t.dead();
                            for (var o = 0; o < this.enemyHitTestList.length; o++)
                                this.enemyHitTestList[o] == t && this.enemyHitTestList.splice(o, 1);
                            g.stop(this.stageBgmName);
                            var n = "boss_" + B.resource.recipe.data.bossData.bossExtra.name + "_bgm_info";
                            this.stageBgmName = i[n].name;
                            var a = i[n].start
                              , s = i[n].end;
                            g.bgmPlay(this.stageBgmName, a, s)
                        }, "+=2.3", null, this),
                        a.to(this.boss.unit, 1, {
                            x: i.GAME_CENTER - this.boss.width / 2
                        }, "+=1.5"),
                        a.addCallback(function() {
                            this.unitContainer.removeChild(t),
                            this.enemyHitTestList.push(this.boss),
                            this.theWorldFlg = !1,
                            this.hud.spBtnActive(),
                            this.boss.shootStart()
                        }, "+=1", null, this)
                    }
                    .bind(this)),
                    this.enemyHitTestList.push(t),
                    this.unitContainer.addChild(t);
                    var e = B.resource.recipe.data.bossData.bossExtra;
                    e.explosion = this.explosionTextures,
                    e.continueCnt = D.continueCnt,
                    this.boss = new Ro(e),
                    this.boss.on(Ze.CUSTOM_EVENT_DEAD, this.bossRemove.bind(this, this.boss)),
                    this.boss.on(Ze.CUSTOM_EVENT_PROJECTILE_ADD, this.projectileAdd.bind(this, this.boss)),
                    this.unitContainer.addChild(this.boss),
                    this.boss.unit.x = i.GAME_WIDTH,
                    this.boss.unit.y = i.GAME_HEIGHT / 4
                } else {
                    var o;
                    switch ((o = B.resource.recipe.data.bossData["boss" + D.stageId]).explosion = this.explosionTextures,
                    D.stageId) {
                    case 0:
                        this.boss = new so(o);
                        break;
                    case 1:
                        this.boss = new po(o);
                        break;
                    case 2:
                        this.boss = new wo(o);
                        break;
                    case 3:
                        o.gokiFlg = !1,
                        this.boss = new Eo(o);
                        break;
                    case 4:
                        this.boss = new Wo(o)
                    }
                    this.boss.on(Ze.CUSTOM_EVENT_DEAD, this.bossRemove.bind(this, this.boss)),
                    this.boss.on(Ze.CUSTOM_EVENT_PROJECTILE_ADD, this.projectileAdd.bind(this, this.boss)),
                    this.enemyHitTestList.push(this.boss),
                    this.unitContainer.addChild(this.boss)
                }
                this.timeTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("timeTxt.gif")),
                this.timeTxt.x = i.GAME_CENTER - this.timeTxt.width,
                this.timeTxt.y = 58,
                this.timeTxt.alpha = 0,
                this.unitContainer.addChild(this.timeTxt),
                this.bigNumTxt = new qt(2),
                this.bigNumTxt.x = this.timeTxt.x + this.timeTxt.width + 3,
                this.bigNumTxt.y = this.timeTxt.y - 2,
                this.bigNumTxt.setNum(99),
                this.bigNumTxt.alpha = 0,
                this.unitContainer.addChild(this.bigNumTxt),
                TweenMax.to([this.bigNumTxt, this.timeTxt], .2, {
                    delay: 6,
                    alpha: 1,
                    onComplete: function() {
                        this.bossTimerCountDown = 99,
                        this.bossTimerFrameCnt = 0,
                        this.bossTimerStartFlg = !0
                    },
                    onCompleteScope: this
                }),
                this.enemyWaveFlg = !1,
                this.stageBg.bossScene()
            }
        }, {
            key: "bossRemove",
            value: function(t) {
                this.theWorldFlg = !0,
                this.hud.comboCount = 1,
                this.hud.scoreCount = t.score,
                this.hud.spgageCount = t.spgage,
                this.hud.scoreView(t),
                this.hud.spBtnDeactive();
                for (var e = 0; e < this.player.bulletList.length; e++) {
                    var o = this.player.bulletList[e];
                    this.player.removeChild(o)
                }
                this.enemyHitTestList = [],
                this.player.bulletList = [],
                TweenMax.delayedCall(2.5, function() {
                    this.stageClear()
                }, null, this),
                this.hud.spFireFlg ? (this.stageBg.akebonofinish(),
                this.title.akebonofinish(),
                D.akebonoCnt++) : this.title.stageClear()
            }
        }, {
            key: "playerDamage",
            value: function(t) {
                (new TimelineMax).call(function() {
                    this.x = 4,
                    this.y = -2
                }, null, this, "+=0.0").call(function() {
                    this.x = -3,
                    this.y = 1
                }, null, this, "+=0.08").call(function() {
                    this.x = 2,
                    this.y = -1
                }, null, this, "+=0.07").call(function() {
                    this.x = -2,
                    this.y = 1
                }, null, this, "+=0.05").call(function() {
                    this.x = 1,
                    this.y = 1
                }, null, this, "+=0.05").call(function() {
                    this.x = 0,
                    this.y = 0
                }, null, this, "+=0.04"),
                this.player.onDamage(t),
                this.hud.onDamage(this.player.percent)
            }
        }, {
            key: "comboReset",
            value: function() {
                this.hud.comboCount = 0
            }
        }, {
            key: "spFire",
            value: function() {
                this.theWorldFlg = !0,
                this.hud.spFireFlg = !0,
                this.boss && this.boss.onTheWorld(this.theWorldFlg),
                this.addChild(this.cutinCont),
                this.cutinCont.start(),
                this.spLine.x = this.player.unit.x + 12,
                this.spLine.y = this.player.unit.y + 5,
                this.unitContainer.addChild(this.spLine);
                for (var t = 0; t < this.player.bulletList.length; t++) {
                    var e = this.player.bulletList[t];
                    this.player.bulletRemove(e),
                    this.player.bulletRemoveComplete(e)
                }
                var o = new TimelineMax;
                o.call(function() {
                    g.play("g_sp_voice")
                }, null, this, "+=0.2"),
                o.call(function() {
                    this.removeChild(this.cutinCont)
                }, null, this, "+=1.7"),
                o.to(this.spLine, .3, {
                    height: i.GAME_HEIGHT
                }),
                o.to(this.spLine, .3, {
                    y: 0,
                    height: 0
                }).call(function() {
                    for (var t = this, e = 0, o = 0, n = function(n) {
                        n % 8 == 0 && (e = o % 2 == 0 ? -30 : -45,
                        o++);
                        var a = new PIXI.extras.AnimatedSprite(t.spExplosionTextures);
                        a.animationSpeed = .2,
                        a.loop = !1,
                        a.x = e,
                        a.y = i.GAME_HEIGHT - 45 * o - 120,
                        a.onComplete = function(t) {
                            t.destroy(),
                            this.unitContainer.removeChild(t)
                        }
                        .bind(t, a),
                        e += 30,
                        TweenMax.delayedCall(.01 * n, function() {
                            this.unitContainer.addChild(a),
                            a.play(),
                            n % 16 == 0 && g.play("se_sp_explosion")
                        }, null, t)
                    }, a = 0; a < 64; a++)
                        n(a)
                }, null, this, "-=0.1").call(function() {
                    var t = this
                      , e = this.enemyHitTestList.slice();
                    if (e.length >= 100)
                        for (var o = 0; o < e.length; o++) {
                            var n = e[o];
                            n.unit.x >= -n.unit.width / 2 && n.unit.x <= i.GAME_WIDTH && n.unit.y >= 20 && n.unit.y <= i.GAME_HEIGHT && n.onDamage(D.spDamage)
                        }
                    else
                        for (var a = function(o) {
                            var n = e[o];
                            n.unit.x >= -n.unit.width / 2 && n.unit.x <= i.GAME_WIDTH && n.unit.y >= 20 && n.unit.y <= i.GAME_HEIGHT && TweenMax.delayedCall(.005 * o, function() {
                                n.onDamage(D.spDamage)
                            }, null, t)
                        }, s = 0; s < e.length; s++)
                            a(s)
                }, null, this, "+=0.8").call(function() {
                    this.unitContainer.removeChild(this.spLine),
                    this.theWorldFlg = !1,
                    this.hud.spFireFlg = !1,
                    this.boss && (this.boss.hp <= 0 ? this.theWorldFlg = !0 : this.boss.onTheWorld(this.theWorldFlg))
                }, null, this, "+=0.7")
            }
        }, {
            key: "run",
            value: function() {
                // GameScene create
                F.dlog("run");
                var t = "boss_" + B.resource.recipe.data.bossData["boss" + D.stageId].name + "_bgm_info";
                this.stageBgmName = i[t].name;
                var e = i[t].start
                  , o = i[t].end;
                4 == D.stageId ? TweenMax.delayedCall(3, function(t) {
                    g.bgmPlay(this.stageBgmName, e, o)
                }, null, this) : g.bgmPlay(this.stageBgmName, e, o),
                this.title.gameStart(D.stageId),
                this.stageBg.init(D.stageId),
                this.hud.spBtnDeactive(),
                TweenMax.delayedCall(2.6, function() {
                    g.play(["g_stage_voice_" + String(D.stageId)]),
                    this.hud.spBtnActive()
                }
                .bind(this));
                var n = B.resource.recipe.data["stage" + D.stageId].enemylist.slice();
                this.stageEnemyPositionList = n.reverse(),
                "true" == D.shortFlg && (this.stageEnemyPositionList = [],
                this.stageEnemyPositionList.push(["00", "00", "A1", "A2", "A9", "00", "00", "00"]),
                this.stageEnemyPositionList.push(["00", "00", "A3", "A3", "00", "00", "00", "00"])),
                this.player.setUp(D.playerMaxHp, D.shootMode, D.shootSpeed),
                this.player.unit.x = i.GAME_WIDTH / 2 - this.player.unit.width / 2,
                this.player.unit.y = i.GAME_HEIGHT - this.player.unit.height - 30,
                this.player.unitX = i.GAME_WIDTH / 2,
                this.player.unitY = this.player.unit.y,
                this.addChildAt(this.player, 2),
                this.hud.setPercent(this.player.percent),
                this.hud.scoreCount = D.score,
                this.hud.highScore = D.highScore,
                this.hud.comboCount = D.combo,
                this.hud.maxCombo = D.maxCombo,
                this.hud.spgageCount = D.spgage,
                this.hud.comboTimeCnt = 0,
                D.combo = 0,
                this.enemyWaveFlg = !1,
                this.theWorldFlg = !1,
                this.waveCount = 0,
                this.waveInterval = 80,
                this.frameCnt = 0,
                this.frameCntUp = 1,
                this.enemyHitTestList = [],
                this.itemHitTestList = []
            }
        }, {
            key: "stageClear",
            value: function() {
                F.dlog("GameScene.stageClear()"),
                this.theWorldFlg = !0,
                D.playerHp = this.player.hp,
                D.spgage = this.hud.spgageCount,
                D.score = this.hud.scoreCount,
                this.hud.spBtnDeactive(!0),
                D.stageId++,
                this.sceneSwitch = 1,
                this.player.shootStop(),
                TweenMax.delayedCall(2.3, function() {
                    B.Manager.game.stage.removeChild(B.Scene)
                }
                .bind(this))
            }
        }, {
            key: "gameover",
            value: function() {
                F.dlog("GameScene.gameOver()"),
                this.theWorldFlg = !0,
                D.score = this.hud.scoreCount,
                this.hud.spBtnDeactive(),
                this.boss && this.boss.onTheWorld(!0)
            }
        }, {
            key: "gameoverComplete",
            value: function() {
                this.boss && this.boss.onTheWorld(!0),
                this.removeChild(this.player),
                TweenMax.delayedCall(2, function() {
                    B.Manager.game.stage.removeChild(B.Scene)
                }
                .bind(this))
            }
        }, {
            key: "timeoverComplete",
            value: function() {
                this.title.timeover(),
                this.theWorldFlg = !0,
                D.score = this.hud.scoreCount,
                this.hud.spBtnDeactive(),
                this.boss && this.boss.onTheWorld(!0),
                TweenMax.delayedCall(2.5, function() {
                    this.removeChild(this.player),
                    B.Manager.game.stage.removeChild(B.Scene)
                }
                .bind(this))
            }
        }, {
            key: "gameStart",
            value: function() {
                F.dlog("GameScene.gameStart()."),
                this.enemyWaveFlg = !0,
                this.player.shootStart()
            }
        }, {
            key: "sceneRemoved",
            value: function() {
                F.dlog("GameScene.sceneRemoved() Start."),
                Wi(Ui(e.prototype), "sceneRemoved", this).call(this);
                for (var t = 0; t < this.unitContainer.children.length; t++) {
                    var o = this.unitContainer.children[t];
                    this.unitContainer.removeChild(o)
                }
                for (var i = 0; i < this.bulletContainer.children.length; i++) {
                    var n = this.bulletContainer.children[i];
                    this.bulletContainer.removeChild(n)
                }
                g.stop(this.stageBgmName),
                1 === this.sceneSwitch ? B.Scene = new hn : B.Scene = new Be,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("GameScene.sceneRemoved() End.")
            }
        }]) && Li(o.prototype, n),
        a && Li(o, a),
        e
    }();
    function Qi(t) {
        return (Qi = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function zi(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function $i(t, e) {
        return !e || "object" !== Qi(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function qi(t, e, o) {
        return (qi = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ji(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Ji(t) {
        return (Ji = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Zi(t, e) {
        return (Zi = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var tn = function(t) {
        function e() {
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            $i(this, Ji(e).call(this))
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Zi(t, e)
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {}
        }, {
            key: "run",
            value: function() {
                var t = this
                  , e = [PIXI.Texture.fromFrame("congraBg0.gif"), PIXI.Texture.fromFrame("congraBg1.gif"), PIXI.Texture.fromFrame("congraBg2.gif")];
                this.bg = new PIXI.extras.AnimatedSprite(e),
                this.bg.animationSpeed = .1,
                this.bg.alpha = 0,
                this.bg.play(),
                this.addChild(this.bg),
                this.congraInfoBg = new PIXI.Sprite(PIXI.Texture.fromFrame("congraInfoBg.gif")),
                this.congraInfoBg.anchor.set(0, .5),
                this.congraInfoBg.x = 0,
                this.congraInfoBg.y = 210,
                this.congraInfoBg.alpha = 0,
                this.addChild(this.congraInfoBg);
                var o = [PIXI.Texture.fromFrame("congraTxt0.gif"), PIXI.Texture.fromFrame("congraTxt1.gif"), PIXI.Texture.fromFrame("congraTxt2.gif")];
                o[0].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                o[1].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                o[2].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST,
                this.congraTxt = new PIXI.extras.AnimatedSprite(o),
                this.congraTxt.animationSpeed = .2,
                this.congraTxt.anchor.set(.5),
                this.congraTxt.x = this.congraTxt.width / 2,
                this.congraTxt.y = 6 + this.congraTxt.height / 2,
                this.congraTxt.play(),
                this.addChild(this.congraTxt),
                this.congraTxtEffect = new PIXI.Sprite(o[0]),
                this.congraTxtEffect.anchor.set(.5),
                this.congraTxtEffect.visible = !1,
                this.addChild(this.congraTxtEffect),
                this.continueFlg = !1,
                D.score > D.highScore && (D.highScore = D.score,
                document.cookie = "afc2019_highScore=" + D.score + "; expires=Tue, 02 Apr 2019 7:00:00 UTC; secure;",
                this.continueNewrecord = new PIXI.Sprite(PIXI.Texture.fromFrame("continueNewrecord.gif")),
                this.continueNewrecord.x = 0,
                this.continueNewrecord.y = i.GAME_MIDDLE - 40,
                this.continueNewrecord.scale.set(1, 0),
                this.addChild(this.continueNewrecord),
                this.continueFlg = !0),
                this.scoreContainer = new PIXI.Container,
                this.scoreContainer.x = 32,
                this.scoreContainer.y = i.GAME_MIDDLE - 23,
                this.scoreContainer.scale.set(1, 0),
                this.addChild(this.scoreContainer),
                this.scoreTitleTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("scoreTxt.gif")),
                this.scoreTitleTxt.x = 0,
                this.scoreTitleTxt.y = 0,
                this.scoreContainer.addChild(this.scoreTitleTxt),
                this.bigNumTxt = new qt(10),
                this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3,
                this.bigNumTxt.y = this.scoreTitleTxt.y - 2,
                this.bigNumTxt.setNum(D.score),
                this.scoreContainer.addChild(this.bigNumTxt),
                this.twitterBtn = new Vt,
                this.twitterBtn.scale.set(0),
                this.twitterBtn.x = i.GAME_CENTER,
                this.twitterBtn.y = i.GAME_MIDDLE + 15,
                this.twitterBtn.on("pointerup", this.tweet.bind(this)),
                this.addChild(this.twitterBtn),
                this.gotoTitleBtn = new Ie,
                this.gotoTitleBtn.x = i.GAME_CENTER - this.gotoTitleBtn.width / 2,
                this.gotoTitleBtn.y = i.GAME_HEIGHT - this.gotoTitleBtn.height - 13,
                this.gotoTitleBtn.on("pointerup", function() {
                    t.nextSceneAnim()
                }),
                this.addChild(this.gotoTitleBtn);
                var n = new PIXI.filters.BlurFilter;
                this.bg.filters = [n],
                this.congraTxt.scale.set(5),
                this.congraTxt.x = i.GAME_WIDTH + this.congraTxt.width / 2,
                this.congraTxt.y = i.GAME_MIDDLE - 32;
                var a = new TimelineMax;
                a.to(this.congraTxt, 2.5, {
                    x: -(this.congraTxt.width - i.GAME_WIDTH),
                    ease: Linear.easeNone
                }),
                a.addCallback(function() {
                    g.play("voice_congra")
                }, "-=2.0", null, this),
                a.to(this.bg, .8, {
                    alpha: 1
                }, "-=0.3"),
                a.to(n, .8, {
                    blur: 0
                }, "-=0.8"),
                a.addCallback(function() {
                    g.play("se_sp"),
                    this.congraTxt.x = i.GAME_CENTER,
                    this.congraTxt.y = i.GAME_MIDDLE - 60,
                    this.congraTxtEffect.x = this.congraTxt.x,
                    this.congraTxtEffect.y = this.congraTxt.y,
                    this.congraTxt.scale.set(3)
                }, "+=0", null, this),
                a.to(this.congraTxt.scale, .5, {
                    x: 1,
                    y: 1,
                    ease: Expo.easeIn
                }),
                a.to(this.congraTxtEffect, 0, {
                    visible: !0
                }, "+=0.0"),
                a.to(this.congraTxtEffect.scale, 1, {
                    x: 1.5,
                    y: 1.5,
                    ease: Expo.easeOut
                }, "+=0.0"),
                a.to(this.congraTxtEffect, 1, {
                    alpha: 0,
                    ease: Expo.easeOut
                }, "-=1"),
                a.to(this.congraInfoBg, .3, {
                    alpha: 1
                }, "-=0.5"),
                this.continueFlg && a.to(this.continueNewrecord.scale, .5, {
                    y: 1,
                    ease: Elastic.easeOut
                }),
                a.to(this.scoreContainer.scale, .5, {
                    x: 1,
                    y: 1,
                    ease: Elastic.easeOut
                }, "-=0.25"),
                a.to(this.twitterBtn.scale, .5, {
                    x: 1,
                    y: 1,
                    ease: Elastic.easeOut
                }, "-=0.25")
            }
        }, {
            key: "nextSceneAnim",
            value: function(t) {
                this.gotoTitleBtn.off("pointerup"),
                this.gotoTitleBtn.interactive = !1,
                this.gotoTitleBtn.buttonMode = !1,
                TweenMax.to(this, 1.5, {
                    alpha: 0,
                    delay: .3,
                    onComplete: this.nextScene,
                    onCompleteScope: this
                })
            }
        }, {
            key: "tweet",
            value: function() {
                F.tweet(1)
            }
        }, {
            key: "sceneRemoved",
            value: function() {
                F.dlog("GameoverScene.sceneRemoved() Start."),
                qi(Ji(e.prototype), "sceneRemoved", this).call(this),
                B.Scene = new mn,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("GameoverScene.sceneRemoved() End.")
            }
        }]) && zi(o.prototype, n),
        a && zi(o, a),
        e
    }();
    function en(t) {
        return (en = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function on(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function nn(t, e) {
        return !e || "object" !== en(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function an(t, e, o) {
        return (an = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = sn(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function sn(t) {
        return (sn = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function rn(t, e) {
        return (rn = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var hn = function(t) {
        function e() {
            var t;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (t = nn(this, sn(e).call(this))).senario = "ja" == i.LANG ? Jt : Zt,
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && rn(t, e)
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {
                if (an(sn(e.prototype), "loop", this).call(this),
                D.frame % 2 == 0 && 0 == this.partTextComp) {
                    var t = this.txt.text
                      , o = t.length - 1;
                    o <= this.partText.length - 1 ? this.txt.text = t + this.partText.charAt(o) : (this.partTextComp = !0,
                    this.partNum < this.senario[this.stageKey].part.length - 1 ? (this.nextBtn.nextPart(),
                    this.nextBtn.visible = !0,
                    this.nextBtn.on("pointerup", this.nextPart.bind(this))) : (this.nextBtn.nextScene(),
                    this.nextBtn.visible = !0,
                    this.nextBtn.on("pointerup", this.nextScene.bind(this))))
                }
            }
        }, {
            key: "run",
            value: function() {
                g.bgmPlay("adventure_bgm", 24e3, 792e3),
                this.bgSprite = new PIXI.Sprite,
                this.bgSprite.visible = !1,
                this.addChild(this.bgSprite);
                var t = new PIXI.TextStyle({
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    fontWeight: "bold",
                    lineHeight: 20,
                    fill: 16777215,
                    wordWrap: !0,
                    wordWrapWidth: 230,
                    breakWords: !0,
                    padding: 10
                });
                this.txtBg = new PIXI.Graphics,
                this.txtBg.lineStyle(2, 16777215, 1),
                this.txtBg.beginFill(0),
                this.txtBg.drawRoundedRect(0, 0, i.GAME_WIDTH - 16, 180, 6),
                this.txtBg.endFill(),
                this.txtBg.x = 8,
                this.txtBg.y = i.GAME_MIDDLE + 7,
                this.addChild(this.txtBg),
                this.txt = new PIXI.Text(null,t),
                this.txt.x = 15,
                this.txt.y = i.GAME_MIDDLE + 30,
                this.txt.wordWrap = !0,
                this.txt.wordWrapWidth = 100,
                this.txt.breakWords = !0,
                this.addChild(this.txt),
                this.nameBg = new PIXI.Graphics,
                this.nameBg.lineStyle(2, 16777215, 1),
                this.nameBg.beginFill(0),
                this.nameBg.drawRoundedRect(0, 0, 80, 24, 6),
                this.nameBg.endFill(),
                this.nameBg.x = 16,
                this.nameBg.y = i.GAME_MIDDLE - 5,
                this.addChild(this.nameBg),
                this.nameTxt = new PIXI.Text("G",t),
                this.nameTxt.x = 50,
                this.nameTxt.y = i.GAME_MIDDLE - 4,
                this.addChild(this.nameTxt),
                this.nextBtn = new se,
                this.nextBtn.visible = !1,
                this.addChild(this.nextBtn),
                this.endingFlg = !1,
                5 == D.stageId ? this.endingFlg = !0 : 4 == D.stageId ? (g.play("voice_thankyou"),
                D.akebonoCnt >= 4 && 0 == D.continueCnt ? this.endingFlg = !1 : this.endingFlg = !0) : this.endingFlg = !1,
                this.partNum = 0,
                this.stageKey = "stage" + D.stageId,
                this.partText = this.senario[this.stageKey].part[this.partNum].text,
                this.feedVektor = "d",
                this.partTextComp = !1,
                this.resourceBgKey = "advBg" + this.senario[this.stageKey].part[this.partNum].background + ".gif",
                this.bgSprite.texture = new PIXI.Texture.fromImage(this.resourceBgKey),
                this.bgSprite.visible = !0,
                this.cover = new PIXI.extras.TilingSprite(PIXI.Texture.fromFrame("stagebgOver.gif"),i.STAGE_WIDTH,i.STAGE_HEIGHT - this.bgSprite.height),
                this.cover.y = this.bgSprite.height,
                this.addChild(this.cover)
            }
        }, {
            key: "nextPart",
            value: function() {
                g.play("se_cursor_sub"),
                this.txt.text = "",
                this.partTextComp = !1,
                this.partNum++,
                this.partText = this.senario[this.stageKey].part[this.partNum].text,
                this.resourceBgKey = "advBg" + this.senario[this.stageKey].part[this.partNum].background + ".gif",
                this.bgSprite.texture = new PIXI.Texture.fromImage(this.resourceBgKey),
                "advBgDone.gif" == this.resourceBgKey && g.play("g_adbenture_voice0"),
                this.nextBtn.visible = !1,
                this.nextBtn.off("pointerup")
            }
        }, {
            key: "sceneRemoved",
            value: function() {
                g.play("se_correct"),
                g.stop("adventure_bgm"),
                F.dlog("Adv.sceneRemoved() Start."),
                an(sn(e.prototype), "sceneRemoved", this).call(this),
                this.endingFlg ? B.Scene = new tn : B.Scene = new Ki,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("Adv.sceneRemoved() End.")
            }
        }]) && on(o.prototype, n),
        a && on(o, a),
        e
    }();
    function ln(t) {
        return (ln = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function un(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function cn(t, e) {
        return !e || "object" !== ln(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function fn(t, e, o) {
        return (fn = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = dn(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function dn(t) {
        return (dn = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function pn(t, e) {
        return (pn = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var mn = function(t) {
        function e() {
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            cn(this, dn(e).call(this))
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && pn(t, e)
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {
                fn(dn(e.prototype), "loop", this).call(this),
                this.bg.tilePosition.x += .5
            }
        }, {
            key: "run",
            value: function() {
                this.bg = new PIXI.extras.TilingSprite(new PIXI.Texture.fromImage("title_bg")),
                this.bg.width = i.GAME_WIDTH,
                this.bg.height = i.GAME_HEIGHT,
                this.addChild(this.bg),
                this.titleGWrap = new PIXI.Container,
                this.titleG = new PIXI.Sprite(PIXI.Texture.fromFrame("titleG.gif")),
                this.titleGWrap.addChild(this.titleG),
                this.addChild(this.titleGWrap),
                this.logo = new PIXI.Sprite(PIXI.Texture.fromFrame("logo.gif")),
                this.logo.anchor.set(.5),
                this.addChild(this.logo);
                var t = "subTitle" + ("ja" == i.LANG ? "" : "En") + ".gif";
                this.subTitle = new PIXI.Sprite(PIXI.Texture.fromFrame(t)),
                this.subTitle.anchor.set(.5),
                this.addChild(this.subTitle),
                this.belt = new PIXI.Graphics,
                this.belt.beginFill(0, 1),
                this.belt.drawRect(0, 0, i.GAME_WIDTH, 120),
                this.belt.y = i.GAME_HEIGHT - this.belt.height,
                this.addChild(this.belt),
                this.startBtn = new jt,
                this.startBtn.on("pointerup", this.titleStart.bind(this)),
                this.startBtn.interactive = !1,
                this.startBtn.alpha = 0,
                this.addChild(this.startBtn),
                this.copyright = new PIXI.Sprite(PIXI.Texture.fromFrame("titleCopyright.gif")),
                this.copyright.x = 0,
                this.copyright.y = i.GAME_HEIGHT - this.copyright.height - 6,
                this.addChild(this.copyright),
                this.scoreTitleTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("hiScoreTxt.gif")),
                this.scoreTitleTxt.x = 32,
                this.scoreTitleTxt.y = this.copyright.y - 66,
                this.addChild(this.scoreTitleTxt),
                this.bigNumTxt = new qt(10),
                this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3,
                this.bigNumTxt.y = this.scoreTitleTxt.y - 2,
                this.bigNumTxt.setNum(D.highScore),
                this.addChild(this.bigNumTxt),
                this.twitterBtn = new Vt,
                this.twitterBtn.x = i.GAME_CENTER,
                this.twitterBtn.y = this.copyright.y - this.twitterBtn.height / 2 - 14,
                this.twitterBtn.on("pointerup", this.tweet.bind(this)),
                this.addChild(this.twitterBtn),
                this.howtoBtn = new et,
                this.howtoBtn.x = 15,
                this.howtoBtn.y = 10,
                this.howtoBtn.scale.y = 0,
                this.howtoBtn.on("pointerup", function() {}
                .bind(this)),
                this.addChild(this.howtoBtn),
                this.staffrollPanel = new At,
                this.staffrollBtn = new ht,
                this.staffrollBtn.x = i.GAME_WIDTH - this.staffrollBtn.width - 15,
                this.staffrollBtn.y = 10,
                this.staffrollBtn.scale.y = 0,
                this.staffrollBtn.on("pointerup", function() {
                    this.addChild(this.staffrollPanel)
                }
                .bind(this)),
                this.addChild(this.staffrollBtn),
                this.cover = new PIXI.extras.TilingSprite(PIXI.Texture.fromFrame("stagebgOver.gif"),i.STAGE_WIDTH,i.STAGE_HEIGHT),
                this.addChild(this.cover),
                this.fadeOutBlack = new PIXI.Graphics,
                this.fadeOutBlack.beginFill(0),
                this.fadeOutBlack.drawRect(0, 0, i.GAME_WIDTH, i.GAME_HEIGHT),
                this.fadeOutBlack.endFill(),
                this.fadeOutBlack.alpha = 0,
                this.addChild(this.fadeOutBlack),
                this.titleGWrap.x = i.GAME_WIDTH,
                this.titleGWrap.y = 100,
                this.logo.x = this.logo.width / 2,
                this.logo.scale.set(2),
                this.logo.y = -this.logo.height / 2,
                this.subTitle.x = this.subTitle.width / 2,
                this.subTitle.scale.set(3),
                this.subTitle.y = -this.logo.height / 2;
                var e = new TimelineMax({
                    onComplete: function() {},
                    onCompleteScope: this
                });
                e.to(this.titleGWrap, 2, {
                    x: i.GAME_WIDTH / 2 - this.titleG.width / 2 + 5,
                    y: 20,
                    ease: Quint.easeOut
                }, "+=0.0"),
                e.addCallback(function() {}, "-=0.1", null, this),
                e.to(this.logo, .9, {
                    y: 75,
                    ease: Quint.easeIn
                }, "-=0.8"),
                e.to(this.logo.scale, .9, {
                    x: 1,
                    y: 1,
                    ease: Quint.easeIn
                }, "-=0.9"),
                e.to(this.subTitle, .9, {
                    y: 130,
                    ease: Quint.easeIn
                }, "-=0.82"),
                e.to(this.subTitle.scale, .9, {
                    x: 1,
                    y: 1,
                    ease: Quint.easeIn
                }, "-=0.9"),
                e.addCallback(function() {
                    g.play("voice_titlecall")
                }, "-=0.5", null, this),
                e.to(this.startBtn, .1, {
                    alpha: 1
                }),
                e.addCallback(function() {
                    this.startBtn.interactive = !0,
                    this.startBtn.onFlash.bind(this.startBtn)()
                }, "+=0.3", null, this),
                e.to(this.howtoBtn.scale, .3, {
                    y: 1,
                    ease: Elastic.easeOut
                }, "+=0.2"),
                e.to(this.staffrollBtn.scale, .3, {
                    y: 1,
                    ease: Elastic.easeOut
                }, "-=0.15")
            }
        }, {
            key: "tweet",
            value: function(t) {
                F.tweet(0)
            }
        }, {
            key: "titleStart",
            value: function(t) {
                this.startBtn.off("pointerup", this.titleStart.bind(this)),
                this.startBtn.interactive = !1,
                this.startBtn.buttonMode = !1,
                TweenMax.to(this.fadeOutBlack, 1, {
                    alpha: 1,
                    onComplete: this.nextScene,
                    onCompleteScope: this
                })
            }
        }, {
            key: "sceneRemoved",
            value: function() {
                F.dlog("TitleScene.sceneRemoved() Start."),
                fn(dn(e.prototype), "sceneRemoved", this).call(this),
                D.spDamage = B.resource.recipe.data.playerData.spDamage,
                D.playerMaxHp = B.resource.recipe.data.playerData.maxHp,
                D.playerHp = D.playerMaxHp,
                D.shootMode = B.resource.recipe.data.playerData.defaultShootName,
                D.shootSpeed = B.resource.recipe.data.playerData.defaultShootSpeed,
                D.combo = 0,
                D.maxCombo = 0,
                D.score = 0,
                D.spgage = 0,
                D.stageId = 0,
                D.continueCnt = 0,
                D.akebonoCnt = 0,
                D.shortFlg = !1,
                B.Scene = new hn,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("TitleScene.sceneRemoved() End.")
            }
        }]) && un(o.prototype, n),
        a && un(o, a),
        e
    }();
    function yn(t) {
        return (yn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function gn(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function bn(t, e) {
        return !e || "object" !== yn(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function vn(t, e, o) {
        return (vn = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = _n(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function _n(t) {
        return (_n = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function wn(t, e) {
        return (wn = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var xn = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = bn(this, _n(e).call(this))).textureDefault = PIXI.Texture.fromFrame(t[0]),
            o.textureDown = PIXI.Texture.fromFrame(t[1]),
            o.texture = o.textureDefault,
            o.interactive = !0,
            o.buttonMode = !0,
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && wn(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                this.alpha = .7
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.alpha = 1,
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {}
        }, {
            key: "castAdded",
            value: function(t) {
                vn(_n(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                vn(_n(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && gn(o.prototype, i),
        n && gn(o, n),
        e
    }();
    function Tn(t) {
        return (Tn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function Sn(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Cn(t, e) {
        return !e || "object" !== Tn(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function kn(t, e, o) {
        return (kn = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = In(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function In(t) {
        return (In = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function On(t, e) {
        return (On = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var En = function(t) {
        function e(t) {
            var o;
            return function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            (o = Cn(this, In(e).call(this))).textureDefault = PIXI.Texture.fromFrame(t[0]),
            o.textureDown = PIXI.Texture.fromFrame(t[1]),
            o.texture = o.textureDefault,
            o.interactive = !0,
            o.buttonMode = !0,
            o
        }
        var o, i, n;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && On(t, e)
        }(e, K),
        o = e,
        (i = [{
            key: "onOver",
            value: function(t) {
                this.alpha = .7
            }
        }, {
            key: "onOut",
            value: function(t) {
                this.alpha = 1,
                this.texture = this.textureDefault
            }
        }, {
            key: "onDown",
            value: function(t) {
                this.texture = this.textureDown
            }
        }, {
            key: "onUp",
            value: function(t) {}
        }, {
            key: "castAdded",
            value: function(t) {
                kn(In(e.prototype), "castAdded", this).call(this),
                this.on("pointerover", this.onOver.bind(this)),
                this.on("pointerout", this.onOut.bind(this)),
                this.on("pointerdown", this.onDown.bind(this)),
                this.on("pointerupoutside", this.onOut.bind(this)),
                this.on("pointerup", this.onUp.bind(this))
            }
        }, {
            key: "castRemoved",
            value: function(t) {
                kn(In(e.prototype), "castRemoved", this).call(this),
                this.off("pointerover", this.onOver.bind(this)),
                this.off("pointerout", this.onOut.bind(this)),
                this.off("pointerdown", this.onDown.bind(this)),
                this.off("pointerupoutside", this.onOut.bind(this)),
                this.off("pointerup", this.onUp.bind(this))
            }
        }]) && Sn(o.prototype, i),
        n && Sn(o, n),
        e
    }();
    function Pn(t) {
        return (Pn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
        : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        }
        )(t)
    }
    function An(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    function Mn(t, e) {
        return !e || "object" !== Pn(e) && "function" != typeof e ? function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }
    function Dn(t, e, o) {
        return (Dn = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, o) {
            var i = function(t, e) {
                for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Bn(t)); )
                    ;
                return t
            }(t, e);
            if (i) {
                var n = Object.getOwnPropertyDescriptor(i, e);
                return n.get ? n.get.call(o) : n.value
            }
        }
        )(t, e, o || t)
    }
    function Bn(t) {
        return (Bn = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        }
        )(t)
    }
    function Fn(t, e) {
        return (Fn = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e,
            t
        }
        )(t, e)
    }
    var Rn = function(t) {
        function e() {
            var t;
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, e),
            t = Mn(this, Bn(e).call(this));
            var o = [new PIXI.Texture.fromImage(D.baseUrl + "assets/img/loading/loading0.gif"), new PIXI.Texture.fromImage(D.baseUrl + "assets/img/loading/loading1.gif"), new PIXI.Texture.fromImage(D.baseUrl + "assets/img/loading/loading2.gif")];
            return t.loadingG = new PIXI.extras.AnimatedSprite(o),
            t.loadingG.x = i.GAME_CENTER - 64,
            t.loadingG.y = i.GAME_MIDDLE - 64,
            t.loadingG.animationSpeed = .15,
            t.loadingTexture = new PIXI.Texture.fromImage(D.baseUrl + "assets/img/loading/loading_bg.png"),
            t.loadingBg = new PIXI.Sprite(t.loadingTexture),
            t.loadingBg.alpha = .09,
            t.loadingBgFlipCnt = 0,
            document.cookie.split(";").forEach(function(t) {
                var e = t.split("=");
                "afc2019_highScore" == e[0] && (D.highScore = e[1])
            }),
            t
        }
        var o, n, a;
        return function(t, e) {
            if ("function" != typeof e && null !== e)
                throw new TypeError("Super expression must either be null or a function");
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    writable: !0,
                    configurable: !0
                }
            }),
            e && Fn(t, e)
        }(e, N),
        o = e,
        (n = [{
            key: "loop",
            value: function() {
                Dn(Bn(e.prototype), "loop", this).call(this),
                this.loadingBgFlipCnt++,
                this.loadingBgFlipCnt % 6 == 0 && ("ura" == this.loadingBg.name ? (this.loadingBg.name = "omote",
                this.loadingTexture.rotate = 0) : (this.loadingBg.name = "ura",
                this.loadingTexture.rotate = 8))
            }
        }, {
            key: "run",
            value: function() {
                var t = this
                  , e = new PIXI.loaders.Loader;
                e.add("title_ui", D.baseUrl + "assets/title_ui.json"),
                e.on("complete", function(e, o) {
                    e.destroy(),
                    t.modeTitle = new PIXI.Sprite(PIXI.Texture.fromFrame("modeSelectTxt.gif")),
                    t.modeTitle.x = 44,
                    t.modeTitle.y = 83,
                    t.addChild(t.modeTitle),
                    t.playPcBtn = new xn(["playBtnPc0.gif", "playBtnPc1.gif"]),
                    t.playPcBtn.x = 44,
                    t.playPcBtn.y = t.modeTitle.y + t.modeTitle.height + 40,
                    t.playPcBtn.on("pointerup", t.loadStart.bind(t, !1)),
                    t.addChild(t.playPcBtn),
                    t.playPcTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("playBtnPcTxt.gif")),
                    t.playPcTxt.x = 44,
                    t.playPcTxt.y = t.playPcBtn.y + t.playPcBtn.height + 2,
                    t.addChild(t.playPcTxt),
                    t.playSpBtn = new xn(["playBtnSp0.gif", "playBtnSp1.gif"]),
                    t.playSpBtn.x = 44,
                    t.playSpBtn.y = t.playPcTxt.y + 20,
                    t.playSpBtn.on("pointerup", t.loadStart.bind(t, !0)),
                    t.addChild(t.playSpBtn),
                    t.playSpTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("playBtnSpTxt.gif")),
                    t.playSpTxt.x = 44,
                    t.playSpTxt.y = t.playSpBtn.y + t.playSpBtn.height + 2,
                    t.addChild(t.playSpTxt),
                    t.recommendBtn = new En(["recommendBtn0" + ("ja" == i.LANG ? "" : "_en") + ".gif", "recommendBtn1" + ("ja" == i.LANG ? "" : "_en") + ".gif"]),
                    t.recommendBtn.on("pointerup", t.recommendModalOpen.bind(t, !0)),
                    t.recommendBtn.buttonMode = !0,
                    t.recommendBtn.interactive = !0,
                    t.recommendBtn.x = 40,
                    t.recommendBtn.y = t.playSpTxt.y + 100,
                    t.addChild(t.recommendBtn);
                    var n = PIXI.Texture.fromFrame("recommendModal" + ("ja" == i.LANG ? "" : "_en") + ".gif");
                    t.recommendModal = new PIXI.Sprite(n),
                    t.recommendModal.x = t.recommendModal.width / 2 + 7,
                    t.recommendModal.y = t.recommendModal.height / 2 + 26,
                    t.recommendModal.interactive = !0,
                    t.addChild(t.recommendModal),
                    t.recommendModalCloseBtn = new PIXI.Sprite(PIXI.Texture.fromFrame("recommendModalCloseBtn.gif")),
                    t.recommendModalCloseBtn.x = t.recommendModal.width / 2 - t.recommendModalCloseBtn.width - 2,
                    t.recommendModalCloseBtn.y = -t.recommendModal.height / 2 + 2,
                    t.recommendModalCloseBtn.on("pointerup", t.recommendModalClose.bind(t, !0)),
                    t.recommendModalCloseBtn.buttonMode = !0,
                    t.recommendModalCloseBtn.interactive = !0,
                    t.recommendModal.addChild(t.recommendModalCloseBtn),
                    t.recommendModal.visible = !1,
                    t.recommendModal.anchor.set(.5),
                    t.recommendModal.scale.set(0, 0)
                }),
                e.load()
            }
        }, {
            key: "recommendModalOpen",
            value: function() {
                this.recommendModal.visible = !0,
                this.recommendModal.scale.x = .05,
                TweenMax.to(this.recommendModal.scale, .15, {
                    y: 1,
                    delay: 0,
                    ease: Quint.easeOut
                }),
                TweenMax.to(this.recommendModal.scale, .15, {
                    x: 1,
                    delay: .12,
                    ease: Back.easeOut
                })
            }
        }, {
            key: "recommendModalClose",
            value: function() {
                this.recommendModal.visible = !1,
                this.recommendModal.scale.set(0, 0)
            }
        }, {
            key: "loadStart",
            value: function(t) {
                var e = this;
                D.lowModeFlg = t,
                this.removeChild(this.modeTitle),
                this.removeChild(this.playPcBtn),
                this.removeChild(this.playSpBtn),
                this.removeChild(this.playPcTxt),
                this.removeChild(this.playSpTxt),
                this.removeChild(this.recommendModal),
                this.removeChild(this.recommendBtn),
                this.recommendModal.removeChild(this.recommendModalCloseBtn),
                this.addChild(this.loadingBg),
                this.loadingG.play(),
                this.addChild(this.loadingG);
                var o = new PIXI.loaders.Loader;
                for (var n in i.RESOURCE)
                    D.lowModeFlg ? i.RESOURCE[n].indexOf(".mp3") <= 0 && o.add(n, D.baseUrl + i.RESOURCE[n]) : o.add(n, D.baseUrl + i.RESOURCE[n]);
                o.on("progress", function(t, e) {
                    F.dlog("Resource Loading:" + t.progress + "%")
                }),
                o.on("complete", function(t, o) {
                    if (t.destroy(),
                    B.resource = o,
                    !D.lowModeFlg) {
                        for (var n in i.RESOURCE)
                            B.resource[n].sound && (g[n] = B.resource[n].sound);
                        g.voice_titlecall.volume = .7,
                        g.se_decision.volume = .75,
                        g.se_correct.volume = .9,
                        g.se_cursor_sub.volume = .9,
                        g.se_cursor.volume = .9,
                        g.se_over.volume = .9,
                        g.adventure_bgm.volume = .2,
                        g.g_adbenture_voice0.volume = .5,
                        g.voice_thankyou.volume = .7,
                        g.se_explosion.volume = .35,
                        g.se_shoot.volume = .3,
                        g.se_shoot_b.volume = .3,
                        g.se_sp.volume = .8,
                        g.se_sp_explosion.volume = .9,
                        g.se_damage.volume = .15,
                        g.se_guard.volume = .2,
                        g.se_finish_akebono.volume = .9,
                        g.se_barrier_start.volume = .9,
                        g.se_barrier_end.volume = .9,
                        g.voice_round0.volume = .7,
                        g.voice_round1.volume = .7,
                        g.voice_round2.volume = .7,
                        g.voice_round3.volume = .7,
                        g.voice_fight.volume = .7,
                        g.voice_ko.volume = .7,
                        g.voice_another_fighter.volume = .7,
                        g.g_stage_voice_0.volume = .55,
                        g.g_stage_voice_1.volume = .7,
                        g.g_stage_voice_2.volume = .45,
                        g.g_stage_voice_3.volume = .45,
                        g.g_stage_voice_4.volume = .55,
                        g.g_damage_voice.volume = .7,
                        g.g_powerup_voice.volume = .55,
                        g.g_sp_voice.volume = .7,
                        g.boss_bison_bgm.volume = .4,
                        g.boss_bison_voice_add.volume = .65,
                        g.boss_bison_voice_ko.volume = .9,
                        g.boss_bison_voice_faint.volume = .55,
                        g.boss_bison_voice_faint_punch.volume = .65,
                        g.boss_bison_voice_punch.volume = .65,
                        g.boss_barlog_bgm.volume = .4,
                        g.boss_barlog_voice_add.volume = .7,
                        g.boss_barlog_voice_ko.volume = .9,
                        g.boss_barlog_voice_projectile.volume = .6,
                        g.boss_barlog_voice_barcelona.volume = .7,
                        g.boss_sagat_bgm.volume = .4,
                        g.boss_sagat_voice_add.volume = .9,
                        g.boss_sagat_voice_ko.volume = .9,
                        g.boss_sagat_voice_projectile0.volume = .45,
                        g.boss_sagat_voice_projectile1.volume = .65,
                        g.boss_sagat_voice_kick.volume = .65,
                        g.boss_vega_bgm.volume = .3,
                        g.boss_vega_voice_add.volume = .7,
                        g.boss_vega_voice_ko.volume = .9,
                        g.boss_vega_voice_crusher.volume = .7,
                        g.boss_vega_voice_warp.volume = .7,
                        g.boss_vega_voice_projectile.volume = .7,
                        g.boss_vega_voice_shoot.volume = .7,
                        g.boss_goki_bgm.volume = .4,
                        g.boss_goki_voice_add.volume = .7,
                        g.boss_goki_voice_ko.volume = .9,
                        g.boss_goki_voice_projectile0.volume = .7,
                        g.boss_goki_voice_projectile1.volume = .7,
                        g.boss_goki_voice_ashura.volume = .7,
                        g.boss_goki_voice_syungokusatu0.volume = .7,
                        g.boss_goki_voice_syungokusatu1.volume = .7,
                        g.boss_fang_bgm.volume = .4,
                        g.boss_fang_voice_add.volume = .6,
                        g.boss_fang_voice_ko.volume = .9,
                        g.boss_fang_voice_beam0.volume = .6,
                        g.boss_fang_voice_beam1.volume = .6,
                        g.boss_fang_voice_projectile.volume = .6,
                        g.bgm_continue.volume = .25,
                        g.bgm_gameover.volume = .3,
                        g.voice_countdown0.volume = .7,
                        g.voice_countdown1.volume = .7,
                        g.voice_countdown2.volume = .7,
                        g.voice_countdown3.volume = .7,
                        g.voice_countdown4.volume = .7,
                        g.voice_countdown5.volume = .7,
                        g.voice_countdown6.volume = .7,
                        g.voice_countdown7.volume = .7,
                        g.voice_countdown8.volume = .7,
                        g.voice_countdown9.volume = .7,
                        g.voice_gameover.volume = .7,
                        g.g_continue_yes_voice0.volume = .7,
                        g.g_continue_yes_voice1.volume = .7,
                        g.g_continue_yes_voice2.volume = .7,
                        g.g_continue_no_voice0.volume = .7,
                        g.g_continue_no_voice1.volume = .7,
                        g.voice_congra.volume = .7,
                        document.addEventListener("visibilitychange", function() {
                            "hidden" === document.visibilityState ? PIXI.sound.pauseAll() : "visible" === document.visibilityState && PIXI.sound.resumeAll()
                        }, !1)
                    }
                    TweenMax.to([e.loadingG, e.loadingBg], .2, {
                        alpha: 0,
                        onComplete: function() {
                            B.Manager.game.stage.removeChild(B.Scene)
                        }
                    })
                }),
                o.load()
            }
        }, {
            key: "loadProgress",
            value: function() {}
        }, {
            key: "loadComplete",
            value: function() {}
        }, {
            key: "sceneRemoved",
            value: function() {
                F.dlog("LoadScene.sceneRemoved() Start."),
                Dn(Bn(e.prototype), "sceneRemoved", this).call(this),
                this.loadingG.destroy(!0),
                this.loadingBg.destroy(!0),
                B.Scene = new mn,
                B.Manager.game.stage.addChild(B.Scene),
                F.dlog("LoadScene.sceneRemoved() End.")
            }
        }]) && An(o.prototype, n),
        a && An(o, a),
        e
    }();
    function Gn(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }
    var jn = function() {
        function t() {
            !function(t, e) {
                if (!(t instanceof e))
                    throw new TypeError("Cannot call a class as a function")
            }(this, t),
            this.game,
            this.intract,
            this.sceneList,
            this.scene
        }
        var e, o, i;
        return e = t,
        i = [{
            key: "goto",
            value: function(t) {
                for (var e = 0; e < this._sceneList.length; e++) {
                    this._sceneList[e].parent,
                    this._sceneList[e].child;
                    t === this._sceneList[e].child.id && this.game.pushScene(this._sceneList[e].child)
                }
            }
        }, {
            key: "addScene",
            value: function(t, e) {
                void 0 === this._sceneList && (this._sceneList = []),
                this._sceneList.push({
                    parent: t,
                    child: e
                })
            }
        }],
        (o = [{
            key: "begin",
            value: function() {
                B.Scene = new Rn,
                this.game.stage.addChild(B.Scene)
            }
        }]) && Gn(e.prototype, o),
        i && Gn(e, i),
        t
    }();
    function Xn(t, e) {
        for (var o = 0; o < e.length; o++) {
            var i = e[o];
            i.enumerable = i.enumerable || !1,
            i.configurable = !0,
            "value"in i && (i.writable = !0),
            Object.defineProperty(t, i.key, i)
        }
    }

export const BaseCast = l;
export const BaseSpriteCast = K;
export const BaseUnit = y;
export const Bullet = S;
export const Player = M;
export const Enemy = Ye;
export const Boss = Ze;
export const BossBison = so;
export const BossBarlog = po;
export const BossSagat = wo;
export const BossVega = Eo;
export const BossGoki = Ro;
export const BossFang = Wo;

export const BaseScene = N;
export const ContinueScene = Be;
export const GameScene = Ki;
export const ResultScene = tn;
export const GameoverScene = tn;
export const CongraScene = tn;
export const EndingScene = tn;
export const AdvScene = hn;
export const TitleScene = mn;
export const LoadScene = Rn;

export function instantiateGame() {
    F.dlog("App.init start.");

    if (B.Manager && B.Manager.game) {
        return B.Manager.game;
    }

    var baseUrlNode = document.getElementById("baseUrl");
    D.baseUrl = baseUrlNode ? baseUrlNode.innerHTML : D.baseUrl;

    B.Manager = new jn;
    B.Manager.game = new PIXI.Application({
        antialias: !1,
        transparent: !1,
        resolution: 1,
        width: i.GAME_WIDTH,
        height: i.GAME_HEIGHT,
        backgroundColor: 0
    });
    B.Manager.interact = new PIXI.interaction.InteractionManager(B.Manager.game.view);
    B.Manager.interact.hitTestRectangle = St.hitTestFunc;

    var canvasNode = document.getElementById("canvas");
    if (!canvasNode) {
        throw new Error("#canvas element is required to start the game.");
    }

    canvasNode.appendChild(B.Manager.game.view);
    B.Manager.begin();

    return B.Manager.game;
}

export default instantiateGame;
