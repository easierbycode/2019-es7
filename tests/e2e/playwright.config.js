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
            name: "editor",
            testIgnore: /editor-play-smoke/,
            use: { browserName: "chromium" },
        },
        {
            // The Phaser boot smoke is the slow/flaky one (7MB asset load) —
            // isolated so its retries never slow the editor specs.
            name: "game-smoke",
            testMatch: /editor-play-smoke/,
            timeout: 240_000,
            workers: 1,
            use: { browserName: "chromium" },
        },
    ],
});
