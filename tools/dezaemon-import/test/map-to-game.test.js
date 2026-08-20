import test from "node:test";
import assert from "node:assert";
import {
    buildBlankGame,
    mapSaveToGame,
    emptyWave,
    BUILTIN_DEFAULTS,
    EVIL_INVADERS_PLAYER,
    GRID_COLS,
    MAX_STAGES,
    BLANK_WAVES,
    SINGLE_LETTER_ENEMIES,
    FRAMES_PER_SOURCE_ROW,
    enemyLetters,
    DUKE_PLAYER,
    decodePlayerArt,
} from "../lib/map-to-game.js";
import { PLAYER_FRAMES } from "../lib/player-art.js";
import { validateGameJson } from "../lib/game-schema.js";

const emptyDecoded = () => ({ title: null, confidence: {}, sprites: [], enemies: [], stages: [] });

test("buildBlankGame produces a valid, immediately-playable game", () => {
    const g = buildBlankGame();
    const { ok, errors } = validateGameJson(g);
    assert.deepStrictEqual(errors, []);
    assert.ok(ok);
    assert.strictEqual(g.stage0.enemylist.length, BLANK_WAVES);
    for (const row of g.stage0.enemylist) {
        assert.deepStrictEqual(row, new Array(GRID_COLS).fill("00"));
    }
    assert.ok(g.enemyData.enemyA);
    assert.ok(g.bossData.boss0);
    // The enemy and boss records reference the shipped atlas; the player's own
    // frames ride along in decodePlayerArt() instead.
    assert.deepStrictEqual(g.playerData.texture, BUILTIN_DEFAULTS.playerData.texture);
});

test("buildBlankGame clones defaults (no shared references)", () => {
    const g = buildBlankGame();
    g.enemyData.enemyA.hp = 999;
    assert.strictEqual(BUILTIN_DEFAULTS.starterEnemy.hp, 1);
});

test("mapSaveToGame on an undecoded save yields a valid skeleton", () => {
    const { gameJson, sprites, warnings } = mapSaveToGame(emptyDecoded(), {
        sourceEntry: { comment: "DEZA2 SGM", filename: "DEZA2____01" },
    });
    const { ok, errors } = validateGameJson(gameJson);
    assert.deepStrictEqual(errors, []);
    assert.ok(ok);
    // The save decoded to nothing, but the player still arrives with its art.
    assert.strictEqual(sprites.length, PLAYER_FRAMES.length);
    assert.strictEqual(gameJson.meta.source, "dezaemon2");
    assert.strictEqual(gameJson.meta.sourceComment, "DEZA2 SGM");
    assert.strictEqual(gameJson.meta.sourceFilename, "DEZA2____01");
    // The skeleton is valid and playable, but it is empty — that has to be
    // said, or the import reads as a success until you press play.
    assert.ok(warnings.some((w) => w.includes("no CG/sprite data decoded")));
    assert.ok(warnings.some((w) => w.includes("no enemy table decoded")));
    assert.ok(warnings.some((w) => w.includes("nothing will spawn")));
    assert.ok(warnings.some((w) => w.includes("none of its content yet")));
});

test("a partial decode only warns about the parts that are still missing", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{ name: "zako", hp: 2 }];
    const { warnings } = mapSaveToGame(decoded);
    assert.ok(!warnings.some((w) => w.includes("no enemy table decoded")));
    assert.ok(warnings.some((w) => w.includes("no CG/sprite data decoded")));
    assert.ok(warnings.some((w) => w.includes("nothing will spawn")));
    // The catch-all only fires when nothing at all came through.
    assert.ok(!warnings.some((w) => w.includes("none of its content yet")));
});

test("mapSaveToGame is deterministic", () => {
    const a = mapSaveToGame(emptyDecoded());
    const b = mapSaveToGame(emptyDecoded());
    assert.deepStrictEqual(a, b);
});

test("enemy keys spill past enemyZ instead of the roster being cut at 26", () => {
    const decoded = emptyDecoded();
    decoded.enemies = Array.from({ length: 400 }, (_, i) => ({ name: `zako${i}`, hp: i + 1 }));
    const { gameJson, warnings } = mapSaveToGame(decoded);
    assert.strictEqual(Object.keys(gameJson.enemyData).length, 400);
    assert.strictEqual(gameJson.enemyData.enemyA.name, "zako0");
    assert.strictEqual(gameJson.enemyData.enemyZ.name, "zako25");
    assert.strictEqual(gameJson.enemyData.enemyAA.name, "zako26");
    assert.strictEqual(gameJson.enemyData.enemyOJ.name, "zako399");
    assert.ok(!warnings.some((w) => w.includes("dropped")));
    assert.ok(validateGameJson(gameJson).ok);
});

