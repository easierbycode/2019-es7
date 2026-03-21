// src/ps2/player.js — Player entity for PS2 AthenaEnv port
// Ported from src/game-objects/Player.js

var PLAYER_MOVE_SPEED = 6;
var PLAYER_SMOOTHING = 0.09;

function createPlayer(data) {
    var p = {
        // Position (unit coords — top-left of sprite)
        x: 0,
        y: 0,
        // Target position for smooth movement
        targetX: 0,
        targetY: 0,
        // Sprite frames — cyber-liberty spritesheet (32x32, 2-frame idle)
        atlas: "cyber-liberty",
        frames: ["0", "1"],
        animFrame: 0,
        animSpeed: 0.15, // slower cycle matching Phaser: 250ms + 100ms
        animCounter: 0,
        // Stats
        hp: data.hp || 100,
        maxHp: data.maxHp || 100,
        percent: 1.0,
        // Shoot
        shootOn: 0,
        shootMode: "normal",
        shootSpeed: 0,
        shootInterval: 20,
        bulletFrameCnt: 0,
        bulletIdCnt: 0,
        bullets: [],
        // Shoot data
        shootNormalData: data.shootNormal || {},
        shootBigData: data.shootBig || {},
        shoot3wayData: data.shoot3way || {},
        // Barrier
        barrierFlg: 0,
        barrierAlpha: 0,
        barrierTimer: 0,
        barrierMaxTime: 600, // ~10 seconds at 60fps (scaled to 30fps = 300 frames)
        barrierFrames: (data.barrier && data.barrier.texture) ? data.barrier.texture : [],
        barrierAnimFrame: 0,
        // Visual
        alpha: 1.0,
        visible: 1,
        damageAnimFlg: 0,
        damageAnimTimer: 0,
        tintFlash: 0,
        // Dimensions (cyber-liberty: 32x32)
        width: 32,
        height: 32,
        hitX: 9,
        hitY: 12,
        hitW: 14,
        hitH: 8,
        // Shadow
        shadowOffsetY: 5,
        // State
        dead: 0,
        explosionPlaying: 0,
        explosionFrame: 0,
        explosionTimer: 0,
        // Name
        name: data.name || "",
    };

    // Set initial shoot data
    if (p.shootNormalData.interval) {
        p.shootInterval = p.shootNormalData.interval;
    }

    return p;
}

function playerSetUp(p, hp, shootMode, shootSpeed) {
    p.hp = hp;
    p.percent = p.hp / p.maxHp;
    p.shootMode = shootMode;
    p.dead = 0;
    p.explosionPlaying = 0;
    p.visible = 1;
    p.alpha = 1.0;
    p.damageAnimFlg = 0;

    switch (shootMode) {
    case "normal":
        p.shootInterval = p.shootNormalData.interval || 20;
        break;
    case "big":
        p.shootInterval = p.shootBigData.interval || 20;
        break;
    case "3way":
        p.shootInterval = p.shoot3wayData.interval || 20;
        break;
    }

    switch (shootSpeed) {
    case "speed_high":
        p.shootSpeed = 15;
        break;
    default:
        p.shootSpeed = 0;
        break;
    }
}

