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
// Audio — the save's own soundtrack and effect bank.
//
// gameJson.dezaemonBgm (map-to-game.js) carries the settings BGM table and
// the raw 4228-byte song slots it references, base64-packed. A song is a
// 4-byte header + 32 measures of (4 control bytes + 4 parts x 32 steps);
// step 0x00 is empty, 0x01-0x3B a note over ~5 octaves, 0x80-0x88 a tie.
// The Saturn plays these through sampled instruments we do not have, so the
// sequencer voices them as chiptune through WebAudio: two pulse parts, a
// triangle bass and a noise part, which keeps the save's composition —
// melody, harmony and rhythm — even though the timbres are approximations.
//
// SFX: the settings SFX set (1 REAL / 2 COMIC / 3 SF) picks between three
// synthesized effect flavors for shot / hit / explosion / boss events.
// =====================================================================

// Tempo, traced through the whole chain: the kernel's sequencer sends the
// song's header byte +2 to the sound driver at each measure boundary
// (0KERNEL +0x1c52 -> +0x6005498), and its consumer (+0x213c) programs the
// driver's per-channel rate byte as (tempoIndex << 5) | 0x1F — a classic
// accumulator rate, LINEAR in (tempoIndex + 1). The driver's tick frequency
// is the one untraced constant (it lives in the 68000 SCSP driver's timer
// setup); TICK_HZ = 30 anchors the corpus's modal tempo (3) to the rate this
// sequencer always played, so absolute speed is calibrated while RELATIVE
// tempo between songs is engine-exact.
var BGM_TICK_HZ = 30;
function bgmStepSeconds(tempoIndex) {
    var t = typeof tempoIndex === "number" ? (tempoIndex & 7) : 3;
    var rate = ((t + 1) * 32 - 1) / 256;   // (t<<5)|0x1F over an 8-bit accumulator
    return 1 / (BGM_TICK_HZ * rate);
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

// One song slot -> per-part event lists [{step, note, len}] in step units.
export function parseBgmSong(b64) {
    var raw = b64ToBytes(b64);
    var parts = [[], [], [], []];
    for (var p = 0; p < 4; p++) {
        var current = null;
        for (var m = 0; m < 32; m++) {
            var base = 4 + m * 132 + 4 + p * 32;
            for (var st = 0; st < 32; st++) {
                var v = raw[base + st];
                var abs = m * 32 + st;
                if (v >= 0x01 && v <= 0x3b) {
                    current = { step: abs, note: v, len: 1 };
                    parts[p].push(current);
                } else if (v >= 0x80 && v <= 0x88 && current) {
                    current.len = abs - current.step + 1;
                } else if (v === 0) {
                    current = null;
                }
            }
        }
    }
    // The header's own loop points (kernel walker, 0KERNEL +0x1d56/+0x1d6e):
    // byte 0 = measure playback rewinds TO, byte 1 = last measure played.
    var loopStartStep = Math.min(raw[0], 31) * 32;
    var loopEndStep = (Math.min(raw[1], 31) + 1) * 32;
    if (loopEndStep <= loopStartStep) { loopStartStep = 0; loopEndStep = 32 * 32; }
    return { parts: parts, loopStartStep: loopStartStep, loopEndStep: loopEndStep };
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
    var st = scene._dezaBgm = {
        ctx: ctx,
        song: parseBgmSong(bgm.songs[idx]),
        stepSeconds: bgmStepSeconds(bgm.tempos ? bgm.tempos[idx] : undefined),
        songIndex: idx,
        which: which,
        cursor: [0, 0, 0, 0],
        startTime: ctx.currentTime + 0.05,
        loop: 0,
        master: ctx.createGain(),
        noise: makeNoiseBuffer(ctx),
        timer: null,
        scheduled: 0,
    };
    st.master.gain.value = BGM_GAIN;
    st.master.connect(ctx.destination);
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
    for (var p = 0; p < 4; p++) {
        var events = song.parts[p];
        if (!events.length) continue;
        var voice = PART_VOICES[p];
        for (;;) {
            var i = st.cursor[p];
            if (i >= events.length) {
                // wrapped: rewind every part to the song's own loop measure
                var allDone = true;
                for (var q = 0; q < 4; q++) {
                    if (st.cursor[q] < song.parts[q].length) { allDone = false; break; }
                }
                if (allDone) {
                    st.loop += 1;
                    for (var r = 0; r < 4; r++) {
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
