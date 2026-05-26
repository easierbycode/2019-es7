"use strict";

// Saturn BUP (backup RAM) directory parser.
//
// Confirmed on-disk directory-entry layout (validated against two real
// Dezaemon 2 saves, Ramsie & Mucha Kucha Fighter — field boundaries pinned by
// comparing the two entries byte-for-byte):
//
//   +0x00  u32 BE   flag = 0x80000000  (entry occupied / archive bit)
//   +0x04  char[12] filename, null-padded   e.g. "DEZA2____01\0"
//   +0x10  char[10] comment,  null-padded   e.g. "DEZA2 SGM" / "MuchaKucha"
//   +0x1A  u8       language (0 = Japanese, 5 = Italian, ...)
//   +0x1B  u24 BE   date (minutes since 1980-01-01 00:00) — 3 bytes
//   +0x1E  u32 BE   datasize (payload bytes)
//   +0x22  u16 BE[] block list, 0x0000-terminated
//
// (Ramsie: lang 0, ~2008, datasize 167511. Mucha: lang 5, ~1997, datasize
// 153503. A 4-byte date would push datasize one byte and yield impossible
// values, so the date is 3 bytes here.)
//
// The "BackUpRam Format" ASCII magic (4x = 64 bytes) marks the start of each
// backup page. On the 4Mbit cartridge dumps we have, the live directory page
// begins at logical offset 0x8000 and the single save's directory entry sits
// at 0x8400.
//
// NOTE: payload reassembly from the block list is still being reverse-
// engineered (the list contains 0x0000 gaps and a trailing value after the
// terminator that need controlled-delta samples to interpret). For now we
// expose the decoded directory fields plus a *provisional* contiguous payload
// slice of `datasize` bytes; see extractPayload().

const MAGIC = Buffer.from("BackUpRam Format", "latin1");
const ENTRY_FLAG = 0x80000000;

function findEntries(data) {
    const entries = [];
    for (let off = 0; off + 4 <= data.length; off += 4) {
        if (data.readUInt32BE(off) === ENTRY_FLAG) {
            // A real entry has a printable filename right after the flag.
            const name = readString(data, off + 4, 12);
            if (name.length >= 1 && /^[\x20-\x7e]+$/.test(name)) {
                entries.push(off);
            }
        }
    }
    return entries;
}

function readString(data, off, max) {
    let end = off;
    const limit = Math.min(off + max, data.length);
    while (end < limit && data[end] !== 0x00) end++;
    return data.slice(off, end).toString("latin1");
}

function parseEntry(data, off) {
    const flag = data.readUInt32BE(off);
    if (flag !== ENTRY_FLAG) {
        throw new Error(`no BUP entry flag at 0x${off.toString(16)}`);
    }
    const filename = readString(data, off + 0x04, 12);
    const comment = readString(data, off + 0x10, 10);
    const language = data[off + 0x1a];
    const date = data.readUIntBE(off + 0x1b, 3);
    const datasize = data.readUInt32BE(off + 0x1e);

    // Block list: u16 BE values until a 0x0000 terminator.
    const blocks = [];
    let p = off + 0x22;
    while (p + 2 <= data.length) {
        const v = data.readUInt16BE(p);
        if (v === 0x0000) break;
        blocks.push(v);
        p += 2;
    }

    return {
        offset: off,
        filename,
        comment,
        language,
        date,
        datasize,
        blocks,
        blockListEnd: p,
    };
}

// Convert the BUP date (minutes since 1980-01-01) to a JS Date.
function bupDateToDate(minutes) {
    const epoch1980 = Date.UTC(1980, 0, 1, 0, 0, 0);
    return new Date(epoch1980 + minutes * 60_000);
}

// Provisional: extract a contiguous `datasize`-byte payload. The Dezaemon 2
// saves we have store their data as an essentially contiguous run beginning
// right after the directory entry's block list, so this is a usable
// approximation until block-accurate reassembly is reverse-engineered.
function extractPayload(data, entry) {
    // Align payload start to the next 4-byte boundary after the block list
    // terminator (skip the terminator word itself).
    let start = entry.blockListEnd + 2;
    start = (start + 3) & ~3;
    const end = Math.min(start + entry.datasize, data.length);
    return {
        start,
        end,
        approximate: true,
        buffer: data.slice(start, end),
    };
}

// Top-level: parse a de-interleaved buffer into save records.
function parse(data) {
    if (data.indexOf(MAGIC) === -1) {
        throw new Error('not a Saturn backup image ("BackUpRam Format" magic not found)');
    }
    const offs = findEntries(data);
    return offs.map((off) => {
        const entry = parseEntry(data, off);
        const payload = extractPayload(data, entry);
        return { ...entry, payload };
    });
}

module.exports = {
    MAGIC,
    ENTRY_FLAG,
    parse,
    parseEntry,
    findEntries,
    bupDateToDate,
    extractPayload,
};
