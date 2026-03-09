// src/phaser/game-objects/Enemy.js
// Enemy creation, waves, shooting, death, per-frame update
// Extracted from GameScene methods: createEnemy, enemyWave, enemyShoot, enemyDie

import { GAME_DIMENSIONS } from "../../constants.js";
import { gameState } from "../../gameState.js";
import { PLAYER_STATES } from "../../enums/player-boss-states.js";
import { createShadow, updateShadowPosition } from "./Shadow.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

/**
 * Creates a single enemy sprite with all required data keys.
 *
 * @param {Phaser.Scene} scene
 * @param {Object} data   – enemyData entry from recipe
 * @param {number} x
 * @param {number} y
 * @param {string|null} itemName
 * @returns {Phaser.GameObjects.Sprite}
 */
export function createEnemy(scene, data, x, y, itemName) {
    var frames = data.texture || [];
    var frameKey = frames[0] || "soliderA0.gif";

    var enemy = scene.add.sprite(x, y, "game_asset", frameKey);
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
    enemy.setData("spawnX", x);
    enemy.setData("frames", frames);
    enemy.setData("animIdx", 0);
    enemy.setData("animTimer", 0);
    enemy.setData("projData", data.bulletData || data.projectileData || null);

    // PIXI BaseUnit shadow (same sprite, tinted black, 50% alpha, Y-flipped)
    var shadowReverse = data.shadowReverse !== false;
    var shadowOffsetY = data.shadowOffsetY || 10;
    var enemyNameLower = String(data.name || "").toLowerCase();
    var shadow = createShadow(scene, enemy, frameKey, shadowReverse, shadowOffsetY);
    // baraA/baraB: shadow hidden in original PIXI (app-original.js line 3543)
    if (enemyNameLower === "baraa" || enemyNameLower === "barab") {
        shadow.setVisible(false);
    }
    enemy.setData("shadow", shadow);
    updateShadowPosition(shadow, enemy);

    scene.enemies.push(enemy);
    return enemy;
}

/**
 * Spawns the next enemy wave from `scene.stageEnemyPositionList`.
 * Triggers bossAdd() when all waves have been dispatched.
 *
 * @param {Phaser.Scene} scene
 */
export function enemyWave(scene) {
    if (scene.waveCount >= scene.stageEnemyPositionList.length) {
        scene.bossAdd();
        return;
    }

    var row = scene.stageEnemyPositionList[scene.waveCount] || [];

    for (var i = 0; i < row.length; i++) {
        var code = String(row[i]);
        if (code === "00") continue;

        var enemyType = code.substr(0, 1);
        var itemCode = code.substr(1, 1);
        var dataKey = "enemy" + enemyType;
        var enemyData = scene.recipe.enemyData ? scene.recipe.enemyData[dataKey] : null;
        if (!enemyData) continue;

        var itemName = null;
        switch (itemCode) {
        case "1": itemName = PLAYER_STATES.SHOOT_NAME_BIG; break;
        case "2": itemName = PLAYER_STATES.SHOOT_NAME_3WAY; break;
        case "3": itemName = PLAYER_STATES.SHOOT_SPEED_HIGH; break;
        case "9": itemName = PLAYER_STATES.BARRIER; break;
        }

        createEnemy(scene, enemyData, 32 * i + 16, -16, itemName);
    }

    scene.waveCount++;
}

/**
 * Enemy shoots a projectile toward the player (or straight down).
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} enemy
 */
