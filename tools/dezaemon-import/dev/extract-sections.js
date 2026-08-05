#!/usr/bin/env node
// Dump each payload section of a save to dev-out/<save>/secN.bin for
// hex-eyeballing and compression experiments.
//
//   node dev/extract-sections.js fixtures/ramsie.sav

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { parseSectionTable, isGameSave } from "../lib/payload-table.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const input = process.argv[2];
    if (!input) {
        console.error("usage: extract-sections <save file>");
        process.exit(2);
    }
    const { data } = await normalize(fs.readFileSync(input));
    const saves = bup.parse(data).filter((s) => isGameSave(s) && s.payload);
    if (!saves.length) {
        console.error("no game saves in image");
        process.exit(3);
    }
    for (const [gi, save] of saves.entries()) {
        const table = parseSectionTable(save.payload.buffer);
        const outDir = path.join(here, "..", "dev-out", path.basename(input).replace(/\.[^.]+$/, "") + (saves.length > 1 ? `-g${gi}` : ""));
        fs.mkdirSync(outDir, { recursive: true });
        for (const s of table.sections) {
            const file = path.join(outDir, `sec${s.index}.bin`);
            fs.writeFileSync(file, save.payload.buffer.subarray(s.offset, s.offset + s.size));
            console.log(`${file}  ${s.size} bytes  sum=0x${s.checksum.toString(16)}`);
        }
    }
}

main();
