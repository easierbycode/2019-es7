// Boot entry point — bundled by esbuild into a single non-module script
// for Cordova compatibility (WKWebView may not support ES module imports).

// Global error overlay for Cordova debugging
window.onerror = function (msg, src, line, col, err) {
    var el = document.getElementById("loadError");
    if (!el) {
        el = document.createElement("div");
        el.id = "loadError";
        el.style.cssText = "position:fixed;top:0;left:0;right:0;background:red;color:white;font:12px monospace;padding:4px;z-index:9999;max-height:30vh;overflow:auto;white-space:pre-wrap;";
        document.body.appendChild(el);
    }
    el.textContent += "JS: " + msg + " @ " + src + ":" + line + "\n";
};
window.onunhandledrejection = function (e) {
    console.error("Unhandled rejection:", e.reason);
};

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
