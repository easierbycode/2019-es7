import { BaseScene } from "./BaseScene.js";
import { GameScene } from "./GameScene.js";
import { TitleScene } from "./TitleScene.js";
import { LANG, GAME_DIMENSIONS, STAGE_DIMENSIONS } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { globals } from "../globals.js";
import { play, bgmPlay, stop } from "../soundManager.js";
import { ContinueYesButton } from "../ui/ContinueYesButton.js";
import { ContinueNoButton } from "../ui/ContinueNoButton.js";
import { GotoTitleButton } from "../ui/GotoTitleButton.js";
import { TwitterButton } from "../ui/TwitterButton.js";
import { BigNumberDisplay } from "../ui/BigNumberDisplay.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

function frameTexture(frameName) {
    try {
        return PIXI.Texture.fromFrame(frameName);
    } catch (error) {
        return PIXI.Texture.WHITE;
    }
}

function removeChildIfPresent(container, child) {
    if (container && child && child.parent === container) {
        container.removeChild(child);
    }
}

function buildTweetUrl() {
    const score = Number(gameState.score || 0);
    const highScore = Number(gameState.highScore || 0);

    let url = "";
    let hashtags = "";
    let text = "";

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
    if (!url || typeof window === "undefined") {
        return;
    }

    try {
        window.open(url, "_blank");
    } catch (error) {
        // Ignore popup errors.
    }
}

function recipeData() {
    return globals.resources
        && globals.resources.recipe
        && globals.resources.recipe.data
        ? globals.resources.recipe.data
        : null;
}

function pickContinueComment() {
    const recipe = recipeData();
    const key = LANG === "ja" ? "continueComment" : "continueCommentEn";
    const list = recipe && Array.isArray(recipe[key]) ? recipe[key] : [];

    if (!list.length) {
        return "";
    }

    const index = Math.floor(Math.random() * list.length);
    return String(list[index] || "");
}

export class ContinueScene extends BaseScene {
    constructor() {
        super("ContinueScene");

        this.sceneSwitch = 0;
        this.countDown = 9;
        this.tl = null;
        this._sceneRemovedHandled = false;

        this._onYesUp = this.selectYes.bind(this);
        this._onNoUp = this.selectNo.bind(this);
        this._onTweetUp = this.tweet.bind(this);
        this._onGotoTitleUp = this.nextSceneAnim.bind(this);
    }

    loop() {}

    onCountDown() {
        if (this.countDown < 0) {
            this.selectNo();
            return;
        }

        this.tl = new TimelineMax({
            onComplete: this.onCountDown,
            onCompleteScope: this,
        });

        this.tl.to(this.cntText, 0.4, {
            delay: 0.4,
            alpha: 0,
        });

        this.tl.call(function onCountdownTick() {
            this.cntText.texture = frameTexture("countdown" + String(this.countDown) + ".gif");
            play("voice_countdown" + String(this.countDown));
            this.countDown -= 1;
        }, null, this, "+=0");

        this.tl.to(this.cntText, 0.8, {
            alpha: 1,
        });
    }

