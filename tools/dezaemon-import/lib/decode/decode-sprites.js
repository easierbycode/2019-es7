// Dezaemon 2 enemy sprite extraction.
//
// Each stage's sprite composition bank (sec5 + 0x5D660 + stage*0x580) holds
// 704 u16be cell refs = 11 slots x 64. The slots are the game's 11 character
// classes: seven zako classes (placement id high nibble 0x8..0xE) followed by
// the four boss size classes.
//
// A class's 64 refs are split evenly among that class's ids, and each id gets
// four animation frames:
//
//   class  0x8  0x9  0xA  0xB  0xC  0xD  0xE
//   ids     16    8    8   16    4    4    4
//   refs/id  4    8    8    4   16   16   16
//   cells/frame  1    2    2    1    4    4    4
//
// A frame's cells are laid out as a rectangle read row-major. Its shape comes
// from the page geometry rather than a table: the CG page is 8 cells wide, so
// a second cell at +1 means the frame is two cells wide and one at +8 means it
// is two cells tall; four cells are always 2x2. Rendering DAIOH this way
// yields its recognisable aircraft, jets and capsules animating over 4 frames.
//
// Environment-neutral ESM (Node + browser).

import { cellIndexed, indexedToRgba, CG_CELL_DIM, CG_CELLS_PER_ROW } from "./decode-cg.js";
import { SEC5_REGIONS, ZAKO_GROUPS } from "./decode-stage.js";

export const SPRITE_CLASSES = 11;
export const REFS_PER_CLASS = 64;
export const FRAMES_PER_ENEMY = 4;
// ids per zako class, indexed by (placement id high nibble - 8)
export const IDS_PER_CLASS = [16, 8, 8, 16, 4, 4, 4];
export const EMPTY_REF = 0xffff;

// Record index -> {class, slot} using the same ordering as ZAKO_GROUPS.
export function recordToClassSlot(record) {
    let base = 0;
    for (let cls = 0; cls < IDS_PER_CLASS.length; cls++) {
        const n = IDS_PER_CLASS[cls];
        if (record < base + n) return { cls, slot: record - base };
        base += n;
    }
    return null;
}

// Read one enemy's frames out of a stage's composition bank.
// Returns null when the class holds no art for that slot.
export function readEnemyFrames(sec5, stage, record) {
    const pos = recordToClassSlot(record);
    if (!pos) return null;
    const { offset, stride } = SEC5_REGIONS.spriteStages;
    const base = offset + stage * stride;
    const refsPerId = REFS_PER_CLASS / IDS_PER_CLASS[pos.cls];
    const cellsPerFrame = refsPerId / FRAMES_PER_ENEMY;
    const start = pos.cls * REFS_PER_CLASS + pos.slot * refsPerId;

    const words = [];
    for (let k = 0; k < refsPerId; k++) {
        const at = base + (start + k) * 2;
        words.push((sec5[at] << 8) | sec5[at + 1]);
    }
    if (words.every((w) => w === EMPTY_REF)) return null;

    // Frame shape from page adjacency (page is CG_CELLS_PER_ROW cells wide).
    let w = 1;
    let h = 1;
    if (cellsPerFrame === 2) {
        const a = words[0] & 0x3ff;
        const b = words[1] & 0x3ff;
        if (b === a + 1) { w = 2; h = 1; } else { w = 1; h = 2; }
    } else if (cellsPerFrame === 4) {
        w = 2;
        h = 2;
    }

    const frames = [];
    for (let f = 0; f < FRAMES_PER_ENEMY; f++) {
        const cells = words.slice(f * cellsPerFrame, (f + 1) * cellsPerFrame).map((word) => ({
            empty: word === EMPTY_REF,
            cell: word & 0x3ff,
            hflip: (word & 0x8000) !== 0,
            vflip: (word & 0x4000) !== 0,
        }));
        if (cells.every((c) => c.empty)) continue;
        frames.push({ w, h, cells });
    }
    return frames.length ? { record, cls: pos.cls, slot: pos.slot, w, h, frames } : null;
}

// Rasterise one frame to RGBA using the CG pages and palette bank.
export function renderFrame(sections, palettes, frame) {
    const pxW = frame.w * CG_CELL_DIM;
    const pxH = frame.h * CG_CELL_DIM;
    const indexed = new Uint8Array(pxW * pxH);
    frame.cells.forEach((c, i) => {
        if (c.empty) return;
        const cell = cellIndexed(sections, c.cell);
        const ox = (i % frame.w) * CG_CELL_DIM;
        const oy = ((i / frame.w) | 0) * CG_CELL_DIM;
        for (let y = 0; y < CG_CELL_DIM; y++) {
            for (let x = 0; x < CG_CELL_DIM; x++) {
                const sx = c.hflip ? CG_CELL_DIM - 1 - x : x;
                const sy = c.vflip ? CG_CELL_DIM - 1 - y : y;
                indexed[(oy + y) * pxW + ox + x] = cell[sy * CG_CELL_DIM + sx];
            }
        }
    });
    return { w: pxW, h: pxH, rgba: indexedToRgba(indexed, palettes) };
}

