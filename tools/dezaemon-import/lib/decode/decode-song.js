// Dezaemon 2 BGM decoder — sec6 is the 音まろ music editor's 24 song slots.
//
// Layout (proven against the disc's 73 M_DATA*.BIN preset songs, which are
// byte-identical to the song slots of games that use them, and against the
// kernel's own song pointer arithmetic songIndex * 0x1084 + sec6base):
//
//   song  = 4-byte header + 32 measures of 132 bytes            = 4228
//   measure = 4 control bytes + 4 parts x 32 steps              = 132
//
// The 32-measure / 4-part grid is exactly the editor's documented model.
// Measure boundaries are visible in the raw data: in an otherwise empty
// measure the control bytes remain non-zero, leaving 2-byte islands spaced
// exactly 132 bytes apart. The control default is `00 00 80 03` (1254 of
// 2336 preset measures).
//
// Step bytes: 0x00 = empty, 0x01-0x3B = note (a ~5-octave range), 0x80 plus
// small even offsets (0x80/0x82/0x84/0x86/0x88) = sustain/tie of the note
// already sounding. Values 0xE7/0xFF occur only in part 0 and are rare.
//
// Parts are stored part-major within a measure: all 32 steps of part 0, then
// part 1, and so on. (Under the interleaved reading the part-0-only values
// smear across every part; part-major keeps them confined.)
//
// Environment-neutral ESM (Node + browser).

export const SONG_SIZE = 4228;
export const SONG_SLOTS = 24;
export const SONG_HEADER = 4;
export const MEASURES = 32;
export const MEASURE_SIZE = 132;
export const MEASURE_HEADER = 4;
export const PARTS = 4;
export const STEPS_PER_MEASURE = 32;

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
// (0KERNEL.BIN +0x1bfc, the routine that walks a playing song):
//   +0  loop-START measure (on reaching the end, playback rewinds here)
//   +1  loop-END measure   (the walker compares its cursor against +1, +1)
//   +2  TEMPO index 0-7    (sent to the sound driver each measure boundary
//       at +0x1c52; the consumer at +0x213c programs the driver rate byte as
//       (tempo << 5) | 0x1F — linear in tempo+1; see FORMAT.md)
//   +3  an index into a kernel lookup table at 0x601F3A8 (volume/voice-ish,
//       forwarded with each measure — exact meaning open)
export const SONG_LOOP_START_OFFSET = 0;
export const SONG_LOOP_END_OFFSET = 1;
export const SONG_TEMPO_OFFSET = 2;

// Decode one 4228-byte song image.
export function decodeSong(bytes, slot = 0) {
    if (bytes.length < SONG_SIZE) throw new Error(`song too small: ${bytes.length}`);
    const measures = [];
    let noteCount = 0;
    for (let m = 0; m < MEASURES; m++) {
        const base = SONG_HEADER + m * MEASURE_SIZE;
        const parts = [];
        for (let p = 0; p < PARTS; p++) {
            const at = base + MEASURE_HEADER + p * STEPS_PER_MEASURE;
            const steps = bytes.subarray(at, at + STEPS_PER_MEASURE);
            for (const s of steps) if (isNote(s)) noteCount++;
            parts.push(steps);
        }
        measures.push({ index: m, control: bytes.subarray(base, base + MEASURE_HEADER), parts });
    }
    return {
        slot,
        header: bytes.subarray(0, SONG_HEADER),
        tempoIndex: bytes[SONG_TEMPO_OFFSET] & 7,
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
