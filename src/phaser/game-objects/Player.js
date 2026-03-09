// src/phaser/game-objects/Player.js
// Player sprite creation, input handling, damage, barrier
// Extracted from GameScene: createPlayer, createDragArea, drag handlers, keyboard, playerDamage, playerDie

import { GAME_DIMENSIONS } from "../../constants.js";
import { gameState } from "../../gameState.js";
import { PLAYER_STATES } from "../../enums/player-boss-states.js";
import { triggerHaptic } from "../../haptics.js";
import { createShadow, updateShadowPosition } from "./Shadow.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

function pointerId(pointer) {
    if (!pointer) return null;
    if (pointer.id !== undefined && pointer.id !== null) return pointer.id;
    if (pointer.pointerId !== undefined && pointer.pointerId !== null) return pointer.pointerId;
    return null;
}

/**
 * Creates the player sprite and sets up animation.
 *
 * @param {Phaser.Scene} scene
 */
export function createPlayer(scene) {
    var pd = scene.recipe.playerData;
    var frames = pd.texture || [];
    var frameKey = frames[0] || "player00.gif";

    scene.playerSprite = scene.add.sprite(GCX, GH - 80, "game_asset", frameKey);
    scene.playerSprite.setOrigin(0.5);

    scene.playerHitAreaHalfWidth = (scene.playerSprite.width - 14) / 2;
    if (!isFinite(scene.playerHitAreaHalfWidth) || scene.playerHitAreaHalfWidth <= 0) {
        scene.playerHitAreaHalfWidth = 16;
    }
    scene.playerUnitX = scene.playerSprite.x;
    scene.playerUnitY = scene.playerSprite.y;

    scene.playerHp = gameState.playerHp || pd.maxHp;
    scene.playerMaxHp = gameState.playerMaxHp || pd.maxHp;

    scene.playerAnimFrames = frames;
    scene.playerAnimIdx = 0;
    scene.playerAnimTimer = 0;

    if (frames.length > 1) {
        if (!scene.anims.exists("player_walk")) {
            scene.anims.create({
                key: "player_walk",
                frames: scene.anims.generateFrameNames("game_asset", {
                    prefix: "player",
                    start: 0,
                    end: frames.length - 1,
                    zeroPad: 2,
                    suffix: ".gif",
                }),
                frameRate: 42,
                repeat: -1,
            });
        }
        scene.playerSprite.play("player_walk");
    }

    // PIXI player shadow: shadowOffsetY=5 (app-original.js line 589)
    scene.playerShadow = createShadow(scene, scene.playerSprite, frameKey, true, 5);
    updateShadowPosition(scene.playerShadow, scene.playerSprite);

    scene.barrierActive = false;
    scene.barrierTimer = 0;
    scene.barrierSprite = null;
}

/**
 * Creates the full-screen drag/touch input zone.
 *
 * @param {Phaser.Scene} scene
 */
export function createDragArea(scene) {
    scene.dragArea = scene.add.zone(0, 0, GW, GH);
    scene.dragArea.setOrigin(0, 0);
    scene.dragArea.setInteractive(new Phaser.Geom.Rectangle(0, 0, GW, GH), Phaser.Geom.Rectangle.Contains);
    scene.dragArea.on("pointerdown", function (pointer) { onScreenDragStart(scene, pointer); });
    scene.dragArea.on("pointermove", function (pointer) { onScreenDragMove(scene, pointer); });
    scene.dragArea.on("pointerup", function (pointer) { onScreenDragEnd(scene, pointer); });
}

export function clampPlayerX(scene, x) {
    return clamp(x, scene.playerHitAreaHalfWidth, GW - scene.playerHitAreaHalfWidth);
}

export function onScreenDragStart(scene, pointer) {
    if (!scene.gameStarted || scene.playerDead || scene.theWorldFlg) return;
    scene.playerUnitX = pointer.x;
    scene.isDragging = true;
    scene.dragPointerId = pointerId(pointer);
}

export function onScreenDragEnd(scene, pointer) {
    var activePointerId = pointerId(pointer);
    if (scene.dragPointerId !== null && activePointerId !== null && activePointerId !== scene.dragPointerId) return;
    scene.isDragging = false;
    scene.dragPointerId = null;
}

export function onScreenDragMove(scene, pointer) {
    if (!scene.isDragging || !scene.gameStarted || scene.playerDead || scene.theWorldFlg) return;
    if (scene.dragPointerId !== null && pointerId(pointer) !== scene.dragPointerId) return;
    scene.playerUnitX = clampPlayerX(scene, pointer.x);
}

/**
 * Keyboard input handling each logical frame.
 *
 * @param {Phaser.Scene} scene
 */
