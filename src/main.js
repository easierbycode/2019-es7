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
// Fullscreen — delegated to Phaser 4 ScaleManager
// ---------------------------------------------------------------------------
// enterFullscreen() is called from LoadScene, AdvScene, and the Android
// early-touch handler.  It delegates to the Phaser wrapper's ScaleManager
// which handles vendor prefixes, fullscreen target, and resize events.
// On iOS (where the Fullscreen API does not exist) Phaser fires
// FULLSCREEN_UNSUPPORTED — the PWA standalone path covers that case.
// ---------------------------------------------------------------------------
function enterFullscreen() {
    var sm = globalThis.__PHASER_SCALE__;
    if (sm) {
        if (!sm.isFullscreen) {
            sm.startFullscreen({ navigationUI: "hide" });
        }
        lockPortrait();
    }
}

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

    // ------------------------------------------------------------------
    // Phaser 4 wrapper — uses ScaleManager for FIT scaling & fullscreen
    // ------------------------------------------------------------------
    // Phaser creates its own invisible canvas inside #phaserHost.
    // Its ScaleManager calculates the correct CSS dimensions for a
    // 256x480 game in the current viewport.  We mirror those dimensions
    // to the PIXI canvas on every RESIZE event.
    // ------------------------------------------------------------------
    if (typeof Phaser !== "undefined" && !window.cordova) {
        var phaserGame = new Phaser.Game({
            parent: "phaserHost",
            width: 256,
            height: 480,
            type: Phaser.CANVAS,
            banner: false,
            transparent: true,
            audio: { noAudio: true },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            scene: [],
        });

        // Expose the ScaleManager globally so enterFullscreen() and
        // scene code (LoadScene, AdvScene) can use it.
        globalThis.__PHASER_SCALE__ = phaserGame.scale;

        // Sync PIXI canvas CSS size whenever Phaser recalculates
        function syncPixiCanvas() {
            var pixiCanvas = document.querySelector("#canvas canvas");
            var sm = phaserGame.scale;
            if (!pixiCanvas || !sm || !sm.displaySize) { return; }
            pixiCanvas.style.width = sm.displaySize.width + "px";
            pixiCanvas.style.height = sm.displaySize.height + "px";
        }

        phaserGame.scale.on(Phaser.Scale.Events.RESIZE, syncPixiCanvas);
        phaserGame.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, function () {
            lockPortrait();
            syncPixiCanvas();
        });
        phaserGame.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, function () {
            // Re-enter fullscreen after accidental exit (swipe, etc.)
            setTimeout(function () {
                if (!phaserGame.scale.isFullscreen) {
                    phaserGame.scale.startFullscreen({ navigationUI: "hide" });
                }
            }, 300);
        });

        // Initial sync after Phaser has booted and measured the parent
        phaserGame.events.once("ready", function () {
            syncPixiCanvas();
        });
        // Also sync after a short delay in case "ready" fires before
        // the PIXI canvas exists in the DOM
        setTimeout(syncPixiCanvas, 200);
    }
}

document.addEventListener("deviceready", onDeviceReady, false);

if (!window["cordova"]) {
    setTimeout(() => {
        const event = new Event("deviceready");
        document.dispatchEvent(event);
    }, 50);
}
