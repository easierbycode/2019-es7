"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");
const { installFirebaseStub } = require("../helpers/firebase-stub");
const { buildOfflineLevelRecord } = require("../../../tools/build-level/lib/strip-assets");

// A cloud record used to hold one stage: whichever the editor happened to have
// open. Saving a nine-stage import kept stage 0 and threw the rest away, and
// playing ?stage=3 resolved silently to the STOCK game's third stage — 37
// waves of eight-wide stock enemies over a starfield, with no warning.
//
// sav-import-play-cloud.spec.js covers what one stage has to survive the
// round-trip (Ramsie's soundtrack, scenery and pacing); this one covers the
// rest of the game coming with it. It runs the whole path against an in-page
// Firebase stub with the Realtime Database's own rules
// (helpers/firebase-stub.js): import DAIOH, save it, then replay the stored
// record through the boot path the way a forge build does, via
// window.__OFFLINE_LEVEL__.
//
// Stage 3 is the one under test because nothing about it can be mistaken for
// stage 0 or for the stock game: 196 waves on a 20-wide grid over its own
// 14x577 tile map, against stage 0's 160 waves / 14x768 map and stock stage
// 3's 37 waves / 8 columns / no map at all.
const DAIOH = path.resolve(__dirname, "..", "..", "..", "dev-fixtures", "Dezaemon 2 (DAIOH).sav");
const SLOT = 1;                 // the 2nd save — nine stages
const LEVEL = "daioh-cloud";
const LEGACY_LEVEL = "daioh-cloud-legacy";
const PLAY_STAGE = 3;
const STAGE_COUNT = 9;
const STAGE3_WAVES = 196;
const STAGE3_BG_ROWS = 577;
const STAGE0_WAVES = 160;
const TILE = 16;
const STOCK_STAGES = 5;         // assets/game.json
const STOCK_STAGE0_WAVES = 46;
// DAIOH's BGM table: stage 3 is assigned song 9 in play and song 10 on its
// boss, out of the 17 its table references, over the REAL effect bank.
const STAGE3_MAIN_SONG = 9;
const STAGE3_BOSS_SONG = 10;
const DAIOH_SFX_SET = 1;
const DAIOH_SONG_COUNT = 17;

async function importDaioh(page) {
    await installFirebaseStub(page);
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", DAIOH);
    await page.locator("#deza-slot-list > div").nth(SLOT).click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();
}

async function saveToCloud(page, name) {
    return page.evaluate(async (levelName) => {
        document.getElementById("firebase-level-name").value = levelName;
        await saveToFirebase();
        const rec = (window.__FAKE_RTDB__.levels || {})[levelName];
        if (!rec) throw new Error("nothing was written to levels/" + levelName);
        return {
            keys: Object.keys(rec).sort(),
            hasFrameThumbnails: !!rec.frameThumbnails,
            hasAtlas: !!(rec.atlasImageDataURL && rec.atlasFrames),
            bytes: JSON.stringify(rec).length,
        };
    }, name);
}

// The record as a client reads it — through once("value"), so index-keyed
// nodes come back rebuilt the way the Realtime Database rebuilds them, not as
// the raw store holds them. frameThumbnails is an editor-only field (BootScene
// never reads it) and by far the heaviest, so it is dropped rather than
// ferried across to the game page.
async function readCloudRecord(page, name) {
    return page.evaluate(async (levelName) => {
        const snap = await firebase.database().ref("levels/" + levelName).once("value");
        const rec = snap.val();
        if (!rec) throw new Error("nothing stored at levels/" + levelName);
        delete rec.frameThumbnails;
        return rec;
    }, name);
}

async function bootGameScene(gamePage, url) {
    await gamePage.goto(url);
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
    }), { timeout: 210_000, intervals: [1000] }).toBe("PhaserGameScene");
}

