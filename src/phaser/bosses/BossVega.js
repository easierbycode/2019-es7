import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

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

// BossVega pattern — matches PIXI BossVega.shootStart()
// Seed 0–0.1:    Warp — teleport to 3 positions (no anim change, warp voice)
// Seed 0.11–0.4: Psycho Crusher — teleport + aimed shots at 7 positions (voice on 1st/4th/7th)
// Seed 0.41–0.7: Psycho Field — center, shoot anim, 5 radial bursts, then idle
// Seed 0.71–1:   Spread + Dive — warp to player, attack anim, dive down, return

export function bossPatternVega(scene, seed) {
    var boss = scene.bossSprite;
    var baseY = 80;
    var diveY = GH - 20;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;

    if (seed < 0.1) {
        // Warp — teleport to 3 positions with alpha fade
        // PIXI: onWarp() plays voice only, no anim change
        var warpPositions = [
            30,
            GW - 30,
            clamp(Math.random() * GW, 30, GW - 30),
        ];
        var wi = 0;
        scene.playSound("boss_vega_voice_warp", 0.7);
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
        // Psycho Crusher — teleport + aimed shots at 7 positions
        // PIXI: onPsychoShoot() just fires, voice on shots 0, 3, 6
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
                    boss.x = shotPositions[si];
                    if (si === 0 || si === 3 || si === 6) {
                        scene.playSound("boss_vega_voice_projectile", 0.7);
                    }
                    si++;
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
        // Psycho Field — center, shoot anim, 5 radial bursts, then idle
        // PIXI: onPsychoFieldAttack() → shoot anim + voice, then onPsychoShoot x5, then onIdle
        scene.tweens.add({
            targets: boss, x: GCX, y: baseY + 10, duration: 300,
            onComplete: function () {
                if (!scene._bossAlive()) return;
                // Play shoot anim + voice (matches PIXI onPsychoFieldAttack)
                _setBossAnim(scene, boss, scene.vegaAnimShoot);
                scene.playSound("boss_vega_voice_shoot", 0.7);
                var fieldCount = 0;
                scene.time.delayedCall(500, function fireField() {
                    if (!scene._bossAlive()) return;
                    scene.bossShootRadial(projB, 12);
                    fieldCount++;
                    if (fieldCount >= 5) {
                        _setBossAnim(scene, boss, scene.vegaAnimIdle);
                        scene.time.delayedCall(800, function () { scene.bossShootStart(); });
                    } else {
                        scene.time.delayedCall(1000, fireField);
                    }
                });
            },
        });
    } else {
        // Spread + Dive — warp to player, attack anim, dive down, return
        // PIXI: blur→warp→onAttack(attack anim + crusher voice)→dive→onIdle→reposition→rise
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
                        // Play attack anim + crusher voice (matches PIXI onAttack)
                        _setBossAnim(scene, boss, scene.vegaAnimAttack);
                        scene.playSound("boss_vega_voice_crusher", 0.7);
                        scene.bossShootSpread(projA, 3, 30);
                        scene.tweens.add({
                            targets: boss, y: diveY, duration: 900,
                            onComplete: function () {
                                if (!scene._bossAlive()) return;
                                // Back to idle (matches PIXI onIdle after dive)
                                _setBossAnim(scene, boss, scene.vegaAnimIdle);
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
