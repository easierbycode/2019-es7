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
// Edge-swipe prevention
// Intercept touches that start near the left/right edges of the screen so
// that iOS Safari / Android Chrome cannot interpret them as back/forward
// navigation gestures.
// ---------------------------------------------------------------------------
(function preventEdgeSwipe() {
    var EDGE_PX = 50; // wider threshold catches more gesture recognition windows
    var touchStartedAtEdge = false;

    document.addEventListener("touchstart", function (e) {
        if (!e.touches || e.touches.length === 0) { return; }
        var x = e.touches[0].clientX;
        var w = window.innerWidth;
        touchStartedAtEdge = (x < EDGE_PX || x > w - EDGE_PX);
        if (touchStartedAtEdge) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });

    // Block the entire gesture (not just per-event position) if it started at an edge
    document.addEventListener("touchmove", function (e) {
        if (touchStartedAtEdge) {
            e.preventDefault();
            return;
        }
        if (!e.touches || e.touches.length === 0) { return; }
        var x = e.touches[0].clientX;
        var w = window.innerWidth;
        if (x < EDGE_PX || x > w - EDGE_PX) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });

    document.addEventListener("touchend", function () {
        touchStartedAtEdge = false;
    }, { passive: true, capture: true });

    document.addEventListener("touchcancel", function () {
        touchStartedAtEdge = false;
    }, { passive: true, capture: true });
})();

// Prevent the browser history-back gesture on overscroll
window.addEventListener("popstate", function () {
    // Push state back so the user stays on the game page
    history.pushState(null, "", location.href);
});
history.pushState(null, "", location.href);

// Re-lock orientation whenever the device reports a rotation — the lock can
// be silently dropped by the OS during fullscreen transitions.
window.addEventListener("orientationchange", function () {
    lockPortrait();
    setTimeout(function () {
        lockPortrait();
        if (!isFullscreen()) {
            enterFullscreen(document.querySelector("#canvas canvas") || document.documentElement);
        }
    }, 200);
}, false);

// ---------------------------------------------------------------------------
// Cordova-specific plugin setup
// ---------------------------------------------------------------------------
function setupCordovaPlugins() {
    // Enable Android immersive sticky fullscreen via cordova-plugin-fullscreen.
    // immersiveStickyMode (vs immersiveMode) auto-hides system bars after a
    // brief appearance instead of staying visible — far better for games.
    if (window.AndroidFullScreen) {
        window.AndroidFullScreen.immersiveStickyMode(
            function () { lockPortrait(); },
            function () {
                // Fall back to regular immersive mode if sticky isn't available
                window.AndroidFullScreen.immersiveMode(
                    function () { lockPortrait(); },
                    function () {}
                );
            }
        );
    }

    // Hide status bar via cordova-plugin-statusbar
    if (window.StatusBar) {
        window.StatusBar.hide();
    }

    lockPortrait();
}

// ---------------------------------------------------------------------------
// Cordova lifecycle — re-apply fullscreen and orientation when app resumes
// ---------------------------------------------------------------------------
document.addEventListener("resume", function () {
    if (window.cordova) {
        setupCordovaPlugins();
    }
    // Re-enter web fullscreen in case it was dropped while backgrounded
    setTimeout(function () {
        if (!isFullscreen()) {
            enterFullscreen(document.querySelector("#canvas canvas") || document.documentElement);
        }
    }, 300);
}, false);

// Android back button / back-swipe gesture: prevent app exit and
// re-assert immersive mode so fullscreen is not abandoned.
document.addEventListener("backbutton", function (e) {
    e.preventDefault();
    if (window.AndroidFullScreen) {
        window.AndroidFullScreen.immersiveStickyMode(
            function () { lockPortrait(); },
            function () {}
        );
    }
}, false);

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