function playerLoop(p) {
    if (p.dead) return;

    // Smooth movement
    p.x += PLAYER_SMOOTHING * (p.targetX - (p.x + p.width / 2));
    p.y += PLAYER_SMOOTHING * (p.targetY - p.y);

    // Animate
    p.animCounter += p.animSpeed;
    if (p.animCounter >= p.frames.length) {
        p.animCounter -= p.frames.length;
    }
    p.animFrame = Math.floor(p.animCounter) % p.frames.length;

    // Shooting
    p.bulletFrameCnt++;
    var interval = p.shootInterval - p.shootSpeed;
    if (interval < 1) interval = 1;

    if (p.shootOn && p.bulletFrameCnt % interval === 0) {
        playerShoot(p);
    }

    // Update bullets
    for (var i = p.bullets.length - 1; i >= 0; i--) {
        var b = p.bullets[i];
        b.x += 3.5 * Math.cos(b.rotation);
        b.y += 3.5 * Math.sin(b.rotation);

        if (b.y <= 40 || b.x <= -b.width || b.x >= GW) {
            p.bullets.splice(i, 1);
        }
    }

    // Damage animation
    if (p.damageAnimFlg) {
        p.damageAnimTimer++;
        if (p.damageAnimTimer % 4 < 2) {
            p.tintFlash = 1;
            p.alpha = 0.5;
        } else {
            p.tintFlash = 0;
            p.alpha = 1.0;
        }
        if (p.damageAnimTimer > 30) {
            p.damageAnimFlg = 0;
            p.damageAnimTimer = 0;
            p.tintFlash = 0;
            p.alpha = 1.0;
        }
    }

    // Barrier countdown
    if (p.barrierFlg) {
        p.barrierTimer++;
        // Flashing near end
        if (p.barrierTimer > p.barrierMaxTime * 0.7) {
            p.barrierAlpha = (p.barrierTimer % 6 < 3) ? 1.0 : 0.3;
        } else {
            p.barrierAlpha = 1.0;
        }
        if (p.barrierTimer >= p.barrierMaxTime) {
            p.barrierFlg = 0;
            p.barrierAlpha = 0;
            p.barrierTimer = 0;
            playSfx("se_barrier_end");
        }
    }
}

function playerShoot(p) {
    var rad270 = 270 * Math.PI / 180;
    var rad260 = 260 * Math.PI / 180;
    var rad280 = 280 * Math.PI / 180;

    switch (p.shootMode) {
    case "normal": {
        var b = createPlayerBullet(p, rad270, 14, 11);
        b.name = "normal";
        b.damage = p.shootNormalData.damage || 1;
        b.hp = p.shootNormalData.hp || 1;
        p.bullets.push(b);
        playSfx("se_shoot");
        break;
    }
    case "big": {
        var b = createPlayerBullet(p, rad270, 10, 22);
        b.name = "big";
        b.damage = p.shootBigData.damage || 2;
        b.hp = p.shootBigData.hp || 3;
        b.width = 16;
        b.height = 16;
        p.bullets.push(b);
        playSfx("se_shoot_b");
        break;
    }
    case "3way": {
        for (var i = 0; i < 3; i++) {
            var angle = i === 0 ? rad280 : (i === 1 ? rad270 : rad260);
            var ox = i === 0 ? 14 : (i === 1 ? 10 : 6);
            var b = createPlayerBullet(p, angle, ox, 11);
            b.name = "3way";
            b.damage = p.shootNormalData.damage || 1;
            b.hp = p.shootNormalData.hp || 1;
            p.bullets.push(b);
        }
        playSfx("se_shoot");
        break;
    }
    }
}

function createPlayerBullet(p, rotation, offsetX, offsetY) {
    return {
        id: p.bulletIdCnt++,
        x: p.x + 5 * Math.sin(rotation) + offsetX,
        y: p.y + 5 * Math.sin(rotation) + offsetY,
        rotation: rotation,
        width: 8,
        height: 8,
        damage: 1,
        hp: 1,
        name: "normal",
        dead: 0,
    };
}

function playerOnDamage(p, amount) {
    if (p.barrierFlg || p.damageAnimFlg || p.dead) return;

    p.hp -= amount;
    if (p.hp <= 0) p.hp = 0;
    p.percent = p.hp / p.maxHp;

    if (p.hp <= 0) {
        p.dead = 1;
        p.explosionPlaying = 1;
        p.explosionFrame = 0;
        p.explosionTimer = 0;
        p.shootOn = 0;
        playSfx("se_explosion");
        playSfx("g_continue_no_voice0");
    } else {
        p.damageAnimFlg = 1;
        p.damageAnimTimer = 0;
        playSfx("g_damage_voice");
        playSfx("se_damage");
    }
}

