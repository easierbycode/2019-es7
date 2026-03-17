import { RESOURCE_PATHS, GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { globals } from "../globals.js";

var EDITOR_PLAY_RECIPE_KEY = "__editorPhaserRecipe__";
var EDITOR_PLAY_STAGE_KEY = "__editorPhaserStageId__";
var FIREBASE_LEVELS_PATH = "levels";

function readLevelParam() {
    if (typeof window === "undefined") {
        return null;
    }
    try {
        var name = new URLSearchParams(window.location.search).get("level");
        return name ? name.replace(/[.#$/\[\]]/g, "_").trim() : null;
    } catch (e) {
        return null;
    }
}

function fetchFirebaseLevel(levelName) {
    if (typeof firebase === "undefined" || !firebase.database) {
        return Promise.reject(new Error("Firebase not available"));
    }

    var db;
    if (firebase.apps && firebase.apps.length > 0) {
        db = firebase.database();
    } else if (window.firebaseConfig || window.__FIREBASE_CONFIG__) {
        firebase.initializeApp(window.firebaseConfig || window.__FIREBASE_CONFIG__);
        db = firebase.database();
    } else {
        return Promise.reject(new Error("No Firebase config"));
    }

    return db.ref(FIREBASE_LEVELS_PATH + "/" + levelName).once("value").then(function (snapshot) {
        var data = snapshot.val();
        if (!data || !data.enemylist) {
            return Promise.reject(new Error("Level \"" + levelName + "\" not found"));
        }
        return data;
    });
}

function parseStageId(value) {
    var stageId = Number(value);
    if (!Number.isFinite(stageId)) {
        return 0;
    }

    return Math.max(0, Math.min(4, Math.floor(stageId)));
}

function readEditorPlayRequest() {
    if (typeof window === "undefined") {
        return null;
    }

    var params;
    try {
        params = new URLSearchParams(window.location.search);
    } catch (error) {
        return null;
    }

    if (params.get("editorPlay") !== "1") {
        return null;
    }

    var recipeText = null;
    try {
        recipeText = localStorage.getItem(EDITOR_PLAY_RECIPE_KEY);
    } catch (error) {}

    if (!recipeText) {
        return null;
    }

    try {
        return {
            recipe: JSON.parse(recipeText),
            stageId: parseStageId(
                params.get("stage")
                || localStorage.getItem(EDITOR_PLAY_STAGE_KEY)
                || 0
            ),
        };
    } catch (error) {
        return null;
    }
}

function primeGameStateForStage(recipe, stageId) {
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
    gameState.stageId = parseStageId(stageId);
    gameState.continueCnt = 0;
    gameState.akebonoCnt = 0;
    gameState.shortFlg = false;
}

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    preload() {
        var cx = GAME_DIMENSIONS.CENTER_X;
        var cy = GAME_DIMENSIONS.CENTER_Y;

        this.loadingBg = null;
        this.loadingG = null;
        this.loadingFrameIndex = 0;

        var self = this;

        function ensureLoadingPreview() {
            if (self.loadingBg || !self.textures.exists("loading_bg") || !self.textures.exists("loading0")) {
                return;
            }

            self.loadingBg = self.add.image(cx, cy, "loading_bg");
            self.loadingBg.setAlpha(0.09);

            self.loadingG = self.add.image(cx, cy, "loading0");

            self.time.addEvent({
                delay: 120,
                loop: true,
                callback: function () {
                    if (!self.loadingG) {
                        return;
                    }

                    self.loadingFrameIndex = (self.loadingFrameIndex + 1) % 3;
                    self.loadingG.setTexture("loading" + String(self.loadingFrameIndex));

                    if (self.loadingBg) {
                        self.loadingBg.flipX = !self.loadingBg.flipX;
                    }
                },
            });
        }

        // Auto-hide audio load errors after 6.7s
        // Phaser may render "ERR:" text on canvas or add DOM elements
        this.load.on("loaderror", function (file) {
            console.warn("Load error:", file.key, file.src);
            setTimeout(function () {
                // Remove any Phaser-created text objects showing errors
                if (self.children && self.children.list) {
                    var children = self.children.list.slice();
                    for (var e = 0; e < children.length; e++) {
                        var child = children[e];
                        if (child && child.type === "Text" && child.text && child.text.indexOf("ERR:") !== -1) {
                            child.destroy();
                        }
                    }
                }
            }, 6700);
        });

        this.load.on("filecomplete-image-loading_bg", ensureLoadingPreview);
        this.load.on("filecomplete-image-loading0", ensureLoadingPreview);

        this.load.on("loaderror", function (file) {
            console.error("LOAD ERROR:", file.key, file.type, file.src || file.url);
            // Show visible error on screen for Cordova debugging
            var el = document.getElementById("loadError");
            if (!el) {
                el = document.createElement("div");
                el.id = "loadError";
                el.style.cssText = "position:fixed;top:0;left:0;right:0;background:red;color:white;font:12px monospace;padding:4px;z-index:9999;max-height:30vh;overflow:auto;";
                document.body.appendChild(el);
            }
            el.textContent += "ERR: " + file.key + " (" + file.type + ") " + (file.src || file.url || "") + "\n";
        });

        this.load.on("complete", function () {
            if (self.loadingG) {
                self.loadingG.destroy();
                self.loadingG = null;
            }
            if (self.loadingBg) {
                self.loadingBg.destroy();
                self.loadingBg = null;
            }

            // Debug: log atlas texture status
            var atlasKeys = ["title_ui", "game_ui", "game_asset"];
            for (var a = 0; a < atlasKeys.length; a++) {
                var k = atlasKeys[a];
                var tex = self.textures.exists(k) ? self.textures.get(k) : null;
                if (tex) {
                    var src = tex.source && tex.source[0];
                    console.log("ATLAS " + k + ": frames=" + tex.getFrameNames().length +
                        " img=" + (src && src.image ? src.image.width + "x" + src.image.height : "none") +
                        " src=" + (src && src.image ? src.image.src : "none"));
                } else {
                    console.warn("ATLAS " + k + ": NOT FOUND in textures");
                }
            }
        });

        this.load.atlas("title_ui", "assets/img/title_ui.png", "assets/title_ui.json");
        this.load.atlas("game_ui", "assets/img/game_ui.png", "assets/game_ui.json");
        this.load.atlas("game_asset", "assets/img/game_asset.png", "assets/game_asset.json");

        this.load.json("recipe", "assets/game.json");

        this.load.image("title_bg", "assets/img/title_bg.jpg");
        for (var i = 0; i < 5; i++) {
            this.load.image("stage_loop" + i, "assets/img/stage/stage_loop" + i + ".png");
            this.load.image("stage_end" + i, "assets/img/stage/stage_end" + i + ".png");
        }

        this.load.image("loading_bg", "assets/img/loading/loading_bg.png");
        this.load.image("loading0", "assets/img/loading/loading0.gif");
        this.load.image("loading1", "assets/img/loading/loading1.gif");
        this.load.image("loading2", "assets/img/loading/loading2.gif");

        if (!gameState.lowModeFlg) {
            var soundKeys = Object.keys(RESOURCE_PATHS);
            for (var s = 0; s < soundKeys.length; s++) {
                var key = soundKeys[s];
                var path = RESOURCE_PATHS[key];
                if (path.indexOf(".mp3") > 0) {
                    this.load.audio(key, path);
                }
            }
        }
    }

    create() {
        var self = this;
        var levelName = readLevelParam();

        if (levelName) {
            this._loadFirebaseLevel(levelName);
            return;
        }

        this._finishBoot();
    }

    _loadFirebaseLevel(levelName) {
        var self = this;
        var game = this.game;
        fetchFirebaseLevel(levelName).then(function (data) {
            var baseRecipe = self.cache.json.get("recipe") || {};
            var stageKey = data.stageKey || "stage0";
            baseRecipe[stageKey] = { enemylist: data.enemylist };

            if (data.enemyData) {
                baseRecipe.enemyData = data.enemyData;
            }

            gameState._phaserRecipe = baseRecipe;

            var stageId = parseStageId(stageKey.replace("stage", ""));
            primeGameStateForStage(baseRecipe, stageId);

            setTimeout(function () {
                game.scene.stop("BootScene");
                game.scene.start("PhaserGameScene");
            }, 50);
        }).catch(function (err) {
            console.warn("Firebase level load failed:", err);
            self._finishBoot();
        });
    }

    _finishBoot() {
        var editorPlay = readEditorPlayRequest();
        var recipe = editorPlay && editorPlay.recipe ? editorPlay.recipe : this.cache.json.get("recipe");
        if (recipe) {
            gameState._phaserRecipe = recipe;
        }

        var nextSceneKey = "PhaserTitleScene";
        if (editorPlay && recipe) {
            primeGameStateForStage(recipe, editorPlay.stageId);
            nextSceneKey = "PhaserGameScene";
        }

        // DEBUG: skip to ending scene for testing
        var debugScene = null;
        try { debugScene = new URLSearchParams(window.location.search).get("scene"); } catch(e) {}
        if (debugScene) {
            if (recipe) {
                gameState.score = 12345;
                gameState.highScore = 10000;
                gameState.maxCombo = 42;
                gameState.continueCnt = 1;
            }
            nextSceneKey = debugScene;
        }

        // Phaser 4 RC6: the scene-level plugin (this.scene.start) and
        // this.time.delayedCall do not work reliably from create().
        // Use the game-level scene manager via setTimeout instead.
        var game = this.game;
        setTimeout(function () {
            game.scene.stop("BootScene");
            game.scene.start(nextSceneKey);
        }, 50);
    }
}

export default BootScene;
