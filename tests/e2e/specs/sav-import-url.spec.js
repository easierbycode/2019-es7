"use strict";
// Importing a .sav straight from a URL, rather than through the file picker.
//
// Remote hosts are simulated with page.route so these stay hermetic: a real
// cross-origin fetch would depend on someone else's CORS headers and uptime.
// The fixture bytes are the same ramsie.sav the file-picker spec uses, so a
// URL import is expected to land on byte-identical state.
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { blockCdn, collectPageErrors } = require("../helpers/hermetic");

const RAMSIE = path.resolve(__dirname, "..", "..", "..", "tools", "dezaemon-import", "fixtures", "ramsie.sav");
const RAMSIE_PATH = "/tools/dezaemon-import/fixtures/ramsie.sav";
// The shape that prompted this feature: spaces and parens in the filename.
const REMOTE_URL = "https://easierbycode.com/assets/Dezaemon 2 (DAIOH).sav";

// Serve the fixture for `url` as a properly CORS-enabled remote host would.
async function serveRemoteSav(page, url) {
    const body = fs.readFileSync(RAMSIE);
    await page.route(url, (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/octet-stream",
            headers: { "access-control-allow-origin": "*" },
            body,
        })
    );
}

async function openEditor(page) {
    await blockCdn(page);
    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => !!window.Dezaemon)).toBe(true);
}

test("imports a .sav from a same-origin URL via the menu field", async ({ page }) => {
    const errors = collectPageErrors(page);
    page.on("dialog", (d) => d.accept());
    await openEditor(page);

    await page.evaluate(() => window.openMenu());
    await page.fill("#deza-url-input", RAMSIE_PATH);
    await page.click("#deza-url-btn");

    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    await expect(page.locator("#deza-container-kind")).toContainText("ramsie.sav");
    await expect(page.locator("#deza-container-kind")).toContainText("interleaved");

    // Same golden metadata the file-picker path produces.
    const slot = page.locator("#deza-slot-list > div").first();
    await expect(slot).toContainText("DEZA2 SGM");
    await expect(slot).toContainText("DEZA2____01");

    // And it imports through to the editor.
    await slot.click();
    await expect(page.locator("#deza-decoded-summary")).toContainText("167,511 bytes, 331 blocks");

    // Importing folds the save's sprites into the atlas in memory; it must not
    // hand the user _game_asset.png/.json downloads to do it.
    const downloads = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));

    await page.locator("#deza-import-btn").click();
    await expect(page.locator("#dezaemon-import-modal")).toBeHidden();
    const state = await page.evaluate(() => window.__editorState());
    expect(state.status).toContain("Imported: DEZA2 SGM");

    // The grid draws the imported art, not empty cells.
    await expect.poll(async () => await page.evaluate(() => {
        const cells = [...document.querySelectorAll(".grid-cell.occupied")];
        return cells.length && cells.every((c) => c.querySelector("img.enemy-img"));
    })).toBeTruthy();

    expect(downloads).toEqual([]);
    expect(errors).toEqual([]);
});

test("decodes a percent-encoded remote filename for the modal header", async ({ page }) => {
    await openEditor(page);
    await serveRemoteSav(page, REMOTE_URL);

    await page.evaluate((u) => window.loadDezaemonFromUrl(u), REMOTE_URL);

    await expect(page.locator("#dezaemon-import-modal")).toBeVisible();
    // Shown as the human-readable filename, not the escaped path.
    await expect(page.locator("#deza-container-kind")).toContainText("Dezaemon 2 (DAIOH).sav");
    await expect(page.locator("#deza-container-kind")).not.toContainText("%20");
});

test("?sav= loads the importer straight from a link", async ({ page }) => {
    await blockCdn(page);
    await serveRemoteSav(page, REMOTE_URL);

    await page.goto("/level-editor.html?sav=" + encodeURIComponent(REMOTE_URL));

    // window.onload awaits autoLoadFromServer() — the base game plus a 7MB
    // atlas — before it so much as looks at ?sav=, and only then fetches and
    // parses the save. Measured at 8s on a loaded machine, so the default 5s
    // assertion timeout is a stopwatch on the asset load rather than on the
    // feature under test.
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("#deza-container-kind")).toContainText("Dezaemon 2 (DAIOH).sav");
    // The field is seeded so the URL is visible and re-runnable.
    await expect(page.locator("#deza-url-input")).toHaveValue(REMOTE_URL);
});

test("a blocked cross-origin fetch blames CORS, not the URL", async ({ page }) => {
    await openEditor(page);
    // No ACAO header / connection refused — what a non-CORS host looks like.
    await page.route(REMOTE_URL, (route) => route.abort());

    let alerted = null;
    page.on("dialog", async (d) => { alerted = d.message(); await d.accept(); });
    await page.evaluate((u) => window.loadDezaemonFromUrl(u), REMOTE_URL);

    await expect.poll(() => alerted).toContain("Access-Control-Allow-Origin");
    expect(alerted).toContain("Import .sav");            // the offered fallback
    expect(await page.locator("#dezaemon-import-modal").isVisible()).toBe(false);
});

test("reports the status code when the remote returns an error", async ({ page }) => {
    await openEditor(page);
    await page.route(REMOTE_URL, (route) =>
        route.fulfill({ status: 404, headers: { "access-control-allow-origin": "*" }, body: "nope" })
    );

    let alerted = null;
    page.on("dialog", async (d) => { alerted = d.message(); await d.accept(); });
    await page.evaluate((u) => window.loadDezaemonFromUrl(u), REMOTE_URL);

    await expect.poll(() => alerted).toContain("HTTP 404");
    expect(await page.locator("#dezaemon-import-modal").isVisible()).toBe(false);
});

test("rejects a URL that is not a Saturn backup image", async ({ page }) => {
    await openEditor(page);
    await page.route(REMOTE_URL, (route) =>
        route.fulfill({
            status: 200,
            headers: { "access-control-allow-origin": "*" },
            body: Buffer.alloc(4096), // right size, no BUP magic
        })
    );

    let alerted = null;
    page.on("dialog", async (d) => { alerted = d.message(); await d.accept(); });
    await page.evaluate((u) => window.loadDezaemonFromUrl(u), REMOTE_URL);

    await expect.poll(() => alerted).toContain("Not a Saturn backup image");
    expect(await page.locator("#dezaemon-import-modal").isVisible()).toBe(false);
});
