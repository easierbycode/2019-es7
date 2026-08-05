import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs, UsageError } from "../index.js";
import { validateGameJson } from "../lib/game-schema.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, "..", "index.js");
const FIX = path.join(here, "..", "fixtures");

function run(args, { expectFail = false } = {}) {
    try {
        const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
        return { status: 0, stdout };
    } catch (err) {
        if (!expectFail) throw err;
        return { status: err.status, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
    }
}

let hasPngjs = true;
try {
    await import("pngjs");
} catch {
    hasPngjs = false;
}

// --- parseArgs unit tests ---

test("parseArgs defaults", () => {
    const o = parseArgs(["game.sav"]);
    assert.strictEqual(o.input, "game.sav");
    assert.strictEqual(o.out, "out");
    assert.strictEqual(o.slot, null);
    assert.strictEqual(o.json, false);
});

test("parseArgs parses flags and values", () => {
    const o = parseArgs(["--out", "d", "--slot", "2", "--json", "--skip-bgm", "in.sav"]);
    assert.deepStrictEqual(
        { out: o.out, slot: o.slot, json: o.json, skipBgm: o.skipBgm, input: o.input },
        { out: "d", slot: 2, json: true, skipBgm: true, input: "in.sav" }
    );
});

test("parseArgs rejects missing values and bad numbers", () => {
    assert.throws(() => parseArgs(["in.sav", "--out"]), UsageError);
    assert.throws(() => parseArgs(["--out", "--json", "in.sav"]), UsageError);
    assert.throws(() => parseArgs(["--slot", "abc", "in.sav"]), UsageError);
    assert.throws(() => parseArgs(["--frobnicate"]), UsageError);
});

// --- spawned CLI behavior ---

test("--help exits 0 with usage", () => {
    const { stdout } = run(["--help"]);
    assert.match(stdout, /^Usage: dezaemon-import/);
});

test("no input exits 2 with usage", () => {
    const r = run([], { expectFail: true });
    assert.strictEqual(r.status, 2);
    assert.match(r.stdout, /Usage:/);
});

test("unknown option exits 2", () => {
    const r = run(["--nope", "x.sav"], { expectFail: true });
    assert.strictEqual(r.status, 2);
    assert.match(r.stderr, /unknown option/);
});

test("non-Saturn input exits 3", () => {
    const junk = path.join(os.tmpdir(), `deza-junk-${process.pid}.bin`);
    fs.writeFileSync(junk, new Uint8Array(4096));
    try {
        const r = run([junk], { expectFail: true });
        assert.strictEqual(r.status, 3);
        assert.match(r.stderr, /BackUpRam Format/);
    } finally {
        fs.rmSync(junk, { force: true });
    }
});

test("--json dumps directory metadata with section table", () => {
    const { stdout } = run([path.join(FIX, "ramsie.sav"), "--json"]);
    const out = JSON.parse(stdout);
    assert.strictEqual(out.container, "interleaved");
    assert.strictEqual(out.saves.length, 1);
    const s = out.saves[0];
    assert.strictEqual(s.filename, "DEZA2____01");
    assert.strictEqual(s.datasize, 167511);
    assert.strictEqual(s.blocks, 331);
    assert.strictEqual(s.sections.length, 8);
    assert.strictEqual(s.sections[5].size, 56643);
});

test("--out writes game.json + atlas that pass the schema", { skip: !hasPngjs && "pngjs not installed" }, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deza-out-"));
    try {
        run([path.join(FIX, "ramsie.sav"), "--out", dir]);
        const game = JSON.parse(fs.readFileSync(path.join(dir, "game.json"), "utf8"));
        const { ok, errors } = validateGameJson(game);
        assert.deepStrictEqual(errors, []);
        assert.ok(ok);
        assert.strictEqual(game.meta.source, "dezaemon2");
        assert.strictEqual(game.meta.sourceComment, "DEZA2 SGM");

        const atlas = JSON.parse(fs.readFileSync(path.join(dir, "game_asset.json"), "utf8"));
        assert.ok(atlas.frames && typeof atlas.frames === "object");
        assert.strictEqual(atlas.meta.image, "img/game_asset.png");

        const { PNG } = await import("pngjs");
        const png = PNG.sync.read(fs.readFileSync(path.join(dir, "img", "game_asset.png")));
        assert.strictEqual(png.width, atlas.meta.size.w);
        assert.strictEqual(png.height, atlas.meta.size.h);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
