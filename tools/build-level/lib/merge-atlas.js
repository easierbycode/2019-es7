"use strict";

// Bakes a Firebase level's atlasImageDataURL + atlasFrames into a single
// merged game_asset PNG + JSON Hash file, offline. Mirrors the runtime merge
// in src/phaser/BootScene.js (~lines 599-666): local image on top, firebase
// image below with a y-offset of localH. Also mirrors the .png/.gif alt-name
// doubling so animations find their replacements.

const fs = require("fs");
const path = require("path");

let _PNG = null;
function getPng() {
    if (!_PNG) _PNG = require("pngjs").PNG;
    return _PNG;
}

function fbKeyDecode(name) { return String(name).replace(/\u2024/g, "."); }

function loadPng(file) {
    return getPng().sync.read(fs.readFileSync(file));
}

function decodeDataUrlPng(dataUrl) {
    const comma = dataUrl.indexOf(",");
    const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
    return getPng().sync.read(buf);
}

// Build a merged PNG by stacking local on top of fb vertically.
function compositeVertical(localPng, fbPng) {
    const width = Math.max(localPng.width, fbPng.width);
    const height = localPng.height + fbPng.height;
    const out = new (getPng())({ width: width, height: height });
    out.data.fill(0);
    // local at (0,0)
    for (let y = 0; y < localPng.height; y++) {
        for (let x = 0; x < localPng.width; x++) {
            const si = (y * localPng.width + x) * 4;
            const di = (y * width + x) * 4;
            out.data[di]   = localPng.data[si];
            out.data[di+1] = localPng.data[si+1];
            out.data[di+2] = localPng.data[si+2];
            out.data[di+3] = localPng.data[si+3];
        }
    }
    // fb at (0, localH)
    const yOff = localPng.height;
    for (let y = 0; y < fbPng.height; y++) {
        for (let x = 0; x < fbPng.width; x++) {
            const si = (y * fbPng.width + x) * 4;
            const di = ((y + yOff) * width + x) * 4;
            out.data[di]   = fbPng.data[si];
            out.data[di+1] = fbPng.data[si+1];
            out.data[di+2] = fbPng.data[si+2];
            out.data[di+3] = fbPng.data[si+3];
        }
    }
    return out;
}

// Phaser 3 JSON Hash atlas format shim builder. The project's assets/*.json
// files use that format: { frames: { "name": { frame:{x,y,w,h}, rotated, trimmed, spriteSourceSize:{...}, sourceSize:{...} } }, meta: {...} }
function buildMergedFrameMap(localJson, levelData, localH, mergedImageWH) {
    const frames = Object.assign({}, localJson.frames || {});
    // Firebase frames:
    const fbFrames = levelData.atlasFrames || {};
    for (const rawName of Object.keys(fbFrames)) {
        const fd = fbFrames[rawName];
        if (!fd || !fd.frame) continue;
        const name = fbKeyDecode(rawName);
        const fw = fd.frame.w;
        const fh = fd.frame.h;
        const entry = {
            frame: { x: fd.frame.x, y: fd.frame.y + localH, w: fw, h: fh },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: fw, h: fh },
            sourceSize: { w: fw, h: fh }
        };
        frames[name] = entry;
        // .png <-> .gif alt name mirror (matches BootScene behavior)
        let alt = null;
        if (name.endsWith(".png")) alt = name.slice(0, -4) + ".gif";
        else if (name.endsWith(".gif")) alt = name.slice(0, -4) + ".png";
        if (alt && frames[alt]) frames[alt] = entry;
    }
    return {
        frames: frames,
        meta: Object.assign({}, localJson.meta || {}, {
            app: "build-level/merge-atlas.js",
            size: { w: mergedImageWH.w, h: mergedImageWH.h },
            scale: "1"
        })
    };
}

// Main entry. Reads local atlas from sourceRoot/assets/, writes merged PNG+JSON
// into destAssetsDir (e.g. build/<slug>/www/assets).
async function bakeMergedAtlas(opts) {
    const sourceRoot = opts.sourceRoot;
    const destAssetsDir = opts.destAssetsDir;
    const levelData = opts.levelData;

    // Prefer _ variants (editor-repacked) when they exist, matching BootScene's
    // `window.__editorAtlases` fallback.
    const candidates = [
        { img: "img/_game_asset.png", json: "_game_asset.json" },
        { img: "img/game_asset.png",  json: "game_asset.json"  }
    ];
    let chosen = null;
    for (const c of candidates) {
        const ip = path.join(sourceRoot, "assets", c.img);
        const jp = path.join(sourceRoot, "assets", c.json);
        if (fs.existsSync(ip) && fs.existsSync(jp)) { chosen = { ip, jp }; break; }
    }
    if (!chosen) throw new Error("No game_asset atlas found under " + sourceRoot + "/assets");

    const localJson = JSON.parse(fs.readFileSync(chosen.jp, "utf8"));
    const outImgDir = path.join(destAssetsDir, "img");
    fs.mkdirSync(outImgDir, { recursive: true });

    // Short-circuit: no firebase atlas override → copy as-is.
    if (!levelData.atlasImageDataURL || !levelData.atlasFrames) {
        fs.copyFileSync(chosen.ip, path.join(outImgDir, "game_asset.png"));
        fs.writeFileSync(path.join(destAssetsDir, "game_asset.json"), JSON.stringify(localJson));
        return { merged: false };
    }

    const localPng = loadPng(chosen.ip);
    const fbPng = decodeDataUrlPng(levelData.atlasImageDataURL);
    const mergedPng = compositeVertical(localPng, fbPng);
    const mergedBuf = getPng().sync.write(mergedPng);
    fs.writeFileSync(path.join(outImgDir, "game_asset.png"), mergedBuf);

    const mergedJson = buildMergedFrameMap(localJson, levelData, localPng.height, { w: mergedPng.width, h: mergedPng.height });
    fs.writeFileSync(path.join(destAssetsDir, "game_asset.json"), JSON.stringify(mergedJson));

    return { merged: true, localH: localPng.height, fbH: fbPng.height, frames: Object.keys(mergedJson.frames).length };
}

module.exports = { bakeMergedAtlas, fbKeyDecode };
