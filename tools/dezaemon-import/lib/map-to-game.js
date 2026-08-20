// Single source of truth for turning decoded Dezaemon 2 data into the level
// editor's game.json shape — used by both the CLI (--out) and the browser
// import flow, so their output is identical.
//
// Also owns buildBlankGame(), the editor's "New Game" seed: a minimal valid
// game whose enemy and boss records reference the shipped atlas, so they play
// in Phaser immediately. Its player is Duke (lib/player-art.js), whose frames
// are NOT in that atlas — a caller that seeds a game from here must also add
// decodePlayerArt() to the atlas, exactly as an import does with `sprites`.
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

import { DUKE_PLAYER, decodePlayerArt } from "./player-art.js";

export { decodePlayerArt, DUKE_PLAYER };

export const GRID_COLS = 8;          // blank-game / legacy grid width
export const MAX_STAGES = 10;        // Dezaemon's own maximum, and the runtime's
export const SINGLE_LETTER_ENEMIES = 26; // enemyA..enemyZ before keys go two-wide
export const BLANK_WAVES = 8;
// Frames of play per Dezaemon scroll row. The Saturn stage is 768 rows of
// 16px scrolled at ~2px/frame, so a row is ~8 frames; at that rate an imported
// stage runs about as long as it did on hardware.
export const FRAMES_PER_SOURCE_ROW = 8;

// The engine keeps every object's durability in one shared unit: a bullet
// carries its damage in its own hp slot and collisions subtract the two
// (GAME.CMP, see FORMAT.md). Enemy LIFE therefore decodes in DAMAGE UNITS
// ([60,30,15,10,5,3,2,1]), and a standard player shot is worth roughly 20 of
// them — Lemureal Nova's max-LIFE zako die in ~3 hits on hardware, not 60.
// The Phaser runtime's shots do 1 damage each, so LIFE maps to hits here.
// Calibrated, not traced: the per-weapon damage table is still undecoded.
export const STANDARD_SHOT_DAMAGE = 20;

// Saturn zako bullets cross the playfield in a couple of seconds; the
// runtime default of 1 px/frame takes eight, and slow bullets accumulate
// into the wall you cannot dodge. Global bullet-type speeds are not decoded
// yet, so imports use one Saturn-typical speed.
export const ENEMY_BULLET_SPEED = 2.5;

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

// The historical "New Game" player: the stock Evil Invaders ship, exactly as
// the Phaser 4 runtime draws it — player00..player05 are the idle animation
// Player.js builds, shot*/shotBig* are the bullet frames Bullet.js fires for
// each shoot mode, and barrier0..3 is the shield. Every one of these frames
// ships in assets/game_asset, so a game seeded with this record needs no extra
// art at all.
//
// Nothing here seeds it any more — a blank game and an import both fly
// DUKE_PLAYER (see BUILTIN_DEFAULTS below and the playerData assignment in
// mapSaveToGame). It stays exported because it is the one player record that is
// pure atlas references, which makes it the fallback for anywhere that cannot
// ship pixels alongside the record.
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

// Enemy and boss records copied from the shipped assets/game.json — every
// texture on those two exists in the stock game_asset atlas. The player is
// Duke, and his frames do not: they ride along in decodePlayerArt().
export const BUILTIN_DEFAULTS = {
    playerData: DUKE_PLAYER,
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

// Environment-neutral base64 (Node has no btoa on old versions, browsers no
// Buffer). Used for the background tile grids.
const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function bytesToBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const a = bytes[i];
        const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
        out += B64_ALPHABET[a >> 2] + B64_ALPHABET[((a & 3) << 4) | (b >> 4)] +
            (i + 1 < bytes.length ? B64_ALPHABET[((b & 15) << 2) | (c >> 6)] : "=") +
            (i + 2 < bytes.length ? B64_ALPHABET[c & 63] : "=");
    }
    return out;
}