test("a saved cloud game keeps every stage, and stage 3 plays its own", async ({ page, context }) => {
    await importDaioh(page);

    const saved = await saveToCloud(page, LEVEL);
    // The record still leads with the flat single-stage fields every existing
    // reader keys off — fetch-level.js decides a level exists by enemylist —
    // and `stages` sits beside them.
    expect(saved.keys).toContain("enemylist");
    expect(saved.keys).toContain("stageKey");
    expect(saved.keys).toContain("stages");
    expect(saved.hasAtlas).toBe(true);
    expect(saved.hasFrameThumbnails).toBe(true);

    const record = await readCloudRecord(page, LEVEL);

    // Every stage of the import is there, keyed the way the runtime looks
    // them up, and stage 3 kept its own grid, pacing and scenery.
    const stageKeys = Object.keys(record.stages).sort();
    expect(stageKeys.length).toBe(STAGE_COUNT);
    expect(stageKeys).toContain("stage" + PLAY_STAGE);
    expect(record.stageKey).toBe("stage0");
    expect(record.enemylist.length).toBe(STAGE0_WAVES);
    expect(record.stages.stage0.enemylist.length).toBe(STAGE0_WAVES);

    const s3 = record.stages["stage" + PLAY_STAGE];
    expect(s3.enemylist.length).toBe(STAGE3_WAVES);
    expect(s3.enemylist[0].length).toBe(20);
    expect(s3.waveRows.length).toBe(STAGE3_WAVES);
    expect(s3.waveInterval).toBeGreaterThan(0);
    expect(s3.background.rows).toBe(STAGE3_BG_ROWS);
    expect(record.backgroundCells.length).toBeGreaterThan(0);
    // ...and it is genuinely a different stage from the one the flat fields
    // hold, which is the whole point.
    expect(s3.enemylist).not.toEqual(record.enemylist);

    // The soundtrack rode along too: the SFX bank plus the BGM table, whose
    // own per-stage list assigns the (main, boss) pair the sequencer picks
    // from — one entry per stage, so every stage now has its own song.
    expect(record.dezaemonBgm.sfxSet).toBe(DAIOH_SFX_SET);
    expect(record.dezaemonBgm.stages.length).toBe(STAGE_COUNT);
    expect(record.dezaemonBgm.stages[PLAY_STAGE]).toEqual([STAGE3_MAIN_SONG, STAGE3_BOSS_SONG]);
    expect(record.dezaemonBgm.songs[STAGE3_MAIN_SONG]).toEqual(expect.any(String));
    expect(record.dezaemonBgm.songs[STAGE3_BOSS_SONG]).toEqual(expect.any(String));

    // A forge build copies the record verbatim minus the atlas fields; the
    // stages have to survive that copy or an exported app loses them again.
    const offline = buildOfflineLevelRecord(record);
    expect(Object.keys(offline.stages).length).toBe(STAGE_COUNT);
    expect(offline.stages["stage" + PLAY_STAGE].enemylist).toEqual(s3.enemylist);
    expect(offline.enemylist).toEqual(record.enemylist);

    // Replay the stored record through the boot path, exactly as a built app
    // does. The atlas fields stay on so the save's own art resolves.
    const gamePage = await context.newPage();
    const missingFrameWarnings = [];
    gamePage.on("console", (m) => {
        if (m.text().includes("has no frame")) missingFrameWarnings.push(m.text());
    });
    await gamePage.addInitScript((rec) => { window.__OFFLINE_LEVEL__ = rec; }, record);
    await bootGameScene(gamePage, `/phaser-game.html?level=${LEVEL}&stage=${PLAY_STAGE}&lowmode=1`);

    // Stage 3 as the cloud record describes it, not as the stock game does.
    const scene = await gamePage.evaluate(async () => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const stock = await fetch("assets/game.json").then((r) => r.json());
        return {
            stageKey: s.stageKey,
            waves: s.stageEnemyPositionList.length,
            cols: (s.stageEnemyPositionList[0] || []).length,
            waveRows: s.stageWaveRows ? s.stageWaveRows.length : 0,
            waveInterval: s.waveInterval,
            hasDezaBg: !!s.dezaBg,
            mapHeight: s.dezaBg ? s.dezaBg.mapHeight : 0,
            stockHidden: s.stageBg ? !s.stageBg.visible : false,
            recipeStages: Object.keys(s.recipe).filter((k) => /^stage\d+$/.test(k)).sort(),
            // What playing stage 3 used to resolve to.
            stockWaves: stock.stage3 ? stock.stage3.enemylist.length : 0,
            stockCols: stock.stage3 ? stock.stage3.enemylist[0].length : 0,
        };
    });
    expect(scene.stageKey).toBe("stage" + PLAY_STAGE);
    expect(scene.recipeStages.length).toBe(STAGE_COUNT);
    expect(scene.waves).toBe(STAGE3_WAVES);
    expect(scene.cols).toBe(20);
    expect(scene.waveRows).toBe(STAGE3_WAVES);
    expect(scene.waveInterval).toBeGreaterThan(0);
    // The stock third stage is 37 waves of eight-wide rows over a starfield —
    // what this used to play, and what it must no longer play.
    expect(scene.stockWaves).not.toBe(scene.waves);
    expect(scene.stockCols).toBe(8);
    // Stage 3's own scenery replaced the stock backdrop, at stage 3's height
    // rather than stage 0's.
    expect(scene.hasDezaBg).toBe(true);
    expect(scene.mapHeight).toBe(STAGE3_BG_ROWS * TILE);
    expect(scene.stockHidden).toBe(true);

    // Wait out the stage intro before sampling, or the window can open before
    // the first wave is due.
    await expect.poll(() => gamePage.evaluate(() => {
        const g = window.__PHASER_4_GAME__;
        for (let i = 0; i < 40; i++) g.loop.step(performance.now() + i * 16.7);
        return g.scene.getScene("PhaserGameScene").gameStarted;
    }), { timeout: 60_000 }).toBe(true);

    // Run it: the enemies that spawn are the ones stage 3's own grid names,
    // drawn with the save's art and scrolling over the save's map.
    const drawn = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        const frames = new Set();
        let count = 0;
        const sample = () => {
            for (const e of s.enemies || []) {
                if (e.getData("type") === "boss") continue;
                frames.add(e.frame.name);
                count++;
            }
        };
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 3000 + i * 16.7); if (i % 30 === 0) sample(); }
        await new Promise((r) => setTimeout(r, 1500));
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 20000 + i * 16.7); if (i % 30 === 0) sample(); }
        return {
            count,
            frames: [...frames],
            scroll: s.dezaBg ? s.dezaBg._scroll : -1,
            waveCount: s.waveCount,
        };
    });
    expect(drawn.count).toBeGreaterThan(0);
    for (const f of drawn.frames) expect(f).toMatch(/^deza/);
    expect(drawn.waveCount).toBeGreaterThan(0);
    expect(drawn.scroll).toBeGreaterThan(0);

    // Stage 3's frames all resolved out of the round-tripped atlas.
    expect(missingFrameWarnings).toEqual([]);
});

