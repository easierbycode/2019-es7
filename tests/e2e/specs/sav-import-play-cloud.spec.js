"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");
const { blockCdn } = require("../helpers/hermetic");

// Saving an imported .sav to the cloud and playing it back has to sound and
// look like the import did. It didn't: the payload never carried
// `dezaemonBgm`, and the boot path rebuilt the stage from `enemylist` alone —
// so a cloud copy of a Dezaemon game played silent, evenly paced, over the
// stock backdrop, while the same game played from the editor's own handoff
// was correct. This spec drives the real round-trip.
//
// Ramsie is the reference save (the sample game shipped on the disc): five
// stages, 13 songs referenced by its BGM table, SFX set 3 (SF), and scenery
// on stage 0.
//
// The cloud is stood up in-page as a stub with Realtime Database semantics —
// update() is a shallow merge, nulls delete, keys are charset-checked — so a
// payload that RTDB would mangle or reject fails here rather than in
// production. Playback then feeds that stored record back through the very
// same boot path via __OFFLINE_LEVEL__, with the CDN blocked, proving the
// record alone carries the game.
const RAMSIE = path.resolve(__dirname, "..", "..", "..", "tools", "dezaemon-import", "fixtures", "ramsie.sav");
const LEVEL = "roundtrip-ramsie";
const STAGE0_MAIN_SONG = 4; // its BGM table's stage-0 main assignment
const SFX_SET_SF = 3;

