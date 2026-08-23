"use strict";

const { expect } = require("@playwright/test");

// Driving the Phaser game from a spec.
//
// The game page opens as a second tab beside the editor, so Chromium throttles
// its requestAnimationFrame to nothing and the game only advances when a spec
// steps the loop by hand. `g.loop.step(t)` does that, and the scene clock
// follows: Phaser's Clock accumulates the delta the loop hands it, so
// `time.delayedCall` fires on stepped time and one synchronous burst of steps
// can run minutes of stage in milliseconds of real time.
//
// Tweens are the exception, and it is a trap. Phaser 4's TweenManager keeps its
// own wall clock (`Date.now()`), gated at 240fps and lag-skipped past any gap
// over 500ms, and ignores the delta the loop passes it. So a tight loop of
// `loop.step()` calls advances timers and the world clock while tweens crawl at
// real speed or slower — measured at ~105ms of tween time across 2400 steps
// that took 2s of wall clock.
//
// That matters because the stage intro ends on a 200ms tween whose onComplete
// calls `startGame()`, which is what sets `gameStarted` and starts the world
// clock the waves are paced against. Step the loop 2400 times inside one
// `evaluate()` and the intro never finishes: no wave spawns, and a spec
// sampling `scene.enemies` sees an empty stage forever.
//
// So the handover to gameplay has to be waited for *between* `evaluate()`
// calls, where real time passes and the tween can finish. Sample only after
// waitForStageStart has resolved.

// Wait for PhaserGameScene to be the running scene. Steps the loop only while
// it is stalled, so this still works if rAF happens not to be throttled.
async function bootGameScene(gamePage, url) {
    await gamePage.goto(url);
    await expect.poll(() => gamePage.evaluate(() => {
        const g = window.__PHASER_4_GAME__;
        if (!g) return "booting";
        const now = g.loop ? g.loop.time : 0;
        if (window.__lastLoopTime === now && g.loop) {
            for (let i = 0; i < 20; i++) g.loop.step(performance.now() + i * 16.7);
        }
        window.__lastLoopTime = now;
        const active = g.scene.getScenes(true).map((s) => s.scene.key);
        return active.includes("PhaserGameScene") ? "PhaserGameScene" : active.join(",") || "none";
    }), { timeout: 210_000, intervals: [1000] }).toBe("PhaserGameScene");
}

// Wait out the stage intro, one poll per evaluate() so the closing tween gets
// the real time it needs.
async function waitForStageStart(gamePage, timeout = 60_000) {
    await expect.poll(() => gamePage.evaluate(() => {
        const g = window.__PHASER_4_GAME__;
        for (let i = 0; i < 40; i++) g.loop.step(performance.now() + i * 16.7);
        const s = g.scene.getScene("PhaserGameScene");
        return !!(s && s.gameStarted);
    }), { timeout }).toBe(true);
}

module.exports = { bootGameScene, waitForStageStart };
