"use strict";
const path = require("path");
const { test, expect } = require("@playwright/test");
const { blockCdn, collectPageErrors } = require("../helpers/hermetic");

// DAIOH's cart carries three saves. The second one (DEZA2____02) is the
// interesting one: nine stages, all sixty enemy slots redefined per stage, and
// nearly 3,500 placements — every axis on which the importer used to give up.
// Slot 0 has seven stages and slot 2 has ten; picking the second on purpose
// keeps this test honest about which entry it read.
const DAIOH = path.resolve(__dirname, "..", "..", "..", "dev-fixtures", "Dezaemon 2 (DAIOH).sav");
const SLOT = 1; // the 2nd save

// What the save actually holds, measured from the decoder (tools/dezaemon-import).
const STAGES = 9;
const ENEMY_TYPES = 340;   // distinct (stage, record) pairs placed
const SPAWNS = 3497;       // zako placements across all nine stages
const BOSS_STAGES = 6;     // stages 0-4 and 6 place a boss
const GRID_COLS = 20;      // the save's own placement grid

test("a nine-stage DAIOH save imports whole — every stage, type and spawn", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);
    const notes = [];
    page.on("dialog", (d) => { notes.push(d.message()); d.accept(); });

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);

    await page.setInputFiles("#deza-file-input", DAIOH);
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    await expect(page.locator("#deza-container-kind")).toContainText("3 entries");

    // Pick the SECOND save, not whichever one happens to be first.
    const slots = page.locator("#deza-slot-list > div");
    await expect(slots).toHaveCount(3);
    const second = slots.nth(SLOT);
    await expect(second).toContainText("DEZA2____02");
    await second.click();

    const summary = page.locator("#deza-decoded-summary");
    await expect(summary).toContainText("177,024 bytes");
    await expect(summary).toContainText(`Stages: ${STAGES}`);
    await expect(summary).toContainText(`Enemy types: ${ENEMY_TYPES}`);

    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // --- Nothing dropped ---------------------------------------------
    const state = await page.evaluate(() => window.__editorState());
    expect(state.stageKeys).toEqual(
        Array.from({ length: STAGES }, (_, i) => `stage${i}`));
    expect(state.enemyKeys.length).toBe(ENEMY_TYPES);
    expect(state.gridCols).toBe(GRID_COLS);

    const counted = await page.evaluate(() => {
        const stageKeys = Object.keys(gameData).filter((k) => /^stage\d+$/.test(k));
        let spawns = 0;
        let raggedRows = 0;
        const perStage = {};
        for (const k of stageKeys) {
            const list = gameData[k].enemylist;
            let n = 0;
            for (const row of list) {
                if (row.length !== list[0].length) raggedRows++;
                n += row.filter((c) => c !== "00").length;
            }
            perStage[k] = { waves: list.length, spawns: n, waveRows: (gameData[k].waveRows || []).length };
            spawns += n;
        }
        return {
            spawns,
            raggedRows,
            perStage,
            unresolved: stageKeys.flatMap((k) => gameData[k].enemylist.flat())
                .filter((c) => c !== "00" && !gameData.enemyData["enemy" + c.slice(0, -1)]).length,
        };
    });
    expect(counted.spawns).toBe(SPAWNS);
    expect(counted.unresolved).toBe(0);
    expect(counted.raggedRows).toBe(0);

    // --- Enemy identity is per stage ---------------------------------
    // The save defines its 60 enemy slots separately in every stage, and in
    // DAIOH almost none of them agree; merging them by slot number used to
    // fold nine different enemies into one.
    const identity = await page.evaluate(() => {
        const recs = Object.values(gameData.enemyData).map((e) => e.dezaemon).filter(Boolean);
        const pairs = new Set(recs.map((d) => `${d.stage}:${d.record}`));
        const attrs = recs.filter((d) => typeof d.attributes === "string" && d.attributes.length === 36);
        const stage0Record0 = recs.find((d) => d.stage === 0 && d.record === 0);
        const stage6Record0 = recs.find((d) => d.stage === 6 && d.record === 0);
        return {
            withRecord: recs.length,
            distinctPairs: pairs.size,
            withAttributes: attrs.length,
            stagesCovered: new Set(recs.map((d) => d.stage)).size,
            record0Differs: !!stage0Record0 && !!stage6Record0 &&
                stage0Record0.attributes !== stage6Record0.attributes,
        };
    });
    expect(identity.withRecord).toBe(ENEMY_TYPES);
    expect(identity.distinctPairs).toBe(ENEMY_TYPES);
    expect(identity.stagesCovered).toBe(STAGES);
    // The raw 18 bytes still ride along for auditability...
    expect(identity.withAttributes).toBe(ENEMY_TYPES);
    expect(identity.record0Differs).toBe(true);

    // ...and they are DECODED: hp/score/speed/fire land on the runtime fields,
    // the transform channels on dezaemon.behavior. Values must come from the
    // engine's own tables, not defaults.
    const attrs = await page.evaluate(() => {
        const SCORE = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
        const recs = Object.values(gameData.enemyData);
        return {
            total: recs.length,
            withBehavior: recs.filter((e) => e.dezaemon && e.dezaemon.behavior).length,
            // LIFE decodes in engine damage units and maps to 1-3 hits of the
            // runtime's shot — max-LIFE zako die in 3, like on hardware
            hpAsHits: recs.filter((e) => e.hp >= 1 && e.hp <= 3).length,
            scoreFromTable: recs.filter((e) => SCORE.includes(e.score)).length,
            silenced: recs.filter((e) => e.interval === -1).length,
            fastBullets: recs.filter((e) => e.interval > 0 &&
                e.bulletData && e.bulletData.speed === 2.5).length,
            withTransforms: recs.filter((e) => {
                const b = e.dezaemon && e.dezaemon.behavior;
                return b && (b.rotation.enabled || b.scale.enabled ||
                    b.direction.enabled || b.speedChange.enabled);
            }).length,
        };
    });
    expect(attrs.withBehavior).toBe(ENEMY_TYPES);
    expect(attrs.hpAsHits).toBe(ENEMY_TYPES);
    expect(attrs.scoreFromTable).toBe(ENEMY_TYPES);
    // Whether an enemy fires is its appearance's call (the engine's own
    // gate): 64 of DAIOH's 340 are silent, and every firing enemy gets
    // Saturn-pace bullets.
    expect(attrs.silenced).toBe(64);
    expect(attrs.fastBullets).toBe(ENEMY_TYPES - 64);
    expect(attrs.withTransforms).toBeGreaterThan(100);

    // --- The save's own scenery ---------------------------------------
    const scenery = await page.evaluate(() => {
        const stageKeys = Object.keys(gameData).filter((k) => /^stage\d+$/.test(k));
        return {
            cells: (gameData.backgroundCells || []).length,
            withBg: stageKeys.filter((k) => gameData[k].background).length,
            stage0: gameData.stage0.background
                ? { rows: gameData.stage0.background.rows, cols: gameData.stage0.background.cols }
                : null,
            packed: (gameData.backgroundCells || []).every((name) =>
                !!(atlasData && atlasData.frames && atlasData.frames[name]) ||
                document.querySelector('img') !== undefined),
        };
    });
    expect(scenery.cells).toBe(250);
    expect(scenery.withBg).toBe(8);       // stage 8 has an empty background
    expect(scenery.stage0).toEqual({ rows: 768, cols: 14 });

    // --- Every spawn keeps the row it spawned on ----------------------
    const pacing = await page.evaluate(() => {
        const out = [];
        for (const k of Object.keys(gameData).filter((k) => /^stage\d+$/.test(k))) {
            const st = gameData[k];
            const rows = st.waveRows || [];
            out.push({
                key: k,
                aligned: rows.length === st.enemylist.length,
                // json order is reversed for the runtime, so rows descend
                descending: rows.every((r, i) => i === 0 || rows[i - 1] >= r),
                interval: st.waveInterval,
                spread: rows.length > 1 ? rows[0] - rows[rows.length - 1] : 0,
            });
        }
        return out;
    });
    for (const st of pacing) {
        expect(st.aligned, `${st.key} waveRows aligned`).toBe(true);
        expect(st.descending, `${st.key} waveRows descend`).toBe(true);
        expect(st.interval).toBeGreaterThan(0);
    }
    // The waves are genuinely spread over the stage, not bunched onto a beat.
    expect(pacing[0].spread).toBeGreaterThan(400);

    // --- Bosses ------------------------------------------------------
    const bosses = await page.evaluate(() => {
        const entries = Object.entries(gameData.bossData);
        return {
            total: entries.length,
            fromSave: entries.filter(([, b]) => b && b.dezaemon).length,
            withOwnArt: entries.filter(([, b]) => /^dezaBoss/.test(b && b.name)).length,
            sizeClasses: entries.filter(([, b]) => b && b.dezaemon).map(([, b]) => b.dezaemon.sizeClass),
        };
    });
    expect(bosses.total).toBe(STAGES);          // every stage can still end
    expect(bosses.fromSave).toBe(BOSS_STAGES);
    expect(bosses.withOwnArt).toBe(BOSS_STAGES);
    expect(new Set(bosses.sizeClasses).size).toBeGreaterThan(1);

    // --- The result is a valid, playable game -------------------------
    const validation = await page.evaluate(() =>
        window.Dezaemon.validateGameJson(buildRuntimeRecipe()));
    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);

    // --- Art comes from this save, and reaches the grid ---------------
    const art = await page.evaluate(() => {
        const textures = Object.values(gameData.enemyData).map((e) => (e.texture || [])[0]);
        const cells = [...document.querySelectorAll(".grid-cell.occupied")];
        const imgs = cells.filter((c) => c.querySelector("img.enemy-img"));
        return {
            total: textures.length,
            fromSave: textures.filter((t) => /^deza\d+_\d+_\d+\.gif$/.test(t)).length,
            occupied: cells.length,
            withSprite: imgs.length,
            distinct: new Set(imgs.map((c) => c.querySelector("img.enemy-img").src)).size,
        };
    });
    expect(art.fromSave).toBeGreaterThanOrEqual(art.total - 20);
    expect(art.occupied).toBeGreaterThan(0);
    expect(art.withSprite).toBe(art.occupied);
    expect(art.distinct).toBeGreaterThan(5);

    // --- The notes say so, and claim nothing it did not do -------------
    const importNotes = notes.join("\n");
    expect(importNotes).toContain(`${STAGES} stages, ${ENEMY_TYPES} enemy types`);
    expect(importNotes).toContain("nothing dropped");
    expect(importNotes).not.toMatch(/dropped \d+$/m);
    expect(importNotes).not.toContain("were left empty");

    expect(errors).toEqual([]);
});

