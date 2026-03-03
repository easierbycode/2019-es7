// src/phaser/PhaserGame.js

import { GAME_DIMENSIONS } from "../constants.js";

import { BootScene } from "./BootScene.js";
import { PhaserTitleScene } from "./TitleScene.js";
import { PhaserAdvScene } from "./AdvScene.js";
import { PhaserGameScene } from "./GameScene.js";
import { PhaserContinueScene } from "./ContinueScene.js";
import { PhaserEndingScene } from "./EndingScene.js";

export function createPhaserGame() {
    // Switch from old PIXI to Phaser (exactly as you had it)
    const pixiCanvas = document.getElementById("canvas");
    const phaserCanvas = document.getElementById("phaser-canvas");

    if (pixiCanvas) {
        pixiCanvas.style.display = "none";
    }
    if (phaserCanvas) {
        phaserCanvas.style.display = "flex";
    }

    const phaserConfig = {
        type: Phaser.AUTO,                    // Phaser is global from the CDN script
        width: GAME_DIMENSIONS.WIDTH,
        height: GAME_DIMENSIONS.HEIGHT,
        parent: "phaser-canvas",              // ← FIXED to match your HTML
        backgroundColor: "#000000",
        fps: { 
            target: 30, 
            forceSetTimeOut: true 
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
    globalThis.__PHASER_4_GAME__ = game;   // handy for console debugging

    console.log("🚀 Phaser 4 game started successfully");
    return game;
}

export default createPhaserGame;