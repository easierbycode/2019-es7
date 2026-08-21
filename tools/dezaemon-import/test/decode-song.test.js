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
    MEASURE_HEADER,
    PARTS,
    STEPS_PER_MEASURE,
    PART_BLOCK,
    VOICE_OFFSET,
    PITCH_OFFSET,
    TEMPO_TABLE,
    TRANSPOSE_TABLE,
    isOnset,
} from "../lib/decode/decode-song.js";
import { SECTION_SIZES } from "../lib/decompress.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("song geometry accounts for every byte of a slot and of sec6", () => {
    assert.equal(SONG_HEADER + MEASURES * MEASURE_SIZE, SONG_SIZE);
    assert.equal(4 + PARTS * PART_BLOCK, MEASURE_SIZE);
    assert.equal(PART_BLOCK, 2 * STEPS_PER_MEASURE);   // voice column + pitch column
    assert.equal(SONG_SLOTS * SONG_SIZE, SECTION_SIZES[6]);
});

test("step classification: onsets, ties and rests are disjoint", () => {
    assert.ok(isNote(0x01) && isNote(0x3b));
    assert.ok(!isNote(0x00) && !isNote(0x3c) && !isNote(0x80));
    // only bit 7 marks a tie — that is all the engine tests
    assert.ok(isSustain(0x80) && isSustain(0x88) && isSustain(0xff));
    assert.ok(!isSustain(0x7f) && !isSustain(0x00));
    assert.ok(isOnset(0x08) && !isOnset(0x00) && !isOnset(0x80));
});

test("a note takes its pitch from the pitch column and holds through ties", () => {
    const bytes = new Uint8Array(SONG_SIZE);
    const part2 = SONG_HEADER + 3 * MEASURE_SIZE + MEASURE_HEADER + 2 * PART_BLOCK;
    // measure 3, part 2: onset at step 5 on instrument 0x08, pitch 0x1a,
    // held through steps 6 and 7 (the composer repeats the pitch byte).
    bytes[part2 + VOICE_OFFSET + 5] = 0x08;
    bytes[part2 + PITCH_OFFSET + 5] = 0x1a;
    bytes[part2 + VOICE_OFFSET + 6] = 0x80;
    bytes[part2 + PITCH_OFFSET + 6] = 0x1a;
    bytes[part2 + VOICE_OFFSET + 7] = 0x80;
    bytes[part2 + PITCH_OFFSET + 7] = 0x1a;
    const song = decodeSong(bytes);
    assert.equal(song.measures.length, MEASURES);
    assert.equal(song.measures[3].parts.length, PARTS);

    const events = song.events[2];
    assert.equal(events.length, 1, "a held note is one event, not three");
    assert.deepEqual(events[0], {
        step: 3 * STEPS_PER_MEASURE + 5,
        note: 0x1a,
        instrument: 0x08,
        len: 3,
    });
    assert.equal(song.onsetCount, 1);
    assert.equal(song.noteCount, 3);        // three sounding steps
    assert.equal(song.empty, false);
    assert.ok(decodeSong(new Uint8Array(SONG_SIZE)).empty);
});

test("a voice byte with no pitch beside it sounds nothing", () => {
    const bytes = new Uint8Array(SONG_SIZE);
    const part0 = SONG_HEADER + MEASURE_HEADER;
    bytes[part0 + VOICE_OFFSET + 2] = 0x10;     // instrument, but pitch column empty
    assert.equal(decodeSong(bytes).events[0].length, 0);
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
    assert.ok(first.events.filter((e) => e.length).length >= 3,
        "a real song uses multiple parts");
});

test("the pitch column carries the melody and the voice column the instrument", async () => {
    const { data } = await normalize(fs.readFileSync(path.join(here, "..", "fixtures", "ramsie.sav")));
    const d = decodeSave(bup.parse(data).find((s) => s.payload).payload.buffer);
    // Ramsie's stage-0 main song. The engine reading is falsifiable here:
    // a part draws on a handful of instruments but many pitches, and every
    // sounding note lands in the pitch column's range.
    const song = d.songs[4];
    for (const events of song.events) {
        if (events.length < 20) continue;
        const instruments = new Set(events.map((e) => e.instrument));
        const pitches = new Set(events.map((e) => e.note));
        assert.ok(instruments.size <= 4, `part uses few instruments (${instruments.size})`);
        assert.ok(pitches.size > instruments.size, "but many pitches");
        for (const e of events) assert.ok(isNote(e.note));
    }
    // Held notes exist and are single events, not one per step.
    const held = song.events.flat().filter((e) => e.len > 1);
    assert.ok(held.length > 20, "a real song holds notes across steps");
    assert.ok(song.onsetCount < song.noteCount, "sounding steps outnumber onsets");
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

test("per-measure control byte 3 is the accompaniment's semitone transpose", () => {
    const bytes = new Uint8Array(SONG_SIZE);
    bytes[SONG_HEADER + 2 * MEASURE_SIZE + 3] = 5;       // table entry 5 = +2
    // an onset in measure 2 whose pitch must NOT be shifted: the engine
    // transposes only the accompaniment channels, never the composed parts
    const part0 = SONG_HEADER + 2 * MEASURE_SIZE + MEASURE_HEADER;
    bytes[part0 + VOICE_OFFSET] = 0x08;
    bytes[part0 + PITCH_OFFSET] = 0x1a;
    const song = decodeSong(bytes);
    assert.equal(song.measures[2].transpose, 2);
    assert.equal(song.measures[0].transpose, -3);        // ctrl3=0 -> -3
    assert.equal(TRANSPOSE_TABLE[3], 0);                 // editor default
    assert.equal(song.events[0][0].note, 0x1a, "the melody is not transposed");
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
