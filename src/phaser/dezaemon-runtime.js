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
// The scroll runs this much past the plain boss-row park, so the chamber
// artwork (and the boss standing on it) clears the HUD bar instead of being
// half-hidden under it — the Saturn's own window puts the chamber top right
// below its (much thinner) score line.
export var BOSS_PARK_SHIFT = 48;
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
// `bossRow` is the stage's boss placement row when the save defines one; the
// scroll then stops with that row held at the boss's rest quarter of the
// screen — the Saturn parks the map on the boss chamber rather than playing
// it out to the last row.
//
// Returns a controller {container, mapHeight, maxScroll, stopScroll,
// setScroll, destroy} or null when the stage carries no background.
export function buildStageBackground(scene, stageData, recipe, bossRow) {
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
    var stopScroll = maxScroll;
    if (typeof bossRow === "number") {
        stopScroll = Math.max(0, Math.min(maxScroll,
            (bossRow + 1) * TILE - GH + Math.floor(GH / 4) + BOSS_PARK_SHIFT));
    }
    var controller = {
        container: container,
        mapHeight: mapHeight,
        maxScroll: maxScroll,
        stopScroll: stopScroll,
        lastDelta: 0,
        _scroll: -1,
        setScroll: function (px) {
            var clamped = Math.max(0, Math.min(stopScroll, px));
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
    if (fire.pattern !== null && fire.pattern !== undefined) {
        // b5 & 0xF of 10/11/12 routes to one of the engine's three special
        // pattern handlers rather than the angle path. Their shapes are not
        // decoded, so these aim at the player instead of firing at the angle
        // those values would have meant — which pointed them sideways.
        var pdx = scene.playerSprite.x - enemy.x;
        var pdy = scene.playerSprite.y - enemy.y;
        base = Math.atan2(pdx, -pdy);
    } else if (fire.direction) {
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

// =====================================================================
// Boss behavior — the save's own boss record (the 0x40 trailer,
// tools/dezaemon-import/lib/decode/decode-boss.js), carried on
// bossData.bossN.dezaemon.boss.
//
// The record is 4 patterns of (movement, fire tick, 3 fire points) plus an
// HP-stage playlist: the HP bar splits into `hpStages` equal bands, each band
// cycling four 2-bit pattern ids. Fire point types: 0-2 fire bullet weapon
// A/B/C from (bossX+dx, bossY+dy); 3/4 spawn a destructible part there whose
// art is a zako/large record (dezaemon.partArt maps record -> atlas frames,
// with the enemy roster as fallback for older imports); 5/6 are the beam and
// flame specials. The boss core stays the scene's single bossSprite — parts
// are extra sprites in scene.enemies, so the existing collision, damage and
// death handling covers them. Movement scripts 0-31 are engine ROM the save
// does not carry, so the boss sways at the pattern's speed instead.
// =====================================================================

// Frames each playlist entry runs before the loop advances. The engine's
// phase pacing is untraced; ~6s keeps a 4-entry loop visible inside a 99s
// boss timer.
var BOSS_ENTRY_FRAMES = 360;
// The type-5 special, from a 60fps Saturn capture of one full cycle (~66
// frames): one dithered red ELLIPSE pinned under the fire point that morphs
// continuously — a screen-wide horizontal band holds at the mouth, contracts
// through a lens into a ball, stretches into the tall veil reaching the
// bottom of the screen, thins to a vertical line, then swings back out to
// the band. The cycle is seamless (last key = first key) and repeats for the
// attack's life. Keyframes are [t, width, height]; height null means "the
// full drop from the fire point to the screen bottom". The ellipse's TOP
// edge stays at the fire point throughout (the band sits at the mouth, the
// veil hangs below it).
var BEAM_LOOP_FRAMES = 150;
var BEAM_LOOPS = 2;
var BEAM_KEYS = [
    [0.00, 300, 18],   // screen-wide horizontal band...
    [0.17, 300, 18],   // ...holds
    [0.24, 130, 17],   // contracts to a lens
    [0.30, 70, 85],    // rounds into a ball at the chest
    [0.47, 52, null],  // stretches into the full veil
    [0.73, 22, null],  // narrows, still full height
    [0.87, 8, null],   // a thin line down the column
    [1.00, 300, 18],   // swings back out to the band
];

function beamShape(age, hFull) {
    var t = (age % BEAM_LOOP_FRAMES) / BEAM_LOOP_FRAMES;
    var prev = BEAM_KEYS[0];
    for (var i = 1; i < BEAM_KEYS.length; i++) {
        var next = BEAM_KEYS[i];
        if (t <= next[0]) {
            var f = (t - prev[0]) / (next[0] - prev[0]);
            var ph = prev[2] === null ? hFull : prev[2];
            var nh = next[2] === null ? hFull : next[2];
            return { w: prev[1] + (next[1] - prev[1]) * f, h: ph + (nh - ph) * f };
        }
        prev = next;
    }
    return { w: prev[1], h: prev[2] === null ? hFull : prev[2] };
}
// Bullet record used when the boss data carries no weapon of its own (a
// Dezaemon import's boss bulletData is empty — global bullet art is not
// decoded). The frames ship in the stock atlas, which an import merges into.
var DEZA_BOSS_BULLET = {
    speed: 2.5, damage: 1, hp: 1, score: 0, spgage: 0,
    texture: ["normalProjectile0.gif", "normalProjectile1.gif", "normalProjectile2.gif"],
};

function fpKey(fp) {
    var rec = fp.spawn ? fp.spawn.record : null;
    return fp.type + ":" + rec + ":" + fp.dx + ":" + fp.dy;
}

function playlistPattern(boss, band, entry) {
    var row = (boss.playlist && boss.playlist[band]) || [0, 0, 0, 0];
    return row[entry & 3] & 3;
}

// Arm the deza driver for the boss bossAdd just built. Inactive until
// startDezaBoss — the stock entry tween still flies the boss in.
export function initDezaBoss(scene, bossData) {
    var deza = bossData && bossData.dezaemon;
    // an explicit editor attackPattern outranks the imported record
    if (!deza || !deza.boss || bossData.attackPattern) return false;
    scene.dezaBossState = {
        boss: deza.boss,
        partArt: deza.partArt || null,
        frameCache: {},
        active: false,
        age: 0,
        bandIdx: 0,
        entryIdx: 0,
        entryAge: 0,
        patternId: -1,
        pattern: null,
        tickCnt: 0,
        tickIdx: 0,
        parts: [],
        beams: [],
        partRespawn: {},
    };
    return true;
}

// Kick the fight off (called where the stock patterns would start).
export function startDezaBoss(scene) {
    var st = scene.dezaBossState;
    if (!st || st.active) return false;
    st.active = true;
    activatePattern(scene, st, playlistPattern(st.boss, 0, 0));
    return true;
}

// Part art: the import's own extraction first, then any roster enemy that
// shares the (stage, record) pair — older imports carry only the latter.
function partFrames(scene, st, record) {
    if (record == null) return null;
    if (st.frameCache[record] !== undefined) return st.frameCache[record];
    var frames = null;
    var art = st.partArt && st.partArt[record];
    if (art && art.length) frames = art;
    if (!frames) {
        var data = (scene.recipe && scene.recipe.enemyData) || {};
        for (var k in data) {
            var d = data[k];
            if (d && d.dezaemon && d.dezaemon.stage === scene.bossStageId &&
                d.dezaemon.record === record && d.texture && d.texture.length) {
                frames = d.texture;
                break;
            }
        }
    }
    if (frames) {
        var atlas = scene.textures.get("game_asset");
        frames = frames.filter(function (f) { return atlas && atlas.has(f); });
        if (!frames.length) frames = null;
    }
    st.frameCache[record] = frames;
    return frames;
}

function spawnDezaPart(scene, st, fp) {
    var boss = scene.bossSprite;
    if (!boss || !boss.active || !fp.spawn) return null;
    var frames = partFrames(scene, st, fp.spawn.record);
    if (!frames) return null;
    var large = fp.spawn.record >= 48;
    var part = scene.add.sprite(boss.x + fp.dx, boss.y + fp.dy, "game_asset", frames[0]);
    part.setOrigin(0.5);
    part.setDepth(46); // attachments sit over the core (45)
    part.setData("type", "enemy");
    part.setData("name", "dezaPart");
    // Part durability is untraced; sized so a turret takes a few seconds of
    // focused fire, the big figure pieces about twice that.
    part.setData("hp", large ? 32 : 16);
    part.setData("maxHp", large ? 32 : 16);
    part.setData("score", large ? 2000 : 800);
    part.setData("spgage", large ? 4 : 2);
    part.setData("interval", -1);
    part.setData("shootCnt", 0);
    part.setData("itemName", null);
    part.setData("frames", frames);
    part.setData("animIdx", 0);
    part.setData("animTimer", 0);
    part.setData("projData", null);
    part.setData("dezaBossPart", {
        dx: fp.dx,
        dy: fp.dy,
        key: fpKey(fp),
        mobile: !fp.spawn.oneShot,
        phase: Math.random() * 125,
    });
    scene.enemies.push(part);
    st.parts.push(part);
    return part;
}

// Silent removal — a part swapped out by a pattern change was not destroyed
// by the player, so no score, no explosion.
function removeDezaPart(scene, part) {
    var idx = scene.enemies.indexOf(part);
    if (idx >= 0) scene.enemies.splice(idx, 1);
    part.destroy();
}

function clearBeams(st) {
    for (var i = 0; i < st.beams.length; i++) {
        if (st.beams[i].sprite) st.beams[i].sprite.destroy();
    }
    st.beams = [];
}

// Enter a pattern: retire parts the new pattern does not spawn, keep the ones
// it does (their damage persists), spawn what is missing, reset the fire
// clock. Re-activating the same pattern re-arms its destroyed one-shots —
// that is the trailer's own respawn path for type 4.
function activatePattern(scene, st, patternId) {
    st.patternId = patternId;
    st.pattern = (st.boss.patterns || [])[patternId] || null;
    st.tickCnt = 0;
    st.tickIdx = 0;
    st.partRespawn = {};
    clearBeams(st);
    if (!st.pattern) return;
    var wanted = {};
    st.pattern.firePoints.forEach(function (fp) {
        if ((fp.type === 3 || fp.type === 4) && fp.spawn) wanted[fpKey(fp)] = fp;
    });
    for (var i = st.parts.length - 1; i >= 0; i--) {
        var part = st.parts[i];
        if (!part || !part.active) { st.parts.splice(i, 1); continue; }
        var key = part.getData("dezaBossPart").key;
        if (wanted[key]) {
            delete wanted[key]; // carried over
        } else {
            removeDezaPart(scene, part);
            st.parts.splice(i, 1);
        }
    }
    for (var k in wanted) spawnDezaPart(scene, st, wanted[k]);
}

function findLiveDezaPart(st, key) {
    for (var i = 0; i < st.parts.length; i++) {
        var p = st.parts[i];
        if (p && p.active && p.getData("dezaBossPart").key === key) return p;
    }
    return null;
}

function bossWeapon(scene, weapon) {
    var pd = weapon === 1 ? scene.bossProjDataB
        : weapon === 2 ? scene.bossProjDataC
            : scene.bossProjDataA;
    return pd && pd.texture && pd.texture.length ? pd : DEZA_BOSS_BULLET;
}

function spawnDezaBossBullet(scene, x, y, dirX, dirY, projData, tint) {
    var frames = projData.texture || [];
    var bullet = scene.add.sprite(x, y, "game_asset", frames[0] || "normalProjectile0.gif");
    bullet.setOrigin(0.5);
    bullet.setDepth(47);
    bullet.setData("speed", projData.speed || DEZA_BOSS_BULLET.speed);
    bullet.setData("damage", projData.damage || 1);
    bullet.setData("hp", projData.hp || 1);
    bullet.setData("score", projData.score || 0);
    bullet.setData("spgage", projData.spgage || 0);
    bullet.setData("rotX", dirX);
    bullet.setData("rotY", dirY);
    if (frames.length > 1) {
        bullet.setData("frames", frames);
        bullet.setData("animIdx", 0);
        bullet.setData("animTimer", 0);
        if (projData.frameRate) bullet.setData("frameRate", projData.frameRate);
    }
    if (tint) bullet.setTint(tint);
    scene.enemyBullets.push(bullet);
    return bullet;
}

// Types 0-2: one shot from the fire point, aimed when the record says so.
function fireDezaBullet(scene, fp) {
    var boss = scene.bossSprite;
    var x = boss.x + fp.dx;
    var y = boss.y + fp.dy;
    var dirX = 0;
    var dirY = 1;
    if (fp.shot && fp.shot.aimed && scene.playerSprite) {
        var dx = scene.playerSprite.x - x;
        var dy = scene.playerSprite.y - y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        dirX = dx / d;
        dirY = dy / d;
    }
    var projData = bossWeapon(scene, fp.shot ? fp.shot.weapon : 0);
    // The save's own bullet art is not decoded; the Saturn capture shows blue
    // orbs, so the stand-in stock projectile is tinted toward them.
    spawnDezaBossBullet(scene, x, y, dirX, dirY, projData,
        projData === DEZA_BOSS_BULLET ? 0x7fb2ff : 0);
}

// Type 6: a slow fan of tinted shots below the fire point.
function fireDezaFlame(scene, fp) {
    var boss = scene.bossSprite;
    var x = boss.x + fp.dx;
    var y = boss.y + fp.dy;
    for (var i = 0; i < 5; i++) {
        var a = (-40 + 20 * i) * Math.PI / 180; // fan around straight down
        var speed = 1.1 + Math.random() * 0.7;
        var b = spawnDezaBossBullet(
            scene, x, y,
            Math.sin(a), Math.cos(a),
            DEZA_BOSS_BULLET, 0xff9944
        );
        b.setData("speed", speed);
        b.setScale(1 + Math.random() * 0.5);
    }
}

// Type 5: the morphing red veil (see BEAM_KEYS). Not a bullet: the player
// cannot shoot it down, and it checks the player itself with an ellipse test.
function startDezaBeam(scene, st, fp) {
    var key = fpKey(fp);
    for (var i = 0; i < st.beams.length; i++) {
        if (st.beams[i].key === key) return; // already running
    }
    var boss = scene.bossSprite;
    // Unit ellipse scaled per-frame — rescaling a solid fill is lossless,
    // where resizing the shape's geometry is not.
    var oval = scene.add.ellipse(boss.x + fp.dx, boss.y + fp.dy, 100, 100, 0xdd2233, 0.45);
    oval.setDepth(44); // under the boss core, over the parts' playfield
    oval.setScale(0, 0);
    st.beams.push({ key: key, fp: fp, sprite: oval, age: 0, cooldown: 0 });
}

function updateDezaBeams(scene, st) {
    var boss = scene.bossSprite;
    var GH = scene.scale ? scene.scale.height : 480;
    var life = BEAM_LOOP_FRAMES * BEAM_LOOPS;
    for (var i = st.beams.length - 1; i >= 0; i--) {
        var beam = st.beams[i];
        beam.age++;
        if (beam.age > life) {
            beam.sprite.destroy();
            st.beams.splice(i, 1);
            continue;
        }
        var topY = boss.y + beam.fp.dy;
        var shape = beamShape(beam.age, Math.max(60, GH - topY));
        var cx = boss.x + beam.fp.dx;
        var cy = topY + shape.h / 2; // top edge pinned at the fire point
        beam.sprite.x = cx;
        beam.sprite.y = cy;
        beam.sprite.setScale(shape.w / 100, shape.h / 100);
        // dither stand-in: translucent red with a shimmer, fading at the ends
        var fade = Math.min(1, beam.age / 12, (life - beam.age) / 25);
        beam.sprite.setFillStyle(0xdd2233, (0.4 + 0.1 * Math.sin(beam.age * 0.5)) * fade);
        if (beam.cooldown > 0) beam.cooldown--;
        var player = scene.playerSprite;
        // no damage while the veil is still fading in/out — a nearly
        // invisible full-size ellipse must not be a hitbox
        if (player && fade > 0.6 && beam.cooldown <= 0 && !scene.barrierActive) {
            var nx = (player.x - cx) / (shape.w / 2 + 8);
            var ny = (player.y - cy) / (shape.h / 2 + 8);
            if (nx * nx + ny * ny <= 1) {
                beam.cooldown = 60;
                scene.playerDamage(1);
            }
        }
    }
}

// Per-frame driver, called from the scene's boss branch while the fight is
// live (the time-stop and death freezes gate the caller).
export function updateDezaBoss(scene) {
    var st = scene.dezaBossState;
    if (!st || !st.active) return;
    var boss = scene.bossSprite;
    if (!boss || !boss.active) {
        clearDezaBoss(scene);
        return;
    }
    var b = st.boss;
    st.age++;

    // HP bands are equal slices of the bar; dropping into a lower band
    // advances the playlist to that band's byte and re-arms its pattern.
    var stages = Math.max(1, Math.min(4, b.hpStages || 1));
    var frac = scene.bossMaxHp > 0 ? scene.bossHp / scene.bossMaxHp : 1;
    var band = Math.min(stages - 1, Math.max(0, Math.floor((1 - frac) * stages)));
    if (band > st.bandIdx) {
        st.bandIdx = band;
        st.entryIdx = 0;
        st.entryAge = 0;
        // The Saturn marks an HP-stage change with a whole-screen mosaic
        // flourish; a camera flash is this engine's closest transition beat.
        if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.flash(350, 255, 255, 255);
        }
        activatePattern(scene, st, playlistPattern(b, band, 0));
    } else {
        st.entryAge++;
        if (st.entryAge >= BOSS_ENTRY_FRAMES) {
            st.entryAge = 0;
            st.entryIdx = (st.entryIdx + 1) & 3;
            activatePattern(scene, st, playlistPattern(b, st.bandIdx, st.entryIdx));
        }
    }

    var pattern = st.pattern;
    // The movement scripts are engine ROM the save does not carry; sway at
    // the pattern's speed so a moving pattern reads as one. Script 0 is the
    // editor's default and holds position — Ramsie's statue boss never moves,
    // whatever speed its patterns carry — so only a nonzero script sways.
    if (pattern && pattern.moveScript > 0 && pattern.moveSpeed > 0 && !scene.bossEntering) {
        var GW = scene.scale ? scene.scale.width : 256;
        var amp = Math.min(10 + pattern.moveSpeed * 8, (GW - boss.width) / 2);
        boss.x = GW / 2 + Math.sin(st.age * (0.006 + pattern.moveSpeed * 0.002)) * amp;
    }
    if (b.rotate) boss.rotation += 0.02;

    updateDezaBeams(scene, st);

    if (!pattern) return;
    st.tickCnt++;
    if (st.tickCnt < (pattern.fireTickFrames || 60)) return;
    st.tickCnt = 0;
    st.tickIdx++;
    for (var i = 0; i < pattern.firePoints.length; i++) {
        var fp = pattern.firePoints[i];
        var due = st.tickIdx % ((fp.rate || 0) + 1) === 0;
        if (fp.type <= 2) {
            if (due) fireDezaBullet(scene, fp);
        } else if (fp.type === 3) {
            // respawning mobile part: re-arm after a rate-scaled pause
            var key = fpKey(fp);
            if (!findLiveDezaPart(st, key)) {
                var wait = st.partRespawn[key];
                if (wait === undefined) {
                    st.partRespawn[key] = (fp.rate || 0) + 2;
                } else if (wait <= 1) {
                    delete st.partRespawn[key];
                    spawnDezaPart(scene, st, fp);
                } else {
                    st.partRespawn[key] = wait - 1;
                }
            }
        } else if (fp.type === 5) {
            if (due) startDezaBeam(scene, st, fp);
        } else if (fp.type === 6) {
            if (due) fireDezaFlame(scene, fp);
        }
        // type 4 spawns on pattern activation only
    }
}

// Per-frame part positioning: parts ride the boss at their fire-point offset
// (type 3 drifts around its anchor). Returns true when `sprite` is a part —
// the caller then skips the regular enemy movement entirely.
export function updateDezaBossPart(scene, part) {
    var pd = part.getData("dezaBossPart");
    if (!pd) return false;
    var boss = scene.bossSprite;
    if (!boss || !boss.active) {
        removeDezaPart(scene, part);
        return true;
    }
    var dx = pd.dx;
    if (pd.mobile) {
        dx += Math.sin((scene.worldTime + pd.phase) * 0.05) * 6;
    }
    part.x = boss.x + dx;
    part.y = boss.y + pd.dy;
    return true;
}

// Tear the fight down. `explode` marks a real defeat (bossDie passes it):
// the attached parts go up with the core — the Saturn blows the whole
// assembly — where a scene cleanup removes them silently.
export function clearDezaBoss(scene, explode) {
    var st = scene.dezaBossState;
    if (!st) return;
    for (var i = 0; i < st.parts.length; i++) {
        var part = st.parts[i];
        if (part && part.active) {
            if (explode && scene.showExplosion) scene.showExplosion(part.x, part.y);
            removeDezaPart(scene, part);
        }
    }
    st.parts = [];
    clearBeams(st);
    scene.dezaBossState = null;
}

// =====================================================================
// Audio — the save's own soundtrack and effect bank.
//
// gameJson.dezaemonBgm (map-to-game.js) carries the settings BGM table and
// the raw 4228-byte song slots it references, base64-packed. A song is a
// 4-byte header + 32 measures of (4 control bytes + 4 parts x 32 bytes).
// A measure is SIXTEEN steps, and a part's 32 bytes are two COLUMNS of
// those steps (kernel walker 0KERNEL +0x1bfc, sender +0x15bc): bytes 0-15
// are the voice column — 0 rests, bit 7 holds the sounding note, anything
// else starts one and names its instrument — and bytes 16-31 are the pitch
// column, which the sender stores to the per-part note register on each
// onset and ignores while a note is held.
// The Saturn plays these through sampled instruments we do not have, so the
// sequencer voices them as chiptune through WebAudio: two pulse parts, a
// triangle bass and a noise part, which keeps the save's composition —
// melody, harmony and rhythm — even though the timbres are approximations.
//
// SFX: the settings SFX set (1 REAL / 2 COMIC / 3 SF) picks between three
// synthesized effect flavors for shot / hit / explosion / boss events.
// =====================================================================

// Tempo, engine-traced end to end: every frame (60 Hz) the kernel's sound
// pump ticks the sequencer (0KERNEL +0x1db8), which adds 4 to a word
// accumulator and fires ONE walker step when it reaches the song's divisor
// — TEMPO_TABLE[header byte 3], the kernel table at 0x601F3A8 — keeping
// the remainder. So a step lasts divisor/240 seconds exactly, and the
// editor's 32 tempo positions span 54.5-200 BPM (BPM = 3600/divisor at 4
// steps per beat). No calibrated constants remain.
var DEZA_TEMPO_TABLE = [
    0x42, 0x3c, 0x39, 0x36, 0x34, 0x31, 0x2f, 0x2d,
    0x2b, 0x2a, 0x28, 0x27, 0x26, 0x24, 0x23, 0x22,
    0x21, 0x20, 0x1f, 0x1e, 0x1d, 0x1c, 0x1b, 0x1a,
    0x19, 0x18, 0x17, 0x16, 0x15, 0x14, 0x13, 0x12,
];
// (Measure control byte 3 is a transpose, but the engine applies it only to
// the auto-accompaniment patterns it pulls from kernel ROM — never to these
// four composed parts — so the sequencer leaves the melody alone.)
function bgmStepSeconds(tempoIndex) {
    return DEZA_TEMPO_TABLE[tempoIndex & 31] / 240;
}
var BGM_LOOKAHEAD = 0.35;        // seconds scheduled ahead of the clock
var BGM_TICK_MS = 90;
var BGM_GAIN = 0.10;

function b64ToBytes(s) {
    var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var clean = String(s).replace(/=+$/, "");
    var out = new Uint8Array((clean.length * 3) >> 2);
    var acc = 0, bits = 0, o = 0;
    for (var i = 0; i < clean.length; i++) {
        var v = ALPHA.indexOf(clean.charAt(i));
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

// One song slot -> per-part event lists [{step, note, len}] in 16-step
// measures. A note runs from its onset through every following tie step,
// so held notes sustain instead of re-striking on each step.
export function parseBgmSong(b64) {
    var raw = b64ToBytes(b64);
    var parts = [[], [], [], []];
    for (var p = 0; p < 4; p++) {
        var stream = parts[p];
        var current = null;
        for (var m = 0; m < 32; m++) {
            var base = 4 + m * 132 + 4 + p * 32;
            for (var st = 0; st < 16; st++) {
                var voice = raw[base + st];
                var pitch = raw[base + 16 + st];
                var abs = m * 16 + st;
                if (voice === 0) {
                    current = null;                       // rest: key off
                } else if (voice & 0x80) {
                    if (current) current.len = abs - current.step + 1;   // tie
                } else if (pitch >= 0x01 && pitch <= 0x3b) {
                    current = { step: abs, note: pitch, len: 1 };
                    stream.push(current);
                } else {
                    current = null;
                }
            }
        }
    }
    // The header's own loop points (kernel walker, 0KERNEL +0x1d56/+0x1d6e):
    // byte 0 = measure playback rewinds TO, byte 1 = last measure played.
    var loopStartStep = Math.min(raw[0], 31) * 16;
    var loopEndStep = (Math.min(raw[1], 31) + 1) * 16;
    if (loopEndStep <= loopStartStep) { loopStartStep = 0; loopEndStep = 32 * 16; }
    return {
        parts: parts,
        loopStartStep: loopStartStep,
        loopEndStep: loopEndStep,
        stepSeconds: bgmStepSeconds(raw[3]),
        echoLevel: raw[2] & 7,
    };
}

function audioCtx(scene) {
    var snd = scene.sound;
    return (snd && snd.context && typeof snd.context.createOscillator === "function")
        ? snd.context
        : null;
}

function noteFreq(note) {
    // note 1..0x3B across ~5 octaves; anchor so mid-range lands around A4
    return 440 * Math.pow(2, (note - 34) / 12);
}

var PART_VOICES = [
    { type: "square", gain: 1.0 },
    { type: "square", gain: 0.8 },
    { type: "triangle", gain: 1.2 },
    { type: "noise", gain: 0.5 },
];

function makeNoiseBuffer(ctx) {
    var len = (ctx.sampleRate * 0.25) | 0;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
}

// Start (or switch) the imported soundtrack for a scene. `which` is "main"
// or "boss"; the assignment comes from the save's own BGM table.
export function startDezaemonBgm(scene, which) {
    var bgm = scene.recipe && scene.recipe.dezaemonBgm;
    if (!bgm) return false;
    var ctx = audioCtx(scene);
    if (!ctx) return false;
    var stageId = typeof scene.bossStageId === "number" ? scene.bossStageId : 0;
    var pair = (bgm.stages && bgm.stages[stageId]) || null;
    var idx = pair ? (which === "boss" ? pair[1] : pair[0]) : null;
    if (idx == null || !bgm.songs || bgm.songs[idx] == null) return false;

    stopDezaemonBgm(scene);
    var song = parseBgmSong(bgm.songs[idx]);
    var st = scene._dezaBgm = {
        ctx: ctx,
        song: song,
        stepSeconds: song.stepSeconds,
        songIndex: idx,
        which: which,
        cursor: [0, 0, 0, 0],
        startTime: ctx.currentTime + 0.05,
        loop: 0,
        master: ctx.createGain(),
        noise: makeNoiseBuffer(ctx),
        timer: null,
        scheduled: 0,
        echo: null,
    };
    st.master.gain.value = BGM_GAIN;
    st.master.connect(ctx.destination);
    // header byte 2 — the song's echo send (EFSDL of the Saturn mix slots),
    // approximated as a feedback delay tap off the master bus.
    if (song.echoLevel > 0) {
        var delay = ctx.createDelay(0.5);
        delay.delayTime.value = 0.18;
        var fb = ctx.createGain();
        fb.gain.value = 0.3;
        var wet = ctx.createGain();
        wet.gain.value = 0.45 * (song.echoLevel / 7);
        st.master.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(ctx.destination);
        st.echo = wet;
    }
    var pump = function () { scheduleBgm(scene, st); };
    st.timer = scene.time.addEvent({ delay: BGM_TICK_MS, loop: true, callback: pump });
    pump();
    return true;
}

function scheduleBgm(scene, st) {
    var ctx = st.ctx;
    var horizon = ctx.currentTime + BGM_LOOKAHEAD;
    var song = st.song;
    var span = song.loopEndStep - song.loopStartStep;
    var n = song.parts.length;
    for (var p = 0; p < n; p++) {
        var events = song.parts[p];
        if (!events.length) continue;
        var voice = PART_VOICES[p];
        for (;;) {
            var i = st.cursor[p];
            if (i >= events.length) {
                // wrapped: rewind every part to the song's own loop measure
                var allDone = true;
                for (var q = 0; q < n; q++) {
                    if (st.cursor[q] < song.parts[q].length) { allDone = false; break; }
                }
                if (allDone) {
                    st.loop += 1;
                    for (var r = 0; r < n; r++) {
                        var evs = song.parts[r];
                        var at = evs.length;
                        for (var k = 0; k < evs.length; k++) {
                            if (evs[k].step >= song.loopStartStep) { at = k; break; }
                        }
                        st.cursor[r] = at;
                    }
                    continue;
                }
                break;
            }
            var e = events[i];
            if (e.step >= song.loopEndStep) { st.cursor[p] = events.length; continue; }
            // pass 0 plays from the top; later passes play loopStart..loopEnd
            var pos = st.loop === 0
                ? e.step
                : song.loopEndStep + (st.loop - 1) * span + (e.step - song.loopStartStep);
            var t = st.startTime + pos * st.stepSeconds;
            if (t > horizon) break;
            st.cursor[p] = i + 1;
            if (t < ctx.currentTime - 0.02) continue;
            playBgmNote(st, voice, e, t);
            st.scheduled += 1;
        }
    }
}

function playBgmNote(st, voice, e, t) {
    var ctx = st.ctx;
    var dur = Math.max(0.05, e.len * st.stepSeconds * 0.95);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(voice.gain * 0.5, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
    g.connect(st.master);
    if (voice.type === "noise") {
        var src = ctx.createBufferSource();
        src.buffer = st.noise;
        src.playbackRate.value = 0.5 + (e.note / 0x3b);
        src.connect(g);
        src.start(t);
        src.stop(t + Math.min(dur, 0.2));
    } else {
        var osc = ctx.createOscillator();
        osc.type = voice.type;
        osc.frequency.value = noteFreq(e.note);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + dur + 0.1);
    }
}

export function stopDezaemonBgm(scene) {
    var st = scene._dezaBgm;
    if (!st) return;
    if (st.timer) st.timer.remove();
    try { st.master.disconnect(); } catch (e) { /* context may be gone */ }
    if (st.echo) { try { st.echo.disconnect(); } catch (e2) { /* ditto */ } }
    scene._dezaBgm = null;
}

// ---------------------------------------------------------------------
// SFX — three synthesized banks keyed by the save's SFX set.
// ---------------------------------------------------------------------

var SFX_GAIN = 0.14;

export function playDezaemonSfx(scene, name) {
    var bgm = scene.recipe && scene.recipe.dezaemonBgm;
    if (!bgm) return false;
    var ctx = audioCtx(scene);
    if (!ctx) return false;
    var bank = bgm.sfxSet === 2 ? "comic" : bgm.sfxSet === 3 ? "sf" : "real";
    var t = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.value = SFX_GAIN;
    g.connect(ctx.destination);
    if (name === "explosion" || name === "bossExplosion") {
        var big = name === "bossExplosion";
        if (bank === "comic") {
            sfxSweep(ctx, g, t, "square", big ? 300 : 500, big ? 40 : 90, big ? 0.5 : 0.22);
        } else {
            sfxNoise(scene, ctx, g, t, big ? 0.6 : 0.25, bank === "sf" ? 1400 : 700);
        }
    } else if (name === "shot") {
        if (bank === "sf") sfxSweep(ctx, g, t, "sawtooth", 1400, 300, 0.08);
        else if (bank === "comic") sfxSweep(ctx, g, t, "square", 900, 500, 0.06);
        else sfxNoise(scene, ctx, g, t, 0.05, 3000);
    } else { // hit
        if (bank === "comic") sfxSweep(ctx, g, t, "square", 700, 250, 0.07);
        else if (bank === "sf") sfxSweep(ctx, g, t, "sawtooth", 900, 200, 0.09);
        else sfxNoise(scene, ctx, g, t, 0.08, 1200);
    }
    return true;
}

function sfxSweep(ctx, out, t, type, f0, f1, dur) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(1, t);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.2);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.1);
}

function sfxNoise(scene, ctx, out, t, dur, cutoff) {
    var st = scene._dezaBgm;
    var buf = (st && st.noise) || makeNoiseBuffer(ctx);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = dur > 0.25;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, cutoff / 8), t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(1, t);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.25);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t);
    src.stop(t + dur + 0.2);
}