test("enemyLetters is bijective base-26 — single letters first, then two", () => {
    assert.strictEqual(enemyLetters(0), "A");
    assert.strictEqual(enemyLetters(SINGLE_LETTER_ENEMIES - 1), "Z");
    assert.strictEqual(enemyLetters(SINGLE_LETTER_ENEMIES), "AA");
    assert.strictEqual(enemyLetters(SINGLE_LETTER_ENEMIES + 1), "AB");
    assert.strictEqual(enemyLetters(701), "ZZ");
    assert.strictEqual(enemyLetters(702), "AAA");
    // no two indices ever collide, which is what keeps spawns unambiguous
    const seen = new Set();
    for (let i = 0; i < 1000; i++) seen.add(enemyLetters(i));
    assert.strictEqual(seen.size, 1000);
});

test("the save's own definition bytes travel with each enemy", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [
        { name: "zako", stage: 2, record: 7, placements: 5, bytes: new Uint8Array([0x3c, 0xb7, 0x00, 0x01]) },
    ];
    const { gameJson } = mapSaveToGame(decoded);
    assert.deepStrictEqual(gameJson.enemyData.enemyA.dezaemon, {
        stage: 2,
        record: 7,
        placements: 5,
        attributes: "3cb70001",
    });
    // ...and the attributes themselves still come from the defaults, because
    // the record's field layout is not decoded yet
    assert.strictEqual(gameJson.enemyData.enemyA.hp, BUILTIN_DEFAULTS.starterEnemy.hp);
});

test("stage rows are reversed into runtime order (last json row spawns first)", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{ name: "first" }];
    const spawnFirst = [{ enemy: 0, drop: 2 }, null, null, null, null, null, null, null];
    const spawnSecond = new Array(GRID_COLS).fill(null);
    decoded.stages = [{ rows: [spawnFirst, spawnSecond] }];
    const { gameJson } = mapSaveToGame(decoded);
    const list = gameJson.stage0.enemylist;
    assert.strictEqual(list.length, 2);
    // The first-spawned row must be LAST in the json (runtime reverses).
    assert.strictEqual(list[1][0], "A2");
    assert.deepStrictEqual(list[0], emptyWave());
});

test("all nine stages of a nine-stage save come across, each with a boss", () => {
    const decoded = emptyDecoded();
    decoded.stages = Array.from({ length: 9 }, () => ({ rows: [new Array(GRID_COLS).fill(null)] }));
    const { gameJson, warnings } = mapSaveToGame(decoded);
    const stageKeys = Object.keys(gameJson).filter((k) => k.startsWith("stage"));
    assert.strictEqual(stageKeys.length, 9);
    for (let s = 0; s < 9; s++) assert.ok(gameJson.bossData[`boss${s}`], `boss${s} missing`);
    assert.ok(!warnings.some((w) => w.includes("dropped")));
    assert.ok(validateGameJson(gameJson).ok);
});

test("only stages past the runtime's tenth are dropped, and it says so", () => {
    const decoded = emptyDecoded();
    decoded.stages = Array.from({ length: 12 }, () => ({ rows: [new Array(GRID_COLS).fill(null)] }));
    const { gameJson, warnings } = mapSaveToGame(decoded);
    assert.strictEqual(Object.keys(gameJson).filter((k) => k.startsWith("stage")).length, MAX_STAGES);
    assert.ok(warnings.some((w) => w.includes("dropped 2")));
});

test("a wide grid keeps its width, and every spawn resolves", () => {
    const decoded = emptyDecoded();
    decoded.enemies = Array.from({ length: 40 }, (_, i) => ({ name: `zako${i}` }));
    const row = new Array(14).fill(null);
    row[0] = { enemy: 39, drop: 0 };
    row[13] = { enemy: 0, drop: 9 };
    decoded.stages = [{ rows: [row], cols: 14, waveRows: [12] }];
    const { gameJson } = mapSaveToGame(decoded);
    const wave = gameJson.stage0.enemylist[0];
    assert.strictEqual(wave.length, 14);
    assert.strictEqual(wave[0], "AN0");   // index 39 -> AN
    assert.strictEqual(wave[13], "A9");
    assert.ok(validateGameJson(gameJson).ok);
});

