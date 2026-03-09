// src/phaser/game-objects/Boss.js
// Boss creation, projectile shooting helpers, death, danger check
// Extracted from GameScene: bossAdd, bossShoot, bossShoot*, bossDie, checkBossDanger, bossShootStart

import { GAME_DIMENSIONS } from "../../constants.js";
import { gameState } from "../../gameState.js";
import { triggerHaptic } from "../../haptics.js";
import { createShadow, updateShadowPosition } from "./Shadow.js";
import { showBossExplosion } from "../effects/Explosions.js";
import {
    bossPatternBison,
    bossPatternBarlog,
    bossPatternSagat,
    bossPatternVega,
    bossPatternFang,
} from "../bosses/index.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

// Per-boss danger balloon local offsets (PIXI top-left relative coords).
// PIXI uses anchor(0,0) and addChild so balloon position is relative to
// the unit container's top-left corner.  pivot.y = height makes the
// balloon's bottom edge sit at the offset point.
var BOSS_BALLOON_OFFSETS = [
    { x: 0, y: 20 },   // bison
    { x: 30, y: 20 },  // barlog
    { x: 0, y: 15 },   // sagat
    { x: 5, y: 20 },   // vega
    { x: 70, y: 40 },  // fang
];

/**
 * Spawns the boss sprite and begins its entry tween.
 *
 * @param {Phaser.Scene} scene
 */
export function bossAdd(scene) {
    if (scene.bossActive) return;
    scene.bossActive = true;
    scene.bossEntering = true;
    scene.enemyWaveFlg = false;

    var stageId = gameState.stageId || 0;
    scene.bossStageId = stageId;
    var bossData = scene.recipe.bossData ? scene.recipe.bossData["boss" + String(stageId)] : null;
    if (!bossData) {
        scene.stageClear();
        return;
    }

    scene.bossHp = bossData.hp || 100;
    scene.bossMaxHp = scene.bossHp;
    scene.bossScore = bossData.score || 5000;
    scene.bossInterval = bossData.interval || 60;
    scene.bossIntervalCnt = 0;
    scene.bossIntervalCounter = 0;
    scene.bossName = bossData.name || "boss";
    scene.bossProjCnt = 0;

    scene.bossProjDataA = bossData.bulletDataA || bossData.projectileDataA || null;
    scene.bossProjDataB = bossData.bulletDataB || bossData.projectileDataB || null;
    scene.bossProjDataC = bossData.bulletDataC || bossData.projectileDataC || null;
    scene.bossProjData = bossData.bulletData || bossData.projectileData || scene.bossProjDataA;
    triggerHaptic("bossEnter");

    var bossFrames = (bossData.anim && bossData.anim.idle) || bossData.texture || [];
    var bossFrame = bossFrames[0] || "bison_idle0.gif";

    scene.bossSprite = scene.add.sprite(GCX, -50, "game_asset", bossFrame);
    scene.bossSprite.setOrigin(0.5);
    scene.bossSprite.setDepth(45);
    scene.bossSprite.setData("type", "boss");
    scene.bossSprite.setData("hp", scene.bossHp);
    scene.bossSprite.setData("frames", bossFrames);
    scene.bossSprite.setData("animIdx", 0);
    scene.bossSprite.setData("animTimer", 0);
    scene.bossSprite.setData("projData", scene.bossProjData);
    scene.bossSprite.setData("score", scene.bossScore);
    scene.bossSprite.setData("spgage", bossData.spgage || 5);

    // Boss shadow
    var bossShadowReverse = bossData.shadowReverse !== false;
    var bossShadowOffsetY = bossData.shadowOffsetY || 10;
    scene.bossShadow = createShadow(scene, scene.bossSprite, bossFrame, bossShadowReverse, bossShadowOffsetY);
    scene.bossSprite.setData("shadow", scene.bossShadow);

    scene.enemies.push(scene.bossSprite);

    var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
    var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_add";
    scene.playSound(voiceKey, 0.7);

    scene.tweens.add({
        targets: scene.bossSprite,
        y: 80,
        duration: 2000,
        ease: "Quint.easeOut",
        onComplete: function () {
            scene.bossEntering = false;
            scene.bossTimerCountDown = 99;
            scene.bossTimerFrameCnt = 0;

            scene.time.delayedCall(1500, function () {
                bossShootStart(scene);
            });

            scene.time.delayedCall(3000, function () {
                scene.bossTimerStartFlg = true;
                scene.bossTimerLabel.setVisible(true);
                scene.bossTimerNum.container.setVisible(true);
                scene.spBtn.setAlpha(1);
            });
        },
    });

    scene.stageEndBg.setVisible(true);
    scene.tweens.add({
        targets: scene.stageEndBg,
        y: 0,
        duration: 3000,
    });
}

