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

function frameTexture(frameName) {
    try {
        return PIXI.Texture.fromFrame(frameName);
    } catch (error) {
        return PIXI.Texture.WHITE;
    }
}

function resourceTexture(resourceKey) {
    const resources = globals.resources;
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

function formatScore(score) {
    const safe = Number.isFinite(Number(score)) ? Number(score) : 0;
    return String(Math.max(0, Math.floor(safe))).padStart(8, "0");
}

class UiButton extends PIXI.Sprite {
    constructor(defaultFrame, overFrame, downFrame, options = {}) {
        super(frameTexture(defaultFrame));

        this.textureDefault = frameTexture(defaultFrame);
        this.textureOver = frameTexture(overFrame || defaultFrame);
        this.textureDown = frameTexture(downFrame || defaultFrame);
        this.anchor.set(options.anchorX || 0, options.anchorY || 0);
        this.interactive = true;
        this.buttonMode = true;

        this.playOverSound = options.playOverSound !== false;
        this.playUpSound = options.playUpSound !== false;
        this.onPress = typeof options.onPress === "function" ? options.onPress : function noop() {};

        this.on("pointerover", this.handleOver, this);
        this.on("pointerout", this.handleOut, this);
        this.on("pointerdown", this.handleDown, this);
        this.on("pointerupoutside", this.handleOut, this);
        this.on("pointerup", this.handleUp, this);
    }

    handleOver() {
        if (this.playOverSound) {
            playSound("se_over");
        }
        this.texture = this.textureOver;
    }

    handleOut() {
        this.texture = this.textureDefault;
    }

    handleDown() {
        this.texture = this.textureDown;
    }

    handleUp() {
        if (this.playUpSound) {
            playSound("se_cursor");
        }
        this.texture = this.textureDefault;
        this.onPress();
    }

    destroy(options) {
        this.removeAllListeners();
        super.destroy(options);
    }
}

class StartButton extends PIXI.Container {
    constructor(onStart) {
        super();

        this.onStart = typeof onStart === "function" ? onStart : function noop() {};
        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = new PIXI.Rectangle(0, 50, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT - 170);

        this.img = new PIXI.Sprite(frameTexture("titleStartText.gif"));
        this.img.anchor.set(0.5);
        this.img.x = GAME_DIMENSIONS.CENTER_X;
        this.img.y = 330;

        this.flashCover = new PIXI.Graphics();
        this.flashCover.beginFill(0xFFFFFF, 1);
        this.flashCover.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT - 120);
        this.flashCover.endFill();
        this.flashCover.alpha = 0;

        this.addChild(this.img);
        this.addChild(this.flashCover);

        this.pulseTl = new TimelineMax({
            repeat: -1,
            yoyo: true,
        });
        this.pulseTl.to(this.img, 0.3, {
            delay: 0.1,
            alpha: 0,
        }).to(this.img, 0.8, {
            alpha: 1,
        });

        this.on("pointerover", this.handleOver, this);
        this.on("pointerout", this.handleOut, this);
        this.on("pointerdown", this.handleDown, this);
        this.on("pointerupoutside", this.handleOut, this);
        this.on("pointerup", this.handleUp, this);
    }

    handleOver() {
        this.img.scale.set(1.05, 1.05);
    }

    handleOut() {
        this.img.scale.set(1, 1);
    }

    handleDown() {}

    handleUp() {
        playSound("se_decision");
        this.flash();
        this.onStart();
    }

    flash() {
        TweenMax.killTweensOf(this.flashCover);
        this.flashCover.alpha = 0.3;
        TweenMax.to(this.flashCover, 1.5, {
            alpha: 0,
        });
    }

    destroy(options) {
        this.removeAllListeners();
        if (this.pulseTl) {
            this.pulseTl.kill();
            this.pulseTl = null;
        }
        super.destroy(options);
    }
}

class StaffrollPanel extends PIXI.Container {
    constructor() {
        super();

        this.interactive = true;

        this.bg = new PIXI.Graphics();
        this.bg.beginFill(0x000000, 0.9);
        this.bg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.bg.endFill();
        this.addChild(this.bg);

        this.panelBg = new PIXI.Graphics();
        this.panelBg.beginFill(0x464646, 0.8);
        this.panelBg.drawRoundedRect(12, 72, GAME_DIMENSIONS.WIDTH - 24, GAME_DIMENSIONS.HEIGHT - 120, 8);
        this.panelBg.endFill();
        this.addChild(this.panelBg);

        const panelTexture = frameTexture("staffrollName.gif");
        this.panel = new PIXI.Sprite(panelTexture);
        this.panel.x = 15;
        this.panel.y = 90;
        this.addChild(this.panel);

        this.closeBtn = new UiButton("staffrollCloseBtn.gif", "staffrollCloseBtn.gif", "staffrollCloseBtn.gif", {
            playOverSound: true,
            playUpSound: true,
            onPress: this.close.bind(this),
            anchorX: 0.5,
            anchorY: 0.5,
        });
        this.closeBtn.x = GAME_DIMENSIONS.WIDTH - this.closeBtn.width / 2 - 12;
        this.closeBtn.y = 102;
        this.addChild(this.closeBtn);

        this.addLinkButton("staffrollTwitterBtn.gif", 165, 118, "https://twitter.com/takaNakayama");
        this.addLinkButton("staffrollTwitterBtn.gif", 131, 276, "https://twitter.com/bengasu");
        this.addLinkButton("staffrollTwitterBtn.gif", 178, 304, "https://twitter.com/rereibara");
        this.addLinkButton("staffrollLinkBtn.gif", 153, 329, "https://magazine.jp.square-enix.com/biggangan/introduction/highscoregirl/");
        this.addLinkButton("staffrollLinkBtn.gif", 161, 355, "http://hi-score-girl.com/");
    }

