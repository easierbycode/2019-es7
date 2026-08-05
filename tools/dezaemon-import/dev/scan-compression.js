#!/usr/bin/env node
// Brute-force the Dezaemon 2 section-compression variant space.
//
// Known from eyeballing sec4: byte-oriented LZSS family — a flag byte governs
// the next 8 items, 0xFF precedes 8 one-byte literals (so flag bit 1 =
// literal). Unknown: flag bit order, match token encoding, window model.
//
// Scores every candidate against all 16 fixture sections; the known-plaintext
// anchor is sec4 (ramsie vs mucha differ by ~19 compressed bytes → the right
// variant yields near-identical outputs).
//
//   node dev/scan-compression.js            # rank all candidates
//   node dev/scan-compression.js --dump N   # decode all sections with candidate #N into dev-out/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { parseSectionTable, isGameSave } from "../lib/payload-table.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// ---------- parameterized LZSS decoder ----------

export function lzssDecode(input, o) {
    const out = [];
    const ring = o.mode === "ring" ? new Uint8Array(o.ringSize).fill(o.ringFill) : null;
    const written = o.mode === "ring" ? new Uint8Array(o.ringSize) : null;
    let virginReads = 0; // match reads of ring cells never written — the true
    //                      variant should have zero (encoders only reference
    //                      real history) unless the format relies on prefill
    let rpos = o.mode === "ring" ? o.ringInit : 0;
    let i = 0;
    let flags = 0;
    let flagCount = 0;
    const pushByte = (b) => {
        out.push(b);
        if (ring) {
            ring[rpos] = b;
            written[rpos] = 1;
            rpos = (rpos + 1) & (o.ringSize - 1);
        }
    };
    while (i < input.length) {
        if (flagCount === 0) {
            flags = input[i++];
            flagCount = 8;
            if (i >= input.length) break;
        }
        const bit = o.lsbFirst ? flags & 1 : flags & 0x80;
        flags = o.lsbFirst ? flags >> 1 : (flags << 1) & 0xff;
        flagCount--;
        const literal = o.oneIsLiteral ? !!bit : !bit;
        if (literal) {
            if (i >= input.length) break;
            pushByte(input[i++]);
        } else {
            if (i + 1 >= input.length) return { ok: false, reason: "truncated match", out: u8(out) };
            const b1 = input[i++];
            const b2 = input[i++];
            let len;
            if (o.mode === "ring") {
                let off;
                if (o.hiInB2) {
                    off = b1 | ((b2 & 0xf0) << 4);
                    len = (b2 & 0x0f) + o.lenBias;
                } else {
                    off = ((b1 & 0xf0) << 4) | b2;
                    len = (b1 & 0x0f) + o.lenBias;
                }
                for (let k = 0; k < len; k++) {
                    const cell = (off + k) & (o.ringSize - 1);
                    if (!written[cell]) virginReads++;
                    pushByte(ring[cell]);
                }
            } else {
                let dist;
                if (o.enc === "12x4") {
                    dist = (b1 | ((b2 & 0xf0) << 4)) + o.distBias;
                    len = (b2 & 0x0f) + o.lenBias;
                } else if (o.enc === "4x12") {
                    dist = (((b1 & 0x0f) << 8) | b2) + o.distBias;
                    len = (b1 >> 4) + o.lenBias;
                } else if (o.enc === "12x4hi") {
                    dist = ((b1 << 4) | (b2 >> 4)) + o.distBias;
                    len = (b2 & 0x0f) + o.lenBias;
                } else {
                    // 8x8
                    dist = b1 + o.distBias;
                    len = b2 + o.lenBias;
                }
                if (dist <= 0 || dist > out.length) return { ok: false, reason: "bad distance", out: u8(out) };
                for (let k = 0; k < len; k++) out.push(out[out.length - dist]);
            }
        }
        if (out.length > 4_000_000) return { ok: false, reason: "runaway", out: u8(out), virginReads };
    }
    return { ok: true, out: u8(out), virginReads };
}

function u8(arr) {
    return Uint8Array.from(arr);
}

// ---------- candidate grid ----------