// -----------------------------------------------------------------------
// Boss attack pattern dispatcher
// -----------------------------------------------------------------------

export function _bossAlive(scene) {
    return scene.bossSprite && scene.bossSprite.active && !scene.stageCleared && !scene.playerDead;
}

export function bossShootStart(scene) {
    if (!_bossAlive(scene) || scene.theWorldFlg) {
        if (scene.theWorldFlg && _bossAlive(scene)) {
            scene.time.delayedCall(500, function () { bossShootStart(scene); });
        }
        return;
    }
    var seed = Math.random();
    switch (scene.bossStageId) {
    case 0: bossPatternBison(scene, seed); break;
    case 1: bossPatternBarlog(scene, seed); break;
    case 2: bossPatternSagat(scene, seed); break;
    case 3: bossPatternVega(scene, seed); break;
    case 4: bossPatternFang(scene, seed); break;
    default: bossPatternBison(scene, seed); break;
    }
}

// -----------------------------------------------------------------------
// Projectile helpers (called from boss pattern modules)
// -----------------------------------------------------------------------

export function bossShootStraight(scene, projData) {
    if (!projData || !scene.bossSprite) return;

    var frames = projData.texture || [];
    var frameKey = frames[0] || "normalProjectile0.gif";
    var speed = projData.speed || 1;

    var bullet = scene.add.sprite(scene.bossSprite.x, scene.bossSprite.y + 20, "game_asset", frameKey);
    bullet.setOrigin(0.5);
    bullet.setDepth(41);
    bullet.setData("speed", speed);
    bullet.setData("damage", projData.damage || 1);
    bullet.setData("hp", projData.hp || 1);
    bullet.setData("score", projData.score || 0);
    bullet.setData("spgage", projData.spgage || 0);
    bullet.setData("rotX", 0);
    bullet.setData("rotY", 1);

    if (frames.length > 1) {
        bullet.setData("frames", frames);
        bullet.setData("animIdx", 0);
        bullet.setData("animTimer", 0);
    }

    scene.enemyBullets.push(bullet);
}

export function bossShootAimed(scene, projData) {
    if (!projData || !scene.bossSprite) return;

    var frames = projData.texture || [];
    var frameKey = frames[0] || "normalProjectile0.gif";
    var speed = projData.speed || 1;

    var bullet = scene.add.sprite(scene.bossSprite.x, scene.bossSprite.y + 20, "game_asset", frameKey);
    bullet.setOrigin(0.5);
    bullet.setDepth(41);
    bullet.setData("speed", speed);
    bullet.setData("damage", projData.damage || 1);
    bullet.setData("hp", projData.hp || 1);
    bullet.setData("score", projData.score || 0);
    bullet.setData("spgage", projData.spgage || 0);

    var dx = scene.playerSprite.x - scene.bossSprite.x;
    var dy = scene.playerSprite.y - scene.bossSprite.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    bullet.setData("rotX", dx / dist);
    bullet.setData("rotY", dy / dist);

    scene.enemyBullets.push(bullet);
}

