"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");

// An imported save's soundtrack has to make actual sound, not merely get
// scheduled. This spec taps the sequencer's own output node with an
// AnalyserNode and measures the waveform: silence reads as a flat 128 in
// getByteTimeDomainData, so any real deviation proves oscillators are
// feeding samples through. Same for the SFX bank.
//
// Ramsie is the reference save (the sample game shipped on the disc): one
// slot, five stages, 13 songs referenced by its BGM table, SFX set 3 (SF).
//
// NOTE: this spec deliberately runs WITHOUT ?lowmode=1 — low mode silences
// every audio path, the sequencer included, so there would be nothing to
// measure.
const RAMSIE = path.resolve(__dirname, "..", "..", "..", "dev-fixtures", "Dez 2 - Ramsie.sav");
const SLOT = 0;                 // DEZA2____01 — Ramsie's only save
const STAGE0_MAIN_SONG = 4;     // its BGM table's stage-0 main assignment
const SFX_SET_SF = 3;

test("an imported save's BGM and SFX make real sound", async ({ page, context }) => {
    test.setTimeout(180_000);
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", RAMSIE);
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    const slot = page.locator("#deza-slot-list > div").nth(SLOT);
    await expect(slot).toContainText("DEZA2____01");
    await slot.click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // The save's own soundtrack reached the recipe.
    const exported = await page.evaluate(() => {
        const b = gameData.dezaemonBgm;
        return b && {
            sfxSet: b.sfxSet,
            songCount: Object.keys(b.songs).length,
            stage0: b.stages[0],
            stageCount: b.stages.length,
        };
    });
    expect(exported).not.toBeNull();
    expect(exported.sfxSet).toBe(SFX_SET_SF);
    expect(exported.songCount).toBeGreaterThan(5);
    expect(exported.stageCount).toBe(5);
    expect(exported.stage0[0]).toBe(STAGE0_MAIN_SONG);

    await page.evaluate(() => {
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(buildRuntimeRecipe()));
        localStorage.setItem("__editorPhaserStageId__", "0");
        storeAtlasForViewers();
    });

    const gamePage = await context.newPage();
    await gamePage.goto("/phaser-game.html?editorPlay=1&stage=0");
    await expect.poll(() => gamePage.evaluate(() => {
        const g = window.__PHASER_4_GAME__;
        if (!g) return "booting";
        const now = g.loop ? g.loop.time : 0;
        if (window.__lastLoopTime === now && g.loop) {
            for (let i = 0; i < 20; i++) g.loop.step(performance.now() + i * 16.7);
        }
        window.__lastLoopTime = now;
        const active = g.scene.getScenes(true).map((s) => s.scene.key);
        return active.includes("PhaserGameScene") ? "PhaserGameScene" : active.join(",") || "none";
    }), { timeout: 120_000, intervals: [500] }).toBe("PhaserGameScene");

    // The sequencer picked the stage's assigned main song, and the stock boss
    // BGM stood down.
    const seq = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const st = s._dezaBgm;
        return st ? { songIndex: st.songIndex, which: st.which, stockBgm: s.stageBgmName, ctx: s.sound.context.state } : null;
    });
    expect(seq).not.toBeNull();
    expect(seq.songIndex).toBe(STAGE0_MAIN_SONG);
    expect(seq.which).toBe("main");
    expect(seq.stockBgm).toBe("__dezaemon__");
    expect(seq.ctx).toBe("running");

    // Tap the sequencer's master node and let real time pass — WebAudio runs
    // on the audio clock, so the loop is pumped alongside real waits to keep
    // the scheduler fed.
    const heard = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        const ctx = s.sound.context;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        s._dezaBgm.master.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);

        let peak = 0;
        let nonSilentFrames = 0;
        let samples = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 4000) {
            for (let i = 0; i < 6; i++) g.loop.step(performance.now() + i * 16.7);
            await new Promise((r) => setTimeout(r, 40));
            analyser.getByteTimeDomainData(buf);
            let localPeak = 0;
            for (let i = 0; i < buf.length; i++) {
                const dev = Math.abs(buf[i] - 128);
                if (dev > localPeak) localPeak = dev;
            }
            samples++;
            if (localPeak > 2) nonSilentFrames++;
            if (localPeak > peak) peak = localPeak;
        }
        return {
            peak,
            nonSilentFrames,
            samples,
            scheduled: s._dezaBgm.scheduled,
            loops: s._dezaBgm.loop,
        };
    });
    // A silent graph reads a flat 128; real oscillator output swings well past
    // a couple of units, and does so across most of the window.
    expect(heard.scheduled).toBeGreaterThan(0);
    expect(heard.peak).toBeGreaterThan(10);
    expect(heard.nonSilentFrames).toBeGreaterThan(heard.samples * 0.5);

    // What it plays has to match the song bytes the way the Saturn reads
    // them, not merely make noise. Each part's 32 bytes per measure are two
    // columns of 16 steps: the voice column (0 rest, bit 7 tie, else an
    // instrument id starting a note) and the pitch column. Reading those
    // backwards — as two melodic voices — still produces sound, so this
    // checks the note VALUES and the note LENGTHS against the raw bytes.
    const musical = await gamePage.evaluate((songIdx) => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const st = s._dezaBgm;
        const bin = atob(s.recipe.dezaemonBgm.songs[songIdx]);
        const raw = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        const at = (part, step, column) =>
            raw[4 + ((step / 16) | 0) * 132 + 4 + part * 32 + column + (step % 16)];

        let events = 0, pitchFromPitchColumn = 0, onsetInVoiceColumn = 0;
        let held = 0, tiesCovered = 0, tieMismatch = 0;
        const pitches = new Set();
        st.song.parts.forEach((evs, p) => {
            for (const e of evs) {
                events++;
                pitches.add(e.note);
                if (at(p, e.step, 16) === e.note) pitchFromPitchColumn++;
                const voice = at(p, e.step, 0);
                if (voice !== 0 && (voice & 0x80) === 0) onsetInVoiceColumn++;
                if (e.len > 1) {
                    held++;
                    let ok = true;
                    for (let k = 1; k < e.len; k++) {
                        if ((at(p, e.step + k, 0) & 0x80) === 0) ok = false;
                    }
                    ok ? tiesCovered++ : tieMismatch++;
                }
            }
        });
        // the traced tempo law, recomputed from the song's own header byte
        const TEMPO = [0x42,0x3c,0x39,0x36,0x34,0x31,0x2f,0x2d,0x2b,0x2a,0x28,0x27,
                       0x26,0x24,0x23,0x22,0x21,0x20,0x1f,0x1e,0x1d,0x1c,0x1b,0x1a,
                       0x19,0x18,0x17,0x16,0x15,0x14,0x13,0x12];
        return {
            events, pitchFromPitchColumn, onsetInVoiceColumn, held, tiesCovered, tieMismatch,
            distinctPitches: pitches.size,
            parts: st.song.parts.length,
            stepSeconds: st.stepSeconds,
            expectedStepSeconds: TEMPO[raw[3] & 31] / 240,
            bpm: 3600 / TEMPO[raw[3] & 31],
            loopStartStep: st.song.loopStartStep,
            loopEndStep: st.song.loopEndStep,
            echoLevel: st.song.echoLevel,
            hasEchoTap: !!st.echo,
        };
    }, STAGE0_MAIN_SONG);

    expect(musical.parts).toBe(4);
    // every note's pitch came from the pitch column, and every note started
    // on an onset byte in the voice column
    expect(musical.events).toBeGreaterThan(100);
    expect(musical.pitchFromPitchColumn).toBe(musical.events);
    expect(musical.onsetInVoiceColumn).toBe(musical.events);
    // held notes are single sustained events whose span is covered by ties,
    // rather than one re-strike per step
    expect(musical.held).toBeGreaterThan(20);
    expect(musical.tieMismatch).toBe(0);
    expect(musical.tiesCovered).toBe(musical.held);
    // a tune, not a drone on the instrument-select column
    expect(musical.distinctPitches).toBeGreaterThan(8);
    // timing is the traced divisor law, and the header's loop points hold
    expect(musical.stepSeconds).toBeCloseTo(musical.expectedStepSeconds, 10);
    expect(musical.bpm).toBeGreaterThan(54);
    expect(musical.bpm).toBeLessThan(201);
    expect(musical.loopEndStep).toBeGreaterThan(musical.loopStartStep);
    expect(musical.loopEndStep % 16).toBe(0);
    // Ramsie's stage-0 song asks for reverb, so the echo tap is wired up
    expect(musical.echoLevel).toBeGreaterThan(0);
    expect(musical.hasEchoTap).toBe(true);

    // The SFX bank makes sound too. Effects build their own graph straight to
    // the destination, so the tap goes on ctx.destination's incoming side by
    // intercepting connect() for the duration of one explosion.
    const sfxHeard = await gamePage.evaluate(async () => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const ctx = s.sound.context;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        const dest = ctx.destination;
        const proto = Object.getPrototypeOf(ctx.createGain());
        const realConnect = proto.connect;
        proto.connect = function (target) {
            if (target === dest) realConnect.call(this, analyser);
            return realConnect.apply(this, arguments);
        };
        let routed = false;
        try {
            routed = s.playSound("se_explosion", 0.9) !== false;
        } finally {
            proto.connect = realConnect;
        }
        const buf = new Uint8Array(analyser.fftSize);
        let peak = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 1200) {
            await new Promise((r) => setTimeout(r, 25));
            analyser.getByteTimeDomainData(buf);
            for (let i = 0; i < buf.length; i++) {
                const dev = Math.abs(buf[i] - 128);
                if (dev > peak) peak = dev;
            }
        }
        return { peak, routed, bank: s.recipe.dezaemonBgm.sfxSet };
    });
    expect(sfxHeard.bank).toBe(SFX_SET_SF);
    expect(sfxHeard.peak).toBeGreaterThan(5);
});
