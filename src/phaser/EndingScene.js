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
        var self = this;

        // Black background base
        this.add.rectangle(GCX, GCY, GW, GH, 0x000000);

        var isNewRecord = Number(gameState.score || 0) > Number(gameState.highScore || 0);
        if (isNewRecord) {
            gameState.highScore = Number(gameState.score || 0);
            saveHighScore();
        }

        submitHighScore(Number(gameState.score || 0)).catch(function () {});

        // --- Animated background (congraBg0-2.gif) ---
        if (!this.anims.exists("congra_bg_anim")) {
            this.anims.create({
                key: "congra_bg_anim",
                frames: [
                    { key: "game_ui", frame: "congraBg0.gif" },
                    { key: "game_ui", frame: "congraBg1.gif" },
                    { key: "game_ui", frame: "congraBg2.gif" },
                ],
                frameRate: 2,
                repeat: -1,
            });
        }
        var bg = this.add.sprite(0, 0, "game_ui", "congraBg0.gif");
        bg.setOrigin(0, 0);
        bg.setAlpha(0);
        bg.setDepth(1);
        bg.play("congra_bg_anim");

        // --- Congratulations text (animated frames) ---
        if (!this.anims.exists("congra_txt_anim")) {
            this.anims.create({
                key: "congra_txt_anim",
                frames: [
                    { key: "game_ui", frame: "congraTxt0.gif" },
                    { key: "game_ui", frame: "congraTxt1.gif" },
                    { key: "game_ui", frame: "congraTxt2.gif" },
                ],
                frameRate: 5,
                repeat: -1,
            });
        }
        var congraTitle = this.add.sprite(0, 0, "game_ui", "congraTxt0.gif");
        congraTitle.setOrigin(0.5);
        congraTitle.play("congra_txt_anim");
        var congraNaturalW = congraTitle.frame.realWidth || congraTitle.width;
        congraTitle.setScale(5);
        congraTitle.setDepth(10);
        // Use natural (unscaled) width for position math, matching PIXI behavior
        var scaledW = congraNaturalW * 5;
        congraTitle.x = GW + scaledW / 2;
        congraTitle.y = GCY - 32;

        // --- Effect sprite (flash on impact) ---
        var congraEffect = this.add.sprite(GCX, GCY - 60, "game_ui", "congraTxt0.gif");
        congraEffect.setOrigin(0.5);
        congraEffect.setVisible(false);
        congraEffect.setAlpha(1);
        congraEffect.setDepth(9);

        // --- Info background ---
        var congraInfoBg = this.add.sprite(0, 210, "game_ui", "congraInfoBg.gif");
        congraInfoBg.setOrigin(0, 0.5);
        congraInfoBg.setAlpha(0);
        congraInfoBg.setDepth(2);

        // --- New record sprite (conditional) ---
        var newRecordSprite = null;
        if (isNewRecord) {
            newRecordSprite = this.add.sprite(0, GCY - 40, "game_ui", "continueNewrecord.gif");
            newRecordSprite.setOrigin(0, 0);
            newRecordSprite.setScale(1, 0);
        }

        // --- Score container: scoreTxt.gif + bigNum digits ---
        var scoreContainer = this.add.container(32, GCY - 23);
        scoreContainer.setScale(1, 0);
        scoreContainer.setDepth(5);

        var scoreTitleSprite = this.add.sprite(0, 0, "game_ui", "scoreTxt.gif");
        scoreTitleSprite.setOrigin(0, 0);
        scoreContainer.add(scoreTitleSprite);

        // Build bigNum digit sprites (10 digits, right-to-left)
        var scoreNum = Number(gameState.score || 0);
        var scoreStr = String(Math.min(scoreNum, 9999999999));
        var maxDigit = 10;
        var bigNumSprites = [];
        for (var d = 0; d < maxDigit; d++) {
            var digitSprite = this.add.sprite(0, 0, "game_ui", "bigNum0.gif");
            digitSprite.setOrigin(0, 0);
            digitSprite.x = scoreTitleSprite.width + 3 + d * (digitSprite.width - 1);
            digitSprite.y = -2;
            scoreContainer.add(digitSprite);
            bigNumSprites.push(digitSprite);
        }
        // Set digits from right to left
        for (var si = 0; si < maxDigit; si++) {
            var ch = scoreStr[scoreStr.length - 1 - si];
            if (ch !== undefined) {
                bigNumSprites[maxDigit - 1 - si].setFrame("bigNum" + ch + ".gif");
            }
        }

        // --- World best text ---
        this.worldBestLabel = this.add.text(32, GCY - 23 + 28, getWorldBestLabel() + " " + String(getDisplayedHighScore()), {
            fontFamily: "Arial",
            fontSize: "11px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        }).setOrigin(0, 0).setDepth(5);

        // --- Sync status ---
        var syncTint = getHighScoreSyncTint();
        this.scoreSyncLabel = this.add.text(32, GCY - 23 + 44, getHighScoreSyncText(), {
            fontFamily: "Arial",
            fontSize: "8px",
            fontStyle: "bold",
            color: "#" + syncTint.toString(16).padStart(6, "0"),
            stroke: "#000000",
            strokeThickness: 2,
        }).setOrigin(0, 0).setDepth(5);

        // --- Go To Title button (sprite-based, matching PIXI GotoTitleButton) ---
        var titleBtn = this.add.sprite(0, 0, "game_ui", "gotoTitleBtn0.gif");
        titleBtn.setOrigin(0, 0);
        titleBtn.x = GCX - titleBtn.width / 2;
        titleBtn.y = GH - titleBtn.height - 13;
        titleBtn.setAlpha(0);
        titleBtn.setDepth(5);

        // Hide world best and sync until reveal
        this.worldBestLabel.setAlpha(0);
        this.scoreSyncLabel.setAlpha(0);

        // =============================================
        // STAGGERED TIMELINE (matching PIXI EndingScene)
        // =============================================

        // 0-2.5s: Text scrolls from right to left, then impact on complete
        this.tweens.add({
            targets: congraTitle,
            x: -(scaledW - GW),
            duration: 2500,
            ease: "Linear",
            onComplete: function () {
                // IMPACT — snap text, play se_sp, show effect
                self.playSound("se_sp", 0.9);

                congraTitle.x = GCX;
                congraTitle.y = GCY - 60;
                congraTitle.setScale(3);

                // Scale text from 3 to 1 over 0.5s
                self.tweens.add({
                    targets: congraTitle,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 500,
                    ease: "Expo.easeIn",
                });

                // Effect sprite: show, scale 1→1.5, alpha 1→0
                congraEffect.x = GCX;
                congraEffect.y = GCY - 60;
                congraEffect.setVisible(true);
                congraEffect.setAlpha(1);
                congraEffect.setScale(1);
                self.tweens.add({
                    targets: congraEffect,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: 1000,
                    ease: "Expo.easeOut",
                });
            },
        });

        // ~2.2s: voice_congra
        this.time.delayedCall(2200, function () {
            self.playSound("voice_congra", 0.7);
        });

        // ~2.2s: BG fades in over 0.8s
        this.time.delayedCall(2200, function () {
            self.tweens.add({
                targets: bg,
                alpha: 1,
                duration: 800,
            });
        });

        // ~2.75s: InfoBg fades in
        this.time.delayedCall(2750, function () {
            self.tweens.add({
                targets: congraInfoBg,
                alpha: 1,
                duration: 300,
            });
        });

        // ~2.75s: New record elastic reveal
        if (isNewRecord && newRecordSprite) {
            this.time.delayedCall(2750, function () {
                self.tweens.add({
                    targets: newRecordSprite,
                    scaleY: 1,
                    duration: 500,
                    ease: "Back.easeOut",
                });
            });
        }

        // ~3.0s: Score container elastic reveal
        this.time.delayedCall(3000, function () {
            self.tweens.add({
                targets: scoreContainer,
                scaleY: 1,
                duration: 500,
                ease: "Back.easeOut",
            });
            // Also reveal world best + sync labels
            self.tweens.add({
                targets: [self.worldBestLabel, self.scoreSyncLabel],
                alpha: 1,
                duration: 400,
                delay: 250,
            });
        });

        // ~3.25s: Button fades in and becomes interactive
        this.time.delayedCall(3250, function () {
            self.tweens.add({
                targets: titleBtn,
                alpha: 1,
                duration: 400,
                onComplete: function () {
                    titleBtn.setInteractive({ useHandCursor: true });
                },
            });
        });

        titleBtn.on("pointerover", function () {
            titleBtn.setFrame("gotoTitleBtn1.gif");
        });
        titleBtn.on("pointerout", function () {
            titleBtn.setFrame("gotoTitleBtn0.gif");
        });
        titleBtn.on("pointerdown", function () {
            titleBtn.setFrame("gotoTitleBtn2.gif");
        });
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
            var syncTint = getHighScoreSyncTint();
            this.scoreSyncLabel.setColor("#" + syncTint.toString(16).padStart(6, "0"));
        }
    }
}

export default PhaserEndingScene;
