#!/usr/bin/env node
// Dependency-free static server for the e2e suite, serving the repo root.
//
// Exists because `npx serve` (the dev server) 301-redirects "/page.html?x=1"
// to "/page" and DROPS the query string — which silently breaks
// ?editorPlay=1 / ?new=1 and would turn those specs into false passes.
// This server does no redirects and preserves queries.
//
//   node static-server.js [port]   (default 3210)

"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = Number(process.argv[2]) || 3210;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".wasm": "application/wasm",
    ".sav": "application/octet-stream",
    ".bcr": "application/octet-stream",
    ".bkr": "application/octet-stream",
};

http.createServer((req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
        res.writeHead(400).end("bad request");
        return;
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.join(ROOT, pathname);
    // Containment check (path.join normalizes any ../ away from ROOT).
    if (!file.startsWith(ROOT)) {
        res.writeHead(403).end("forbidden");
        return;
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404, { "content-type": "text/plain" }).end("not found: " + pathname);
            return;
        }
        res.writeHead(200, {
            "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
            "cache-control": "no-store",
        }).end(data);
    });
}).listen(PORT, () => {
    console.log(`e2e static server: http://localhost:${PORT} (root ${ROOT})`);
});