test("wave pacing rides along, reversed in lockstep with the rows", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{ name: "only" }];
    const at = (row) => ({ rows: row.map(() => new Array(GRID_COLS).fill(null)), waveRows: row });
    decoded.stages = [at([10, 40, 41])];
    const { gameJson } = mapSaveToGame(decoded);
    // enemylist is reversed for the runtime, so waveRows must be too
    assert.deepStrictEqual(gameJson.stage0.waveRows, [41, 40, 10]);
    assert.strictEqual(gameJson.stage0.waveInterval, FRAMES_PER_SOURCE_ROW);
    assert.ok(validateGameJson(gameJson).ok);
});

test("a stage's own boss art and placement are carried over", () => {
    const decoded = emptyDecoded();
    decoded.sprites = [
        { key: "dezaBoss0_0", w: 8, h: 8, rgba: new Uint8ClampedArray(256) },
        { key: "dezaBoss0_1", w: 8, h: 8, rgba: new Uint8ClampedArray(256) },
    ];
    decoded.stages = [{ rows: [new Array(GRID_COLS).fill(null)] }, { rows: [new Array(GRID_COLS).fill(null)] }];
    decoded.bosses = [{ stage: 0, sizeClass: 2, row: 479, col: 8, spriteKeys: [0, 1] }];
    const { gameJson } = mapSaveToGame(decoded);
    assert.deepStrictEqual(gameJson.bossData.boss0.anim.idle, ["dezaBoss0_0.gif", "dezaBoss0_1.gif"]);
    assert.deepStrictEqual(gameJson.bossData.boss0.dezaemon, { sizeClass: 2, row: 479, col: 8 });
    // a stage the save gave no boss still ends, on the default one
    assert.strictEqual(gameJson.bossData.boss1.name, BUILTIN_DEFAULTS.starterBoss.name);
    assert.ok(validateGameJson(gameJson).ok);
});

test("sprite keys are sanitized, .gif-suffixed, and deduped", () => {
    const decoded = emptyDecoded();
    decoded.sprites = [
        { key: "ship a.png", w: 8, h: 8, rgba: new Uint8ClampedArray(8 * 8 * 4) },
        { key: "ship a", w: 8, h: 8, rgba: new Uint8ClampedArray(8 * 8 * 4) },
        { key: null, w: 4, h: 4, rgba: new Uint8ClampedArray(4 * 4 * 4) },
    ];
    const { sprites } = mapSaveToGame(decoded);
    // The save's sprites come first, so decoded indices keep addressing them;
    // the player's own frames are appended after.
    assert.deepStrictEqual(
        sprites.slice(0, 3).map((s) => s.key),
        ["ship_a.gif", "ship_a_2.gif", "deza_cg2.gif"]
    );
    assert.deepStrictEqual(
        sprites.slice(3).map((s) => s.key),
        PLAYER_FRAMES.map((f) => f.key)
    );
});

test("an import always flies the Duke character, whatever the defaults say", () => {
    // The editor derives `defaults` from the game that happens to be open, and
    // its player can reference frames that live only in that level's atlas —
    // which the import drops. Taking the player from there would ship an
    // invisible ship firing invisible bullets, so it comes from the built-in
    // character instead.
    const customPlayer = {
        name: "borrowed",
        maxHp: 9,
        spDamage: 1,
        defaultShootName: "normal",
        defaultShootSpeed: "speed_normal",
        texture: ["someLevelOnlyShip0.gif"],
        shootNormal: { name: "normal", damage: 1, hp: 1, interval: 5, texture: ["someLevelOnlyShot0.gif"] },
        shootBig: { name: "big", damage: 1, hp: 1, interval: 5, texture: ["someLevelOnlyShot0.gif"] },
        shoot3way: { name: "3way", damage: 1, hp: 1, interval: 5, texture: ["someLevelOnlyShot0.gif"] },
        barrier: { time: 1, texture: ["someLevelOnlyBarrier0.gif"] },
    };
    const defaults = { ...BUILTIN_DEFAULTS, playerData: customPlayer };
    const { gameJson, sprites } = mapSaveToGame(emptyDecoded(), { defaults });

    assert.deepStrictEqual(gameJson.playerData, DUKE_PLAYER);
    assert.deepStrictEqual(gameJson.playerData.texture,
        ["duke_0", "duke_1", "duke_2", "duke_3"]);
    assert.deepStrictEqual(gameJson.playerData.shootNormal.texture,
        ["bigProjectile_0.png", "bigProjectile_1.png", "bigProjectile_2.png", "bigProjectile_3.png"]);
    assert.deepStrictEqual(gameJson.playerData.shootBig.texture,
        ["bigProjectile0.png", "bigProjectile1.png", "bigProjectile2.png"]);
    assert.deepStrictEqual(gameJson.playerData.shoot3way.texture,
        ["hadoken0.png", "hadoken1.png"]);
    assert.strictEqual(gameJson.playerData.barrier.texture.length, 10);

    // Every frame it references travels with the import, or the ship, its
    // shots and its shield would all draw as nothing.
    const packed = new Set(sprites.map((s) => s.key));
    const referenced = [
        ...gameJson.playerData.texture,
        ...gameJson.playerData.shootNormal.texture,
        ...gameJson.playerData.shootBig.texture,
        ...gameJson.playerData.shoot3way.texture,
        ...gameJson.playerData.barrier.texture,
    ];
    assert.deepStrictEqual(referenced.filter((f) => !packed.has(f)), []);

    // ...and it is a copy, so editing the imported game cannot mutate the
    // character every later import is seeded from.
    gameJson.playerData.texture.push("mutated.gif");
    assert.strictEqual(DUKE_PLAYER.texture.length, 4);
    // The enemy/boss halves of `defaults` are still honoured.
    assert.strictEqual(gameJson.enemyData.enemyA.name, BUILTIN_DEFAULTS.starterEnemy.name);
});

