// BGM decoder tests — sec6's 24 song slots, 4 parts x 32 measures.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "../lib/bup-source.js";
import * as bup from "../lib/bup-parse.js";
import { decodeSave } from "../lib/decode/index.js";
import {
    decodeSong,
    decodeSongs,
    isNote,
    isSustain,
    SONG_SIZE,
    SONG_SLOTS,
    MEASURES,
    MEASURE_SIZE,
    SONG_HEADER,
    PARTS,
    VOICES,
    STEPS_PER_MEASURE,
    PART_BLOCK,
    TEMPO_TABLE,
    TRANSPOSE_TABLE,
} from "../lib/decode/decode-song.js";
import { SECTION_SIZES } from "../lib/decompress.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("song geometry accounts for every byte of a slot and of sec6", () => {
    assert.equal(SONG_HEADER + MEASURES * MEASURE_SIZE, SONG_SIZE);
    assert.equal(4 + PARTS * VOICES * STEPS_PER_MEASURE, MEASURE_SIZE);
    assert.equal(SONG_SLOTS * SONG_SIZE, SECTION_SIZES[6]);
});

test("step classification: notes, sustains and empties are disjoint", () => {
    assert.ok(isNote(0x01) && isNote(0x3b));
    assert.ok(!isNote(0x00) && !isNote(0x3c) && !isNote(0x80));
    assert.ok(isSustain(0x80) && isSustain(0x88));
    assert.ok(!isSustain(0x7f) && !isSustain(0x89));
});

test("a song decodes into 32 measures of 4 two-voice parts", () => {
    const bytes = new Uint8Array(SONG_SIZE);
    // measure 3, part 2, voice A step 5 gets note 0x1a; voice B step 5 a fifth up
    bytes[SONG_HEADER + 3 * MEASURE_SIZE + 4 + 2 * PART_BLOCK + 5] = 0x1a;
    bytes[SONG_HEADER + 3 * MEASURE_SIZE + 4 + 2 * PART_BLOCK + STEPS_PER_MEASURE + 5] = 0x21;
    const song = decodeSong(bytes);
    assert.equal(song.measures.length, MEASURES);
    assert.equal(song.measures[3].parts.length, PARTS);
    assert.equal(song.measures[3].parts[2][5], 0x1a);
    assert.equal(song.measures[3].parts[2][STEPS_PER_MEASURE + 5], 0x21);
    assert.equal(song.noteCount, 2);
    assert.equal(song.empty, false);
    assert.ok(decodeSong(new Uint8Array(SONG_SIZE)).empty);
});

test("ramsie's BGM bank decodes with the expected number of live songs", async () => {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", "ramsie.sav")));
    const save = bup.parse(data).find((s) => s.payload);
    const decoded = decodeSave(save.payload.buffer);
    assert.equal(decoded.confidence.songs, "confirmed");
    assert.equal(decoded.songs.length, SONG_SLOTS);
    assert.equal(decoded.songCount, 14);
    assert.ok(decoded.regions[6].decoded);
    // the first slot is a real arrangement: notes spread over several parts
    const first = decoded.songs[0];
    assert.ok(first.noteCount > 100);
    const partsWithNotes = new Set();
    for (const m of first.measures) {
        m.parts.forEach((steps, p) => {
            if ([...steps].some(isNote)) partsWithNotes.add(p);
        });
    }
    assert.ok(partsWithNotes.size >= 3, "a real song uses multiple parts");
});

test("every measure of every song slot stays inside the slot", () => {
    const sec6 = new Uint8Array(SECTION_SIZES[6]);
    const { songs } = decodeSongs(sec6);
    assert.equal(songs.length, SONG_SLOTS);
    assert.ok(songs.every((s) => s.measures.length === MEASURES));
    assert.ok(songs.every((s) => s.empty));
});

test("each song carries the header's tempo index, step seconds and echo", async () => {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", "ramsie.sav")));
    const d = decodeSave(bup.parse(data).find((s) => s.payload).payload.buffer);
    const live = d.songs.filter((s) => s.noteCount);
    assert.ok(live.length > 5);
    for (const song of live) {
        assert.ok(song.tempoIndex >= 0 && song.tempoIndex <= 31,
            `song ${song.slot} tempoIndex ${song.tempoIndex} in range`);
        assert.equal(song.tempoIndex, song.header[3] & 31);
        assert.equal(song.stepSeconds, TEMPO_TABLE[song.tempoIndex] / 240);
        assert.equal(song.echoLevel, song.header[2] & 7);
    }
    // ramsie uses several different tempos, so the field is not constant
    assert.ok(new Set(live.map((s) => s.tempoIndex)).size > 1);
    // the kernel divisor table is monotonic: higher index = faster song
    for (let i = 1; i < TEMPO_TABLE.length; i++) {
        assert.ok(TEMPO_TABLE[i] < TEMPO_TABLE[i - 1]);
    }
});

test("per-measure control byte 3 becomes a semitone transpose", () => {
    const bytes = new Uint8Array(SONG_SIZE);
    bytes[SONG_HEADER + 2 * MEASURE_SIZE + 3] = 5;       // table entry 5 = +2
    const song = decodeSong(bytes);
    assert.equal(song.measures[2].transpose, 2);
    assert.equal(song.measures[0].transpose, -3);        // ctrl3=0 -> -3
    assert.equal(TRANSPOSE_TABLE[3], 0);                 // editor default
});

test("header bytes 0/1 are loop points the kernel's walker uses", async () => {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", "ramsie.sav")));
    const d = decodeSave(bup.parse(data).find((s) => s.payload).payload.buffer);
    for (const song of d.songs.filter((s) => s.noteCount)) {
        assert.ok(song.loopEnd <= 31, `song ${song.slot} loopEnd ${song.loopEnd}`);
        assert.ok(song.loopStart <= song.loopEnd,
            `song ${song.slot} loop ${song.loopStart}..${song.loopEnd}`);
    }
});
