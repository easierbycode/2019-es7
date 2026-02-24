import { instantiateGame } from "./app-formatted.js";
import { HitTester } from "./HitTester.js";

let started = false;

function setupCordovaPlugins() {
    // Lock orientation to portrait via cordova-plugin-screen-orientation
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock("portrait").catch(function () {});
    }

    // Enable Android immersive fullscreen via cordova-plugin-fullscreen
    if (window.AndroidFullScreen) {
        window.AndroidFullScreen.immersiveMode(
            function () {},
            function () {}
        );
    }

    // Hide status bar via cordova-plugin-statusbar
    if (window.StatusBar) {
        window.StatusBar.hide();
    }

    // Disable iOS swipe-back navigation at the webview level
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.webViewConfig) {
        window.cordova.plugins.webViewConfig.setAllowBackForwardNavigationGestures(false);
    }
}

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
