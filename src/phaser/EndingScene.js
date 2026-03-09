import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { submitHighScore } from "../firebaseScores.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
    getHighScoreSyncTint,
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

        // PIXI uses animated congraTxt0-2.gif (animationSpeed 0.2 at 120fps ≈ 5fps)
        if (!this.anims.exists("congra_txt_anim")) {
            this.anims.create({
                key: "congra_txt_anim",
                frames: this.anims.generateFrameNames("game_ui", {
                    prefix: "congraTxt",
                    start: 0,
                    end: 2,
                    suffix: ".gif",
                }),
                frameRate: 5,
                repeat: -1,
            });
        }
        var congraTitle = this.add.sprite(GCX, 60, "game_ui", "congraTxt0.gif");
        congraTitle.setOrigin(0.5);
        congraTitle.play("congra_txt_anim");

        var congraInfoBg = this.add.sprite(GCX, 160, "game_ui", "congraInfoBg.gif");
        congraInfoBg.setOrigin(0.5);

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
            var recordText = this.add.text(GCX, 290, "NEW RECORD!", {
                fontFamily: "sans-serif",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ff4444",
                stroke: "#000000",
                strokeThickness: 2,
            });
            recordText.setOrigin(0.5);
            this.tweens.add({
                targets: recordText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
        }

        this.add.text(GCX, 320, getWorldBestLabel() + " " + String(getDisplayedHighScore()), {
            fontFamily: "Arial",
            fontSize: "11px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        }).setOrigin(0.5);

        var syncTint = getHighScoreSyncTint();
        this.scoreSyncLabel = this.add.text(GCX, 340, getHighScoreSyncText(), {
            fontFamily: "Arial",
            fontSize: "8px",
            fontStyle: "bold",
            color: "#" + syncTint.toString(16).padStart(6, "0"),
            stroke: "#000000",
            strokeThickness: 2,
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

        // Staff roll button
        var staffBtn = this.add.text(GCX - 50, GH - 50, "STAFF", {
            fontFamily: "sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#444444",
            padding: { x: 12, y: 6 },
        });
        staffBtn.setOrigin(0.5);
        staffBtn.setInteractive({ useHandCursor: true });

        var self = this;
        staffBtn.on("pointerup", function () {
            self.showStaffRoll();
        });

        // Title button
        var titleBtn = this.add.text(GCX + 50, GH - 50, "TITLE", {
            fontFamily: "sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 12, y: 6 },
        });
        titleBtn.setOrigin(0.5);
        titleBtn.setInteractive({ useHandCursor: true });

        var game = this.game;
        titleBtn.on("pointerup", function () {
            self.stopAllSounds();
            setTimeout(function () {
                game.scene.stop("PhaserEndingScene");
                game.scene.start("PhaserTitleScene");
            }, 50);
        });

        this.staffRollContainer = null;
    }

    showStaffRoll() {
        if (this.staffRollContainer) return;

        var self = this;

        this.staffRollContainer = this.add.container(0, 0);
        this.staffRollContainer.setDepth(500);

        var bg = this.add.rectangle(GCX, GCY, GW, GH, 0x000000, 0.92);
        this.staffRollContainer.add(bg);

        var staffG = this.add.sprite(GCX, 55, "game_ui", "staffrollG0.gif");
        staffG.setOrigin(0.5);
        this.staffRollContainer.add(staffG);

        try {
            if (!this.anims.exists("staffroll_waking")) {
                this.anims.create({
                    key: "staffroll_waking",
                    frames: this.anims.generateFrameNames("game_ui", {
                        prefix: "staffrollG",
                        start: 0,
                        end: 7,
                        suffix: ".gif",
                    }),
                    frameRate: 8,
                    repeat: -1,
                });
            }
            staffG.play("staffroll_waking");
        } catch (e) {}

        try {
            var namePanel = this.add.sprite(15, 90, "game_ui", "staffrollName.gif");
            namePanel.setOrigin(0, 0);
            this.staffRollContainer.add(namePanel);
        } catch (e) {}

        var closeText = this.add.text(GCX, GH - 30, "TAP TO CLOSE", {
            fontFamily: "sans-serif",
            fontSize: "12px",
            fontStyle: "bold",
            color: "#888888",
        });
        closeText.setOrigin(0.5);
        this.staffRollContainer.add(closeText);

        this.staffRollContainer.setAlpha(0);
        this.tweens.add({
            targets: this.staffRollContainer,
            alpha: 1,
            duration: 400,
        });

        bg.setInteractive();
        bg.on("pointerup", function () {
            self.tweens.add({
                targets: self.staffRollContainer,
                alpha: 0,
                duration: 300,
                onComplete: function () {
                    self.staffRollContainer.destroy();
                    self.staffRollContainer = null;
                },
            });
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
            var syncTint = getHighScoreSyncTint();
            this.scoreSyncLabel.setColor("#" + syncTint.toString(16).padStart(6, "0"));
        }
    }
}

export default PhaserEndingScene;
