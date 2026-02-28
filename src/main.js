import { instantiateGame } from "./app-formatted.js";
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
        // Older browsers that don't return a promise
        lockPortrait();
    }
}

function isFullscreen() {
    return !!(document.fullscreenElement
        || document.webkitFullscreenElement
        || document.msFullscreenElement);
}

// Re-enter fullscreen whenever the user accidentally exits (swipe, gesture, etc.)
function onFullscreenChange() {
    if (!isFullscreen()) {
        // Small delay avoids a rapid toggle loop on some browsers
        setTimeout(function () {
            if (!isFullscreen()) {
                enterFullscreen(document.querySelector("#canvas canvas") || document.documentElement);
            }
        }, 300);
    }
}

document.addEventListener("fullscreenchange", onFullscreenChange, false);
document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);

// ---------------------------------------------------------------------------
// Android: enter fullscreen on the very first touch, before mode select.
// Android 17+ ignores requestFullscreen calls that happen too late after
// the originating user gesture, so we capture the earliest possible tap.
// ---------------------------------------------------------------------------
(function androidEarlyFullscreen() {
    if (typeof navigator === "undefined" || !navigator.userAgent) { return; }
    if (!/android/i.test(navigator.userAgent)) { return; }
    if (window.cordova) { return; } // Cordova handles fullscreen natively

    function onFirstTouch() {
        document.removeEventListener("touchstart", onFirstTouch, true);
        document.removeEventListener("click", onFirstTouch, true);
        enterFullscreen(document.querySelector("#canvas canvas") || document.documentElement);
    }

    document.addEventListener("touchstart", onFirstTouch, { capture: true, once: true });
    document.addEventListener("click", onFirstTouch, { capture: true, once: true });
})();

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

    const game = instantiateGame();
    globalThis.__PHASER_GAME__ = game;

    const interaction = game
        && game.renderer
        && game.renderer.plugins
        && game.renderer.plugins.interaction;

    if (interaction) {
        interaction.hitTestRectangle = HitTester.hitTestFunc;
    }
}

document.addEventListener("deviceready", onDeviceReady, false);

if (!window["cordova"]) {
    setTimeout(() => {
        const event = new Event("deviceready");
        document.dispatchEvent(event);
    }, 50);
}
