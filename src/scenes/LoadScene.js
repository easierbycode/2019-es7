import { BaseScene } from "./BaseScene.js";
import { TitleScene } from "./TitleScene.js";
import {
    BASE_PATH,
    LANG,
    RESOURCE_PATHS,
    SCENE_NAMES,
    GAME_DIMENSIONS,
} from "../constants.js";
import { gameState } from "../gameState.js";
import { globals } from "../globals.js";
import { pauseAll, resumeAll, setInitialVolumes } from "../soundManager.js";
import { ModeButton } from "../ui/ModeButton.js";
import { RecommendButton } from "../ui/RecommendButton.js";

function createLoader() {
    return PIXI.loaders && PIXI.loaders.Loader ? new PIXI.loaders.Loader() : new PIXI.Loader();
}

function resolveBaseUrl() {
    let baseUrl = BASE_PATH;

    if (typeof window !== "undefined" && typeof window.baseUrl === "string") {
        baseUrl = window.baseUrl;
    }

    if (typeof document !== "undefined") {
        const baseUrlNode = document.getElementById("baseUrl");
        if (baseUrlNode && typeof baseUrlNode.innerHTML === "string" && baseUrlNode.innerHTML.trim()) {
            baseUrl = baseUrlNode.innerHTML.trim();
        }
    }

    if (baseUrl.length > 0 && baseUrl.charAt(baseUrl.length - 1) !== "/") {
        baseUrl += "/";
    }

    return baseUrl;
}

function log(message) {
    if (typeof console !== "undefined" && console.log) {
        console.log(message);
    }
}

export class LoadScene extends BaseScene {
    constructor() {
        super(SCENE_NAMES.LOAD);

        this.baseUrl = resolveBaseUrl();
        this.state = gameState;
        this.state.baseUrl = this.baseUrl;

        this.preloadLoader = null;
        this.resourceLoader = null;
        this.modeTitle = null;
        this.playPcBtn = null;
        this.playPcTxt = null;
        this.playSpBtn = null;
        this.playSpTxt = null;
        this.recommendBtn = null;
        this.recommendModal = null;
        this.recommendModalCloseBtn = null;
        this.loadingBgFlipCnt = 0;
        this.lowModeFlg = false;

        const loadingFrames = [
            PIXI.Texture.fromImage(this.baseUrl + "assets/img/loading/loading0.gif"),
            PIXI.Texture.fromImage(this.baseUrl + "assets/img/loading/loading1.gif"),
            PIXI.Texture.fromImage(this.baseUrl + "assets/img/loading/loading2.gif"),
        ];

        this.loadingG = new PIXI.extras.AnimatedSprite(loadingFrames);
        this.loadingG.x = GAME_DIMENSIONS.CENTER_X - 64;
        this.loadingG.y = GAME_DIMENSIONS.CENTER_Y - 64;
        this.loadingG.animationSpeed = 0.15;

        this.loadingTexture = PIXI.Texture.fromImage(this.baseUrl + "assets/img/loading/loading_bg.png");
        this.loadingBg = new PIXI.Sprite(this.loadingTexture);
        this.loadingBg.alpha = 0.09;

        this.onVisibilityChange = this.handleVisibilityChange.bind(this);
        this.loadHighScore();
    }

