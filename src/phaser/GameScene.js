// src/phaser/GameScene.js — slimmed coordinator
// All subsystem logic extracted to game-objects/, bosses/, effects/, ui/

import { BGM_INFO, GAME_DIMENSIONS, RESOURCE_PATHS } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { PLAYER_STATES } from "../enums/player-boss-states.js";
import { triggerHaptic } from "../haptics.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
} from "../highScoreUi.js";

// --- Game-objects ---
import {
    createPlayer,
    createDragArea,
    clampPlayerX,
    handleKeyboardInput,
    playerDamage as _playerDamage,
    playerDie as _playerDie,
    updateBarrier,
    collectItem as _collectItem,
} from "./game-objects/Player.js";
import {
    createEnemy as _createEnemy,
    enemyWave as _enemyWave,
    enemyShoot as _enemyShoot,
    enemyDie as _enemyDie,
    updateEnemy,
    animateEnemy,
} from "./game-objects/Enemy.js";
import {
    shootBullets,
    updatePlayerBullets,
} from "./game-objects/Bullet.js";
import {
    bossAdd as _bossAdd,
    _bossAlive,
    bossShootStart as _bossShootStart,
    bossShootStraight as _bossShootStraight,
    bossShootAimed as _bossShootAimed,
    bossShootBeam as _bossShootBeam,
    bossShootSpread as _bossShootSpread,
    bossShootRadial as _bossShootRadial,
    checkBossDanger as _checkBossDanger,
    bossDie as _bossDie,
    syncBossVisuals,
} from "./game-objects/Boss.js";

// --- Effects ---
import {
    showExplosion as _showExplosion,
    spExplosions as _spExplosions,
    showHitImpact as _showHitImpact,
    flashEnemyTint as _flashEnemyTint,
} from "./effects/index.js";
import { showAkebonoFinish as _showAkebonoFinish } from "./effects/AkebonoFinish.js";

// --- UI ---
import { showScorePopup as _showScorePopup } from "./ui/ScorePopup.js";

// --- Shadow ---
import { updateShadowPosition } from "./game-objects/Shadow.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

