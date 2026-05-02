// Boot entry point — bundled by esbuild into a single non-module script
// for Cordova compatibility (WKWebView may not support ES module imports).

// Visible boot-stage indicator — lets the user see on-device how far the JS
// bundle progressed before any silent failure / blank canvas state.
function bootMark(stage) {
    try {
        var el = document.getElementById("bootStage");
        if (!el) {
            el = document.createElement("div");
            el.id = "bootStage";
            el.style.cssText = "position:fixed;left:0;right:0;bottom:0;background:#003;color:#9bf;font:11px monospace;padding:2px 6px;z-index:9998;white-space:pre-wrap;";
            (document.body || document.documentElement).appendChild(el);
        }
        el.textContent = "BOOT: " + stage;
    } catch (_) {}
}
bootMark("entry");

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
    var msg = (e && e.reason && (e.reason.stack || e.reason.message)) || String(e && e.reason);
    console.error("Unhandled rejection:", msg);
    var el = document.getElementById("loadError");
    if (!el) {
        el = document.createElement("div");
        el.id = "loadError";
        el.style.cssText = "position:fixed;top:0;left:0;right:0;background:red;color:white;font:12px monospace;padding:4px;z-index:9999;max-height:30vh;overflow:auto;white-space:pre-wrap;";
        document.body.appendChild(el);
    }
    el.textContent += "REJ: " + msg + "\n";
};

import { gameState } from "../gameState.js";
import { initializeFirebaseScores } from "../firebaseScores.js";
import { createPhaserGame } from "./PhaserGame.js";
bootMark("imports loaded");

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
bootMark("firebase init");
Promise.race([
    initializeFirebaseScores().catch(function () {}),
    waitFor(1500),
]).then(function () {
    bootMark("creating game");
    try {
        createPhaserGame();
        bootMark("game created");
        setTimeout(function () {
            var el = document.getElementById("bootStage");
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 5000);
    } catch (e) {
        bootMark("createPhaserGame threw: " + (e && e.message));
        throw e;
    }
});
