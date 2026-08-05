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
    await page.locator('#menu-panel button:has-text("Import .sav")').click();

    await expect.poll(() => alerted).toContain("could not be fetched");
    expect(filePickerOpened).toBe(false);
});
