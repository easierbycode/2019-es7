#!/usr/bin/env node
// Decompress every game save found in fixtures/ and ../../dev-fixtures/ into
// dev-out/corpus/<game>/secN.bin plus a manifest.json describing each game.
// This is the working corpus for cross-game differential RE of the section
// contents (sprites / enemies / stage scripts).
//
//   node dev/decode-corpus.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { parseSectionTable, isGameSave } from "../lib/payload-table.js";
import { decompress, SECTION_SIZES } from "../lib/decompress.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const outRoot = path.join(root, "dev-out", "corpus");

const inputDirs = [
    path.join(root, "fixtures"),
    path.join(root, "..", "..", "dev-fixtures"),
];

const slugify = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";

// Disc SGM_*.CMP sample games: u32LE compressedSize + one LZSS stream over the
// live LWRAM region = the 8 raw sections in MEMORY order (sec5 before sec4:
// CG pages x4, assembly, palettes, BGM, 3D). Proven by SGM_RAMS matching the
// ramsie.sav cart save byte-for-byte on all 8 sections under this slicing.
const SGM_STREAM_ORDER = [0, 1, 2, 3, 5, 4, 6, 7];
const SGM_TOTAL = SECTION_SIZES.reduce((a, b) => a + b, 0);

function ingestDiscGames(discDir, outRoot, manifest) {
    if (!fs.existsSync(discDir)) return;
    for (const name of fs.readdirSync(discDir).sort()) {
        const m = /^SGM_([A-Z]+)\.CMP$/.exec(name);
        if (!m) continue;
        const slug = `disc-${m[1].toLowerCase()}`;
        const raw = fs.readFileSync(path.join(discDir, name));
        let d;
        try {
            d = decompress(new Uint8Array(raw.subarray(4)));
        } catch (err) {
            console.error(`skip ${name}: ${err.message}`);
            continue;
        }
        if (d.length !== SGM_TOTAL) {
            console.error(`skip ${name}: decompressed ${d.length} != ${SGM_TOTAL}`);
            continue;
        }
        const outDir = path.join(outRoot, slug);
        fs.mkdirSync(outDir, { recursive: true });
        const sections = [];
        let off = 0;
        for (const idx of SGM_STREAM_ORDER) {
            const sz = SECTION_SIZES[idx];
            fs.writeFileSync(path.join(outDir, `sec${idx}.bin`), d.subarray(off, off + sz));
            sections.push({ index: idx, decompressedSize: sz, sizeMatchesKnown: true, source: "disc" });
            off += sz;
        }
        sections.sort((a, b) => a.index - b.index);
        const prev = manifest.findIndex((e) => e.slug === slug);
        if (prev !== -1) manifest.splice(prev, 1);
        manifest.push({ slug, source: `${name} (disc)`, slot: null, comment: name, language: null, date: null, datasize: null, sections });
        console.log(`${slug}  "${name}"  raw sections from disc`);
    }
}

async function main() {
    fs.mkdirSync(outRoot, { recursive: true });
    const manifest = [];
    for (const dir of inputDirs) {
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir).sort()) {
            if (!/\.(sav|bcr|bkr)$/i.test(name)) continue;
            const file = path.join(dir, name);
            let data;
            try {
                ({ data } = await normalize(fs.readFileSync(file)));
            } catch (err) {
                console.error(`skip ${name}: ${err.message}`);
                continue;
            }
            const saves = bup.parse(data).filter((s) => isGameSave(s) && s.payload);
            for (const [gi, save] of saves.entries()) {
                const base = slugify(path.basename(name).replace(/\.[^.]+$/, ""));
                const slug = saves.length > 1 ? `${base}-g${gi}` : base;
                const outDir = path.join(outRoot, slug);
                fs.mkdirSync(outDir, { recursive: true });
                const table = parseSectionTable(save.payload.buffer);
                const sections = [];
                for (const s of table.sections) {
                    const compressed = save.payload.buffer.subarray(s.offset, s.offset + s.size);
                    let decompressed = null;
                    let error = null;
                    try {
                        decompressed = decompress(compressed);
                    } catch (err) {
                        error = err.message;
                    }
                    if (decompressed) {
                        fs.writeFileSync(path.join(outDir, `sec${s.index}.bin`), decompressed);
                    }
                    sections.push({
                        index: s.index,
                        compressedSize: s.size,
                        decompressedSize: decompressed ? decompressed.length : null,
                        sizeMatchesKnown: decompressed ? decompressed.length === SECTION_SIZES[s.index] : false,
                        checksum: s.checksum >>> 0,
                        error,
                    });
                }
                manifest.push({
                    slug,
                    source: name,
                    slot: save.filename,
                    comment: save.comment,
                    language: save.language,
                    date: save.date ? bup.bupDateToDate(save.date).toISOString().slice(0, 10) : null,
                    datasize: save.datasize,
                    sections,
                });
                const ok = sections.every((s) => s.sizeMatchesKnown);
                console.log(`${slug}  "${save.comment}"  ${save.datasize}B  ${ok ? "all sections OK" : "SECTION MISMATCH"}`);
            }
        }
    }
    ingestDiscGames(path.join(root, "dev-out", "disc"), outRoot, manifest);
    fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`\n${manifest.length} games -> ${path.relative(root, outRoot)}/manifest.json`);
}

main();
