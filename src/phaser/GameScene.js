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

        this.scoreCount = 0;
        this.comboCount = 0;
        this.comboTimeCnt = 0;
        this.spGauge = 0;
        this.spFired = false;

        var stageId = gameState.stageId || 0;
        this.stageKey = "stage" + String(stageId);

        var enemyList = this.recipe[this.stageKey] ? this.recipe[this.stageKey].enemylist : [];
        this.stageEnemyPositionList = enemyList || [];

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
        this.bossName = "";

        this.showTitle();

        this.input.on("pointermove", this.onPointerMove, this);
        this.input.on("pointerdown", this.onPointerDown, this);
        this.input.on("pointerup", this.onPointerUp, this);

        this.isDragging = false;
        this.shootTimer = 0;
        this.shootInterval = this.recipe.playerData.shootNormal.interval || 23;
        this.shootMode = gameState.shootMode || "normal";
        this.shootSpeed = gameState.shootSpeed || "speed_normal";

        this.stageBgmName = "";
        this.playBossBgm(stageId);
    }

    playBossBgm(stageId) {
        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var name = bossNames[stageId] || "bison";
        var key = "boss_" + name + "_bgm";
        this.stageBgmName = key;
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

        this.scoreText = this.add.text(
            this.scoreLabel.x + this.scoreLabel.width + 2,
            25,
            "0",
            { fontFamily: "Arial", fontSize: "12px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 2 }
        );
        this.scoreText.setDepth(101);

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

        this.comboText = this.add.text(
            194, 19,
            "0",
            { fontFamily: "Arial", fontSize: "14px", fontStyle: "bold", color: "#ffff00", stroke: "#000000", strokeThickness: 2 }
        );
        this.comboText.setDepth(101);

        this.spGaugeBar = this.add.graphics();
        this.spGaugeBar.setDepth(102);
        this.updateSpGauge();

        this.spBtn = this.add.text(
            GW - 35, GCY + 20,
            "SP",
            { fontFamily: "Arial", fontSize: "14px", fontStyle: "bold", color: "#ff0000", backgroundColor: "#330000", padding: { x: 6, y: 4 } }
        );
        this.spBtn.setOrigin(0.5);
        this.spBtn.setDepth(103);
        this.spBtn.setInteractive({ useHandCursor: true });
        this.spBtn.setAlpha(0.3);
        this.spBtn.on("pointerup", this.onSpFire, this);

        this.bossTimerText = this.add.text(
            GCX, 60,
            "",
            { fontFamily: "Arial", fontSize: "16px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 2 }
        );
        this.bossTimerText.setOrigin(0.5, 0);
        this.bossTimerText.setDepth(101);
        this.bossTimerText.setVisible(false);
    }

    createCover() {
        this.coverOverlay = this.add.tileSprite(0, 0, GW, GH, "game_ui", "stagebgOver.gif");
        this.coverOverlay.setOrigin(0, 0);
        this.coverOverlay.setDepth(99);
    }

    showTitle() {
        var stageId = gameState.stageId || 0;
        var self = this;

        this.titleText = this.add.text(
            GCX, GCY - 40,
            "ROUND " + String(stageId + 1),
            { fontFamily: "sans-serif", fontSize: "24px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 3 }
        );
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(200);

        this.fightText = this.add.text(
            GCX, GCY + 10,
            "FIGHT!",
            { fontFamily: "sans-serif", fontSize: "18px", fontStyle: "bold", color: "#ff4444", stroke: "#000000", strokeThickness: 3 }
        );
        this.fightText.setOrigin(0.5);
        this.fightText.setDepth(200);
        this.fightText.setAlpha(0);

        this.playSound("voice_round" + String(Math.min(stageId, 3)), 0.7);

        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            onComplete: function () {
                self.playSound("voice_fight", 0.7);
                self.tweens.add({
                    targets: self.fightText,
                    alpha: 1,
                    duration: 300,
                    onComplete: function () {
                        self.time.delayedCall(800, function () {
                            if (self.titleText) self.titleText.destroy();
                            if (self.fightText) self.fightText.destroy();
                            self.titleText = null;
                            self.fightText = null;
                            self.startGame();
                        });
                    },
                });
            },
        });
    }

    startGame() {
        this.gameStarted = true;
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

    updateSpGauge() {
        this.spGaugeBar.clear();
        this.spGaugeBar.fillStyle(0x333333, 0.7);
        this.spGaugeBar.fillRect(GW - 70, GCY + 35, 60, 8);
        this.spGaugeBar.fillStyle(this.spGauge >= 100 ? 0xff0000 : 0x00aaff, 1);
        this.spGaugeBar.fillRect(GW - 70, GCY + 35, 60 * Math.min(this.spGauge / 100, 1), 8);
    }

    onSpFire() {
        if (this.spGauge < 100 || this.spFired || !this.gameStarted) {
            return;
        }
        this.doSpFire();
    }

    doSpFire() {
        this.spFired = true;
        this.spGauge = 0;
        this.updateSpGauge();
        this.playSound("se_sp", 0.8);
        this.playSound("g_sp_voice", 0.7);

        this.theWorldFlg = true;

        for (var i = this.playerBullets.length - 1; i >= 0; i--) {
            this.playerBullets[i].destroy();
        }
        this.playerBullets = [];

        var spLine = this.add.graphics();
        spLine.setDepth(150);
        spLine.fillStyle(0xff0000, 1);
        spLine.fillRect(this.playerSprite.x - 1, 0, 3, GH);

        var self = this;
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

        this.time.delayedCall(2500, function () {
            self.theWorldFlg = false;
            self.spFired = false;

            for (var e = self.enemies.length - 1; e >= 0; e--) {
                var en = self.enemies[e];
                if (en && en.active && en.getData("type") !== "boss") {
                    self.enemyDie(en, true);
                }
            }
        });
    }

    spExplosions() {
        var self = this;
        var count = 0;
        var interval = this.time.addEvent({
            delay: 60,
            repeat: 15,
            callback: function () {
                var ex = count % 8;
                var ey = Math.floor(count / 8);
                var x = (ex * 35) + (ey % 2 === 0 ? 0 : 15);
                var y = GH - 60 - ey * 45;

                var explosion = self.add.sprite(x, y, "game_asset", "spExplosion00.gif");
                explosion.setOrigin(0, 0);
                explosion.setDepth(140);
                self.playSound("se_sp_explosion", 0.3);

                self.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 500,
                    onComplete: function () {
                        explosion.destroy();
                    },
                });

                count++;
            },
        });
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
                this.playerBullets.push(b);
            }
        } else {
            var bullet = this.add.sprite(this.playerSprite.x, this.playerSprite.y - 20, "game_asset", frameKey);
            bullet.setOrigin(0.5);
            bullet.setDepth(50);
            bullet.setData("damage", shootData.damage);
            bullet.setData("hp", shootData.hp);
            bullet.setData("angle", 0);
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
        enemy.setData("hp", data.hp || 1);
        enemy.setData("maxHp", data.hp || 1);
        enemy.setData("speed", data.speed || 0.8);
        enemy.setData("score", data.score || 100);
        enemy.setData("spgage", data.spgage || 1);
        enemy.setData("interval", data.interval || 300);
        enemy.setData("shootCnt", 0);
        enemy.setData("itemName", itemName || null);
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
        this.enemyWaveFlg = false;

        var stageId = gameState.stageId || 0;
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
        this.bossName = bossData.name || "boss";

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
        this.bossSprite.setData("projData", bossData.bulletData || bossData.projectileData || null);

        this.enemies.push(this.bossSprite);

        var self = this;

        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_add";
        this.playSound(voiceKey, 0.7);

        var bgmKey = "boss_" + (bossNames[stageId] || "bison") + "_bgm";
        this.playBgm(bgmKey, 0.4);

        this.tweens.add({
            targets: this.bossSprite,
            y: 80,
            duration: 2000,
            ease: "Quint.easeOut",
            onComplete: function () {
                self.bossTimerCountDown = 99;
                self.bossTimerFrameCnt = 0;

                self.time.delayedCall(3000, function () {
                    self.bossTimerStartFlg = true;
                    self.bossTimerText.setVisible(true);
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

    enemyDie(enemy, isSp) {
        if (!enemy || !enemy.active) return;

        var score = enemy.getData("score") || 100;
        var spgage = enemy.getData("spgage") || 1;

        this.comboCount++;
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
        var ex = this.add.sprite(x, y, "game_asset", "explosion00.gif");
        ex.setOrigin(0.5);
        ex.setDepth(60);
        this.tweens.add({
            targets: ex,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 400,
            onComplete: function () { ex.destroy(); },
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
        this.playerHp -= amount;
        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.playerDie();
        }

        this.hpBar.setScale(Math.max(0, this.playerHp / this.playerMaxHp), 1);
        this.playSound("se_damage", 0.15);

        this.cameras.main.shake(150, 0.01);

        var self = this;
        this.tweens.add({
            targets: this.hudBg,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2,
        });
    }

    playerDie() {
        if (this.playerDead) return;
        this.playerDead = true;
        this.gameStarted = false;

        this.showExplosion(this.playerSprite.x, this.playerSprite.y);
        this.playerSprite.setVisible(false);

        var self = this;
        this.time.delayedCall(2000, function () {
            gameState.score = self.scoreCount;
            self.scene.start("PhaserContinueScene");
        });
    }

    stageClear() {
        if (this.stageCleared) return;
        this.stageCleared = true;
        this.gameStarted = false;

        gameState.score = this.scoreCount;

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

    update(time, delta) {
        if (!this.gameStarted) return;
        if (this.playerDead || this.stageCleared) return;

        if (this.theWorldFlg) {
            this.updateHUD();
            return;
        }

        this.stageBg.tilePositionY -= 0.7;

        this.shootTimer += delta;
        var interval = this.shootSpeed === "speed_high" ? this.shootInterval * 0.6 : this.shootInterval;
        var intervalMs = interval * (1000 / 120);
        if (this.shootTimer >= intervalMs) {
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
            bullet.y -= 4;
            bullet.x += angle * 4;

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

                var shootCnt = enemy.getData("shootCnt") + 1;
                enemy.setData("shootCnt", shootCnt);
                var shootInterval = enemy.getData("interval") || 300;
                if (shootInterval > 0 && shootCnt % shootInterval === 0) {
                    this.enemyShoot(enemy);
                }
            } else {
                this.bossIntervalCnt++;
                if (this.bossInterval > 0 && this.bossIntervalCnt % this.bossInterval === 0) {
                    this.enemyShoot(enemy);
                }

                if (!this.bossSprite || !this.bossSprite.active) {
                    this.enemies.splice(e, 1);
                    continue;
                }
            }

            var animFrames = enemy.getData("frames");
            if (animFrames && animFrames.length > 1) {
                var animTimer = enemy.getData("animTimer") + delta;
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

                if (enemy.y >= 40 && rectOverlap(eRect, bRect)) {
                    var dmg = pb.getData("damage") || 1;
                    var ehp = enemy.getData("hp") - dmg;
                    enemy.setData("hp", ehp);

                    if (this.shootMode !== "big") {
                        pb.destroy();
                        this.playerBullets.splice(bb, 1);
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
            if (this.frameCnt % this.waveInterval === 0) {
                this.enemyWave();
            }
            this.frameCnt++;
        }

        if (this.bossTimerStartFlg) {
            this.bossTimerFrameCnt++;
            if (this.bossTimerFrameCnt % 60 === 0) {
                this.bossTimerCountDown--;
                if (this.bossTimerCountDown <= 0) {
                    this.bossTimerStartFlg = false;
                    this.timeoverComplete();
                }
            }
            this.bossTimerText.setText("TIME " + String(Math.max(0, this.bossTimerCountDown)));
        }

        this.comboTimeCnt -= 0.1;
        if (this.comboTimeCnt <= 0) {
            this.comboTimeCnt = 0;
            this.comboCount = 0;
        }

        if (this.barrierActive) {
            this.barrierTimer -= delta / 1000;
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

        this.playerAnimTimer += delta;
        if (this.playerAnimTimer > 150 && this.playerAnimFrames.length > 1) {
            this.playerAnimTimer = 0;
            this.playerAnimIdx = (this.playerAnimIdx + 1) % this.playerAnimFrames.length;
            try {
                this.playerSprite.setFrame(this.playerAnimFrames[this.playerAnimIdx]);
            } catch (err) {}
        }

        this.updateHUD();
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

        var dx = this.playerSprite.x - enemy.x;
        var dy = this.playerSprite.y - enemy.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;

        bullet.setData("rotX", dx / dist);
        bullet.setData("rotY", dy / dist);

        this.enemyBullets.push(bullet);
    }

    bossDie(boss) {
        if (this.stageCleared) return;

        this.bossTimerStartFlg = false;
        this.bossTimerText.setVisible(false);
        this.theWorldFlg = true;

        this.comboCount++;
        var ratio = Math.max(1, Math.ceil(this.comboCount / 10));
        this.scoreCount += this.bossScore * ratio;

        this.showExplosion(boss.x, boss.y);
        this.showScorePopup(boss.x, boss.y, this.bossScore * ratio);

        var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
        var stageId = gameState.stageId || 0;
        var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_ko";
        this.playSound(voiceKey, 0.9);
        this.playSound("se_finish_akebono", 0.9);

        var idx = this.enemies.indexOf(boss);
        if (idx >= 0) this.enemies.splice(idx, 1);
        boss.destroy();

        this.bossSprite = null;
        this.bossActive = false;

        for (var eb = this.enemyBullets.length - 1; eb >= 0; eb--) {
            if (this.enemyBullets[eb] && this.enemyBullets[eb].active) {
                this.enemyBullets[eb].destroy();
            }
        }
        this.enemyBullets = [];

        var self = this;
        this.time.delayedCall(2000, function () {
            self.stageClear();
        });
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
        if (this.scoreText) {
            this.scoreText.setText(String(this.scoreCount));
        }
        if (this.comboText) {
            this.comboText.setText(String(this.comboCount));
        }
        if (this.comboLabel) {
            this.comboLabel.setScale(this.comboTimeCnt / 100, 1);
        }
        if (this.worldBestText) {
            var best = Math.max(getDisplayedHighScore(), this.scoreCount);
            this.worldBestText.setText(getWorldBestLabel() + " " + String(best));
        }
    }
}

export default PhaserGameScene;
