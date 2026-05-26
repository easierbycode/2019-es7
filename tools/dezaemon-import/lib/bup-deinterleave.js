"use strict";

// Saturn backup-RAM cartridge dumps store data with 0xFF in every even byte
// (the high half of each 16-bit word is unused by the backup memory chip).
// Internal-RAM dumps from emulators are usually already de-interleaved.
//
// detect() returns true if the buffer looks interleaved. Decision rule:
//   - file length is even
//   - of the first 256 even-indexed bytes, >=95% are 0xFF
//
// deinterleave() returns a new Buffer containing just the odd bytes.

function detect(buf) {
    if (buf.length < 64 || (buf.length & 1) !== 0) return false;
    const probe = Math.min(256, buf.length);
    let ffCount = 0;
    let evens = 0;
    for (let i = 0; i < probe; i += 2) {
        evens++;
        if (buf[i] === 0xff) ffCount++;
    }
    return (ffCount / evens) >= 0.95;
}

function deinterleave(buf) {
    if (!detect(buf)) return Buffer.from(buf);
    const out = Buffer.alloc(buf.length >>> 1);
    for (let i = 0, j = 1; j < buf.length; i++, j += 2) out[i] = buf[j];
    return out;
}

module.exports = { detect, deinterleave };