export function enemyShoot(scene, enemy) {
    var projData = enemy.getData("projData");
    if (!projData) return;

    var frames = projData.texture || [];
    var frameKey = frames[0] || "normalProjectile0.gif";
    var speed = projData.speed || 1;

    var bullet = scene.add.sprite(enemy.x, enemy.y + (enemy.height / 2), "game_asset", frameKey);
    bullet.setOrigin(0.5);
    bullet.setDepth(41);
    bullet.setData("speed", speed);
    bullet.setData("damage", projData.damage || 1);
    bullet.setData("hp", projData.hp || 1);
    bullet.setData("score", projData.score || 0);
    bullet.setData("spgage", projData.spgage || 0);

    // PIXI projectileAdd default: rotX=0, rotY=1 (straight down).
    // soliderB aims at player only on secondLoop; special projectile types always aim.
    var enemyName = String(enemy.getData("name") || "").toLowerCase();
    var projName = String((projData && projData.name) || "").toLowerCase();

    var isSoldierB = enemyName === "soliderb" || enemyName === "soldierb";

    if (isSoldierB && !gameState.secondLoop) {
        // PIXI original: soldierB shoots straight down like other enemies
        bullet.setData("rotX", 0);
        bullet.setData("rotY", 1);
    } else if ((isSoldierB && gameState.secondLoop) ||
        projName === "beam" || projName === "smoke" || projName === "meka" || projName === "psychofield") {
        // secondLoop soldierB + special projectile types: aimed at player
        var dx = scene.playerSprite.x - enemy.x;
        var dy = scene.playerSprite.y - enemy.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        bullet.setData("rotX", dx / dist);
        bullet.setData("rotY", dy / dist);
    } else {
        // Default: straight down (matches PIXI)
        bullet.setData("rotX", 0);
        bullet.setData("rotY", 1);
    }

    scene.enemyBullets.push(bullet);
}

/**
 * Handles enemy death: scoring, combo, item drop, explosion, destruction.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} enemy
 * @param {boolean} isSp – true if killed by SP attack
 */
export function enemyDie(scene, enemy, isSp) {
    if (!enemy || !enemy.active) return;

    var score = enemy.getData("score") || 100;
    var spgage = enemy.getData("spgage") || 1;

    scene.comboCount++;
    if (scene.comboCount > scene.maxCombo) {
        scene.maxCombo = scene.comboCount;
    }
    var ratio = Math.max(1, Math.ceil(scene.comboCount / 10));
    scene.scoreCount += score * ratio;
    scene.comboTimeCnt = 100;

    if (!isSp) {
        scene.spGauge = Math.min(100, scene.spGauge + spgage);
        scene.updateSpGauge();
        if (scene.spGauge >= 100) {
            scene.spBtn.setAlpha(1);
        }
    }

    var itemName = enemy.getData("itemName");
    if (itemName) {
        scene.dropItem(enemy.x, enemy.y, itemName);
    }

    scene.showExplosion(enemy.x, enemy.y);
    scene.showScorePopup(enemy.x, enemy.y, score, ratio);
    scene.playSound("se_explosion", 0.35);

    var idx = scene.enemies.indexOf(enemy);
    if (idx >= 0) scene.enemies.splice(idx, 1);
    var eShadow = enemy.getData("shadow");
    if (eShadow && eShadow.active) eShadow.destroy();
    enemy.destroy();
}

/**
 * Per-frame enemy movement, animation, shooting, off-screen cleanup.
 * Called from inside the enemy iteration in fixedUpdate.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} enemy
 * @param {number} step – logical step time in ms
 */
export function updateEnemy(scene, enemy, step) {
    var speed = enemy.getData("speed") || 0.8;
    enemy.y += speed;

    var enemyName = enemy.getData("name");
    if (enemyName === "soliderB") {
        if (!enemy.getData("posName")) {
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

    // Update shadow position to follow enemy
    var eShadow = enemy.getData("shadow");
    if (eShadow && eShadow.active) {
        updateShadowPosition(eShadow, enemy);
    }

    var shootCnt = enemy.getData("shootCnt") + 1;
    enemy.setData("shootCnt", shootCnt);
    var shootInterval = enemy.getData("interval") || 300;
    if (shootInterval > 0 && shootCnt >= shootInterval) {
        enemy.setData("shootCnt", shootCnt - shootInterval);
        if (enemy.y < scene.playerSprite.y - 20) {
            enemyShoot(scene, enemy);
        }
    }
}

/**
 * Animate enemy sprite frames (shared by enemies and bosses).
 *
 * @param {Phaser.GameObjects.Sprite} enemy
 * @param {number} step
 */
export function animateEnemy(enemy, step) {
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
            // Sync shadow frame with character
            var eShadow = enemy.getData("shadow");
            if (eShadow && eShadow.active) {
                try { eShadow.setFrame(animFrames[animIdx]); } catch (err2) {}
            }
        }
    }
}
