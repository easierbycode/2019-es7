// Single source of truth for turning decoded Dezaemon 2 data into the level
// editor's game.json shape — used by both the CLI (--out) and the browser
// import flow, so their output is identical.
//
// Also owns buildBlankGame(), the editor's "New Game" seed: a minimal valid
// game whose every texture reference exists in the shipped atlas, so it plays
// in Phaser immediately.
//
// Schema facts this module enforces (see src/phaser/ for the runtime side):
//   - grid cells are "<UppercaseLetters><digit>" ("00" = empty). One letter is
//     the historical form (enemyA..enemyZ); keys spill into two letters
//     (enemyAA, enemyAB, ...) past 26, which is what lets a save keep all of
//     its enemy types instead of the first 26
//   - a stage's rows all have the same width; 8 is the historical width and
//     an import uses the Saturn playfield's own 14 columns
//   - the runtime reverses stage rows at load (the LAST json row spawns
//     first), so decoded spawn-order rows are written reversed — `waveRows`
//     is reversed in lockstep so a wave keeps the scroll row it came from
//   - BootScene plays stage0..stage9

import { MUTOID_PLAYER, decodePlayerArt } from "./player-art.js";

export { MUTOID_PLAYER, decodePlayerArt };

export const GRID_COLS = 8;          // blank-game / legacy grid width
export const MAX_STAGES = 10;        // Dezaemon's own maximum, and the runtime's
export const SINGLE_LETTER_ENEMIES = 26; // enemyA..enemyZ before keys go two-wide
export const BLANK_WAVES = 8;
// Frames of play per Dezaemon scroll row. The Saturn stage is 768 rows of
// 16px scrolled at ~2px/frame, so a row is ~8 frames; at that rate an imported
// stage runs about as long as it did on hardware.
export const FRAMES_PER_SOURCE_ROW = 8;

