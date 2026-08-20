"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");

const RAMSIE = path.resolve(__dirname, "..", "..", "..", "tools", "dezaemon-import", "fixtures", "ramsie.sav");

// The editor's Play handoff writes a recipe of texture *names* to localStorage.
// Without the atlas bridge the runtime only has the on-disk game_asset, every
// imported deza*.gif misses, and Phaser falls back to frame 0 — which is the
// player — so an imported save played as an army of identical G sprites.
test("an imported save plays with its own enemy art, not game_asset frame 0", async ({ page, context }) => {
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", RAMSIE);
    await page.locator("#deza-slot-list > div").first().click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // The imported enemies must reference the save's own frames, or the rest of
    // this test would pass for the wrong reason.
    const wanted = await page.evaluate(() =>
        Object.values(gameData.enemyData).map((e) => (e.texture || [])[0]).filter((t) => /^deza/.test(t)));
    expect(wanted.length).toBeGreaterThan(10);

    const gamePage = await context.newPage();
    const missingFrameWarnings = [];
    gamePage.on("console", (m) => {
        const t = m.text();
        if (t.includes("has no frame")) missingFrameWarnings.push(t);
    });

    await page.evaluate(() => {
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(buildRuntimeRecipe()));
        localStorage.setItem("__editorPhaserStageId__", "0");
    });
    await page.evaluate(() => storeAtlasForViewers());

    await gamePage.goto("/phaser-game.html?editorPlay=1&stage=0&lowmode=1");
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

    // Every frame the imported enemies ask for resolves in the runtime atlas...
    const resolved = await gamePage.evaluate((keys) => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const frames = s.textures.get("game_asset").frames;
        return {
            missing: keys.filter((k) => !frames[k]),
            // The import's own player: its frames are not in the stock atlas,
            // so they only exist here if the import carried them in.
            dukeShip: !!frames["duke_0"],
            dukeShot: !!frames["bigProjectile_0.png"],
            dukeShield: !!frames["shield0.png"],
            stockPlayerPresent: !!frames["player00.gif"],
            stockShotPresent: !!frames["shot00.gif"],
        };
    }, wanted);
    expect(resolved.missing).toEqual([]);
    expect(resolved.dukeShip).toBe(true);
    expect(resolved.dukeShot).toBe(true);
    expect(resolved.dukeShield).toBe(true);
    // ...and folding the editor atlas in must not cost the stock art.
    expect(resolved.stockPlayerPresent).toBe(true);
    expect(resolved.stockShotPresent).toBe(true);

    // Run the stage far enough to spawn, then check the enemies on screen are
    // drawn from the save's frames rather than all collapsing onto one.
    // Sample as the stage runs rather than only at the end: an imported stage
    // keeps the save's own pacing, so waves come in bursts with quiet stretches
    // between them and the final frame can legitimately be empty.
    const drawn = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        const seen = new Set();
        let count = 0;
        const sample = () => {
            for (const e of s.enemies || []) { seen.add(e.frame.name); count++; }
        };
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 3000 + i * 16.7); if (i % 30 === 0) sample(); }
        await new Promise((r) => setTimeout(r, 1500));
        for (let i = 0; i < 900; i++) { g.loop.step(performance.now() + 20000 + i * 16.7); if (i % 30 === 0) sample(); }
        return { count, distinct: [...seen], playerFrame: s.playerSprite.frame.name };
    });
    expect(drawn.count).toBeGreaterThan(0);
    for (const f of drawn.distinct) expect(f).toMatch(/^deza/);
    expect(drawn.playerFrame).toMatch(/^duke_\d$/);

    expect(missingFrameWarnings).toEqual([]);
});

// The Atlas Manager switches which atlas the editor is editing, and publishing
// republishes whatever is open. With one shared bridge slot, a look at game_ui
// after an import would overwrite the game_asset art the runtime needs and the
// imported sprites would vanish from Play again — so records are per atlas.
test("switching the editor to another atlas does not strip the imported art from Play", async ({ page, context }) => {
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    await page.setInputFiles("#deza-file-input", RAMSIE);
    await page.locator("#deza-slot-list > div").first().click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    const wanted = await page.evaluate(() =>
        Object.values(gameData.enemyData).map((e) => (e.texture || [])[0]).filter((t) => /^deza/.test(t)));
    expect(wanted.length).toBeGreaterThan(10);

    await page.evaluate(() => {
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(buildRuntimeRecipe()));
        localStorage.setItem("__editorPhaserStageId__", "0");
    });

    // Wander off to another atlas, exactly as the Atlas Manager dropdown does,
    // then press Play (which republishes whatever is now open).
    await page.evaluate(() => switchAtlas("game_ui"));
    await expect.poll(() => page.evaluate(() => currentAtlasKey)).toBe("game_ui");
    await page.evaluate(() => storeAtlasForViewers());

    const gamePage = await context.newPage();
    await gamePage.goto("/phaser-game.html?editorPlay=1&stage=0&lowmode=1");
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

    const resolved = await gamePage.evaluate((keys) => {
        const s = window.__PHASER_4_GAME__.scene.getScene("PhaserGameScene");
        const frames = s.textures.get("game_asset").frames;
        return { missing: keys.filter((k) => !frames[k]), playerPresent: !!frames["duke_0"] };
    }, wanted);
    expect(resolved.missing).toEqual([]);
    expect(resolved.playerPresent).toBe(true);
});
