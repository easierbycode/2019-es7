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
            playerPresent: !!frames["player00.gif"],
            shotPresent: !!frames["shot00.gif"],
        };
    }, wanted);
    expect(resolved.missing).toEqual([]);
    // ...and folding the editor atlas in must not cost the stock art.
    expect(resolved.playerPresent).toBe(true);
    expect(resolved.shotPresent).toBe(true);

    // Run the stage far enough to spawn, then check the enemies on screen are
    // drawn from the save's frames rather than all collapsing onto one.
    const drawn = await gamePage.evaluate(async () => {
        const g = window.__PHASER_4_GAME__;
        const s = g.scene.getScene("PhaserGameScene");
        for (let i = 0; i < 900; i++) g.loop.step(performance.now() + 3000 + i * 16.7);
        await new Promise((r) => setTimeout(r, 1500));
        for (let i = 0; i < 900; i++) g.loop.step(performance.now() + 20000 + i * 16.7);
        const frames = (s.enemies || []).map((e) => e.frame.name);
        return { count: frames.length, distinct: [...new Set(frames)], playerFrame: s.playerSprite.frame.name };
    });
    expect(drawn.count).toBeGreaterThan(0);
    for (const f of drawn.distinct) expect(f).toMatch(/^deza/);
    expect(drawn.playerFrame).toMatch(/^player0\d\.gif$/);

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
        return { missing: keys.filter((k) => !frames[k]), playerPresent: !!frames["player00.gif"] };
    }, wanted);
    expect(resolved.missing).toEqual([]);
    expect(resolved.playerPresent).toBe(true);
});
