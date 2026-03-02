import { instantiateGame } from "./app-formatted.js";
import { initializeFirebaseScores } from "./firebaseScores.js";
import { HitTester } from "./HitTester.js";

let started = false;

// ---------------------------------------------------------------------------
// Orientation lock — requires fullscreen to be active on most mobile browsers
// ---------------------------------------------------------------------------
function lockPortrait() {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock("portrait").catch(function () {});
    }
}

// ---------------------------------------------------------------------------
// Fullscreen helpers
// ---------------------------------------------------------------------------
function enterFullscreen(element) {
    var el = element || document.documentElement;
    var rfs = el.requestFullscreen
        || el.webkitRequestFullscreen
        || el.msRequestFullscreen;

    if (!rfs) { return; }

    var promise = rfs.call(el, { navigationUI: "hide" });
    if (promise && promise.then) {
        promise.then(function () {
            lockPortrait();
        }).catch(function () {});
    } else {
        lockPortrait();
    }
}

function isFullscreen() {
    return !!(document.fullscreenElement
        || document.webkitFullscreenElement
        || document.msFullscreenElement);
}

function onFullscreenChange() {
    if (!isFullscreen()) {
        setTimeout(function () {
            if (!isFullscreen()) {
                enterFullscreen(
                    document.querySelector("#phaser-canvas canvas")
                    || document.querySelector("#canvas canvas")
                    || document.documentElement
                );
            }
        }, 300);
    }
    fitCanvas();
}

if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    document.addEventListener("fullscreenchange", onFullscreenChange, false);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
}

// ---------------------------------------------------------------------------
// Canvas FIT scaling — scales 256x480 to fill viewport, maintaining aspect ratio
// ---------------------------------------------------------------------------
function fitCanvas() {
    var c = document.querySelector("#canvas canvas");
    if (c) {
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var scale = Math.min(vw / 256, vh / 480);
        c.style.width = Math.floor(256 * scale) + "px";
        c.style.height = Math.floor(480 * scale) + "px";
    }

    var pc = document.querySelector("#phaser-canvas canvas");
    if (pc) {
        var vw2 = window.innerWidth;
        var vh2 = window.innerHeight;
        var scale2 = Math.min(vw2 / 256, vh2 / 480);
        pc.style.width = Math.floor(256 * scale2) + "px";
        pc.style.height = Math.floor(480 * scale2) + "px";
    }
}

window.addEventListener("resize", fitCanvas);

// ---------------------------------------------------------------------------
// Edge-swipe prevention
// Intercept touches that start near the left/right edges of the screen so
// that iOS Safari / Android Chrome cannot interpret them as back/forward
// navigation gestures.
// ---------------------------------------------------------------------------
(function preventEdgeSwipe() {
    var EDGE_PX = 30; // threshold in CSS pixels

    document.addEventListener("touchstart", function (e) {
        if (!e.touches || e.touches.length === 0) { return; }
        var x = e.touches[0].clientX;
        var w = window.innerWidth;
        if (x < EDGE_PX || x > w - EDGE_PX) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });

    // Also block touchmove near edges to prevent partial swipe recognition
    document.addEventListener("touchmove", function (e) {
        if (!e.touches || e.touches.length === 0) { return; }
        var x = e.touches[0].clientX;
        var w = window.innerWidth;
        if (x < EDGE_PX || x > w - EDGE_PX) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });
})();

// Prevent the browser history-back gesture on overscroll
window.addEventListener("popstate", function () {
    // Push state back so the user stays on the game page
    history.pushState(null, "", location.href);
});
history.pushState(null, "", location.href);

// ---------------------------------------------------------------------------
// iOS Safari "Add to Home Screen" prompt
// iPhone Safari does not support the Fullscreen API. The only way to get a
// fullscreen experience is via PWA standalone mode (Add to Home Screen).
// ---------------------------------------------------------------------------
(function iosInstallPrompt() {
    if (typeof window === "undefined" || typeof navigator === "undefined") { return; }

    var ua = navigator.userAgent;
    var isIOS = /iPad|iPhone|iPod/.test(ua)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isStandalone = window.navigator.standalone === true
        || window.matchMedia("(display-mode: standalone)").matches;

    if (!isIOS || isStandalone || window.cordova) { return; }

    // Respect previous dismissal
    var DISMISS_KEY = "iosInstallDismissed";
    try { if (localStorage.getItem(DISMISS_KEY)) { return; } } catch (e) {}

    // Show after a short delay so the game can initialize first
    setTimeout(function () {
        var banner = document.getElementById("iosInstallBanner");
        if (!banner) { return; }
        banner.style.display = "";

        var btn = document.getElementById("iosInstallDismiss");
        if (btn) {
            btn.addEventListener("click", function () {
                banner.style.display = "none";
                try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
            }, false);
        }

        // Auto-hide after 15 seconds
        setTimeout(function () {
            if (banner.style.display !== "none") { banner.style.display = "none"; }
        }, 15000);
    }, 2000);
})();

// ---------------------------------------------------------------------------
// Cordova-specific plugin setup
// ---------------------------------------------------------------------------
// Immersive sticky mode (hiding status + nav bars, re-hiding after swipe) is
// handled natively by the patched MainActivity.kt (see hooks/after_prepare.js).
// The JS side only needs to lock portrait orientation.

function setupCordovaPlugins() {
    lockPortrait();

    // Re-apply after the app resumes from background
    document.addEventListener("resume", function () {
        lockPortrait();
    }, false);

    // Prevent the Android back gesture / button from closing the app
    document.addEventListener("backbutton", function (e) {
        e.preventDefault();
    }, false);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function onDeviceReady() {
    if (started) {
        return;
    }

    started = true;
    document.removeEventListener("deviceready", onDeviceReady, false);

    if (window.cordova) {
        setupCordovaPlugins();
    }

    initializeFirebaseScores().catch(() => {});

    const game = instantiateGame();
    globalThis.__PHASER_GAME__ = game;

    const interaction = game
        && game.renderer
        && game.renderer.plugins
        && game.renderer.plugins.interaction;

    if (interaction) {
        interaction.hitTestRectangle = HitTester.hitTestFunc;
    }

    // Scale canvas to fill viewport after PIXI creates it
    fitCanvas();
}

document.addEventListener("deviceready", onDeviceReady, false);

if (!window["cordova"]) {
    setTimeout(() => {
        const event = new Event("deviceready");
        document.dispatchEvent(event);
    }, 50);
}
