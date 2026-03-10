import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

// BossGoki pattern — matches PIXI BossGoki.shootStart()
// Seed 0–0.34:   Move toward player, shoot 6 aimed projectiles (projA)
// Seed 0.35–0.64: Move toward player, shoot 1 big projectile (projB)
// Seed 0.65–0.89: Ashura senku — dive attack downward then warp back up
// Seed 0.9–1:     Ashura senku — quick warp to random position

export function bossPatternGoki(scene, seed) {
    var boss = scene.bossSprite;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;

    if (seed < 0.35) {
        // Move toward player then fire 6 straight-down projectiles
        var px = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px, duration: 400,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                var volleys = 0;
                var shootStep = function () {
                    if (!scene._bossAlive() || volleys >= 6) {
                        if (scene._bossAlive()) {
                            scene.time.delayedCall(300, function () { scene.bossShootStart(); });
                        }
                        return;
                    }
                    scene.bossShootStraight(projA);
                    if (volleys % 2 === 0) {
                        scene.playSound("boss_goki_voice_projectile0", 0.7);
                    }
                    volleys++;
                    scene.time.delayedCall(320, shootStep);
                };
                shootStep();
            },
        });
    } else if (seed < 0.65) {
        // Move toward player then shoot 1 big projectile
        var px2 = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px2, duration: 400,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.playSound("boss_goki_voice_projectile1", 0.7);
                scene.time.delayedCall(400, function () {
                    if (!scene._bossAlive()) return;
                    scene.bossShootStraight(projB);
                    scene.time.delayedCall(800, function () { scene.bossShootStart(); });
                });
            },
        });
    } else if (seed < 0.9) {
        // Ashura senku — dive attack
        scene.playSound("boss_goki_voice_ashura", 0.7);
        scene.tweens.add({
            targets: boss, y: GH - 20, duration: 1200,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                var nx = Math.random() * (GW - 60) + 30;
                boss.x = nx;
                boss.y = -50;
                scene.tweens.add({
                    targets: boss, y: GH / 4, duration: 700,
                    onComplete: function () {
                        scene.time.delayedCall(300, function () { scene.bossShootStart(); });
                    },
                });
            },
        });
    } else {
        // Ashura senku — quick warp
        scene.playSound("boss_goki_voice_ashura", 0.7);
        var nx2 = Math.random() * (GW - 60) + 30;
        var ny = Math.random() > 0.5 ? 60 : GH / 4;
        scene.tweens.add({
            targets: boss, x: nx2, y: ny, duration: 700,
            onComplete: function () {
                scene.time.delayedCall(300, function () { scene.bossShootStart(); });
            },
        });
    }
}
