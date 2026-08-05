#!/usr/bin/env node
// Dezaemon 2 (Sega Saturn) save importer.
//
//   node tools/dezaemon-import/index.js <input.sav> [--out <dir>] [options]
//
// Container parsing is block-accurate (payload reassembly is validated by the
// section-table checksums). --out emits the level editor's game.json + a
// Phaser atlas built from whatever the section decoders currently yield; the
// decoders themselves are pending compression reverse-engineering (FORMAT.md).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "./lib/bup-source.js";
import * as bup from "./lib/bup-parse.js";
import { parseSectionTable, isGameSave } from "./lib/payload-table.js";
import { decodeSave } from "./lib/decode/index.js";
import { mapSaveToGame, BUILTIN_DEFAULTS } from "./lib/map-to-game.js";
import { packShelf } from "./lib/atlas-pack.js";

const USAGE = `Usage: dezaemon-import <input.sav> [options]

Options:
  --out <dir>        output directory for game.json + atlas (default: ./out)
  --slot <n>         which directory entry to import (default: first game save)
  --json             print decoded BUP directory as JSON and exit
  --skip-bgm         do not attempt BGM conversion (BGM decode not implemented)
  -h, --help         show this help
`;

export class UsageError extends Error {}

export function parseArgs(argv) {
    const opts = { out: "out", slot: null, json: false, skipBgm: false };
    const positional = [];
    const need = (i, flag) => {
        const v = argv[i];
        if (v === undefined || v.startsWith("--")) throw new UsageError(`missing value for ${flag}`);
        return v;
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "-h" || a === "--help") opts.help = true;
        else if (a === "--json") opts.json = true;
        else if (a === "--skip-bgm") opts.skipBgm = true;
        else if (a === "--out") opts.out = need(++i, "--out");
        else if (a === "--slot") {
            const v = need(++i, "--slot");
            opts.slot = Number.parseInt(v, 10);
            if (Number.isNaN(opts.slot)) throw new UsageError(`invalid --slot value: ${v}`);
        } else if (a.startsWith("--")) throw new UsageError(`unknown option: ${a}`);
        else positional.push(a);
    }
    opts.input = positional[0];
    return opts;
}

function describeSave(s) {
    const out = {
        offset: `0x${s.offset.toString(16)}`,
        filename: s.filename,
        comment: s.comment,
        language: s.language,
        date: bup.bupDateToDate(s.date).toISOString(),
        datasize: s.datasize,
        blocks: s.blocks.length,
        partition: { base: `0x${s.partition.base.toString(16)}`, blockSize: s.partition.blockSize },
        payload: s.payload
            ? { start: `0x${s.payload.start.toString(16)}`, length: s.payload.buffer.length }
            : null,
    };
    if (s.payloadError) out.payloadError = s.payloadError;
    if (s.payload && isGameSave(s)) {
        try {
            const table = parseSectionTable(s.payload.buffer);
            out.sections = table.sections.map((sec) => ({
                size: sec.size,
                checksum: `0x${sec.checksum.toString(16)}`,
                lwramAddr: `0x${sec.addr.toString(16)}`,
            }));
        } catch (err) {
            out.sectionError = err.message;
        }
    }
    return out;
}

async function loadPng() {
    try {
        return (await import("pngjs")).PNG;
    } catch {
        throw new Error(
            "pngjs is required for atlas output — run `npm install` in tools/dezaemon-import"
        );
    }
}

async function writeOutput(save, opts) {
    const decoded = decodeSave(save.payload.buffer);
    const { gameJson, sprites, warnings } = mapSaveToGame(decoded, {
        defaults: BUILTIN_DEFAULTS,
        sourceEntry: save,
        importedAt: new Date().toISOString(),
    });

    const imgDir = path.join(opts.out, "img");
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(opts.out, "game.json"), JSON.stringify(gameJson, null, 2));

    const PNG = await loadPng();
    const packed = packShelf(sprites);
    const width = sprites.length ? packed.width : 16;
    const height = sprites.length ? packed.height : 16;
    const png = new PNG({ width, height });
    for (const s of sprites) {
        const p = packed.placements[s.key];
        for (let y = 0; y < s.h; y++) {
            for (let x = 0; x < s.w; x++) {
                const src = (y * s.w + x) * 4;
                const dst = ((p.y + y) * width + (p.x + x)) * 4;
                png.data[dst] = s.rgba[src];
                png.data[dst + 1] = s.rgba[src + 1];
                png.data[dst + 2] = s.rgba[src + 2];
                png.data[dst + 3] = s.rgba[src + 3];
            }
        }
    }
    fs.writeFileSync(path.join(imgDir, "game_asset.png"), PNG.sync.write(png));
    fs.writeFileSync(
        path.join(opts.out, "game_asset.json"),
        JSON.stringify(
            {
                frames: packed.frames,
                meta: { image: "img/game_asset.png", format: "RGBA8888", size: { w: width, h: height }, scale: "1" },
            },
            null,
            2
        )
    );

    console.log(`Imported "${save.comment}" → ${opts.out}${path.sep}{game.json, game_asset.json, img${path.sep}game_asset.png}`);
    console.log(`  sprites: ${sprites.length}, enemies: ${Object.keys(gameJson.enemyData).length}, stages: ${Object.keys(gameJson).filter((k) => k.startsWith("stage")).length}`);
    for (const w of warnings) console.warn(`  warning: ${w}`);
    if (decoded.tableError) {
        console.warn(`  warning: payload section table did not parse (${decoded.tableError})`);
    } else if (!decoded.confidence.sprites) {
        console.warn(
            "  note: payload sections are still compressed/undecoded — the emitted game is a\n" +
            "  playable skeleton (default art/enemies) carrying the save's metadata. See FORMAT.md."
        );
    }
    if (opts.skipBgm) console.warn("  note: --skip-bgm is reserved; BGM decoding is not implemented yet");
}

async function main() {
    let opts;
    try {
        opts = parseArgs(process.argv.slice(2));
    } catch (err) {
        if (err instanceof UsageError) {
            console.error(`error: ${err.message}\n`);
            process.stdout.write(USAGE);
            process.exit(2);
        }
        throw err;
    }
    if (opts.help || !opts.input) {
        process.stdout.write(USAGE);
        process.exit(opts.help ? 0 : 2);
    }

    const raw = fs.readFileSync(opts.input);
    const { kind, data } = await normalize(raw);

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
        const out = saves.map(describeSave);
        process.stdout.write(JSON.stringify({ container: kind, saves: out }, null, 2) + "\n");
        return;
    }

    // Default slot: the first game save (skips DEZA2___SYS settings records).
    let save;
    if (opts.slot !== null) {
        save = saves[opts.slot];
        if (!save) {
            console.error(`error: slot ${opts.slot} out of range (have ${saves.length})`);
            process.exit(3);
        }
    } else {
        save = saves.find(isGameSave) || saves[0];
    }
    if (!save.payload) {
        console.error(`error: payload extraction failed: ${save.payloadError}`);
        process.exit(3);
    }

    await writeOutput(save, opts);
}

const invokedDirectly =
    process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) main();
