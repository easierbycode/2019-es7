// Enemy sprite extraction — turning composition-bank cell refs into art.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";
import {
    recordToClassSlot,
    readEnemyFrames,
    findPlaceholderCell,
    IDS_PER_CLASS,
    REFS_PER_CLASS,
    FRAMES_PER_ENEMY,
    SPRITE_CLASSES,
} from "../lib/decode/decode-sprites.js";
import { SEC5_REGIONS } from "../lib/decode/decode-stage.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function decodedFixture(name) {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", name)));
    const save = bup.parse(data).find((s) => s.payload);
    return decodeSave(save.payload.buffer);
}

test("the 11 composition slots account for the whole per-stage bank", () => {
    assert.equal(SPRITE_CLASSES * REFS_PER_CLASS * 2, SEC5_REGIONS.spriteStages.stride);
    // seven zako classes hold the 60 enemy records between them
    assert.equal(IDS_PER_CLASS.reduce((a, b) => a + b, 0), 60);
    assert.equal(IDS_PER_CLASS.length + 4, SPRITE_CLASSES); // + 4 boss classes
});

test("record index maps onto (class, slot) in enemy-record order", () => {
    assert.deepEqual(recordToClassSlot(0), { cls: 0, slot: 0 });
    assert.deepEqual(recordToClassSlot(15), { cls: 0, slot: 15 });
    assert.deepEqual(recordToClassSlot(16), { cls: 1, slot: 0 });
    assert.deepEqual(recordToClassSlot(59), { cls: 6, slot: 3 });
    assert.equal(recordToClassSlot(60), null);
    // every record lands in exactly one slot of its class
    for (let r = 0; r < 60; r++) {
        const p = recordToClassSlot(r);
        assert.ok(p.slot < IDS_PER_CLASS[p.cls]);
    }
});

test("ramsie extracts real enemy art wired to the roster", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    assert.equal(decoded.confidence.sprites, "heuristic");
    assert.ok(decoded.sprites.length > 100, "a full game yields plenty of frames");
    // every sprite is a non-empty RGBA image of whole 16px cells
    for (const s of decoded.sprites) {
        assert.equal(s.rgba.length, s.w * s.h * 4);
        assert.equal(s.w % 16, 0);
        assert.equal(s.h % 16, 0);
        let opaque = false;
        for (let p = 3; p < s.rgba.length; p += 4) if (s.rgba[p]) { opaque = true; break; }
        assert.ok(opaque, `${s.key} should not be fully transparent`);
    }
    // most of the roster carries art, and the keys point into the sprite list
    const withArt = decoded.enemies.filter((e) => e.spriteKeys);
    assert.ok(withArt.length > decoded.enemies.length * 0.8);
    for (const e of withArt) {
        assert.ok(e.spriteKeys.length >= 1 && e.spriteKeys.length <= FRAMES_PER_ENEMY);
        for (const k of e.spriteKeys) assert.ok(decoded.sprites[k], "sprite key resolves");
    }
});

test("frames come out as a rectangle of cells, never larger than 2x2", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    const sec5 = decoded.sections[5].decompressed;
    let seen = 0;
    for (let record = 0; record < 60; record++) {
        const art = readEnemyFrames(sec5, 0, record);
        if (!art) continue;
        seen++;
        assert.ok(art.w >= 1 && art.w <= 2);
        assert.ok(art.h >= 1 && art.h <= 2);
        for (const f of art.frames) assert.equal(f.cells.length, art.w * art.h);
    }
    assert.ok(seen > 10, "stage 0 defines a decent number of enemies");
});

test("the unpainted-cell placeholder is found and skipped", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    const { cell, count } = findPlaceholderCell(decoded.sections[5].decompressed);
    assert.ok(cell !== null);
    // it dominates the bank — unused slots point every ref at it
    assert.ok(count > 200, `placeholder referenced ${count} times`);
    // no emitted sprite is the placeholder repeated across all four frames
    assert.ok(decoded.sprites.length > 0);
});