export function bossShootSpread(scene, projData, count, angleDeg) {
    if (!projData || !scene.bossSprite) return;

    var frames = projData.texture || [];
    var frameKey = frames[0] || "normalProjectile0.gif";
    var speed = projData.speed || 1;

    var dx = scene.playerSprite.x - scene.bossSprite.x;
    var dy = scene.playerSprite.y - scene.bossSprite.y;
    var baseAngle = Math.atan2(dy, dx);
    var spreadRad = angleDeg * Math.PI / 180;
    var half = Math.floor(count / 2);

    for (var i = 0; i < count; i++) {
        var offset = (i - half) * (spreadRad / Math.max(count - 1, 1));
        var angle = baseAngle + offset;

        var bullet = scene.add.sprite(scene.bossSprite.x, scene.bossSprite.y + 20, "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(41);
        bullet.setData("speed", speed);
        bullet.setData("damage", projData.damage || 1);
        bullet.setData("hp", projData.hp || 1);
        bullet.setData("score", projData.score || 0);
        bullet.setData("spgage", projData.spgage || 0);
        bullet.setData("rotX", Math.cos(angle));
        bullet.setData("rotY", Math.sin(angle));

        scene.enemyBullets.push(bullet);
    }
}

export function bossShootRadial(scene, projData, count) {
    if (!projData || !scene.bossSprite) return;

    var frames = projData.texture || [];
    var frameKey = frames[0] || "normalProjectile0.gif";
    var speed = (projData.speed || 1) * 0.8;

    for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2;
        var bullet = scene.add.sprite(scene.bossSprite.x, scene.bossSprite.y, "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(41);
        bullet.setData("speed", speed);
        bullet.setData("damage", projData.damage || 1);
        bullet.setData("hp", projData.hp || 1);
        bullet.setData("score", projData.score || 0);
        bullet.setData("spgage", projData.spgage || 0);
        bullet.setData("rotX", Math.cos(angle));
        bullet.setData("rotY", Math.sin(angle));

        scene.enemyBullets.push(bullet);
    }
}

// -----------------------------------------------------------------------
// Boss danger balloon
// -----------------------------------------------------------------------

export function checkBossDanger(scene) {
    if (scene.bossDangerShown || !scene.bossSprite || !scene.bossSprite.active) return;
    var spDamage = scene.recipe.playerData.spDamage || 50;
    if (scene.bossHp <= spDamage) {
        scene.bossDangerShown = true;
        triggerHaptic("warning");

        // PIXI: balloon is addChild of unit container, so it tracks the boss
        // automatically.  pivot.y = height makes the bottom edge sit at (x, y).
        // Each boss class sets a unique (x, y) relative to the unit top-left.
        var stageId = scene.bossStageId || 0;
        var offsets = BOSS_BALLOON_OFFSETS[stageId] || BOSS_BALLOON_OFFSETS[0];

        // Convert PIXI top-left-relative offsets to Phaser center-relative.
        // PIXI: balloon at (offsets.x, offsets.y) from unit top-left
        // Phaser: bossSprite.x/y is center, so top-left = center - size/2
        var relX = offsets.x - scene.bossSprite.width / 2;
        var relY = offsets.y - scene.bossSprite.height / 2;

        var dangerBalloon = scene.add.sprite(
            scene.bossSprite.x + relX,
            scene.bossSprite.y + relY,
            "game_asset", "boss_dengerous0.gif"
        );
        // origin(0,1) matches PIXI pivot.y = height: bottom-left anchor
        dangerBalloon.setOrigin(0, 1);
        dangerBalloon.setDepth(46);
        dangerBalloon.setScale(0);
        dangerBalloon.setData("relX", relX);
        dangerBalloon.setData("relY", relY);
        scene.bossSprite.dangerBalloon = dangerBalloon;

        scene.tweens.add({
            targets: dangerBalloon,
            scaleX: 1,
            scaleY: 1,
            duration: 1000,
            ease: "Back.easeOut",
        });

        var dangerFrame = 0;
        scene.time.addEvent({
            delay: 250,
            loop: true,
            callback: function () {
                if (!dangerBalloon || !dangerBalloon.active) return;
                dangerFrame = (dangerFrame + 1) % 3;
                dangerBalloon.setFrame("boss_dengerous" + dangerFrame + ".gif");
            },
        });
    }
}

// -----------------------------------------------------------------------
// Per-frame boss visual sync (shadow + danger balloon)
// -----------------------------------------------------------------------

/**
 * Syncs boss shadow position and danger balloon position each frame.
 * Called from fixedUpdate for the boss sprite (updateEnemy is only for
 * regular enemies, so the boss needs its own visual sync).
 *
 * @param {Phaser.Scene} scene
 */
export function syncBossVisuals(scene) {
    if (!scene.bossSprite || !scene.bossSprite.active) return;

    // Boss shadow position sync
    if (scene.bossShadow && scene.bossShadow.active) {
        updateShadowPosition(scene.bossShadow, scene.bossSprite);
    }

    // Danger balloon position sync
    var balloon = scene.bossSprite.dangerBalloon;
    if (balloon && balloon.active) {
        balloon.x = scene.bossSprite.x + (balloon.getData("relX") || 0);
        balloon.y = scene.bossSprite.y + (balloon.getData("relY") || 0);
    }
}

// -----------------------------------------------------------------------
// Boss death sequence
// -----------------------------------------------------------------------

export function bossDie(scene, boss) {
    if (scene.stageCleared) return;

    // Destroy boss shadow
    if (scene.bossShadow && scene.bossShadow.active) {
        scene.bossShadow.destroy();
        scene.bossShadow = null;
    }

    scene.bossTimerStartFlg = false;
    scene.bossTimerLabel.setVisible(false);
    scene.bossTimerNum.container.setVisible(false);
    scene.theWorldFlg = true;

    scene.comboCount++;
    if (scene.comboCount > scene.maxCombo) {
        scene.maxCombo = scene.comboCount;
    }
    var ratio = Math.max(1, Math.ceil(scene.comboCount / 10));
    scene.scoreCount += scene.bossScore * ratio;

    scene.showScorePopup(boss.x, boss.y, scene.bossScore, ratio);

    // PIXI bossRemove: destroy all player bullets and clear list
    for (var pb = scene.playerBullets.length - 1; pb >= 0; pb--) {
        if (scene.playerBullets[pb] && scene.playerBullets[pb].active) {
            scene.playerBullets[pb].destroy();
        }
    }
    scene.playerBullets = [];

    // PIXI boss.dead(): 5 staggered explosions at random positions within boss hitArea
    // Uses slower 18fps animation matching PIXI animationSpeed=0.15
    var startX = boss.x;
    var startY = boss.y;
    var bw = boss.width || 80;
    var bh = boss.height || 80;
    for (var ei = 0; ei < 5; ei++) {
        (function (i) {
            scene.time.delayedCall(250 * i, function () {
                var ex = startX + Math.random() * bw - bw / 2;
                var ey = startY + Math.random() * bh - bh / 2;
                showBossExplosion(scene, ex, ey);
                scene.playSound("se_explosion", 0.35);
            });
        })(ei);
    }

    // PIXI boss.dead(): shake animation (two cycles of position jitter)
    var shakeOffsets = [
        { x: 4, y: -2 }, { x: -3, y: 1 }, { x: 2, y: -1 },
        { x: -2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 0 },
        { x: 4, y: -2 }, { x: -3, y: 1 }, { x: 2, y: -1 },
        { x: -2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 0 },
    ];
    var shakeDelays = [0, 80, 70, 50, 50, 40, 0, 80, 70, 50, 50, 40];
    var cumDelay = 0;
    for (var si = 0; si < shakeOffsets.length; si++) {
        cumDelay += shakeDelays[si];
        (function (off, delay) {
            scene.time.delayedCall(delay, function () {
                if (!boss || !boss.active) return;
                boss.x = startX + off.x;
                boss.y = startY + off.y;
            });
        })(shakeOffsets[si], cumDelay);
    }
    // PIXI boss.dead(): fade out unit after shake (1s fade with 0.5s delay)
    scene.tweens.add({
        targets: boss,
        alpha: 0,
        duration: 1000,
        delay: cumDelay + 500,
        onComplete: function () {
            if (boss && boss.active) boss.destroy();
        },
    });

    var bossNames = ["bison", "barlog", "sagat", "vega", "fang"];
    var stageId = gameState.stageId || 0;
    var voiceKey = "boss_" + (bossNames[stageId] || "bison") + "_voice_ko";
    triggerHaptic("bossDefeat");
    scene.playSound(voiceKey, 0.9);
    scene.playSound("se_finish_akebono", 0.9);

    if (scene.spFired) {
        scene.showAkebonoFinish();
    }

    if (boss.dangerBalloon && boss.dangerBalloon.active) {
        boss.dangerBalloon.destroy();
    }

    var idx = scene.enemies.indexOf(boss);
    if (idx >= 0) scene.enemies.splice(idx, 1);

    scene.bossSprite = null;
    scene.bossActive = false;
    scene.bossDangerShown = false;
    scene.bossHpBarBg.setVisible(false);
    scene.bossHpBarFg.setVisible(false);

    for (var eb = scene.enemyBullets.length - 1; eb >= 0; eb--) {
        if (scene.enemyBullets[eb] && scene.enemyBullets[eb].active) {
            scene.enemyBullets[eb].destroy();
        }
    }
    scene.enemyBullets = [];

    scene.time.delayedCall(2500, function () {
        scene.stageClear();
    });
}
