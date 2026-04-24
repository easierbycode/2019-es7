// src/phaser/game-objects/Bullet.js
// Player bullet creation and movement — extracted from GameScene.shoot() / fixedUpdate bullet loop

import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;

/**
 * Fires player bullet(s) based on current shootMode.
 *
 * @param {Phaser.Scene} scene – the GameScene instance
 */
export function shootBullets(scene) {
    if (!scene.gameStarted || scene.playerDead || scene.theWorldFlg) {
        return;
    }

    var pd = scene.recipe.playerData;
    var shootData;

    switch (scene.shootMode) {
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

    var frames = (shootData.texture && shootData.texture.length) ? shootData.texture : ["shot00.gif"];
    var frameKey = frames[0];
    var animKey = "bullet_anim_" + frames.join("|");
    if (!scene.anims.exists(animKey)) {
        scene.anims.create({
            key: animKey,
            frames: frames.map(function (f) { return { key: "game_asset", frame: f }; }),
            frameRate: 6,
            repeat: -1,
        });
    }

    if (scene.shootMode === "3way") {
        for (var a = -1; a <= 1; a++) {
            var b = scene.add.sprite(scene.playerSprite.x + a * 10, scene.playerSprite.y - 16, "game_asset", frameKey);
            b.setOrigin(0.5);
            b.setDepth(50);
            b.setData("damage", shootData.damage);
            b.setData("hp", shootData.hp);
            b.setData("angle", a * 0.15);
            b.setData("bulletId", scene.bulletIdCnt++);
            b.setRotation(-Math.PI / 2 + a * 0.2);
            b.play(animKey);
            scene.playerBullets.push(b);
        }
    } else {
        var bullet = scene.add.sprite(scene.playerSprite.x, scene.playerSprite.y - 16, "game_asset", frameKey);
        bullet.setOrigin(0.5);
        bullet.setDepth(50);
        bullet.setData("damage", shootData.damage);
        bullet.setData("hp", shootData.hp);
        bullet.setData("angle", 0);
        bullet.setData("bulletId", scene.bulletIdCnt++);
        bullet.setRotation(-Math.PI / 2);
        if (scene.shootMode === "big") {
            bullet.setScale(1.5);
        }
        bullet.play(animKey);
        scene.playerBullets.push(bullet);
    }

    scene.playSound("se_shoot", 0.3);
}

/**
 * Moves all player bullets and removes off-screen ones.
 *
 * @param {Phaser.Scene} scene
 */
export function updatePlayerBullets(scene) {
    for (var b = scene.playerBullets.length - 1; b >= 0; b--) {
        var bullet = scene.playerBullets[b];
        if (!bullet.active) {
            scene.playerBullets.splice(b, 1);
            continue;
        }

        // Clear collision tint after a few frames
        var tintTimer = bullet.getData("_tintTimer") || 0;
        if (tintTimer > 0) {
            tintTimer--;
            bullet.setData("_tintTimer", tintTimer);
            if (tintTimer <= 0) {
                bullet.clearTint();
            }
        }

        var angle = bullet.getData("angle") || 0;
        bullet.y -= 3.5;
        bullet.x += angle * 3.5;

        if (bullet.y < -20) {
            bullet.destroy();
            scene.playerBullets.splice(b, 1);
        }
    }
}
