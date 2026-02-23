import { BaseScene } from "./BaseScene.js";
import { TitleScene } from "./TitleScene.js";
import { GAME_DIMENSIONS, LANG, SCENE_NAMES } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { play } from "../soundManager.js";
import { TwitterButton } from "../ui/TwitterButton.js";
import { GotoTitleButton } from "../ui/GotoTitleButton.js";
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

export class EndingScene extends BaseScene {
    constructor() {
        super(SCENE_NAMES.ENDING);

        this._timeline = null;
        this._onGotoTitleUp = this.nextSceneAnim.bind(this);
        this._onTweetUp = this.tweet.bind(this);
        this._sceneRemovedHandled = false;
        this.continueFlg = false;
    }

    loop() {}

    run() {
        const bgFrames = [
            frameTexture("congraBg0.gif"),
            frameTexture("congraBg1.gif"),
            frameTexture("congraBg2.gif"),
        ];
        this.bg = createAnimatedSprite(bgFrames);
        this.bg.animationSpeed = 0.1;
        this.bg.alpha = 0;
        this.bg.play();
        this.addChild(this.bg);

        this.congraInfoBg = new PIXI.Sprite(frameTexture("congraInfoBg.gif"));
        this.congraInfoBg.anchor.set(0, 0.5);
        this.congraInfoBg.x = 0;
        this.congraInfoBg.y = 210;
        this.congraInfoBg.alpha = 0;
        this.addChild(this.congraInfoBg);

        const congraTextFrames = [
            frameTexture("congraTxt0.gif"),
            frameTexture("congraTxt1.gif"),
            frameTexture("congraTxt2.gif"),
        ];
        for (let i = 0; i < congraTextFrames.length; i += 1) {
            if (congraTextFrames[i] && congraTextFrames[i].baseTexture) {
                congraTextFrames[i].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }
        }

        this.congraTxt = createAnimatedSprite(congraTextFrames);
        this.congraTxt.animationSpeed = 0.2;
        this.congraTxt.anchor.set(0.5);
        this.congraTxt.x = this.congraTxt.width / 2;
        this.congraTxt.y = 6 + this.congraTxt.height / 2;
        this.congraTxt.play();
        this.addChild(this.congraTxt);

        this.congraTxtEffect = new PIXI.Sprite(congraTextFrames[0]);
        this.congraTxtEffect.anchor.set(0.5);
        this.congraTxtEffect.visible = false;
        this.addChild(this.congraTxtEffect);

        this.continueFlg = false;
        if (Number(gameState.score || 0) > Number(gameState.highScore || 0)) {
            gameState.highScore = Number(gameState.score || 0);
            saveHighScore();

            this.continueNewrecord = new PIXI.Sprite(frameTexture("continueNewrecord.gif"));
            this.continueNewrecord.x = 0;
            this.continueNewrecord.y = GAME_DIMENSIONS.CENTER_Y - 40;
            this.continueNewrecord.scale.set(1, 0);
            this.addChild(this.continueNewrecord);
            this.continueFlg = true;
        } else {
            this.continueNewrecord = null;
        }

        this.scoreContainer = new PIXI.Container();
        this.scoreContainer.x = 32;
        this.scoreContainer.y = GAME_DIMENSIONS.CENTER_Y - 23;
        this.scoreContainer.scale.set(1, 0);
        this.addChild(this.scoreContainer);

        this.scoreTitleTxt = new PIXI.Sprite(frameTexture("scoreTxt.gif"));
        this.scoreTitleTxt.x = 0;
        this.scoreTitleTxt.y = 0;
        this.scoreContainer.addChild(this.scoreTitleTxt);

        this.bigNumTxt = new BigNumberDisplay(10);
        this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3;
        this.bigNumTxt.y = this.scoreTitleTxt.y - 2;
        this.bigNumTxt.setNum(Number(gameState.score || 0));
        this.scoreContainer.addChild(this.bigNumTxt);

        this.twitterBtn = new TwitterButton();
        this.twitterBtn.scale.set(0);
        this.twitterBtn.x = GAME_DIMENSIONS.CENTER_X;
        this.twitterBtn.y = GAME_DIMENSIONS.CENTER_Y + 15;
        this.twitterBtn.on("pointerup", this._onTweetUp);
        this.addChild(this.twitterBtn);

        this.gotoTitleBtn = new GotoTitleButton();
        this.gotoTitleBtn.x = GAME_DIMENSIONS.CENTER_X - this.gotoTitleBtn.width / 2;
        this.gotoTitleBtn.y = GAME_DIMENSIONS.HEIGHT - this.gotoTitleBtn.height - 13;
        this.gotoTitleBtn.on("pointerup", this._onGotoTitleUp);
        this.addChild(this.gotoTitleBtn);

        const bgBlur = new PIXI.filters.BlurFilter();
        this.bg.filters = [bgBlur];

        this.congraTxt.scale.set(5);
        this.congraTxt.x = GAME_DIMENSIONS.WIDTH + this.congraTxt.width / 2;
        this.congraTxt.y = GAME_DIMENSIONS.CENTER_Y - 32;

        this._timeline = new TimelineMax();
        this._timeline.to(this.congraTxt, 2.5, {
            x: -(this.congraTxt.width - GAME_DIMENSIONS.WIDTH),
            ease: Linear.easeNone,
        });
        this._timeline.addCallback(function onCongraVoice() {
            play("voice_congra");
        }, "-=2.0", null, this);
        this._timeline.to(this.bg, 0.8, {
            alpha: 1,
        }, "-=0.3");
        this._timeline.to(bgBlur, 0.8, {
            blur: 0,
        }, "-=0.8");
        this._timeline.addCallback(function onCongraImpact() {
            play("se_sp");
            this.congraTxt.x = GAME_DIMENSIONS.CENTER_X;
            this.congraTxt.y = GAME_DIMENSIONS.CENTER_Y - 60;
            this.congraTxtEffect.x = this.congraTxt.x;
            this.congraTxtEffect.y = this.congraTxt.y;
            this.congraTxt.scale.set(3);
        }, "+=0", null, this);
        this._timeline.to(this.congraTxt.scale, 0.5, {
            x: 1,
            y: 1,
            ease: Expo.easeIn,
        });
        this._timeline.to(this.congraTxtEffect, 0, {
            visible: true,
        }, "+=0.0");
        this._timeline.to(this.congraTxtEffect.scale, 1, {
            x: 1.5,
            y: 1.5,
            ease: Expo.easeOut,
        }, "+=0.0");
        this._timeline.to(this.congraTxtEffect, 1, {
            alpha: 0,
            ease: Expo.easeOut,
        }, "-=1");
        this._timeline.to(this.congraInfoBg, 0.3, {
            alpha: 1,
        }, "-=0.5");
        if (this.continueFlg && this.continueNewrecord) {
            this._timeline.to(this.continueNewrecord.scale, 0.5, {
                y: 1,
                ease: Elastic.easeOut,
            });
        }
        this._timeline.to(this.scoreContainer.scale, 0.5, {
            x: 1,
            y: 1,
            ease: Elastic.easeOut,
        }, "-=0.25");
        this._timeline.to(this.twitterBtn.scale, 0.5, {
            x: 1,
            y: 1,
            ease: Elastic.easeOut,
        }, "-=0.25");
    }

    nextSceneAnim() {
        if (this.gotoTitleBtn) {
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

    tweet() {
        openUrl(buildTweetUrl());
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

        super.sceneRemoved();

        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage) {
            game.stage.addChild(new TitleScene());
        }
    }

    destroy(options) {
        if (this._timeline) {
            this._timeline.kill();
            this._timeline = null;
        }

        if (this.gotoTitleBtn) {
            this.gotoTitleBtn.off("pointerup", this._onGotoTitleUp);
        }
        if (this.twitterBtn) {
            this.twitterBtn.off("pointerup", this._onTweetUp);
        }

        super.destroy(options);
    }
}

export default EndingScene;
