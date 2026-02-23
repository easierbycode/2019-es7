import { BaseScene } from "./BaseScene.js";
import { AdvScene } from "./AdvScene.js";
import {
    LANG,
    SCENE_NAMES,
    GAME_DIMENSIONS,
    STAGE_DIMENSIONS,
} from "../constants.js";
import { gameState } from "../gameState.js";
import { globals } from "../globals.js";
import { play as playSound } from "../soundManager.js";
import { StartButton } from "../ui/StartButton.js";
import { HowtoButton } from "../ui/HowtoButton.js";
import { StaffrollButton } from "../ui/StaffrollButton.js";
import { TwitterButton } from "../ui/TwitterButton.js";
import { StaffrollPanel } from "../ui/StaffrollPanel.js";
import { BigNumberDisplay } from "../ui/BigNumberDisplay.js";

function frameTexture(frameName) {
    try {
        return PIXI.Texture.fromFrame(frameName);
    } catch (error) {
        return PIXI.Texture.WHITE;
    }
}

function resourceTexture(resourceKey) {
    const resources = globals.resources || {};
    return resources[resourceKey] && resources[resourceKey].texture ? resources[resourceKey].texture : null;
}

function openUrl(url) {
    if (typeof window === "undefined" || !url) {
        return;
    }

    try {
        window.open(url, "_blank");
    } catch (error) {
        // Ignore popup errors.
    }
}

export class TitleScene extends BaseScene {
    constructor() {
        super(SCENE_NAMES.TITLE);

        this.state = gameState;
        this.resources = globals.resources;
        this.transitioning = false;
        this.staffrollPanel = null;
        this.fadeOutBlack = null;
        this._onStartUp = this.titleStart.bind(this);
        this._onTweetUp = this.tweet.bind(this);
        this._onStaffrollUp = this.showStaffroll.bind(this);
    }

    loop() {
        super.loop();

        if (this.bg) {
            this.bg.tilePosition.x += 0.5;
        }
    }

