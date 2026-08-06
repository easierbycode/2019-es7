// Single source of truth for turning decoded Dezaemon 2 data into the level
// editor's game.json shape — used by both the CLI (--out) and the browser
// import flow, so their output is identical.
//
// Also owns buildBlankGame(), the editor's "New Game" seed: a minimal valid
// game whose every texture reference exists in the shipped atlas, so it plays
// in Phaser immediately.
//
// Schema facts this module enforces (see src/phaser/ for the runtime side):
//   - grid cells are "<UppercaseLetter><digit>" ("00" = empty), so at most 26
//     enemy types (enemyA..enemyZ) and drop digits 0-9
//   - the runtime reverses stage rows at load (the LAST json row spawns
//     first), so decoded spawn-order rows are written reversed
//   - BootScene clamps stages to stage0..stage4

export const GRID_COLS = 8;
export const MAX_STAGES = 5;
export const MAX_ENEMIES = 26;
export const BLANK_WAVES = 8;

// Default records copied from the shipped assets/game.json — every texture
// here exists in the stock game_asset atlas.
export const BUILTIN_DEFAULTS = {
    playerData: {
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
    },
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

export function emptyWave() {
    return new Array(GRID_COLS).fill("00");
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

// Map a decodeSave() result onto the editor's game.json shape.
// Returns { gameJson, sprites, warnings }; sprites is the (key-sanitized)
// list of {key, w, h, rgba} to add to the atlas.
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

    // Enemies: assign enemyA..enemyZ in order.
    const decodedEnemies = decoded.enemies || [];
    if (decodedEnemies.length > MAX_ENEMIES) {
        warnings.push(
            `save has ${decodedEnemies.length} enemy types; grid codes only support ${MAX_ENEMIES} — dropped ${decodedEnemies.length - MAX_ENEMIES}`
        );
    }
    const enemyData = {};
    const enemyLetterByIndex = [];
    decodedEnemies.slice(0, MAX_ENEMIES).forEach((e, i) => {
        const letter = String.fromCharCode(65 + i);
        enemyLetterByIndex[i] = letter;
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
        enemyData[`enemy${letter}`] = rec;
    });
    if (Object.keys(enemyData).length === 0) {
        enemyData.enemyA = clone(defaults.starterEnemy);
    }

    // Stages: decoded spawn-order rows → reversed json rows, clamped to 5.
    const decodedStages = decoded.stages || [];
    if (decodedStages.length > MAX_STAGES) {
        warnings.push(
            `save has ${decodedStages.length} stages; the runtime supports ${MAX_STAGES} (stage0..stage4) — dropped ${decodedStages.length - MAX_STAGES}`
        );
    }
    const gameJson = {};
    const stageCount = Math.max(1, Math.min(decodedStages.length, MAX_STAGES));
    for (let s = 0; s < stageCount; s++) {
        const rows = decodedStages[s] ? decodedStages[s].rows || [] : [];
        const enemylist = rows.map((row) => {
            const out = emptyWave();
            for (let c = 0; c < Math.min(GRID_COLS, row.length); c++) {
                const cell = row[c];
                if (!cell) continue;
                const letter = enemyLetterByIndex[cell.enemy];
                if (letter === undefined) {
                    warnings.push(`stage ${s}: spawn references dropped enemy #${cell.enemy} — left empty`);
                    continue;
                }
                const drop = Number.isInteger(cell.drop) && cell.drop >= 0 && cell.drop <= 9 ? cell.drop : 0;
                out[c] = `${letter}${drop}`;
            }
            return out;
        });
        // Runtime spawns the LAST json row first — decoders emit spawn order.
        enemylist.reverse();
        gameJson[`stage${s}`] = {
            enemylist: enemylist.length ? enemylist : Array.from({ length: BLANK_WAVES }, emptyWave),
        };
    }

    // One boss per stage (runtime spawns bossData["boss" + stageId]).
    const bossData = {};
    for (let s = 0; s < stageCount; s++) bossData[`boss${s}`] = clone(defaults.starterBoss);

    gameJson.playerData = clone(defaults.playerData);
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
    if (!sprites.length) {
        warnings.push(
            decodedEnemies.length
                ? "no CG/sprite data decoded for these enemies — using the default art " +
                  "(their identity and placement are real)"
                : "no CG/sprite data decoded from this save — using the default art"
        );
    }
    if (decodedEnemies.length && !decodedEnemies.some((e) => NUMERIC_ENEMY_FIELDS.some((f) => Number.isFinite(e[f])))) {
        warnings.push(
            "enemy attributes (hp/speed/interval) are not decoded yet — every imported " +
            "enemy uses the default stats"
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
    if (!sprites.length && !decodedEnemies.length && !decodedStages.length) {
        warnings.push(
            "this import carries the save's identity but none of its content yet; " +
            "decoding the section contents is still open work (see FORMAT.md)"
        );
    }

    return { gameJson, sprites, warnings };
}
