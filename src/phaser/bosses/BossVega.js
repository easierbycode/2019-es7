import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function bossPatternVega(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = 80;
    var diveY = GH - 20;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;

    if (seed < 0.1) {
        var warpPositions = [
            30,
            GW - 30,
            clamp(Math.random() * GW, 30, GW - 30),
        ];
        var wi = 0;
        var warpStep = function () {
            if (!scene._bossAlive() || wi >= warpPositions.length) {
                if (scene._bossAlive()) {
                    scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                }
                return;
            }
            scene.tweens.add({
                targets: boss, alpha: 0, duration: 100,
                onComplete: function () {
                    if (!scene._bossAlive()) return;
                    boss.x = warpPositions[wi++];
                    scene.tweens.add({
                        targets: boss, alpha: 1, duration: 100,
                        onComplete: function () {
                            scene.time.delayedCall(200, warpStep);
                        },
                    });
                },
            });
        };
        warpStep();
    } else if (seed < 0.4) {
        var shotPositions = [30, GW - 60, 50, GCX, GW - 40, 60, GCX];
        var si = 0;
        var psychoStep = function () {
            if (!scene._bossAlive() || si >= shotPositions.length) {
                if (scene._bossAlive()) {
                    scene.time.delayedCall(800, function () { scene.bossShootStart(); });
                }
                return;
            }
            scene.tweens.add({
                targets: boss, alpha: 0, duration: 100,
                onComplete: function () {
                    if (!scene._bossAlive()) return;
                    boss.x = shotPositions[si++];
                    scene.tweens.add({
                        targets: boss, alpha: 1, duration: 100,
                        onComplete: function () {
                            if (!scene._bossAlive()) return;
                            scene.bossShootAimed(projA);
                            scene.time.delayedCall(300, psychoStep);
                        },
                    });
                },
            });
        };
        psychoStep();
    } else if (seed < 0.7) {
        scene.tweens.add({
            targets: boss, x: GCX, y: baseY + 10, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                var fieldCount = 0;
                scene.time.addEvent({
                    delay: 300, repeat: 4,
                    callback: function () {
                        if (!scene._bossAlive()) return;
                        scene.bossShootRadial(projB, 12);
                        fieldCount++;
                        if (fieldCount >= 5) {
                            scene.time.delayedCall(800, function () { scene.bossShootStart(); });
                        }
                    },
                });
            },
        });
    } else {
        var px6 = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, alpha: 0, duration: 100,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                boss.x = px6;
                scene.tweens.add({
                    targets: boss, alpha: 1, y: baseY - 20, duration: 200,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        scene.bossShootSpread(projA, 3, 30);
                        scene.tweens.add({
                            targets: boss, y: diveY, duration: 900,
                            onComplete: function () {
                                if (!scene._bossAlive()) return;
                                boss.x = GCX;
                                boss.y = -50;
                                scene.tweens.add({
                                    targets: boss, y: baseY, duration: 1000,
                                    onComplete: function () {
                                        scene.time.delayedCall(500, function () { scene.bossShootStart(); });
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
