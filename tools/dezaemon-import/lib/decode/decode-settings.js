// Dezaemon 2 global settings decoder — the 0x60-byte block at sec5 +0x5A780.
//
// Field map (FORMAT.md "Settings byte map"): +0x00 game mode, +0x0C..+0x0F and
// +0x10..+0x13 the two player-ship config blocks, +0x1C..+0x23 the 8 item
// slots, +0x41..+0x58 the BGM assignment table, +0x59 the SFX set.
//
// The ship block's last byte carries the MAIN WEAPON in its low nibble:
//   - KUMITATE (the game-assembly editor overlay) edits +0x0F/+0x13 as one
//     paired P1/P2 menu item (its literal pools list both addresses side by
//     side with the menu's own UI data);
//   - across the 17-game corpus the nibble spans 0,3,4,5,6,7 — an 8-option
//     menu — while every other ship byte holds 2-4 distinct values;
//   - the factory-default game (SGM_INIT = Gust) stores 6 there, and the play
//     engine's fire dispatcher (GAME.CMP +0x1cebc) reads a per-player weapon
//     variable whose id 6 routes to a spawn that exists for every save;
//     ids 5/6/7 dispatch to three distinct traced spawn routines.
// The settings->engine copy itself runs through pointer indirection that has
// not been traced instruction-by-instruction, so the identification is
// congruence (editor + corpus + defaults), not a byte-for-byte copy trace —
// which is why decodeSettings marks it "heuristic" rather than "confirmed".

import { SEC5_REGIONS } from "./decode-stage.js";

// Full-power damage of the player's shot, per main-weapon id, in the shared
// hp/damage units enemies decode in. Traced so far (GAME.CMP):
//   - weapon 5: the normal-shot spawn (+0x10bbe via the ==5 dispatch at
//     +0x1cf08) fires the power-level table +0x6085e14 = [9,12,15,18,21].
//   - weapon 6 (the factory default): its spawn sprays fixed-damage-4
//     bullets (+0x11fd0 writes 4 into both durability slots), several per
//     volley — per-action damage lands in the same 16-28 band.
//   - weapons 0-4 and 7: spawn routines not yet segmented (no literal-pool
//     or branch references; reached by fall-through). The remaining traced
//     player tables ([16..24], [8..32], [48..96]) all end at >= 24, so the
//     traced minimum (21) is the safe divisor for every untraced id: at
//     worst an enemy takes one extra hit, never becomes unkillable.
export const WEAPON_SHOT_DAMAGE = {
    5: { damage: 21, traced: true, note: "normal shot, table +0x6085e14 full power" },
    6: { damage: 21, traced: false, note: "4/bullet traced (+0x11fd0); volley of 4-7 approximated at 21" },
};
export const DEFAULT_SHOT_DAMAGE = 21;

export function weaponShotDamage(weapon) {
    const w = WEAPON_SHOT_DAMAGE[weapon];
    return w ? w.damage : DEFAULT_SHOT_DAMAGE;
}

function shipBlock(sec5, base) {
    return {
        // +0: 0x10 or 0x11 across the corpus — a two-value item (meaning open)
        a: sec5[base],
        // +1: two packed nibbles, both small enums (meaning open)
        b: sec5[base + 1],
        // +2: KUMITATE-edited (paired P1/P2); values 0x40/0x41/0x44 (open)
        c: sec5[base + 2],
        // +3: low nibble = MAIN WEAPON 0-7; high nibble = a 0-3 select
        mainWeapon: sec5[base + 3] & 0x0f,
        altSelect: (sec5[base + 3] >> 4) & 0x0f,
        raw: [...sec5.subarray(base, base + 4)],
    };
}

// Decode the settings block out of a decompressed sec5.
export function decodeSettings(sec5) {
    const base = SEC5_REGIONS.settings.offset;
    const ships = [shipBlock(sec5, base + 0x0c), shipBlock(sec5, base + 0x10)];
    return {
        gameMode: sec5[base] & 0x03,
        ships,
        // per-save shot damage: player 1's main weapon decides the pace
        shotDamage: weaponShotDamage(ships[0].mainWeapon),
        itemSlots: [...sec5.subarray(base + 0x1c, base + 0x24)],
        bgmTable: [...sec5.subarray(base + 0x41, base + 0x59)],
        sfxSet: sec5[base + 0x59],
        confidence: {
            mainWeapon: "heuristic",
            bgmTable: "confirmed",
            sfxSet: "confirmed",
        },
    };
}