test("switching stages keeps the ninth stage's own enemies and grid", async ({ page }) => {
    await blockCdn(page);
    const errors = collectPageErrors(page);
    page.on("dialog", (d) => d.accept());

    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
    await page.setInputFiles("#deza-file-input", DAIOH);
    await page.locator("#deza-slot-list > div").nth(SLOT).click();
    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();

    // Stage pills exist for all nine, and the last one is reachable.
    const pills = page.locator("#stage-pills .tb-pill:not(.add)");
    await expect(pills).toHaveCount(STAGES);
    await pills.nth(STAGES - 1).click();

    const last = await page.evaluate(() => window.__editorState());
    expect(last.currentStageKey).toBe(`stage${STAGES - 1}`);
    expect(last.gridCols).toBe(GRID_COLS);

    // Stage 8's spawns must reference enemies stage 8 defines — the whole
    // point of keeping identity per stage.
    const ownership = await page.evaluate(() => {
        const codes = new Set();
        for (const row of gameData.stage8.enemylist) {
            for (const c of row) if (c !== "00") codes.add(c.slice(0, -1));
        }
        return [...codes].map((k) => gameData.enemyData["enemy" + k].dezaemon.stage);
    });
    expect(ownership.length).toBeGreaterThan(0);
    expect(ownership.every((s) => s === 8)).toBe(true);

    expect(errors).toEqual([]);
});
