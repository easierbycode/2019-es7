// Dezaemon 2 stage decoder — sec5 region map and the background tilemap.
//
// sec5 is the 組み子さん (game assembly) section. Its region boundaries come
// from explicit multiplications in the engine's own code (KUMITATE/GAME
// literal pools) and tile the 396,640 bytes exactly; see FORMAT.md.
//
// The background tilemap is fully decoded: each stage owns a 0x5400-byte
// bank holding 14 columns x 768 rows of u16be words, which the editor
// presents as 48 "parts" (screens) of 16 rows each. A word of 0xFFFF is an
// empty tile; otherwise bit15 = horizontal flip, bit14 = vertical flip, and
// bits 0-9 index the 1024-cell CG space (4 pages x 256 cells of 16x16 px).
//
// Environment-neutral ESM (Node + browser).

export const SEC5_REGIONS = {
    stageBanks: { offset: 0x00000, count: 10, stride: 0x5400 },
    stageHeaders: { offset: 0x34800, count: 10, stride: 0x00c0 },
    placement: { offset: 0x34f80, count: 10, stride: 0x3c00 },
    settings: { offset: 0x5a780, count: 1, stride: 0x0060 },
    enemies: { offset: 0x5a7e0, count: 10, stride: 0x0478 },
    spriteBank: { offset: 0x5d490, count: 1, stride: 0x01d0 },
    spriteStages: { offset: 0x5d660, count: 10, stride: 0x0580 },
};

export const MAX_STAGES = 10;
export const BG_COLS = 14;
export const BG_ROWS = 768;
export const BG_ROWS_PER_PART = 16;
export const BG_PARTS = BG_ROWS / BG_ROWS_PER_PART; // 48
export const BG_EMPTY = 0xffff;

// Decode one stage's background map into {cell, hflip, vflip} entries, plus
// which of the 48 parts hold anything.
export function decodeStageBackground(sec5, stage) {
    const { offset, stride } = SEC5_REGIONS.stageBanks;
    const base = offset + stage * stride;
    const tiles = new Array(BG_COLS * BG_ROWS);
    const partUsed = new Uint8Array(BG_PARTS);
    let usedTiles = 0;
    for (let i = 0; i < tiles.length; i++) {
        const o = base + i * 2;
        const word = (sec5[o] << 8) | sec5[o + 1];
        if (word === BG_EMPTY) {
            tiles[i] = null;
            continue;
        }
        tiles[i] = {
            cell: word & 0x3ff,
            hflip: (word & 0x8000) !== 0,
            vflip: (word & 0x4000) !== 0,
        };
        usedTiles++;
        partUsed[(i / (BG_COLS * BG_ROWS_PER_PART)) | 0] = 1;
    }
    let partCount = 0;
    for (const u of partUsed) partCount += u;
    return {
        stage,
        cols: BG_COLS,
        rows: BG_ROWS,
        tiles,
        partUsed,
        partCount,
        usedTiles,
        empty: partCount === 0,
    };
}

// All stages; `stageCount` = highest non-empty stage + 1 (a game's real
// stage count — cross-checked against the disc's per-stage demo recordings).
export function decodeStages(sec5) {
    const stages = [];
    for (let s = 0; s < MAX_STAGES; s++) {
        const bg = decodeStageBackground(sec5, s);
        stages.push({
            ...bg,
            placement: decodeStagePlacement(sec5, s),
            enemies: decodeStageEnemies(sec5, s),
        });
    }
    // Stage count comes from the placement grid rather than the background
    // map: the two disagree in 6 of 17 corpus games (a stage can carry
    // objects with an unpainted background, e.g. cut-scene stages), and
    // placement agrees with the enemy blocks everywhere.
    let stageCount = 0;
    stages.forEach((s, i) => {
        if (s.placement.objects.length) stageCount = i + 1;
    });
    return { stages, stageCount };
}

