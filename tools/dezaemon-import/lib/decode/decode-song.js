// Dezaemon 2 BGM decoder — sec6 is the 音まろ music editor's 24 song slots.
//
// Layout (proven against the disc's 73 M_DATA*.BIN preset songs, which are
// byte-identical to the song slots of games that use them, and against the
// kernel's own song pointer arithmetic songIndex * 0x1084 + sec6base):
//
//   song  = 4-byte header + 32 measures of 132 bytes            = 4228
//   measure = 4 control bytes + 4 parts x (2 voices x 16 steps) = 132
//
// The 32-measure / 4-part grid is exactly the editor's documented model.
// Measure boundaries are visible in the raw data: in an otherwise empty
// measure the control bytes remain non-zero, leaving 2-byte islands spaced
// exactly 132 bytes apart. The control default is `00 00 80 03` (1254 of
// 2336 preset measures).
//
// A measure is SIXTEEN time steps, not 32: the kernel's walker (0KERNEL
// +0x1bfc) advances a 0..15 cursor and, per part, reads BOTH byte
// [cursor] and byte [cursor + 16] of the part's 32-byte block each step —
// two simultaneous voices (the second is sent to the driver with its note
// id offset by +0x36, i.e. on a second slot bank). So a part's 32 bytes
// are voice A steps 0-15 followed by voice B steps 0-15.
//
// Step bytes: 0x00 = empty, 0x01-0x3B = note (a ~5-octave range), 0x80 plus
// small even offsets (0x80/0x82/0x84/0x86/0x88) = sustain/tie of the note
// already sounding. Values 0xE7/0xFF occur only in part 0 and are rare.
//
// Environment-neutral ESM (Node + browser).

export const SONG_SIZE = 4228;
export const SONG_SLOTS = 24;
export const SONG_HEADER = 4;
export const MEASURES = 32;
export const MEASURE_SIZE = 132;
export const MEASURE_HEADER = 4;
export const PARTS = 4;
export const VOICES = 2;
export const STEPS_PER_MEASURE = 16;
export const PART_BLOCK = VOICES * STEPS_PER_MEASURE;   // 32 bytes per part

export const STEP_EMPTY = 0x00;
export const NOTE_MIN = 0x01;
export const NOTE_MAX = 0x3b;

export function isNote(step) {
    return step >= NOTE_MIN && step <= NOTE_MAX;
}

export function isSustain(step) {
    return step >= 0x80 && step <= 0x88;
}

// The 4-byte song header, traced through the kernel's own sequencer
// (0KERNEL.BIN +0x1bfc walker, +0x1db8 tick, +0x1498 per-measure dispatch):
//   +0  loop-START measure (on reaching the end, playback rewinds here)
//   +1  loop-END measure   (the walker compares its cursor against +1, +1)
//   +2  ECHO send 0-7      (sent as driver command 0x88 whenever it changes:
//       (echo << 5) | 0x1F lands in SCSP slot 16/17 register +0x17 —
//       EFSDL|EFPAN, the effect/reverb send of the BGM output pair)
//   +3  TEMPO index 0-31   (indexes the kernel divisor table at 0x601F3A8;
//       the frame tick adds 4 to an accumulator and fires one step when it
//       reaches the divisor, so stepSeconds = divisor / 240 at 60 Hz)
export const SONG_LOOP_START_OFFSET = 0;
export const SONG_LOOP_END_OFFSET = 1;
export const SONG_ECHO_OFFSET = 2;
export const SONG_TEMPO_OFFSET = 3;

// The kernel's tempo divisor table (0KERNEL.BIN file +0x1B3A8, loaded flat
// at 0x601F3A8). stepsPerSecond = 240 / divisor; a 4-step beat makes the
// editor's 32 tempo positions run 54.5 - 200 BPM.
export const TEMPO_TABLE = [
    0x42, 0x3c, 0x39, 0x36, 0x34, 0x31, 0x2f, 0x2d,
    0x2b, 0x2a, 0x28, 0x27, 0x26, 0x24, 0x23, 0x22,
    0x21, 0x20, 0x1f, 0x1e, 0x1d, 0x1c, 0x1b, 0x1a,
    0x19, 0x18, 0x17, 0x16, 0x15, 0x14, 0x13, 0x12,
];

// Per-measure transpose (measure control byte 3 indexes the signed table at
// 0x601F3C8; the send-notes routine at +0x16fc adds the value to every note
// id, i.e. semitones). Saves only use indexes 0-11; the editor default
// control `00 00 80 03` selects entry 3 = no transpose.
export const TRANSPOSE_TABLE = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, -5, -4];

export function songStepSeconds(tempoIndex) {
    return TEMPO_TABLE[tempoIndex & 31] / 240;
}

// Decode one 4228-byte song image.
export function decodeSong(bytes, slot = 0) {
    if (bytes.length < SONG_SIZE) throw new Error(`song too small: ${bytes.length}`);
    const measures = [];
    let noteCount = 0;
    for (let m = 0; m < MEASURES; m++) {
        const base = SONG_HEADER + m * MEASURE_SIZE;
        const parts = [];
        for (let p = 0; p < PARTS; p++) {
            const at = base + MEASURE_HEADER + p * PART_BLOCK;
            // 32 bytes: voice A steps 0-15, then voice B steps 0-15
            const steps = bytes.subarray(at, at + PART_BLOCK);
            for (const s of steps) if (isNote(s)) noteCount++;
            parts.push(steps);
        }
        const control = bytes.subarray(base, base + MEASURE_HEADER);
        measures.push({
            index: m,
            control,
            transpose: TRANSPOSE_TABLE[control[3]] || 0,
            parts,
        });
    }
    const tempoIndex = bytes[SONG_TEMPO_OFFSET] & 31;
    return {
        slot,
        header: bytes.subarray(0, SONG_HEADER),
        tempoIndex,
        stepSeconds: songStepSeconds(tempoIndex),
        echoLevel: bytes[SONG_ECHO_OFFSET] & 7,
        loopStart: bytes[SONG_LOOP_START_OFFSET],
        loopEnd: bytes[SONG_LOOP_END_OFFSET],
        measures,
        noteCount,
        empty: noteCount === 0,
    };
}

// sec6 -> the game's 24 song slots.
export function decodeSongs(sec6) {
    const songs = [];
    for (let i = 0; i < SONG_SLOTS; i++) {
        songs.push(decodeSong(sec6.subarray(i * SONG_SIZE, (i + 1) * SONG_SIZE), i));
    }
    return { songs, usedCount: songs.filter((s) => !s.empty).length };
}
