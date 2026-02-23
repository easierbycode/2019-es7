import { instantiateGame } from "./app-formatted.js";
import { HitTester } from "./HitTester.js";

let started = false;

function onDeviceReady() {
    if (started) {
        return;
    }

    started = true;
    document.removeEventListener("deviceready", onDeviceReady, false);

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
