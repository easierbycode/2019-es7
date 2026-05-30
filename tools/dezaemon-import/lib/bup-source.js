"use strict";

// Container-format normalizer: turns whatever shape the user hands us into a
// raw Saturn BUP byte image that `bup-parse.js` can walk.
//
// Three wrappings observed in the wild:
//   - gzip: Mednafen / OpenEmu writes the Saturn cart as a gzip stream of the
//     raw 512KB image (file ends in .bcr). Magic 0x1f 0x8b at byte 0.
//   - 0xFF-interleaved: full hardware-style cart dumps with every even byte
//     set to 0xFF (the unused high half of each backup-RAM word). 1MB on disk,
//     512KB logical.
//   - raw: 32KB internal-RAM dumps (.bkr) and already-unwrapped cart images.

const zlib = require("zlib");
const { detect: detectInterleave, deinterleave } = require("./bup-deinterleave");

function isGzip(buf) {
    return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

// Returns { kind, data } where data is the raw BUP bytes.
function normalize(buf) {
    if (isGzip(buf)) return { kind: "gzip", data: zlib.gunzipSync(buf) };
    if (detectInterleave(buf)) return { kind: "interleaved", data: deinterleave(buf) };
    return { kind: "raw", data: Buffer.from(buf) };
}

module.exports = { normalize, isGzip };
