#!/usr/bin/env node
// Render a decoded section region as a grayscale bitmap PNG for eyeballing.
//
//   node dev/render-4bpp.js dev-out/decoded/ramsie-sec5.bin --width 256 [--bpp 4] [--offset 0] [--rows 512] [--out file.png]

import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
const file = args[0];
const opt = (name, dflt) => {
    const i = args.indexOf("--" + name);
    return i === -1 ? dflt : args[i + 1];
};
const width = Number(opt("width", 256));
const bpp = Number(opt("bpp", 4));
const offset = Number(opt("offset", 0));
const buf = fs.readFileSync(file).subarray(offset);
const bytesPerRow = (width * bpp) / 8;
const totalRows = Math.floor(buf.length / bytesPerRow);
const rows = Math.min(Number(opt("rows", totalRows)), totalRows);
const out = opt("out", file.replace(/\.bin$/, "") + `-w${width}b${bpp}o${offset}.png`);

const tile8 = args.includes("--tile8"); // treat data as consecutive 8x8 4bpp tiles (32 B each)

const png = new PNG({ width, height: rows });
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
        let v;
        if (tile8) {
            const tilesPerRow = width >> 3;
            const tile = (y >> 3) * tilesPerRow + (x >> 3);
            const byte = buf[tile * 32 + (y & 7) * 4 + ((x & 7) >> 1)];
            v = ((x & 1) === 0 ? byte >> 4 : byte & 0x0f) * 17;
        } else if (bpp === 4) {
            const byte = buf[y * bytesPerRow + (x >> 1)];
            v = ((x & 1) === 0 ? byte >> 4 : byte & 0x0f) * 17;
        } else {
            v = buf[y * bytesPerRow + x];
        }
        const p = (y * width + x) * 4;
        png.data[p] = png.data[p + 1] = png.data[p + 2] = v === undefined ? 0 : v;
        png.data[p + 3] = 255;
    }
}
fs.writeFileSync(out, PNG.sync.write(png));
console.log(`${out}  ${width}x${rows} (${bpp}bpp, ${bytesPerRow}B/row, ${totalRows} rows total)`);
