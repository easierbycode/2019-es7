"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { detect, deinterleave } = require("../lib/bup-deinterleave");
const bup = require("../lib/bup-parse");

const FIX = path.join(__dirname, "..", "fixtures");
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

test("parses Ramsie directory entry", () => {
    const [save] = bup.parse(deinterleave(load("ramsie.sav")));
    assert.strictEqual(save.offset, 0x8400);
    assert.strictEqual(save.filename, "DEZA2____01");
    assert.strictEqual(save.comment, "DEZA2 SGM");
    assert.strictEqual(save.language, 0);
    assert.strictEqual(save.datasize, 167511);
    assert.strictEqual(bup.bupDateToDate(save.date).getUTCFullYear(), 2007);
    assert.strictEqual(save.payload.buffer.length, 167511);
});

test("parses Mucha Kucha Fighter directory entry", () => {
    const [save] = bup.parse(deinterleave(load("mucha-kucha.sav")));
    assert.strictEqual(save.filename, "DEZA2____01");
    assert.strictEqual(save.comment, "MuchaKucha");
    assert.strictEqual(save.language, 5);
    assert.strictEqual(save.datasize, 154015);
});

test("rejects non-Saturn data", () => {
    assert.throws(() => bup.parse(Buffer.alloc(1024)), /BackUpRam Format/);
});
