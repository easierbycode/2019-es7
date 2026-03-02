import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState } from "../gameState.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
} from "../highScoreUi.js";

export class PhaserTitleScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserTitleScene" });
        this.transitioning = false;
    }

    create() {
        this.transitioning = false;

        this.bg = this.add.tileSprite(
            0, 0,
            GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT,
            "title_bg"
        );
        this.bg.setOrigin(0, 0);

        this.titleG = this.add.sprite(0, 0, "title_ui", "titleG.gif");
        this.titleG.setOrigin(0, 0);
        this.titleG.setPosition(GAME_DIMENSIONS.WIDTH, 100);

        this.logo = this.add.sprite(0, 0, "title_ui", "logo.gif");
        this.logo.setOrigin(0.5);
        this.logo.setPosition(this.logo.width / 2, -this.logo.height / 2);
        this.logo.setScale(2);

        var subtitleKey = "subTitle" + (LANG === "ja" ? "" : "En") + ".gif";
        this.subTitle = this.add.sprite(0, 0, "title_ui", subtitleKey);
        this.subTitle.setOrigin(0.5);
        this.subTitle.setPosition(this.subTitle.width / 2, -this.logo.height / 2);
        this.subTitle.setScale(3);

        this.belt = this.add.graphics();
        this.belt.fillStyle(0x000000, 1);
        this.belt.fillRect(0, GAME_DIMENSIONS.HEIGHT - 120, GAME_DIMENSIONS.WIDTH, 120);

        this.startText = this.add.sprite(
            GAME_DIMENSIONS.CENTER_X, 330,
            "title_ui", "titleStartText.gif"
        );
        this.startText.setOrigin(0.5);
        this.startText.setAlpha(0);
        this.startText.setInteractive({ useHandCursor: true });

        this.copyright = this.add.sprite(0, 0, "title_ui", "titleCopyright.gif");
        this.copyright.setOrigin(0, 0);
        this.copyright.y = GAME_DIMENSIONS.HEIGHT - this.copyright.height - 6;

        this.scoreTitleImg = this.add.sprite(32, 0, "title_ui", "hiScoreTxt.gif");
        this.scoreTitleImg.setOrigin(0, 0);
        this.scoreTitleImg.y = this.copyright.y - 58;

        this.worldBestLabel = this.add.text(
            32, this.scoreTitleImg.y - 16,
            getWorldBestLabel(),
            {
                fontFamily: "Arial",
                fontSize: "11px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        this.highScoreText = this.add.text(
            this.scoreTitleImg.x + this.scoreTitleImg.width + 3,
            this.scoreTitleImg.y,
            String(getDisplayedHighScore()),
            {
                fontFamily: "Arial",
                fontSize: "16px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        this.scoreSyncLabel = this.add.text(
            32, this.scoreTitleImg.y + 22,
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

        this.startText.on("pointerup", function () {
            self.titleStart();
        });

        this.fadeRect = this.add.graphics();
        this.fadeRect.fillStyle(0x000000, 1);
        this.fadeRect.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.fadeRect.setAlpha(0);

        this.playTitleVoice = false;
        this.startIntroAnimation();
    }

    startIntroAnimation() {
        var self = this;
        var titleGTarget = GAME_DIMENSIONS.CENTER_X - this.titleG.width / 2 + 5;

        this.tweens.add({
            targets: this.titleG,
            x: titleGTarget,
            y: 20,
            duration: 2000,
            ease: "Quint.easeOut",
        });

        this.tweens.add({
            targets: this.logo,
            y: 75,
            duration: 900,
            delay: 1200,
            ease: "Quint.easeIn",
        });

        this.tweens.add({
            targets: this.logo,
            scaleX: 1,
            scaleY: 1,
            duration: 900,
            delay: 1100,
            ease: "Quint.easeIn",
        });

        this.tweens.add({
            targets: this.subTitle,
            y: 130,
            duration: 900,
            delay: 1180,
            ease: "Quint.easeIn",
        });

        this.tweens.add({
            targets: this.subTitle,
            scaleX: 1,
            scaleY: 1,
            duration: 900,
            delay: 1100,
            ease: "Quint.easeIn",
        });

        this.time.delayedCall(1500, function () {
            self.playVoice("voice_titlecall");
        });

        this.tweens.add({
            targets: this.startText,
            alpha: 1,
            duration: 100,
            delay: 2200,
            onComplete: function () {
                self.startFlashing();
            },
        });
    }

    startFlashing() {
        if (this.startText) {
            this.tweens.add({
                targets: this.startText,
                alpha: 0,
                duration: 300,
                delay: 100,
                yoyo: true,
                repeat: -1,
                hold: 800,
            });
        }
    }

    playVoice(key) {
        if (gameState.lowModeFlg) {
            return;
        }
        try {
            if (this.sound.get(key)) {
                this.sound.play(key, { volume: 0.7 });
            } else if (this.cache.audio.exists(key)) {
                this.sound.add(key).play({ volume: 0.7 });
            }
        } catch (e) {}
    }

    playSound(key, volume) {
        if (gameState.lowModeFlg) {
            return;
        }
        try {
            var vol = typeof volume === "number" ? volume : 0.75;
            if (this.sound.get(key)) {
                this.sound.play(key, { volume: vol });
            } else if (this.cache.audio.exists(key)) {
                this.sound.add(key).play({ volume: vol });
            }
        } catch (e) {}
    }

    titleStart() {
        if (this.transitioning) {
            return;
        }
        this.transitioning = true;
        this.playSound("se_decision", 0.75);

        this.tweens.killTweensOf(this.startText);
        this.startText.disableInteractive();

        var self = this;
        this.tweens.add({
            targets: this.fadeRect,
            alpha: 1,
            duration: 1000,
            onComplete: function () {
                self.goToAdvScene();
            },
        });
    }

    goToAdvScene() {
        var recipe = gameState._phaserRecipe;
        if (recipe && recipe.playerData) {
            gameState.spDamage = recipe.playerData.spDamage;
            gameState.playerMaxHp = recipe.playerData.maxHp;
            gameState.playerHp = recipe.playerData.maxHp;
            gameState.shootMode = recipe.playerData.defaultShootName;
            gameState.shootSpeed = recipe.playerData.defaultShootSpeed;
        }

        gameState.combo = 0;
        gameState.maxCombo = 0;
        gameState.score = 0;
        gameState.spgage = 0;
        gameState.stageId = 0;
        gameState.continueCnt = 0;
        gameState.akebonoCnt = 0;
        gameState.shortFlg = false;

        this.scene.start("PhaserAdvScene");
    }

    update() {
        if (this.bg) {
            this.bg.tilePositionX -= 0.5;
        }
        if (this.highScoreText) {
            this.highScoreText.setText(String(getDisplayedHighScore()));
        }
        if (this.scoreSyncLabel) {
            this.scoreSyncLabel.setText(getHighScoreSyncText());
        }
    }
}

export default PhaserTitleScene;
