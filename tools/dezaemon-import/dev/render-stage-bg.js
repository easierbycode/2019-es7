#!/usr/bin/env node
// Render a stage's background map from the sec5 stage bank.
//
// Stage bank = 10 stages x 0x5400 at sec5+0; each bank is a tilemap of
// 14 columns x 768 rows of u16be words (= 48 parts of 16 rows). Word 0xFFFF
// means "empty"; otherwise bit15 = H flip, bit14 = V flip, bits 0-9 = CG
// cell index in the 1024-cell (4-page) space.
//
//   node dev/render-stage-bg.js dev-out/corpus/disc-rams --stage 0 --part 3
//   node dev/render-stage-bg.js dev-out/corpus/disc-rams --stage 0 --startRow 0 --rows 48

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { decodePalettes, cellIndexed } from "../lib/decode/decode-cg.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const gameDir = args[0];
const opt = (n, d) => {
    const i = args.indexOf("--" + n);
    return i === -1 ? d : args[i + 1];
};
if (!gameDir) {
    console.error("usage: render-stage-bg <corpus game dir> [--stage N] [--part N | --startRow N --rows N] [--noflip]");
    process.exit(2);
}

const BANK_STRIDE = 0x5400;
const MAP_COLS = 14;
const ROWS_PER_PART = 16;
const TOTAL_ROWS = BANK_STRIDE / 2 / MAP_COLS; // 768

const stage = Number(opt("stage", 0));
const noflip = args.includes("--noflip");
const partArg = opt("part", null);
const startRow = partArg !== null ? Number(partArg) * ROWS_PER_PART : Number(opt("startRow", 0));
const rows = Math.min(Number(opt("rows", partArg !== null ? ROWS_PER_PART : 48)), TOTAL_ROWS - startRow);

const sections = [0, 1, 2, 3].map((i) => fs.readFileSync(path.join(gameDir, `sec${i}.bin`)));
const palettes = decodePalettes(fs.readFileSync(path.join(gameDir, "sec4.bin")));
const sec5 = fs.readFileSync(path.join(gameDir, "sec5.bin"));
const base = stage * BANK_STRIDE;

const W = MAP_COLS * 16;
const H = rows * 16;
const png = new PNG({ width: W, height: H });
let empty = 0;

for (let r = 0; r < rows; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
        const word = sec5.readUInt16BE(base + ((startRow + r) * MAP_COLS + c) * 2);
        if (word === 0xffff) { empty++; continue; }
        const cell = cellIndexed(sections, word & 0x3ff);
        const hflip = !noflip && (word & 0x8000) !== 0;
        const vflip = !noflip && (word & 0x4000) !== 0;
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const v = cell[(vflip ? 15 - y : y) * 16 + (hflip ? 15 - x : x)];
                const o = ((r * 16 + y) * W + c * 16 + x) * 4;
                if (v === 0) { png.data[o + 3] = 255; continue; }
                const col = palettes[v >> 4].colors[v & 0x0f];
                png.data[o] = col.r; png.data[o + 1] = col.g; png.data[o + 2] = col.b; png.data[o + 3] = 255;
            }
        }
    }
}

// --enemies: overlay the placement grid (20 cols) on top of the background.
// Zako are drawn as a box tinted by size class, bosses as a red cross.
if (args.includes("--enemies")) {
    const PL = 0x34f80 + stage * 0x3c00;
    const CLASS_TINT = [
        [255, 96, 96], [255, 176, 64], [255, 240, 64], [96, 255, 96],
        [64, 224, 255], [128, 128, 255], [255, 96, 255],
    ];
    const px = (x, y, [r, g, b]) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const o = (y * W + x) * 4;
        png.data[o] = r; png.data[o + 1] = g; png.data[o + 2] = b; png.data[o + 3] = 255;
    };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 20; c++) {
            const id = sec5[PL + (startRow + r) * 20 + c];
            if (!id) continue;
            // placement columns (20) span the same width as the 14 map columns
            const cx = Math.round((c + 0.5) * (W / 20));
            const cy = r * 16 + 8;
            if (id >= 0xf0) {
                for (let k = -7; k <= 7; k++) { px(cx + k, cy, [255, 0, 0]); px(cx, cy + k, [255, 0, 0]); }
            } else {
                const tint = CLASS_TINT[Math.max(0, Math.min(6, (id >> 4) - 8))];
                for (let k = -4; k <= 4; k++) {
                    px(cx + k, cy - 4, tint); px(cx + k, cy + 4, tint);
                    px(cx - 4, cy + k, tint); px(cx + 4, cy + k, tint);
                }
            }
        }
    }
}

const outDir = path.join(here, "..", "dev-out", "stage-render", path.basename(gameDir));
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `bg-s${stage}-r${startRow}${args.includes("--enemies")?"-enemies":""}${noflip ? "-noflip" : ""}.png`);
fs.writeFileSync(out, PNG.sync.write(png));
console.log(`${out}  ${W}x${H}  rows ${startRow}..${startRow + rows - 1} of ${TOTAL_ROWS}  (${empty} empty tiles)`);
