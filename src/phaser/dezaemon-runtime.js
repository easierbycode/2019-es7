// Runtime for Dezaemon 2 imports: the save's own scenery and enemy behavior.
//
// A .sav import now carries per-enemy attributes decoded straight from the
// record the Saturn engine reads (tools/dezaemon-import/lib/decode/
// decode-enemy.js): hp, score, speed, fire config, and four "change"
// channels — speed multiplier, rotation, scale and movement direction, each
// a start/end/step/repeat interpolator. This module drives all of that in
// Phaser, plus the stage background tilemap the import ships as
// stage.background + recipe.backgroundCells.
//
// Time base: everything here ticks on the scene's worldTime — one unit per
// fixedUpdate step while the stage runs, frozen during the time-stop — so
// the map scroll, wave pacing (8 frames/row) and channel interpolators stay
// on the one clock the Saturn game used.

var TILE = 16;
// px of map per worldTime tick: 16px rows at 8 frames/row (see
// FRAMES_PER_SOURCE_ROW in the importer).
export var SCROLL_PX_PER_FRAME = 2;
// GPU-safe strip height for the composed background textures.
var STRIP_ROWS = 128;

// --- Stage background --------------------------------------------------

function decodeBase64(str) {
    var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var clean = String(str).replace(/=+$/, "");
    var out = new Uint8Array((clean.length * 3) >> 2);
    var acc = 0, bits = 0, o = 0;
    for (var i = 0; i < clean.length; i++) {
        var v = ALPHA.indexOf(clean[i]);
        if (v < 0) continue;
        acc = (acc << 6) | v;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out[o++] = (acc >> bits) & 0xff;
        }
    }
    return out;
}

// Compose the stage's tile grid into strip textures inside a container that
// scrolls with worldTime. Map row 0 (the stage start) sits at the bottom;
// scrolling reveals later rows from the top, ending at the boss chamber.
//
// Returns a controller {container, mapHeight, maxScroll, setScroll, destroy}
// or null when the stage carries no background.
export function buildStageBackground(scene, stageData, recipe) {
    var bg = stageData && stageData.background;
    var cells = recipe && recipe.backgroundCells;
    if (!bg || !Array.isArray(cells) || !cells.length) return null;

    var bytes = decodeBase64(bg.tiles);
    if (bytes.length < bg.rows * bg.cols * 2) return null;

    var atlas = scene.textures.get("game_asset");
    if (!atlas) return null;
    var frames = cells.map(function (name) {
        return atlas.has(name) ? atlas.get(name) : null;
    });

    var GW = scene.scale ? scene.scale.width : 256;
    var GH = scene.scale ? scene.scale.height : 480;
    var mapHeight = bg.rows * TILE;
    var container = scene.add.container(0, 0);
    container.setDepth(1); // above the stock backdrop, below sprites

    var stripCount = Math.ceil(bg.rows / STRIP_ROWS);
    for (var s = 0; s < stripCount; s++) {
        var firstRow = s * STRIP_ROWS;
        var rowCount = Math.min(STRIP_ROWS, bg.rows - firstRow);
        var key = "dezaBg_" + scene.stageKey + "_" + s;
        if (scene.textures.exists(key)) scene.textures.remove(key);
        var tex = scene.textures.createCanvas(key, bg.cols * TILE, rowCount * TILE);
        var ctx = tex.getContext();
        for (var r = 0; r < rowCount; r++) {
            var row = firstRow + r;
            for (var c = 0; c < bg.cols; c++) {
                var o = (row * bg.cols + c) * 2;
                var word = (bytes[o] << 8) | bytes[o + 1];
                if (word === 0xffff) continue;
                var frame = frames[word & 0x3ff];
                if (!frame) continue;
                var hflip = (word & 0x8000) !== 0;
                var vflip = (word & 0x4000) !== 0;
                // Strip-local y: row 0 of the strip at the BOTTOM, so the
                // whole map reads bottom-up like the scroll does.
                var dx = c * TILE;
                var dy = (rowCount - 1 - r) * TILE;
                var src = frame.source.image;
                if (hflip || vflip) {
                    ctx.save();
                    ctx.translate(dx + TILE / 2, dy + TILE / 2);
                    ctx.scale(hflip ? -1 : 1, vflip ? -1 : 1);
                    ctx.drawImage(src, frame.cutX, frame.cutY, TILE, TILE, -TILE / 2, -TILE / 2, TILE, TILE);
                    ctx.restore();
                } else {
                    ctx.drawImage(src, frame.cutX, frame.cutY, TILE, TILE, dx, dy, TILE, TILE);
                }
            }
        }
        tex.refresh();
        var img = scene.add.image(0, mapHeight - (firstRow + rowCount) * TILE, key);
        img.setOrigin(0, 0);
        container.add(img);
    }
    // Center the 224px playfield on the 256px screen, like the placement grid.
    container.x = Math.floor((GW - bg.cols * TILE) / 2);

    var maxScroll = Math.max(0, mapHeight - GH);
    var controller = {
        container: container,
        mapHeight: mapHeight,
        maxScroll: maxScroll,
        lastDelta: 0,
        _scroll: -1,
        setScroll: function (px) {
            var clamped = Math.max(0, Math.min(maxScroll, px));
            this.lastDelta = this._scroll < 0 ? 0 : clamped - this._scroll;
            this._scroll = clamped;
            // scroll 0: map bottom at screen bottom; scroll max: map top at 0.
            container.y = GH - mapHeight + clamped;
        },
        destroy: function () {
            container.destroy(true);
        },
    };
    controller.setScroll(0);
    return controller;
}