test("the player's baked frames decode to real pixels at their atlas size", () => {
    const art = decodePlayerArt();
    assert.strictEqual(art.length, PLAYER_FRAMES.length);
    for (const f of art) {
        assert.ok(f.w > 0 && f.h > 0, `${f.key} has a size`);
        assert.strictEqual(f.rgba.length, f.w * f.h * 4);
        let opaque = 0;
        for (let p = 3; p < f.rgba.length; p += 4) if (f.rgba[p]) opaque++;
        assert.ok(opaque > 0, `${f.key} is not blank`);
    }
    // the ship, its shot and its shield, at the sizes the live game draws them
    const byKey = new Map(art.map((f) => [f.key, f]));
    assert.deepStrictEqual([byKey.get("duke_0").w, byKey.get("duke_0").h], [31, 38]);
    assert.deepStrictEqual(
        [byKey.get("bigProjectile_0.png").w, byKey.get("bigProjectile_0.png").h], [23, 8]);
    assert.deepStrictEqual(
        [byKey.get("shield0.png").w, byKey.get("shield0.png").h], [96, 96]);
});

test("New Game flies Duke, and his frames are baked in rather than referenced", () => {
    assert.strictEqual(BUILTIN_DEFAULTS.playerData, DUKE_PLAYER);
    assert.deepStrictEqual(buildBlankGame().playerData, DUKE_PLAYER);
    assert.deepStrictEqual(buildBlankGame().playerData.texture, [
        "duke_0", "duke_1", "duke_2", "duke_3",
    ]);
    // None of those live in assets/game_asset, so a caller seeding from here
    // has to add decodePlayerArt() to the atlas or the ship draws as nothing.
    const baked = new Set(decodePlayerArt().map((f) => f.key));
    const p = buildBlankGame().playerData;
    const referenced = [
        ...p.texture,
        ...p.shootNormal.texture,
        ...p.shootBig.texture,
        ...p.shoot3way.texture,
        ...p.barrier.texture,
    ];
    assert.deepStrictEqual(referenced.filter((f) => !baked.has(f)), []);
});

test("the stock Evil Invaders player stays available as the pixel-free fallback", () => {
    // src/phaser/game-objects/Player.js and Bullet.js hardcode these same keys
    // as their fallbacks, and every one is a frame in assets/game_asset.
    assert.deepStrictEqual(EVIL_INVADERS_PLAYER.texture, [
        "player00.gif", "player01.gif", "player02.gif",
        "player03.gif", "player04.gif", "player05.gif",
    ]);
});

test("enemies with decoded sprites get their texture repointed by sprite index", () => {
    const decoded = emptyDecoded();
    decoded.sprites = [{ key: "zako", w: 8, h: 8, rgba: new Uint8ClampedArray(256) }];
    decoded.enemies = [{ name: "zako", spriteKeys: [0] }];
    const { gameJson } = mapSaveToGame(decoded);
    assert.deepStrictEqual(gameJson.enemyData.enemyA.texture, ["zako.gif"]);
});

