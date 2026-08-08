#!/usr/bin/env node
// Bakes the Duke Nukem player's art into lib/player-art.js.
//
// A Dezaemon 2 save carries no player, and a blank game has to start with one,
// so the importer supplies the character the live Evil Invaders build flies:
// the Firebase record `characters/dukeNukem`, which OverloadScene loads over
// evil-invaders-phaser4's recipe at boot — Duke plus the sparkler shot.
//
// Its frames come from two places and neither is this project's game_asset:
//
//   duke_0..duke_3          RTDB `atlases/duke_atlas` — snapshotted in dev/duke/
//   bigProjectile_0..3.png  the sparkler; these and the rest (big shot, 3way,
//   bigProjectile0..2.png   the ten-frame shield) live in
//   hadoken0..1.png         evil-invaders-phaser4's assets/game_asset.png
//   shield0..9.png
//
// Pointing playerData at them without shipping the pixels would import an
// invisible ship firing invisible bullets. Rather than add a build-time
// dependency on a sibling checkout, the frames are baked here into a committed,
// dependency-free ESM module that the editor and the CLI both read.
//
// Palette + run-length encoded: the frames use few distinct colours and are
// mostly flat, so hundreds of KB of RGBA compress to ~20 KB of base64.
//
//   node tools/dezaemon-import/dev/build-player-art.js [--check]
//
// Point somewhere else with EI_PHASER4_ROOT=/path/to/evil-invaders-phaser4.
//
// Refresh the dev/duke/ snapshot (record + atlas) straight from the database:
//   curl -s https://evil-invaders-default-rtdb.firebaseio.com/characters/dukeNukem.json
//   curl -s https://evil-invaders-default-rtdb.firebaseio.com/atlases/duke_atlas.json
// The atlas node carries `json` (a JSON string) and `png` (base64); write them
// out as dev/duke/duke_atlas.json and dev/duke/duke_atlas.png.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "lib", "player-art.js");
const DUKE = path.join(here, "duke");
const SRC = process.env.EI_PHASER4_ROOT ??
    path.join(here, "..", "..", "..", "..", "evil-invaders-phaser4");

const check = process.argv.includes("--check");

function loadPng(file) {
    let PNG;
    try {
        PNG = require("pngjs").PNG;
    } catch {
        throw new Error("pngjs is required — run `npm install` in tools/dezaemon-import");
    }
    return PNG.sync.read(fs.readFileSync(file));
}

// index.js imports pngjs dynamically; this dev script can use require via
// createRequire, which keeps it working as an ESM file.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// A sheet is one PNG plus a name -> {x,y,w,h} map. The atlas JSON comes in two
// shapes: an array of {filename, frame} (evil-invaders-phaser4's game_asset)
// and a keyed object (the Atlas Builder's output, which is what the RTDB holds).
function loadSheet(pngFile, jsonFile) {
    const json = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    const byName = new Map(
        Array.isArray(json.frames)
            ? json.frames.map((f) => [f.filename, f.frame])
            : Object.entries(json.frames).map(([name, f]) => [name, f.frame]),
    );
    return { png: loadPng(pngFile), byName };
}

function main() {
    const atlasPng = path.join(SRC, "assets", "game_asset.png");
    const atlasJson = path.join(SRC, "assets", "game_asset.json");
    for (const f of [atlasPng, atlasJson]) {
        if (!fs.existsSync(f)) {
            console.error(
                `evil-invaders-phaser4 not found at ${SRC} (missing ${path.basename(f)}).\n` +
                `Clone it next to this repo, or set EI_PHASER4_ROOT.`
            );
            process.exit(check ? 0 : 1); // --check must not fail a clone without the sibling
        }
    }

    const player = JSON.parse(fs.readFileSync(path.join(DUKE, "character.json"), "utf8"));
    // duke_atlas first: its keys are unique, and a hit there means the frame is
    // the character's own art rather than something the shared atlas happens to
    // name the same way.
    const sheets = [
        loadSheet(path.join(DUKE, "duke_atlas.png"), path.join(DUKE, "duke_atlas.json")),
        loadSheet(atlasPng, atlasJson),
    ];

    const keys = [
        ...player.texture,
        ...player.shootNormal.texture,
        ...player.shootBig.texture,
        ...player.shoot3way.texture,
        ...player.barrier.texture,
    ];
    const unique = [...new Set(keys)];

    // Palette first, so a run is one byte of index plus one of length.
    const palette = [];
    const paletteIndex = new Map();
    const pixelsOf = (key) => {
        const sheet = sheets.find((s) => s.byName.has(key));
        if (!sheet) throw new Error(`frame ${key} is in none of the source atlases`);
        const { png } = sheet;
        const f = sheet.byName.get(key);
        const out = [];
        for (let y = 0; y < f.h; y++) {
            for (let x = 0; x < f.w; x++) {
                const o = ((f.y + y) * png.width + (f.x + x)) * 4;
                // Fully transparent pixels differ only in their dead RGB, which
                // would split runs for nothing — normalise them to one colour.
                const a = png.data[o + 3];
                const rgba = a === 0
                    ? 0
                    : ((png.data[o] << 24) >>> 0) + (png.data[o + 1] << 16) + (png.data[o + 2] << 8) + a;
                out.push(rgba);
            }
        }
        return { w: f.w, h: f.h, pixels: out };
    };

    const frames = unique.map((key) => {
        const { w, h, pixels } = pixelsOf(key);
        const runs = [];
        let prev = null;
        let n = 0;
        const flush = () => {
            if (n === 0) return;
            if (!paletteIndex.has(prev)) {
                paletteIndex.set(prev, palette.length);
                palette.push(prev);
            }
            runs.push(paletteIndex.get(prev), n);
        };
        for (const p of pixels) {
            if (p === prev && n < 255) { n++; continue; }
            flush();
            prev = p;
            n = 1;
        }
        flush();
        return { key, w, h, rle: Buffer.from(Uint8Array.from(runs)).toString("base64") };
    });

    if (palette.length > 256) throw new Error(`palette overflowed: ${palette.length} colours`);

    const bytes = frames.reduce((n, f) => n + f.rle.length, 0);
    const source = render({ palette, frames, player });

    if (check) {
        const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
        if (current !== null && current.replace(/\r\n/g, "\n") === source) {
            console.log(`player art is up to date (${frames.length} frames)`);
            return;
        }
        console.error(`stale: lib/player-art.js\nRun: node tools/dezaemon-import/dev/build-player-art.js`);
        process.exit(1);
    }

    fs.writeFileSync(OUT, source);
    console.log(
        `wrote lib/player-art.js — ${frames.length} frames, ${palette.length} colours, ` +
        `${(bytes / 1024).toFixed(0)} KB of base64`
    );
}