test("loading a cloud game back into the editor restores all of its stages", async ({ page }) => {
    await importDaioh(page);
    await saveToCloud(page, LEVEL);

    // Throw the imported game away and go back to the stock five-stage one,
    // so anything the editor shows afterwards can only have come from the
    // cloud record.
    const stock = await page.evaluate(async () => {
        await autoLoadFromServer();
        return {
            stageKeys: Object.keys(gameData).filter((k) => /^stage\d+$/.test(k)).sort(),
            cols: gameData.stage3.enemylist[0].length,
        };
    });
    expect(stock.stageKeys.length).toBe(5);
    expect(stock.cols).toBe(8);

    const reloaded = await page.evaluate(async (levelName) => {
        const ok = await loadFromFirebase(levelName);
        return {
            ok,
            stageKeys: Object.keys(gameData).filter((k) => /^stage\d+$/.test(k)).sort(),
            currentStageKey,
            currentWaves: currentGrid.length,
            stage3Waves: gameData.stage3.enemylist.length,
            stage3Cols: gameData.stage3.enemylist[0].length,
            stage3WaveRows: gameData.stage3.waveRows ? gameData.stage3.waveRows.length : 0,
            stage3BgRows: gameData.stage3.background ? gameData.stage3.background.rows : 0,
            backgroundCells: (gameData.backgroundCells || []).length,
            pills: document.querySelectorAll("#stage-pills .tb-pill:not(.add)").length,
            bgmSfxSet: gameData.dezaemonBgm ? gameData.dezaemonBgm.sfxSet : null,
            bgmStages: gameData.dezaemonBgm ? gameData.dezaemonBgm.stages.length : 0,
            bgmSongs: gameData.dezaemonBgm ? Object.keys(gameData.dezaemonBgm.songs).length : 0,
        };
    }, LEVEL);

    expect(reloaded.ok).toBe(true);
    expect(reloaded.stageKeys.length).toBe(STAGE_COUNT);
    expect(reloaded.pills).toBe(STAGE_COUNT);
    // The record's own open stage is what the editor lands on...
    expect(reloaded.currentStageKey).toBe("stage0");
    expect(reloaded.currentWaves).toBe(STAGE0_WAVES);
    // ...and stage 3 came back whole, not as the stock stage it replaced.
    expect(reloaded.stage3Waves).toBe(STAGE3_WAVES);
    expect(reloaded.stage3Cols).toBe(20);
    expect(reloaded.stage3WaveRows).toBe(STAGE3_WAVES);
    expect(reloaded.stage3BgRows).toBe(STAGE3_BG_ROWS);
    expect(reloaded.backgroundCells).toBeGreaterThan(0);
    // The soundtrack came back too, so saving this game again keeps it rather
    // than quietly writing a copy with no music.
    expect(reloaded.bgmSfxSet).toBe(DAIOH_SFX_SET);
    expect(reloaded.bgmStages).toBe(STAGE_COUNT);
    expect(reloaded.bgmSongs).toBe(DAIOH_SONG_COUNT);
});