test("decoded behavior lands on the runtime fields and rides along whole", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{
        name: "zako", stage: 0, record: 3, placements: 2,
        bytes: new Uint8Array(18),
        behavior: {
            appearance: 0, hp: 15, score: 500, ground: true, speed: 0.78,
            movePattern: 6,
            fire: { type: 2, count: 1, wide: false, param: 0, mode: 0, interval: 29, window: 16, direction: 0, directionEx: 0 },
            speedChange: { enabled: false, from: 1, to: 1, step: 0, repeat: 0, trigger: 0 },
            rotation: { enabled: true, mode: 1, from: 0, to: 180, step: 1.4, repeat: 2, trigger: 0 },
            scale: { enabled: true, axes: "xy", from: 0.5, to: 2, step: 0.01, repeat: 1, repeatY: 0, trigger: 0 },
            direction: { enabled: false, from: 180, to: 180, step: 0, repeat: 0, trigger: 0 },
        },
    }];
    const { gameJson } = mapSaveToGame(decoded);
    const rec = gameJson.enemyData.enemyA;
    // the fields the Phaser runtime already reads
    assert.strictEqual(rec.hp, 15);
    assert.strictEqual(rec.score, 500);
    assert.strictEqual(rec.speed, 0.78);
    assert.strictEqual(rec.interval, 29);
    // the full record for the behavior driver
    assert.strictEqual(rec.dezaemon.behavior.rotation.to, 180);
    assert.strictEqual(rec.dezaemon.behavior.scale.axes, "xy");
    assert.strictEqual(rec.dezaemon.behavior.ground, true);
    assert.ok(validateGameJson(gameJson).ok);
});

test("fire type 0 never shoots: interval maps to -1", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{
        name: "quiet", stage: 0, record: 0, placements: 1,
        bytes: new Uint8Array(18),
        behavior: {
            appearance: 0, hp: 1, score: 50, ground: false, speed: 0,
            movePattern: 0,
            fire: { type: 0, count: 1, wide: false, param: 0, mode: 0, interval: 119, window: 29, direction: 0, directionEx: 0 },
            speedChange: { enabled: false, from: 1, to: 1, step: 0, repeat: 0, trigger: 0 },
            rotation: { enabled: false, mode: 0, from: 0, to: 0, step: 0, repeat: 0, trigger: 0 },
            scale: { enabled: false, axes: "", from: 1, to: 1, step: 0, repeat: 0, repeatY: 0, trigger: 0 },
            direction: { enabled: false, from: 180, to: 180, step: 0, repeat: 0, trigger: 0 },
        },
    }];
    const { gameJson } = mapSaveToGame(decoded);
    assert.strictEqual(gameJson.enemyData.enemyA.interval, -1);
});

test("stage backgrounds emit a valid tile grid over packed cells", () => {
    const decoded = emptyDecoded();
    decoded.stages = [{ rows: [new Array(GRID_COLS).fill(null)] }];
    decoded.bgCells = [
        { key: "dezaBgCell5", w: 16, h: 16, rgba: new Uint8ClampedArray(16 * 16 * 4) },
        { key: "dezaBgCell9", w: 16, h: 16, rgba: new Uint8ClampedArray(16 * 16 * 4) },
    ];
    const words = new Uint16Array(2 * 14).fill(0xffff);
    words[0] = 0;              // cell 0, no flips
    words[1] = 0x8001;         // cell 1, h-flipped
    decoded.bgStages = [{ rows: 2, cols: 14, words }];
    const { gameJson, sprites } = mapSaveToGame(decoded);
    assert.deepStrictEqual(gameJson.backgroundCells, ["dezaBgCell5.gif", "dezaBgCell9.gif"]);
    const bg = gameJson.stage0.background;
    assert.strictEqual(bg.rows, 2);
    assert.strictEqual(bg.cols, 14);
    // the packed cells are in the atlas sprite list
    const keys = sprites.map((s) => s.key);
    assert.ok(keys.includes("dezaBgCell5.gif"));
    assert.ok(keys.includes("dezaBgCell9.gif"));
    const v = validateGameJson(gameJson);
    assert.deepStrictEqual(v.errors, []);
    // round-trip the base64 back to the words
    const bin = Buffer.from(bg.tiles, "base64");
    assert.strictEqual((bin[0] << 8) | bin[1], 0);
    assert.strictEqual((bin[2] << 8) | bin[3], 0x8001);
    assert.strictEqual((bin[4] << 8) | bin[5], 0xffff);
});
