import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState, isExportedLevelApp } from "../gameState.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
    getHighScoreSyncTint,
} from "../highScoreUi.js";
import { dezaStaffCredits, StaffRollPanel } from "./StaffRollPanel.js";
import { pollGamepads } from "./GamepadInput.js";
import { startDezaemonBgm, stopDezaemonBgm } from "./dezaemon-runtime.js";

export class PhaserTitleScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserTitleScene" });
        this.transitioning = false;
    }

    create() {
        this.transitioning = false;
        this.staffRollPanel = null;

        // A Dezaemon import ships its own DRAWN title screen (TITLE 1/2
        // compositions and a credit strip, extracted into the atlas by the
        // importer). When the recipe carries one, the save's art replaces the
        // stock logo pieces and rides the same entrance tweens; the Saturn's
        // title plays over black, so the stock backdrop stays off.
        var recipe = gameState._phaserRecipe;
        var atlas = this.textures.get("game_asset");
        var deza = recipe && recipe.dezaemonTitle && atlas ? recipe.dezaemonTitle : null;
        var dezaFrame = (role) => deza && deza[role] && atlas.has(deza[role]) ? deza[role] : null;
        // Any drawn piece makes this an import's title — even a credit-only
        // save must not fall back to the stock 2028.Ai logo screen.
        this.dezaTitle = !!(dezaFrame("title1") || dezaFrame("title2") || dezaFrame("credit"));
        var dezaLogo = dezaFrame("title1") || dezaFrame("title2");

        this.bg = this.add.tileSprite(
            0, 0,
            GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT,
            "title_bg"
        );
        this.bg.setOrigin(0, 0);
        if (this.dezaTitle) this.bg.setVisible(false);

        this.titleG = this.add.sprite(0, 0, "game_ui", "titleG.gif");
        this.titleG.setOrigin(0, 0);
        this.titleG.setPosition(GAME_DIMENSIONS.WIDTH, 100);
        if (this.dezaTitle) this.titleG.setVisible(false);

        if (this.dezaTitle && dezaLogo) {
            // TITLE1 leads; a save with only TITLE2 lets it take the slot
            this.logo = this.add.sprite(0, 0, "game_asset", dezaLogo);
        } else if (!this.dezaTitle && this.textures.exists("custom_logo")) {
            this.logo = this.add.sprite(0, 0, "custom_logo");
        } else {
            this.logo = this.add.sprite(0, 0, "game_ui", "logo.gif");
        }
        this.logo.setOrigin(0.5);
        // Deza art is trimmed small, so the stock -height/2 start would leave
        // its pre-tween scaled body peeking into the screen — start it fully
        // above the top instead (scale-2 half-height + margin).
        this.logo.setPosition(
            this.dezaTitle ? GAME_DIMENSIONS.CENTER_X : this.logo.width / 2,
            this.dezaTitle ? -this.logo.height - 8 : -this.logo.height / 2
        );
        this.logo.setScale(2);
        if (this.dezaTitle && !dezaLogo) this.logo.setVisible(false);

        var dezaSub = this.dezaTitle && dezaFrame("title1") ? dezaFrame("title2") : null;
        if (dezaSub) {
            this.subTitle = this.add.sprite(0, 0, "game_asset", dezaSub);
        } else if (!this.dezaTitle && this.textures.exists("custom_subTitle")) {
            this.subTitle = this.add.sprite(0, 0, "custom_subTitle");
        } else {
            var subtitleKey = "subTitle" + (LANG === "ja" ? "" : "En") + ".gif";
            this.subTitle = this.add.sprite(0, 0, "game_ui", subtitleKey);
        }
        this.subTitle.setOrigin(0.5);
        // Same fully-off-screen start for the deza subtitle (scale-3 half-
        // height + margin) — the stock art relied on the tall stock logo.
        this.subTitle.setPosition(
            this.dezaTitle ? GAME_DIMENSIONS.CENTER_X : this.subTitle.width / 2,
            this.dezaTitle ? -this.subTitle.height * 1.5 - 8 : -this.logo.height / 2
        );
        this.subTitle.setScale(3);
        if (this.dezaTitle && !dezaSub) this.subTitle.setVisible(false);

        this.belt = this.add.graphics();
        this.belt.fillStyle(0x000000, 1);
        this.belt.fillRect(0, GAME_DIMENSIONS.HEIGHT - 120, GAME_DIMENSIONS.WIDTH, 120);

        if (this.textures.exists("custom_titleStartText")) {
            this.startText = this.add.sprite(
                GAME_DIMENSIONS.CENTER_X, 330,
                "custom_titleStartText"
            );
        } else {
            this.startText = this.add.sprite(
                GAME_DIMENSIONS.CENTER_X, 330,
                "game_ui", "titleStartText.gif"
            );
        }
        this.startText.setOrigin(0.5);
        this.startText.setAlpha(0);
        this.startText.setInteractive({ useHandCursor: true });

        if (this.dezaTitle && dezaFrame("credit")) {
            // the save's own credit strip (its author line) replaces the
            // stock copyright, centered at the same baseline
            this.copyright = this.add.sprite(0, 0, "game_asset", deza.credit);
            this.copyright.setOrigin(0.5, 0);
            this.copyright.x = GAME_DIMENSIONS.CENTER_X;
        } else {
            this.copyright = this.add.sprite(0, 0, "game_ui", "titleCopyright.gif");
            this.copyright.setOrigin(0, 0);
            if (this.dezaTitle) this.copyright.setVisible(false);
        }
        this.copyright.y = GAME_DIMENSIONS.HEIGHT - this.copyright.height - 6;

        this.scoreTitleImg = this.add.sprite(32, 0, "game_ui", "hiScoreTxt.gif");
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
            this.scoreTitleImg.y + this.scoreTitleImg.height / 2,
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
        this.highScoreText.setOrigin(0, 0.5);

        this.scoreSyncLabel = this.add.text(
            32, this.scoreTitleImg.y + 22,
            getHighScoreSyncText(),
            {
                fontFamily: "Arial",
                fontSize: "8px",
                fontStyle: "bold",
                color: "#9be37f",
                stroke: "#000000",
                strokeThickness: 2,
            }
        );

        var self = this;

        this.startText.on("pointerup", function () {
            self.titleStart();
        });

        this.tapZone = this.add.zone(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            GAME_DIMENSIONS.WIDTH,
            GAME_DIMENSIONS.HEIGHT
        );
        this.tapZone.setInteractive({ useHandCursor: true });
        this.tapZone.on("pointerup", function () {
            self.titleStart();
        });

        this.twitterBtn = this.createFrameButton(
            GAME_DIMENSIONS.CENTER_X,
            this.copyright.y - 12,
            "twitterBtn"
        );
        this.twitterBtn.setOrigin(0.5);
        this.twitterBtn.on("pointerup", this.tweet, this);

        this.howtoBtn = this.createFrameButton(15, 10, "howtoBtn");
        this.howtoBtn.setOrigin(0, 0);
        this.howtoBtn.setScale(1, 0);
        this.howtoBtn.on("pointerup", function () {
            try {
                if (typeof window.howtoModalOpen === "function") {
                    window.howtoModalOpen();
                }
            } catch (e) {}
        });

        this.staffrollBtn = this.createFrameButton(
            GAME_DIMENSIONS.WIDTH - 15,
            10,
            "staffrollBtn"
        );
        this.staffrollBtn.setOrigin(1, 0);
        this.staffrollBtn.setScale(1, 0);
        this.staffrollBtn.on("pointerup", this.showStaffroll, this);

        // An import's title screen keeps only the Saturn-appropriate chrome:
        // no TWEET, no HOW TO PLAY (2028.Ai's tutorial). STAFF ROLL stays —
        // it shows the save's own title and developer.
        if (this.dezaTitle) {
            this.twitterBtn.setVisible(false);
            this.twitterBtn.disableInteractive();
            this.howtoBtn.setVisible(false);
            this.howtoBtn.disableInteractive();
        }

        // An exported level app is a finished cartridge: never TWEET (the
        // stock share text is 2028.Ai's, not this game's), and never the
        // BUILD APK forge below — an export must not re-export itself.
        if (isExportedLevelApp()) {
            this.twitterBtn.setVisible(false);
            this.twitterBtn.disableInteractive();
        }

        // STAFF ROLL on an import only when there are credits to show —
        // a save the community table doesn't know, whose cart carries no
        // title of its own, would open an empty card.
        if (this.dezaTitle && !dezaStaffCredits(recipe)) {
            this.staffrollBtn.setVisible(false);
            this.staffrollBtn.disableInteractive();
        }

        if (typeof window !== "undefined"
                && window.cordova
                && window.cordova.platformId === "android"
                && !isExportedLevelApp()) {
            this.forgeBtn = this.add.text(
                GAME_DIMENSIONS.WIDTH - 6, GAME_DIMENSIONS.HEIGHT - 22,
                "BUILD APK",
                {
                    fontFamily: "Arial",
                    fontSize: "10px",
                    fontStyle: "bold",
                    color: "#0f0",
                    stroke: "#000",
                    strokeThickness: 2,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: { left: 4, right: 4, top: 2, bottom: 2 }
                }
            );
            this.forgeBtn.setOrigin(1, 0);
            this.forgeBtn.setInteractive({ useHandCursor: true });
            this.forgeBtn.on("pointerup", function () {
                self.scene.start("PhaserForgeScene");
            });
        }

        this.playTitleVoice = false;
        this.startIntroAnimation();

        // The save's own title track (the BGM table's first special slot).
        if (this.dezaTitle && !gameState.lowModeFlg) {
            startDezaemonBgm(this, "title");
        }

        // Keyboard: Enter or Space to start
        this.enterKey = null;
        this.spaceKey = null;
        try {
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        } catch (e) {}
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
            // the stock title call is 2028.Ai's own voice — not an import's
            if (!self.dezaTitle) self.playVoice("voice_titlecall");
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

        this.tweens.add({
            targets: this.howtoBtn,
            scaleY: 1,
            duration: 300,
            delay: 2600,
            ease: "Elastic.easeOut",
        });

        this.tweens.add({
            targets: this.staffrollBtn,
            scaleY: 1,
            duration: 300,
            delay: 2750,
            ease: "Elastic.easeOut",
        });
    }

    createFrameButton(x, y, framePrefix) {
        var button = this.add.sprite(x, y, "game_ui", framePrefix + "0.gif");
        button.setInteractive({ useHandCursor: true });

        button.on("pointerover", function () {
            button.setFrame(framePrefix + "1.gif");
        });
        button.on("pointerout", function () {
            button.setFrame(framePrefix + "0.gif");
        });
        button.on("pointerdown", function () {
            button.setFrame(framePrefix + "2.gif");
        });
        button.on("pointerup", function () {
            button.setFrame(framePrefix + "1.gif");
        });

        return button;
    }

    showStaffroll() {
        if (this.staffRollPanel && this.staffRollPanel.active) {
            return;
        }
        // Mirrors the button's visibility gate (a gamepad/script could still
        // land here): no credits, no card.
        if (this.dezaTitle && !dezaStaffCredits(gameState._phaserRecipe)) {
            return;
        }
        this.staffRollPanel = new StaffRollPanel(this);
    }

    tweet() {
        var score = Number(gameState.score || 0);
        var highScore = Number(gameState.highScore || 0);

        var url = "";
        var hashtags = "";
        var text = "";

        if (LANG === "ja") {
            url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=ja");
            hashtags = encodeURIComponent("シャド研,SFVAE,aprilfool,エイプリルフール");
            text = encodeURIComponent("エイプリルフール 2019 世界大統領がSTGやってみた\nHISCORE:" + highScore + "\n");
        } else {
            url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=en");
            hashtags = encodeURIComponent("ShadalooCRI, SFVAE, aprilfool");
            text = encodeURIComponent("APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\nBEST:" + highScore + "\n");
        }

        var tweetUrl = "https://twitter.com/intent/tweet?url=" + url + "&hashtags=" + hashtags + "&text=" + text + "&score=" + score;
        try {
            window.open(tweetUrl, "_blank");
        } catch (e) {}
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

        if (this.staffRollPanel && this.staffRollPanel.active) {
            return;
        }

        this.transitioning = true;
        this.playSound("se_decision", 0.75);

        this.tweens.killTweensOf(this.startText);
        this.startText.disableInteractive();
        this.twitterBtn.disableInteractive();
        this.howtoBtn.disableInteractive();
        this.staffrollBtn.disableInteractive();
        this.tapZone.disableInteractive();

        var self = this;
        this.cameras.main.fade(1000, 0, 0, 0, false, function (cam, progress) {
            if (progress >= 1) {
                self.goToAdvScene();
            }
        });
    }

    launchLevelEditor() {
        try {
            window.open("level-editor.html", "_blank");
        } catch (e) {}
    }

    goToAdvScene() {
        stopDezaemonBgm(this);
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
        gameState.forceBossName = null;

        var game = this.game;
        setTimeout(function () {
            game.scene.stop("PhaserTitleScene");
            game.scene.start("PhaserAdvScene");
        }, 50);
    }

    update(time, delta) {
        // Fixed-timestep BG scroll (120 logical fps, matching PIXI)
        var STEP = 8.333333;
        this._accumulator = (this._accumulator || 0) + Math.min(delta, 66.67);
        while (this._accumulator >= STEP) {
            this._accumulator -= STEP;
            if (this.bg) {
                this.bg.tilePositionX -= 0.5;
            }
        }

        if (this.highScoreText) {
            this.highScoreText.setText(String(getDisplayedHighScore()));
        }

        if (this.scoreSyncLabel) {
            this.scoreSyncLabel.setText(getHighScoreSyncText());
            var syncTint = getHighScoreSyncTint();
            this.scoreSyncLabel.setColor("#" + syncTint.toString(16).padStart(6, "0"));
        }

        // Keyboard + gamepad start
        var gp = pollGamepads();
        if (!this.transitioning) {
            if (gp.editor) {
                this.launchLevelEditor();
            } else if (
                (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
                (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
                gp.sp || gp.enter
            ) {
                this.titleStart();
            }
        }
    }
}

export default PhaserTitleScene;
