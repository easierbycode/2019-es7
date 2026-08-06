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

// Build the sprite list + per-enemy frame keys for the editor.
//
// `enemies` is the roster from projectForEditor(); `stagesPlacing` maps a
// record to every stage that places it, so an enemy whose first stage left the
// slot unpainted still picks up art from a stage that drew it.
// Returns {sprites, spriteKeysByRecord}.
export function extractEnemySprites(sec5, sections, palettes, enemies, stagesPlacing) {
    const sprites = [];
    const spriteKeysByRecord = new Map();
    const placeholder = findPlaceholderCell(sec5).cell;
    for (const enemy of enemies) {
        const candidates = stagesPlacing.get(enemy.record);
        if (!candidates || !candidates.length) continue;
        let art = null;
        for (const stage of candidates) {
            const a = readEnemyFrames(sec5, stage, enemy.record);
            if (!a) continue;
            if (!isUnpainted(a, placeholder)) { art = a; break; }
            if (!art) art = a; // remember the placeholder art as a last resort
        }
        if (!art || isUnpainted(art, placeholder)) continue;
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
        if (keys.length) spriteKeysByRecord.set(enemy.record, keys);
    }
    return { sprites, spriteKeysByRecord };
}
