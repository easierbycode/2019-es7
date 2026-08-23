// Boss record (the enemy block's 0x40 trailer) — engine-traced decode.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";
import { decodeBossTrailer, readBossTrailer } from "../lib/decode/decode-boss.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function decodedFixture(name) {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", name)));
    const save = bup.parse(data).find((s) => s.payload);
    return decodeSave(save.payload.buffer);
}

test("an untouched (all-zero) trailer decodes to null", () => {
    assert.equal(decodeBossTrailer(new Uint8Array(0x40)), null);
});

test("ramsie stage 0's boss record decodes to the engine-verified values", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    const b = readBossTrailer(decoded.sections[5].decompressed, 0);
    assert.equal(b.sizeClass, 2);
    assert.equal(b.hpStages, 4);
    assert.equal(b.hp, 4608000);
    assert.equal(b.score, 20000);
    assert.equal(b.rotate, false);
    // HP band 1 cycles patterns 0,0,1,1; the last band pins pattern 3
    assert.deepEqual(b.playlist[0], [0, 0, 1, 1]);
    assert.deepEqual(b.playlist[3], [3, 3, 3, 3]);
    // pattern 0: two one-shot turret parts flanking the boss low, plus the
    // full-width special attack above it
    const p0 = b.patterns[0];
    assert.equal(p0.moveScript, 0);
    assert.equal(p0.moveSpeed, 2);
    assert.equal(p0.fireTickFrames, 60);
    assert.deepEqual(
        p0.firePoints.map((f) => [f.dx, f.dy, f.type]),
        [[-32, 28, 4], [30, 28, 4], [0, -25, 5]],
    );
    // record = the art band's first record + piece (group 3 = records 32-47)
    assert.deepEqual(p0.firePoints[0].spawn, { group: "zako32x32", piece: 14, record: 46, oneShot: true });
    assert.deepEqual(p0.firePoints[1].spawn, { group: "zako32x32", piece: 13, record: 45, oneShot: true });
});

test("every placed boss carries a decoded behavior record", async () => {
    const decoded = await decodedFixture("ramsie.sav");
    assert.equal(decoded.bosses.length, 5);
    for (const b of decoded.bosses) {
        assert.ok(b.behavior, `stage ${b.stage} has a boss record`);
        // the trailer's own class matches the placement id's
        assert.equal(b.behavior.sizeClass, b.sizeClass);
        assert.equal(b.behavior.patterns.length, 4);
    }
});
