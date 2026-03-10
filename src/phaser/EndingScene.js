import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { submitHighScore } from "../firebaseScores.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
    getHighScoreSyncTint,
} from "../highScoreUi.js";
import { BigNumberDisplay } from "./ui/BigNumberDisplay.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

function buildTweetUrl() {
    var score = Number(gameState.score || 0);
    var highScore = Number(gameState.highScore || 0);
    var url, hashtags, text;
    if (LANG === "ja") {
        url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=ja");
        hashtags = encodeURIComponent("シャド研,SFVAE,aprilfool,エイプリルフール");
        text = encodeURIComponent("エイプリルフール 2019 世界大統領がSTGやってみた\n今回のSCORE:" + score + "\nHISCORE:" + highScore + "\n");
    } else {
        url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=en");
        hashtags = encodeURIComponent("ShadalooCRI, SFVAE, aprilfool");
        text = encodeURIComponent("APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\nSCORE:" + score + "\nBEST:" + highScore + "\n");
    }
    return "https://twitter.com/intent/tweet?url=" + url + "&hashtags=" + hashtags + "&text=" + text;
}

function openUrl(url) {
    if (!url || typeof window === "undefined") return;
    try { window.open(url, "_blank"); } catch (e) {}
}

export class PhaserEndingScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserEndingScene" });
    }

    create() {
        var self = this;
        var game = this.game;

        // Black background
        this.add.rectangle(GCX, GCY, GW, GH, 0x000000);

        // Check new record
        this.continueFlg = false;
        if (Number(gameState.score || 0) > Number(gameState.highScore || 0)) {
            gameState.highScore = Number(gameState.score || 0);
            saveHighScore();
            this.continueFlg = true;
        }

        // Submit high score
        if (Number(gameState.score || 0) >= Number(gameState.highScore || 0)
            || gameState.scoreSyncStatus === "loading"
            || gameState.scoreSyncStatus === "error") {
            submitHighScore(Number(gameState.score || 0)).catch(function () {});
        }

        // --- Animated background (congraBg0-2) — starts invisible ---
        if (!this.anims.exists("congra_bg_anim")) {
            this.anims.create({
                key: "congra_bg_anim",
                frames: this.anims.generateFrameNames("game_ui", {
                    prefix: "congraBg",
                    start: 0,
                    end: 2,
                    suffix: ".gif",
                }),
                frameRate: 6,
                repeat: -1,
            });
        }
        this.bg = this.add.sprite(0, 0, "game_ui", "congraBg0.gif");
        this.bg.setOrigin(0, 0);
        this.bg.setAlpha(0);
        this.bg.play("congra_bg_anim");

        // --- congraInfoBg — starts invisible ---
        // PIXI: anchor(0, 0.5), x=0, y=210
        this.congraInfoBg = this.add.sprite(0, 210, "game_ui", "congraInfoBg.gif");
        this.congraInfoBg.setOrigin(0, 0.5);
        this.congraInfoBg.setAlpha(0);

        // --- Animated congraTxt (frames 0-2) ---
        if (!this.anims.exists("congra_txt_anim")) {
            this.anims.create({
                key: "congra_txt_anim",
                frames: this.anims.generateFrameNames("game_ui", {
                    prefix: "congraTxt",
                    start: 0,
                    end: 2,
                    suffix: ".gif",
                }),
                frameRate: 12,
                repeat: -1,
            });
        }
        this.congraTxt = this.add.sprite(0, 0, "game_ui", "congraTxt0.gif");
        this.congraTxt.setOrigin(0.5);
        this.congraTxt.play("congra_txt_anim");

        // Initial scale 5, positioned just offscreen right
        this.congraTxt.setScale(5);
        this.congraTxt.x = GW + this.congraTxt.displayWidth / 2;
        this.congraTxt.y = GCY - 32;

        var slideTargetX = -(this.congraTxt.displayWidth - GW);

        // --- congraTxtEffect — impact flash, starts invisible ---
        this.congraTxtEffect = this.add.sprite(0, 0, "game_ui", "congraTxt0.gif");
        this.congraTxtEffect.setOrigin(0.5);
        this.congraTxtEffect.setVisible(false);

        // --- New Record banner (starts squished to 0 height) ---
        if (this.continueFlg) {
            this.continueNewrecord = this.add.sprite(0, GCY - 40, "game_ui", "continueNewrecord.gif");
            this.continueNewrecord.setOrigin(0, 0);
            this.continueNewrecord.setScale(1, 0);
        } else {
            this.continueNewrecord = null;
        }

        // --- Score container (starts squished to 0) ---
        this.scoreContainer = this.add.container(32, GCY - 23);
        this.scoreContainer.setScale(1, 0);

        this.scoreTitleTxt = this.add.sprite(0, 0, "game_ui", "scoreTxt.gif");
        this.scoreTitleTxt.setOrigin(0, 0);
        this.scoreContainer.add(this.scoreTitleTxt);

        this.bigNumDisplay = new BigNumberDisplay(this, 10);
        this.bigNumDisplay.container.x = this.scoreTitleTxt.width + 3;
        this.bigNumDisplay.container.y = -2;
        this.bigNumDisplay.setValue(Number(gameState.score || 0));
        this.scoreContainer.add(this.bigNumDisplay.container);

        // --- World best text ---
        this.worldBestText = this.add.text(
            32, GCY - 23 + 28,
            getWorldBestLabel() + " " + String(getDisplayedHighScore()),
            {
                fontFamily: "Arial",
                fontSize: "11px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        // --- Score sync text ---
        var syncTint = getHighScoreSyncTint();
        this.scoreSyncText = this.add.text(
            32, GCY - 23 + 28 + 16,
            getHighScoreSyncText(),
            {
                fontFamily: "Arial",
                fontSize: "8px",
                fontStyle: "bold",
                color: "#" + syncTint.toString(16).padStart(6, "0"),
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        // --- Tweet button (starts at scale 0) ---
        // PIXI: TwitterButton at (GCX, GCY+28)
        this.tweetBtn = this.add.text(GCX, GCY + 28, "TWEET", {
            fontFamily: "sans-serif",
            fontSize: "12px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#1da1f2",
            padding: { x: 14, y: 6 },
        });
        this.tweetBtn.setOrigin(0.5);
        this.tweetBtn.setScale(0);
        this.tweetBtn.setInteractive({ useHandCursor: true });
        this.tweetBtn.on("pointerup", function () {
            openUrl(buildTweetUrl());
        });

        // --- Go to Title button (sprite-based) ---
        // PIXI: GotoTitleButton at (GCX - width/2, GH - height - 13)
        this.gotoTitleBtn = this.add.sprite(0, 0, "game_ui", "gotoTitleBtn0.gif");
        this.gotoTitleBtn.setOrigin(0, 0);
        this.gotoTitleBtn.x = GCX - this.gotoTitleBtn.width / 2;
        this.gotoTitleBtn.y = GH - this.gotoTitleBtn.height - 13;
        this.gotoTitleBtn.setInteractive({ useHandCursor: true });

        this.gotoTitleBtn.on("pointerover", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn1.gif");
        });
        this.gotoTitleBtn.on("pointerout", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn0.gif");
        });
        this.gotoTitleBtn.on("pointerdown", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn2.gif");
        });
        this.gotoTitleBtn.on("pointerup", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn1.gif");
            self.gotoTitleBtn.disableInteractive();
            self.cameras.main.fadeOut(1500, 0, 0, 0);
            self.cameras.main.once("camerafadeoutcomplete", function () {
                self.stopAllSounds();
                setTimeout(function () {
                    game.scene.stop("PhaserEndingScene");
                    game.scene.start("PhaserTitleScene");
                }, 50);
            });
        });

        // --- Staff roll button (small, unobtrusive) ---
        this.staffBtn = this.add.text(GW - 8, GH - 8, "STAFF", {
            fontFamily: "sans-serif",
            fontSize: "10px",
            fontStyle: "bold",
            color: "#666666",
        });
        this.staffBtn.setOrigin(1, 1);
        this.staffBtn.setInteractive({ useHandCursor: true });
        this.staffBtn.on("pointerup", function () {
            self.showStaffRoll();
        });

        this.staffRollContainer = null;

        // ============================================================
        // Animation timeline (matches PIXI TimelineMax sequence)
        // ============================================================

        // t=0ms: congraTxt scrolls from right to left (2500ms, Linear)
        this.tweens.add({
            targets: this.congraTxt,
            x: slideTargetX,
            duration: 2500,
            ease: "Linear",
        });

        // t=500ms: voice_congra plays (PIXI: "-=2.0" from end of 2.5s tween)
        this.time.delayedCall(500, function () {
            self.playSound("voice_congra", 0.7);
        });

        // t=2200ms: bg fades in (PIXI: "-=0.3" from end of slide = 2500-300)
        this.time.delayedCall(2200, function () {
            self.tweens.add({
                targets: self.bg,
                alpha: 1,
                duration: 800,
            });
        });

        // t=3000ms: congraTxt snaps to center at scale 3, se_sp impact
        this.time.delayedCall(3000, function () {
            self.playSound("se_sp", 0.7);

            self.congraTxt.x = GCX;
            self.congraTxt.y = GCY - 60;
            self.congraTxt.setScale(3);

            self.congraTxtEffect.x = GCX;
            self.congraTxtEffect.y = GCY - 60;

            // Scale 3 → 1 over 500ms (Expo.easeIn)
            self.tweens.add({
                targets: self.congraTxt,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: "Expo.easeIn",
            });
        });

        // t=3500ms: congraTxtEffect appears, scales to 1.5 and fades out
        this.time.delayedCall(3500, function () {
            self.congraTxtEffect.setVisible(true);
            self.congraTxtEffect.setAlpha(1);
            self.congraTxtEffect.setScale(1);

            self.tweens.add({
                targets: self.congraTxtEffect,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 1000,
                ease: "Expo.easeOut",
            });

            self.tweens.add({
                targets: self.congraTxtEffect,
                alpha: 0,
                duration: 1000,
                ease: "Expo.easeOut",
            });
        });

        // t=4000ms: congraInfoBg fades in (PIXI: "-=0.5" from 4500)
        this.time.delayedCall(4000, function () {
            self.tweens.add({
                targets: self.congraInfoBg,
                alpha: 1,
                duration: 300,
            });
        });

        // t=4300ms+: sequential elastic pop-ins
        var t = 4300;

        if (this.continueFlg && this.continueNewrecord) {
            this.time.delayedCall(t, function () {
                self.tweens.add({
                    targets: self.continueNewrecord,
                    scaleY: 1,
                    duration: 500,
                    ease: "Elastic.easeOut",
                });
            });
            t += 250;
        }

        this.time.delayedCall(t, function () {
            self.tweens.add({
                targets: self.scoreContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: "Elastic.easeOut",
            });
        });
        t += 250;

        this.time.delayedCall(t, function () {
            self.tweens.add({
                targets: self.tweetBtn,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: "Elastic.easeOut",
            });
        });
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
        if (this.worldBestText) {
            this.worldBestText.setText(getWorldBestLabel() + " " + String(getDisplayedHighScore()));
        }
        if (this.scoreSyncText) {
            this.scoreSyncText.setText(getHighScoreSyncText());
            var syncTint = getHighScoreSyncTint();
            this.scoreSyncText.setColor("#" + syncTint.toString(16).padStart(6, "0"));
        }
    }
}

export default PhaserEndingScene;
