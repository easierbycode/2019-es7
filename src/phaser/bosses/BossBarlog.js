import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function bossPatternBarlog(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = scene.bossBaseY || GH / 4;
    var diveY = GH - 40;

    if (seed < 0.3) {
        var rx = clamp(Math.random() * GW, 30, GW - 30);
        var ry = clamp(60 + Math.random() * 120, 60, 200);
        scene.tweens.add({
            targets: boss, x: rx, y: ry, duration: 600,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.bossShootStraight(scene.bossProjData);
                scene.time.delayedCall(600, function () { scene.bossShootStart(); });
            },
        });
    } else if (seed < 0.8) {
        var px = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.time.delayedCall(400, function () {
                    if (!scene._bossAlive()) return;
                    scene.bossShootStraight(scene.bossProjData);
                    scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                });
            },
        });
    } else {
        var px2 = clamp(scene.playerSprite.x, 30, GW - 30);
        scene.tweens.add({
            targets: boss, x: px2, duration: 500,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.bossShootStraight(scene.bossProjData);
                scene.tweens.add({
                    targets: boss, y: baseY - 70, duration: 300,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        scene.tweens.add({
                            targets: boss, y: diveY, duration: 600,
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
    }
}
