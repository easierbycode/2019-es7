"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");
const { blockCdn, collectPageErrors } = require("../helpers/hermetic");

const RAMSIE = path.resolve(__dirname, "..", "..", "..", "tools", "dezaemon-import", "fixtures", "ramsie.sav");

test("importing a real Dezaemon 2 .sav populates the modal and the editor", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);
    // applyDezaemonImport() reports import notes via alert() — auto-accept.
    const notes = [];
    page.on("dialog", (d) => { notes.push(d.message()); d.accept(); });

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);

    // Feed the fixture through the real file input.
    await page.setInputFiles("#deza-file-input", RAMSIE);

    // Modal: container kind + the single game slot with golden metadata.
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    await expect(page.locator("#deza-container-kind")).toContainText("interleaved");
    const slot = page.locator("#deza-slot-list > div").first();
    await expect(slot).toContainText("DEZA2 SGM");
    await expect(slot).toContainText("DEZA2____01");
    await expect(slot).toContainText("2007-12-25");

    // Select the slot: block-accurate payload + section badges + hex dump.
    await slot.click();
    await expect(page.locator("#deza-decoded-summary")).toContainText("167,511 bytes, 331 blocks");
    await expect(page.locator("#deza-decoded-summary")).toContainText("sec7");
    await expect(page.locator("#deza-hex-preview")).toContainText("01 21 ac 7c"); // golden checksumTotal

    // Apply.
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    const state = await page.evaluate(() => window.__editorState());
    expect(state.status).toContain("Imported: DEZA2 SGM");
    expect(state.stageKeys).toEqual(["stage0"]);
    expect(state.enemyKeys).toEqual(["enemyA"]);

    const meta = await page.evaluate(() => gameData.meta);
    expect(meta.source).toBe("dezaemon2");
    expect(meta.sourceComment).toBe("DEZA2 SGM");
    expect(meta.sourceFilename).toBe("DEZA2____01");

    // The section decoders are still open work, so this import is a skeleton:
    // it must say so rather than look like a success that plays as a black
    // screen. Assert the user was actually told, not just the CLI.
    const importNotes = notes.join("\n");
    expect(importNotes).toContain("nothing will spawn");
    expect(importNotes).toContain("none of its content yet");

    // ...which is exactly what the emitted stage contains.
    const waves = await page.evaluate(() => gameData.stage0.enemylist);
    expect(waves.every((row) => row.every((cell) => cell === "00"))).toBe(true);

    expect(errors).toEqual([]);
});