    addLinkButton(frameName, x, y, url) {
        const button = new UiButton(frameName, frameName, frameName, {
            playOverSound: true,
            playUpSound: true,
            onPress: () => openUrl(url),
        });

        button.on("pointerover", function onTintOver() {
            this.tint = 0xAAAAAA;
        });
        button.on("pointerout", function onTintOut() {
            this.tint = 0xFFFFFF;
        });

        button.x = x;
        button.y = y;
        this.panel.addChild(button);
    }

    open() {
        if (this.tl) {
            this.tl.kill();
        }

        this.bg.alpha = 0;
        this.panelBg.scale.y = 0;
        this.panel.y = this.panelBg.y + this.panel.height;
        this.closeBtn.alpha = 0;
        this.closeBtn.rotation = Math.PI * 2;
        this.closeBtn.scale.set(2, 2);

        this.tl = new TimelineMax();
        this.tl.to(this.bg, 0.2, { alpha: 1 });
        this.tl.to(this.panelBg.scale, 1.0, {
            y: 1,
            ease: Elastic.easeOut,
        }, "-=0.05");
        this.tl.to(this.panel, 1.0, {
            y: 90,
            ease: Quint.easeOut,
        }, "-=0.8");
        this.tl.to(this.closeBtn, 0.6, {
            rotation: 0,
            alpha: 1,
        }, "-=0.5");
        this.tl.to(this.closeBtn.scale, 0.6, {
            x: 1,
            y: 1,
        }, "-=0.6");
    }

    close() {
        if (this.tl) {
            this.tl.kill();
        }

        this.tl = new TimelineMax({
            onComplete: () => {
                if (this.parent) {
                    this.parent.removeChild(this);
                }
            },
        });
        this.tl.to(this.panel, 0.4, {
            y: this.panelBg.y + this.panel.height,
            ease: Quint.easeIn,
        });
        this.tl.to(this.panelBg.scale, 0.5, {
            y: 0,
            ease: Quint.easeOut,
        }, "-=0.15");
        this.tl.to(this.bg, 0.2, {
            alpha: 0,
        }, "-=0.2");
    }

    destroy(options) {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }
        super.destroy(options);
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
    }

    loop() {
        super.loop();

        if (this.bg) {
            this.bg.tilePosition.x += 0.5;
        }
    }

    run() {
        this.resources = globals.resources;

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

        this.startBtn = new StartButton(this.titleStart.bind(this));
        this.startBtn.interactive = false;
        this.startBtn.buttonMode = false;
        this.startBtn.alpha = 0;
        this.addChild(this.startBtn);

        this.copyright = new PIXI.Sprite(frameTexture("titleCopyright.gif"));
        this.copyright.x = 0;
        this.copyright.y = GAME_DIMENSIONS.HEIGHT - this.copyright.height - 6;
        this.addChild(this.copyright);

        this.scoreTitleTxt = new PIXI.Sprite(frameTexture("hiScoreTxt.gif"));
        this.scoreTitleTxt.x = 32;
        this.scoreTitleTxt.y = this.copyright.y - 66;
        this.addChild(this.scoreTitleTxt);

        this.bigNumTxt = new PIXI.Text(formatScore(this.state.highScore || 0), {
            fontFamily: "monospace",
            fontSize: 18,
            fontWeight: "bold",
            fill: 0xFFFFFF,
            letterSpacing: 1,
        });
        this.bigNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 3;
        this.bigNumTxt.y = this.scoreTitleTxt.y - 2;
        this.addChild(this.bigNumTxt);

        this.twitterBtn = new UiButton("twitterBtn0.gif", "twitterBtn1.gif", "twitterBtn2.gif", {
            onPress: this.tweet.bind(this),
            anchorX: 0.5,
            anchorY: 0.5,
        });
        this.twitterBtn.x = GAME_DIMENSIONS.CENTER_X;
        this.twitterBtn.y = this.copyright.y - this.twitterBtn.height / 2 - 14;
        this.addChild(this.twitterBtn);

        this.howtoBtn = new UiButton("howtoBtn0.gif", "howtoBtn1.gif", "howtoBtn2.gif", {
            onPress: this.openHowto.bind(this),
        });
        this.howtoBtn.x = 15;
        this.howtoBtn.y = 10;
        this.howtoBtn.scale.y = 0;
        this.addChild(this.howtoBtn);

        this.staffrollBtn = new UiButton("staffrollBtn0.gif", "staffrollBtn1.gif", "staffrollBtn2.gif", {
            onPress: this.showStaffroll.bind(this),
        });
        this.staffrollBtn.x = GAME_DIMENSIONS.WIDTH - this.staffrollBtn.width - 15;
        this.staffrollBtn.y = 10;
        this.staffrollBtn.scale.y = 0;
        this.addChild(this.staffrollBtn);

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

    openHowto() {
        if (typeof window !== "undefined" && typeof window.howtoModalOpen === "function") {
            window.howtoModalOpen();
        }
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
            this.startBtn.destroy({ children: true });
            this.startBtn = null;
        }

        if (this.staffrollPanel) {
            this.staffrollPanel.destroy({ children: true });
            this.staffrollPanel = null;
        }

        super.destroy(options);
    }
}

export default TitleScene;