    run() {
        this.resources = globals.resources || {};

        const bgTexture = resourceTexture("title_bg") || PIXI.Texture.fromImage("title_bg");
        this.bg = new PIXI.extras.TilingSprite(bgTexture, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.addChild(this.bg);

        this.titleGWrap = new PIXI.Container();
        this.titleG = new PIXI.Sprite(frameTexture("titleG.gif"));
        this.titleGWrap.addChild(this.titleG);
        this.addChild(this.titleGWrap);

        this.logo = new PIXI.Sprite(frameTexture("logo.gif"));
        this.logo.anchor.set(0.5);
        this.addChild(this.logo);

        const subtitleKey = "subTitle" + (LANG === "ja" ? "" : "En") + ".gif";
        this.subTitle = new PIXI.Sprite(frameTexture(subtitleKey));
        this.subTitle.anchor.set(0.5);
        this.addChild(this.subTitle);

        this.belt = new PIXI.Graphics();
        this.belt.beginFill(0x000000, 1);
        this.belt.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, 120);
        this.belt.endFill();
        this.belt.y = GAME_DIMENSIONS.HEIGHT - 120;
        this.addChild(this.belt);

        this.startBtn = new StartButton();
        this.startBtn.interactive = false;
        this.startBtn.buttonMode = false;
        this.startBtn.alpha = 0;
        this.addChild(this.startBtn);
        this.startBtn.on("pointerup", this._onStartUp);

        this.copyright = new PIXI.Sprite(frameTexture("titleCopyright.gif"));
        this.copyright.x = 0;
        this.copyright.y = GAME_DIMENSIONS.HEIGHT - this.copyright.height - 6;
        this.addChild(this.copyright);

        this.scoreTitleTxt = new PIXI.Sprite(frameTexture("hiScoreTxt.gif"));
        this.scoreTitleTxt.x = 32;
        this.scoreTitleTxt.y = this.copyright.y - 66;
        this.addChild(this.scoreTitleTxt);

        this.bigNumTxt = new BigNumberDisplay(10);
        this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3;
        this.bigNumTxt.y = this.scoreTitleTxt.y - 2;
        this.bigNumTxt.setNum(this.state.highScore || 0);
        this.addChild(this.bigNumTxt);

        this.twitterBtn = new TwitterButton();
        this.twitterBtn.x = GAME_DIMENSIONS.CENTER_X;
        this.twitterBtn.y = this.copyright.y - this.twitterBtn.height / 2 - 14;
        this.addChild(this.twitterBtn);
        this.twitterBtn.on("pointerup", this._onTweetUp);

        this.howtoBtn = new HowtoButton();
        this.howtoBtn.x = 15;
        this.howtoBtn.y = 10;
        this.howtoBtn.scale.y = 0;
        this.addChild(this.howtoBtn);

        this.staffrollBtn = new StaffrollButton();
        this.staffrollBtn.x = GAME_DIMENSIONS.WIDTH - this.staffrollBtn.width - 15;
        this.staffrollBtn.y = 10;
        this.staffrollBtn.scale.y = 0;
        this.addChild(this.staffrollBtn);
        this.staffrollBtn.on("pointerup", this._onStaffrollUp);

        const coverTexture = frameTexture("stagebgOver.gif");
        this.cover = new PIXI.extras.TilingSprite(coverTexture, STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        this.addChild(this.cover);

        this.fadeOutBlack = new PIXI.Graphics();
        this.fadeOutBlack.beginFill(0x000000);
        this.fadeOutBlack.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.fadeOutBlack.endFill();
        this.fadeOutBlack.alpha = 0;
        this.addChild(this.fadeOutBlack);

        this.startIntroAnimation();
    }

    startIntroAnimation() {
        this.titleGWrap.x = GAME_DIMENSIONS.WIDTH;
        this.titleGWrap.y = 100;

        this.logo.x = this.logo.width / 2;
        this.logo.y = -this.logo.height / 2;
        this.logo.scale.set(2);

        this.subTitle.x = this.subTitle.width / 2;
        this.subTitle.y = -this.logo.height / 2;
        this.subTitle.scale.set(3);

        this.introTl = new TimelineMax();
        this.introTl.to(this.titleGWrap, 2, {
            x: GAME_DIMENSIONS.CENTER_X - this.titleG.width / 2 + 5,
            y: 20,
            ease: Quint.easeOut,
        });
        this.introTl.to(this.logo, 0.9, {
            y: 75,
            ease: Quint.easeIn,
        }, "-=0.8");
        this.introTl.to(this.logo.scale, 0.9, {
            x: 1,
            y: 1,
            ease: Quint.easeIn,
        }, "-=0.9");
        this.introTl.to(this.subTitle, 0.9, {
            y: 130,
            ease: Quint.easeIn,
        }, "-=0.82");
        this.introTl.to(this.subTitle.scale, 0.9, {
            x: 1,
            y: 1,
            ease: Quint.easeIn,
        }, "-=0.9");
        this.introTl.addCallback(() => {
            playSound("voice_titlecall");
        }, "-=0.5");
        this.introTl.to(this.startBtn, 0.1, {
            alpha: 1,
        });
        this.introTl.addCallback(() => {
            this.startBtn.interactive = true;
            this.startBtn.buttonMode = true;
            this.startBtn.flash();
        }, "+=0.3");
        this.introTl.to(this.howtoBtn.scale, 0.3, {
            y: 1,
            ease: Elastic.easeOut,
        }, "+=0.2");
        this.introTl.to(this.staffrollBtn.scale, 0.3, {
            y: 1,
            ease: Elastic.easeOut,
        }, "-=0.15");
    }

    showStaffroll() {
        if (this.staffrollPanel && this.staffrollPanel.parent) {
            return;
        }

        this.staffrollPanel = new StaffrollPanel();
        this.addChild(this.staffrollPanel);
        this.staffrollPanel.open();
    }

    tweet() {
        const score = Number(this.state.score || 0);
        const highScore = Number(this.state.highScore || 0);

        let url = "";
        let hashtags = "";
        let text = "";

        if (LANG === "ja") {
            url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=ja");
            hashtags = encodeURIComponent("シャド研,SFVAE,aprilfool,エイプリルフール");
            text = encodeURIComponent("エイプリルフール 2019 世界大統領がSTGやってみた\nHISCORE:" + highScore + "\n");
        } else {
            url = encodeURIComponent("https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=en");
            hashtags = encodeURIComponent("ShadalooCRI, SFVAE, aprilfool");
            text = encodeURIComponent("APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\nBEST:" + highScore + "\n");
        }

        const tweetUrl = "https://twitter.com/intent/tweet?url=" + url + "&hashtags=" + hashtags + "&text=" + text + "&score=" + score;
        openUrl(tweetUrl);
    }

    titleStart() {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;
        this.startBtn.interactive = false;
        this.startBtn.buttonMode = false;
        this.howtoBtn.interactive = false;
        this.staffrollBtn.interactive = false;
        this.twitterBtn.interactive = false;

        TweenMax.to(this.fadeOutBlack, 1, {
            alpha: 1,
            onComplete: this.removeSceneFromStage.bind(this),
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
        super.sceneRemoved();

        const playerData = this.resources && this.resources.recipe && this.resources.recipe.data
            ? this.resources.recipe.data.playerData
            : null;

        if (playerData) {
            this.state.spDamage = playerData.spDamage;
            this.state.playerMaxHp = playerData.maxHp;
            this.state.playerHp = playerData.maxHp;
            this.state.shootMode = playerData.defaultShootName;
            this.state.shootSpeed = playerData.defaultShootSpeed;
        }

        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.score = 0;
        this.state.spgage = 0;
        this.state.stageId = 0;
        this.state.continueCnt = 0;
        this.state.akebonoCnt = 0;
        this.state.shortFlg = false;

        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage) {
            game.stage.addChild(new AdvScene());
        }
    }

    destroy(options) {
        if (this.introTl) {
            this.introTl.kill();
            this.introTl = null;
        }

        if (this.startBtn) {
            this.startBtn.off("pointerup", this._onStartUp);
        }
        if (this.twitterBtn) {
            this.twitterBtn.off("pointerup", this._onTweetUp);
        }
        if (this.staffrollBtn) {
            this.staffrollBtn.off("pointerup", this._onStaffrollUp);
        }

        if (this.staffrollPanel && this.staffrollPanel.parent) {
            this.staffrollPanel.parent.removeChild(this.staffrollPanel);
        }
        this.staffrollPanel = null;

        super.destroy(options);
    }
}

export default TitleScene;
