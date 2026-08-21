// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./specs",
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: "http://localhost:3210",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    webServer: {
        command: "node static-server.js 3210",
        port: 3210,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
    projects: [
        {
            // Every editor spec opens level-editor.html, which auto-loads the
            // shipped game and a 7MB atlas before it is usable — and does so
            // while the game-smoke worker is booting Phaser alongside it, since
            // the two projects share one worker pool. The defaults (30s per
            // test, 5s per assertion) are budgets for that asset load rather
            // than for the feature under test, and they were what actually
            // failed: a `?sav=` import measured at 0.8s-9.3s idle would blow
            // the 30s test timeout under contention.
            name: "editor",
            testIgnore: /editor-play-smoke|sav-import-play/,
            timeout: 90_000,
            expect: { timeout: 20_000 },
            use: { browserName: "chromium" },
        },
        {
            // Specs that boot Phaser for real are the slow/flaky ones (7MB
            // asset load) — isolated so their retries never slow the editor
            // specs.
            name: "game-smoke",
            testMatch: /editor-play-smoke|sav-import-play/,
            timeout: 240_000,
            expect: { timeout: 20_000 },
            workers: 1,
            use: { browserName: "chromium" },
        },
    ],
});