// --- Enemy behavior ----------------------------------------------------

function makeChannel(ch, extra) {
    if (!ch || !ch.enabled) return null;
    var step = Math.abs(ch.step);
    if (extra && extra.reverse) step = -step; // rotation mode 2 spins the other way
    return {
        value: ch.from,
        from: ch.from,
        to: ch.to,
        step: ch.from > ch.to ? -step : step,
        repeat: ch.repeat, // 0 once, 1 loop, 2 ping-pong
        spin: !!(extra && extra.spin) || (ch.from === ch.to && ch.step !== 0 && !!(extra && extra.wrap)),
        wrap: !!(extra && extra.wrap),
        done: false,
    };
}

function stepChannel(st) {
    if (!st || st.done) return st ? st.value : 0;
    if (st.spin) {
        st.value += st.step || 1;
        return st.value;
    }
    if (st.step === 0 || st.from === st.to) return st.value;
    st.value += st.step;
    var arrived = st.step > 0 ? st.value >= st.to : st.value <= st.to;
    if (arrived) {
        st.value = st.to;
        if (st.repeat === 1) {
            st.value = st.from;             // loop: jump back and run again
        } else if (st.repeat === 2) {
            var f = st.from;                // ping-pong: swap ends
            st.from = st.to;
            st.to = f;
            st.step = -st.step;
        } else {
            st.done = true;                 // once: hold the end value
        }
    }
    return st.value;
}

// Attach runtime channel state for a spawned enemy. `behavior` is the decoded
// record from enemyData.*.dezaemon.behavior.
export function initEnemyBehavior(enemy, behavior) {
    enemy.setData("deza", {
        behavior: behavior,
        age: 0,
        speedCh: makeChannel(behavior.speedChange, null),
        rotationCh: makeChannel(behavior.rotation, {
            wrap: true,
            reverse: behavior.rotation.mode === 2,
            // modes 3/4 are engine-special (aim-style); play them as spin
            spin: behavior.rotation.mode >= 3,
        }),
        scaleCh: makeChannel(behavior.scale, null),
        directionCh: makeChannel(behavior.direction, { wrap: true }),
        // stagger the first volley inside the engine's randomization window
        reload: behavior.fire.enabled
            ? behavior.fire.interval + Math.floor(Math.random() * (behavior.fire.window || 1))
            : -1,
    });
    if (behavior.ground) {
        // ground objects sit ON the map — no floating shadow
        var shadow = enemy.getData("shadow");
        if (shadow) shadow.setVisible(false);
    }
}

