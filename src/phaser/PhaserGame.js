// src/phaser/PhaserGame.js  ← corrected & ready for Phaser 4.0.0-rc.6

import { GAME_DIMENSIONS } from "../constants.js";

import { BootScene } from "./BootScene.js";
import { PhaserTitleScene } from "./TitleScene.js";
import { PhaserAdvScene } from "./AdvScene.js";
import { PhaserGameScene } from "./GameScene.js";
import { PhaserContinueScene } from "./ContinueScene.js";
import { PhaserEndingScene } from "./EndingScene.js";


function detectTargetFps() {
    var maxFps = 120;

    try {
        if (typeof window !== "undefined" && window.screen && typeof window.screen.frameRate === "number") {
            maxFps = window.screen.frameRate >= 143 ? 144 : window.screen.frameRate >= 119 ? 120 : 60;
        }
    } catch (e) {}

    return maxFps;
}

export function createPhaserGame() {
    // Hide old PIXI canvas, show new Phaser one
    const pixiCanvas = document.getElementById("canvas");
    const phaserContainer = document.getElementById("phaser-canvas");

    if (pixiCanvas) pixiCanvas.style.display = "none";
    if (phaserContainer) phaserContainer.style.display = "flex";

    const targetFps = detectTargetFps();

    const phaserConfig = {
        type: Phaser.AUTO,
        width: GAME_DIMENSIONS.WIDTH,
        height: GAME_DIMENSIONS.HEIGHT,
        parent: "phaser-canvas",           // ← FIXED (matches your HTML)
        backgroundColor: "#000000",
        fps: {
            target: targetFps
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
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

    console.log("✅ Phaser 4 game started successfully (all scenes ready)", "fps:", targetFps);
    return game;
}

export default createPhaserGame;
