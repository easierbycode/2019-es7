import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function bossPatternSagat(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = scene.bossBaseY || GH / 4;
    var diveY = GH - 40;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;

    if (seed < 0.3) {
        var positions = [-20, 10, 50, 100, 150, 200];
        var pi = 0;
        var sweepStep = function () {
            if (!scene._bossAlive() || pi >= positions.length) {
                if (scene._bossAlive()) {
                    scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                }
                return;
            }
            var px = clamp(positions[pi], 20, GW - 20);
            pi++;
            scene.tweens.add({
                targets: boss, x: px, duration: 250,
                onComplete: function () {
                    if (!scene._bossAlive()) return;
                    scene.bossShootStraight(projA);
                    scene.time.delayedCall(250, sweepStep);
                },
            });
        };
        sweepStep();
    } else if (seed < 0.6) {
        var px3 = clamp(Math.random() * GW, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px3, duration: 250,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                var shotCount = 0;
                scene.time.addEvent({
                    delay: 200, repeat: 6,
                    callback: function () {
                        if (!scene._bossAlive()) return;
                        scene.bossShootStraight(projA);
                        shotCount++;
                        if (shotCount >= 7) {
                            scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                        }
                    },
                });
            },
        });
    } else if (seed < 0.8) {
        var px4 = clamp(Math.random() * GW, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px4, duration: 250,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.time.delayedCall(500, function () {
                    if (!scene._bossAlive()) return;
                    scene.bossShootStraight(projB);
                    scene.time.delayedCall(800, function () { scene.bossShootStart(); });
                });
            },
        });
    } else {
        var px5 = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px5, y: baseY - 20, duration: 400,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.bossShootStraight(projA);
                scene.time.delayedCall(500, function () {
                    if (!scene._bossAlive()) return;
                    scene.tweens.add({
                        targets: boss, y: diveY, duration: 300,
                        onComplete: function () {
                            if (!scene._bossAlive()) return;
                            scene.tweens.add({
                                targets: boss, y: baseY, duration: 200,
                                onComplete: function () {
                                    scene.time.delayedCall(400, function () { scene.bossShootStart(); });
                                },
                            });
                        },
                    });
                });
            },
        });
    }
}