function recipeData() {
    return gameState._phaserRecipe || null;
}

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class PhaserGameScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserGameScene" });
    }

    // === Thin wrappers so boss-pattern modules can call scene.xxx() ===
    _bossAlive() { return _bossAlive(this); }
    bossShootStart() { _bossShootStart(this); }
    bossShootStraight(projData) { _bossShootStraight(this, projData); }
    bossShootAimed(projData) { _bossShootAimed(this, projData); }
    bossShootBeam(projData, degree) { _bossShootBeam(this, projData, degree); }
    bossShootSpread(projData, count, angleDeg) { _bossShootSpread(this, projData, count, angleDeg); }
    bossShootRadial(projData, count) { _bossShootRadial(this, projData, count); }
    checkBossDanger() { _checkBossDanger(this); }
    bossDie(boss) { _bossDie(this, boss); }
    bossAdd() { _bossAdd(this); }
    enemyDie(enemy, isSp) { _enemyDie(this, enemy, isSp); }
    showExplosion(x, y) { _showExplosion(this, x, y); }
    showHitImpact(x, y, isGuard) { _showHitImpact(this, x, y, isGuard); }
    flashEnemyTint(enemy) { _flashEnemyTint(this, enemy); }
    showAkebonoFinish() { _showAkebonoFinish(this); }
    showScorePopup(x, y, score, ratio) { _showScorePopup(this, x, y, score, ratio); }

    // =================================================================
    // create
    // =================================================================
    create() {
        this.recipe = recipeData();
        if (!this.recipe) {
            var game = this.game;
            setTimeout(function () {
                game.scene.stop("PhaserGameScene");
                game.scene.start("PhaserTitleScene");
            }, 50);
            return;
        }

        this.frameCnt = 0;
        this.waveCount = 0;
        this.waveInterval = 80;
        this.enemyWaveFlg = false;
        this.theWorldFlg = false;
        this.sceneSwitch = 0;
        this.bossActive = false;
        this.bossReached = false;
        this.bossTimerCountDown = 99;
        this.bossTimerFrameCnt = 0;
        this.bossTimerStartFlg = false;
        this.gameStarted = false;
        this.stageCleared = false;
        this.playerDead = false;
        this.bossEntering = false;

        this.scoreCount = gameState.score || 0;
        this.comboCount = 0;
        this.maxCombo = gameState.maxCombo || 0;
        this.comboTimeCnt = 0;
        this.spGauge = gameState.spgage || 0;
        this.spFired = false;
        this.spFiredDuringBoss = false;
        this.spReadyHapticPlayed = false;

        var stageId = gameState.stageId || 0;
        this.stageKey = "stage" + String(stageId);

        var enemyList = this.recipe[this.stageKey] ? this.recipe[this.stageKey].enemylist : [];
        this.stageEnemyPositionList = (enemyList || []).slice().reverse();

        this.stageBg = this.add.tileSprite(0, 0, GW, GH, "stage_loop" + stageId);
        this.stageBg.setOrigin(0, 0);

        this.stageEndBg = this.add.image(0, -GH, "stage_end" + stageId);
        this.stageEndBg.setOrigin(0, 0);
        this.stageEndBg.setVisible(false);

        this.unitGroup = this.add.group();
        this.bulletGroup = this.add.group();
        this.enemyBulletGroup = this.add.group();
        this.itemGroup = this.add.group();

        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.items = [];
        this.bulletIdCnt = 0;
        this.isDragging = false;
        this.dragPointerId = null;

        // --- Subsystem init ---
        createPlayer(this);
        createDragArea(this);
        this.createHUD();
        this.createCover();

        this.boss = null;
        this.bossSprite = null;
        this.bossHp = 0;
        this.bossMaxHp = 0;
        this.bossScore = 0;
        this.bossInterval = 0;
        this.bossIntervalCnt = 0;
        this.bossIntervalCounter = 0;
        this.bossName = "";
        this.bossStageId = stageId;
        this.bossProjCnt = 0;
        this.bossDangerShown = false;

        this.showTitle();

        this.input.setTopOnly(true);
        this.input.on("pointerup", function (pointer) {
            var _pointerId = pointer && (pointer.id !== undefined ? pointer.id : pointer.pointerId);
            if (this.dragPointerId !== null && _pointerId !== null && _pointerId !== this.dragPointerId) return;
            this.isDragging = false;
            this.dragPointerId = null;
        }, this);
        this.shootTimer = 0;
        this.shootInterval = this.recipe.playerData.shootNormal.interval || 23;
        this.shootMode = gameState.shootMode || "normal";
        this.shootSpeed = gameState.shootSpeed || "speed_normal";

        this.enemyWaveFrameCounter = 0;

        this.cursors = null;
        this.wasd = null;
        try {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
                sp: Phaser.Input.Keyboard.KeyCodes.SPACE,
            });
        } catch (e) {}
        this.keyMoveSpeed = 3;

        this.stageBgmName = "";
        this.playBossBgm(stageId);

        var self = this;
        this.time.delayedCall(2600, function () {
            self.playSound("g_stage_voice_" + String(stageId), 0.7);
        });
    }

    // =================================================================
    // HUD (kept inline — number-display helpers are scene-specific)
    // =================================================================
    createHUD() {
        this.hudBg = this.add.sprite(0, 0, "game_ui", "hudBg0.gif");
        this.hudBg.setOrigin(0, 0);
        this.hudBg.setDepth(100);

        this.hpBar = this.add.sprite(49, 7, "game_ui", "hpBar.gif");
        this.hpBar.setOrigin(0, 0);
        this.hpBar.setDepth(101);
        this.hpBar.setScale(this.playerHp / this.playerMaxHp, 1);

        this.scoreLabel = this.add.sprite(30, 25, "game_ui", "smallScoreTxt.gif");
        this.scoreLabel.setOrigin(0, 0);
        this.scoreLabel.setDepth(101);

        this.scoreSmallNum = this._initSmallNum(10);
        this.scoreSmallNum.container.x = this.scoreLabel.x + this.scoreLabel.width + 2;
        this.scoreSmallNum.container.y = 25;
        this.scoreSmallNum.container.setDepth(101);
        this._setSmallNum(this.scoreSmallNum, this.scoreCount);

        this.worldBestText = this.add.text(
            30, 40,
            getWorldBestLabel() + " " + String(getDisplayedHighScore()),
            { fontFamily: "Arial", fontSize: "9px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 2 }
        );
        this.worldBestText.setDepth(101);

        this.comboLabel = this.add.sprite(149, 32, "game_ui", "comboBar.gif");
        this.comboLabel.setOrigin(0, 0);
        this.comboLabel.setDepth(101);
        this.comboLabel.setScale(0, 1);

        this.comboNumContainer = this.add.container(194, 19);
        this.comboNumContainer.setDepth(101);
        this._comboNumSprites = [];
        this._lastComboNum = -1;
        this._setComboNum(0);

        // SP button
        this.spBtnWrap = this.add.container(GW - 70, GCY + 15);
        this.spBtnWrap.setDepth(103);

        this.spBtnPulse = this.add.sprite(32, 32, "game_ui", "hudCabtnBg1.gif");
        this.spBtnPulse.setOrigin(0.5);
        this.spBtnPulse.setAlpha(0);

        this.spBtnReadyBg = this.add.sprite(-18, -18, "game_ui", "hudCabtnBg0.gif");
        this.spBtnReadyBg.setOrigin(0, 0);
        this.spBtnReadyBg.setAlpha(0);

        this.spBtnBarBg = this.add.sprite(0, 0, "game_ui", "hudCabtn100per.gif");
        this.spBtnBarBg.setOrigin(0, 0);

        this.spBtnBar = this.add.sprite(0, 0, "game_ui", "hudCabtn0per.gif");
        this.spBtnBar.setOrigin(0, 0);

        this.spBtnWrap.add([this.spBtnPulse, this.spBtnReadyBg, this.spBtnBarBg, this.spBtnBar]);
        this.spBtnWrap.setSize(this.spBtnBarBg.width, this.spBtnBarBg.height);
        this.spBtnBarBg.setInteractive(
            new Phaser.Geom.Circle(
                this.spBtnBarBg.width / 2,
                this.spBtnBarBg.height / 2,
                Math.min(this.spBtnBarBg.width, this.spBtnBarBg.height) / 2 - 5
            ),
            Phaser.Geom.Circle.Contains
        );
        this.spBtnBarBg.on("pointerover", function () {
            if (this.game && this.game.canvas) this.game.canvas.style.cursor = "pointer";
        }, this);
        this.spBtnBarBg.on("pointerout", function () {
            if (this.game && this.game.canvas) this.game.canvas.style.cursor = "default";
        }, this);
        this.spBtnBarBg.on("pointerup", this.onSpFire, this);
        this.spBtn = this.spBtnWrap;

        this.spReadyTween = null;
        this.updateSpGauge();

        // Boss timer
        this.bossTimerLabel = this.add.sprite(GCX - 42, 58, "game_ui", "timeTxt.gif");
        this.bossTimerLabel.setOrigin(0, 0);
        this.bossTimerLabel.setDepth(101);
        this.bossTimerLabel.setVisible(false);

        this.bossTimerNum = this._initBigNum(2);
        this.bossTimerNum.container.x = this.bossTimerLabel.x + 42 + 3;
        this.bossTimerNum.container.y = 56;
        this.bossTimerNum.container.setDepth(101);
        this.bossTimerNum.container.setVisible(false);
        this._setBigNum(this.bossTimerNum, 99);

        // Boss HP bar
        this.bossHpBarBg = this.add.graphics();
        this.bossHpBarBg.setDepth(101);
        this.bossHpBarBg.setVisible(false);
        this.bossHpBarFg = this.add.graphics();
        this.bossHpBarFg.setDepth(101);
        this.bossHpBarFg.setVisible(false);
    }

    createCover() {
        if (!this.textures.getFrame("game_asset", "stagebgOver.gif")) {
            this.coverOverlay = null;
            return;
        }
        // Phaser 4 RC6: tileSprite does not properly support atlas frames.
        // Use regular sprites to tile the 256x256 frame over the 256x480 stage.
        this.coverOverlay = this.add.container(0, 0);
        this.coverOverlay.setDepth(99);
        var frameH = 256; // stagebgOver.gif is 256x256
        for (var ty = 0; ty < GH; ty += frameH) {
            var tile = this.add.sprite(0, ty, "game_asset", "stagebgOver.gif");
            tile.setOrigin(0, 0);
            this.coverOverlay.add(tile);
        }
    }

    // =================================================================
    // Title / game flow
    // =================================================================
    showTitle() {
        var stageId = gameState.stageId || 0;
        var self = this;

        var bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRect(0, 0, GW, GH);
        bg.setDepth(200);
        bg.setAlpha(0);

        var stageNumIdx = Math.min(stageId + 1, 4);
        var stageNumSprite = this.add.image(0, GCY - 20, "game_ui", "stageNum" + String(stageNumIdx) + ".gif");
        stageNumSprite.setOrigin(0, 0);
        stageNumSprite.setDepth(201);
        stageNumSprite.setAlpha(0);

        var fightSprite = this.add.image(GCX, GCY + 12, "game_ui", "stageFight.gif");
        fightSprite.setOrigin(0.5);
        fightSprite.setDepth(201);
        fightSprite.setAlpha(0);
        fightSprite.setScale(1.2);

        this.tweens.add({ targets: bg, alpha: 1, duration: 300 });

        this.time.delayedCall(300, function () {
            self.playSound("voice_round" + String(Math.min(stageId, 3)), 0.7);
            self.tweens.add({ targets: stageNumSprite, alpha: 1, duration: 300 });
        });

        this.time.delayedCall(1600, function () {
            self.tweens.add({ targets: stageNumSprite, alpha: 0, duration: 100 });
            self.tweens.add({ targets: fightSprite, alpha: 1, duration: 200 });
            self.tweens.add({ targets: fightSprite, scaleX: 1, scaleY: 1, duration: 200 });
        });

        this.time.delayedCall(1800, function () {
            self.playSound("voice_fight", 0.7);
        });

        this.time.delayedCall(2200, function () {
            self.tweens.add({ targets: fightSprite, scaleX: 1.5, scaleY: 1.5, duration: 200 });
            self.tweens.add({ targets: fightSprite, alpha: 0, duration: 200 });
        });

        this.time.delayedCall(2300, function () {
            self.tweens.add({
                targets: bg,
                alpha: 0,
                duration: 200,
                onComplete: function () {
                    bg.destroy();
                    stageNumSprite.destroy();
                    fightSprite.destroy();
                    self.startGame();
                },
            });
        });
    }

    startGame() {
        this.gameStarted = true;
        this.stageBgAmountMove = 0.7;
        this.enemyWaveFlg = true;
        this.frameCnt = 0;
        this.waveCount = 0;
        this.playerUnitX = this.playerSprite.x;
        this.playerUnitY = this.playerSprite.y;
    }

    stageClear() {
        if (this.stageCleared) return;
        this.stageCleared = true;
        this.gameStarted = false;

        gameState.score = this.scoreCount;
        gameState.playerHp = this.playerMaxHp;
        gameState.playerMaxHp = this.playerMaxHp;
        gameState.spgage = this.spGauge;
        gameState.maxCombo = Math.max(gameState.maxCombo || 0, this.maxCombo);
        gameState.shootMode = this.shootMode;
        gameState.shootSpeed = this.shootSpeed;

        if (this.spFiredDuringBoss) {
            gameState.akebonoCnt = (gameState.akebonoCnt || 0) + 1;
        }

        var self = this;
        triggerHaptic("stageClear");

        var clearBg = this.add.graphics();
        clearBg.fillStyle(0xffffff, 0.4);
        clearBg.fillRect(0, 0, GW, GH);
        clearBg.setDepth(200);
        clearBg.setAlpha(0);

        var clearSprite = this.add.sprite(GCX, GCY - 44, "game_ui", "stageclear.gif");
        clearSprite.setOrigin(0.5);
        clearSprite.setDepth(201);
        clearSprite.setAlpha(0);

        this.tweens.add({
            targets: [clearBg, clearSprite],
            alpha: 1,
            duration: 500,
            delay: 300,
        });

        var game = this.game;
        this.time.delayedCall(2500, function () {
            self.stopAllSounds();
            gameState.stageId++;
            setTimeout(function () {
                game.scene.stop("PhaserGameScene");
                game.scene.start("PhaserAdvScene");
            }, 50);
        });
    }

    timeoverComplete() {
        gameState.score = this.scoreCount;
        gameState.maxCombo = Math.max(gameState.maxCombo || 0, this.maxCombo);

        var timeOverText = this.add.text(GCX, GCY, "TIME OVER", {
            fontFamily: "sans-serif",
            fontSize: "22px",
            fontStyle: "bold",
            color: "#ff4444",
            stroke: "#000000",
            strokeThickness: 3,
        });
        timeOverText.setOrigin(0.5);
        timeOverText.setDepth(200);

        this.gameStarted = false;

        var self = this;
        var game = this.game;
        this.time.delayedCall(2500, function () {
            self.stopAllSounds();
            setTimeout(function () {
                game.scene.stop("PhaserGameScene");
                game.scene.start("PhaserContinueScene");
            }, 50);
        });
    }

    // =================================================================
    // SP fire (orchestrates cutin, explosions, damage — touches many subsystems)
    // =================================================================
    onSpFire() {
        if (this.spGauge < 100 || this.spFired || !this.gameStarted) return;
        this.doSpFire();
    }

    doSpFire() {
        this.spFired = true;
        this.spFiredDuringBoss = this.bossActive;
        this.spGauge = 0;
        this.updateSpGauge();
        triggerHaptic("special");
        this.playSound("se_sp", 0.8);
        this.playSound("g_sp_voice", 0.7);

        this.theWorldFlg = true;

        for (var i = this.playerBullets.length - 1; i >= 0; i--) {
            this.playerBullets[i].destroy();
        }
        this.playerBullets = [];

        for (var eb = this.enemyBullets.length - 1; eb >= 0; eb--) {
            if (this.enemyBullets[eb] && this.enemyBullets[eb].active) {
                this.enemyBullets[eb].destroy();
            }
        }
        this.enemyBullets = [];

        var self = this;

        // Cutin overlay
        var cutinBg = this.add.graphics();
        cutinBg.setDepth(160);
        cutinBg.fillStyle(0x000000, 0.9);
        cutinBg.fillRect(0, 0, GW, GH);
        cutinBg.setAlpha(0);

        var cutinSprite = this.add.sprite(0, GCY - 71, "game_asset", "cutin0.gif");
        cutinSprite.setOrigin(0, 0);
        cutinSprite.setDepth(161);
        cutinSprite.setAlpha(0);

        var cutinFlash = this.add.graphics();
        cutinFlash.setDepth(162);
        cutinFlash.fillStyle(0xeeeeee, 1);
        cutinFlash.fillRect(0, 0, GW, GH);
        cutinFlash.setAlpha(0);

        this.tweens.add({ targets: cutinBg, alpha: 1, duration: 250 });

        var cutinFrames = [
            { frame: "cutin0.gif", delay: 0 },
            { frame: "cutin1.gif", delay: 80 },
            { frame: "cutin2.gif", delay: 160 },
            { frame: "cutin3.gif", delay: 240 },
            { frame: "cutin4.gif", delay: 320 },
            { frame: "cutin5.gif", delay: 400 },
            { frame: "cutin6.gif", delay: 700 },
            { frame: "cutin7.gif", delay: 800 },
            { frame: "cutin8.gif", delay: 900 },
        ];

        this.time.delayedCall(250, function () {
            cutinSprite.setAlpha(1);
            for (var cf = 0; cf < cutinFrames.length; cf++) {
                (function (f) {
                    self.time.delayedCall(f.delay, function () {
                        if (cutinSprite.active) cutinSprite.setFrame(f.frame);
                    });
                })(cutinFrames[cf]);
            }
        });

        this.time.delayedCall(550, function () {
            cutinFlash.setAlpha(1);
            self.tweens.add({ targets: cutinFlash, alpha: 0, duration: 300 });
        });

        this.time.delayedCall(1700, function () {
            self.tweens.add({
                targets: [cutinBg, cutinSprite],
                alpha: 0,
                duration: 200,
                onComplete: function () {
                    cutinBg.destroy();
                    cutinSprite.destroy();
                    cutinFlash.destroy();
                },
            });
        });

        // Impact flurry during cutin blackout (matches PIXI shungokusatsu)
        if (this.bossActive && this.bossSprite && this.bossSprite.active) {
            var bossX = this.bossSprite.x;
            var bossY = this.bossSprite.y;
            var bossW = this.bossSprite.width || 80;
            var bossH = this.bossSprite.height || 80;
            var spFlash = this.add.graphics();
            spFlash.setDepth(163);
            spFlash.fillStyle(0xffffff, 1);
            spFlash.fillRect(0, 0, GW, GH);
            spFlash.setAlpha(0);

            for (var fi = 0; fi < 10; fi++) {
                (function (idx) {
                    self.time.delayedCall(400 + 50 * idx, function () {
                        var ix = bossX + Math.random() * bossW - bossW / 2;
                        var iy = bossY + Math.random() * (bossH / 2) - bossH / 4;
                        _showHitImpact(self, ix, iy, false);
                        self.playSound("se_damage", 0.3);
                    });
                    self.time.delayedCall(400 + 50 * idx + 10, function () {
                        spFlash.setAlpha(0.2);
                    });
                    self.time.delayedCall(400 + 50 * idx + 70, function () {
                        spFlash.setAlpha(0);
                    });
                })(fi);
            }
            this.time.delayedCall(1700, function () {
                spFlash.destroy();
            });
        }

        // SP line
        var spLine = this.add.graphics();
        spLine.setDepth(150);
        spLine.fillStyle(0xff0000, 1);
        spLine.fillRect(this.playerSprite.x - 1, 0, 3, GH);
        this.tweens.add({
            targets: spLine,
            alpha: 0,
            duration: 600,
            onComplete: function () { spLine.destroy(); },
        });

        this.time.delayedCall(300, function () {
            _spExplosions(self);
        });

        this.time.delayedCall(1100, function () {
            var spDamage = self.recipe.playerData.spDamage || 50;
            var enemySnap = self.enemies.slice();
            for (var e = enemySnap.length - 1; e >= 0; e--) {
                var en = enemySnap[e];
                if (en && en.active) {
                    var ex = en.x, ey = en.y, ew = en.width || 0;
                    if (ex < -ew / 2 || ex > GW || ey < 20 || ey > GH) continue;
                    var isBoss = en.getData("type") === "boss";
                    if (isBoss) {
                        var ehp = en.getData("hp") - spDamage;
                        en.setData("hp", ehp);
                        self.bossHp = ehp;
                        self.checkBossDanger();
                        if (ehp <= 0) {
                            self.bossDie(en);
                        }
                    } else {
                        self.enemyDie(en, true);
                    }
                }
            }
        });

        this.time.delayedCall(2500, function () {
            self.theWorldFlg = false;
            self.spFired = false;
        });
    }

    // =================================================================
    // SP gauge
    // =================================================================
    updateSpGauge() {
        if (!this.spBtnBar) return;

        var ratio = Math.min(this.spGauge / 100, 1);
        if (ratio <= 0) {
            this.spBtnBar.setCrop(0, 0, 0, 0);
        } else {
            var cropY = Math.round(8 * ratio);
            var cropH = Math.round(50 * ratio);
            this.spBtnBar.setCrop(8, cropY, 51, cropH);
        }

        if (ratio >= 1) {
            this.spBtnReadyBg.setAlpha(1);
            if (!this.spReadyHapticPlayed) {
                triggerHaptic("ready");
                this.spReadyHapticPlayed = true;
            }
            if (!this.spReadyTween) {
                this.spReadyTween = this.tweens.add({
                    targets: this.spBtnPulse,
                    alpha: 1,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                });
            }
        } else {
            this.spReadyHapticPlayed = false;
            this.spBtnReadyBg.setAlpha(0);
            this.spBtnPulse.setAlpha(0);
            if (this.spReadyTween) {
                this.spReadyTween.stop();
                this.spReadyTween = null;
            }
        }
    }

    updateBossHpBar() {
        if (!this.bossActive || !this.bossSprite || !this.bossSprite.active) {
            this.bossHpBarBg.setVisible(false);
            this.bossHpBarFg.setVisible(false);
            return;
        }

        var barW = 120;
        var barH = 6;
        var barX = GCX - barW / 2;
        var barY = 52;

        this.bossHpBarBg.setVisible(true);
        this.bossHpBarBg.clear();
        this.bossHpBarBg.fillStyle(0x333333, 0.8);
        this.bossHpBarBg.fillRect(barX, barY, barW, barH);

        var hpRatio = Math.max(0, this.bossHp / this.bossMaxHp);
        var color = hpRatio > 0.5 ? 0xff4444 : hpRatio > 0.25 ? 0xff8800 : 0xff0000;

        this.bossHpBarFg.setVisible(true);
        this.bossHpBarFg.clear();
        this.bossHpBarFg.fillStyle(color, 1);
        this.bossHpBarFg.fillRect(barX, barY, barW * hpRatio, barH);
    }

    // =================================================================
    // Items
    // =================================================================
    dropItem(x, y, itemName) {
        var frameMap = {
            big: "powerupBig0.gif",
            "3way": "powerup3way0.gif",
            speed_high: "speedupItem0.gif",
            barrier: "barrierItem0.gif",
        };
        var frameKey = frameMap[itemName] || "powerupBig0.gif";

        var item = this.add.sprite(x, y, "game_asset", frameKey);
        item.setOrigin(0.5);
        item.setDepth(55);
        item.setData("itemName", itemName);
        this.items.push(item);
    }

    collectItem(itemName) {
        _collectItem(this, itemName);
    }

    playerDamage(amount) {
        _playerDamage(this, amount);
    }

    // =================================================================
    // Sound
    // =================================================================
    playBossBgm(stageId) {
        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var name = bossNames[stageId] || "bison";
        var key = "boss_" + name + "_bgm";
        this.stageBgmName = key;
        this.playBgm(key, 0.4);
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
                    existing.play({ volume: volume || 0.4, loop: true });
                } else {
                    this.sound.add(key, { loop: true, volume: volume || 0.4 }).play();
                }
            }
        } catch (e) {}
    }

    stopAllSounds() {
        try { this.sound.stopAll(); } catch (e) {}
    }

    // =================================================================
    // Fixed-timestep game loop
    // =================================================================
    update(time, delta) {
        var STEP = 8.333333;
        this._accumulator = (this._accumulator || 0) + Math.min(delta, 66.67);
        while (this._accumulator >= STEP) {
            this._accumulator -= STEP;
            this.fixedUpdate(time, STEP);
        }
    }

    fixedUpdate(time, step) {
        if (this.stageBg && !this.playerDead && !this.stageCleared) {
            if (!this.bossActive && !this.bossReached) {
                var bgMove = this.gameStarted ? (this.stageBgAmountMove || 0.7) : 0.7;
                this.stageBg.tilePositionY -= bgMove;
            }
        }

        if (!this.gameStarted) return;
        if (this.playerDead || this.stageCleared) return;

        handleKeyboardInput(this);
        this.playerSprite.x += 0.09 * (this.playerUnitX - this.playerSprite.x);

        // Sync player shadow position and frame
        if (this.playerShadow && this.playerShadow.active) {
            updateShadowPosition(this.playerShadow, this.playerSprite);
            if (this.playerSprite.frame && this.playerShadow.frame.name !== this.playerSprite.frame.name) {
                try { this.playerShadow.setFrame(this.playerSprite.frame.name); } catch (e) {}
            }
        }

        if (this.theWorldFlg) {
            this.updateHUD();
            this.updateBossHpBar();
            return;
        }

        // Shooting
        this.shootTimer += 1;
        var interval = this.shootSpeed === "speed_high" ? Math.floor(this.shootInterval * 0.6) : this.shootInterval;
        if (this.shootTimer >= interval) {
            this.shootTimer = 0;
            shootBullets(this);
        }

        // Player bullets
        updatePlayerBullets(this);

        // --- Enemy loop (collision, movement, animation) ---
        for (var e = this.enemies.length - 1; e >= 0; e--) {
            var enemy = this.enemies[e];
            if (!enemy || !enemy.active) {
                this.enemies.splice(e, 1);
                continue;
            }

            var isBoss = enemy.getData("type") === "boss";

            if (!isBoss) {
                updateEnemy(this, enemy, step);
            } else {
                if (!this.bossSprite || !this.bossSprite.active) {
                    this.enemies.splice(e, 1);
                    continue;
                }
                syncBossVisuals(this);
            }

            animateEnemy(enemy, step);

            var eRect = { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2, w: enemy.width, h: enemy.height };

            // Bullet-enemy collision
            for (var bb = this.playerBullets.length - 1; bb >= 0; bb--) {
                var pb = this.playerBullets[bb];
                if (!pb || !pb.active) continue;

                var bRect = { x: pb.x - pb.width / 2, y: pb.y - pb.height / 2, w: pb.width, h: pb.height };

                if (isBoss && this.bossEntering) continue;

                if (enemy.y >= 40 && rectOverlap(eRect, bRect)) {
                    var applyDamage = true;

                    if (this.shootMode === "big") {
                        var bid = pb.getData("bulletId");
                        var bkey = "bulletid_" + bid;
                        var bfkey = "bulletframeCnt_" + bid;
                        var prevHit = enemy.getData(bkey);
                        if (prevHit == null) {
                            enemy.setData(bkey, 0);
                            enemy.setData(bfkey, 0);
                        } else {
                            var fc = (enemy.getData(bfkey) || 0) + 1;
                            enemy.setData(bfkey, fc);
                            if (fc % 15 === 0) {
                                var hitCnt = (enemy.getData(bkey) || 0) + 1;
                                enemy.setData(bkey, hitCnt);
                                if (hitCnt > 1) applyDamage = false;
                            } else {
                                applyDamage = false;
                            }
                        }
                    }

                    if (applyDamage) {
                        var dmg = pb.getData("damage") || 1;
                        var hpBefore = enemy.getData("hp");
                        var isGuard = (hpBefore === "infinity");

                        if (!isGuard) {
                            var ehp = hpBefore - dmg;
                            enemy.setData("hp", ehp);

                            if (isBoss) {
                                this.bossHp = ehp;
                                this.checkBossDanger();
                            }

                            this.showHitImpact(pb.x, pb.y, false);
                            this.playSound("se_damage", 0.15);

                            if (ehp <= 0) {
                                if (isBoss) {
                                    this.bossDie(enemy);
                                } else {
                                    this.enemyDie(enemy, false);
                                }
                                break;
                            }

                            this.flashEnemyTint(enemy);
                        } else {
                            this.showHitImpact(pb.x, pb.y, true);
                            this.playSound("se_guard", 0.2);
                            this.flashEnemyTint(enemy);
                        }
                    }

                    if (this.shootMode !== "big") {
                        pb.destroy();
                        this.playerBullets.splice(bb, 1);
                    }
                }
            }

            if (!enemy.active) continue;

            // Barrier collision
            if (this.barrierActive && this.barrierSprite) {
                var barRect = { x: this.barrierSprite.x - 20, y: this.barrierSprite.y - 20, w: 40, h: 40 };
                if (rectOverlap(eRect, barRect) && !isBoss) {
                    this.enemyDie(enemy, false);
                    continue;
                }
            }

            // Player-enemy collision
            var pRect = { x: this.playerSprite.x - 8, y: this.playerSprite.y - 16, w: 16, h: 32 };
            if (rectOverlap(eRect, pRect) && !isBoss) {
                this.playerDamage(1);
                this.enemyDie(enemy, false);
                continue;
            }

            // Boss-player collision (boss damages player but doesn't die)
            if (isBoss && rectOverlap(eRect, pRect)) {
                var now = this.time.now;
                if (!this._lastBossContactTime || now - this._lastBossContactTime > 1000) {
                    this._lastBossContactTime = now;
                    this.playerDamage(1);
                }
            }

            // Off-screen cleanup
            if (!isBoss && (enemy.y > GH + 20 || enemy.x < -40 || enemy.x > GW + 40)) {
                var idx = this.enemies.indexOf(enemy);
                if (idx >= 0) this.enemies.splice(idx, 1);
                var osShadow = enemy.getData("shadow");
                if (osShadow && osShadow.active) osShadow.destroy();
                enemy.destroy();
            }
        }

        // --- Enemy bullets ---
        for (var eb = this.enemyBullets.length - 1; eb >= 0; eb--) {
            var eBullet = this.enemyBullets[eb];
            if (!eBullet || !eBullet.active) {
                this.enemyBullets.splice(eb, 1);
                continue;
            }

            var rotX = eBullet.getData("rotX") || 0;
            var rotY = eBullet.getData("rotY") || 1;
            var spd = eBullet.getData("speed") || 1;
            eBullet.x += rotX * spd;
            eBullet.y += rotY * spd;

            if (eBullet.y > GH + 20 || eBullet.y < -20 || eBullet.x < -20 || eBullet.x > GW + 20) {
                eBullet.destroy();
                this.enemyBullets.splice(eb, 1);
                continue;
            }

            // Barrier blocks enemy bullets
            if (this.barrierActive && this.barrierSprite) {
                var barRect2 = { x: this.barrierSprite.x - 20, y: this.barrierSprite.y - 20, w: 40, h: 40 };
                var ebRect0 = { x: eBullet.x - eBullet.width / 2, y: eBullet.y - eBullet.height / 2, w: eBullet.width, h: eBullet.height };
                if (rectOverlap(ebRect0, barRect2)) {
                    this.playSound("se_guard", 0.3);
                    eBullet.destroy();
                    this.enemyBullets.splice(eb, 1);
                    continue;
                }
            }

            // Player bullets destroy enemy bullets
            var ebDestroyed = false;
            var ebRect1 = { x: eBullet.x - eBullet.width / 2, y: eBullet.y - eBullet.height / 2, w: eBullet.width, h: eBullet.height };
            var ebHp = eBullet.getData("hp") || 1;
            for (var pbb = this.playerBullets.length - 1; pbb >= 0; pbb--) {
                var pb2 = this.playerBullets[pbb];
                if (!pb2 || !pb2.active) continue;
                var pb2Rect = { x: pb2.x - pb2.width / 2, y: pb2.y - pb2.height / 2, w: pb2.width, h: pb2.height };
                if (rectOverlap(pb2Rect, ebRect1)) {
                    var pb2dmg = pb2.getData("damage") || 1;
                    ebHp -= pb2dmg;
                    eBullet.setData("hp", ebHp);
                    if (this.shootMode !== "big") {
                        pb2.destroy();
                        this.playerBullets.splice(pbb, 1);
                    }
                    if (ebHp <= 0) {
                        triggerHaptic("deflect");
                        var ebScore = eBullet.getData("score") || 0;
                        var ebSpgage = eBullet.getData("spgage") || 0;
                        if (ebScore > 0) {
                            this.comboCount++;
                            if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
                            var ebRatio = Math.max(1, Math.ceil(this.comboCount / 10));
                            this.scoreCount += ebScore * ebRatio;
                            this.comboTimeCnt = 100;
                            this.spGauge = Math.min(100, this.spGauge + ebSpgage);
                            this.updateSpGauge();
                            this.showScorePopup(eBullet.x, eBullet.y, ebScore, ebRatio);
                        }
                        this.showExplosion(eBullet.x, eBullet.y);
                        this.playSound("se_explosion", 0.35);
                        eBullet.destroy();
                        this.enemyBullets.splice(eb, 1);
                        ebDestroyed = true;
                    }
                    break;
                }
            }
            if (ebDestroyed) continue;

            // Enemy bullet hits player
            var ebRect = { x: eBullet.x - eBullet.width / 2, y: eBullet.y - eBullet.height / 2, w: eBullet.width, h: eBullet.height };
            var pRect2 = { x: this.playerSprite.x - 8, y: this.playerSprite.y - 16, w: 16, h: 32 };

            if (rectOverlap(ebRect, pRect2)) {
                var edamage = eBullet.getData("damage") || 1;
                this.playerDamage(edamage);
                eBullet.destroy();
                this.enemyBullets.splice(eb, 1);
            }
        }

        // --- Items ---
        for (var it = this.items.length - 1; it >= 0; it--) {
            var item = this.items[it];
            if (!item || !item.active) {
                this.items.splice(it, 1);
                continue;
            }

            item.y += 1;

            var iRect = { x: item.x - item.width / 2, y: item.y - item.height / 2, w: item.width, h: item.height };
            var pRect3 = { x: this.playerSprite.x - 12, y: this.playerSprite.y - 20, w: 24, h: 40 };

            if (rectOverlap(iRect, pRect3)) {
                var iname = item.getData("itemName");
                this.collectItem(iname);
                item.destroy();
                this.items.splice(it, 1);
                continue;
            }

            if (item.y > GH) {
                item.destroy();
                this.items.splice(it, 1);
            }
        }

        // --- Wave spawning ---
        if (this.enemyWaveFlg) {
            this.enemyWaveFrameCounter += 1;
            if (this.enemyWaveFrameCounter >= this.waveInterval) {
                this.enemyWaveFrameCounter -= this.waveInterval;
                _enemyWave(this);
            }
        }

        // --- Boss timer ---
        if (this.bossTimerStartFlg) {
            this.bossTimerFrameCnt += step;
            if (this.bossTimerFrameCnt >= 1000) {
                this.bossTimerFrameCnt -= 1000;
                this.bossTimerCountDown--;
                if (this.bossTimerCountDown <= 0) {
                    this.bossTimerStartFlg = false;
                    this.timeoverComplete();
                }
            }
            this._setBigNum(this.bossTimerNum, Math.max(0, this.bossTimerCountDown));
        }

        // --- Combo decay ---
        this.comboTimeCnt -= 0.1;
        if (this.comboTimeCnt <= 0) {
            this.comboTimeCnt = 0;
            this.comboCount = 0;
        }

        // --- Barrier ---
        updateBarrier(this, step);

        // --- HUD ---
        this.updateHUD();
        this.updateBossHpBar();
    }

    // =================================================================
    // HUD update + number display helpers
    // =================================================================
    updateHUD() {
        this._setSmallNum(this.scoreSmallNum, this.scoreCount);
        this._setComboNum(this.comboCount);
        if (this.comboLabel) {
            this.comboLabel.setScale(this.comboTimeCnt / 100, 1);
        }
        if (this.worldBestText) {
            var best = Math.max(getDisplayedHighScore(), this.scoreCount);
            this.worldBestText.setText(getWorldBestLabel() + " " + String(best));
        }
    }

    _setComboNum(num) {
        if (!this.comboNumContainer || !this._comboNumSprites) return;
        if (this._lastComboNum === num) return;
        this._lastComboNum = num;
        for (var i = 0; i < this._comboNumSprites.length; i++) {
            this.comboNumContainer.remove(this._comboNumSprites[i], true);
        }
        this._comboNumSprites = [];
        var text = String(num);
        var x = 0;
        for (var j = 0; j < text.length; j++) {
            var frame = "comboNum" + text[j] + ".gif";
            try {
                var sprite = this.add.image(x, 0, "game_ui", frame);
                sprite.setOrigin(0, 0);
                this.comboNumContainer.add(sprite);
                this._comboNumSprites.push(sprite);
                x += sprite.width;
            } catch (e) {}
        }
    }

    _initSmallNum(maxDigit) {
        var container = this.add.container(0, 0);
        var sprites = [];
        for (var n = 0; n < maxDigit; n++) {
            var sp = this.add.image((maxDigit - 1 - n) * 6, 0, "game_ui", "smallNum0.gif");
            sp.setOrigin(0, 0);
            container.add(sp);
            sprites.push(sp);
        }
        return { container: container, sprites: sprites, _lastVal: -1 };
    }

    _setSmallNum(smallNum, val) {
        if (!smallNum || !smallNum.sprites) return;
        val = Math.max(0, Math.floor(val));
        if (smallNum._lastVal === val) return;
        smallNum._lastVal = val;
        var text = String(val);
        var sprites = smallNum.sprites;
        for (var i = 0; i < sprites.length; i++) {
            var digit = text.length > i ? text[text.length - 1 - i] : "0";
            try {
                sprites[i].setFrame("smallNum" + digit + ".gif");
            } catch (e) {}
            sprites[i].setAlpha(i < text.length ? 1 : 0.5);
        }
    }

    _initBigNum(maxDigit) {
        var container = this.add.container(0, 0);
        var sprites = [];
        for (var n = 0; n < maxDigit; n++) {
            var sp = this.add.image((maxDigit - 1 - n) * 11, 0, "game_ui", "bigNum0.gif");
            sp.setOrigin(0, 0);
            container.add(sp);
            sprites.push(sp);
        }
        return { container: container, sprites: sprites, _lastVal: -1 };
    }

    _setBigNum(bigNum, val) {
        if (!bigNum || !bigNum.sprites) return;
        val = Math.max(0, Math.floor(val));
        if (bigNum._lastVal === val) return;
        bigNum._lastVal = val;
        var text = String(val);
        var sprites = bigNum.sprites;
        for (var i = 0; i < sprites.length; i++) {
            var digit = text.length > i ? text[text.length - 1 - i] : "0";
            try {
                sprites[i].setFrame("bigNum" + digit + ".gif");
            } catch (e) {}
        }
    }
}

export default PhaserGameScene;
