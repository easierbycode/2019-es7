import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;

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

// BossFang pattern — matches PIXI BossFang.shootStart()
// Seed 0–0.3:    Beam spread — charge anim, then 3 sequential beams at 105°/90°/75°
// Seed 0.31–0.7: Meka radial — 8-way radial burst
// Seed 0.71–1:   Smoke aimed — 12 aimed smoke projectiles

export function bossPatternFang(scene, seed) {
    var boss = scene.bossSprite;
    var projA = scene.bossProjDataA || scene.bossProjData;
    var projB = scene.bossProjDataB || scene.bossProjData;
    var projC = scene.bossProjDataC || scene.bossProjData;

    if (seed < 0.3) {
        // Beam spread: charge anim → 500ms → (shoot anim + beam) x3 cycling 105°/90°/75°
        // Matches PIXI: onCharge → 0.5s → onShoot → 0.5s → onShoot → 0.5s → onShoot → 0.3s → onIdle
        var beamAngles = [105, 90, 75];
        var beamIdx = 0;

        _setBossAnim(scene, boss, scene.fangAnimCharge);

        scene.time.delayedCall(500, function beamStep() {
            if (!scene._bossAlive() || beamIdx >= 3) {
                if (scene._bossAlive()) {
                    _setBossAnim(scene, boss, scene.fangAnimIdle);
                    scene.time.delayedCall(1000, function () { scene.bossShootStart(); });
                }
                return;
            }
            // Play shoot anim and fire beam simultaneously (matches PIXI onShoot)
            _setBossAnim(scene, boss, scene.fangAnimShoot);
            scene.playSound("boss_fang_voice_beam0", 0.7);
            scene.bossShootBeam(projA, beamAngles[beamIdx]);
            beamIdx++;
            scene.time.delayedCall(500, beamStep);
        });
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
