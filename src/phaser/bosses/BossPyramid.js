import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;

// BossPyramid pattern — matches the Pyramid class reference implementation.
// Seed 0–0.1:    Warp — teleport to 3 positions (no shooting)
// Seed 0.11–0.4: Pentagram — shoot straight down from 7 x positions simultaneously
// Seed 0.41–0.7: PsychoField — center, 5 radial bursts (72 projectiles) at 1s intervals
// Seed 0.71–1:   Dive attack — teleport to player x, dive down, return from top

export function bossPatternPyramid(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = scene.bossBaseY || GH / 4;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;
    var halfW = boss.width / 2;

    if (seed < 0.1) {
        // Warp — teleport to 3 positions (matches Pyramid onWarp)
        var warpPositions = [
            0 + halfW,
            GW - boss.width + halfW,
            Math.floor(Math.random() * (GW - boss.width)) + halfW,
        ];
        var wi = 0;
        var warpStep = function () {
            if (!scene._bossAlive() || wi >= warpPositions.length) {
                if (scene._bossAlive()) {
                    scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                }
                return;
            }
            boss.x = warpPositions[wi++];
            warpStep();
        };
        warpStep();
    } else if (seed < 0.4) {
        // Pentagram multi-shot — 7 straight-down shots from 7 positions
        // PIXI positions (top-left origin) converted to Phaser center origin
        var shotPositions = [
            0 + halfW,
            160 + halfW,
            16 + halfW,
            128 + halfW,
            32 + halfW,
            96 + halfW,
            GCX,
        ];
        for (var si = 0; si < shotPositions.length; si++) {
            boss.x = shotPositions[si];
            scene.bossShootStraight(projA);
        }
        // Return boss to last position (center)
        boss.x = GCX;
        // Wait 4.0 seconds before next pattern (matches TimelineMax "+=4.0")
        scene.time.delayedCall(4000, function () { scene.bossShootStart(); });
    } else if (seed < 0.7) {
        // PsychoField — move to center, shoot anim, 5 radial bursts at 1s intervals
        scene.tweens.add({
            targets: boss, x: GCX, y: baseY + 10, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                var fieldCount = 0;
                // Initial delay 0.5s (matches "+=0.5" before first onPsychoFieldAttack)
                // then first shoot at +=0.3
                scene.time.delayedCall(800, function fireField() {
                    if (!scene._bossAlive()) return;
                    scene.bossShootRadial(projB, 72);
                    fieldCount++;
                    if (fieldCount >= 5) {
                        // Wait 3.0 seconds (matches TimelineMax "+=3.0")
                        scene.time.delayedCall(3000, function () { scene.bossShootStart(); });
                    } else {
                        // 1 second between each burst (matches "+=1" callbacks)
                        scene.time.delayedCall(1000, fireField);
                    }
                });
            },
        });
    } else {
        // Dive attack — teleport to player x, dive down, return from top
        var px = scene.playerSprite.x;
        boss.x = px;
        scene.tweens.add({
            targets: boss, y: baseY - 20, duration: 200,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.tweens.add({
                    targets: boss, y: GH - 15, duration: 900,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        boss.x = GCX;
                        boss.y = -boss.height;
                        scene.tweens.add({
                            targets: boss, y: baseY, duration: 1000,
                            onComplete: function () {
                                scene.time.delayedCall(1000, function () { scene.bossShootStart(); });
                            },
                        });
                    },
                });
            },
        });
    }
}
