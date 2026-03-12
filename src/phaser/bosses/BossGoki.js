import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

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
                            _setBossAnim(scene, boss, scene.gokiAnimIdle);
                            scene.time.delayedCall(300, function () { scene.bossShootStart(); });
                        }
                        return;
                    }
                    // Play shootA anim, brief pause, then fire (matches PIXI onShootA at +=0 then shoot at +=0.32)
                    _setBossAnim(scene, boss, scene.gokiAnimShootA);
                    if (volleys % 2 === 0) {
                        scene.playSound("boss_goki_voice_projectile0", 0.7);
                    }
                    volleys++;
                    scene.time.delayedCall(200, function () {
                        if (!scene._bossAlive()) return;
                        scene.bossShootStraight(projA);
                        scene.time.delayedCall(120, shootStep);
                    });
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
                // Play shootB anim, wait for anim to finish, then fire (matches PIXI onShootB at +=0 then shoot at +=0.4)
                _setBossAnim(scene, boss, scene.gokiAnimShootB);
                scene.playSound("boss_goki_voice_projectile1", 0.7);
                scene.time.delayedCall(500, function () {
                    if (!scene._bossAlive()) return;
                    scene.bossShootStraight(projB);
                    scene.time.delayedCall(800, function () {
                        _setBossAnim(scene, boss, scene.gokiAnimIdle);
                        scene.bossShootStart();
                    });
                });
            },
        });
    } else if (seed < 0.9) {
        // Ashura senku — dive attack
        // Play syngoku anim, then dive after 400ms delay (matches PIXI ashuraSenku at +=0.4)
        _setBossAnim(scene, boss, scene.gokiAnimSyngoku);
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
                        _setBossAnim(scene, boss, scene.gokiAnimIdle);
                        scene.time.delayedCall(300, function () { scene.bossShootStart(); });
                    },
                });
            },
        });
    } else {
        // Ashura senku — quick warp
        // Play syngoku anim at start (matches PIXI ashuraSenku)
        _setBossAnim(scene, boss, scene.gokiAnimSyngoku);
        scene.playSound("boss_goki_voice_ashura", 0.7);
        var nx2 = Math.random() * (GW - 60) + 30;
        var ny = Math.random() > 0.5 ? 60 : GH / 4;
        scene.tweens.add({
            targets: boss, x: nx2, y: ny, duration: 700,
            onComplete: function () {
                _setBossAnim(scene, boss, scene.gokiAnimIdle);
                scene.time.delayedCall(300, function () { scene.bossShootStart(); });
            },
        });
    }
}
