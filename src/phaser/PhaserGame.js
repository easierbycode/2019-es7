// src/phaser/PhaserGame.js  ← corrected & ready for Phaser 4.0.0-rc.6

import { GAME_DIMENSIONS } from "../constants.js";
import { syncRuntimeFlagsFromLocation } from "../gameState.js";

import { BootScene } from "./BootScene.js";
import { PhaserTitleScene } from "./TitleScene.js";
import { PhaserAdvScene } from "./AdvScene.js";
import { PhaserGameScene } from "./GameScene.js";
import { PhaserContinueScene } from "./ContinueScene.js";
import { PhaserEndingScene } from "./EndingScene.js";

export function createPhaserGame() {
    syncRuntimeFlagsFromLocation();

    // Hide old PIXI canvas, show new Phaser one
    const pixiCanvas = document.getElementById("canvas");
    const phaserContainer = document.getElementById("phaser-canvas");

    if (pixiCanvas) pixiCanvas.style.display = "none";
    if (phaserContainer) phaserContainer.style.display = "flex";

    const phaserConfig = {
        type: Phaser.AUTO,
        width: GAME_DIMENSIONS.WIDTH,
        height: GAME_DIMENSIONS.HEIGHT,
        parent: "phaser-canvas",           // ← FIXED (matches your HTML)
        backgroundColor: "#000000",
        fps: {
            target: 60
        },
        input: {
            mouse: {
                preventDefaultRight: true   // suppress context menu for right-click SP
            }
        },
        scale: {
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.NO_CENTER
        },
        audio: {
            disableWebAudio: false,
            context: window.__phaserAudioContext || undefined
        },
        scene: [
            BootScene,
            PhaserTitleScene,
            PhaserAdvScene,
            PhaserGameScene,
            PhaserContinueScene,
            PhaserEndingScene
        ]
    };

    const game = new Phaser.Game(phaserConfig);
    globalThis.__PHASER_4_GAME__ = game;   // useful for console debugging

    console.log("✅ Phaser 4 game started successfully (all scenes ready)");
    return game;
}

export default createPhaserGame;
