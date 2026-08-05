"use strict";
const { test, expect } = require("@playwright/test");
const { blockCdn, collectPageErrors } = require("../helpers/hermetic");

test("editor auto-loads the shipped game and the Dezaemon module", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);

    const gameJsonResp = page.waitForResponse("**/assets/game.json");
    await page.goto("/level-editor.html");
    expect((await gameJsonResp).status()).toBe(200);

    // Auto-load seeds the shipped game: 5 stages, 12 enemy types.
    await expect
        .poll(async () => page.evaluate(() => (window.__editorState ? window.__editorState() : null)))
        .not.toBeNull();
    const state = await page.evaluate(() => window.__editorState());
    expect(state.stageKeys).toEqual(["stage0", "stage1", "stage2", "stage3", "stage4"]);
    expect(state.enemyKeys).toContain("enemyA");
    expect(state.waveCount).toBeGreaterThan(0);

    // The ESM importer module loaded alongside the page.
    expect(await page.evaluate(() => !!window.Dezaemon)).toBe(true);

    // Grid rendered into the icon view.
    await expect(page.locator("#grid-icon-view .editor-grid")).toBeVisible();

    expect(errors).toEqual([]);
});
