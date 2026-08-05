import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detect, deinterleave } from "../lib/bup-deinterleave.js";
import { normalize, isGzip } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");
const load = (name) => fs.readFileSync(path.join(FIX, name));

test("detects interleaved cartridge dump", () => {
    const raw = load("ramsie.sav");
    assert.strictEqual(detect(raw), true);
    assert.strictEqual(raw.length, 1114112);
    const data = deinterleave(raw);
    assert.strictEqual(data.length, 557056);
});

test("deinterleave is idempotent on already-logical data", () => {
    const data = deinterleave(load("ramsie.sav"));
    assert.strictEqual(detect(data), false);
    assert.strictEqual(deinterleave(data).length, data.length);
});

test("detects the two partitions of a hardware-style cart dump", () => {
    const data = deinterleave(load("ramsie.sav"));
    const parts = bup.detectPartitions(data);
    assert.deepStrictEqual(parts, [
        { base: 0x0, size: 0x8000, blockSize: 64 },
        { base: 0x8000, size: 0x80000, blockSize: 512 },
    ]);
});

test("parses Ramsie directory entry with block-accurate payload", () => {
    const [save] = bup.parse(deinterleave(load("ramsie.sav")));
    assert.strictEqual(save.offset, 0x8400);
    assert.strictEqual(save.filename, "DEZA2____01");
    assert.strictEqual(save.comment, "DEZA2 SGM");
    assert.strictEqual(save.language, 0);
    assert.strictEqual(save.datasize, 167511);
    assert.strictEqual(bup.bupDateToDate(save.date).getUTCFullYear(), 2007);
    // Block chain: 331 sequential blocks 3..333 in the 0x8000 partition.
    assert.strictEqual(save.partition.base, 0x8000);
    assert.strictEqual(save.partition.blockSize, 512);
    assert.strictEqual(save.blocks.length, 331);
    assert.strictEqual(save.blocks[0], 3);
    assert.strictEqual(save.blocks[save.blocks.length - 1], 333);
    assert.strictEqual(save.payloadError, null);
    assert.strictEqual(save.payload.start, 0x86be);
    assert.strictEqual(save.payload.buffer.length, 167511);
});

test("parses Mucha Kucha Fighter directory entry", () => {
    const [save] = bup.parse(deinterleave(load("mucha-kucha.sav")));
    assert.strictEqual(save.filename, "DEZA2____01");
    assert.strictEqual(save.comment, "MuchaKucha");
    assert.strictEqual(save.language, 5);
    assert.strictEqual(save.datasize, 154015);
    assert.strictEqual(save.blocks.length, 304);
    assert.strictEqual(save.payload.start, 0x8688);
    assert.strictEqual(save.payload.buffer.length, 154015);
});

test("rejects non-Saturn data", () => {
    assert.throws(() => bup.parse(new Uint8Array(1024)), /BackUpRam Format/);
});

test("normalize gunzips Mednafen .bcr cart saves", async () => {
    const raw = load("baseline-cart.bcr");
    assert.strictEqual(isGzip(raw), true);
    const { kind, data } = await normalize(raw);
    assert.strictEqual(kind, "gzip");
    assert.strictEqual(data.length, 524288); // 4Mbit cart = 512KB raw
});

test("empty cart yields no save entries", async () => {
    const { data } = await normalize(load("baseline-cart.bcr"));
    const saves = bup.parse(data);
    assert.deepStrictEqual(saves, []);
});

test("parses DEZA2___SYS system save in internal RAM dump", async () => {
    const raw = load("baseline-internal.bkr");
    const { kind, data } = await normalize(raw);
    assert.strictEqual(kind, "raw");
    assert.strictEqual(data.length, 32768);
    const [save] = bup.parse(data);
    assert.strictEqual(save.offset, 0x80);
    assert.strictEqual(save.filename, "DEZA2___SYS");
    assert.strictEqual(save.datasize, 17);
    assert.strictEqual(save.blocks.length, 0); // small enough to fit inline
    assert.strictEqual(save.payload.buffer.length, 17);
});

test("decodes the Shift-JIS system-save comment when ICU allows", () => {
    let sjis;
    try {
        sjis = new TextDecoder("shift-jis");
    } catch {
        return; // small-ICU Node build — decodeComment falls back to bytes
    }
    void sjis;
    const [save] = bup.parse(new Uint8Array(load("baseline-internal.bkr")));
    assert.strictEqual(save.comment, "ﾃﾞｻﾞ2_ｼｽﾃﾑ"); // half-width kana, "Deza2 System"
});
