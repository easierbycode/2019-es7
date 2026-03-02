import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { submitHighScore } from "../firebaseScores.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
} from "../highScoreUi.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

export class PhaserEndingScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserEndingScene" });
    }

    create() {
        this.add.rectangle(GCX, GCY, GW, GH, 0x000000);

        var isNewRecord = Number(gameState.score || 0) > Number(gameState.highScore || 0);
        if (isNewRecord) {
            gameState.highScore = Number(gameState.score || 0);
            saveHighScore();
        }

        submitHighScore(Number(gameState.score || 0)).catch(function () {});

        this.playSound("voice_congra", 0.7);

        var congraTitle = this.add.sprite(GCX, 60, "game_ui", "congraTitle.gif");
        congraTitle.setOrigin(0.5);

        var congraFace = this.add.sprite(GCX, 160, "game_ui", "congraFace.gif");
        congraFace.setOrigin(0.5);

        var scoreLabel = LANG === "ja" ? "スコア" : "SCORE";
        this.add.text(GCX, 240, scoreLabel, {
            fontFamily: "sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.add.text(GCX, 260, String(gameState.score || 0), {
            fontFamily: "sans-serif",
            fontSize: "22px",
            fontStyle: "bold",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 2,
        }).setOrigin(0.5);

        if (isNewRecord) {
            this.add.text(GCX, 290, "NEW RECORD!", {
                fontFamily: "sans-serif",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ff4444",
                stroke: "#000000",
                strokeThickness: 2,
            }).setOrigin(0.5);
        }

        this.add.text(GCX, 320, getWorldBestLabel() + " " + String(getDisplayedHighScore()), {
            fontFamily: "Arial",
            fontSize: "11px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        }).setOrigin(0.5);

        this.scoreSyncLabel = this.add.text(GCX, 340, getHighScoreSyncText(), {
            fontFamily: "Arial",
            fontSize: "8px",
            fontStyle: "bold",
            color: "#cccccc",
            stroke: "#000000",
            strokeThickness: 1,
        }).setOrigin(0.5);

        var maxComboLabel = LANG === "ja" ? "最大コンボ" : "MAX COMBO";
        this.add.text(GCX, 365, maxComboLabel + ": " + String(gameState.maxCombo || 0), {
            fontFamily: "sans-serif",
            fontSize: "12px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        var continueLabel = LANG === "ja" ? "コンティニュー" : "CONTINUE";
        this.add.text(GCX, 385, continueLabel + ": " + String(gameState.continueCnt || 0), {
            fontFamily: "sans-serif",
            fontSize: "12px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        var titleBtn = this.add.text(GCX, GH - 50, "TITLE", {
            fontFamily: "sans-serif",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 20, y: 8 },
        });
        titleBtn.setOrigin(0.5);
        titleBtn.setInteractive({ useHandCursor: true });

        var self = this;
        titleBtn.on("pointerup", function () {
            self.stopAllSounds();
            self.scene.start("PhaserTitleScene");
        });
    }

    playSound(key, volume) {
        if (gameState.lowModeFlg) return;
        try {
            var vol = typeof volume === "number" ? volume : 0.7;
            if (this.cache.audio.exists(key)) {
                var existing = this.sound.get(key);
                if (existing) {
                    this.sound.play(key, { volume: vol });
                } else {
                    this.sound.add(key).play({ volume: vol });
                }
            }
        } catch (e) {}
    }

    stopAllSounds() {
        try {
            this.sound.stopAll();
        } catch (e) {}
    }

    update() {
        if (this.scoreSyncLabel) {
            this.scoreSyncLabel.setText(getHighScoreSyncText());
        }
    }
}

export default PhaserEndingScene;