// Per-frame movement + transforms. Returns true when it drove the enemy (the
// caller then skips the legacy movement patterns).
export function updateEnemyBehavior(scene, enemy) {
    var st = enemy.getData("deza");
    if (!st) return false;
    var b = st.behavior;
    st.age++;

    // Ride the map: everything drifts down with the scroll (frozen once the
    // map has reached the boss chamber), plus the enemy's own motion.
    var scroll = scene.dezaBg
        ? scene.dezaBg.lastDelta
        : (scene.bossActive || scene.bossReached ? 0 : SCROLL_PX_PER_FRAME);
    var mult = st.speedCh ? stepChannel(st.speedCh) : 1;
    var dirDeg = st.directionCh ? stepChannel(st.directionCh) : 180;
    var speed = b.speed * mult;
    var rad = dirDeg * Math.PI / 180;
    enemy.x += Math.sin(rad) * speed;
    enemy.y += -Math.cos(rad) * speed + scroll;

    if (st.rotationCh) {
        enemy.rotation = stepChannel(st.rotationCh) * Math.PI / 180;
    }
    if (st.scaleCh) {
        var f = stepChannel(st.scaleCh);
        var axes = b.scale.axes || "xy";
        enemy.setScale(
            axes.indexOf("x") >= 0 ? f : enemy.scaleX,
            axes.indexOf("y") >= 0 ? f : enemy.scaleY
        );
    }
    return true;
}

// Fire the decoded pattern. Returns true when it handled shooting (the caller
// then skips the legacy interval logic).
// Volley patterns (b2 bits 6-7): 0 straight, 1 spread of `count`, 2 aimed,
// 3 fixed — all four fire when the appearance allows it. The base angle
// comes from byte 5; its exact engine mapping is the heuristic left here.
export function updateEnemyFire(scene, enemy, shootFn) {
    var st = enemy.getData("deza");
    if (!st) return false;
    var fire = st.behavior.fire;
    // The appearance decides whether an enemy shoots at all (the engine's
    // dispatcher gate); reload < 0 marks it silent for its whole life.
    if (!fire.enabled || st.reload < 0) return true;
    st.reload -= 1;
    if (st.reload > 0) return true;
    st.reload = fire.interval + Math.floor(Math.random() * (fire.window || 1));
    // The engine only lets an enemy fire inside a band near the top of the
    // screen — it shoots as it comes on, and goes quiet once it has passed.
    // That band, not the reload, is what keeps a dense stage readable.
    var GH = scene.scale ? scene.scale.height : 480;
    if (!scene.playerSprite) return true;
    if (enemy.y < 16 || enemy.y > GH * 0.4) return true;

    var base;
    if (fire.direction) {
        base = fire.direction * (360 / 32) * Math.PI / 180; // 0 = up, cw
    } else if (fire.type === 0 || fire.type === 3) {
        base = Math.PI; // straight down
    } else {
        var dx = scene.playerSprite.x - enemy.x;
        var dy = scene.playerSprite.y - enemy.y;
        base = Math.atan2(dx, -dy); // aim at the player
    }

    if (fire.type === 1) {
        var n = Math.max(1, fire.count);
        var spread = (fire.wide ? 90 : 40) * Math.PI / 180;
        for (var i = 0; i < n; i++) {
            var a = n === 1 ? base : base - spread / 2 + (spread * i) / (n - 1);
            shootFn(scene, enemy, Math.sin(a), -Math.cos(a));
        }
    } else {
        shootFn(scene, enemy, Math.sin(base), -Math.cos(base));
    }
    return true;
}