// --- Enemy placement -------------------------------------------------
//
// Each stage owns a 0x3C00-byte grid of BYTES: 20 columns x 768 rows, the
// same 768 rows / 48 parts as the background map (so placement row N sits on
// background row N). The grid spans the 320px screen; the 224px playfield
// (the background's 14 columns) sits at columns 3..16. 0 means "nothing
// here"; every other byte is an object id drawn from exactly 72 values in
// eight disjoint ranges, measured over all 17 games:
//
//   0x80-0x97, 0xA0-0xA7, 0xB0-0xBF, 0xC0-0xC3, 0xD0-0xD3, 0xE0-0xE3
//       -> 60 zako slots, in the same order as the 60 enemy records
//   0xE8-0xEF -> the editor's 8 item slots
//   0xF0-0xF3 -> boss, one of 4 size classes (at most one per stage)
//
// The zako ranges map onto the per-stage enemy records at 99.9% agreement:
// of 7740 (stage, record) pairs checked, a placed id had an all-zero record
// only 8 times.

export const PLACEMENT_COLS = 20;
export const PLACEMENT_ROWS = 768;
export const PLAYFIELD_COL_START = 3;
export const PLAYFIELD_COL_END = 16;

// Zako id ranges, in record order: [firstId, count].
export const ZAKO_GROUPS = [[0x80, 24], [0xa0, 8], [0xb0, 16], [0xc0, 4], [0xd0, 4], [0xe0, 4]];
export const ZAKO_SLOT_COUNT = 60;

export function isBoss(id) {
    return id >= 0xf0 && id <= 0xf3;
}

// Map an id to its index in the 60-entry enemy record table, or -1.
export function zakoRecordIndex(id) {
    let base = 0;
    for (const [first, count] of ZAKO_GROUPS) {
        if (id >= first && id < first + count) return base + (id - first);
        base += count;
    }
    return -1;
}

export function describePlacementId(id) {
    if (isBoss(id)) return { id, kind: "boss", sizeClass: id & 0x0f, record: -1 };
    if (id >= 0xe8 && id <= 0xef) return { id, kind: "item", slot: id & 0x07, record: -1 };
    const record = zakoRecordIndex(id);
    if (record >= 0) return { id, kind: "zako", record, group: id >> 4, slot: id & 0x0f };
    // Anything else is outside the 72 observed values (two stray bytes in the
    // whole corpus); surface it rather than inventing a class.
    return { id, kind: "unknown", record: -1 };
}

// Decode one stage's placement grid into a list of placed objects, in the
// order the stage scrolls (row 0 first).
export function decodeStagePlacement(sec5, stage) {
    const { offset, stride } = SEC5_REGIONS.placement;
    const base = offset + stage * stride;
    const objects = [];
    let boss = null;
    for (let row = 0; row < PLACEMENT_ROWS; row++) {
        for (let col = 0; col < PLACEMENT_COLS; col++) {
            const id = sec5[base + row * PLACEMENT_COLS + col];
            if (!id) continue;
            const obj = { ...describePlacementId(id), row, col, part: (row / BG_ROWS_PER_PART) | 0 };
            objects.push(obj);
            if (obj.kind === "boss") boss = obj;
        }
    }
    return { stage, cols: PLACEMENT_COLS, rows: PLACEMENT_ROWS, objects, boss };
}

// --- Enemy records ----------------------------------------------------
//
// Each stage owns a 0x478 block: 60 enemy records of 18 bytes (0x438) plus a
// 0x40 trailer the play engine indexes separately. Record N defines the zako
// whose placement ids are the Nth entry of ZAKO_GROUPS order.
//
// The record is field-specialised but not yet fully mapped. Measured over
// 6799 populated records across all 17 games, 96.5% of nibbles are <= 8 and
// the per-nibble cardinalities are tight (several booleans, several 0-4
// enums, several 1-8 sliders) — matching the editor's attribute model, where
// LIFE / speed / fire timing / anim speed are 1-8 sliders and fire type is a
// 5-way choice. Per-byte distinct-value counts across the corpus are
// 200,108,138,68,94,79,16,65,14,40,51,14,33,77,12,16,72,15; the layout falls
// into a 6-byte head plus four 3-byte groups.

export const ENEMY_RECORD_SIZE = 18;
export const ENEMY_BLOCK_TRAILER = 0x40;