// The CG editor fills never-drawn cells with a placeholder glyph, and unused
// sprite slots point every ref at it. Find it as the most-referenced cell
// across the whole bank — in the sample games it is referenced hundreds of
// times, an order of magnitude more than any real sprite cell.
export function findPlaceholderCell(sec5, stageCount = 10) {
    const { offset, stride } = SEC5_REGIONS.spriteStages;
    const freq = new Map();
    for (let st = 0; st < stageCount; st++) {
        for (let i = 0; i < stride / 2; i++) {
            const at = offset + st * stride + i * 2;
            const word = ((sec5[at] << 8) | sec5[at + 1]) & 0xffff;
            if (word === EMPTY_REF) continue;
            const cell = word & 0x3ff;
            freq.set(cell, (freq.get(cell) || 0) + 1);
        }
    }
    let best = null;
    let bestN = 0;
    for (const [cell, n] of freq) if (n > bestN) { best = cell; bestN = n; }
    return { cell: best, count: bestN };
}

// A slot is "unpainted" when every one of its refs is the placeholder.
function isUnpainted(art, placeholder) {
    if (placeholder === null) return false;
    return art.frames.every((f) => f.cells.every((c) => c.empty || c.cell === placeholder));
}

// A composition's identity: the cell refs (with flips) of every frame. Two
// (stage, record) pairs that share one render to the same pixels, so they can
// share atlas frames instead of packing the same art twice — DAIOH's 327
// painted pairs collapse onto 160 distinct compositions this way.
function artSignature(art) {
    return art.frames
        .map((f) => f.cells.map((c) => (c.empty ? "-" : `${c.cell}${c.hflip ? "h" : ""}${c.vflip ? "v" : ""}`)).join(","))
        .join("|");
}

// Build the sprite list + per-enemy frame keys for the editor.
//
// `enemies` is the roster from projectForEditor() — one entry per placed
// (stage, record) pair, each carrying its own stage, so each enemy is drawn
// with the art ITS stage defines rather than whichever stage happened to come
// first. `stagesPlacing` maps a record to every stage that places it, so a
// pair whose own stage left the sprite slot unpainted still falls back to a
// stage that drew it.
//
// Returns {sprites, spriteKeysByEnemy} keyed by enemy.key ("stage:record").
export function extractEnemySprites(sec5, sections, palettes, enemies, stagesPlacing) {
    const sprites = [];
    const spriteKeysByEnemy = new Map();
    const bySignature = new Map(); // composition -> sprite indices already packed
    const placeholder = findPlaceholderCell(sec5).cell;
    for (const enemy of enemies) {
        // The enemy's own stage first; only then any other stage that places
        // the same record (art is per stage, and slots can be left unpainted).
        const fallbacks = stagesPlacing.get(enemy.record) || [];
        const candidates = [enemy.stage, ...fallbacks.filter((s) => s !== enemy.stage)];
        let art = null;
        for (const stage of candidates) {
            if (stage === undefined) continue;
            const a = readEnemyFrames(sec5, stage, enemy.record);
            if (!a) continue;
            if (!isUnpainted(a, placeholder)) { art = a; break; }
            if (!art) art = a; // remember the placeholder art as a last resort
        }
        if (!art || isUnpainted(art, placeholder)) continue;

        const sig = artSignature(art);
        const shared = bySignature.get(sig);
        if (shared) {
            spriteKeysByEnemy.set(enemy.key, shared);
            continue;
        }
        const keys = [];
        art.frames.forEach((frame, i) => {
            const { w, h, rgba } = renderFrame(sections, palettes, frame);
            // fully transparent frames add nothing to the atlas
            let opaque = false;
            for (let p = 3; p < rgba.length; p += 4) if (rgba[p]) { opaque = true; break; }
            if (!opaque) return;
            keys.push(sprites.length);
            sprites.push({ key: `${enemy.name}_${i}`, w, h, rgba });
        });
        if (!keys.length) continue;
        bySignature.set(sig, keys);
        spriteKeysByEnemy.set(enemy.key, keys);
    }
    return { sprites, spriteKeysByEnemy };
}