// Bijective base-26: 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB, 701 -> ZZ, 702 -> AAA.
// Single letters first, so a small roster is byte-for-byte what it always was.
export function enemyLetters(index) {
    let n = index;
    let out = "";
    do {
        out = String.fromCharCode(65 + (n % 26)) + out;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return out;
}

// The Evil Invaders player character, exactly as the Phaser 4 runtime draws
// it: player00..player05 are the idle animation Player.js builds, shot*/shotBig*
// are the bullet frames Bullet.js fires for each shoot mode, and barrier0..3 is
// the shield. Every one of these frames ships in assets/game_asset — the atlas
// BootScene loads — so a game seeded with this record plays with no extra art.
//
// This is the "New Game" character. A .sav IMPORT flies MUTOID_PLAYER instead
// (lib/player-art.js) — see the playerData assignment in mapSaveToGame.
export const EVIL_INVADERS_PLAYER = {
    name: "G",
    maxHp: 3,
    spDamage: 50,
    defaultShootName: "normal",
    defaultShootSpeed: "speed_normal",
    texture: ["player00.gif", "player01.gif", "player02.gif", "player03.gif", "player04.gif", "player05.gif"],
    shootNormal: {
        name: "normal", damage: 1, hp: 1, interval: 23,
        texture: ["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"],
    },
    shootBig: {
        name: "big", damage: 2, hp: 100, interval: 39,
        texture: ["shotBig00.gif", "shotBig01.gif", "shotBig02.gif", "shotBig03.gif"],
    },
    shoot3way: {
        name: "3way", damage: 1, hp: 1, interval: 31,
        texture: ["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"],
    },
    barrier: {
        time: 4,
        texture: ["barrier0.gif", "barrier1.gif", "barrier2.gif", "barrier3.gif"],
    },
};

// Default records copied from the shipped assets/game.json — every texture
// here exists in the stock game_asset atlas.
export const BUILTIN_DEFAULTS = {
    playerData: EVIL_INVADERS_PLAYER,
    starterEnemy: {
        name: "soliderA",
        score: 100,
        spgage: 4,
        hp: 1,
        speed: 0.8,
        interval: 300,
        texture: ["soliderA0.gif", "soliderA1.gif", "soliderA2.gif"],
        shadowReverse: true,
        shadowOffsetY: 10,
        bulletData: {
            score: 100, spgage: 2, hp: 1, speed: 1, damage: 1,
            texture: ["normalProjectile0.gif", "normalProjectile1.gif", "normalProjectile2.gif"],
        },
    },
    starterBoss: {
        name: "bison",
        score: 2200,
        spgage: 30,
        hp: 150,
        interval: 100,
        shadowReverse: true,
        shadowOffsetY: 50,
        anim: {
            idle: ["bison_idle0.gif", "bison_idle1.gif", "bison_idle2.gif", "bison_idle3.gif"],
            attack: ["bison_attack0.gif", "bison_attack1.gif"],
        },
        bulletData: {},
    },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export function emptyWave(cols = GRID_COLS) {
    return new Array(cols).fill("00");
}

// Minimal valid game: one stage of empty waves, the starter player/enemy/boss.
export function buildBlankGame(defaults = BUILTIN_DEFAULTS) {
    return {
        stage0: { enemylist: Array.from({ length: BLANK_WAVES }, emptyWave) },
        playerData: clone(defaults.playerData),
        enemyData: { enemyA: clone(defaults.starterEnemy) },
        bossData: { boss0: clone(defaults.starterBoss) },
        meta: { version: "1.0" },
        continueComment: "",
        continueCommentEn: "",
    };
}

function sanitizeSpriteKey(raw, used) {
    let base = String(raw || "sprite").replace(/\.(gif|png)$/i, "").replace(/[^A-Za-z0-9_-]/g, "_");
    if (!base) base = "sprite";
    let key = `${base}.gif`;
    for (let n = 2; used.has(key); n++) key = `${base}_${n}.gif`;
    used.add(key);
    return key;
}

const NUMERIC_ENEMY_FIELDS = ["score", "spgage", "hp", "speed", "interval", "shadowOffsetY"];

const toHex = (bytes) =>
    bytes ? Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("") : null;

// Map a decodeSave() result onto the editor's game.json shape.
// Returns { gameJson, sprites, warnings }; sprites is the (key-sanitized)
// list of {key, w, h, rgba} to add to the atlas.
//
// `defaults` supplies the enemy and boss records that decoded data is layered
// onto (starterEnemy / starterBoss); the player is not taken from it — see the
// EVIL_INVADERS_PLAYER assignment below.
export function mapSaveToGame(decoded, { defaults = BUILTIN_DEFAULTS, sourceEntry = null, importedAt = null } = {}) {
    const warnings = [];
    const usedKeys = new Set();

    // Sprites: sanitize + dedupe keys, keep .gif suffix (legacy atlas naming).
    const spriteKeyByIndex = [];
    const sprites = (decoded.sprites || []).map((s, i) => {
        const key = sanitizeSpriteKey(s.key || `deza_cg${i}`, usedKeys);
        spriteKeyByIndex[i] = key;
        return { key, w: s.w, h: s.h, rgba: s.rgba };
    });

    // The player's own frames, appended so the save's sprite indices above stay
    // valid. They keep their real names (cyberLiberty0.png, hadoken0.png, ...):
    // the record below references them by name, and none of them collide with a
    // frame in the stock game_asset atlas.
    const playerArt = decodePlayerArt();
    for (const frame of playerArt) {
        usedKeys.add(frame.key);
        sprites.push(frame);
    }

    // Enemies: one key per decoded type, enemyA..enemyZ then enemyAA onwards.
    // Nothing is rationed — a save's whole roster comes across.
    const decodedEnemies = decoded.enemies || [];
    const enemyData = {};
    const enemyLetterByIndex = [];
    decodedEnemies.forEach((e, i) => {
        const letters = enemyLetters(i);
        enemyLetterByIndex[i] = letters;
        const rec = clone(defaults.starterEnemy);
        if (e.name != null) rec.name = String(e.name);
        for (const f of NUMERIC_ENEMY_FIELDS) {
            if (Number.isFinite(e[f])) rec[f] = e[f];
        }
        if (Array.isArray(e.spriteKeys) && e.spriteKeys.length) {
            rec.texture = e.spriteKeys.map((idx) =>
                typeof idx === "number" ? (spriteKeyByIndex[idx] || rec.texture[0]) : String(idx)
            );
        }
        // The save's own definition, verbatim. hp/speed/interval above still
        // come from the defaults because the 18-byte record's fields are not
        // named yet (FORMAT.md) — but the bytes are here rather than gone, so
        // the attributes can be filled in later without re-importing, and two
        // enemies that differ only in their attributes stay distinguishable.
        if (e.bytes || e.stage !== undefined) {
            rec.dezaemon = {
                stage: e.stage,
                record: e.record,
                placements: e.placements,
                attributes: toHex(e.bytes),
            };
        }
        enemyData[`enemy${letters}`] = rec;
    });
    if (Object.keys(enemyData).length === 0) {
        enemyData.enemyA = clone(defaults.starterEnemy);
    }

    // Stages: decoded spawn-order rows -> reversed json rows. Every stage the
    // save defines is emitted; the runtime plays stage0..stage9.
    const decodedStages = decoded.stages || [];
    if (decodedStages.length > MAX_STAGES) {
        warnings.push(
            `save has ${decodedStages.length} stages; the runtime plays ${MAX_STAGES} (stage0..stage${MAX_STAGES - 1}) — dropped ${decodedStages.length - MAX_STAGES}`
        );
    }
    const gameJson = {};
    const stageCount = Math.max(1, Math.min(decodedStages.length, MAX_STAGES));
    for (let s = 0; s < stageCount; s++) {
        const decodedStage = decodedStages[s] || {};
        const rows = decodedStage.rows || [];
        const cols = decodedStage.cols || (rows[0] ? rows[0].length : GRID_COLS);
        const enemylist = rows.map((row) => {
            const out = emptyWave(cols);
            for (let c = 0; c < Math.min(cols, row.length); c++) {
                const cell = row[c];
                if (!cell) continue;
                const letters = enemyLetterByIndex[cell.enemy];
                if (letters === undefined) continue;
                const drop = Number.isInteger(cell.drop) && cell.drop >= 0 && cell.drop <= 9 ? cell.drop : 0;
                out[c] = `${letters}${drop}`;
            }
            return out;
        });
        // Runtime spawns the LAST json row first — decoders emit spawn order.
        enemylist.reverse();
        const stage = {
            enemylist: enemylist.length ? enemylist : Array.from({ length: BLANK_WAVES }, () => emptyWave(cols)),
        };
        // Pacing: the scroll row each wave came from, reversed in lockstep with
        // enemylist. Without it every wave is evenly spaced and a stage's
        // rhythm — gaps of anywhere from 1 to 177 rows — is lost.
        if (Array.isArray(decodedStage.waveRows) && decodedStage.waveRows.length === rows.length && rows.length) {
            stage.waveRows = decodedStage.waveRows.slice().reverse();
            stage.waveInterval = FRAMES_PER_SOURCE_ROW;
        }
        if (decodedStage.items && decodedStage.items.length) stage.items = decodedStage.items;
        gameJson[`stage${s}`] = stage;
    }

    // One boss per stage (runtime spawns bossData["boss" + stageId]). Stages
    // whose save places a boss get its own art; the rest keep the default so
    // the stage still ends.
    const bossData = {};
    const bossByStage = new Map((decoded.bosses || []).map((b) => [b.stage, b]));
    for (let s = 0; s < stageCount; s++) {
        const rec = clone(defaults.starterBoss);
        const decodedBoss = bossByStage.get(s);
        if (decodedBoss) {
            rec.dezaemon = { sizeClass: decodedBoss.sizeClass, row: decodedBoss.row, col: decodedBoss.col };
            if (Array.isArray(decodedBoss.spriteKeys) && decodedBoss.spriteKeys.length) {
                const frames = decodedBoss.spriteKeys
                    .map((idx) => spriteKeyByIndex[idx])
                    .filter(Boolean);
                if (frames.length) {
                    rec.name = `dezaBoss${s}`;
                    rec.anim = { idle: frames, attack: frames.slice(0, Math.max(1, frames.length - 1)) };
                }
            }
        }
        bossData[`boss${s}`] = rec;
    }

    // Player + bullets always come from the Mutoid character, never from
    // `defaults`. The editor derives `defaults` from whatever game is currently
    // open, and its player may be a custom one whose frames live only in that
    // level's atlas — which the import drops when it resets the atlas to make
    // room for the save's sprites. Seeding from it would leave the imported
    // game pointing at frames that no longer exist: an invisible ship firing
    // invisible shots. This character's frames travel with it, in `sprites`.
    gameJson.playerData = clone(MUTOID_PLAYER);
    gameJson.enemyData = enemyData;
    gameJson.bossData = bossData;
    gameJson.meta = { version: "1.0", source: "dezaemon2" };
    if (decoded.title) gameJson.meta.sourceTitle = decoded.title;
    if (sourceEntry) {
        gameJson.meta.sourceComment = sourceEntry.comment;
        gameJson.meta.sourceFilename = sourceEntry.filename;
    }
    if (importedAt) gameJson.meta.importedAt = importedAt;
    gameJson.continueComment = "";
    gameJson.continueCommentEn = "";

    // A save can parse perfectly — container, block chain, section table,
    // decompression — and still yield less than the whole game, because parts
    // of the section *meaning* are still being reverse-engineered (FORMAT.md,
    // "sec5 region map"). Falling back to engine defaults without saying so
    // looks like a successful import right up until you press play, so name
    // each gap.
    // Counted from the save, not from `sprites` — that list always carries the
    // player's own frames, so it is never empty.
    const savedSprites = (decoded.sprites || []).length;
    if (!savedSprites) {
        warnings.push(
            decodedEnemies.length
                ? "no CG/sprite data decoded for these enemies — using the default art " +
                  "(their identity and placement are real)"
                : "no CG/sprite data decoded from this save — using the default art"
        );
    }
    if (decodedEnemies.length && !decodedEnemies.some((e) => NUMERIC_ENEMY_FIELDS.some((f) => Number.isFinite(e[f])))) {
        const carried = decodedEnemies.filter((e) => e.bytes).length;
        warnings.push(
            "enemy attributes (hp/speed/interval) have no field names yet, so every enemy " +
            "plays with the default stats — but " +
            (carried
                ? `each one's 18-byte definition is stored verbatim on enemyData.*.dezaemon.attributes (${carried} records), so nothing is lost`
                : "no definition bytes came through for them")
        );
    }
    if (!decodedEnemies.length) {
        warnings.push("no enemy table decoded from this save — using the default starter enemy");
    }
    if (!decodedStages.length) {
        warnings.push(
            "no stage layout decoded from this save — every wave is empty, so nothing will spawn"
        );
    }
    if (!savedSprites && !decodedEnemies.length && !decodedStages.length) {
        warnings.push(
            "this import carries the save's identity but none of its content yet; " +
            "decoding the section contents is still open work (see FORMAT.md)"
        );
    }

    return { gameJson, sprites, warnings };
}
