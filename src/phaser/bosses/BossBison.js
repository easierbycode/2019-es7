import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function bossPatternBison(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = scene.bossBaseY || GH / 4;
    var downY = GH - 60;

    if (seed < 0.6) {
        var targetX = clamp(Math.random() * GW, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: targetX, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.tweens.add({
                    targets: boss, y: baseY - 10, duration: 500,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        scene.tweens.add({
                            targets: boss, y: downY, duration: 350,
                            onComplete: function () {
                                if (!scene._bossAlive()) return;
                                scene.tweens.add({
                                    targets: boss, y: baseY, duration: 200,
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
    } else if (seed < 0.8) {
        var steps = [
            { x: 30, y: baseY - 20, d: 400 },
            { x: GW - 60, y: baseY, d: 400 },
            { x: 30, y: baseY + 30, d: 400 },
            { x: GW - 60, y: baseY + 60, d: 400 },
        ];
        var idx = 0;
        var runStep = function () {
            if (!scene._bossAlive() || idx >= steps.length) {
                if (!scene._bossAlive()) return;
                scene.tweens.add({
                    targets: boss, y: downY, duration: 300,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        scene.tweens.add({
                            targets: boss, y: baseY, duration: 200,
                            onComplete: function () {
                                scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                            },
                        });
                    },
                });
                return;
            }
            var s = steps[idx++];
            scene.tweens.add({
                targets: boss, x: s.x, y: s.y, duration: s.d,
                onComplete: function () {
                    scene.time.delayedCall(100, runStep);
                },
            });
        };
        runStep();
    } else {
        var steps2 = [
            { x: GW - 30, y: baseY - 20, d: 400 },
            { x: 60, y: baseY, d: 400 },
            { x: GW - 30, y: baseY + 30, d: 400 },
            { x: 60, y: baseY + 60, d: 400 },
        ];
        var idx2 = 0;
        var runStep2 = function () {
            if (!scene._bossAlive() || idx2 >= steps2.length) {
                if (!scene._bossAlive()) return;
                scene.tweens.add({
                    targets: boss, y: downY, duration: 300,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        scene.tweens.add({
                            targets: boss, y: baseY, duration: 200,
                            onComplete: function () {
                                scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                            },
                        });
                    },
                });
                return;
            }
            var s = steps2[idx2++];
            scene.tweens.add({
                targets: boss, x: s.x, y: s.y, duration: s.d,
                onComplete: function () {
                    scene.time.delayedCall(100, runStep2);
                },
            });
        };
        runStep2();
    }
}
