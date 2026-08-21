// Enemy attribute decoder tests — the 18-byte record.
//
// Field offsets and tables come from the play engine's own spawn routine
// (GAME.CMP +0x153c8); the golden records below are real bytes from the
// DAIOH and Gust saves whose in-game behavior is known.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    decodeEnemyRecord,
    hasTransforms,
    appearanceFires,
    HP_TABLE,
    SCORE_TABLE,
    SPEED_TABLE,
} from "../lib/decode/decode-enemy.js";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const rec = (hex) => {
    const b = new Uint8Array(18);
    for (let i = 0; i < hex.length / 2; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return b;
};

test("engine tables are the GAME.bin literals, byte for byte", () => {
    assert.deepEqual(HP_TABLE, [60, 30, 15, 10, 5, 3, 2, 1]);
    assert.deepEqual(SCORE_TABLE, [50, 100, 200, 500, 1000, 2000, 5000, 10000]);
    assert.deepEqual(SPEED_TABLE, [256, 12800, 25600, 51200, 102400, 204800, 256000, 512000]);
});

test("head fields: hp, score, ground, speed, fire type", () => {
    // DAIOH stage 0 record 0 — the most-placed enemy: b1=0x15 -> hp idx 5,
    // score idx 1; b2=0 -> stationary, no fire.
    const d = decodeEnemyRecord(rec("6b1500002811004400000000000000000000"));
    assert.equal(d.hp, 3);
    assert.equal(d.score, 100);
    assert.equal(d.ground, false);
    assert.equal(d.speed, SPEED_TABLE[0] / 65536);
    assert.equal(d.fire.type, 0);
    assert.equal(hasTransforms(d), false);

    // b1 bit7 = ground, bits0-2 hp, bits4-6 score
    const g = decodeEnemyRecord(rec("00f7000000000000000000000000000000000"));
    assert.equal(g.ground, true);
    assert.equal(g.hp, 1);        // idx 7 -> weakest (the editor default)
    assert.equal(g.score, 10000); // idx 7 -> top score
});

test("channels: rotation, scale, direction decode to editor units", () => {
    // rotation: b9=0x21 -> mode 1, step idx 2 (64/256 units/f);
    // b10=0x04 -> from angle idx 4 (180deg), to idx 0 (0deg); b11=0x20 repeat 2
    const d = decodeEnemyRecord(rec("000000000000000000210420000000000000"));
    assert.equal(d.rotation.enabled, true);
    assert.equal(d.rotation.mode, 1);
    assert.equal(d.rotation.from, 180);
    assert.equal(d.rotation.to, 0);
    assert.ok(d.rotation.step < 0, "start > end steps downward");
    assert.equal(d.rotation.repeat, 2);

    // scale: b12=0x11 -> mode 1 (XY) step idx 1; b13=0x82 -> from idx 2
    // (x0.5) to idx 8 (x4); b14=0x10 repeat 1
    const sc = decodeEnemyRecord(rec("000000000000000000000000118210000000"));
    assert.equal(sc.scale.enabled, true);
    assert.equal(sc.scale.axes, "xy");
    assert.equal(sc.scale.from, 0.5);
    assert.equal(sc.scale.to, 4);
    assert.ok(sc.scale.step > 0);
    assert.equal(sc.scale.repeat, 1);

    // direction: b15=0x11 -> enabled, step idx 1; b16=0x40 -> from idx 0
    // (0deg = up) to idx 4 (90deg = right)
    const dir = decodeEnemyRecord(rec("000000000000000000000000000000114000"));
    assert.equal(dir.direction.enabled, true);
    assert.equal(dir.direction.from, 0);
    assert.equal(dir.direction.to, 90);
    assert.ok(hasTransforms(dir));
});

test("fire config: interval tables select on mode, spread params on type 1", () => {
    // b2 fire type 1 (bit6), b3 = count 3 + wide, b4 = mode 0 rate idx 2
    const d = decodeEnemyRecord(rec("0000400b2000000000000000000000000000"));
    assert.equal(d.fire.type, 1);
    assert.equal(d.fire.count, 4);      // (b3&7)+1
    assert.equal(d.fire.wide, true);
    assert.equal(d.fire.interval, 29);  // FIRE_INTERVAL_TABLE[2]
    // mode 3 swaps to the alternate table
    const alt = decodeEnemyRecord(rec("0000400b2300000000000000000000000000"));
    assert.equal(alt.fire.interval, 39); // FIRE_INTERVAL_TABLE_ALT[2]
});

test("every populated corpus record decodes without throwing, in range", async () => {
    const { data } = await normalize(
        fs.readFileSync(path.join(here, "..", "fixtures", "ramsie.sav")),
    );
    const save = bup.parse(data).find((s) => s.payload);
    const d = decodeSave(save.payload.buffer);
    assert.ok(d.enemies.length > 100);
    for (const e of d.enemies) {
        assert.ok(e.behavior, `${e.key} carries decoded behavior`);
        assert.ok(HP_TABLE.includes(e.behavior.hp));
        assert.ok(SCORE_TABLE.includes(e.behavior.score));
        assert.ok(e.behavior.speed >= 0 && e.behavior.speed < 8);
        assert.ok(e.behavior.fire.type >= 0 && e.behavior.fire.type <= 3);
        assert.ok(e.behavior.fire.interval >= 1 && e.behavior.fire.interval <= 119);
        for (const ch of [e.behavior.speedChange, e.behavior.scale]) {
            assert.ok(ch.from >= 0 && ch.from <= 4, "factor channels stay in x0..x4");
            assert.ok(ch.to >= 0 && ch.to <= 4);
        }
        for (const ch of [e.behavior.rotation, e.behavior.direction]) {
            assert.ok(ch.from >= 0 && ch.from < 360);
            assert.ok(ch.to >= 0 && ch.to < 360);
        }
    }
});

test("b5 10/11/12 are special fire patterns, not angles", () => {
    // The dispatcher routes b5 & 0xF of 10/11/12 to three special handlers;
    // everything else reaches the default handler, which uses b5 & 0x1F as
    // the shot angle. Reading 10-12 as angles aimed those enemies sideways.
    const withB5 = (v) => {
        const bytes = new Uint8Array(18);
        bytes[0] = 0x21; bytes[5] = v;
        return decodeEnemyRecord(bytes);
    };
    for (const [v, pattern] of [[10, 0], [11, 1], [12, 2]]) {
        const d = withB5(v);
        assert.equal(d.fire.pattern, pattern, `b5=${v} is pattern ${pattern}`);
        assert.equal(d.fire.direction, 0, "a pattern carries no angle");
    }
    // neighbouring values stay angles
    assert.equal(withB5(9).fire.pattern, null);
    assert.equal(withB5(9).fire.direction, 9);
    assert.equal(withB5(13).fire.pattern, null);
    assert.equal(withB5(13).fire.direction, 13);
});

test("movement decodes as a 2-bit mode plus an independent flag", () => {
    // The engine reads the packed byte bitwise (masks 0x1/0x2/0x3 and 0x4),
    // so it is not an 8-way enum.
    const withB2 = (v) => {
        const bytes = new Uint8Array(18);
        bytes[0] = 0x21; bytes[2] = v;
        return decodeEnemyRecord(bytes);
    };
    assert.deepEqual(withB2(0x00).move, { mode: 0, flag: false });
    assert.deepEqual(withB2(0x10).move, { mode: 1, flag: false });
    assert.deepEqual(withB2(0x20).move, { mode: 2, flag: false });
    assert.deepEqual(withB2(0x28).move, { mode: 2, flag: true });
    // the packed value the engine actually stores stays available
    assert.equal(withB2(0x28).movePattern, 2 | 4);
});

test("the fire gate is the appearance, straight from the engine's table", () => {
    // 48 of 256 appearance ids carry the no-fire bit (dispatcher +0x19882).
    let silent = 0;
    for (let a = 0; a < 256; a++) if (!appearanceFires(a)) silent++;
    assert.equal(silent, 48);
    // Lemureal's turrets (0x21, 0xc6) fire; its 0x85 props do not.
    assert.equal(appearanceFires(0x21), true);
    assert.equal(appearanceFires(0xc6), true);
    assert.equal(appearanceFires(0x85), false);
    // the decoded record carries it as fire.enabled
    const firing = decodeEnemyRecord(rec("210081310000000000000000000000000000"));
    assert.equal(firing.fire.enabled, true);
    const silentRec = decodeEnemyRecord(rec("850081310000000000000000000000000000"));
    assert.equal(silentRec.fire.enabled, false);
});

test("the editor-default record (Gust) decodes to the weakest enemy", () => {
    // Gust's most-placed record bytes: hp idx 7, score idx 0, no fire.
    const d = decodeEnemyRecord(rec("270700000000000000000000000000000000"));
    assert.equal(d.hp, 1);
    assert.equal(d.score, 50);
    assert.equal(d.fire.type, 0);
});
