// Boot entry point — bundled by esbuild into a single non-module script
// for Cordova compatibility (WKWebView may not support ES module imports).

import { gameState } from "../gameState.js";
import { initializeFirebaseScores } from "../firebaseScores.js";
import { createPhaserGame } from "./PhaserGame.js";

function waitFor(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// ?lowmode=1 skips audio loading for faster boot (useful for testing)
try {
    if (new URLSearchParams(window.location.search).get("lowmode") === "1") {
        gameState.lowModeFlg = true;
    }
} catch (e) {}

// Initialize Firebase scores (race with timeout for fast boot)
Promise.race([
    initializeFirebaseScores().catch(function () {}),
    waitFor(1500),
]).then(function () {
    createPhaserGame();
});
