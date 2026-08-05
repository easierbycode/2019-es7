#!/usr/bin/env node
// Differential analysis helper for reverse-engineering the Dezaemon 2 save
// format. Give it two save files and it prints the contiguous byte ranges
// that differ (after container normalization — gzip .bcr, interleaved cart
// dumps, and raw images all work). Used to localize data regions:
//
//   - Two *different games*   → ranges that are IDENTICAL reveal fixed
//                               structure (headers, default tables).
//   - Two *controlled deltas* → ranges that DIFFER reveal exactly the field
//                               you changed (e.g. one enemy's HP).
//
//   node tools/dezaemon-import/dev/diff-saves.js <a.sav> <b.sav> [--min-gap N]
//
// --min-gap merges changed ranges separated by fewer than N identical bytes
// (default 8) so a single struct doesn't fragment into noise.

import fs from "node:fs";
import { normalize } from "../lib/bup-source.js";
import { coalesceDiffRanges, totalDiffBytes } from "../lib/diff-ranges.js";

async function main() {
    const args = process.argv.slice(2);
    let minGap = 8;
    const files = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--min-gap") minGap = parseInt(args[++i], 10);
        else files.push(args[i]);
    }
    if (files.length !== 2) {
        console.error("usage: diff-saves <a.sav> <b.sav> [--min-gap N]");
        process.exit(2);
    }

    const a = (await normalize(fs.readFileSync(files[0]))).data;
    const b = (await normalize(fs.readFileSync(files[1]))).data;

    const ranges = coalesceDiffRanges(a, b, minGap);

    console.log(`# diff ${files[0]} vs ${files[1]}`);
    console.log(`# logical sizes: ${a.length} / ${b.length}; ${ranges.length} changed ranges, ${totalDiffBytes(ranges)} bytes differ\n`);
    console.log(`${"start".padStart(10)} ${"end".padStart(10)} ${"len".padStart(8)}`);
    for (const [s, e] of ranges) {
        const len = e - s + 1;
        console.log(`0x${s.toString(16).padStart(8, "0")} 0x${e.toString(16).padStart(8, "0")} ${String(len).padStart(8)}`);
    }
}

main();