function playerShootModeChange(p, mode) {
    p.shootMode = mode;
    switch (mode) {
    case "normal":
        p.shootInterval = p.shootNormalData.interval || 20;
        break;
    case "big":
        p.shootInterval = p.shootBigData.interval || 20;
        break;
    case "3way":
        p.shootInterval = p.shoot3wayData.interval || 20;
        break;
    }
    playSfx("g_powerup_voice");
}

function playerShootSpeedChange(p, speed) {
    switch (speed) {
    case "speed_high":
        p.shootSpeed = 15;
        break;
    default:
        p.shootSpeed = 0;
        break;
    }
    playSfx("g_powerup_voice");
}

function playerBarrierStart(p) {
    p.barrierFlg = 1;
    p.barrierAlpha = 1.0;
    p.barrierTimer = 0;
    playSfx("se_barrier_start");
}

function playerDraw(p) {
    if (!p.visible || p.alpha <= 0) return;

    if (p.dead && p.explosionPlaying) {
        // Draw explosion animation
        var expFrame = "explosion0" + String(Math.min(p.explosionFrame, 6)) + ".gif";
        p.explosionTimer++;
        if (p.explosionTimer % 3 === 0) p.explosionFrame++;
        if (p.explosionFrame > 6) {
            p.explosionPlaying = 0;
        }
        drawFrame("game_asset", resolveFrameName("game_asset", expFrame),
            toScreenX(p.x + p.width / 2), toScreenY(p.y + p.height / 2),
            SCALE, SCALE, 1.0, null);
        return;
    }

    if (p.dead) return;

    // Draw shadow
    var playerAtlas = p.atlas || "game_asset";
    var shadowFrame = p.frames.length > 0 ? resolveFrameName(playerAtlas, p.frames[p.animFrame]) : null;
    if (shadowFrame) {
        var shadowColor = Color.new(30, 30, 30, 60);
        drawFrame(playerAtlas, shadowFrame,
            toScreenX(p.x + p.width / 2), toScreenY(p.y + p.height / 2 + p.shadowOffsetY),
            SCALE, SCALE, 0.3, shadowColor);
    }

    // Draw player
    if (p.frames.length > 0) {
        var frame = resolveFrameName(playerAtlas, p.frames[p.animFrame]);
        var tint = null;
        if (p.tintFlash) {
            tint = Color.new(128, 40, 40, Math.floor(p.alpha * 128));
        } else if (p.alpha < 1.0) {
            tint = Color.new(128, 128, 128, Math.floor(p.alpha * 128));
        }
        drawFrame(playerAtlas, frame,
            toScreenX(p.x + p.width / 2), toScreenY(p.y + p.height / 2),
            SCALE, SCALE, p.alpha, tint);
    }

    // Draw barrier
    if (p.barrierFlg && p.barrierAlpha > 0) {
        if (p.barrierFrames.length > 0) {
            p.barrierAnimFrame = (p.barrierAnimFrame + 0.15) % p.barrierFrames.length;
            var bFrame = resolveFrameName("game_asset", p.barrierFrames[Math.floor(p.barrierAnimFrame)]);
            var bTint = Color.new(128, 128, 128, Math.floor(p.barrierAlpha * 128));
            drawFrame("game_asset", bFrame,
                toScreenX(p.x + p.width / 2), toScreenY(p.y - 15 + 20),
                SCALE, SCALE, p.barrierAlpha, bTint);
        }
    }

    // Draw bullets
    for (var i = 0; i < p.bullets.length; i++) {
        var bullet = p.bullets[i];
        var bfName = null;
        switch (bullet.name) {
        case "big":
            bfName = p.shootBigData.texture ? p.shootBigData.texture[0] : null;
            break;
        default:
            bfName = p.shootNormalData.texture ? p.shootNormalData.texture[0] : null;
            break;
        }
        if (bfName) {
            bfName = resolveFrameName("game_asset", bfName);
            drawFrame("game_asset", bfName,
                toScreenX(bullet.x + bullet.width / 2),
                toScreenY(bullet.y + bullet.height / 2),
                SCALE, SCALE, 1.0, null);
        }
    }
}
