// Executable schema for the level editor's game.json shape. Zero-dep and
// environment-neutral so the CLI tests, the browser importer, and CI can all
// share it. The canary test validates the shipped assets/game.json, keeping
// this in sync with reality.

const CELL_RE = /^(00|[A-Z][0-9])$/;
const ENEMY_KEY_RE = /^enemy[A-Z]$/;
const BOSS_KEY_RE = /^boss(\d+|Extra)$/;
const STAGE_KEY_RE = /^stage(\d+)$/;

function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isTextureArray(v) {
    return Array.isArray(v) && v.length > 0 && v.every((t) => typeof t === "string" && t.length > 0);
}

export function validateGameJson(g) {
    const errors = [];
    const warnings = [];
    const err = (m) => errors.push(m);
    const warn = (m) => warnings.push(m);

    if (!isObj(g)) {
        return { ok: false, errors: ["game.json root must be an object"], warnings };
    }

    // --- enemyData (validated first so stage cells can cross-reference) ---
    const enemyLetters = new Set();
    if (!isObj(g.enemyData)) {
        err("enemyData must be an object");
    } else {
        const keys = Object.keys(g.enemyData);
        if (keys.length > 26) err(`enemyData has ${keys.length} entries; grid codes support at most 26`);
        for (const k of keys) {
            if (!ENEMY_KEY_RE.test(k)) {
                err(`enemyData key "${k}" must match enemy[A-Z]`);
                continue;
            }
            enemyLetters.add(k.slice(-1));
            const e = g.enemyData[k];
            if (!isObj(e)) { err(`${k} must be an object`); continue; }
            // "infinity" is a runtime sentinel for indestructible enemies.
            if (!Number.isFinite(e.hp) && e.hp !== "infinity") err(`${k}.hp must be a number or "infinity"`);
            if (!Number.isFinite(e.score)) err(`${k}.score must be a number`);
            if (!isTextureArray(e.texture)) err(`${k}.texture must be a non-empty string array`);
        }
    }

    // --- stages ---
    const stageKeys = Object.keys(g).filter((k) => STAGE_KEY_RE.test(k));
    if (!g.stage0) err("stage0 is required");
    for (const k of stageKeys) {
        const num = Number(k.match(STAGE_KEY_RE)[1]);
        if (num > 4) warn(`${k} is unreachable in Phaser (BootScene clamps stages to 0..4)`);
        const st = g[k];
        if (!isObj(st) || !Array.isArray(st.enemylist) || st.enemylist.length === 0) {
            err(`${k}.enemylist must be a non-empty array of rows`);
            continue;
        }
        st.enemylist.forEach((row, r) => {
            if (!Array.isArray(row) || row.length !== 8) {
                err(`${k}.enemylist[${r}] must be an array of exactly 8 cells`);
                return;
            }
            row.forEach((cell, c) => {
                if (typeof cell !== "string" || !CELL_RE.test(cell)) {
                    err(`${k}.enemylist[${r}][${c}] = ${JSON.stringify(cell)} is not "00" or "<A-Z><0-9>"`);
                } else if (cell !== "00" && !enemyLetters.has(cell[0])) {
                    err(`${k}.enemylist[${r}][${c}] references enemy${cell[0]}, which is not in enemyData`);
                }
            });
        });
    }

    // --- playerData ---
    if (!isObj(g.playerData)) {
        err("playerData must be an object");
    } else {
        const p = g.playerData;
        if (!Number.isFinite(p.maxHp)) err("playerData.maxHp must be a number");
        if (!isTextureArray(p.texture)) err("playerData.texture must be a non-empty string array");
        for (const shoot of ["shootNormal", "shootBig", "shoot3way"]) {
            if (!isObj(p[shoot]) || !isTextureArray(p[shoot].texture)) {
                err(`playerData.${shoot} must be an object with a non-empty texture array`);
            }
        }
        if (!isObj(p.barrier) || !isTextureArray(p.barrier.texture)) {
            err("playerData.barrier must be an object with a non-empty texture array");
        }
    }

    // --- bossData ---
    if (!isObj(g.bossData)) {
        err("bossData must be an object");
    } else {
        for (const [k, b] of Object.entries(g.bossData)) {
            if (!BOSS_KEY_RE.test(k)) { err(`bossData key "${k}" must match boss<N>/bossExtra`); continue; }
            if (!isObj(b)) { err(`${k} must be an object`); continue; }
            if (!Number.isFinite(b.hp)) err(`${k}.hp must be a number`);
            if (!isObj(b.anim) || !isTextureArray(b.anim.idle)) err(`${k}.anim.idle must be a non-empty string array`);
        }
        // The runtime spawns bossData["boss"+stageId] after each stage's last wave.
        for (const k of stageKeys) {
            const num = Number(k.match(STAGE_KEY_RE)[1]);
            if (num <= 4 && !g.bossData[`boss${num}`]) warn(`${k} has no matching boss${num} — boss spawn will fail`);
        }
    }

    // --- meta ---
    if (!isObj(g.meta) || typeof g.meta.version !== "string") err("meta.version must be a string");

    return { ok: errors.length === 0, errors, warnings };
}
