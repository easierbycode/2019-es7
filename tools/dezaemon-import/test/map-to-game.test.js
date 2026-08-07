import test from "node:test";
import assert from "node:assert";
import {
    buildBlankGame,
    mapSaveToGame,
    emptyWave,
    BUILTIN_DEFAULTS,
    EVIL_INVADERS_PLAYER,
    GRID_COLS,
    MAX_ENEMIES,
    MAX_STAGES,
    BLANK_WAVES,
} from "../lib/map-to-game.js";
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
    // Every texture the blank game references comes from the shipped atlas
    // defaults, so it plays in Phaser with zero extra assets.
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
    assert.strictEqual(sprites.length, 0);
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

test("enemy overflow: only 26 letters exist, extras dropped with a warning", () => {
    const decoded = emptyDecoded();
    decoded.enemies = Array.from({ length: 30 }, (_, i) => ({ name: `zako${i}`, hp: i + 1 }));
    const { gameJson, warnings } = mapSaveToGame(decoded);
    assert.strictEqual(Object.keys(gameJson.enemyData).length, MAX_ENEMIES);
    assert.strictEqual(gameJson.enemyData.enemyA.name, "zako0");
    assert.strictEqual(gameJson.enemyData.enemyZ.name, "zako25");
    assert.ok(warnings.some((w) => w.includes("dropped 4")));
    assert.ok(validateGameJson(gameJson).ok);
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

test("stage overflow clamps to 5 with a warning; each stage gets a boss", () => {
    const decoded = emptyDecoded();
    decoded.stages = Array.from({ length: 7 }, () => ({ rows: [new Array(GRID_COLS).fill(null)] }));
    const { gameJson, warnings } = mapSaveToGame(decoded);
    const stageKeys = Object.keys(gameJson).filter((k) => k.startsWith("stage"));
    assert.strictEqual(stageKeys.length, MAX_STAGES);
    for (let s = 0; s < MAX_STAGES; s++) assert.ok(gameJson.bossData[`boss${s}`], `boss${s} missing`);
    assert.ok(warnings.some((w) => w.includes("dropped 2")));
});

test("spawns referencing dropped enemies become empty cells with warnings", () => {
    const decoded = emptyDecoded();
    decoded.enemies = [{ name: "only" }];
    decoded.stages = [{ rows: [[{ enemy: 5, drop: 0 }, { enemy: 0, drop: 9 }, null, null, null, null, null, null]] }];
    const { gameJson, warnings } = mapSaveToGame(decoded);
    assert.strictEqual(gameJson.stage0.enemylist[0][0], "00");
    assert.strictEqual(gameJson.stage0.enemylist[0][1], "A9");
    // Dropped spawns are counted, not listed one per line — a real game drops
    // hundreds and the per-spawn warnings buried every other note.
    const dropped = warnings.find((w) => w.includes("spawns reference enemies beyond"));
    assert.ok(dropped, "dropped spawns are reported");
    assert.match(dropped, /^1 spawns reference enemies beyond the 26-letter limit/);
    assert.match(dropped, /stage 0: 1/);
    assert.equal(warnings.filter((w) => w.includes("beyond the")).length, 1);
});

test("sprite keys are sanitized, .gif-suffixed, and deduped", () => {
    const decoded = emptyDecoded();
    decoded.sprites = [
        { key: "ship a.png", w: 8, h: 8, rgba: new Uint8ClampedArray(8 * 8 * 4) },
        { key: "ship a", w: 8, h: 8, rgba: new Uint8ClampedArray(8 * 8 * 4) },
        { key: null, w: 4, h: 4, rgba: new Uint8ClampedArray(4 * 4 * 4) },
    ];
    const { sprites } = mapSaveToGame(decoded);
    assert.deepStrictEqual(
        sprites.map((s) => s.key),
        ["ship_a.gif", "ship_a_2.gif", "deza_cg2.gif"]
    );
});

test("an import always flies the Evil Invaders character, whatever the defaults say", () => {
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
    const { gameJson } = mapSaveToGame(emptyDecoded(), { defaults });

    assert.deepStrictEqual(gameJson.playerData, EVIL_INVADERS_PLAYER);
    assert.deepStrictEqual(gameJson.playerData.texture, [
        "player00.gif", "player01.gif", "player02.gif",
        "player03.gif", "player04.gif", "player05.gif",
    ]);
    assert.deepStrictEqual(gameJson.playerData.shootNormal.texture,
        ["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"]);
    assert.deepStrictEqual(gameJson.playerData.shootBig.texture,
        ["shotBig00.gif", "shotBig01.gif", "shotBig02.gif", "shotBig03.gif"]);
    assert.deepStrictEqual(gameJson.playerData.shoot3way.texture,
        ["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"]);
    assert.deepStrictEqual(gameJson.playerData.barrier.texture,
        ["barrier0.gif", "barrier1.gif", "barrier2.gif", "barrier3.gif"]);
    // ...and it is a copy, so editing the imported game cannot mutate the
    // character every later import is seeded from.
    gameJson.playerData.texture.push("mutated.gif");
    assert.strictEqual(EVIL_INVADERS_PLAYER.texture.length, 6);
    // The enemy/boss halves of `defaults` are still honoured.
    assert.strictEqual(gameJson.enemyData.enemyA.name, BUILTIN_DEFAULTS.starterEnemy.name);
});

test("the Evil Invaders player matches what the Phaser runtime ships", () => {
    // src/phaser/game-objects/Player.js and Bullet.js hardcode these same keys
    // as their fallbacks, and every one is a frame in assets/game_asset.
    assert.strictEqual(BUILTIN_DEFAULTS.playerData, EVIL_INVADERS_PLAYER);
    assert.deepStrictEqual(buildBlankGame().playerData, EVIL_INVADERS_PLAYER);
});

test("enemies with decoded sprites get their texture repointed by sprite index", () => {
    const decoded = emptyDecoded();
    decoded.sprites = [{ key: "zako", w: 8, h: 8, rgba: new Uint8ClampedArray(256) }];
    decoded.enemies = [{ name: "zako", spriteKeys: [0] }];
    const { gameJson } = mapSaveToGame(decoded);
    assert.deepStrictEqual(gameJson.enemyData.enemyA.texture, ["zako.gif"]);
});
