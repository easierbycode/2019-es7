import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;

// Switch boss sprite + shadow animation frames (matches PIXI texture swap pattern)
function _setBossAnim(scene, boss, frames) {
    if (!frames || frames.length === 0 || !boss || !boss.active) return;
    boss.setData("frames", frames);
    boss.setData("animIdx", 0);
    boss.setData("animTimer", 0);
    try { boss.setFrame(frames[0]); } catch (e) {}
    var shadow = boss.getData("shadow");
    if (shadow && shadow.active) {
        try { shadow.setFrame(frames[0]); } catch (e) {}
    }
}

// BossPyramid pattern — matches the Pyramid class reference implementation.
// Seed 0–0.1:    Warp — teleport to 3 positions (onWarp → warp anim)
// Seed 0.11–0.4: Pentagram — shoot straight down from 7 x positions (onPsychoShoot → shoot anim)
// Seed 0.41–0.7: PsychoField — center, 5 radial bursts at 1s intervals (onPsychoFieldAttack → shoot anim)
// Seed 0.71–1:   Dive attack — teleport to player x, dive down, return from top (onAttack → attack anim)
// After each phase: onIdle → idle anim

export function bossPatternPyramid(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = scene.bossBaseY || GH / 4;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;
    var halfW = boss.width / 2;

    // PIXI reference animation sets (fall back to idle when a set is missing)
    var animIdle = scene.pyramidAnimIdle || [];
    var animAttack = scene.pyramidAnimAttack && scene.pyramidAnimAttack.length ? scene.pyramidAnimAttack : animIdle;
    var animShoot = scene.pyramidAnimShoot && scene.pyramidAnimShoot.length ? scene.pyramidAnimShoot : animIdle;
    var animWarp = scene.pyramidAnimWarp && scene.pyramidAnimWarp.length ? scene.pyramidAnimWarp : animIdle;

    if (seed < 0.1) {
        // Warp — onWarp plays warp anim, teleport to 3 positions
        _setBossAnim(scene, boss, animWarp);
        var warpPositions = [
            0 + halfW,
            GW - boss.width + halfW,
            Math.floor(Math.random() * (GW - boss.width)) + halfW,
        ];
        var wi = 0;
        var warpStep = function () {
            if (!scene._bossAlive() || wi >= warpPositions.length) {
                if (scene._bossAlive()) {
                    // onIdle after warp completes
                    _setBossAnim(scene, boss, animIdle);
                    scene.time.delayedCall(500, function () { scene.bossShootStart(); });
                }
                return;
            }
            boss.x = warpPositions[wi++];
            warpStep();
        };
        warpStep();
    } else if (seed < 0.4) {
        // Pentagram multi-shot — onPsychoShoot plays shoot anim, 7 straight-down shots
        _setBossAnim(scene, boss, animShoot);
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
        // Wait 4.0 seconds before next pattern (matches TimelineMax "+=4.0"),
        // then play onIdle before restarting
        scene.time.delayedCall(4000, function () {
            if (!scene._bossAlive()) return;
            _setBossAnim(scene, boss, animIdle);
            scene.bossShootStart();
        });
    } else if (seed < 0.7) {
        // PsychoField — move to center, shoot anim, 5 radial bursts at 1s intervals
        scene.tweens.add({
            targets: boss, x: GCX, y: baseY + 10, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                // onPsychoFieldAttack plays shoot anim
                _setBossAnim(scene, boss, animShoot);
                var fieldCount = 0;
                // Initial delay 0.5s (matches "+=0.5" before first onPsychoFieldAttack)
                // then first shoot at +=0.3
                scene.time.delayedCall(800, function fireField() {
                    if (!scene._bossAlive()) return;
                    scene.bossShootRadial(projB, 72);
                    fieldCount++;
                    if (fieldCount >= 5) {
                        // onIdle after bursts finish
                        _setBossAnim(scene, boss, animIdle);
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
        // Dive attack — onAttack plays attack anim, teleport to player x, dive down, return from top
        var px = scene.playerSprite.x;
        boss.x = px;
        _setBossAnim(scene, boss, animAttack);
        scene.tweens.add({
            targets: boss, y: baseY - 20, duration: 200,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                scene.tweens.add({
                    targets: boss, y: GH - 15, duration: 900,
                    onComplete: function () {
                        if (!scene._bossAlive()) return;
                        // onIdle while repositioning at top
                        _setBossAnim(scene, boss, animIdle);
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
