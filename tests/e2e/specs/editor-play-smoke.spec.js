"use strict";
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const tinyRecipe = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "fixtures", "tiny-recipe.json"), "utf8")
);

// Full Phaser boot with an editor recipe. Slow (7MB asset load) and isolated
// in its own project; ?lowmode=1 keeps the load light. The static server
// preserves query strings (unlike `npx serve`), so the .html URL works.
test("editorPlay recipe boots into PhaserGameScene", async ({ page }, testInfo) => {
    await page.addInitScript((recipe) => {
        localStorage.setItem("__editorPhaserRecipe__", JSON.stringify(recipe));
        localStorage.setItem("__editorPhaserStageId__", "0");
    }, tinyRecipe);

    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.goto("/phaser-game.html?editorPlay=1&stage=0&lowmode=1");

    // Query string must survive (this is exactly what `npx serve` breaks).
    expect(await page.evaluate(() => window.location.search)).toContain("editorPlay=1");

    await expect
        .poll(
            () =>
                page.evaluate(() => {
                    const g = window.__PHASER_4_GAME__;
                    if (!g) return "booting";
                    // If rAF is throttled (hidden/headless tab) the loop time
                    // stops advancing — step it manually so boot progresses.
                    const now = g.loop ? g.loop.time : 0;
                    if (window.__lastLoopTime === now && g.loop) {
                        for (let i = 0; i < 20; i++) g.loop.step(performance.now() + i * 16.7);
                    }
                    window.__lastLoopTime = now;
                    const active = g.scene.getScenes(true).map((s) => s.scene.key);
                    return active.includes("PhaserGameScene") ? "PhaserGameScene" : active.join(",") || "none";
                }),
            { timeout: 210_000, intervals: [1000] }
        )
        .toBe("PhaserGameScene");

    // Let it run a moment, then capture proof.
    await page.waitForTimeout(3000);
    await testInfo.attach("gameplay", { body: await page.screenshot(), contentType: "image/png" });

    // No uncaught exceptions during boot/play (asset-404 console noise is fine).
    expect(errors).toEqual([]);
});
