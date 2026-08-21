"use strict";
// The importer modules are fetched at runtime from tools/dezaemon-import/lib/.
// When that fetch fails (most often: a deployed copy of level-editor.html
// shipped without the tools/ folder) the editor used to fail silently and then
// blame file:// serving, which sent people looking in the wrong place. These
// specs pin the diagnostic to the error that actually occurred.
const { test, expect } = require("@playwright/test");
const { blockCdn } = require("../helpers/hermetic");

// Serve level-editor.html normally but 404 the importer modules.
async function breakImporterModules(page) {
    await page.route("**/tools/dezaemon-import/**", (route) =>
        route.fulfill({ status: 404, contentType: "text/plain", body: "not found" })
    );
}

test("records why the importer module failed instead of failing silently", async ({ page }) => {
    await blockCdn(page);
    await breakImporterModules(page);

    await page.goto("/level-editor.html");
    // The loader still finishes and announces itself, but reports the failure.
    await expect.poll(() => page.evaluate(() => "DezaemonLoadError" in window)).toBe(true);
    expect(await page.evaluate(() => !!window.Dezaemon)).toBe(false);
    expect(await page.evaluate(() => String(window.DezaemonLoadError))).toBeTruthy();
});

test("blames the missing modules, not file://, when the editor is served over http", async ({ page }) => {
    await blockCdn(page);
    await breakImporterModules(page);
    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => "DezaemonLoadError" in window)).toBe(true);

    const message = await page.evaluate(() => window.dezaemonUnavailableMessage());
    expect(message).toContain("Dezaemon module failed to load");
    expect(message).toContain("tools/dezaemon-import/lib/*.js could not be fetched");
    // The old message hard-coded this guess; over http it is simply wrong.
    expect(message).not.toContain("not file://");
});

test("the import button surfaces that message rather than opening a file picker", async ({ page }) => {
    await blockCdn(page);
    await breakImporterModules(page);
    await page.goto("/level-editor.html");
    await expect.poll(() => page.evaluate(() => "DezaemonLoadError" in window)).toBe(true);

    // Accept from the handler: an unhandled alert() blocks the click itself.
    let alerted = null;
    page.on("dialog", async (d) => { alerted = d.message(); await d.accept(); });

    let filePickerOpened = false;
    page.on("filechooser", () => { filePickerOpened = true; });

    await page.evaluate(() => window.openMenu());
    // :text-is — "Import .sav from URL" also contains "Import .sav".
    await page.locator('#menu-panel button:text-is("🛸 Import .sav")').click();

    await expect.poll(() => alerted).toContain("could not be fetched");
    expect(filePickerOpened).toBe(false);
});

// The mirror image of the specs above: a module that is merely LATE must not
// be reported as one that failed.
//
// The importer arrives through dynamic import()s inside a module script with a
// top-level await, which does not hold up window.onload. The ?sav= auto-import
// runs from onload, sampled window.Dezaemon once, and on a cold cache or a
// loaded machine found it still undefined — so a shared link died with "the
// module script never ran" against a module that finished loading a moment
// later, and nothing retried. It was also the suite's longest-standing flake.
test("a slow importer module is waited for, not blamed", async ({ page }) => {
    const fs = require("fs");
    const path = require("path");
    const DAIOH = path.resolve(__dirname, "..", "..", "..", "dev-fixtures", "Dezaemon 2 (DAIOH).sav");
    const REMOTE_URL = "https://easierbycode.com/assets/Dezaemon 2 (DAIOH).sav";

    const alerts = [];
    page.on("dialog", (d) => { alerts.push(d.message()); d.accept(); });
    await blockCdn(page);
    await page.route(REMOTE_URL, (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/octet-stream",
            headers: { "access-control-allow-origin": "*" },
            body: fs.readFileSync(DAIOH),
        })
    );
    // Hold the importer modules back so they land well after window.onload —
    // the same ordering a cold cache produces, made deterministic.
    await page.route("**/tools/dezaemon-import/lib/**", async (route) => {
        await new Promise((r) => setTimeout(r, 2500));
        return route.continue();
    });

    await page.goto("/level-editor.html?sav=" + encodeURIComponent(REMOTE_URL));

    // The import waits for the module and then goes through.
    await expect(page.locator("#dezaemon-import-modal")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("#deza-container-kind")).toContainText("Dezaemon 2 (DAIOH).sav");
    expect(alerts).toEqual([]);
});
