#!/usr/bin/env node
"use strict";

// Differential analysis helper for reverse-engineering the Dezaemon 2 save
// format. Give it two .sav files and it prints the contiguous byte ranges
// that differ (after de-interleave). Used to localize data regions:
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

const fs = require("fs");
const { deinterleave } = require("../lib/bup-deinterleave");

function main() {
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

    const a = deinterleave(fs.readFileSync(files[0]));
    const b = deinterleave(fs.readFileSync(files[1]));
    const n = Math.min(a.length, b.length);

    // Collect raw differing offsets, then coalesce into ranges.
    const ranges = [];
    let runStart = -1;
    let lastDiff = -1;
    for (let i = 0; i < n; i++) {
        if (a[i] !== b[i]) {
            if (runStart === -1) runStart = i;
            else if (i - lastDiff > minGap) {
                ranges.push([runStart, lastDiff]);
                runStart = i;
            }
            lastDiff = i;
        }
    }
    if (runStart !== -1) ranges.push([runStart, lastDiff]);

    let totalDiff = 0;
    for (const [s, e] of ranges) totalDiff += e - s + 1;

    console.log(`# diff ${files[0]} vs ${files[1]}`);
    console.log(`# logical sizes: ${a.length} / ${b.length}; ${ranges.length} changed ranges, ${totalDiff} bytes differ\n`);
    console.log(`${"start".padStart(10)} ${"end".padStart(10)} ${"len".padStart(8)}`);
    for (const [s, e] of ranges) {
        const len = e - s + 1;
        console.log(`0x${s.toString(16).padStart(8, "0")} 0x${e.toString(16).padStart(8, "0")} ${String(len).padStart(8)}`);
    }
}

main();
