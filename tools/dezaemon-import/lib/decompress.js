// Dezaemon 2 section decompressor — classic Okumura LZSS, identified by
// brute-force over the variant space (dev/scan-compression.js) and locked by
// the fact that all 16 fixture sections decode to exact, game-invariant
// region sizes (see test/decompress.test.js):
//
//   - flag byte governs the next 8 items, LSB first
//   - flag bit 1 → literal (1 byte)
//   - flag bit 0 → match (2 bytes): offset = b1 | ((b2 & 0xF0) << 4)
//     (absolute index into the ring), length = (b2 & 0x0F) + 3
//   - ring buffer: 4096 bytes, zero-filled, write position starts at 0xFEE
//     (encoders reference the zero prefill to encode leading zero-runs)
//   - stream ends when the compressed input is exhausted
//
// Environment-neutral ESM (Node + browser).

const RING_SIZE = 0x1000;
const RING_MASK = RING_SIZE - 1;
const RING_INIT = 0xfee;

export function decompress(input) {
    const out = [];
    const ring = new Uint8Array(RING_SIZE);
    let rpos = RING_INIT;
    let i = 0;
    let flags = 0;
    let flagCount = 0;
    while (i < input.length) {
        if (flagCount === 0) {
            flags = input[i++];
            flagCount = 8;
            if (i >= input.length) break;
        }
        const literal = flags & 1;
        flags >>= 1;
        flagCount--;
        if (literal) {
            if (i >= input.length) break;
            const b = input[i++];
            out.push(b);
            ring[rpos] = b;
            rpos = (rpos + 1) & RING_MASK;
        } else {
            if (i + 1 >= input.length) break;
            const b1 = input[i++];
            const b2 = input[i++];
            const off = b1 | ((b2 & 0xf0) << 4);
            const len = (b2 & 0x0f) + 3;
            for (let k = 0; k < len; k++) {
                const b = ring[(off + k) & RING_MASK];
                out.push(b);
                ring[rpos] = b;
                rpos = (rpos + 1) & RING_MASK;
            }
        }
        if (out.length > 8_000_000) {
            throw new Error("LZSS runaway: output exceeded 8MB");
        }
    }
    return Uint8Array.from(out);
}

// Known decompressed sizes of the 8 payload sections — identical for every
// game seen so far because each section is a fixed-size memory region.
export const SECTION_SIZES = [65536, 65536, 65536, 65536, 512, 396640, 101472, 5828];

// What each section appears to hold (heuristic characterization from
// cross-game diffing; 'confirmed' labels require delta captures or Ghidra).
export const SECTION_HINTS = [
    "game data A (64KB, game-specific)",
    "game data B (64KB, game-specific)",
    "game data C (64KB, game-specific)",
    "game data D (64KB, game-specific)",
    "settings (512B, ~98% game-invariant)",
    "CG / sprite pages (387KB, sparse)",
    "game data E (99KB)",
    "engine table (5.7KB, ~99.8% game-invariant)",
];
