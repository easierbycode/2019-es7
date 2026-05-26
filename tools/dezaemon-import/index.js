#!/usr/bin/env node
"use strict";

// Dezaemon 2 (Sega Saturn) save importer.
//
//   node tools/dezaemon-import/index.js <input.sav> [--out <dir>] [options]
//
// Current status: Phase 1 complete (Saturn BUP container parsing). The
// per-region decoders (sprite/enemy/stage/bullet/bgm) are stubs pending
// format reverse-engineering — see FORMAT.md. With --json the tool dumps the
// decoded directory metadata, which is what works today.

const fs = require("fs");
const path = require("path");
const { deinterleave, detect } = require("./lib/bup-deinterleave");
const bup = require("./lib/bup-parse");

const USAGE = `Usage: dezaemon-import <input.sav> [options]

Options:
  --out <dir>        output directory for game.json + atlas (default: ./out)
  --slot <n>         which save inside the .sav to import (default: 0)
  --json             print decoded BUP directory as JSON and exit
  --skip-bgm         do not attempt BGM conversion
  -h, --help         show this help
`;

function parseArgs(argv) {
    const opts = { out: "out", slot: 0, json: false, skipBgm: false };
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "-h" || a === "--help") opts.help = true;
        else if (a === "--json") opts.json = true;
        else if (a === "--skip-bgm") opts.skipBgm = true;
        else if (a === "--out") opts.out = argv[++i];
        else if (a === "--slot") opts.slot = parseInt(argv[++i], 10);
        else if (a.startsWith("--")) { console.error(`unknown option: ${a}`); process.exit(2); }
        else positional.push(a);
    }
    opts.input = positional[0];
    return opts;
}

function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help || !opts.input) {
        process.stdout.write(USAGE);
        process.exit(opts.help ? 0 : 2);
    }

    const raw = fs.readFileSync(opts.input);
    const interleaved = detect(raw);
    const data = deinterleave(raw);

    let saves;
    try {
        saves = bup.parse(data);
    } catch (err) {
        console.error(`error: ${err.message}`);
        process.exit(3);
    }

    if (saves.length === 0) {
        console.error("error: no save entries found in image");
        process.exit(3);
    }

    if (opts.json) {
        const out = saves.map((s) => ({
            offset: `0x${s.offset.toString(16)}`,
            filename: s.filename,
            comment: s.comment,
            language: s.language,
            date: bup.bupDateToDate(s.date).toISOString(),
            datasize: s.datasize,
            blocks: s.blocks.length,
            payload: {
                start: `0x${s.payload.start.toString(16)}`,
                end: `0x${s.payload.end.toString(16)}`,
                length: s.payload.buffer.length,
                approximate: s.payload.approximate,
            },
        }));
        process.stdout.write(JSON.stringify({ interleaved, saves: out }, null, 2) + "\n");
        return;
    }

    const save = saves[opts.slot];
    if (!save) {
        console.error(`error: slot ${opts.slot} out of range (have ${saves.length})`);
        process.exit(3);
    }

    console.log(`Loaded "${save.filename}" (${save.comment}) — ${save.payload.buffer.length} payload bytes`);
    console.warn(
        "\nDecoders for sprites/enemies/stages/bullets are not implemented yet.\n" +
        "Phase 2 reverse-engineering needs controlled-delta save samples — see\n" +
        `${path.relative(process.cwd(), path.join(__dirname, "FORMAT.md"))} for the current map and how to help.`
    );
    process.exitCode = 0;
}

if (require.main === module) main();

module.exports = { parseArgs };