export function candidates() {
    const list = [];
    for (const lsbFirst of [true, false]) {
        for (const oneIsLiteral of [true, false]) {
            for (const lenBias of [3, 2]) {
                for (const hiInB2 of [true, false]) {
                    for (const ringFill of [0x00, 0x20]) {
                        list.push({
                            mode: "ring", ringSize: 0x1000, ringInit: 0x1000 - 18 - (3 - lenBias),
                            lsbFirst, oneIsLiteral, lenBias, hiInB2, ringFill,
                            name: `ring4k ${lsbFirst ? "lsb" : "msb"} ${oneIsLiteral ? "1=lit" : "0=lit"} len+${lenBias} ${hiInB2 ? "off=b1|b2hi" : "off=b1hi|b2"} fill=${ringFill}`,
                        });
                    }
                }
                for (const enc of ["12x4", "4x12", "12x4hi", "8x8"]) {
                    for (const distBias of [0, 1]) {
                        list.push({
                            mode: "rel", enc, distBias,
                            lsbFirst, oneIsLiteral, lenBias,
                            name: `rel ${enc} ${lsbFirst ? "lsb" : "msb"} ${oneIsLiteral ? "1=lit" : "0=lit"} len+${lenBias} dist+${distBias}`,
                        });
                    }
                }
            }
        }
    }
    return list;
}

// ---------- scoring ----------

function entropy(buf) {
    if (!buf.length) return 0;
    const freq = new Array(256).fill(0);
    for (const b of buf) freq[b]++;
    let e = 0;
    for (const f of freq) {
        if (!f) continue;
        const p = f / buf.length;
        e -= p * Math.log2(p);
    }
    return e;
}

function similarity(a, b) {
    const n = Math.min(a.length, b.length);
    if (!n) return 0;
    let same = 0;
    for (let i = 0; i < n; i++) if (a[i] === b[i]) same++;
    return same / Math.max(a.length, b.length);
}

async function loadSections(file) {
    const { data } = await normalize(fs.readFileSync(file));
    const save = bup.parse(data).find((s) => isGameSave(s) && s.payload);
    const table = parseSectionTable(save.payload.buffer);
    return table.sections.map((s) => save.payload.buffer.subarray(s.offset, s.offset + s.size));
}

async function main() {
    const FIX = path.join(here, "..", "fixtures");
    const ramsie = await loadSections(path.join(FIX, "ramsie.sav"));
    const mucha = await loadSections(path.join(FIX, "mucha-kucha.sav"));
    const all = [...ramsie.map((s, i) => ({ tag: `ramsie/sec${i}`, buf: s })), ...mucha.map((s, i) => ({ tag: `mucha/sec${i}`, buf: s }))];

    const dumpIdx = process.argv.includes("--dump") ? Number(process.argv[process.argv.indexOf("--dump") + 1]) : null;
    const cands = candidates();

    const results = cands.map((cand, ci) => {
        let okCount = 0;
        let entropySum = 0;
        let virginTotal = 0;
        let outSizes = [];
        for (const { buf } of all) {
            const r = lzssDecode(buf, cand);
            virginTotal += r.virginReads || 0;
            if (r.ok && r.out.length >= buf.length) {
                okCount++;
                entropySum += entropy(r.out);
                outSizes.push(r.out.length);
            }
        }
        // Known-plaintext anchor: sec4 of the two games must nearly match.
        const r4a = lzssDecode(ramsie[4], cand);
        const r4b = lzssDecode(mucha[4], cand);
        const sec4Sim = r4a.ok && r4b.ok ? similarity(r4a.out, r4b.out) : 0;
        const avgEntropy = okCount ? entropySum / okCount : 9;
        const expansion = outSizes.length ? outSizes.reduce((a, b) => a + b, 0) / all.reduce((a, x) => a + x.buf.length, 0) : 0;
        const score = okCount * 10 + sec4Sim * 100 - avgEntropy * 2 - (virginTotal > 0 ? 50 + Math.log2(1 + virginTotal) : 0);
        return { ci, cand, okCount, sec4Sim, avgEntropy, expansion, virginTotal, score };
    });

    results.sort((a, b) => b.score - a.score);
    console.log("rank ok/16 sec4sim avgH  expand  virgin  candidate");
    for (const r of results.slice(0, 15)) {
        console.log(
            `#${String(r.ci).padStart(3)} ${String(r.okCount).padStart(2)}/16  ${r.sec4Sim.toFixed(3)}  ${r.avgEntropy.toFixed(2)}  ${r.expansion.toFixed(2)}x  ${String(r.virginTotal).padStart(6)}  ${r.cand.name}`
        );
    }

    if (dumpIdx !== null) {
        const cand = cands[dumpIdx];
        console.log(`\ndumping with candidate #${dumpIdx}: ${cand.name}`);
        for (const { tag, buf } of all) {
            const r = lzssDecode(buf, cand);
            const outFile = path.join(here, "..", "dev-out", "decoded", tag.replace("/", "-") + ".bin");
            fs.mkdirSync(path.dirname(outFile), { recursive: true });
            fs.writeFileSync(outFile, r.out);
            console.log(`${tag}: ${buf.length} -> ${r.out.length} bytes (${r.ok ? "clean" : r.reason})`);
        }
    }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) main();
