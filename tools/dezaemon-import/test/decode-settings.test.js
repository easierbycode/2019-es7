// Settings-block decoder: the two ship configs, the per-save main weapon and
// the shot damage the mapper divides enemy LIFE by.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";
import {
    decodeSettings,
    weaponShotDamage,
    WEAPON_SHOT_DAMAGE,
    DEFAULT_SHOT_DAMAGE,
} from "../lib/decode/decode-settings.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function decodedFixture(name) {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", name)));
    const save = bup.parse(data).find((s) => s.payload);
    return decodeSave(save.payload.buffer);
}

test("ramsie's settings decode to its authored config", async () => {
    const d = await decodedFixture("ramsie.sav");
    assert.equal(d.settings.ships[0].mainWeapon, 7);
    assert.equal(d.settings.ships[1].mainWeapon, 7);
    assert.equal(d.settings.gameMode, 2);
    assert.equal(d.settings.sfxSet, 3); // SF bank
    assert.equal(d.settings.shotDamage, 21);
    // BGM table entries always index the 24 song slots
    assert.ok(d.settings.bgmTable.every((v) => v >= 0 && v <= 23));
    assert.equal(d.confidence.settings, "heuristic");
});

test("mucha-kucha's two ships carry different weapons", async () => {
    const d = await decodedFixture("mucha-kucha.sav");
    assert.equal(d.settings.ships[0].mainWeapon, 4);
    assert.equal(d.settings.ships[1].mainWeapon, 6);
    assert.equal(d.settings.sfxSet, 1); // REAL bank
});

test("shot damage lookup: traced weapons and the safe fallback", () => {
    // weapon 5's normal shot is the fully traced table; every other id falls
    // back to the traced minimum so an untraced weapon can only make enemies
    // slightly tankier, never unkillable.
    assert.equal(WEAPON_SHOT_DAMAGE[5].traced, true);
    for (let w = 0; w < 8; w++) {
        const dmg = weaponShotDamage(w);
        assert.ok(dmg >= DEFAULT_SHOT_DAMAGE, `weapon ${w} -> ${dmg}`);
    }
    assert.equal(weaponShotDamage(99), DEFAULT_SHOT_DAMAGE);
});

test("decodeSettings reads the block at sec5 +0x5A780", () => {
    const sec5 = new Uint8Array(396640);
    const S = 0x5a780;
    sec5[S] = 0x02;               // game mode
    sec5.set([0x10, 0x72, 0x40, 0x35], S + 0x0c); // ship 1: weapon 5, alt 3
    sec5.set([0x11, 0x72, 0x41, 0x06], S + 0x10); // ship 2: weapon 6, alt 0
    sec5[S + 0x59] = 2;           // COMIC sfx
    const st = decodeSettings(sec5);
    assert.equal(st.gameMode, 2);
    assert.equal(st.ships[0].mainWeapon, 5);
    assert.equal(st.ships[0].altSelect, 3);
    assert.equal(st.ships[1].mainWeapon, 6);
    assert.equal(st.shotDamage, 21);
    assert.equal(st.sfxSet, 2);
});