// --- Stage backgrounds -------------------------------------------------
//
// Each stage's background is 14x768 tiles of 16x16 CG cells (decode-stage.js).
// For the editor/runtime the tilemap is exported as (a) one RGBA sprite per
// DISTINCT cell any used stage references, and (b) a compact per-stage grid of
// words that index that list (bits 0-9 ordinal, bit15 hflip, bit14 vflip,
// 0xFFFF empty). Flips stay in the grid, so a cell mirrored both ways still
// costs one sprite.
//
// Returns {cells: [{key,w,h,rgba}], stages: [{rows, words: Uint16Array}|null]}
// where words is rows*14 long and `rows` is trimmed to the last non-empty row.
export function extractBackgroundCells(backgrounds, sections, palettes, stageCount) {
    const ordinalByCell = new Map();
    const cells = [];
    const stages = [];
    for (let s = 0; s < stageCount; s++) {
        const bg = backgrounds[s];
        if (!bg || bg.empty) { stages.push(null); continue; }
        // trim to the used extent — most stages stop well short of row 768
        let lastRow = -1;
        for (let i = 0; i < bg.tiles.length; i++) {
            if (bg.tiles[i]) lastRow = Math.max(lastRow, (i / bg.cols) | 0);
        }
        if (lastRow < 0) { stages.push(null); continue; }
        const rows = lastRow + 1;
        const words = new Uint16Array(rows * bg.cols).fill(0xffff);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < bg.cols; c++) {
                const t = bg.tiles[r * bg.cols + c];
                if (!t) continue;
                if (!ordinalByCell.has(t.cell)) {
                    ordinalByCell.set(t.cell, cells.length);
                    const indexed = cellIndexed(sections, t.cell);
                    cells.push({
                        key: `dezaBgCell${t.cell}`,
                        w: CG_CELL_DIM,
                        h: CG_CELL_DIM,
                        rgba: indexedToRgba(indexed, palettes),
                    });
                }
                words[r * bg.cols + c] = ordinalByCell.get(t.cell) |
                    (t.hflip ? 0x8000 : 0) | (t.vflip ? 0x4000 : 0);
            }
        }
        stages.push({ rows, cols: bg.cols, words });
    }
    return { cells, stages };
}

// --- Bosses -----------------------------------------------------------
//
// The composition bank's last four slots are the four boss size classes. Each
// gets the full 64 refs, so a boss frame is 16 cells — a 4x4 rectangle of
// 16x16 cells, 64x64 px — and there are four of them, same as a zako.

export const BOSS_CLASS_BASE = 7;
export const BOSS_CELLS_PER_FRAME = REFS_PER_CLASS / FRAMES_PER_ENEMY; // 16
export const BOSS_FRAME_CELLS = 4; // 4x4

// Read one stage's boss art for a given size class, or null when unpainted.
export function readBossFrames(sec5, stage, sizeClass) {
    const { offset, stride } = SEC5_REGIONS.spriteStages;
    const base = offset + stage * stride;
    const start = (BOSS_CLASS_BASE + sizeClass) * REFS_PER_CLASS;
    const words = [];
    for (let k = 0; k < REFS_PER_CLASS; k++) {
        const at = base + (start + k) * 2;
        words.push((sec5[at] << 8) | sec5[at + 1]);
    }
    if (words.every((w) => w === EMPTY_REF)) return null;
    const frames = [];
    for (let f = 0; f < FRAMES_PER_ENEMY; f++) {
        const cells = words
            .slice(f * BOSS_CELLS_PER_FRAME, (f + 1) * BOSS_CELLS_PER_FRAME)
            .map((word) => ({
                empty: word === EMPTY_REF,
                cell: word & 0x3ff,
                hflip: (word & 0x8000) !== 0,
                vflip: (word & 0x4000) !== 0,
            }));
        if (cells.every((c) => c.empty)) continue;
        frames.push({ w: BOSS_FRAME_CELLS, h: BOSS_FRAME_CELLS, cells });
    }
    return frames.length ? { stage, sizeClass, w: BOSS_FRAME_CELLS, h: BOSS_FRAME_CELLS, frames } : null;
}

// Sprites for every stage that places a boss.
// `bosses` is [{stage, sizeClass}]; returns {sprites, spriteKeysByStage}.
export function extractBossSprites(sec5, sections, palettes, bosses) {
    const sprites = [];
    const spriteKeysByStage = new Map();
    const placeholder = findPlaceholderCell(sec5).cell;
    for (const { stage, sizeClass } of bosses) {
        const art = readBossFrames(sec5, stage, sizeClass);
        if (!art || isUnpainted(art, placeholder)) continue;
        const keys = [];
        art.frames.forEach((frame, i) => {
            const { w, h, rgba } = renderFrame(sections, palettes, frame);
            let opaque = false;
            for (let p = 3; p < rgba.length; p += 4) if (rgba[p]) { opaque = true; break; }
            if (!opaque) return;
            keys.push(sprites.length);
            sprites.push({ key: `dezaBoss${stage}_${i}`, w, h, rgba });
        });
        if (keys.length) spriteKeysByStage.set(stage, keys);
    }
    return { sprites, spriteKeysByStage };
}
