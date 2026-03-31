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

function readStageParam() {
    if (typeof window === "undefined") {
        return null;
    }
    try {
        return new URLSearchParams(window.location.search).get("stage");
    } catch (e) {
        return null;
    }
}

function readBossRushParam() {
    if (typeof window === "undefined") {
        return false;
    }
    try {
        return new URLSearchParams(window.location.search).get("bossRush") === "1";
    } catch (e) {
        return false;
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

var CUSTOM_AUDIO_DB_NAME = "editorCustomAudio";
var CUSTOM_AUDIO_STORE = "customAudio";

function openCustomAudioDB() {
    if (typeof indexedDB === "undefined") {
        return Promise.reject(new Error("IndexedDB not available"));
    }
    return new Promise(function (resolve, reject) {
        var req = indexedDB.open(CUSTOM_AUDIO_DB_NAME, 1);
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(CUSTOM_AUDIO_STORE)) {
                db.createObjectStore(CUSTOM_AUDIO_STORE);
            }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(e.target.error); };
    });
}

function getAllCustomAudioEntries() {
    return openCustomAudioDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(CUSTOM_AUDIO_STORE, "readonly");
            var store = tx.objectStore(CUSTOM_AUDIO_STORE);
            var entries = {};
            var cursorReq = store.openCursor();
            cursorReq.onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    entries[cursor.key] = cursor.value;
                    cursor.continue();
                } else {
                    resolve(entries);
                }
            };
            cursorReq.onerror = function (e) { reject(e.target.error); };
        });
    });
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

        // Track failed audio files for retry
        var failedAudioFiles = [];

        // Auto-hide audio load errors after 6.7s
        // Phaser may render "ERR:" text on canvas or add DOM elements
        this.load.on("loaderror", function (file) {
            console.warn("Load error:", file.key, file.src);
            if (file.type === "audio") {
                failedAudioFiles.push({ key: file.key, src: file.src || file.url });
            }
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

            // Retry failed audio files — on iOS the AudioContext may have been
            // suspended during the first load attempt.  By the time "complete"
            // fires, user interaction has likely unlocked it.
            if (failedAudioFiles.length > 0) {
                console.log("Retrying " + failedAudioFiles.length + " failed audio file(s)…");

                // Ensure the AudioContext is running before retrying
                var actx = window.__phaserAudioContext;
                if (actx && (actx.state === "suspended" || actx.state === "interrupted")) {
                    actx.resume().catch(function () {});
                }

                var retryFiles = failedAudioFiles.splice(0);
                for (var r = 0; r < retryFiles.length; r++) {
                    self.load.audio(retryFiles[r].key, retryFiles[r].src);
                }
                self.load.start();
            }

            // Auto-hide the #loadError div after 6.7s
            var loadErrorEl = document.getElementById("loadError");
            if (loadErrorEl) {
                setTimeout(function () {
                    loadErrorEl.style.display = "none";
                }, 6700);
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

        // Use editor-repacked atlas files (_ prefix) when available, otherwise originals
        var ea = window.__editorAtlases || {};
        this.load.atlas("title_ui",
            ea.title_ui ? "assets/img/_title_ui.png" : "assets/img/title_ui.png",
            ea.title_ui ? "assets/_title_ui.json" : "assets/title_ui.json");
        this.load.atlas("game_ui",
            ea.game_ui ? "assets/img/_game_ui.png" : "assets/img/game_ui.png",
            ea.game_ui ? "assets/_game_ui.json" : "assets/game_ui.json");
        this.load.atlas("game_asset",
            ea.game_asset ? "assets/img/_game_asset.png" : "assets/img/game_asset.png",
            ea.game_asset ? "assets/_game_asset.json" : "assets/game_asset.json");
        this.load.spritesheet("cyber-liberty", "https://easierbycode.com/assets/spritesheets/cyber-liberty.png", { frameWidth: 32, frameHeight: 32 });

        this.load.json("recipe", "assets/game.json");

        this.load.image("title_bg", "assets/img/title_bg.jpg");
        var stageLoopPaths = [
            "assets/img/stage/stage_loop3.png",
            "assets/img/stage/stage_loop3.png",
            "assets/img/stage/stage_loop3.png",
            "assets/img/stage/stage_loop3.png",
            "assets/img/stage/stage_loop4.png",
        ];
        var stageEndPaths = [
            "assets/img/stage/stage_end3.png",
            "assets/img/stage/stage_end3.png",
            "assets/img/stage/stage_end3.png",
            "assets/img/stage/stage_end3.png",
            "assets/img/stage/stage_end4.png",
        ];
        for (var i = 0; i < 5; i++) {
            this.load.image("stage_loop" + i, stageLoopPaths[i]);
            this.load.image("stage_end" + i, stageEndPaths[i]);
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

        // Editor play requests use localStorage recipe, skip Firebase
        var editorPlay = readEditorPlayRequest();
        if (editorPlay) {
            this._finishBoot();
            return;
        }

        var explicitLevel = readLevelParam();
        var levelName = explicitLevel || "foo";
        this._loadFirebaseLevel(levelName, !explicitLevel);
    }

    _loadFirebaseLevel(levelName, showTitle) {
        var self = this;
        var game = this.game;
        var stageParam = readStageParam();

        fetchFirebaseLevel(levelName).then(function (data) {
            var baseRecipe = self.cache.json.get("recipe") || {};
            var localEnemyData = baseRecipe.enemyData ? JSON.parse(JSON.stringify(baseRecipe.enemyData)) : {};
            var stageKey = data.stageKey || "stage0";
            baseRecipe[stageKey] = { enemylist: data.enemylist };

            function finishLevelLoad() {
                if (data.enemyData) {
                    // Merge Firebase enemy data, but keep local textures when Firebase
                    // textures don't exist in the loaded atlas (cross-game level support)
                    var merged = JSON.parse(JSON.stringify(data.enemyData));
                    try {
                        var atlas = self.textures.get("game_asset");
                        var atlasFrames = atlas && atlas.frames ? atlas.frames : null;
                        if (atlasFrames) {
                            for (var ek in merged) {
                                var fbTextures = merged[ek] && merged[ek].texture ? merged[ek].texture : [];
                                if (fbTextures.length > 0 && !atlasFrames[fbTextures[0]]) {
                                    var localEnemy = localEnemyData[ek];
                                    if (localEnemy && localEnemy.texture && localEnemy.texture.length > 0) {
                                        merged[ek].texture = localEnemy.texture;
                                    }
                                    var projKey = merged[ek].projectileData ? "projectileData" : (merged[ek].bulletData ? "bulletData" : null);
                                    var localProjKey = localEnemy ? (localEnemy.projectileData ? "projectileData" : (localEnemy.bulletData ? "bulletData" : null)) : null;
                                    if (projKey && localProjKey && merged[ek][projKey] && merged[ek][projKey].texture) {
                                        var fbProjTex = merged[ek][projKey].texture;
                                        if (fbProjTex.length > 0 && !atlasFrames[fbProjTex[0]] && localEnemy[localProjKey] && localEnemy[localProjKey].texture) {
                                            merged[ek][projKey].texture = localEnemy[localProjKey].texture;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (texErr) {
                        console.warn("Texture resolution failed, using Firebase enemy data as-is:", texErr);
                    }
                    baseRecipe.enemyData = merged;
                }

                if (data.bossData) {
                    // Merge Firebase boss data, keeping local anim textures when
                    // Firebase textures don't exist in the loaded atlas
                    var mergedBoss = JSON.parse(JSON.stringify(data.bossData));
                    var localBossData = baseRecipe.bossData ? JSON.parse(JSON.stringify(baseRecipe.bossData)) : {};
                    try {
                        var bossAtlas = self.textures.get("game_asset");
                        var bossAtlasFrames = bossAtlas && bossAtlas.frames ? bossAtlas.frames : null;
                        if (bossAtlasFrames) {
                            for (var bk in mergedBoss) {
                                var fb = mergedBoss[bk];
                                var lb = localBossData[bk];
                                if (fb && fb.anim) {
                                    for (var ak in fb.anim) {
                                        if (ak.startsWith('_')) continue;
                                        var fbAnim = fb.anim[ak];
                                        if (Array.isArray(fbAnim) && fbAnim.length > 0 && !bossAtlasFrames[fbAnim[0]]) {
                                            if (lb && lb.anim && lb.anim[ak]) {
                                                fb.anim[ak] = lb.anim[ak];
                                            }
                                        }
                                    }
                                }
                                if (fb && fb.bulletData && fb.bulletData.texture) {
                                    var fbBulletTex = fb.bulletData.texture;
                                    if (fbBulletTex.length > 0 && !bossAtlasFrames[fbBulletTex[0]]) {
                                        if (lb && lb.bulletData && lb.bulletData.texture) {
                                            fb.bulletData.texture = lb.bulletData.texture;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (bossTexErr) {
                        console.warn("Boss texture resolution failed, using Firebase boss data as-is:", bossTexErr);
                    }
                    baseRecipe.bossData = mergedBoss;
                }

                if (data.storyData) {
                    baseRecipe.storyData = data.storyData;
                }

                // Replace title_bg texture if Firebase provides a custom one
                if (data.titleBgDataURL) {
                    var titleImg = new Image();
                    titleImg.onload = function () {
                        try {
                            self.textures.remove("title_bg");
                            self.textures.addImage("title_bg", titleImg);
                        } catch (e) {
                            console.warn("Failed to load custom title_bg:", e);
                        }
                    };
                    titleImg.src = data.titleBgDataURL;
                }

                // Replace logo if Firebase provides a custom one
                if (data.logoDataURL) {
                    var logoImg = new Image();
                    logoImg.onload = function () {
                        try {
                            self.textures.addImage("custom_logo", logoImg);
                        } catch (e) {
                            console.warn("Failed to load custom logo:", e);
                        }
                    };
                    logoImg.src = data.logoDataURL;
                }

                // Replace subTitle if Firebase provides a custom one
                if (data.subTitleDataURL) {
                    var subTitleImg = new Image();
                    subTitleImg.onload = function () {
                        try {
                            self.textures.addImage("custom_subTitle", subTitleImg);
                        } catch (e) {
                            console.warn("Failed to load custom subTitle:", e);
                        }
                    };
                    subTitleImg.src = data.subTitleDataURL;
                }

                gameState._phaserRecipe = baseRecipe;

                var stageId = stageParam != null
                    ? parseStageId(stageParam)
                    : parseStageId(stageKey.replace("stage", ""));
                primeGameStateForStage(baseRecipe, stageId);
                if (readBossRushParam()) {
                    gameState.shortFlg = true;
                }

                var nextScene = showTitle ? "PhaserTitleScene" : "PhaserGameScene";
                self._loadCustomAudio(function () {
                    setTimeout(function () {
                        game.scene.stop("BootScene");
                        game.scene.start(nextScene);
                    }, 50);
                });
            }

            // If Firebase level includes atlas image + frames, merge with local atlas
            // into a single combined texture so both local (player/UI) and Firebase (enemy) frames work
            if (data.atlasImageDataURL && data.atlasFrames) {
                var fbImg = new Image();
                fbImg.onload = function () {
                    try {
                        // Get the local atlas source image
                        var localAtlas = self.textures.get("game_asset");
                        var localSource = localAtlas && localAtlas.source && localAtlas.source[0] ? localAtlas.source[0].image : null;
                        var localFrames = localAtlas ? localAtlas.frames : {};
                        if (!localSource) { finishLevelLoad(); return; }

                        // Create merged canvas: stack local image on top, Firebase image below
                        var mergedCanvas = document.createElement("canvas");
                        var localW = localSource.width, localH = localSource.height;
                        var fbW = fbImg.width, fbH = fbImg.height;
                        mergedCanvas.width = Math.max(localW, fbW);
                        mergedCanvas.height = localH + fbH;
                        var mctx = mergedCanvas.getContext("2d");
                        mctx.drawImage(localSource, 0, 0);
                        mctx.drawImage(fbImg, 0, localH);

                        // Build merged frame map: local frames stay as-is, Firebase frames offset by localH
                        var mergedFrameMap = {};
                        for (var lk in localFrames) {
                            if (lk === "__BASE") continue;
                            var lf = localFrames[lk];
                            if (lf && lf.cutX !== undefined) {
                                mergedFrameMap[lk] = { frame: { x: lf.cutX, y: lf.cutY, w: lf.cutWidth, h: lf.cutHeight } };
                            }
                        }
                        // Add Firebase frames with Y offset
                        for (var fname in data.atlasFrames) {
                            var decodedName = fname.replace(/\u2024/g, ".");
                            var fd = data.atlasFrames[fname];
                            if (fd && fd.frame) {
                                mergedFrameMap[decodedName] = {
                                    frame: { x: fd.frame.x, y: fd.frame.y + localH, w: fd.frame.w, h: fd.frame.h }
                                };
                            }
                        }

                        // Replace game_asset with merged atlas
                        self.textures.remove("game_asset");
                        self.textures.addAtlas("game_asset", mergedCanvas, { frames: mergedFrameMap });
                    } catch (atlasErr) {
                        console.warn("Failed to merge Firebase atlas:", atlasErr);
                    }
                    finishLevelLoad();
                };
                fbImg.onerror = function () {
                    console.warn("Firebase atlas image failed to load, using local");
                    finishLevelLoad();
                };
                fbImg.src = data.atlasImageDataURL;
            } else {
                finishLevelLoad();
            }
        }).catch(function (err) {
            console.warn("Firebase level load failed for '" + levelName + "':", err);
            self._finishBoot();
        });
    }

    _finishBoot() {
        var editorPlay = readEditorPlayRequest();
        var recipe = editorPlay && editorPlay.recipe ? editorPlay.recipe : this.cache.json.get("recipe");
        if (recipe) {
            gameState._phaserRecipe = recipe;
        }

        var stageParam = readStageParam();
        var bossRush = readBossRushParam();

        var nextSceneKey = "PhaserTitleScene";
        if (editorPlay && recipe) {
            primeGameStateForStage(recipe, editorPlay.stageId);
            if (bossRush) {
                gameState.shortFlg = true;
            }
            nextSceneKey = "PhaserGameScene";
        } else if (stageParam != null || bossRush) {
            primeGameStateForStage(recipe, stageParam != null ? stageParam : 0);
            if (bossRush) {
                gameState.shortFlg = true;
            }
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

        // Load custom audio overrides from IndexedDB before transitioning
        var self = this;
        this._loadCustomAudio(function () {
            // Phaser 4 RC6: the scene-level plugin (this.scene.start) and
            // this.time.delayedCall do not work reliably from create().
            // Use the game-level scene manager via setTimeout instead.
            var game = self.game;
            setTimeout(function () {
                game.scene.stop("BootScene");
                game.scene.start(nextSceneKey);
            }, 50);
        });
    }

    _loadCustomAudio(callback) {
        if (gameState.lowModeFlg) {
            callback();
            return;
        }

        var self = this;

        // Collect custom audio from all available sources, then load them
        self._collectCustomAudioEntries().then(function (entries) {
            var keys = Object.keys(entries);
            if (keys.length === 0) {
                callback();
                return;
            }

            console.log("Loading " + keys.length + " custom audio override(s)…");
            var blobURLs = [];

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var data = entries[key];

                // data may be a Blob (IndexedDB) or ArrayBuffer (Electron IPC)
                var blob = data instanceof Blob ? data : new Blob([data], { type: "audio/mpeg" });
                var url = URL.createObjectURL(blob);
                blobURLs.push(url);

                // Remove previously cached audio so Phaser re-decodes
                if (self.cache.audio.exists(key)) {
                    self.cache.audio.remove(key);
                }
                self.load.audio(key, url);
            }

            self.load.once("complete", function () {
                // Revoke blob URLs to free memory
                for (var j = 0; j < blobURLs.length; j++) {
                    URL.revokeObjectURL(blobURLs[j]);
                }
                callback();
            });

            self.load.start();
        }).catch(function (err) {
            console.warn("Custom audio load failed:", err);
            callback();
        });
    }

    _collectCustomAudioEntries() {
        var entries = {};

        // Source 1: IndexedDB (browser / level editor flow)
        var idbPromise = getAllCustomAudioEntries().then(function (idbEntries) {
            var keys = Object.keys(idbEntries);
            for (var i = 0; i < keys.length; i++) {
                entries[keys[i]] = idbEntries[keys[i]];
            }
        }).catch(function () {});

        // Source 2: Electron filesystem (AppImage / Steam)
        // Reads from <userData>/custom-audio/*.mp3 via preload bridge
        var electronPromise;
        if (typeof window !== "undefined" && window.electronAudio &&
            typeof window.electronAudio.loadCustomAudio === "function") {
            electronPromise = window.electronAudio.loadCustomAudio().then(function (diskEntries) {
                var keys = Object.keys(diskEntries);
                for (var i = 0; i < keys.length; i++) {
                    // Electron entries override IndexedDB (disk is authoritative)
                    entries[keys[i]] = diskEntries[keys[i]];
                }
            }).catch(function (err) {
                console.warn("Electron custom audio load failed:", err);
            });
        } else {
            electronPromise = Promise.resolve();
        }

        return Promise.all([idbPromise, electronPromise]).then(function () {
            return entries;
        });
    }
}

export default BootScene;
