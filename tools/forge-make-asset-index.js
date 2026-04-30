#!/usr/bin/env node
"use strict";

// Generates index.json directory listings inside assets/img/stage,
// assets/img/loading, assets/fonts, and assets/sounds so the runtime
// forge stager (src/forge/stage-www.js) can enumerate them via fetch.

const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = path.resolve(__dirname, "..");
const TARGETS = [
    "assets/img/stage",
    "assets/img/loading",
    "assets/fonts",
    "assets/sounds"
];

function listFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    const stack = [{ abs: dir, rel: "" }];
    while (stack.length) {
        const cur = stack.pop();
        for (const e of fs.readdirSync(cur.abs, { withFileTypes: true })) {
            const abs = path.join(cur.abs, e.name);
            const rel = cur.rel ? cur.rel + "/" + e.name : e.name;
            if (e.isDirectory()) stack.push({ abs, rel });
            else if (e.isFile() && e.name !== "index.json") out.push(rel);
        }
    }
    out.sort();
    return out;
}

function main() {
    const target = process.argv[2] ? path.resolve(process.argv[2]) : SOURCE_ROOT;
    let total = 0;
    for (const rel of TARGETS) {
        const dir = path.join(target, rel);
        const files = listFiles(dir);
        if (!files.length) continue;
        const out = path.join(dir, "index.json");
        fs.writeFileSync(out, JSON.stringify({ files }, null, 2));
        console.log("wrote " + out + " (" + files.length + " files)");
        total += files.length;
    }
    console.log("indexed " + total + " files across " + TARGETS.length + " directories");
}

main();
