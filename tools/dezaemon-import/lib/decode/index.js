// Aggregation seam for the Dezaemon 2 payload decoders.
//
// The editor and the CLI only ever call decodeSave(); individual section
// decoders (decode-title.js, decode-sprite.js, …) register their output here
// as the reverse-engineering lands, and both front-ends light up
// automatically.
//
// Every field carries a confidence level:
//   'confirmed'  — backed by a controlled-delta capture or Ghidra-traced offset
//   'heuristic'  — plausible decode, unverified
//   (absent)     — not decoded yet
//
// decodeSave() never throws on undecodable content — it aggregates partials
// so the UI can render "title: confirmed / sprites: heuristic / stages: not
// yet decoded" plus a raw-region fallback.

import { parseSectionTable } from "../payload-table.js";
import { decompress, SECTION_SIZES, SECTION_HINTS } from "../decompress.js";

export function decodeSave(payload) {
    const result = {
        title: null,
        confidence: {},
        sprites: [],   // {key, w, h, rgba: Uint8ClampedArray}
        enemies: [],   // {name?, hp?, score?, speed?, interval?, spriteKeys?}
        stages: [],    // {rows: [[null | {enemy: idx, drop: 0..9}, ...8], ...]} in spawn order
        regions: [],   // {name, offset, length, decoded, decompressedSize?}
        sections: null,
        tableError: null,
    };
    try {
        const table = parseSectionTable(payload);
        result.sections = table.sections.map((s) => {
            const compressed = payload.subarray(s.offset, s.offset + s.size);
            let decompressed = null;
            let decompressError = null;
            try {
                decompressed = decompress(compressed);
            } catch (err) {
                decompressError = err.message;
            }
            return {
                index: s.index,
                size: s.size,
                checksum: s.checksum,
                addr: s.addr,
                offset: s.offset,
                decompressedSize: decompressed ? decompressed.length : null,
                sizeMatchesKnown: decompressed ? decompressed.length === SECTION_SIZES[s.index] : false,
                hint: SECTION_HINTS[s.index],
                decompressed,
                decompressError,
            };
        });
        result.confidence.decompression = result.sections.every((s) => s.sizeMatchesKnown)
            ? "confirmed"
            : "heuristic";
        result.regions = result.sections.map((s) => ({
            name: `sec${s.index}: ${s.hint}`,
            offset: s.offset,
            length: s.size,
            decoded: false,
            decompressedSize: s.decompressedSize,
        }));
    } catch (err) {
        result.tableError = err.message;
        result.regions = [{ name: "payload", offset: 0, length: payload.length, decoded: false }];
    }
    return result;
}
