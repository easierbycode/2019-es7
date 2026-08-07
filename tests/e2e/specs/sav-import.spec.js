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
    // Ramsie's own stages and enemy roster, not a one-stage skeleton.
    expect(state.stageKeys).toEqual(["stage0", "stage1", "stage2", "stage3", "stage4"]);
    expect(state.enemyKeys.length).toBe(26);

    const meta = await page.evaluate(() => gameData.meta);
    expect(meta.source).toBe("dezaemon2");
    expect(meta.sourceComment).toBe("DEZA2 SGM");
    expect(meta.sourceFilename).toBe("DEZA2____01");

    // The stage carries the save's real spawn layout.
    const waves = await page.evaluate(() => gameData.stage0.enemylist);
    expect(waves.length).toBeGreaterThan(50);
    const placed = waves.flat().filter((cell) => cell !== "00");
    expect(placed.length).toBeGreaterThan(100);
    for (const cell of placed) expect(cell).toMatch(/^[A-Z][0-9]$/);

    // Enemies are textured from the save's own CG pages. A handful of slots
    // are genuinely unpainted in every stage that places them, and those keep
    // the default art — so require the bulk, not all, to come from the save.
    const textures = await page.evaluate(() =>
        Object.values(gameData.enemyData).map((e) => (e.texture || [])[0]));
    const fromSave = textures.filter((t) => /^deza\d+_\d+\.gif$/.test(t));
    expect(fromSave.length).toBeGreaterThanOrEqual(textures.length - 3);

    // ...and those frames resolve to real art in the grid, rather than the
    // empty cells you get when the sprites never reach the atlas.
    const grid = await page.evaluate(() => {
        const cells = [...document.querySelectorAll(".grid-cell.occupied")];
        const imgs = cells.filter((c) => c.querySelector("img.enemy-img"));
        return {
            occupied: cells.length,
            withSprite: imgs.length,
            distinct: new Set(imgs.map((c) => c.querySelector("img.enemy-img").src)).size,
        };
    });
    expect(grid.occupied).toBeGreaterThan(0);
    expect(grid.withSprite).toBe(grid.occupied);
    expect(grid.distinct).toBeGreaterThan(1);

    // A Dezaemon save has no player of its own, so the import flies the Evil
    // Invaders character — and every frame it references, ship and bullets
    // alike, has to resolve in the atlas the editor just rebuilt around the
    // save's sprites. Frames that only live in some other level's atlas would
    // read as a successful import until you press play and see nothing.
    const player = await page.evaluate(() => {
        const frames = Object.assign({}, (atlasData && atlasData.frames) || {});
        for (const s of extraSprites) frames[s.key] = true;
        for (const k in replacedFrames) frames[k] = true;
        const pd = gameData.playerData;
        const referenced = [
            ...pd.texture,
            ...pd.shootNormal.texture,
            ...pd.shootBig.texture,
            ...pd.shoot3way.texture,
            ...pd.barrier.texture,
        ];
        return {
            texture: pd.texture,
            shootNormal: pd.shootNormal.texture,
            shootBig: pd.shootBig.texture,
            missing: referenced.filter((f) => !frames[f]),
        };
    });
    expect(player.texture).toEqual([
        "player00.gif", "player01.gif", "player02.gif",
        "player03.gif", "player04.gif", "player05.gif",
    ]);
    expect(player.shootNormal).toEqual(["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"]);
    expect(player.shootBig).toEqual(["shotBig00.gif", "shotBig01.gif", "shotBig02.gif", "shotBig03.gif"]);
    expect(player.missing).toEqual([]);

    // Importing must not push files at the user.
    const importNotes = notes.join("\n");
    expect(importNotes).not.toContain("Repack Atlas");
    expect(importNotes).toContain("sprites from the save were packed into the atlas");
    expect(importNotes).toContain("Player and bullets: the Evil Invaders character");

    expect(errors).toEqual([]);
});

test("importing over a level with a custom player still flies the Evil Invaders ship", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await expect.poll(() => page.evaluate(() => !!(atlasData && atlasData.frames))).toBe(true);

    // Stand in for a loaded Firebase level whose player is custom art: the
    // frames live in that level's atlas, not the stock one, and the import
    // clears them to make room for the save's sprites.
    await page.evaluate(() => {
        playerData = {
            name: "borrowed",
            maxHp: 5,
            spDamage: 10,
            defaultShootName: "normal",
            defaultShootSpeed: "speed_normal",
            texture: ["levelOnlyShip0.gif"],
            shootNormal: { name: "normal", damage: 1, hp: 1, interval: 9, texture: ["levelOnlyShot0.gif"] },
            shootBig: { name: "big", damage: 2, hp: 1, interval: 9, texture: ["levelOnlyShot0.gif"] },
            shoot3way: { name: "3way", damage: 1, hp: 1, interval: 9, texture: ["levelOnlyShot0.gif"] },
            barrier: { time: 2, texture: ["levelOnlyBarrier0.gif"] },
        };
        gameData.playerData = playerData;
    });

    await page.setInputFiles("#deza-file-input", RAMSIE);
    await page.locator("#deza-slot-list > div").first().click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    const after = await page.evaluate(() => ({
        texture: gameData.playerData.texture,
        shootNormal: gameData.playerData.shootNormal.texture,
        // The panel that flags unresolvable frames must stay shut — the whole
        // point is that nothing the player references went missing.
        missingPanelHidden: document.getElementById("missing-tex-overlay").classList.contains("hidden"),
    }));
    expect(after.texture[0]).toBe("player00.gif");
    expect(after.texture).not.toContain("levelOnlyShip0.gif");
    expect(after.shootNormal).toEqual(["shot00.gif", "shot01.gif", "shot02.gif", "shot03.gif"]);
    expect(after.missingPanelHidden).toBe(true);

    expect(errors).toEqual([]);
});