function render({ palette, frames, player }) {
    const shoot = (s) => `{
        name: ${JSON.stringify(s.name)}, damage: ${s.damage}, hp: ${s.hp}, interval: ${s.interval},
        texture: ${JSON.stringify(s.texture)},
    }`;
    return `// GENERATED by dev/build-player-art.js — do not edit by hand.
//
// The player a blank game and a Dezaemon 2 import both fly: the Firebase
// character \`characters/dukeNukem\`, which the live Evil Invaders build loads
// over its recipe at boot. A save carries no player of its own, and none of
// these frames are in this project's game_asset atlas, so the pixels are baked
// in here rather than referenced.
//
// Frames are palette + run-length encoded (see the generator for why).

// RGBA, packed big-endian into a 32-bit int. Index 0 is transparent.
export const PLAYER_PALETTE = [
    ${palette.map((c) => `0x${c.toString(16).padStart(8, "0")}`).join(", ")},
];

// Runs are (paletteIndex, length 1..255) byte pairs, row-major.
export const PLAYER_FRAMES = [
${frames.map((f) => `    { key: ${JSON.stringify(f.key)}, w: ${f.w}, h: ${f.h}, rle: "${f.rle}" },`).join("\n")}
];

// The record itself, in this project's playerData shape. The Firebase character
// calls the special-attack field caDamage; the Phaser runtime here reads
// spDamage (GameScene.js), so it is renamed on the way across. \`name\` is the
// label the level editor shows, so it says who this is.
export const DUKE_PLAYER = {
    name: "duke",
    maxHp: ${player.maxHp},
    spDamage: ${player.caDamage ?? player.spDamage ?? 50},
    speed: ${player.speed ?? 150},
    defaultShootName: ${JSON.stringify(player.defaultShootName)},
    defaultShootSpeed: ${JSON.stringify(player.defaultShootSpeed)},
    texture: ${JSON.stringify(player.texture)},
    shootNormal: ${shoot(player.shootNormal)},
    shootBig: ${shoot(player.shootBig)},
    shoot3way: ${shoot(player.shoot3way)},
    barrier: {
        time: ${player.barrier.time},
        texture: ${JSON.stringify(player.barrier.texture)},
    },
};

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// atob/Buffer-free so this stays environment-neutral (Node + browser + any
// bundler) exactly like the rest of lib/.
function fromBase64(s) {
    const clean = s.replace(/=+$/, "");
    const out = new Uint8Array((clean.length * 3) >> 2);
    let acc = 0;
    let bits = 0;
    let o = 0;
    for (let i = 0; i < clean.length; i++) {
        acc = (acc << 6) | B64.indexOf(clean[i]);
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out[o++] = (acc >> bits) & 0xff;
        }
    }
    return out;
}

// Decode to the {key, w, h, rgba} shape the sprite pipeline uses, so an import
// can hand these to the atlas alongside the save's own art.
export function decodePlayerArt() {
    return PLAYER_FRAMES.map(({ key, w, h, rle }) => {
        const runs = fromBase64(rle);
        const rgba = new Uint8ClampedArray(w * h * 4);
        let p = 0;
        for (let i = 0; i + 1 < runs.length; i += 2) {
            const colour = PLAYER_PALETTE[runs[i]];
            const r = (colour >>> 24) & 0xff;
            const g = (colour >>> 16) & 0xff;
            const b = (colour >>> 8) & 0xff;
            const a = colour & 0xff;
            for (let n = runs[i + 1]; n > 0; n--) {
                const o = p++ * 4;
                rgba[o] = r;
                rgba[o + 1] = g;
                rgba[o + 2] = b;
                rgba[o + 3] = a;
            }
        }
        return { key, w, h, rgba };
    });
}
`;
}

main();