// Map a decodeSave() result onto the editor's game.json shape.
// Returns { gameJson, sprites, warnings }; sprites is the (key-sanitized)
// list of {key, w, h, rgba} to add to the atlas.
//
// `defaults` supplies the enemy and boss records that decoded data is layered
// onto (starterEnemy / starterBoss); the player is not taken from it — see the
// DUKE_PLAYER assignment below.
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

    // Background tiles, appended after the save's sprites so decoded sprite
    // indices stay valid. backgroundCells maps each grid ordinal to its atlas
    // frame name.
    const backgroundCells = (decoded.bgCells || []).map((cell) => {
        const key = sanitizeSpriteKey(cell.key, usedKeys);
        sprites.push({ key, w: cell.w, h: cell.h, rgba: cell.rgba });
        return key;
    });

    // The player's own frames, appended so the save's sprite indices above stay
    // valid. They keep their real names (duke_0, bigProjectile_0.png, ...): the
    // record below references them by name, and none of them collide with a
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
        // The save's own attributes, decoded from the 18-byte record
        // (decode-enemy.js). hp/score/speed/interval land on the fields the
        // runtime already reads; the full behavior record — fire config and
        // the speed/rotation/scale/direction change channels — rides on
        // dezaemon.behavior for the runtime's behavior driver.
        if (e.behavior) {
            // LIFE decodes in engine damage units; the runtime's shots do 1
            // damage, so convert to hits ([60,30,15,10,5,3,2,1] -> [3,2,1...]).
            rec.hp = Math.max(1, Math.round(e.behavior.hp / STANDARD_SHOT_DAMAGE));
            rec.score = e.behavior.score;
            // px/frame relative to the scrolling map; near-zero means the
            // enemy rides the scroll, which the runtime adds on top.
            rec.speed = Math.round(e.behavior.speed * 100) / 100;
            // Whether an enemy fires is the APPEARANCE's call (decode-enemy
            // .js); the runtime skips interval <= 0. Every fire type is a
            // volley pattern, including 0.
            rec.interval = e.behavior.fire.enabled ? e.behavior.fire.interval : -1;
            if (e.behavior.fire.enabled && rec.bulletData) {
                rec.bulletData.speed = ENEMY_BULLET_SPEED;
            }
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
            if (e.behavior) rec.dezaemon.behavior = clone(e.behavior);
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
        // The save's own scenery: a compact tile grid (u16be words, base64;
        // bits 0-9 index backgroundCells, bit15/14 = h/v flip, 0xFFFF empty).
        // The runtime composes and scrolls it in place of the stock backdrop.
        const bgStage = (decoded.bgStages || [])[s];
        if (bgStage && bgStage.words) {
            const bytes = new Uint8Array(bgStage.words.length * 2);
            bgStage.words.forEach((w, i) => {
                bytes[i * 2] = w >> 8;
                bytes[i * 2 + 1] = w & 0xff;
            });
            stage.background = {
                cols: bgStage.cols,
                rows: bgStage.rows,
                tiles: bytesToBase64(bytes),
            };
        }
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

    // Player + bullets always come from the Duke character, never from
    // `defaults`. The editor derives `defaults` from whatever game is currently
    // open, and its player may be a custom one whose frames live only in that
    // level's atlas — which the import drops when it resets the atlas to make
    // room for the save's sprites. Seeding from it would leave the imported
    // game pointing at frames that no longer exist: an invisible ship firing
    // invisible shots. This character's frames travel with it, in `sprites`.
    gameJson.playerData = clone(DUKE_PLAYER);
    if (backgroundCells.length) gameJson.backgroundCells = backgroundCells;
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
    {
        const decodedAttrs = decodedEnemies.filter((e) => e.behavior).length;
        if (decodedEnemies.length && !decodedAttrs) {
            warnings.push(
                "enemy attribute records did not decode — every imported enemy uses the default stats"
            );
        }
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
