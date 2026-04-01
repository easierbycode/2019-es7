import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { pollGamepads } from "./GamepadInput.js";
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

function pickContinueComment() {
    var recipe = gameState._phaserRecipe;
    if (!recipe) return "";
    var key = LANG === "ja" ? "continueComment" : "continueCommentEn";
    var list = Array.isArray(recipe[key]) ? recipe[key] : [];
    if (!list.length) return "";
    return String(list[Math.floor(Math.random() * list.length)] || "");
}

export class PhaserContinueScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserContinueScene" });
    }

    create() {
        this.sceneSwitch = 0;
        this.countDown = 9;
        this.countActive = true;

        this.add.rectangle(GCX, GCY, GW, GH, 0x000000);

        this.continueTitle = this.add.sprite(0, 70, "game_ui", "continueTitle.gif");
        this.continueTitle.setOrigin(0, 0);

        // PIXI: AnimatedSprite with continueFace0/1 at animationSpeed 0.05 (~3fps)
        if (!this.anims.exists("continue_face_idle")) {
            this.anims.create({
                key: "continue_face_idle",
                frames: this.anims.generateFrameNames("game_ui", {
                    prefix: "continueFace",
                    start: 0,
                    end: 1,
                    suffix: ".gif",
                }),
                frameRate: 3,
                repeat: -1,
            });
        }
        this.loseFace = this.add.sprite(20, this.continueTitle.y + this.continueTitle.height + 38, "game_ui", "continueFace0.gif");
        this.loseFace.setOrigin(0, 0);
        this.loseFace.play("continue_face_idle");

        this.cntTextBg = this.add.sprite(
            this.loseFace.x + this.loseFace.width + 20,
            this.continueTitle.y + this.continueTitle.height + 30,
            "game_ui", "countdownBg.gif"
        );
        this.cntTextBg.setOrigin(0, 0);

        this.cntText = this.add.sprite(
            this.cntTextBg.x,
            this.cntTextBg.y,
            "game_ui", "countdown9.gif"
        );
        this.cntText.setOrigin(0, 0);
        this.cntText.setAlpha(0);

        var self = this;

        this.yesBtn = this.add.sprite(0, 0, "game_ui", "continueYes.gif");
        this.yesBtn.setOrigin(0, 0);
        this.yesBtn.x = GCX - this.yesBtn.width / 2 - 50;
        this.yesBtn.y = GCY - this.yesBtn.height / 2 + 70;

        this.noBtn = this.add.sprite(0, 0, "game_ui", "continueNo.gif");
        this.noBtn.setOrigin(0, 0);
        this.noBtn.x = GCX - this.noBtn.width / 2 + 50;
        this.noBtn.y = GCY - this.noBtn.height / 2 + 70;

        this.setupContinueButton(this.yesBtn, "continueYes", function () {
            self.selectYes();
        });
        this.setupContinueButton(this.noBtn, "continueNo", function () {
            self.selectNo();
        });

        this.commentText = this.add.text(
            GCX, GH - 100,
            pickContinueComment(),
            {
                fontFamily: "sans-serif",
                fontSize: "14px",
                fontStyle: "bold",
                color: "#ffffff",
                wordWrap: { width: 230 },
                align: "center",
            }
        );
        this.commentText.setOrigin(0.5);

        // Keyboard: Y for yes, N for no, Enter for yes
        this.yKey = null;
        this.nKey = null;
        this.enterKey = null;
        try {
            this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
            this.nKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        } catch (e) {}

        this.playBgm("bgm_continue", 0.25);

        this.countdownTimer = this.time.addEvent({
            delay: 1200,
            repeat: 10, // 11 total calls: 10 for digits 9→0, 1 more to trigger selectNo
            callback: this.onCountDown,
            callbackScope: this,
        });
    }


    setupContinueButton(button, framePrefix, onPress) {
        button.setInteractive({ useHandCursor: true });

        button.on("pointerover", function () {
            button.setFrame(framePrefix + "Over.gif");
        });
        button.on("pointerout", function () {
            button.setFrame(framePrefix + ".gif");
        });
        button.on("pointerdown", function () {
            button.setFrame(framePrefix + "Down.gif");
        });
        button.on("pointerup", function () {
            button.setFrame(framePrefix + "Over.gif");
            onPress();
        });
    }

    onCountDown() {
        if (!this.countActive) return;

        if (this.countDown < 0) {
            this.selectNo();
            return;
        }

        var frameKey = "countdown" + String(this.countDown) + ".gif";
        try {
            this.cntText.setFrame(frameKey);
        } catch (e) {}
        this.cntText.setAlpha(1);

        this.playSound("voice_countdown" + String(this.countDown), 0.7);
        this.countDown--;
    }

    selectYes() {
        if (!this.countActive) return;
        this.countActive = false;

        if (this.countdownTimer) {
            this.countdownTimer.remove();
        }

        this.playSound("g_continue_yes_voice" + String(Math.floor(Math.random() * 3)), 0.7);

        this.sceneSwitch = 1;

        try {
            this.loseFace.setFrame("continueFace3.gif");
        } catch (e) {}

        this.goNext();
    }

    selectNo() {
        if (!this.countActive) return;
        this.countActive = false;

        if (this.countdownTimer) {
            this.countdownTimer.remove();
        }

        this.playSound("voice_gameover", 0.7);
        this.playSound("bgm_gameover", 0.4);

        try {
            this.cntText.setFrame("countdown0.gif");
            this.cntText.setAlpha(0.2);
            this.loseFace.setFrame("continueFace2.gif");
        } catch (e) {}

        if (this.commentText) {
            this.commentText.setVisible(false);
        }

        if (this.yesBtn) {
            this.yesBtn.setVisible(false);
        }
        if (this.noBtn) {
            this.noBtn.setVisible(false);
        }

        this.gameOverTxt = this.add.sprite(
            GCX, GCY - 35,
            "game_ui", "continueGameOver.gif"
        );
        this.gameOverTxt.setOrigin(0.5);
        this.gameOverTxt.setAlpha(0);

        var self = this;

        // Red flash + shake matching PIXI timeline (alternating 0x770000/0x000000)
        this.flashRect = this.add.rectangle(GCX, GCY, GW, GH, 0x000000).setDepth(-1);
        var shakeSteps = [
            { dy: 10, color: 0x770000 },
            { dy: -5, color: 0x000000 },
            { dy: 3, color: 0x770000 },
            { dy: 0, color: 0x000000 },
        ];
        var stepIndex = 0;
        var shakeTimer = this.time.addEvent({
            delay: 70,
            repeat: shakeSteps.length - 1,
            callback: function () {
                var step = shakeSteps[stepIndex];
                self.cameras.main.setScroll(0, -step.dy);
                self.flashRect.setFillStyle(step.color);
                stepIndex++;
                if (stepIndex >= shakeSteps.length) {
                    self.cameras.main.setScroll(0, 0);
                }
            },
        });

        this.tweens.add({
            targets: this.gameOverTxt,
            alpha: 1,
            duration: 1000,
            delay: 580,
            onComplete: function () {
                var voiceIndex = Math.floor(Math.random() * 2);
                self.playSound("g_continue_no_voice" + String(voiceIndex), 0.7);
                self.showGameOverPanel();
            },
        });

        if (Number(gameState.score || 0) >= Number(gameState.highScore || 0)
            || gameState.scoreSyncStatus === "loading"
            || gameState.scoreSyncStatus === "error") {
            submitHighScore(Number(gameState.score || 0)).catch(function () {});
        }
    }

    showGameOverPanel() {
        if (Number(gameState.score || 0) > Number(gameState.highScore || 0)) {
            gameState.highScore = Number(gameState.score || 0);
            saveHighScore();

            this.add.sprite(
                0, this.loseFace.y + this.loseFace.height + 10,
                "game_ui", "continueNewrecord.gif"
            ).setOrigin(0, 0);
        }

        var scoreTitleTxt = this.add.sprite(
            32, this.loseFace.y + this.loseFace.height + 30,
            "game_ui", "scoreTxt.gif"
        );
        scoreTitleTxt.setOrigin(0, 0);

        var bigNumDisplay = new BigNumberDisplay(this, 10);
        bigNumDisplay.container.x = scoreTitleTxt.x + scoreTitleTxt.width + 3;
        bigNumDisplay.container.y = scoreTitleTxt.y - 2;
        bigNumDisplay.setValue(Number(gameState.score || 0));

        this.worldBestText = this.add.text(
            scoreTitleTxt.x, scoreTitleTxt.y + 22,
            getWorldBestLabel() + " " + String(getDisplayedHighScore()),
            {
                fontFamily: "Arial",
                fontSize: "10px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        var syncTint = getHighScoreSyncTint();
        this.scoreSyncText = this.add.text(
            scoreTitleTxt.x, scoreTitleTxt.y + 22 + 14,
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

        // Tweet button (sprite-based, matching PIXI TwitterButton centered at GCX)
        var self = this;
        this.tweetBtn = this.add.sprite(GCX, 0, "game_ui", "twitterBtn0.gif");
        this.tweetBtn.setOrigin(0.5);
        this.tweetBtn.y = this.scoreSyncText.y + this.tweetBtn.height / 2 + 16;
        this.tweetBtn.setInteractive({ useHandCursor: true });
        this.tweetBtn.on("pointerover", function () {
            self.tweetBtn.setFrame("twitterBtn1.gif");
        });
        this.tweetBtn.on("pointerout", function () {
            self.tweetBtn.setFrame("twitterBtn0.gif");
        });
        this.tweetBtn.on("pointerdown", function () {
            self.tweetBtn.setFrame("twitterBtn2.gif");
        });
        this.tweetBtn.on("pointerup", function () {
            self.tweetBtn.setFrame("twitterBtn1.gif");
            openUrl(buildTweetUrl());
        });

        // Go To Title button centered below Tweet button
        this.gotoTitleBtn = this.add.sprite(0, 0, "game_ui", "gotoTitleBtn0.gif");
        this.gotoTitleBtn.setOrigin(0.5);
        this.gotoTitleBtn.x = GCX;
        this.gotoTitleBtn.y = this.tweetBtn.y + this.tweetBtn.height / 2 + this.gotoTitleBtn.height / 2 + 6;
        this.gotoTitleBtn.setInteractive({ useHandCursor: true });

        this.gotoTitleBtn.on("pointerover", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn1.gif");
            self.playSound("se_over", 0.7);
        });
        this.gotoTitleBtn.on("pointerout", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn0.gif");
        });
        this.gotoTitleBtn.on("pointerdown", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn2.gif");
        });
        this.gotoTitleBtn.on("pointerup", function () {
            self.gotoTitleBtn.setFrame("gotoTitleBtn0.gif");
            self.playSound("se_correct", 0.7);
            self.gotoTitle();
        });

        this._gotoTitleReady = true;
    }

    gotoTitle() {
        if (this._gotoTitleDone) return;
        this._gotoTitleDone = true;

        if (this.gotoTitleBtn) {
            this.gotoTitleBtn.disableInteractive();
        }

        gameState.secondLoop = true;
        gameState.bgmContinuityActive = false;
        gameState.currentBgmKey = null;

        this.stopAllSounds();
        var game = this.game;
        setTimeout(function () {
            game.scene.stop("PhaserContinueScene");
            game.scene.start("PhaserTitleScene");
        }, 50);
    }

    goNext() {
        gameState.bgmContinuityActive = false;
        gameState.currentBgmKey = null;
        var self = this;
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 1500,
            onComplete: function () {
                self.stopAllSounds();

                var nextScene;
                if (self.sceneSwitch === 1) {
                    var recipe = gameState._phaserRecipe;
                    if (recipe && recipe.playerData) {
                        gameState.playerMaxHp = recipe.playerData.maxHp;
                        gameState.playerHp = gameState.playerMaxHp;
                        gameState.shootMode = recipe.playerData.defaultShootName;
                        gameState.shootSpeed = recipe.playerData.defaultShootSpeed;
                    }
                    gameState.continueCnt = Number(gameState.continueCnt || 0) + 1;
                    gameState.score = gameState.continueCnt;
                    nextScene = "PhaserGameScene";
                } else {
                    nextScene = "PhaserTitleScene";
                }
                var game = self.game;
                setTimeout(function () {
                    game.scene.stop("PhaserContinueScene");
                    game.scene.start(nextScene);
                }, 50);
            },
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

    playBgm(key, volume) {
        if (gameState.lowModeFlg) return;
        try {
            if (this.cache.audio.exists(key)) {
                var existing = this.sound.get(key);
                if (existing) {
                    if (existing.isPlaying) existing.stop();
                    existing.play({ volume: volume || 0.25, loop: true });
                } else {
                    this.sound.add(key, { loop: true, volume: volume || 0.25 }).play();
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
            var syncColor = "#" + syncTint.toString(16).padStart(6, "0");
            if (this.scoreSyncText.style.color !== syncColor) {
                this.scoreSyncText.setColor(syncColor);
            }
        }

        // Keyboard + gamepad continue controls
        var gp = pollGamepads();
        if (this.countActive) {
            if ((this.yKey && Phaser.Input.Keyboard.JustDown(this.yKey))
                || (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey))
                || gp.enter || gp.sp) {
                this.selectYes();
            } else if (this.nKey && Phaser.Input.Keyboard.JustDown(this.nKey)) {
                this.selectNo();
            }
        }

        // Go To Title: ENTER key or gamepad START/OPTIONS button
        if (this._gotoTitleReady && !this._gotoTitleDone) {
            if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.gotoTitle();
            }

            // Gamepad: START (9), OPTIONS/SELECT (8), or face buttons (0-3)
            try {
                var pads = navigator.getGamepads ? navigator.getGamepads() : [];
                var anyPressed = false;
                for (var p = 0; p < pads.length; p++) {
                    var pad = pads[p];
                    if (!pad) continue;
                    var btnIndices = [0, 1, 2, 3, 8, 9];
                    for (var b = 0; b < btnIndices.length; b++) {
                        var btn = pad.buttons[btnIndices[b]];
                        if (btn && btn.pressed) {
                            anyPressed = true;
                            if (!this._gamepadTitlePressed) {
                                this._gamepadTitlePressed = true;
                                this.gotoTitle();
                            }
                            break;
                        }
                    }
                }
                if (!anyPressed) {
                    this._gamepadTitlePressed = false;
                }
            } catch (e) {}
        }
    }
}

export default PhaserContinueScene;