    loadHighScore() {
        if (typeof document === "undefined" || typeof document.cookie !== "string") {
            return;
        }

        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.indexOf("afc2019_highScore=") === 0) {
                const value = cookie.substring("afc2019_highScore=".length);
                this.state.highScore = value;
            }
        }
    }

    loop() {
        super.loop();

        this.loadingBgFlipCnt += 1;
        if (this.loadingBgFlipCnt % 6 === 0) {
            if (this.loadingBg.name === "ura") {
                this.loadingBg.name = "omote";
                this.loadingTexture.rotate = 0;
            } else {
                this.loadingBg.name = "ura";
                this.loadingTexture.rotate = 8;
            }
        }
    }

    run() {
        this.preloadLoader = createLoader();
        this.preloadLoader.add("title_ui", this.baseUrl + "assets/title_ui.json");
        this.preloadLoader.on("complete", this.onPreloadComplete.bind(this));
        this.preloadLoader.load();
    }

    onPreloadComplete(loader) {
        if (loader && typeof loader.destroy === "function") {
            loader.destroy();
        }

        this.modeTitle = new PIXI.Sprite(PIXI.Texture.fromFrame("modeSelectTxt.gif"));
        this.modeTitle.x = 44;
        this.modeTitle.y = 83;
        this.addChild(this.modeTitle);

        this.playPcBtn = new ModeButton("playBtnPc0.gif", "playBtnPc1.gif");
        this.playPcBtn.x = 44;
        this.playPcBtn.y = this.modeTitle.y + this.modeTitle.height + 40;
        this.addChild(this.playPcBtn);
        this.playPcBtn.on("pointerup", this.loadStart.bind(this, false));

        this.playPcTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("playBtnPcTxt.gif"));
        this.playPcTxt.x = 44;
        this.playPcTxt.y = this.playPcBtn.y + this.playPcBtn.height + 2;
        this.addChild(this.playPcTxt);

        this.playSpBtn = new ModeButton("playBtnSp0.gif", "playBtnSp1.gif");
        this.playSpBtn.x = 44;
        this.playSpBtn.y = this.playPcTxt.y + 20;
        this.addChild(this.playSpBtn);
        this.playSpBtn.on("pointerup", this.loadStart.bind(this, true));

        this.playSpTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("playBtnSpTxt.gif"));
        this.playSpTxt.x = 44;
        this.playSpTxt.y = this.playSpBtn.y + this.playSpBtn.height + 2;
        this.addChild(this.playSpTxt);

        const suffix = LANG === "ja" ? "" : "_en";
        this.recommendBtn = new RecommendButton(
            "recommendBtn0" + suffix + ".gif",
            "recommendBtn1" + suffix + ".gif"
        );
        this.recommendBtn.x = 40;
        this.recommendBtn.y = this.playSpTxt.y + 100;
        this.addChild(this.recommendBtn);
        this.recommendBtn.on("pointerup", this.recommendModalOpen.bind(this));

        const modalTexture = PIXI.Texture.fromFrame("recommendModal" + suffix + ".gif");
        this.recommendModal = new PIXI.Sprite(modalTexture);
        this.recommendModal.x = this.recommendModal.width / 2 + 7;
        this.recommendModal.y = this.recommendModal.height / 2 + 26;
        this.recommendModal.interactive = true;
        this.recommendModal.visible = false;
        this.recommendModal.anchor.set(0.5);
        this.recommendModal.scale.set(0, 0);
        this.addChild(this.recommendModal);

        this.recommendModalCloseBtn = new PIXI.Sprite(PIXI.Texture.fromFrame("recommendModalCloseBtn.gif"));
        this.recommendModalCloseBtn.x = this.recommendModal.width / 2 - this.recommendModalCloseBtn.width - 2;
        this.recommendModalCloseBtn.y = -this.recommendModal.height / 2 + 2;
        this.recommendModalCloseBtn.interactive = true;
        this.recommendModalCloseBtn.buttonMode = true;
        this.recommendModalCloseBtn.on("pointerup", this.recommendModalClose.bind(this));
        this.recommendModal.addChild(this.recommendModalCloseBtn);
    }

    recommendModalOpen() {
        if (!this.recommendModal) {
            return;
        }

        this.recommendModal.visible = true;
        this.recommendModal.scale.x = 0.05;

        TweenMax.to(this.recommendModal.scale, 0.15, {
            y: 1,
            delay: 0,
            ease: Quint.easeOut,
        });

        TweenMax.to(this.recommendModal.scale, 0.15, {
            x: 1,
            delay: 0.12,
            ease: Back.easeOut,
        });
    }

    recommendModalClose() {
        if (!this.recommendModal) {
            return;
        }

        this.recommendModal.visible = false;
        this.recommendModal.scale.set(0, 0);
    }

    loadStart(lowModeFlg) {
        if (typeof document !== "undefined") {
            // Prefer Cordova fullscreen plugin (Android immersive sticky mode)
            if (window.AndroidFullScreen) {
                window.AndroidFullScreen.immersiveMode(
                    function () {
                        log("Immersive fullscreen enabled");
                        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                            window.screen.orientation.lock("portrait").catch(function () {});
                        }
                    },
                    function () { log("Immersive fullscreen not available"); }
                );
            } else if (window.cordova) {
                // Fallback for Cordova without the plugin: still attempt orientation lock
                if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                    window.screen.orientation.lock("portrait").catch(function () {});
                }
            } else {
                // Browser fullscreen — only attempt when NOT running inside Cordova
                // (Cordova handles fullscreen natively via config.xml preferences)
                const element = document.querySelector("#canvas canvas") || document.documentElement;
                const requestMethod = element.requestFullscreen
                    || element.webkitRequestFullscreen
                    || element.msRequestFullscreen;

                if (requestMethod) {
                    var promise = requestMethod.call(element, { navigationUI: "hide" });
                    if (promise && promise.then) {
                        promise.then(function () {
                            log("Fullscreen entered");
                            if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                                window.screen.orientation.lock("portrait").catch(function () {});
                            }
                        }).catch(function (error) {
                            log("Fullscreen request failed: " + error.message);
                        });
                    }
                }
            }
        }

        this.lowModeFlg = lowModeFlg;
        this.state.lowModeFlg = lowModeFlg;

        this.safeRemoveChild(this.modeTitle);
        this.safeRemoveChild(this.playPcBtn);
        this.safeRemoveChild(this.playSpBtn);
        this.safeRemoveChild(this.playPcTxt);
        this.safeRemoveChild(this.playSpTxt);
        this.safeRemoveChild(this.recommendModal);
        this.safeRemoveChild(this.recommendBtn);

        if (this.recommendModal && this.recommendModalCloseBtn) {
            this.recommendModal.removeChild(this.recommendModalCloseBtn);
        }

        this.addChild(this.loadingBg);
        this.loadingG.play();
        this.addChild(this.loadingG);

        this.resourceLoader = createLoader();
        const resourceKeys = Object.keys(RESOURCE_PATHS);
        for (let i = 0; i < resourceKeys.length; i++) {
            const key = resourceKeys[i];
            const path = RESOURCE_PATHS[key];
            if (this.lowModeFlg && path.indexOf(".mp3") > 0) {
                continue;
            }
            this.resourceLoader.add(key, this.baseUrl + path);
        }

        this.resourceLoader.on("progress", this.loadProgress.bind(this));
        this.resourceLoader.on("complete", this.loadComplete.bind(this));
        this.resourceLoader.load();
    }

    safeRemoveChild(child) {
        if (child && child.parent === this) {
            this.removeChild(child);
        }
    }

    loadProgress(loader) {
        log("Resource Loading:" + loader.progress + "%");
    }

    loadComplete(loader, resources) {
        if (loader && typeof loader.destroy === "function") {
            loader.destroy();
        }

        globals.resources = resources;

        if (!this.lowModeFlg) {
            setInitialVolumes();
            if (typeof document !== "undefined") {
                document.addEventListener("visibilitychange", this.onVisibilityChange, false);
            }
        }

        TweenMax.to([this.loadingG, this.loadingBg], 0.2, {
            alpha: 0,
            onComplete: this.removeSceneFromStage.bind(this),
        });
    }

    handleVisibilityChange() {
        if (typeof document === "undefined") {
            return;
        }

        if (document.visibilityState === "hidden") {
            pauseAll();
        } else if (document.visibilityState === "visible") {
            resumeAll();
        }
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

        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.onVisibilityChange);
        }

        if (this.loadingG) {
            this.loadingG.destroy(true);
            this.loadingG = null;
        }

        if (this.loadingBg) {
            this.loadingBg.destroy(true);
            this.loadingBg = null;
        }

        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage) {
            game.stage.addChild(new TitleScene());
        }
    }

    destroy(options) {
        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.onVisibilityChange);
        }

        if (this.resourceLoader) {
            this.resourceLoader.reset();
            this.resourceLoader = null;
        }

        if (this.preloadLoader) {
            this.preloadLoader.reset();
            this.preloadLoader = null;
        }

        super.destroy(options);
    }
}

export default LoadScene;