test("a cloud round-trip keeps an imported save's soundtrack and scenery", async ({ page, context }) => {
    test.setTimeout(240_000);
    page.on("dialog", (d) => d.accept());
    await blockCdn(page);

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", RAMSIE);
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    await page.locator("#deza-slot-list > div").first().click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // What the import produced, so a later assertion can't pass for the wrong
    // reason — there has to be something to lose.
    const imported = await page.evaluate(() => ({
        sfxSet: gameData.dezaemonBgm.sfxSet,
        songCount: Object.keys(gameData.dezaemonBgm.songs).length,
        stage0Song: gameData.dezaemonBgm.stages[0][0],
        bgRows: gameData.stage0.background.rows,
        cells: gameData.backgroundCells.length,
        waves: gameData.stage0.enemylist.length,
        waveRows: (gameData.stage0.waveRows || []).length,
    }));
    expect(imported.sfxSet).toBe(SFX_SET_SF);
    expect(imported.songCount).toBeGreaterThan(5);
    expect(imported.stage0Song).toBe(STAGE0_MAIN_SONG);
    expect(imported.bgRows).toBeGreaterThan(0);
    expect(imported.cells).toBeGreaterThan(0);
    expect(imported.waveRows).toBe(imported.waves);

    // A stand-in for Realtime Database that keeps the semantics that bite:
    // update() merges at the top level only, null deletes, and a key outside
    // RTDB's charset is a hard error.
    await page.evaluate((levelName) => {
        const BAD_KEY = /[.$#[\]\/]|[\u0000-\u001f\u007f]/;
        const store = (window.__cloud = {});
        const scrub = (v, at) => {
            if (v === null || v === undefined) return undefined;
            if (Array.isArray(v)) return v.map((x, i) => scrub(x, at + "/" + i));
            if (typeof v !== "object") return v;
            const out = {};
            for (const k of Object.keys(v)) {
                if (BAD_KEY.test(k)) throw new Error("illegal RTDB key at " + at + ": " + JSON.stringify(k));
                const sv = scrub(v[k], at + "/" + k);
                if (sv !== undefined) out[k] = sv;
            }
            return out;
        };
        const nodeFor = (refPath) => {
            const key = String(refPath).replace(/^.*\//, "");
            return store[key] || (store[key] = {});
        };
        window.firebase = {
            apps: [],
            initializeApp() { this.apps = [{}]; return this.apps[0]; },
            database: Object.assign(
                () => ({
                    ref: (refPath) => ({
                        update(payload) {
                            const rec = nodeFor(refPath);
                            for (const k of Object.keys(payload)) {
                                if (payload[k] === null || payload[k] === undefined) delete rec[k];
                                else rec[k] = scrub(payload[k], k);
                            }
                            return Promise.resolve();
                        },
                        once() {
                            const rec = nodeFor(refPath);
                            const snap = JSON.parse(JSON.stringify(rec));
                            return Promise.resolve({ val: () => snap });
                        },
                    }),
                }),
                { ServerValue: { TIMESTAMP: 1700000000000 } }
            ),
        };
    }, LEVEL);

    // The name field lives in the slide-out menu; set it directly rather than
    // driving the menu open just to type into it.
    await page.evaluate((levelName) => {
        document.getElementById("firebase-level-name").value = levelName;
    }, LEVEL);
    await page.evaluate(() => saveToFirebase());

    // The stored record carries the soundtrack and the scenery.
    const stored = await page.evaluate((levelName) => {
        const r = window.__cloud[levelName];
        return {
            hasBgm: !!r.dezaemonBgm,
            sfxSet: r.dezaemonBgm && r.dezaemonBgm.sfxSet,
            songCount: r.dezaemonBgm ? Object.keys(r.dezaemonBgm.songs).length : 0,
            stage0Song: r.dezaemonBgm && r.dezaemonBgm.stages[0][0],
            bgRows: r.background && r.background.rows,
            cells: (r.backgroundCells || []).length,
            waveRows: (r.waveRows || []).length,
            stageKey: r.stageKey,
        };
    }, LEVEL);
    expect(stored.hasBgm).toBe(true);
    expect(stored.sfxSet).toBe(SFX_SET_SF);
    expect(stored.songCount).toBe(imported.songCount);
    expect(stored.stage0Song).toBe(STAGE0_MAIN_SONG);
    expect(stored.bgRows).toBe(imported.bgRows);
    expect(stored.cells).toBe(imported.cells);
    expect(stored.waveRows).toBe(imported.waves);
    expect(stored.stageKey).toBe("stage0");

    // Loading the cloud copy back into the editor has to restore both, or the
    // next save would write whatever the previously-open game held instead.
    await page.evaluate((levelName) => loadFromFirebase(levelName), LEVEL);
    const reloaded = await page.evaluate(() => ({
        songCount: gameData.dezaemonBgm ? Object.keys(gameData.dezaemonBgm.songs).length : 0,
        bgRows: gameData.stage0.background && gameData.stage0.background.rows,
        cells: (gameData.backgroundCells || []).length,
        waveRows: (gameData.stage0.waveRows || []).length,
    }));
    expect(reloaded.songCount).toBe(imported.songCount);
    expect(reloaded.bgRows).toBe(imported.bgRows);
    expect(reloaded.cells).toBe(imported.cells);
    expect(reloaded.waveRows).toBe(imported.waves);

    // Now play the stored record. Deliberately no ?lowmode=1 — low mode
    // silences every audio path, the sequencer included.
    const record = await page.evaluate((levelName) => window.__cloud[levelName], LEVEL);
    const gamePage = await context.newPage();
    await blockCdn(gamePage);
    await gamePage.addInitScript((rec) => { window.__OFFLINE_LEVEL__ = rec; }, record);
    await gamePage.goto(`/phaser-game.html?level=${LEVEL}&stage=0`);

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

    const played = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const frames = s.textures.get("game_asset").frames;
        const cells = s.recipe.backgroundCells || [];
        return {
            songIndex: s._dezaBgm ? s._dezaBgm.songIndex : null,
            which: s._dezaBgm ? s._dezaBgm.which : null,
            stockBgm: s.stageBgmName,
            sfxSet: s.recipe.dezaemonBgm ? s.recipe.dezaemonBgm.sfxSet : null,
            hasBg: !!s.dezaBg,
            bgHeight: s.dezaBg ? s.dezaBg.mapHeight : 0,
            missingCells: cells.filter((k) => !frames[k]).length,
            cells: cells.length,
            waveRows: (s.recipe.stage0.waveRows || []).length,
            waves: s.recipe.stage0.enemylist.length,
        };
    });
    // The save's own soundtrack is what plays, and the stock BGM stood down.
    expect(played.songIndex).toBe(STAGE0_MAIN_SONG);
    expect(played.which).toBe("main");
    expect(played.stockBgm).toBe("__dezaemon__");
    expect(played.sfxSet).toBe(SFX_SET_SF);
    // The scenery is composed, and every tile it indexes resolved in the atlas
    // the level brought with it.
    expect(played.hasBg).toBe(true);
    expect(played.bgHeight).toBeGreaterThan(0);
    expect(played.cells).toBe(imported.cells);
    expect(played.missingCells).toBe(0);
    // And the waves keep the pacing they were imported with.
    expect(played.waveRows).toBe(played.waves);

    await gamePage.close();
});
