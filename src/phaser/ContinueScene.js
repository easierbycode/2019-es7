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

        this.loseFace = this.add.sprite(20, this.continueTitle.y + this.continueTitle.height + 38, "game_ui", "continueFace0.gif");
        this.loseFace.setOrigin(0, 0);

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

        this.yesBtn = this.add.text(
            GCX - 50, GCY + 70,
            "YES",
            {
                fontFamily: "sans-serif",
                fontSize: "20px",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#003300",
                padding: { x: 12, y: 8 },
            }
        );
        this.yesBtn.setOrigin(0.5);
        this.yesBtn.setInteractive({ useHandCursor: true });

        this.noBtn = this.add.text(
            GCX + 50, GCY + 70,
            "NO",
            {
                fontFamily: "sans-serif",
                fontSize: "20px",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#330000",
                padding: { x: 12, y: 8 },
            }
        );
        this.noBtn.setOrigin(0.5);
        this.noBtn.setInteractive({ useHandCursor: true });

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

        this.worldBestText = this.add.text(
            32, GH - 50,
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

        this.scoreSyncText = this.add.text(
            32, GH - 36,
            getHighScoreSyncText(),
            {
                fontFamily: "Arial",
                fontSize: "8px",
                fontStyle: "bold",
                color: "#cccccc",
                stroke: "#000000",
                strokeThickness: 1,
            }
        );

        var self = this;

        this.yesBtn.on("pointerup", function () {
            self.selectYes();
        });

        this.noBtn.on("pointerup", function () {
            self.selectNo();
        });

        this.playBgm("bgm_continue", 0.25);

        this.countdownTimer = this.time.addEvent({
            delay: 1200,
            repeat: 9,
            callback: this.onCountDown,
            callbackScope: this,
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

        this.cameras.main.shake(300, 0.02);

        this.tweens.add({
            targets: this.gameOverTxt,
            alpha: 1,
            duration: 1000,
            delay: 500,
            onComplete: function () {
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

            this.add.text(
                GCX, this.loseFace.y + this.loseFace.height + 20,
                "NEW RECORD!",
                {
                    fontFamily: "sans-serif",
                    fontSize: "12px",
                    fontStyle: "bold",
                    color: "#ffff00",
                }
            ).setOrigin(0.5, 0);
        }

        this.add.text(
            32, this.loseFace.y + this.loseFace.height + 40,
            "SCORE " + String(gameState.score || 0),
            {
                fontFamily: "sans-serif",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ffffff",
            }
        );

        var gotoBtn = this.add.text(
            GCX, GCY + 160,
            "TITLE",
            {
                fontFamily: "sans-serif",
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#333333",
                padding: { x: 20, y: 8 },
            }
        );
        gotoBtn.setOrigin(0.5);
        gotoBtn.setInteractive({ useHandCursor: true });

        var self = this;
        gotoBtn.on("pointerup", function () {
            self.stopAllSounds();
            self.scene.start("PhaserTitleScene");
        });
    }

    goNext() {
        var self = this;
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 1500,
            onComplete: function () {
                self.stopAllSounds();

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
                    self.scene.start("PhaserGameScene");
                } else {
                    self.scene.start("PhaserTitleScene");
                }
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
        }
    }
}

export default PhaserContinueScene;
