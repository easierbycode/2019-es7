import { BGM_INFO, GAME_DIMENSIONS, RESOURCE_PATHS } from "../constants.js";
import { gameState, saveHighScore } from "../gameState.js";
import { PLAYER_STATES } from "../enums/player-boss-states.js";
import {
    getDisplayedHighScore,
    getWorldBestLabel,
    getHighScoreSyncText,
} from "../highScoreUi.js";

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

// No more sine-wave boss patterns — replaced by timeline-based attack
// patterns in bossShootStart() / bossPattern*() methods below.

export class PhaserGameScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserGameScene" });
    }

    create() {
        this.recipe = recipeData();
        if (!this.recipe) {
            this.scene.start("PhaserTitleScene");
            return;
        }

        this.frameCnt = 0;
        this.waveCount = 0;
        this.waveInterval = 80;
        this.enemyWaveFlg = false;
        this.theWorldFlg = false;
        this.sceneSwitch = 0;
        this.bossActive = false;
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

        this.createPlayer();
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

        this.input.on("pointermove", this.onPointerMove, this);
        this.input.on("pointerdown", this.onPointerDown, this);
        this.input.on("pointerup", this.onPointerUp, this);

        this.isDragging = false;
        this.shootTimer = 0;
        this.shootInterval = this.recipe.playerData.shootNormal.interval || 23;
        this.shootMode = gameState.shootMode || "normal";
        this.shootSpeed = gameState.shootSpeed || "speed_normal";

        this.enemyWaveFrameCounter = 0;

        // Keyboard controls for PC mode
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

        // Play stage voice after round title
        var self = this;
        this.time.delayedCall(2600, function () {
            self.playSound("g_stage_voice_" + String(stageId), 0.7);
        });
    }

    playBossBgm(stageId) {
        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var name = bossNames[stageId] || "bison";
        var key = "boss_" + name + "_bgm";
        this.stageBgmName = key;
        this.playBgm(key, 0.4);
    }

    createPlayer() {
        var pd = this.recipe.playerData;
        var frames = pd.texture || [];
        var frameKey = frames[0] || "player00.gif";

        this.playerSprite = this.add.sprite(GCX, GH - 80, "game_asset", frameKey);
        this.playerSprite.setOrigin(0.5);

        this.playerHp = gameState.playerHp || pd.maxHp;
        this.playerMaxHp = gameState.playerMaxHp || pd.maxHp;

        this.playerAnimFrames = frames;
        this.playerAnimIdx = 0;
        this.playerAnimTimer = 0;

        // Create player walk animation (PIXI animationSpeed=0.35 at 120 logical fps ≈ 42 fps)
        if (frames.length > 1) {
            var animFrames = [];
            for (var i = 0; i < frames.length; i++) {
                animFrames.push({ key: "game_asset", frame: frames[i] });
            }
            if (!this.anims.exists("player_walk")) {
                this.anims.create({
                    key: "player_walk",
                    frames: animFrames,
                    frameRate: 42,
                    repeat: -1,
                });
            }
            this.playerSprite.play("player_walk");
        }

        this.barrierActive = false;
        this.barrierTimer = 0;
        this.barrierSprite = null;
    }

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

        // PIXI uses sprite-based smallNum (ei class with 10 digits) for in-game score
        this.scoreSmallNum = this._initSmallNum(10);
        this.scoreSmallNum.container.x = this.scoreLabel.x + this.scoreLabel.width + 2;
        this.scoreSmallNum.container.y = 25; // same y as label (PIXI line 6148)
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

        this.spBtnBar = this.add.sprite(0, 58, "game_ui", "hudCabtn0per.gif");
        this.spBtnBar.setOrigin(0, 1);
        this.spBtnBar.setScale(1, 0);

        this.spBtnWrap.add([this.spBtnPulse, this.spBtnReadyBg, this.spBtnBarBg, this.spBtnBar]);
        this.spBtnWrap.setSize(this.spBtnBarBg.width, this.spBtnBarBg.height);
        this.spBtnWrap.setInteractive({ useHandCursor: true });
        this.spBtnWrap.on("pointerup", this.onSpFire, this);
        this.spBtn = this.spBtnWrap;

        this.spReadyTween = null;
        this.updateSpGauge();

        // PIXI: timeTxt.gif sprite (42x15) + bigNum (2 digits) for boss timer
        this.bossTimerLabel = this.add.sprite(GCX - 42, 58, "game_ui", "timeTxt.gif");
        this.bossTimerLabel.setOrigin(0, 0);
        this.bossTimerLabel.setDepth(101);
        this.bossTimerLabel.setVisible(false);

        this.bossTimerNum = this._initBigNum(2);
        this.bossTimerNum.container.x = this.bossTimerLabel.x + 42 + 3; // 3px gap
        this.bossTimerNum.container.y = 56; // 2px higher than label
        this.bossTimerNum.container.setDepth(101);
        this.bossTimerNum.container.setVisible(false);
        this._setBigNum(this.bossTimerNum, 99);

        // Boss HP bar (hidden until boss appears)
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

        this.coverOverlay = this.add.tileSprite(0, 0, GW, GH, "game_asset", "stagebgOver.gif");
        this.coverOverlay.setOrigin(0, 0);
        this.coverOverlay.setDepth(99);
    }

    showTitle() {
        var stageId = gameState.stageId || 0;
        var self = this;

        var bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRect(0, 0, GW, GH);
        bg.setDepth(200);
        bg.setAlpha(0);

        var stageNumIdx = Math.min(stageId + 1, 4);
        var stageNumSprite;
        try {
            stageNumSprite = this.add.image(GCX, GCY - 20, "game_ui", "stageNum" + String(stageNumIdx) + ".gif");
            stageNumSprite.setOrigin(0.5);
        } catch (e) {
            stageNumSprite = this.add.text(GCX, GCY - 40, "ROUND " + String(stageId + 1),
                { fontFamily: "sans-serif", fontSize: "24px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 3 });
            stageNumSprite.setOrigin(0.5);
        }
        stageNumSprite.setDepth(200);
        stageNumSprite.setAlpha(0);

        var fightSprite;
        try {
            fightSprite = this.add.image(GCX, GCY + 20, "game_ui", "stageFight.gif");
            fightSprite.setOrigin(0.5);
        } catch (e) {
            fightSprite = this.add.text(GCX, GCY + 10, "FIGHT!",
                { fontFamily: "sans-serif", fontSize: "18px", fontStyle: "bold", color: "#ff4444", stroke: "#000000", strokeThickness: 3 });
            fightSprite.setOrigin(0.5);
        }
        fightSprite.setDepth(200);
        fightSprite.setAlpha(0);

        this.playSound("voice_round" + String(Math.min(stageId, 3)), 0.7);

        this.tweens.add({
            targets: bg,
            alpha: 1,
            duration: 300,
            onComplete: function () {
                self.tweens.add({
                    targets: stageNumSprite,
                    alpha: 1,
                    duration: 300,
                    onComplete: function () {
                        self.time.delayedCall(900, function () {
                            self.tweens.add({ targets: stageNumSprite, alpha: 0, duration: 200 });
                            self.playSound("voice_fight", 0.7);
                            self.tweens.add({
                                targets: fightSprite,
                                alpha: 1,
                                scaleX: 1.2,
                                scaleY: 1.2,
                                duration: 200,
                                onComplete: function () {
                                    self.time.delayedCall(600, function () {
                                        self.tweens.add({
                                            targets: [fightSprite, bg],
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
                                },
                            });
                        });
                    },
                });
            },
        });
    }

    startGame() {
        this.gameStarted = true;
        this.stageBgAmountMove = 0.7;
        this.enemyWaveFlg = true;
        this.frameCnt = 0;
        this.waveCount = 0;
    }

    onPointerDown(pointer) {
        this.isDragging = true;
    }

    onPointerUp(pointer) {
        this.isDragging = false;
    }

    onPointerMove(pointer) {
        if (!this.gameStarted || this.playerDead || this.theWorldFlg) {
            return;
        }
        this.playerSprite.x = clamp(pointer.x, 16, GW - 16);
    }

    handleKeyboardInput() {
        if (!this.gameStarted || this.playerDead || this.theWorldFlg || !this.cursors || !this.wasd) {
            return;
        }

        var moveX = 0;
        var moveY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            moveX = -this.keyMoveSpeed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            moveX = this.keyMoveSpeed;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            moveY = -this.keyMoveSpeed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            moveY = this.keyMoveSpeed;
        }

        if (moveX !== 0 || moveY !== 0) {
            this.playerSprite.x = clamp(this.playerSprite.x + moveX, 16, GW - 16);
            this.playerSprite.y = clamp(this.playerSprite.y + moveY, 50, GH - 20);
        }

        // Space bar triggers SP
        if (this.wasd.sp && Phaser.Input.Keyboard.JustDown(this.wasd.sp)) {
            this.onSpFire();
        }
    }

    updateSpGauge() {
        if (!this.spBtnBar) {
            return;
        }

        var ratio = Math.min(this.spGauge / 100, 1);
        this.spBtnBar.setScale(1, ratio);

        if (ratio >= 1) {
            this.spBtnReadyBg.setAlpha(1);
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

    onSpFire() {
        if (this.spGauge < 100 || this.spFired || !this.gameStarted) {
            return;
        }
        this.doSpFire();
    }

    doSpFire() {
        this.spFired = true;
        this.spFiredDuringBoss = this.bossActive;
        this.spGauge = 0;
        this.updateSpGauge();
        this.playSound("se_sp", 0.8);
        this.playSound("g_sp_voice", 0.7);

        this.theWorldFlg = true;

        for (var i = this.playerBullets.length - 1; i >= 0; i--) {
            this.playerBullets[i].destroy();
        }
        this.playerBullets = [];

        // Destroy all enemy bullets on screen
        for (var eb = this.enemyBullets.length - 1; eb >= 0; eb--) {
            if (this.enemyBullets[eb] && this.enemyBullets[eb].active) {
                this.enemyBullets[eb].destroy();
            }
        }
        this.enemyBullets = [];

        var self = this;

        // --- G cutin overlay (matches PIXI CutinContainer) ---
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

        // Fade in black BG
        this.tweens.add({ targets: cutinBg, alpha: 1, duration: 250 });

        // 9-frame cutin animation with PIXI-matching timing
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
                        if (cutinSprite.active) {
                            cutinSprite.setFrame(f.frame);
                        }
                    });
                })(cutinFrames[cf]);
            }
        });

        // White flash at 550ms
        this.time.delayedCall(550, function () {
            cutinFlash.setAlpha(1);
            self.tweens.add({
                targets: cutinFlash,
                alpha: 0,
                duration: 300,
            });
        });

        // Remove cutin overlay at 1700ms (matching PIXI)
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

        // --- SP line effect ---
        var spLine = this.add.graphics();
        spLine.setDepth(150);
        spLine.fillStyle(0xff0000, 1);
        spLine.fillRect(this.playerSprite.x - 1, 0, 3, GH);

        this.tweens.add({
            targets: spLine,
            alpha: 0,
            duration: 600,
            onComplete: function () {
                spLine.destroy();
            },
        });

        this.time.delayedCall(300, function () {
            self.spExplosions();
        });

        // PIXI applies SP damage at "+=0.8" (800ms after explosions start at 300ms)
        // Total delay from spFire: 300 + 800 = 1100ms
        this.time.delayedCall(1100, function () {
            // Apply SP damage to all enemies including boss (PIXI: onDamage(D.spDamage))
            var spDamage = self.recipe.playerData.spDamage || 50;
            var enemySnap = self.enemies.slice();
            for (var e = enemySnap.length - 1; e >= 0; e--) {
                var en = enemySnap[e];
                if (en && en.active) {
                    // PIXI bounds check: x >= -width/2 && x <= GW && y >= 20 && y <= GH
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

    spExplosions() {
        // Matches PIXI: 64 animated sprites in rows (8 per row, 8 rows)
        // Row-alternating x offsets, 30px horizontal spacing, 45px vertical spacing
        // spExplosion00-07.gif animated at speed 0.2
        var self = this;

        // Create spExplosion animation if it doesn't exist
        if (!this.anims.exists("sp_explosion_anim")) {
            var frames = [];
            for (var f = 0; f < 8; f++) {
                frames.push({ key: "game_asset", frame: "spExplosion0" + f + ".gif" });
            }
            this.anims.create({
                key: "sp_explosion_anim",
                frames: frames,
                frameRate: 24, // PIXI animationSpeed 0.2 at 120fps = 24fps
                repeat: 0,
            });
        }

        for (var n = 0; n < 64; n++) {
            (function (idx) {
                self.time.delayedCall(10 * idx, function () {
                    var col = idx % 8;
                    var row = Math.floor(idx / 8);
                    // Alternating row start: even rows start at -30, odd rows at -45 (PIXI pattern)
                    var startX = row % 2 === 0 ? -30 : -45;
                    var x = startX + col * 30;
                    var y = GH - 45 * (row + 1) - 120;

                    // Clamp x into visible area
                    if (x < 0) x += GW;
                    if (x > GW) x -= GW;

                    var explosion = self.add.sprite(x, y, "game_asset", "spExplosion00.gif");
                    explosion.setOrigin(0.5);
                    explosion.setDepth(140);
                    explosion.play("sp_explosion_anim");
                    explosion.once("animationcomplete", function () {
                        explosion.destroy();
                    });

                    // Sound every 16 sprites (4 times total)
                    if (idx % 16 === 0) {
                        self.playSound("se_sp_explosion", 0.3);
                    }
                });
            })(n);
        }
    }

    shoot() {
        if (!this.gameStarted || this.playerDead || this.theWorldFlg) {
            return;
        }

        var pd = this.recipe.playerData;
        var shootData;

        switch (this.shootMode) {
        case "big":
            shootData = pd.shootBig;
            break;
        case "3way":
            shootData = pd.shoot3way;
            break;
        default:
            shootData = pd.shootNormal;
            break;
        }

        var frameKey = (shootData.texture && shootData.texture[0]) || "shot00.gif";

        if (this.shootMode === "3way") {
            for (var a = -1; a <= 1; a++) {
                var b = this.add.sprite(this.playerSprite.x + a * 10, this.playerSprite.y - 20, "game_asset", frameKey);
                b.setOrigin(0.5);
                b.setDepth(50);
                b.setData("damage", shootData.damage);
                b.setData("hp", shootData.hp);
                b.setData("angle", a * 0.15);
                b.setData("bulletId", this.bulletIdCnt++);
                b.setRotation(-Math.PI / 2 + a * 0.2);
                this.playerBullets.push(b);
            }
        } else {
            var bullet = this.add.sprite(this.playerSprite.x, this.playerSprite.y - 20, "game_asset", frameKey);
            bullet.setOrigin(0.5);
            bullet.setDepth(50);
            bullet.setData("damage", shootData.damage);
            bullet.setData("hp", shootData.hp);
            bullet.setData("angle", 0);
            bullet.setData("bulletId", this.bulletIdCnt++);
            bullet.setRotation(-Math.PI / 2);
            if (this.shootMode === "big") {
                bullet.setScale(1.5);
            }
            this.playerBullets.push(bullet);
        }

        this.playSound("se_shoot", 0.3);
    }

    createEnemy(data, x, y, itemName) {
        var frames = data.texture || [];
        var frameKey = frames[0] || "soliderA0.gif";

        var enemy = this.add.sprite(x, y, "game_asset", frameKey);
        enemy.setOrigin(0.5);
        enemy.setDepth(40);
        enemy.setData("type", "enemy");
        enemy.setData("name", data.name || "");
        enemy.setData("hp", data.hp || 1);
        enemy.setData("maxHp", data.hp || 1);
        enemy.setData("speed", data.speed || 0.8);
        enemy.setData("score", data.score || 100);
        enemy.setData("spgage", data.spgage || 1);
        enemy.setData("interval", data.interval || 300);
        enemy.setData("shootCnt", 0);
        enemy.setData("itemName", itemName || null);
        enemy.setData("spawnX", x); // Store initial spawn column for soliderB direction
        enemy.setData("frames", frames);
        enemy.setData("animIdx", 0);
        enemy.setData("animTimer", 0);
        enemy.setData("projData", data.bulletData || data.projectileData || null);

        this.enemies.push(enemy);
        return enemy;
    }

    enemyWave() {
        if (this.waveCount >= this.stageEnemyPositionList.length) {
            this.bossAdd();
            return;
        }

        var row = this.stageEnemyPositionList[this.waveCount] || [];

        for (var i = 0; i < row.length; i++) {
            var code = String(row[i]);
            if (code === "00") continue;

            var enemyType = code.substr(0, 1);
            var itemCode = code.substr(1, 1);
            var dataKey = "enemy" + enemyType;
            var enemyData = this.recipe.enemyData ? this.recipe.enemyData[dataKey] : null;
            if (!enemyData) continue;

            var itemName = null;
            switch (itemCode) {
            case "1": itemName = PLAYER_STATES.SHOOT_NAME_BIG; break;
            case "2": itemName = PLAYER_STATES.SHOOT_NAME_3WAY; break;
            case "3": itemName = PLAYER_STATES.SHOOT_SPEED_HIGH; break;
            case "9": itemName = PLAYER_STATES.BARRIER; break;
            }

            this.createEnemy(enemyData, 32 * i + 16, -16, itemName);
        }

        this.waveCount++;
    }

    bossAdd() {
        if (this.bossActive) return;
        this.bossActive = true;
        this.bossEntering = true;
        this.enemyWaveFlg = false;

        var stageId = gameState.stageId || 0;
        this.bossStageId = stageId;
        var bossData = this.recipe.bossData ? this.recipe.bossData["boss" + String(stageId)] : null;
        if (!bossData) {
            this.stageClear();
            return;
        }

        this.bossHp = bossData.hp || 100;
        this.bossMaxHp = this.bossHp;
        this.bossScore = bossData.score || 5000;
        this.bossInterval = bossData.interval || 60;
        this.bossIntervalCnt = 0;
        this.bossIntervalCounter = 0;
        this.bossName = bossData.name || "boss";
        this.bossProjCnt = 0;

        // Store all projectile data variants for boss-specific patterns
        this.bossProjDataA = bossData.bulletDataA || bossData.projectileDataA || null;
        this.bossProjDataB = bossData.bulletDataB || bossData.projectileDataB || null;
        this.bossProjDataC = bossData.bulletDataC || bossData.projectileDataC || null;
        // Fall back to bulletDataA when bulletData is absent (stages 2-4)
        this.bossProjData = bossData.bulletData || bossData.projectileData || this.bossProjDataA;

        var bossFrames = (bossData.anim && bossData.anim.idle) || bossData.texture || [];
        var bossFrame = bossFrames[0] || "bison_idle0.gif";

        this.bossSprite = this.add.sprite(GCX, -50, "game_asset", bossFrame);
        this.bossSprite.setOrigin(0.5);
        this.bossSprite.setDepth(45);
        this.bossSprite.setData("type", "boss");
        this.bossSprite.setData("hp", this.bossHp);
        this.bossSprite.setData("frames", bossFrames);
        this.bossSprite.setData("animIdx", 0);
        this.bossSprite.setData("animTimer", 0);
        this.bossSprite.setData("projData", this.bossProjData);
        this.bossSprite.setData("score", this.bossScore);
        this.bossSprite.setData("spgage", bossData.spgage || 5);

        this.enemies.push(this.bossSprite);

        var self = this;

        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_add";
        this.playSound(voiceKey, 0.7);

        this.tweens.add({
            targets: this.bossSprite,
            y: 80,
            duration: 2000,
            ease: "Quint.easeOut",
            onComplete: function () {
                self.bossEntering = false;
                self.bossTimerCountDown = 99;
                self.bossTimerFrameCnt = 0;

                // Start boss attack patterns after a brief pause
                self.time.delayedCall(1500, function () {
                    self.bossShootStart();
                });

                self.time.delayedCall(3000, function () {
                    self.bossTimerStartFlg = true;
                    self.bossTimerLabel.setVisible(true);
                    self.bossTimerNum.container.setVisible(true);
                    self.spBtn.setAlpha(1);
                });
            },
        });

        this.stageEndBg.setVisible(true);
        this.tweens.add({
            targets: this.stageEndBg,
            y: 0,
            duration: 3000,
        });
    }

    bossShoot() {
        if (!this.bossSprite || !this.bossSprite.active || this.bossEntering) return;

        var stageId = this.bossStageId;

        switch (stageId) {
        case 0:
            // Bison: melee-only, no projectiles (PIXI BossBison.js)
            return;
        case 1:
            // Barlog: projectiles go straight down (PIXI default case rotX=0,rotY=1)
            this.bossShootStraight(this.bossProjData);
            break;
        case 2:
            // Sagat: alternating aimed and spread with two projectile types
            this.bossProjCnt++;
            if (this.bossProjCnt % 4 === 0) {
                this.bossShootSpread(this.bossProjDataB || this.bossProjData, 5, 20);
            } else {
                this.bossShootAimed(this.bossProjDataA || this.bossProjData);
            }
            break;
        case 3:
            // Vega: radial burst every 5th shot, else aimed with two projectile types
            this.bossProjCnt++;
            if (this.bossProjCnt % 5 === 0) {
                this.bossShootRadial(this.bossProjDataB || this.bossProjData, 12);
            } else {
                this.bossShootAimed(this.bossProjDataA || this.bossProjData);
            }
            break;
        case 4:
            // Fang: rapid spread + radial combo with two projectile types
            this.bossProjCnt++;
            if (this.bossProjCnt % 6 === 0) {
                this.bossShootRadial(this.bossProjDataB || this.bossProjData, 18);
            } else if (this.bossProjCnt % 3 === 0) {
                this.bossShootSpread(this.bossProjDataA || this.bossProjData, 5, 15);
            } else {
                this.bossShootAimed(this.bossProjDataA || this.bossProjData);
            }
            break;
        default:
            this.bossShootAimed(this.bossProjData);
            break;
        }
    }

    // PIXI default projectile: rotX=0, rotY=1 (straight down)
    // Used by Barlog and any boss whose projectileData.name is not special
    bossShootStraight(projData) {
        if (!projData || !this.bossSprite) return;

        var frames = projData.texture || [];
        var frameKey = frames[0] || "normalProjectile0.gif";
        var speed = projData.speed || 1;

        var bullet = this.add.sprite(this.bossSprite.x, this.bossSprite.y + 20, "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(41);
        bullet.setData("speed", speed);
        bullet.setData("damage", projData.damage || 1);
        bullet.setData("hp", projData.hp || 1);
        bullet.setData("score", projData.score || 0);
        bullet.setData("spgage", projData.spgage || 0);
        bullet.setData("rotX", 0);
        bullet.setData("rotY", 1);

        // Animate projectile frames if available
        if (frames.length > 1) {
            bullet.setData("frames", frames);
            bullet.setData("animIdx", 0);
            bullet.setData("animTimer", 0);
        }

        this.enemyBullets.push(bullet);
    }

    bossShootAimed(projData) {
        if (!projData || !this.bossSprite) return;

        var frames = projData.texture || [];
        var frameKey = frames[0] || "normalProjectile0.gif";
        var speed = projData.speed || 1;

        var bullet = this.add.sprite(this.bossSprite.x, this.bossSprite.y + 20, "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(41);
        bullet.setData("speed", speed);
        bullet.setData("damage", projData.damage || 1);
        bullet.setData("hp", projData.hp || 1);
        bullet.setData("score", projData.score || 0);
        bullet.setData("spgage", projData.spgage || 0);

        var dx = this.playerSprite.x - this.bossSprite.x;
        var dy = this.playerSprite.y - this.bossSprite.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;

        bullet.setData("rotX", dx / dist);
        bullet.setData("rotY", dy / dist);

        this.enemyBullets.push(bullet);
    }

    bossShootSpread(projData, count, angleDeg) {
        if (!projData || !this.bossSprite) return;

        var frames = projData.texture || [];
        var frameKey = frames[0] || "normalProjectile0.gif";
        var speed = projData.speed || 1;

        var dx = this.playerSprite.x - this.bossSprite.x;
        var dy = this.playerSprite.y - this.bossSprite.y;
        var baseAngle = Math.atan2(dy, dx);
        var spreadRad = angleDeg * Math.PI / 180;
        var half = Math.floor(count / 2);

        for (var i = 0; i < count; i++) {
            var offset = (i - half) * (spreadRad / Math.max(count - 1, 1));
            var angle = baseAngle + offset;

            var bullet = this.add.sprite(this.bossSprite.x, this.bossSprite.y + 20, "game_asset", frameKey);
            bullet.setOrigin(0.5);
            bullet.setDepth(41);
            bullet.setData("speed", speed);
            bullet.setData("damage", projData.damage || 1);
            bullet.setData("hp", projData.hp || 1);
            bullet.setData("score", projData.score || 0);
            bullet.setData("spgage", projData.spgage || 0);
            bullet.setData("rotX", Math.cos(angle));
            bullet.setData("rotY", Math.sin(angle));

            this.enemyBullets.push(bullet);
        }
    }

    bossShootRadial(projData, count) {
        if (!projData || !this.bossSprite) return;

        var frames = projData.texture || [];
        var frameKey = frames[0] || "normalProjectile0.gif";
        var speed = (projData.speed || 1) * 0.8;

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var bullet = this.add.sprite(this.bossSprite.x, this.bossSprite.y, "game_asset", frameKey);
            bullet.setOrigin(0.5);
            bullet.setDepth(41);
            bullet.setData("speed", speed);
            bullet.setData("damage", projData.damage || 1);
            bullet.setData("hp", projData.hp || 1);
            bullet.setData("score", projData.score || 0);
            bullet.setData("spgage", projData.spgage || 0);
            bullet.setData("rotX", Math.cos(angle));
            bullet.setData("rotY", Math.sin(angle));

            this.enemyBullets.push(bullet);
        }
    }

    enemyDie(enemy, isSp) {
        if (!enemy || !enemy.active) return;

        var score = enemy.getData("score") || 100;
        var spgage = enemy.getData("spgage") || 1;

        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        var ratio = Math.max(1, Math.ceil(this.comboCount / 10));
        this.scoreCount += score * ratio;
        this.comboTimeCnt = 100;

        if (!isSp) {
            this.spGauge = Math.min(100, this.spGauge + spgage);
            this.updateSpGauge();
            if (this.spGauge >= 100) {
                this.spBtn.setAlpha(1);
            }
        }

        var itemName = enemy.getData("itemName");
        if (itemName) {
            this.dropItem(enemy.x, enemy.y, itemName);
        }

        this.showExplosion(enemy.x, enemy.y);
        this.showScorePopup(enemy.x, enemy.y, score * ratio);
        this.playSound("se_explosion", 0.35);

        var idx = this.enemies.indexOf(enemy);
        if (idx >= 0) this.enemies.splice(idx, 1);
        enemy.destroy();
    }

    showExplosion(x, y) {
        // 7-frame animated explosion matching PIXI (animationSpeed=0.4 at 120fps ≈ 48fps)
        if (!this.anims.exists("explosion_anim")) {
            var frames = [];
            for (var i = 0; i < 7; i++) {
                frames.push({ key: "game_asset", frame: "explosion0" + i + ".gif" });
            }
            this.anims.create({
                key: "explosion_anim",
                frames: frames,
                frameRate: 48,
                repeat: 0,
            });
        }
        var ex = this.add.sprite(x, y, "game_asset", "explosion00.gif");
        ex.setOrigin(0.5);
        ex.setDepth(60);
        ex.play("explosion_anim");
        ex.once("animationcomplete", function () {
            ex.destroy();
        });
    }

    showScorePopup(x, y, score) {
        var txt = this.add.text(x, y, String(score), {
            fontFamily: "Arial",
            fontSize: "10px",
            fontStyle: "bold",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 2,
        });
        txt.setOrigin(0.5);
        txt.setDepth(110);
        this.tweens.add({
            targets: txt,
            y: y - 20,
            alpha: 0,
            duration: 800,
            onComplete: function () { txt.destroy(); },
        });
    }

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

    playerDamage(amount) {
        if (this.barrierActive) return;

        this.playerHp -= amount;
        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.playerDie();
        }

        this.hpBar.setScale(Math.max(0, this.playerHp / this.playerMaxHp), 1);
        this.playSound("se_damage", 0.15);
        this.playSound("g_damage_voice", 0.5);

        this.cameras.main.shake(150, 0.01);

        this.tweens.add({
            targets: this.hudBg,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2,
        });

        // Flash player sprite on damage
        this.tweens.add({
            targets: this.playerSprite,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 3,
        });
    }

    playerDie() {
        if (this.playerDead) return;
        this.playerDead = true;
        this.gameStarted = false;

        this.showExplosion(this.playerSprite.x, this.playerSprite.y);
        this.playerSprite.setVisible(false);

        gameState.maxCombo = Math.max(gameState.maxCombo || 0, this.maxCombo);

        var self = this;
        this.time.delayedCall(2000, function () {
            gameState.score = self.scoreCount;
            gameState.spgage = self.spGauge;
            self.stopAllSounds();
            self.scene.start("PhaserContinueScene");
        });
    }

    stageClear() {
        if (this.stageCleared) return;
        this.stageCleared = true;
        this.gameStarted = false;

        gameState.score = this.scoreCount;
        gameState.playerHp = this.playerHp;
        gameState.spgage = this.spGauge;
        gameState.maxCombo = Math.max(gameState.maxCombo || 0, this.maxCombo);

        if (this.spFiredDuringBoss) {
            gameState.akebonoCnt = (gameState.akebonoCnt || 0) + 1;
        }

        var self = this;

        var clearText = this.add.text(GCX, GCY, "STAGE CLEAR!", {
            fontFamily: "sans-serif",
            fontSize: "20px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3,
        });
        clearText.setOrigin(0.5);
        clearText.setDepth(200);

        this.playSound("voice_ko", 0.7);

        this.time.delayedCall(2500, function () {
            self.stopAllSounds();
            gameState.stageId++;
            self.scene.start("PhaserAdvScene");
        });
    }

    timeoverComplete() {
        gameState.score = this.scoreCount;
        gameState.maxCombo = Math.max(gameState.maxCombo || 0, this.maxCombo);

        // Show TIME OVER text
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
        this.time.delayedCall(2500, function () {
            self.stopAllSounds();
            self.scene.start("PhaserContinueScene");
        });
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
        try {
            this.sound.stopAll();
        } catch (e) {}
    }

    // -----------------------------------------------------------------------
    // Fixed-timestep game loop (matches PIXI's 120-Hz accumulator exactly)
    // -----------------------------------------------------------------------
    // PIXI BaseScene._onTick does:
    //   this._accumulator += Math.min((delta||0) * 2, 8);   // delta normalised to 60fps
    //   while (this._accumulator >= 1) { this._accumulator -= 1; this.loop(1); }
    // That fires loop(1) at 120 logical fps regardless of display Hz.
    //
    // We replicate the same pattern using Phaser's ms-based delta.
    // STEP = 1000/120 = 8.3333 ms per logical frame.
    // -----------------------------------------------------------------------

    update(time, delta) {
        var STEP = 8.333333;                          // 1000 / 120
        this._accumulator = (this._accumulator || 0) + Math.min(delta, 66.67);
        while (this._accumulator >= STEP) {
            this._accumulator -= STEP;
            this.fixedUpdate(time, STEP);
        }
    }

    fixedUpdate(time, step) {
        if (this.stageBg && !this.playerDead && !this.stageCleared) {
            // Stop background scrolling once boss phase starts
            if (!this.bossActive) {
                var bgMove = this.gameStarted ? (this.stageBgAmountMove || 0.7) : 0.7;
                this.stageBg.tilePositionY -= bgMove;
            }
        }

        if (!this.gameStarted) return;
        if (this.playerDead || this.stageCleared) return;

        // Handle keyboard input every logical frame
        this.handleKeyboardInput();

        if (this.theWorldFlg) {
            this.updateHUD();
            this.updateBossHpBar();
            return;
        }

        // Frame-based shoot timer (matching PIXI: bulletFrameCnt % interval == 0)
        this.shootTimer += 1;
        var interval = this.shootSpeed === "speed_high" ? Math.floor(this.shootInterval * 0.6) : this.shootInterval;
        if (this.shootTimer >= interval) {
            this.shootTimer = 0;
            this.shoot();
        }

        for (var b = this.playerBullets.length - 1; b >= 0; b--) {
            var bullet = this.playerBullets[b];
            if (!bullet.active) {
                this.playerBullets.splice(b, 1);
                continue;
            }

            var angle = bullet.getData("angle") || 0;
            bullet.y -= 3.5;
            bullet.x += angle * 3.5;

            if (bullet.y < -20) {
                bullet.destroy();
                this.playerBullets.splice(b, 1);
            }
        }

        for (var e = this.enemies.length - 1; e >= 0; e--) {
            var enemy = this.enemies[e];
            if (!enemy || !enemy.active) {
                this.enemies.splice(e, 1);
                continue;
            }

            var isBoss = enemy.getData("type") === "boss";

            if (!isBoss) {
                var speed = enemy.getData("speed") || 0.8;
                enemy.y += speed;

                // PIXI soliderB: starts off-screen to one side, moves horizontally
                // across screen once past 1/3 height (app-original.js lines 3586-3590)
                var enemyName = enemy.getData("name");
                if (enemyName === "soliderB") {
                    if (!enemy.getData("posName")) {
                        // First-frame positioning: push to screen edge
                        if ((enemy.getData("spawnX") || 0) >= GW / 2) {
                            enemy.x = GW;
                            enemy.setData("posName", "right");
                        } else {
                            enemy.x = -enemy.width;
                            enemy.setData("posName", "left");
                        }
                    }
                    if (enemy.y >= GH / 3) {
                        if (enemy.getData("posName") === "right") {
                            enemy.x -= 1;
                        } else {
                            enemy.x += 1;
                        }
                    }
                }

                var shootCnt = enemy.getData("shootCnt") + 1;
                enemy.setData("shootCnt", shootCnt);
                var shootInterval = enemy.getData("interval") || 300;
                if (shootInterval > 0 && shootCnt >= shootInterval) {
                    enemy.setData("shootCnt", shootCnt - shootInterval);
                    // Only shoot when enemy is above the player (not from the side or past)
                    if (enemy.y < this.playerSprite.y - 20) {
                        this.enemyShoot(enemy);
                    }
                }
            } else {
                // Boss movement is driven by bossShootStart() pattern timelines
                // (no per-frame sine-wave or interval shooting here)

                if (!this.bossSprite || !this.bossSprite.active) {
                    this.enemies.splice(e, 1);
                    continue;
                }
            }

            var animFrames = enemy.getData("frames");
            if (animFrames && animFrames.length > 1) {
                var animTimer = enemy.getData("animTimer") + step;
                enemy.setData("animTimer", animTimer);
                if (animTimer > 150) {
                    enemy.setData("animTimer", 0);
                    var animIdx = (enemy.getData("animIdx") + 1) % animFrames.length;
                    enemy.setData("animIdx", animIdx);
                    try {
                        enemy.setFrame(animFrames[animIdx]);
                    } catch (err) {}
                }
            }

            var eRect = { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2, w: enemy.width, h: enemy.height };

            for (var bb = this.playerBullets.length - 1; bb >= 0; bb--) {
                var pb = this.playerBullets[bb];
                if (!pb || !pb.active) continue;

                var bRect = { x: pb.x - pb.width / 2, y: pb.y - pb.height / 2, w: pb.width, h: pb.height };

                // Boss is invulnerable during entry tween
                if (isBoss && this.bossEntering) continue;

                if (enemy.y >= 40 && rectOverlap(eRect, bRect)) {
                    var applyDamage = true;

                    // PIXI SHOOT_BIG rate-limiting: max 2 damage per bullet per enemy,
                    // with 15-frame cooldown between hits (app-original.js lines 7124-7131)
                    if (this.shootMode === "big") {
                        var bid = pb.getData("bulletId");
                        var bkey = "bulletid_" + bid;
                        var bfkey = "bulletframeCnt_" + bid;
                        var prevHit = enemy.getData(bkey);
                        if (prevHit == null) {
                            // First contact with this bullet
                            enemy.setData(bkey, 0);
                            enemy.setData(bfkey, 0);
                        } else {
                            // Already hit before — rate limit
                            var fc = (enemy.getData(bfkey) || 0) + 1;
                            enemy.setData(bfkey, fc);
                            if (fc % 15 === 0) {
                                var hitCnt = (enemy.getData(bkey) || 0) + 1;
                                enemy.setData(bkey, hitCnt);
                                if (hitCnt > 1) {
                                    applyDamage = false; // Max 2 hits (0 and 1)
                                }
                            } else {
                                applyDamage = false;
                            }
                        }
                    }

                    if (applyDamage) {
                        var dmg = pb.getData("damage") || 1;
                        var ehp = enemy.getData("hp") - dmg;
                        enemy.setData("hp", ehp);

                        if (isBoss) {
                            this.bossHp = ehp;
                            this.checkBossDanger();
                        }

                        if (ehp <= 0) {
                            if (isBoss) {
                                this.bossDie(enemy);
                            } else {
                                this.enemyDie(enemy, false);
                            }
                            break;
                        }
                    }

                    if (this.shootMode !== "big") {
                        pb.destroy();
                        this.playerBullets.splice(bb, 1);
                    }
                }
            }

            if (!enemy.active) continue;

            if (this.barrierActive && this.barrierSprite) {
                var barRect = { x: this.barrierSprite.x - 20, y: this.barrierSprite.y - 20, w: 40, h: 40 };
                if (rectOverlap(eRect, barRect) && !isBoss) {
                    this.enemyDie(enemy, false);
                    continue;
                }
            }

            var pRect = { x: this.playerSprite.x - 8, y: this.playerSprite.y - 16, w: 16, h: 32 };
            if (rectOverlap(eRect, pRect) && !isBoss) {
                this.playerDamage(1);
                this.enemyDie(enemy, false);
                continue;
            }

            if (!isBoss && (enemy.y > GH + 20 || enemy.x < -40 || enemy.x > GW + 40)) {
                var idx = this.enemies.indexOf(enemy);
                if (idx >= 0) this.enemies.splice(idx, 1);
                enemy.destroy();
            }
        }

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

            // Player bullets can destroy enemy bullets (matching PIXI behaviour)
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
                            this.showScorePopup(eBullet.x, eBullet.y, ebScore * ebRatio);
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

            var ebRect = { x: eBullet.x - eBullet.width / 2, y: eBullet.y - eBullet.height / 2, w: eBullet.width, h: eBullet.height };
            var pRect2 = { x: this.playerSprite.x - 8, y: this.playerSprite.y - 16, w: 16, h: 32 };

            if (rectOverlap(ebRect, pRect2)) {
                var edamage = eBullet.getData("damage") || 1;
                this.playerDamage(edamage);
                eBullet.destroy();
                this.enemyBullets.splice(eb, 1);
            }
        }

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

        if (this.enemyWaveFlg) {
            this.enemyWaveFrameCounter += 1;
            if (this.enemyWaveFrameCounter >= this.waveInterval) {
                this.enemyWaveFrameCounter -= this.waveInterval;
                this.enemyWave();
            }
        }

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

        this.comboTimeCnt -= 0.1;
        if (this.comboTimeCnt <= 0) {
            this.comboTimeCnt = 0;
            this.comboCount = 0;
        }

        if (this.barrierActive) {
            this.barrierTimer -= step / 1000;
            if (this.barrierTimer <= 0) {
                this.barrierActive = false;
                if (this.barrierSprite) {
                    this.barrierSprite.destroy();
                    this.barrierSprite = null;
                }
                this.playSound("se_barrier_end", 0.9);
            } else if (this.barrierSprite) {
                this.barrierSprite.x = this.playerSprite.x;
                this.barrierSprite.y = this.playerSprite.y;
            }
        }

        // Player animation is handled by Phaser's anim system (player_walk)

        this.updateHUD();
        this.updateBossHpBar();
    }

    enemyShoot(enemy) {
        var projData = enemy.getData("projData");
        if (!projData) return;

        var frames = projData.texture || [];
        var frameKey = frames[0] || "normalProjectile0.gif";
        var speed = projData.speed || 1;

        var bullet = this.add.sprite(enemy.x, enemy.y + (enemy.height / 2), "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(41);
        bullet.setData("speed", speed);
        bullet.setData("damage", projData.damage || 1);
        bullet.setData("hp", projData.hp || 1);
        bullet.setData("score", projData.score || 0);
        bullet.setData("spgage", projData.spgage || 0);

        var enemyName = String(enemy.getData("name") || "").toLowerCase();
        if (enemyName === "solidera" || enemyName === "soldiera") {
            bullet.setData("rotX", 0);
            bullet.setData("rotY", 1);
        } else {
            var dx = this.playerSprite.x - enemy.x;
            var dy = this.playerSprite.y - enemy.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;

            bullet.setData("rotX", dx / dist);
            bullet.setData("rotY", dy / dist);
        }

        this.enemyBullets.push(bullet);
    }

    // -----------------------------------------------------------------------
    // Boss attack pattern system (replaces sine-wave BOSS_PATTERNS)
    // Each boss has 2–3 seed-based patterns matching the PIXI TimelineMax
    // timelines.  Movement and shooting are tightly coupled: the boss moves
    // to a position, fires, then picks the next pattern.
    // -----------------------------------------------------------------------

    _bossAlive() {
        return this.bossSprite && this.bossSprite.active && !this.stageCleared && !this.playerDead;
    }

    bossShootStart() {
        if (!this._bossAlive() || this.theWorldFlg) {
            // Retry after SP freeze ends
            if (this.theWorldFlg && this._bossAlive()) {
                var self = this;
                this.time.delayedCall(500, function () { self.bossShootStart(); });
            }
            return;
        }
        var seed = Math.random();
        switch (this.bossStageId) {
        case 0: this.bossPatternBison(seed); break;
        case 1: this.bossPatternBarlog(seed); break;
        case 2: this.bossPatternSagat(seed); break;
        case 3: this.bossPatternVega(seed); break;
        case 4: this.bossPatternFang(seed); break;
        default: this.bossPatternBison(seed); break;
        }
    }

    // --- Bison (stage 0) ---------------------------------------------------
    bossPatternBison(seed) {
        var self = this;
        var boss = this.bossSprite;
        var baseY = 80;
        var downY = GH - 60;

        if (seed < 0.6) {
            // Pattern A — random X, rise, dive down, return
            var targetX = clamp(Math.random() * GW, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: targetX, duration: 300,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    self.tweens.add({
                        targets: boss, y: baseY - 10, duration: 500,
                        onComplete: function () {
                            if (!self._bossAlive()) return;
                            // Bison is melee-only — no projectiles (PIXI BossBison.js)
                            self.tweens.add({
                                targets: boss, y: downY, duration: 350,
                                onComplete: function () {
                                    if (!self._bossAlive()) return;
                                    self.tweens.add({
                                        targets: boss, y: baseY, duration: 200,
                                        onComplete: function () {
                                            self.time.delayedCall(500, function () { self.bossShootStart(); });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        } else if (seed < 0.8) {
            // Pattern B — zigzag left-right then dive (faint pattern)
            var steps = [
                { x: 30, y: baseY - 20, d: 400 },
                { x: GW - 60, y: baseY, d: 400 },
                { x: 30, y: baseY + 30, d: 400 },
                { x: GW - 60, y: baseY + 60, d: 400 },
            ];
            var idx = 0;
            var runStep = function () {
                if (!self._bossAlive() || idx >= steps.length) {
                    if (!self._bossAlive()) return;
                    // Bison is melee-only — no projectiles (PIXI BossBison.js)
                    self.tweens.add({
                        targets: boss, y: downY, duration: 300,
                        onComplete: function () {
                            if (!self._bossAlive()) return;
                            self.tweens.add({
                                targets: boss, y: baseY, duration: 200,
                                onComplete: function () {
                                    self.time.delayedCall(500, function () { self.bossShootStart(); });
                                },
                            });
                        },
                    });
                    return;
                }
                var s = steps[idx++];
                self.tweens.add({
                    targets: boss, x: s.x, y: s.y, duration: s.d,
                    onComplete: function () {
                        self.time.delayedCall(100, runStep);
                    },
                });
            };
            runStep();
        } else {
            // Pattern C — mirror zigzag (starts from right)
            var steps2 = [
                { x: GW - 30, y: baseY - 20, d: 400 },
                { x: 60, y: baseY, d: 400 },
                { x: GW - 30, y: baseY + 30, d: 400 },
                { x: 60, y: baseY + 60, d: 400 },
            ];
            var idx2 = 0;
            var runStep2 = function () {
                if (!self._bossAlive() || idx2 >= steps2.length) {
                    if (!self._bossAlive()) return;
                    // Bison is melee-only — no projectiles (PIXI BossBison.js)
                    self.tweens.add({
                        targets: boss, y: downY, duration: 300,
                        onComplete: function () {
                            if (!self._bossAlive()) return;
                            self.tweens.add({
                                targets: boss, y: baseY, duration: 200,
                                onComplete: function () {
                                    self.time.delayedCall(500, function () { self.bossShootStart(); });
                                },
                            });
                        },
                    });
                    return;
                }
                var s = steps2[idx2++];
                self.tweens.add({
                    targets: boss, x: s.x, y: s.y, duration: s.d,
                    onComplete: function () {
                        self.time.delayedCall(100, runStep2);
                    },
                });
            };
            runStep2();
        }
    }

    // --- Barlog (stage 1) --------------------------------------------------
    bossPatternBarlog(seed) {
        var self = this;
        var boss = this.bossSprite;
        var baseY = 80;
        var diveY = GH - 40;

        if (seed < 0.3) {
            // Pattern A — random movement to a position, shoot straight down
            var rx = clamp(Math.random() * GW, 30, GW - 30);
            var ry = clamp(60 + Math.random() * 120, 60, 200);
            this.tweens.add({
                targets: boss, x: rx, y: ry, duration: 600,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    // PIXI: Barlog projectiles go straight down (default case rotX=0,rotY=1)
                    self.bossShootStraight(self.bossProjData);
                    self.time.delayedCall(600, function () { self.bossShootStart(); });
                },
            });
        } else if (seed < 0.8) {
            // Pattern B — approach player X, shoot straight down, return
            var px = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: px, duration: 300,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    self.time.delayedCall(400, function () {
                        if (!self._bossAlive()) return;
                        // PIXI: Barlog projectiles go straight down
                        self.bossShootStraight(self.bossProjData);
                        self.time.delayedCall(500, function () { self.bossShootStart(); });
                    });
                },
            });
        } else {
            // Pattern C — charge dive toward player then return
            var px2 = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: px2, duration: 500,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    // PIXI: Barlog projectiles go straight down
                    self.bossShootStraight(self.bossProjData);
                    self.tweens.add({
                        targets: boss, y: baseY - 70, duration: 300,
                        onComplete: function () {
                            if (!self._bossAlive()) return;
                            self.tweens.add({
                                targets: boss, y: diveY, duration: 600,
                                onComplete: function () {
                                    if (!self._bossAlive()) return;
                                    self.tweens.add({
                                        targets: boss, y: baseY, duration: 200,
                                        onComplete: function () {
                                            self.time.delayedCall(500, function () { self.bossShootStart(); });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        }
    }

    // --- Sagat (stage 2) ---------------------------------------------------
    bossPatternSagat(seed) {
        var self = this;
        var boss = this.bossSprite;
        var baseY = 80;
        var diveY = GH - 40;
        var projA = this.bossProjDataA || this.bossProjData;
        var projB = this.bossProjDataB || this.bossProjData;

        if (seed < 0.3) {
            // Pattern A — horizontal sweep with shots at each position
            var positions = [-20, 10, 50, 100, 150, 200];
            var pi = 0;
            var sweepStep = function () {
                if (!self._bossAlive() || pi >= positions.length) {
                    if (self._bossAlive()) {
                        self.time.delayedCall(500, function () { self.bossShootStart(); });
                    }
                    return;
                }
                var px = clamp(positions[pi], 20, GW - 20);
                pi++;
                self.tweens.add({
                    targets: boss, x: px, duration: 250,
                    onComplete: function () {
                        if (!self._bossAlive()) return;
                        self.bossShootAimed(projA);
                        self.time.delayedCall(250, sweepStep);
                    },
                });
            };
            sweepStep();
        } else if (seed < 0.6) {
            // Pattern B — rapid barrage from current position
            var px3 = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: px3, duration: 250,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    var shotCount = 0;
                    self.time.addEvent({
                        delay: 200, repeat: 6,
                        callback: function () {
                            if (!self._bossAlive()) return;
                            self.bossShootAimed(projA);
                            shotCount++;
                            if (shotCount >= 7) {
                                self.time.delayedCall(500, function () { self.bossShootStart(); });
                            }
                        },
                    });
                },
            });
        } else if (seed < 0.8) {
            // Pattern C — big projectile
            var px4 = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: px4, duration: 250,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    self.time.delayedCall(500, function () {
                        if (!self._bossAlive()) return;
                        self.bossShootSpread(projB, 5, 20);
                        self.time.delayedCall(800, function () { self.bossShootStart(); });
                    });
                },
            });
        } else {
            // Pattern D — Tiger Knee dive
            var px5 = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, x: px5, y: baseY - 20, duration: 400,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    self.bossShootAimed(projA);
                    self.time.delayedCall(500, function () {
                        if (!self._bossAlive()) return;
                        self.tweens.add({
                            targets: boss, y: diveY, duration: 300,
                            onComplete: function () {
                                if (!self._bossAlive()) return;
                                self.tweens.add({
                                    targets: boss, y: baseY, duration: 200,
                                    onComplete: function () {
                                        self.time.delayedCall(400, function () { self.bossShootStart(); });
                                    },
                                });
                            },
                        });
                    });
                },
            });
        }
    }

    // --- Vega (stage 3) ----------------------------------------------------
    bossPatternVega(seed) {
        var self = this;
        var boss = this.bossSprite;
        var baseY = 80;
        var diveY = GH - 20;
        var projA = this.bossProjDataA || this.bossProjData;
        var projB = this.bossProjDataB || this.bossProjData;

        if (seed < 0.1) {
            // Pattern A — teleport warp to 3 positions (no shots)
            var warpPositions = [
                30,
                GW - 30,
                clamp(Math.random() * GW, 30, GW - 30),
            ];
            var wi = 0;
            var warpStep = function () {
                if (!self._bossAlive() || wi >= warpPositions.length) {
                    if (self._bossAlive()) {
                        self.time.delayedCall(500, function () { self.bossShootStart(); });
                    }
                    return;
                }
                // Flash out
                self.tweens.add({
                    targets: boss, alpha: 0, duration: 100,
                    onComplete: function () {
                        if (!self._bossAlive()) return;
                        boss.x = warpPositions[wi++];
                        self.tweens.add({
                            targets: boss, alpha: 1, duration: 100,
                            onComplete: function () {
                                self.time.delayedCall(200, warpStep);
                            },
                        });
                    },
                });
            };
            warpStep();
        } else if (seed < 0.4) {
            // Pattern B — multi-position psycho shots (warp between positions)
            var shotPositions = [30, GW - 60, 50, GCX, GW - 40, 60, GCX];
            var si = 0;
            var psychoStep = function () {
                if (!self._bossAlive() || si >= shotPositions.length) {
                    if (self._bossAlive()) {
                        self.time.delayedCall(800, function () { self.bossShootStart(); });
                    }
                    return;
                }
                // Warp to position
                self.tweens.add({
                    targets: boss, alpha: 0, duration: 100,
                    onComplete: function () {
                        if (!self._bossAlive()) return;
                        boss.x = shotPositions[si++];
                        self.tweens.add({
                            targets: boss, alpha: 1, duration: 100,
                            onComplete: function () {
                                if (!self._bossAlive()) return;
                                self.bossShootAimed(projA);
                                self.time.delayedCall(300, psychoStep);
                            },
                        });
                    },
                });
            };
            psychoStep();
        } else if (seed < 0.7) {
            // Pattern C — psycho field: move to center, rapid fire
            this.tweens.add({
                targets: boss, x: GCX, y: baseY + 10, duration: 300,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    var fieldCount = 0;
                    self.time.addEvent({
                        delay: 300, repeat: 4,
                        callback: function () {
                            if (!self._bossAlive()) return;
                            self.bossShootRadial(projB, 12);
                            fieldCount++;
                            if (fieldCount >= 5) {
                                self.time.delayedCall(800, function () { self.bossShootStart(); });
                            }
                        },
                    });
                },
            });
        } else {
            // Pattern D — crusher dive: warp to player X, dive down, jump back
            var px6 = clamp(this.playerSprite.x, 30, GW - 30);
            this.tweens.add({
                targets: boss, alpha: 0, duration: 100,
                onComplete: function () {
                    if (!self._bossAlive()) return;
                    boss.x = px6;
                    self.tweens.add({
                        targets: boss, alpha: 1, y: baseY - 20, duration: 200,
                        onComplete: function () {
                            if (!self._bossAlive()) return;
                            self.bossShootSpread(projA, 3, 30);
                            self.tweens.add({
                                targets: boss, y: diveY, duration: 900,
                                onComplete: function () {
                                    if (!self._bossAlive()) return;
                                    // Jump back to top
                                    boss.x = GCX;
                                    boss.y = -50;
                                    self.tweens.add({
                                        targets: boss, y: baseY, duration: 1000,
                                        onComplete: function () {
                                            self.time.delayedCall(500, function () { self.bossShootStart(); });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        }
    }

    // --- Fang (stage 4) ----------------------------------------------------
    bossPatternFang(seed) {
        var self = this;
        var boss = this.bossSprite;
        var baseY = 60;
        var projA = this.bossProjDataA || this.bossProjData;
        var projB = this.bossProjDataB || this.bossProjData;
        var projC = this.bossProjDataC || this.bossProjData;

        if (seed < 0.3) {
            // Pattern A — rapid beam shots (3 volleys)
            var volleys = 0;
            var beamStep = function () {
                if (!self._bossAlive() || volleys >= 3) {
                    if (self._bossAlive()) {
                        self.time.delayedCall(1000, function () { self.bossShootStart(); });
                    }
                    return;
                }
                volleys++;
                self.bossShootSpread(projA, 3, 25);
                self.time.delayedCall(500, beamStep);
            };
            this.time.delayedCall(300, beamStep);
        } else if (seed < 0.7) {
            // Pattern B — meka attack: single large projectile
            this.bossShootRadial(projC || projA, 8);
            this.time.delayedCall(1500, function () { self.bossShootStart(); });
        } else {
            // Pattern C — smoke spray: rapid fire from shifting position
            var smokeCount = 0;
            var smokeTotal = 12;
            this.time.addEvent({
                delay: 300, repeat: smokeTotal - 1,
                callback: function () {
                    if (!self._bossAlive()) return;
                    // Slight horizontal drift while spraying
                    boss.x = clamp(boss.x + (Math.random() - 0.5) * 20, 30, GW - 30);
                    self.bossShootAimed(projB || projA);
                    smokeCount++;
                    if (smokeCount >= smokeTotal) {
                        self.time.delayedCall(1000, function () { self.bossShootStart(); });
                    }
                },
            });
        }
    }

    checkBossDanger() {
        if (this.bossDangerShown || !this.bossSprite || !this.bossSprite.active) return;
        var spDamage = this.recipe.playerData.spDamage || 50;
        if (this.bossHp <= spDamage) {
            this.bossDangerShown = true;

            // Create danger balloon sprite above boss (matches PIXI: boss_dengerous0-2.gif, 28x29px)
            var dangerBalloon = this.add.sprite(0, -this.bossSprite.height / 2 - 10, "game_asset", "boss_dengerous0.gif");
            dangerBalloon.setOrigin(0.5, 1);
            dangerBalloon.setDepth(46);
            dangerBalloon.setScale(0);
            this.bossSprite.dangerBalloon = dangerBalloon;

            // Elastic scale-in animation matching PIXI
            this.tweens.add({
                targets: dangerBalloon,
                scaleX: 1,
                scaleY: 1,
                duration: 1000,
                ease: "Back.easeOut",
            });

            // Animate through 3 danger frames
            var self = this;
            var dangerFrame = 0;
            this.time.addEvent({
                delay: 250,
                loop: true,
                callback: function () {
                    if (!dangerBalloon || !dangerBalloon.active) return;
                    dangerFrame = (dangerFrame + 1) % 3;
                    dangerBalloon.setFrame("boss_dengerous" + dangerFrame + ".gif");
                    // Keep position synced with boss
                    if (self.bossSprite && self.bossSprite.active) {
                        dangerBalloon.x = self.bossSprite.x;
                        dangerBalloon.y = self.bossSprite.y - self.bossSprite.height / 2 - 10;
                    }
                },
            });
        }
    }

    bossDie(boss) {
        if (this.stageCleared) return;

        this.bossTimerStartFlg = false;
        this.bossTimerLabel.setVisible(false);
        this.bossTimerNum.container.setVisible(false);
        this.theWorldFlg = true;

        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        var ratio = Math.max(1, Math.ceil(this.comboCount / 10));
        this.scoreCount += this.bossScore * ratio;

        this.showExplosion(boss.x, boss.y);
        this.showScorePopup(boss.x, boss.y, this.bossScore * ratio);

        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var stageId = gameState.stageId || 0;
        var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_ko";
        this.playSound(voiceKey, 0.9);
        this.playSound("se_finish_akebono", 0.9);

        // PIXI: if boss killed during SP move, show akebonofinish background
        // (akebonoBg0-2.gif animated at 0.7 speed, app-original.js lines 7526-7528)
        if (this.spFired) {
            this.showAkebonoFinish();
        }

        // Clean up danger balloon if present
        if (boss.dangerBalloon && boss.dangerBalloon.active) {
            boss.dangerBalloon.destroy();
        }

        var idx = this.enemies.indexOf(boss);
        if (idx >= 0) this.enemies.splice(idx, 1);
        boss.destroy();

        this.bossSprite = null;
        this.bossActive = false;
        this.bossDangerShown = false;
        this.bossHpBarBg.setVisible(false);
        this.bossHpBarFg.setVisible(false);

        for (var eb = this.enemyBullets.length - 1; eb >= 0; eb--) {
            if (this.enemyBullets[eb] && this.enemyBullets[eb].active) {
                this.enemyBullets[eb].destroy();
            }
        }
        this.enemyBullets = [];

        var self = this;
        // PIXI uses 2.5s delay before stageClear
        this.time.delayedCall(2500, function () {
            self.stageClear();
        });
    }

    showAkebonoFinish() {
        // PIXI: akebonoBg0-2.gif animated sprite at animationSpeed 0.7
        // Full-screen background (256x512) added to stage background layer
        if (!this.anims.exists("akebono_bg_anim")) {
            this.anims.create({
                key: "akebono_bg_anim",
                frames: [
                    { key: "game_ui", frame: "akebonoBg0.gif" },
                    { key: "game_ui", frame: "akebonoBg1.gif" },
                    { key: "game_ui", frame: "akebonoBg2.gif" },
                ],
                // PIXI animationSpeed 0.7 at 120fps base ≈ 0.7 * 24 = ~17fps
                frameRate: 17,
                repeat: -1,
            });
        }

        var akebonoBg = this.add.sprite(0, 0, "game_ui", "akebonoBg0.gif");
        akebonoBg.setOrigin(0, 0);
        akebonoBg.setDepth(5); // Above stage background, below enemies/player
        akebonoBg.play("akebono_bg_anim");
        this.akebonoBgSprite = akebonoBg;

        // PIXI title.akebonofinish(): show K.O. text with scale-in + sound
        this.playSound("voice_ko", 0.7);
    }

    collectItem(itemName) {
        this.playSound("g_powerup_voice", 0.55);

        switch (itemName) {
        case PLAYER_STATES.SHOOT_SPEED_HIGH:
            this.shootSpeed = "speed_high";
            break;
        case PLAYER_STATES.BARRIER:
            this.barrierActive = true;
            this.barrierTimer = 4;
            this.playSound("se_barrier_start", 0.9);
            if (this.barrierSprite) this.barrierSprite.destroy();
            this.barrierSprite = this.add.sprite(this.playerSprite.x, this.playerSprite.y, "game_asset", "barrier0.gif");
            this.barrierSprite.setOrigin(0.5);
            this.barrierSprite.setDepth(51);
            this.barrierSprite.setAlpha(0.6);
            break;
        case PLAYER_STATES.SHOOT_NAME_BIG:
            this.shootMode = "big";
            this.shootSpeed = "speed_normal";
            break;
        case PLAYER_STATES.SHOOT_NAME_3WAY:
            this.shootMode = "3way";
            this.shootSpeed = "speed_normal";
            break;
        default:
            this.shootMode = "normal";
            break;
        }
    }

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
        for (var i = 0; i < text.length; i++) {
            var frame = "comboNum" + text[i] + ".gif";
            try {
                var sprite = this.add.image(x, 0, "game_ui", frame);
                sprite.setOrigin(0, 0);
                this.comboNumContainer.add(sprite);
                this._comboNumSprites.push(sprite);
                x += sprite.width;
            } catch (e) {}
        }
    }

    // Sprite-based number display using smallNum0-9.gif (8×11px, 6px spacing)
    // Matches PIXI ei class: right-aligned, leading zeros at alpha=0.5
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
            // PIXI ei class: leading zeros (positions beyond the number length) get alpha=0.5
            sprites[i].setAlpha(i < text.length ? 1 : 0.5);
        }
    }

    // Sprite-based number display using bigNum0-9.gif (12×19px, 11px spacing)
    // Matches PIXI qt class: right-aligned, fixed maxDigit slots
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
