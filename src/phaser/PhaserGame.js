import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { BootScene } from "./BootScene.js";
import { PhaserTitleScene } from "./TitleScene.js";
import { PhaserAdvScene } from "./AdvScene.js";
import { PhaserGameScene } from "./GameScene.js";
import { PhaserContinueScene } from "./ContinueScene.js";
import { PhaserEndingScene } from "./EndingScene.js";

export function createPhaserGame() {
    var pixiCanvas = document.getElementById("canvas");
    var phaserContainer = document.getElementById("phaser-canvas");

    if (pixiCanvas) {
        pixiCanvas.style.display = "none";
    }
    if (phaserContainer) {
        phaserContainer.style.display = "flex";
    }

    var config = {
        type: Phaser.AUTO,
        width: GAME_DIMENSIONS.WIDTH,
        height: GAME_DIMENSIONS.HEIGHT,
        parent: "phaser-canvas",
        backgroundColor: "#000000",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [
            BootScene,
            PhaserTitleScene,
            PhaserAdvScene,
            PhaserGameScene,
            PhaserContinueScene,
            PhaserEndingScene,
        ],
    };

    var game = new Phaser.Game(config);
    globalThis.__PHASER_4_GAME__ = game;

    return game;
}

export default createPhaserGame;