test("a record written before multi-stage still plays, and still folds into the open game", async ({ page, context }) => {
    await importDaioh(page);

    // Save from stage 3 so the flat fields carry a stage with its own pacing
    // and scenery, then drop `stages` — what is left is byte-for-byte the
    // record shape the editor wrote before this change.
    await page.evaluate(async (levelName) => {
        currentStageKey = "stage3";
        loadCurrentStage();
        document.getElementById("firebase-level-name").value = levelName;
        await saveToFirebase();
        delete window.__FAKE_RTDB__.levels[levelName].stages;
    }, LEGACY_LEVEL);

    const legacy = await readCloudRecord(page, LEGACY_LEVEL);
    expect(legacy.stages).toBeUndefined();
    expect(legacy.stageKey).toBe("stage" + PLAY_STAGE);
    expect(legacy.enemylist.length).toBe(STAGE3_WAVES);
    expect(legacy.background.rows).toBe(STAGE3_BG_ROWS);

    // The runtime still plays it as one custom stage inside the stock game,
    // and now honours the pacing and scenery the flat fields always carried.
    const gamePage = await context.newPage();
    await gamePage.addInitScript((rec) => { window.__OFFLINE_LEVEL__ = rec; }, legacy);
    await bootGameScene(gamePage, `/phaser-game.html?level=${LEGACY_LEVEL}&stage=${PLAY_STAGE}&lowmode=1`);

    const scene = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        return {
            stageKey: s.stageKey,
            waves: s.stageEnemyPositionList.length,
            waveRows: s.stageWaveRows ? s.stageWaveRows.length : 0,
            hasDezaBg: !!s.dezaBg,
            mapHeight: s.dezaBg ? s.dezaBg.mapHeight : 0,
            recipeStages: Object.keys(s.recipe).filter((k) => /^stage\d+$/.test(k)).sort(),
            stage0Waves: s.recipe.stage0.enemylist.length,
        };
    });
    expect(scene.stageKey).toBe("stage" + PLAY_STAGE);
    expect(scene.waves).toBe(STAGE3_WAVES);
    expect(scene.waveRows).toBe(STAGE3_WAVES);
    expect(scene.hasDezaBg).toBe(true);
    expect(scene.mapHeight).toBe(STAGE3_BG_ROWS * TILE);
    // Only the record's own stage was replaced — the stock game supplies the
    // rest, exactly as it did before.
    expect(scene.recipeStages.length).toBe(STOCK_STAGES);
    expect(scene.stage0Waves).toBe(STOCK_STAGE0_WAVES);

    // Same on the editor side: the record's one stage lands where it was
    // saved from without taking the open game's other stages with it.
    const editor = await page.evaluate(async (levelName) => {
        await autoLoadFromServer();
        const ok = await loadFromFirebase(levelName);
        return {
            ok,
            stageKeys: Object.keys(gameData).filter((k) => /^stage\d+$/.test(k)).sort(),
            currentStageKey,
            currentWaves: currentGrid.length,
            stage0Waves: gameData.stage0.enemylist.length,
            stage3Waves: gameData.stage3.enemylist.length,
            stage3BgRows: gameData.stage3.background ? gameData.stage3.background.rows : 0,
        };
    }, LEGACY_LEVEL);
    expect(editor.ok).toBe(true);
    expect(editor.stageKeys.length).toBe(STOCK_STAGES);
    expect(editor.currentStageKey).toBe("stage" + PLAY_STAGE);
    expect(editor.currentWaves).toBe(STAGE3_WAVES);
    expect(editor.stage3Waves).toBe(STAGE3_WAVES);
    expect(editor.stage3BgRows).toBe(STAGE3_BG_ROWS);
    expect(editor.stage0Waves).toBe(STOCK_STAGE0_WAVES);
});

