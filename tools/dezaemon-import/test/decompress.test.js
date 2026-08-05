// The decompression gate: every fixture section must decode to the exact
// known region size — the sizes being identical across two DIFFERENT games is
// the smoking-gun proof that the LZSS variant is correct.

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deinterleave } from "../lib/bup-deinterleave.js";
import * as bup from "../lib/bup-parse.js";
import { parseSectionTable, isGameSave } from "../lib/payload-table.js";
import { decompress, SECTION_SIZES } from "../lib/decompress.js";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

function sectionsOf(name) {
    const [save] = bup.parse(deinterleave(fs.readFileSync(path.join(FIX, name)))).filter(isGameSave);
    const table = parseSectionTable(save.payload.buffer);
    return table.sections.map((s) => save.payload.buffer.subarray(s.offset, s.offset + s.size));
}

for (const fixture of ["ramsie.sav", "mucha-kucha.sav"]) {
    test(`all 8 sections of ${fixture} decompress to the exact known region sizes`, () => {
        const sections = sectionsOf(fixture);
        const sizes = sections.map((s) => decompress(s).length);
        assert.deepStrictEqual(sizes, SECTION_SIZES);
    });
}

test("sec4 (settings) decompresses near-identically across different games", () => {
    const a = decompress(sectionsOf("ramsie.sav")[4]);
    const b = decompress(sectionsOf("mucha-kucha.sav")[4]);
    assert.strictEqual(a.length, b.length);
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    assert.ok(diff <= 16, `expected <=16 differing bytes, got ${diff}`);
});

test("sec7 (engine table) is ~99.8% game-invariant", () => {
    const a = decompress(sectionsOf("ramsie.sav")[7]);
    const b = decompress(sectionsOf("mucha-kucha.sav")[7]);
    let same = 0;
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
    assert.ok(same / a.length > 0.99);
});

test("decompress golden spot-check: ramsie sec4 begins with the literal run", () => {
    const out = decompress(sectionsOf("ramsie.sav")[4]);
    // Compressed stream opens with flag 0xFF + these eight literals.
    assert.deepStrictEqual([...out.subarray(0, 8)], [0x80, 0x00, 0x53, 0xde, 0x3f, 0xde, 0x03, 0xde]);
});