    run() {
        bgmPlay("bgm_continue", 102735, 698597);

        this.sceneSwitch = 0;
        this.countDown = 9;

        this.bg = new PIXI.Graphics();
        this.bg.beginFill(0x000000, 1);
        this.bg.drawRect(0, 0, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        this.addChild(this.bg);

        this.continueTitle = new PIXI.Sprite(frameTexture("continueTitle.gif"));
        this.continueTitle.x = 0;
        this.continueTitle.y = 70;
        this.addChild(this.continueTitle);

        this.loseFaceTexture = [frameTexture("continueFace0.gif"), frameTexture("continueFace1.gif")];
        this.loseFaceGrayTexture = [frameTexture("continueFace2.gif")];
        this.loseFaceSmileTexture = [frameTexture("continueFace3.gif")];

        this.loseFace = createAnimatedSprite(this.loseFaceTexture);
        this.loseFace.x = 20;
        this.loseFace.y = this.continueTitle.y + this.continueTitle.height + 38;
        this.loseFace.animationSpeed = 0.05;
        this.loseFace.play();
        this.addChild(this.loseFace);

        this.cntTextBg = new PIXI.Sprite(frameTexture("countdownBg.gif"));
        this.cntTextBg.x = this.cntTextBg.width + 20;
        this.cntTextBg.y = this.continueTitle.y + this.continueTitle.height + 30;
        this.addChild(this.cntTextBg);

        this.cntText = new PIXI.Sprite(frameTexture("countdown9.gif"));
        this.cntText.x = this.cntTextBg.x;
        this.cntText.y = this.cntTextBg.y;
        this.cntText.alpha = 0;
        this.addChild(this.cntText);

        this.yesText = new ContinueYesButton();
        this.yesText.x = GAME_DIMENSIONS.CENTER_X - this.yesText.width / 2 - 50;
        this.yesText.y = GAME_DIMENSIONS.CENTER_Y - this.yesText.height / 2 + 70;
        this.yesText.on("pointerup", this._onYesUp);
        this.addChild(this.yesText);

        this.noText = new ContinueNoButton();
        this.noText.x = GAME_DIMENSIONS.CENTER_X - this.noText.width / 2 + 50;
        this.noText.y = GAME_DIMENSIONS.CENTER_Y - this.noText.height / 2 + 70;
        this.noText.on("pointerup", this._onNoUp);
        this.addChild(this.noText);

        this.continueTitle.alpha = 0;
        this.loseFace.alpha = 0;
        this.cntTextBg.alpha = 0;
        this.yesText.alpha = 0;
        this.noText.alpha = 0;
        TweenMax.to([this.continueTitle, this.loseFace, this.cntTextBg, this.yesText, this.noText], 0.8, {
            alpha: 1,
        });

        const textStyle = new PIXI.TextStyle({
            fontFamily: "sans-serif",
            fontSize: 15,
            fontWeight: "bold",
            lineHeight: 17,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: 230,
            breakWords: true,
            align: "center",
            padding: 10,
        });

        this.commentText = new PIXI.Text(pickContinueComment(), textStyle);
        this.commentText.x = GAME_DIMENSIONS.CENTER_X - this.commentText.width / 2;
        this.commentText.y = GAME_DIMENSIONS.HEIGHT - 120;
        this.addChild(this.commentText);

        this.onCountDown();
    }

    selectYes() {
        if (this.countDown < 0) {
            this.countDown = 0;
        }

        stop("voice_countdown" + String(this.countDown));

        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        this.sceneSwitch = 1;
        this.nextSceneAnim();

        const voiceIndex = Math.floor(Math.random() * 3);
        play("g_continue_yes_voice" + String(voiceIndex));
    }

    selectNo() {
        if (this.countDown < 0) {
            this.countDown = 0;
        }

        stop("voice_countdown" + String(this.countDown));

        if (!gameState.lowModeFlg && globals.resources && globals.resources.bgm_continue && globals.resources.bgm_continue.sound) {
            const bgmContinue = globals.resources.bgm_continue.sound;
            bgmContinue.volume = 0;
            TweenMax.to(bgmContinue, 1.5, {
                volume: 0.25,
                delay: 2.8,
            });
        }

        play("voice_gameover");
        play("bgm_gameover");

        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        this.countDown = 0;
        this.cntText.alpha = 0.2;
        this.cntText.texture = frameTexture("countdown0.gif");
        this.loseFace.textures = this.loseFaceGrayTexture;

        removeChildIfPresent(this, this.commentText);

        this.gameOverTxt = new PIXI.Sprite(frameTexture("continueGameOver.gif"));
        this.gameOverTxt.x = GAME_DIMENSIONS.CENTER_X - this.gameOverTxt.width / 2;
        this.gameOverTxt.y = GAME_DIMENSIONS.CENTER_Y - this.gameOverTxt.height / 2 - 35;
        this.gameOverTxt.alpha = 0;
        this.addChild(this.gameOverTxt);

        this.tl = new TimelineMax({
            onComplete: function onGameoverPanelReady() {
                if (Number(gameState.score || 0) > Number(gameState.highScore || 0)) {
                    gameState.highScore = Number(gameState.score || 0);
                    saveHighScore();

                    this.continueNewrecord = new PIXI.Sprite(frameTexture("continueNewrecord.gif"));
                    this.continueNewrecord.x = 0;
                    this.continueNewrecord.y = this.loseFace.y + this.loseFace.height + 10;
                    this.addChild(this.continueNewrecord);
                }

                this.scoreTitleTxt = new PIXI.Sprite(frameTexture("scoreTxt.gif"));
                this.scoreTitleTxt.x = 32;
                this.scoreTitleTxt.y = this.loseFace.y + this.loseFace.height + 30;
                this.addChild(this.scoreTitleTxt);

                this.bigNumTxt = new BigNumberDisplay(10);
                this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3;
                this.bigNumTxt.y = this.scoreTitleTxt.y - 2;
                this.bigNumTxt.setNum(Number(gameState.score || 0));
                this.addChild(this.bigNumTxt);

                this.twText = new TwitterButton();
                this.twText.x = GAME_DIMENSIONS.CENTER_X;
                this.twText.y = this.scoreTitleTxt.y + this.twText.height / 2 + 20;
                this.twText.on("pointerup", this._onTweetUp);
                this.addChild(this.twText);

                this.gotoTitleBtn = new GotoTitleButton();
                this.gotoTitleBtn.x = GAME_DIMENSIONS.CENTER_X - this.gotoTitleBtn.width / 2;
                this.gotoTitleBtn.y = GAME_DIMENSIONS.CENTER_Y - this.gotoTitleBtn.height / 2 + 160;
                this.gotoTitleBtn.on("pointerup", this._onGotoTitleUp);
                this.addChild(this.gotoTitleBtn);
            },
            onCompleteScope: this,
        });

        this.tl.to(this, 0.07, {
            x: 0,
            y: 10,
        });
        this.tl.call(function shakeBg0() {
            this.bg.beginFill(0x770000, 1);
            this.bg.drawRect(0, 0, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        }, null, this, "+=0");
        this.tl.to(this, 0.07, {
            x: 0,
            y: -5,
        });
        this.tl.call(function shakeBg1() {
            this.bg.beginFill(0x000000, 1);
            this.bg.drawRect(0, 0, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        }, null, this, "+=0");
        this.tl.to(this, 0.07, {
            x: 0,
            y: 3,
        });
        this.tl.call(function shakeBg2() {
            this.bg.beginFill(0x770000, 1);
            this.bg.drawRect(0, 0, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        }, null, this, "+=0");
        this.tl.to(this, 0.07, {
            x: 0,
            y: 0,
        });
        this.tl.call(function shakeBg3() {
            this.bg.beginFill(0x000000, 1);
            this.bg.drawRect(0, 0, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        }, null, this, "+=0");
        this.tl.to(this.gameOverTxt, 1, {
            delay: 0.3,
            alpha: 1.5,
        });
        this.tl.call(function onGameoverVoice() {
            const voiceIndex = Math.floor(Math.random() * 2);
            play("g_continue_no_voice" + String(voiceIndex));
        }, null, this, "+=0");

        removeChildIfPresent(this, this.yesText);
        removeChildIfPresent(this, this.noText);
    }

    tweet() {
        openUrl(buildTweetUrl());
    }

    nextSceneAnim() {
        if (this.sceneSwitch === 1) {
            if (this.yesText) {
                this.yesText.interactive = false;
                this.yesText.buttonMode = false;
            }
            if (this.noText) {
                this.noText.interactive = false;
                this.noText.buttonMode = false;
            }
            if (this.loseFace) {
                this.loseFace.textures = this.loseFaceSmileTexture;
            }
        } else if (this.gotoTitleBtn) {
            this.gotoTitleBtn.off("pointerup", this._onGotoTitleUp);
            this.gotoTitleBtn.interactive = false;
            this.gotoTitleBtn.buttonMode = false;
        }

        TweenMax.to(this, 1.5, {
            alpha: 0,
            delay: 0.3,
            onComplete: this.removeSceneFromStage,
            onCompleteScope: this,
        });
    }

    removeSceneFromStage() {
        if (this.parent) {
            this.parent.removeChild(this);
            return;
        }

        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage && game.stage.children.indexOf(this) !== -1) {
            game.stage.removeChild(this);
        }
    }

    sceneRemoved() {
        if (this._sceneRemovedHandled) {
            return;
        }
        this._sceneRemovedHandled = true;

        stop("bgm_continue");

        super.sceneRemoved();

        const game = globalThis.__PHASER_GAME__;
        if (!game || !game.stage) {
            return;
        }

        if (Number(this.sceneSwitch) === 1) {
            const recipe = recipeData();
            const playerData = recipe && recipe.playerData ? recipe.playerData : null;

            if (playerData) {
                gameState.playerMaxHp = playerData.maxHp;
                gameState.playerHp = gameState.playerMaxHp;
                gameState.shootMode = playerData.defaultShootName;
                gameState.shootSpeed = playerData.defaultShootSpeed;
            }

            gameState.continueCnt = Number(gameState.continueCnt || 0) + 1;
            gameState.score = gameState.continueCnt;

            game.stage.addChild(new GameScene());
            return;
        }

        game.stage.addChild(new TitleScene());
    }

    destroy(options) {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        if (this.yesText) {
            this.yesText.off("pointerup", this._onYesUp);
        }
        if (this.noText) {
            this.noText.off("pointerup", this._onNoUp);
        }
        if (this.twText) {
            this.twText.off("pointerup", this._onTweetUp);
        }
        if (this.gotoTitleBtn) {
            this.gotoTitleBtn.off("pointerup", this._onGotoTitleUp);
        }

        super.destroy(options);
    }
}

export default ContinueScene;