// Deliberately runs WITHOUT ?lowmode=1: low mode silences the sequencer along
// with every other audio path, so there would be nothing to hear.
test("a cloud game plays the stage's own song, sequenced from the record", async ({ page, context }) => {
    await importDaioh(page);
    await saveToCloud(page, LEVEL);
    const record = await readCloudRecord(page, LEVEL);

    const gamePage = await context.newPage();
    await gamePage.addInitScript((rec) => { window.__OFFLINE_LEVEL__ = rec; }, record);
    await bootGameScene(gamePage, `/phaser-game.html?level=${LEVEL}&stage=${PLAY_STAGE}`);

    // The sequencer came up on the pair the record's BGM table assigns to
    // stage 3 — not stage 0's song, and not the stock boss track.
    const seq = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const st = s._dezaBgm;
        return st ? {
            songIndex: st.songIndex,
            which: st.which,
            parts: st.song.parts.length,
            stockBgm: s.stageBgmName,
            ctx: s.sound.context.state,
            sfxSet: s.recipe.dezaemonBgm.sfxSet,
            tableStage: s.recipe.dezaemonBgm.stages[3],
        } : null;
    });
    expect(seq).not.toBeNull();
    expect(seq.songIndex).toBe(STAGE3_MAIN_SONG);
    expect(seq.which).toBe("main");
    expect(seq.stockBgm).toBe("__dezaemon__");
    expect(seq.ctx).toBe("running");
    expect(seq.sfxSet).toBe(DAIOH_SFX_SET);
    expect([...seq.tableStage]).toEqual([STAGE3_MAIN_SONG, STAGE3_BOSS_SONG]);
    expect(seq.parts).toBe(4);

    // And it makes real sound rather than merely being scheduled: a silent
    // graph reads a flat 128 in getByteTimeDomainData, so any real deviation
    // is oscillators feeding samples through. WebAudio runs on the audio
    // clock, so the loop is pumped alongside real waits.
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
        while (performance.now() - t0 < 3000) {
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
        return { peak, nonSilentFrames, samples, scheduled: s._dezaBgm.scheduled };
    });
    expect(heard.scheduled).toBeGreaterThan(0);
    expect(heard.peak).toBeGreaterThan(10);
    expect(heard.nonSilentFrames).toBeGreaterThan(heard.samples * 0.5);
});
