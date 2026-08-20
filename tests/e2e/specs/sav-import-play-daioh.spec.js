"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");

// The editor side of the DAIOH import is covered by sav-import-daioh.spec.js.
// This one proves the runtime actually plays what the importer now emits: a
// stage past stage4, a 20-column grid, and enemy keys that ran out of single
// letters 314 enemies ago.
const DAIOH = path.resolve(__dirname, "..", "..", "..", "dev-fixtures", "Dezaemon 2 (DAIOH).sav");
const SLOT = 1;        // the 2nd save — nine stages
const LAST_STAGE = 8;

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

test("the ninth stage of an imported save plays, with its own wide-grid enemies", async ({ page, context }) => {
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", DAIOH);
    await page.locator("#deza-slot-list > div").nth(SLOT).click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // Hand the runtime the last stage — the one a five-stage clamp could not
    // reach — and the multi-letter keys its cells refer to.
    const handoff = await page.evaluate((stage) => {
        currentStageKey = "stage" + stage;
        loadCurrentStage();
        const recipe = buildRuntimeRecipe();
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(recipe));
        localStorage.setItem("__editorPhaserStageId__", String(stage));
        storeAtlasForViewers();
        const cells = recipe["stage" + stage].enemylist.flat().filter((c) => c !== "00");
        return {
            cols: recipe["stage" + stage].enemylist[0].length,
            multiLetterCells: cells.filter((c) => c.length > 2).length,
            frames: [...new Set(cells.map((c) => recipe.enemyData["enemy" + c.slice(0, -1)].texture[0]))],
        };
    }, LAST_STAGE);
    expect(handoff.cols).toBe(20);
    expect(handoff.multiLetterCells).toBeGreaterThan(0);

    const gamePage = await context.newPage();
    const missingFrameWarnings = [];
    gamePage.on("console", (m) => {
        if (m.text().includes("has no frame")) missingFrameWarnings.push(m.text());
    });

    await bootGameScene(gamePage, `/phaser-game.html?editorPlay=1&stage=${LAST_STAGE}&lowmode=1`);

    // The runtime kept the stage it was handed rather than clamping to 4, and
    // borrowed a real background for it.
    const scene = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        return {
            stageKey: s.stageKey,
            waves: s.stageEnemyPositionList.length,
            hasWaveRows: Array.isArray(s.stageWaveRows),
            waveInterval: s.waveInterval,
            bgTexture: s.stageBg.texture.key,
            bossKey: "boss" + (window.gameState ? window.gameState.stageId : 0),
        };
    });
    expect(scene.stageKey).toBe(`stage${LAST_STAGE}`);
    expect(scene.waves).toBeGreaterThan(0);
    expect(scene.hasWaveRows).toBe(true);
    expect(scene.waveInterval).toBeGreaterThan(0);
    // Five sets of per-stage backgrounds exist, so stage 8 borrows stage 3's
    // (8 % 5) — the "_c" variant, since an imported game has custom enemies.
    expect(scene.bgTexture).toBe("stage_loop_c3");

    // Every frame stage 8's enemies ask for resolves in the runtime atlas.
    const resolved = await gamePage.evaluate((keys) => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const frames = s.textures.get("game_asset").frames;
        return keys.filter((k) => !frames[k]);
    }, handoff.frames);
    expect(resolved).toEqual([]);

    // Run it: enemies spawn from the save's art, spread across the full grid
    // width rather than the leftmost eight columns.
    // Sampled as the stage runs: the save's own pacing means waves arrive in
    // bursts, so the final frame can legitimately hold nothing.
    const drawn = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        const frames = new Set();
        const xs = new Set();
        let count = 0;
        const sample = () => {
            for (const e of s.enemies || []) {
                if (e.getData("type") === "boss") continue;
                frames.add(e.frame.name);
                xs.add(Math.round(e.x));
                count++;
            }
        };
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 3000 + i * 16.7); if (i % 30 === 0) sample(); }
        await new Promise((r) => setTimeout(r, 1500));
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 20000 + i * 16.7); if (i % 30 === 0) sample(); }
        return { count, frames: [...frames], xs: [...xs], width: g.config.width, waveCount: s.waveCount };
    });
    expect(drawn.count).toBeGreaterThan(0);
    for (const f of drawn.frames) expect(f).toMatch(/^deza/);
    // Spawn columns land inside the screen — a 20-wide row must not be laid
    // out on the old 32px-per-column assumption.
    for (const x of drawn.xs) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(drawn.width);
    }
    expect(drawn.waveCount).toBeGreaterThan(0);

    expect(missingFrameWarnings).toEqual([]);
});

test("stage 0 plays the save's scenery and decoded behaviors", async ({ page, context }) => {
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", DAIOH);
    await page.locator("#deza-slot-list > div").nth(SLOT).click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    await page.evaluate(() => {
        currentStageKey = "stage0";
        loadCurrentStage();
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(buildRuntimeRecipe()));
        localStorage.setItem("__editorPhaserStageId__", "0");
        storeAtlasForViewers();
    });

    const gamePage = await context.newPage();
    await bootGameScene(gamePage, "/phaser-game.html?editorPlay=1&stage=0&lowmode=1");

    // The save's own scenery replaced the stock backdrop, on the world clock.
    const scenery = await gamePage.evaluate(() => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        return {
            hasBg: !!s.dezaBg,
            strips: s.dezaBg ? s.dezaBg.container.length : 0,
            mapHeight: s.dezaBg ? s.dezaBg.mapHeight : 0,
            stockHidden: s.stageBg ? !s.stageBg.visible : false,
            worldTime: s.worldTime,
        };
    });
    expect(scenery.hasBg).toBe(true);
    expect(scenery.mapHeight).toBe(768 * 16);
    expect(scenery.strips).toBe(6);       // 768 rows in 128-row strips
    expect(scenery.stockHidden).toBe(true);

    // Run the stage: the clock ticks, the map scrolls, and the decoded
    // channels actually transform sprites on screen.
    const run = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        let transformed = 0;
        let behaviorEnemies = 0;
        let sampled = 0;
        // DAIOH stage 0 opens with a scenery approach — the first wave sits at
        // row 99, due at worldTime 560 — so pump well past it.
        for (let i = 0; i < 2400; i++) {
            g.loop.step(performance.now() + 3000 + i * 16.7);
            if (i % 20 === 0) {
                for (const e of s.enemies || []) {
                    if (e.getData && e.getData("type") === "boss") continue;
                    sampled++;
                    if (e.getData("deza")) behaviorEnemies++;
                    if (e.rotation !== 0 || e.scaleX !== 1 || e.scaleY !== 1) transformed++;
                }
            }
            if (i === 1200) await new Promise((r) => setTimeout(r, 250));
        }
        return {
            worldTime: s.worldTime,
            scrollY: s.dezaBg ? s.dezaBg._scroll : -1,
            sampled,
            behaviorEnemies,
            transformed,
            waveCount: s.waveCount,
            bullets: (s.enemyBullets || []).length,
        };
    });
    expect(run.worldTime).toBeGreaterThan(1000);
    // the map scrolled with the clock (2px per tick)
    expect(run.scrollY).toBeGreaterThan(1000);
    expect(run.sampled).toBeGreaterThan(0);
    // every sampled zako runs on the decoded behavior driver
    expect(run.behaviorEnemies).toBe(run.sampled);
    // DAIOH stage 0 places rotating and scaled enemies early — the channels
    // must be visibly driving sprites, not just riding along as data
    expect(run.transformed).toBeGreaterThan(0);
});
