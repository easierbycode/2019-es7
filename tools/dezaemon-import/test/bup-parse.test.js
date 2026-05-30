"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { detect, deinterleave } = require("../lib/bup-deinterleave");
const { normalize, isGzip } = require("../lib/bup-source");
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

test("normalize gunzips Mednafen .bcr cart saves", () => {
    const raw = load("baseline-cart.bcr");
    assert.strictEqual(isGzip(raw), true);
    const { kind, data } = normalize(raw);
    assert.strictEqual(kind, "gzip");
    assert.strictEqual(data.length, 524288); // 4Mbit cart = 512KB raw
});

test("empty cart yields no save entries", () => {
    const { data } = normalize(load("baseline-cart.bcr"));
    const saves = bup.parse(data);
    assert.deepStrictEqual(saves, []);
});

test("parses DEZA2___SYS system save in internal RAM dump", () => {
    const raw = load("baseline-internal.bkr");
    const { kind, data } = normalize(raw);
    assert.strictEqual(kind, "raw");
    assert.strictEqual(data.length, 32768);
    const [save] = bup.parse(data);
    assert.strictEqual(save.offset, 0x80);
    assert.strictEqual(save.filename, "DEZA2___SYS");
    assert.strictEqual(save.datasize, 17);
    assert.strictEqual(save.blocks.length, 0); // small enough to fit inline
    assert.strictEqual(save.payload.buffer.length, 17);
});