export function handleKeyboardInput(scene) {
    if (!scene.gameStarted || scene.playerDead || scene.theWorldFlg || !scene.cursors || !scene.wasd) return;

    var moveX = 0;
    var moveY = 0;

    if (scene.cursors.left.isDown || scene.wasd.left.isDown) {
        moveX = -scene.keyMoveSpeed;
    } else if (scene.cursors.right.isDown || scene.wasd.right.isDown) {
        moveX = scene.keyMoveSpeed;
    }

    if (scene.cursors.up.isDown || scene.wasd.up.isDown) {
        moveY = -scene.keyMoveSpeed;
    } else if (scene.cursors.down.isDown || scene.wasd.down.isDown) {
        moveY = scene.keyMoveSpeed;
    }

    if (moveX !== 0 || moveY !== 0) {
        scene.playerUnitX = clampPlayerX(scene, scene.playerUnitX + moveX);
        scene.playerSprite.y = clamp(scene.playerSprite.y + moveY, 50, GH - 20);
        scene.playerUnitY = scene.playerSprite.y;
    }

    if (scene.wasd.sp && Phaser.Input.Keyboard.JustDown(scene.wasd.sp)) {
        scene.onSpFire();
    }
}

/**
 * Applies damage to the player. Triggers death if HP reaches 0.
 *
 * @param {Phaser.Scene} scene
 * @param {number} amount
 */
export function playerDamage(scene, amount) {
    if (scene.barrierActive) return;

    scene.playerHp -= amount;
    if (scene.playerHp <= 0) {
        scene.playerHp = 0;
        playerDie(scene);
    }

    scene.hpBar.setScale(Math.max(0, scene.playerHp / scene.playerMaxHp), 1);
    triggerHaptic("damage");
    scene.playSound("se_damage", 0.15);
    scene.playSound("g_damage_voice", 0.5);

    scene.cameras.main.shake(150, 0.01);

    scene.tweens.add({
        targets: scene.hudBg,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2,
    });

    scene.tweens.add({
        targets: scene.playerSprite,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
        repeat: 3,
    });
}

/**
 * Player death handler — shows explosion, transitions to continue scene.
 *
 * @param {Phaser.Scene} scene
 */
export function playerDie(scene) {
    if (scene.playerDead) return;
    scene.playerDead = true;
    scene.gameStarted = false;

    scene.showExplosion(scene.playerSprite.x, scene.playerSprite.y);
    scene.playerSprite.setVisible(false);
    if (scene.playerShadow) scene.playerShadow.setVisible(false);

    gameState.maxCombo = Math.max(gameState.maxCombo || 0, scene.maxCombo);

    var game = scene.game;
    scene.time.delayedCall(2000, function () {
        gameState.score = scene.scoreCount;
        gameState.spgage = scene.spGauge;
        scene.stopAllSounds();
        setTimeout(function () {
            game.scene.stop("PhaserGameScene");
            game.scene.start("PhaserContinueScene");
        }, 50);
    });
}

/**
 * Updates barrier state each logical frame.
 *
 * @param {Phaser.Scene} scene
 * @param {number} step – logical step time in ms
 */
export function updateBarrier(scene, step) {
    if (!scene.barrierActive) return;

    scene.barrierTimer -= step / 1000;
    if (scene.barrierTimer <= 0) {
        scene.barrierActive = false;
        if (scene.barrierSprite) {
            scene.barrierSprite.destroy();
            scene.barrierSprite = null;
        }
        scene.playSound("se_barrier_end", 0.9);
    } else if (scene.barrierSprite) {
        scene.barrierSprite.x = scene.playerSprite.x;
        scene.barrierSprite.y = scene.playerSprite.y;
    }
}

/**
 * Collects a power-up item.
 *
 * @param {Phaser.Scene} scene
 * @param {string} itemName
 */
export function collectItem(scene, itemName) {
    triggerHaptic("pickup");
    scene.playSound("g_powerup_voice", 0.55);

    switch (itemName) {
    case PLAYER_STATES.SHOOT_SPEED_HIGH:
        scene.shootSpeed = "speed_high";
        break;
    case PLAYER_STATES.BARRIER:
        scene.barrierActive = true;
        scene.barrierTimer = 4;
        scene.playSound("se_barrier_start", 0.9);
        if (scene.barrierSprite) scene.barrierSprite.destroy();
        scene.barrierSprite = scene.add.sprite(scene.playerSprite.x, scene.playerSprite.y, "game_asset", "barrier0.gif");
        scene.barrierSprite.setOrigin(0.5);
        scene.barrierSprite.setDepth(51);
        scene.barrierSprite.setAlpha(0.6);
        break;
    case PLAYER_STATES.SHOOT_NAME_BIG:
        scene.shootMode = "big";
        scene.shootSpeed = "speed_normal";
        break;
    case PLAYER_STATES.SHOOT_NAME_3WAY:
        scene.shootMode = "3way";
        scene.shootSpeed = "speed_normal";
        break;
    default:
        scene.shootMode = "normal";
        break;
    }
}
