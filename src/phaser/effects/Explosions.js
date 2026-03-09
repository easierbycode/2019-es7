import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

export function showExplosion(scene, x, y) {
    // 7-frame animated explosion matching PIXI (animationSpeed=0.4 at 120fps ≈ 48fps)
    if (!scene.anims.exists("explosion_anim")) {
        scene.anims.create({
            key: "explosion_anim",
            frames: scene.anims.generateFrameNames("game_asset", {
                prefix: "explosion",
                start: 0,
                end: 6,
                zeroPad: 2,
                suffix: ".gif",
            }),
            frameRate: 48,
            repeat: 0,
        });
    }
    var ex = scene.add.sprite(x, y, "game_asset", "explosion00.gif");
    ex.setOrigin(0.5);
    ex.setDepth(60);
    ex.play("explosion_anim");
    ex.once("animationcomplete", function () {
        ex.destroy();
    });
}

export function spExplosions(scene) {
    // Matches PIXI: 64 animated sprites in rows (8 per row, 8 rows)
    if (!scene.anims.exists("sp_explosion_anim")) {
        scene.anims.create({
            key: "sp_explosion_anim",
            frames: scene.anims.generateFrameNames("game_asset", {
                prefix: "spExplosion",
                start: 0,
                end: 7,
                zeroPad: 2,
                suffix: ".gif",
            }),
            frameRate: 24,
            repeat: 0,
        });
    }

    for (var n = 0; n < 64; n++) {
        (function (idx) {
            scene.time.delayedCall(10 * idx, function () {
                var col = idx % 8;
                var row = Math.floor(idx / 8);
                var startX = row % 2 === 0 ? -30 : -45;
                var x = startX + col * 30;
                var y = GH - 45 * (row + 1) - 120;

                if (x < 0) x += GW;
                if (x > GW) x -= GW;

                var explosion = scene.add.sprite(x, y, "game_asset", "spExplosion00.gif");
                explosion.setOrigin(0.5);
                explosion.setDepth(140);
                explosion.play("sp_explosion_anim");
                explosion.once("animationcomplete", function () {
                    explosion.destroy();
                });

                if (idx % 16 === 0) {
                    scene.playSound("se_sp_explosion", 0.3);
                }
            });
        })(n);
    }
}

export function showHitImpact(scene, x, y, isGuard) {
    var animKey = isGuard ? "guard_impact_anim" : "hit_impact_anim";
    if (!scene.anims.exists(animKey)) {
        var prefix = isGuard ? "guard" : "hit";
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames("game_asset", {
                prefix: prefix,
                start: 0,
                end: 4,
                suffix: ".gif",
            }),
            frameRate: 48,
            repeat: 0,
        });
    }
    var frameKey = isGuard ? "guard0.gif" : "hit0.gif";
    var impact = scene.add.sprite(x, y - 10, "game_asset", frameKey);
    impact.setOrigin(0.5);
    impact.setDepth(60);
    impact.setScale(1.2);
    impact.play(animKey);
    impact.once("animationcomplete", function () { impact.destroy(); });
}

export function flashEnemyTint(scene, enemy) {
    if (!enemy || !enemy.active) return;
    var existing = enemy.getData("_tintTimer");
    if (existing) existing.remove(false);
    enemy.setTint(0xFF0000);
    var timer = scene.time.delayedCall(100, function () {
        if (enemy && enemy.active) {
            enemy.clearTint();
            enemy.setData("_tintTimer", null);
        }
    });
    enemy.setData("_tintTimer", timer);
}