export function decodeStageEnemies(sec5, stage) {
    const { offset, stride } = SEC5_REGIONS.enemies;
    const base = offset + stage * stride;
    const records = [];
    for (let i = 0; i < ZAKO_SLOT_COUNT; i++) {
        const at = base + i * ENEMY_RECORD_SIZE;
        const bytes = sec5.subarray(at, at + ENEMY_RECORD_SIZE);
        let defined = false;
        for (const b of bytes) if (b) { defined = true; break; }
        records.push({ index: i, defined, bytes });
    }
    return {
        stage,
        records,
        definedCount: records.filter((r) => r.defined).length,
        trailer: sec5.subarray(base + ZAKO_SLOT_COUNT * ENEMY_RECORD_SIZE, base + stride),
    };
}

// --- Editor-facing projection -----------------------------------------
//
// Turn the decoded stages into the shape lib/map-to-game.js consumes:
// a flat enemy roster plus per-stage spawn rows in scroll order.
//
// The placement grid is 20 columns of 320px screen space with the 224px
// playfield at columns 3..16; the editor's grid is 8 columns wide, so a
// placement column is binned into the playfield's 14 columns. Rows that
// hold nothing are dropped, so a stage yields one row per populated
// scroll row, earliest first (map-to-game reverses them for the runtime).

const EDITOR_COLS = 8;

export function placementColumnToEditor(col) {
    const span = PLAYFIELD_COL_END - PLAYFIELD_COL_START + 1;
    const rel = Math.min(span - 1, Math.max(0, col - PLAYFIELD_COL_START));
    return Math.min(EDITOR_COLS - 1, Math.floor((rel * EDITOR_COLS) / span));
}

// stages -> {enemies, stages} for mapSaveToGame().
export function projectForEditor(stages) {
    // Roster: every zako record referenced anywhere, ordered by how often it
    // is placed. A game can use more enemy types than the editor's 26 letters
    // allow, and the mapper keeps the first 26 — so the busiest enemies
    // should come first, not the lowest-numbered ones. Ties break on record
    // index to keep the ordering stable.
    const uses = new Map();
    for (const st of stages) {
        for (const o of st.placement.objects) {
            if (o.kind === "zako") uses.set(o.record, (uses.get(o.record) || 0) + 1);
        }
    }
    const roster = [...uses.keys()].sort((a, b) => uses.get(b) - uses.get(a) || a - b);
    // Every stage that places each record — sprite art is per stage, so an
    // enemy can take its art from any stage that uses it.
    const stagesUsing = new Map();
    stages.forEach((st, i) => {
        for (const o of st.placement.objects) {
            if (o.kind !== "zako") continue;
            if (!stagesUsing.has(o.record)) stagesUsing.set(o.record, []);
            const list = stagesUsing.get(o.record);
            if (!list.includes(i)) list.push(i);
        }
    });
    const letterOf = new Map(roster.map((r, i) => [r, i]));
    const enemies = roster.map((r) => ({
        name: `deza${String(r).padStart(2, "0")}`,
        record: r,
        placements: uses.get(r),
    }));

    const projected = stages.map((st) => {
        const byRow = new Map();
        for (const o of st.placement.objects) {
            if (o.kind !== "zako") continue;
            const idx = letterOf.get(o.record);
            if (idx === undefined) continue;
            if (!byRow.has(o.row)) byRow.set(o.row, new Array(EDITOR_COLS).fill(null));
            byRow.get(o.row)[placementColumnToEditor(o.col)] = { enemy: idx, drop: 0 };
        }
        const rows = [...byRow.keys()].sort((a, b) => a - b).map((r) => byRow.get(r));
        return { rows, boss: st.placement.boss || null };
    });
    return { enemies, stages: projected, stagesUsing };
}

// Raw slices of the still-undecoded regions, so callers can surface them
// (and so the region math stays in one place).
export function sec5Regions(sec5) {
    return Object.entries(SEC5_REGIONS).map(([name, r]) => ({
        name,
        offset: r.offset,
        count: r.count,
        stride: r.stride,
        length: r.count * r.stride,
    }));
}
