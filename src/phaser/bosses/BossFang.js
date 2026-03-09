import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function bossPatternFang(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = 60;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;
    var projC = scene.bossProjDataC || scene.bossProjData;

    if (seed < 0.3) {
        var volleys = 0;
        var beamStep = function () {
            if (!scene._bossAlive() || volleys >= 3) {
                if (scene._bossAlive()) {
                    scene.time.delayedCall(1000, function () { scene.bossShootStart(); });
                }
                return;
            }
            volleys++;
            scene.bossShootSpread(projA, 3, 25);
            scene.time.delayedCall(500, beamStep);
        };
        scene.time.delayedCall(300, beamStep);
    } else if (seed < 0.7) {
        scene.bossShootRadial(projC || projA, 8);
        scene.time.delayedCall(1500, function () { scene.bossShootStart(); });
    } else {
        var smokeCount = 0;
        var smokeTotal = 12;
        scene.time.addEvent({
            delay: 300, repeat: smokeTotal - 1,
            callback: function () {
                if (!scene._bossAlive()) return;
                boss.x = clamp(boss.x + (Math.random() - 0.5) * 20, 30, GW - 30);
                scene.bossShootAimed(projB || projA);
                smokeCount++;
                if (smokeCount >= smokeTotal) {
                    scene.time.delayedCall(1000, function () { scene.bossShootStart(); });
                }
            },
        });
    }
}
