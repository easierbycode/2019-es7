"use strict";
const { test, expect } = require("@playwright/test");
const { blockCdn, collectPageErrors } = require("../helpers/hermetic");

test("New Game produces a blank playable game and a valid Play handoff", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);

    // Stub window.open so Play In Phaser never actually launches the game.
    await page.addInitScript(() => {
        window.__openedUrl = null;
        window.open = (u) => {
            window.__openedUrl = u;
            return null;
        };
    });

    await page.goto("/level-editor.html?new=1");
    await expect
        .poll(async () => page.evaluate(() => window.__editorState && window.__editorState().status))
        .toContain("New game");

    const state = await page.evaluate(() => window.__editorState());
    expect(state.stageKeys).toEqual(["stage0"]);
    expect(state.enemyKeys).toEqual(["enemyA"]);
    expect(state.waveCount).toBe(8);

    // Blank grid: 8 waves x 8 columns of "00".
    const grid = await page.evaluate(() => normalizeGrid(currentGrid));
    expect(grid).toHaveLength(8);
    for (const row of grid) expect(row).toEqual(["00", "00", "00", "00", "00", "00", "00", "00"]);

    // Play handoff: recipe in localStorage + editorPlay URL.
    await page.evaluate(() => playCurrentStage());
    const openedUrl = await page.evaluate(() => window.__openedUrl);
    expect(openedUrl).toMatch(/phaser-game\.html\?editorPlay=1&stage=\d/);

    const recipe = await page.evaluate(() => JSON.parse(localStorage.getItem("__editorPhaserRecipe__")));
    expect(recipe.stage0.enemylist).toHaveLength(8);
    expect(Object.keys(recipe.enemyData)).toEqual(["enemyA"]);
    expect(recipe.bossData.boss0).toBeTruthy();
    expect(recipe.playerData.texture.length).toBeGreaterThan(0);

    // The shared schema validator accepts the handoff recipe.
    const validation = await page.evaluate(
        () => window.Dezaemon.validateGameJson(JSON.parse(localStorage.getItem("__editorPhaserRecipe__")))
    );
    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);

    expect(errors).toEqual([]);
});
