#!/usr/bin/env node
// Render a corpus game's four CG pages (+ palette swatch) to PNGs using the
// confirmed CG decoder — full color via the sec4 palette bank.
//
//   node dev/render-cg.js dev-out/corpus/dezaemon-2-daioh-g0 [--out dir]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { decodeCg, CG_PAGE_WIDTH, CG_PAGE_HEIGHT } from "../lib/decode/decode-cg.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const gameDir = process.argv[2];
if (!gameDir) {
    console.error("usage: render-cg <corpus game dir> [--out dir]");
    process.exit(2);
}
const outIdx = process.argv.indexOf("--out");
const outDir = outIdx !== -1
    ? process.argv[outIdx + 1]
    : path.join(here, "..", "dev-out", "cg-render", path.basename(gameDir));
fs.mkdirSync(outDir, { recursive: true });

const sections = [0, 1, 2, 3].map((i) => fs.readFileSync(path.join(gameDir, `sec${i}.bin`)));
const sec4 = fs.readFileSync(path.join(gameDir, "sec4.bin"));
const { palettes, pages } = decodeCg(sections, sec4);

for (const page of pages) {
    const png = new PNG({ width: CG_PAGE_WIDTH, height: CG_PAGE_HEIGHT });
    png.data.set(page.rgba);
    const file = path.join(outDir, `page${page.page}.png`);
    fs.writeFileSync(file, PNG.sync.write(png));
    console.log(`${file}  (${page.usedCount}/256 cells used)`);
}

// palette swatch: 16 rows (palettes) x 16 cols (colors), 16px squares
const SW = 16;
const sw = new PNG({ width: 16 * SW, height: 16 * SW });
palettes.forEach(({ colors }, p) =>
    colors.forEach((c, i) => {
        for (let y = 0; y < SW; y++)
            for (let x = 0; x < SW; x++) {
                const o = ((p * SW + y) * 16 * SW + i * SW + x) * 4;
                sw.data[o] = c.r; sw.data[o + 1] = c.g; sw.data[o + 2] = c.b;
                sw.data[o + 3] = c.empty ? 0 : 255;
            }
    })
);
const swFile = path.join(outDir, "palettes.png");
fs.writeFileSync(swFile, PNG.sync.write(sw));
console.log(swFile);
