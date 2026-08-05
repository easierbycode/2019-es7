import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGameJson } from "../lib/game-schema.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("canary: the shipped assets/game.json validates", () => {
    const g = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "assets", "game.json"), "utf8"));
    const { ok, errors } = validateGameJson(g);
    assert.deepStrictEqual(errors, []);
    assert.ok(ok);
});

test("rejects missing playerData and stage0", () => {
    const { ok, errors } = validateGameJson({ enemyData: {}, bossData: {}, meta: { version: "1.0" } });
    assert.ok(!ok);
    assert.ok(errors.some((e) => e.includes("stage0")));
    assert.ok(errors.some((e) => e.includes("playerData")));
});

test("rejects malformed grid cells and dangling enemy references", () => {
    const g = {
        stage0: { enemylist: [["a5", "Z1", "00", "00", "00", "00", "00", "00"]] },
        playerData: null,
        enemyData: { enemyA: { hp: 1, score: 1, texture: ["x.gif"] } },
        bossData: {},
        meta: { version: "1.0" },
    };
    const { errors } = validateGameJson(g);
    assert.ok(errors.some((e) => e.includes('"a5"')));
    assert.ok(errors.some((e) => e.includes("enemyZ")));
});

test("warns about stages beyond stage4 and missing per-stage bosses", () => {
    const g = {
        stage0: { enemylist: [new Array(8).fill("00")] },
        stage5: { enemylist: [new Array(8).fill("00")] },
        playerData: {
            maxHp: 3,
            texture: ["p.gif"],
            shootNormal: { texture: ["s.gif"] },
            shootBig: { texture: ["s.gif"] },
            shoot3way: { texture: ["s.gif"] },
            barrier: { texture: ["b.gif"] },
        },
        enemyData: { enemyA: { hp: 1, score: 1, texture: ["x.gif"] } },
        bossData: {},
        meta: { version: "1.0" },
    };
    const { ok, warnings } = validateGameJson(g);
    assert.ok(ok, "these are warnings, not errors");
    assert.ok(warnings.some((w) => w.includes("stage5")));
    assert.ok(warnings.some((w) => w.includes("boss0")));
});
