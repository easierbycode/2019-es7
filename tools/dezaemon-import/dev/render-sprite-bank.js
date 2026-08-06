#!/usr/bin/env node
// Render a game's sprite composition banks by resolving their cell refs.
//
// The global bank (sec5+0x5D490, 232 refs) holds the player ship frames,
// bullets, item icons, explosions, the DRAWN title logo and the credit
// glyphs — which is why no title text exists anywhere in the save. Each
// stage additionally owns 704 refs at sec5+0x5D660 + stage*0x580.
//
//   node dev/render-sprite-bank.js dev-out/corpus/disc-rams [--stage N]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { decodePalettes, cellIndexed } from "../lib/decode/decode-cg.js";
import { SEC5_REGIONS } from "../lib/decode/decode-stage.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const gameDir = args[0];
if (!gameDir) {
    console.error("usage: render-sprite-bank <corpus game dir> [--stage N]");
    process.exit(2);
}
const stageIdx = args.indexOf("--stage");
const stage = stageIdx === -1 ? null : Number(args[stageIdx + 1]);

const sections = [0, 1, 2, 3].map((i) => fs.readFileSync(path.join(gameDir, `sec${i}.bin`)));
const palettes = decodePalettes(fs.readFileSync(path.join(gameDir, "sec4.bin")));
const sec5 = fs.readFileSync(path.join(gameDir, "sec5.bin"));

const region = stage === null ? SEC5_REGIONS.spriteBank : SEC5_REGIONS.spriteStages;
const base = stage === null ? region.offset : region.offset + stage * region.stride;
const count = region.stride / 2;

const COLS = 8;
const rows = Math.ceil(count / COLS);
const png = new PNG({ width: COLS * 16, height: rows * 16 });
let live = 0;

for (let i = 0; i < count; i++) {
    const word = sec5.readUInt16BE(base + i * 2);
    if (word === 0xffff) continue;
    live++;
    const cell = cellIndexed(sections, word & 0x3ff);
    const hflip = (word & 0x8000) !== 0;
    const vflip = (word & 0x4000) !== 0;
    const cx = (i % COLS) * 16;
    const cy = ((i / COLS) | 0) * 16;
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const v = cell[(vflip ? 15 - y : y) * 16 + (hflip ? 15 - x : x)];
            const o = ((cy + y) * COLS * 16 + cx + x) * 4;
            if (!v) { png.data[o + 3] = 255; continue; }
            const c = palettes[v >> 4].colors[v & 0x0f];
            png.data[o] = c.r; png.data[o + 1] = c.g; png.data[o + 2] = c.b; png.data[o + 3] = 255;
        }
    }
}

const outDir = path.join(here, "..", "dev-out", "sprite-bank", path.basename(gameDir));
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, stage === null ? "global.png" : `stage${stage}.png`);
fs.writeFileSync(out, PNG.sync.write(png));
console.log(`${out}  ${COLS * 16}x${rows * 16}  ${live}/${count} live refs`);
