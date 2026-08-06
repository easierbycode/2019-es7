// Stage decoder tests — sec5 region map + background tilemaps.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";
import {
    SEC5_REGIONS,
    decodeStageBackground,
    decodeStages,
    BG_COLS,
    BG_ROWS,
    BG_PARTS,
    describePlacementId,
    placementColumnToEditor,
} from "../lib/decode/decode-stage.js";
import { SECTION_SIZES } from "../lib/decompress.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function decodedFixture(name) {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", name)));
    const save = bup.parse(data).find((s) => s.payload);
    return decodeSave(save.payload.buffer);
}

test("sec5 regions tile the section exactly, with no gaps", () => {
    const ordered = Object.values(SEC5_REGIONS).sort((a, b) => a.offset - b.offset);
    let cursor = 0;
    for (const r of ordered) {
        assert.equal(r.offset, cursor, "region must start where the previous one ended");
        cursor = r.offset + r.count * r.stride;
    }
    assert.equal(cursor, SECTION_SIZES[5]);
});

test("background map geometry: 14 x 768 = 48 parts of 16 rows per stage bank", () => {
    assert.equal(BG_COLS * BG_ROWS * 2, SEC5_REGIONS.stageBanks.stride);
    assert.equal(BG_PARTS, 48);
});

test("ramsie decodes 5 stages of background art", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    assert.equal(decoded.confidence.backgrounds, "confirmed");
    assert.equal(decoded.stageCount, 5);
    // parts used per stage, measured from the corpus (stages 5-9 unused)
    assert.deepEqual(
        decoded.backgrounds.map((b) => b.partCount),
        [31, 29, 46, 32, 12, 0, 0, 0, 0, 0],
    );
    assert.ok(decoded.regions.find((r) => r.name.startsWith("sec5")).decoded);
});

test("tile words: 0xFFFF is empty, bit15/bit14 are flips, bits 0-9 the cell", () => {
    const sec5 = new Uint8Array(SECTION_SIZES[5]).fill(0xff);
    const put = (i, word) => {
        sec5[i * 2] = word >> 8;
        sec5[i * 2 + 1] = word & 0xff;
    };
    put(0, 0x0123); // plain cell 0x123
    put(1, 0x8123); // h-flipped
    put(2, 0x4123); // v-flipped
    put(3, 0xffff); // empty
    const bg = decodeStageBackground(sec5, 0);
    assert.deepEqual(bg.tiles[0], { cell: 0x123, hflip: false, vflip: false });
    assert.deepEqual(bg.tiles[1], { cell: 0x123, hflip: true, vflip: false });
    assert.deepEqual(bg.tiles[2], { cell: 0x123, hflip: false, vflip: true });
    assert.equal(bg.tiles[3], null);
    assert.equal(bg.usedTiles, 3);
    assert.equal(bg.partCount, 1); // all three live in part 0
});

test("placement ids map to 60 zako records, 8 items and 4 bosses", () => {
    // the 60 zako ids run 0x80-0x97, 0xA0-0xA7, 0xB0-0xBF, 0xC0-0xC3, 0xD0-0xD3, 0xE0-0xE3
    assert.equal(describePlacementId(0x80).record, 0);
    assert.equal(describePlacementId(0x97).record, 23);
    assert.equal(describePlacementId(0xa0).record, 24);
    assert.equal(describePlacementId(0xb0).record, 32);
    assert.equal(describePlacementId(0xe3).record, 59);
    // every zako id maps to a distinct record, covering 0..59 exactly
    const records = new Set();
    for (let id = 0x80; id <= 0xff; id++) {
        const d = describePlacementId(id);
        if (d.kind === "zako") records.add(d.record);
    }
    assert.equal(records.size, 60);
    assert.deepEqual([...records].sort((a, b) => a - b), [...Array(60).keys()]);
    // items and bosses are not enemies
    assert.deepEqual(describePlacementId(0xe8), { id: 0xe8, kind: "item", slot: 0, record: -1 });
    assert.deepEqual(describePlacementId(0xf3), { id: 0xf3, kind: "boss", sizeClass: 3, record: -1 });
    // gaps between the ranges are unknown, not silently mapped
    assert.equal(describePlacementId(0x98).kind, "unknown");
    assert.equal(describePlacementId(0x30).kind, "unknown");
});

test("ramsie stage 0: placed enemies plus exactly one boss", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    const s0 = decoded.backgrounds[0].placement;
    assert.equal(s0.cols, 20);
    assert.equal(s0.rows, 768);
    assert.equal(s0.objects.length, 270);
    assert.equal(s0.boss.kind, "boss");
    assert.equal(s0.boss.sizeClass, 2);
    assert.equal(s0.boss.row, 423);
    // one boss per stage, and it appears late in the level
    for (const st of decoded.backgrounds.slice(0, decoded.stageCount)) {
        const bosses = st.placement.objects.filter((o) => o.kind === "boss");
        assert.ok(bosses.length <= 1, "a stage never has more than one boss marker");
        if (bosses.length) assert.ok(bosses[0].row > 200);
    }
    // objects come out in scroll order
    const rows = s0.objects.map((o) => o.row);
    assert.deepEqual(rows, [...rows].sort((a, b) => a - b));
});

test("ramsie projects into an editor-ready roster and spawn rows", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    // roster is ordered by how often each enemy is placed, so the editor's
    // 26-letter cap keeps the busiest enemies
    assert.ok(decoded.enemies.length > 26, "ramsie uses more enemy types than the cap");
    const counts = decoded.enemies.map((e) => e.placements);
    assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
    assert.equal(decoded.stages.length, decoded.stageCount);
    // stage 0 yields real spawn rows, earliest first, 8 columns wide
    const rows = decoded.stages[0].rows;
    assert.ok(rows.length > 50);
    for (const row of rows) {
        assert.equal(row.length, 8);
        assert.ok(row.some((c) => c !== null), "a row is only emitted when it holds something");
        for (const cell of row) {
            if (!cell) continue;
            assert.ok(cell.enemy >= 0 && cell.enemy < decoded.enemies.length);
        }
    }
});

test("placement columns fold the playfield onto the editor's 8 columns", () => {
    // columns 3..16 are the 224px playfield; everything maps inside 0..7
    for (let col = 0; col < 20; col++) {
        const e = placementColumnToEditor(col);
        assert.ok(e >= 0 && e <= 7, `column ${col} -> ${e}`);
    }
    assert.equal(placementColumnToEditor(3), 0);
    assert.equal(placementColumnToEditor(16), 7);
    // the mapping is monotonic across the playfield
    let prev = -1;
    for (let col = 3; col <= 16; col++) {
        const e = placementColumnToEditor(col);
        assert.ok(e >= prev);
        prev = e;
    }
});

test("a save with no placed objects reports zero stages", () => {
    // 0xFF fills the background banks (0xFFFF = empty tile); the placement
    // grid is byte-valued, so an empty grid is zero-filled.
    const sec5 = new Uint8Array(SECTION_SIZES[5]).fill(0xff);
    const pl = SEC5_REGIONS.placement;
    sec5.fill(0, pl.offset, pl.offset + pl.count * pl.stride);
    const { stages, stageCount } = decodeStages(sec5);
    assert.equal(stageCount, 0);
    assert.ok(stages.every((s) => s.empty && s.usedTiles === 0));
    assert.ok(stages.every((s) => s.placement.objects.length === 0));
});
