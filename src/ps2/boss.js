// src/ps2/boss.js — Boss entity for PS2 AthenaEnv port
// Simplified boss with pattern-based attacks

function createBoss(data, stageId) {
    var b = {
        name: data.name || "",
        atlas: "game_asset",
        frames: data.texture || [],
        animFrame: 0,
        animSpeed: 0.15,
        animCounter: 0,
        x: 0,
        y: -64,
        width: 64,
        height: 64,
        hitX: 0,
        hitY: 0,
        hitW: 64,
        hitH: 64,
        hp: data.hp || 100,
        maxHp: data.hp || 100,
        score: data.score || 1000,
        spgage: data.spgage || 50,
        speed: data.speed || 1,
        // Attack pattern
        stageId: stageId,
        projectileData: data.projectileData || null,
        projectileDataA: data.projectileDataA || null,
        projectileDataB: data.projectileDataB || null,
        projectileDataC: data.projectileDataC || null,
        shootFlg: false,
        patternTimer: 0,
        patternPhase: 0,
        attackCooldown: 0,
        // State
        dead: false,
        deadFlg: false,
        theWorld: false,
        visible: true,
        alpha: 1.0,
        toujouFlg: false,
        // Shadow
        shadowReverse: true,
        shadowOffsetY: 0,
        shadowVisible: true,
        // Explosion
        explosionPlaying: false,
        explosionFrame: 0,
        explosionTimer: 0,
        explosionCount: 0,
        // Visual effects
        tintFlash: 0,
        tintTimer: 0,
        // Entry animation
        entryDone: false,
        entryTimer: 0,
        entryStartY: -64,
        entryEndY: 60,
        // Projectiles spawned (returned to game scene for hit testing)
        pendingProjectiles: [],
        // Movement pattern
        moveTimer: 0,
        moveTargetX: 0,
        movePhase: 0,
        // Goki special
        gokiFlg: data.gokiFlg || false,
        akebonoFlg: false,
    };

    // Set dimensions from first frame
    if (b.frames.length > 0) {
        var size = getFrameSize("game_asset", resolveFrameName("game_asset", b.frames[0]));
        if (size.w > 0) {
            b.width = size.w;
            b.height = size.h;
            b.hitW = size.w;
            b.hitH = size.h;
        }
    }

    return b;
}

function bossEntry(b) {
    b.entryDone = false;
    b.entryTimer = 0;
    b.y = b.entryStartY;
    playSfx("boss_" + b.name + "_voice_add");
}

function bossLoop(b) {
    if (b.dead || b.theWorld) return;

    // Entry animation
    if (!b.entryDone) {
        b.entryTimer++;
        var t = Math.min(b.entryTimer / 60, 1.0);
        var eased = 1 - Math.pow(1 - t, 5); // quint ease out
        b.y = b.entryStartY + (b.entryEndY - b.entryStartY) * eased;
        if (t >= 1.0) {
            b.entryDone = true;
            b.shootFlg = true;
        }
        return;
    }

    // Animate
    if (b.frames.length > 1) {
        b.animCounter += b.animSpeed;
        if (b.animCounter >= b.frames.length) b.animCounter -= b.frames.length;
        b.animFrame = Math.floor(b.animCounter) % b.frames.length;
    }

    // Movement pattern — side-to-side
    b.moveTimer++;
    if (b.moveTimer % 120 === 0) {
        b.movePhase = (b.movePhase + 1) % 3;
        switch (b.movePhase) {
        case 0: b.moveTargetX = GCX - b.width / 2; break;
        case 1: b.moveTargetX = GW * 0.2; break;
        case 2: b.moveTargetX = GW * 0.6; break;
        }
    }
    b.x += 0.03 * (b.moveTargetX - b.x);

    // Attack pattern
    if (b.shootFlg) {
        b.patternTimer++;
        b.attackCooldown--;

        if (b.attackCooldown <= 0) {
            bossAttack(b);
        }
    }

    // Tint flash decay
    if (b.tintFlash > 0) {
        b.tintTimer++;
        if (b.tintTimer > 6) {
            b.tintFlash = 0;
            b.tintTimer = 0;
        }
    }
}

function bossAttack(b) {
    var projData = b.projectileData;
    if (!projData) {
        b.attackCooldown = 60;
        return;
    }

    switch (b.stageId) {
    case 0: // Bison — straight shots + psycho field
        if (b.patternPhase % 3 < 2) {
            // Straight shots
            bossShootStraight(b, projData);
            b.attackCooldown = 30;
        } else {
            // Radial burst
            bossShootRadial(b, projData, 12);
            b.attackCooldown = 90;
        }
        b.patternPhase++;
        break;

    case 1: // Barlog — fast dashes + projectiles
        bossShootStraight(b, projData);
        if (b.patternPhase % 4 === 0 && b.projectileDataA) {
            bossShootSpread(b, b.projectileDataA, 3);
        }
        b.attackCooldown = 25;
        b.patternPhase++;
        break;

    case 2: // Sagat — tiger shots + upper
        if (b.patternPhase % 2 === 0) {
            bossShootStraight(b, projData);
        } else {
            bossShootSpread(b, projData, 2);
        }
        b.attackCooldown = 35;
        b.patternPhase++;
        break;

    case 3: // Vega — teleport + claw swipes
        bossShootStraight(b, projData);
        if (b.patternPhase % 5 === 0) {
            bossShootRadial(b, projData, 8);
        }
        b.attackCooldown = 28;
        b.patternPhase++;
        break;

    case 4: // Fang — poison beams + spread
        if (b.patternPhase % 3 === 0) {
            bossShootRadial(b, projData, 16);
            b.attackCooldown = 60;
        } else {
            bossShootSpread(b, projData, 3);
            b.attackCooldown = 25;
        }
        b.patternPhase++;
        break;

    default:
        bossShootStraight(b, projData);
        b.attackCooldown = 40;
        break;
    }

    playSfx("se_shoot");
}

function bossShootStraight(b, data) {
    b.pendingProjectiles.push({
        x: b.x + b.hitW / 2,
        y: b.y + b.hitH,
        rotX: 0,
        rotY: 1,
        speed: data.speed || 2,
        damage: data.damage || 1,
        hp: data.hp || 1,
        name: data.name || "bullet",
        frames: data.texture || [],
        width: 8,
        height: 8,
    });
}

function bossShootSpread(b, data, count) {
    var baseAngle = 80;
    var spread = 20;
    var step = count > 1 ? spread / (count - 1) : 0;
    var startAngle = baseAngle - spread / 2;

    for (var i = 0; i < count; i++) {
        var deg = startAngle + step * i;
        var rad = deg * Math.PI / 180;
        b.pendingProjectiles.push({
            x: b.x + b.hitW / 2,
            y: b.y + b.hitH,
            rotX: Math.cos(rad),
            rotY: Math.sin(rad),
            speed: data.speed || 2,
            damage: data.damage || 1,
            hp: data.hp || 1,
            name: data.name || "bullet",
            frames: data.texture || [],
            width: 8,
            height: 8,
        });
    }
}

function bossShootRadial(b, data, count) {
    for (var i = 0; i < count; i++) {
        var deg = (i / count) * 360;
        var rad = deg * Math.PI / 180;
        b.pendingProjectiles.push({
            x: b.x + b.hitW / 2,
            y: b.y + b.hitH / 2,
            rotX: Math.cos(rad),
            rotY: Math.sin(rad),
            speed: data.speed || 1.5,
            damage: data.damage || 1,
            hp: data.hp || 1,
            name: data.name || "bullet",
            frames: data.texture || [],
            width: 8,
            height: 8,
        });
    }
}

function bossOnDamage(b, damage) {
    if (b.deadFlg || b.dead) return;

    b.hp -= damage;
    b.tintFlash = 1;
    b.tintTimer = 0;

    if (b.hp <= 0) {
        b.hp = 0;
        bossDead(b);
    }
}

function bossDead(b) {
    b.deadFlg = true;
    b.shootFlg = false;
    b.explosionPlaying = true;
    b.explosionFrame = 0;
    b.explosionTimer = 0;
    b.explosionCount = 0;
    playSfx("se_explosion");
    playSfx("boss_" + b.name + "_voice_ko");
}

function bossExplosionUpdate(b) {
    if (!b.explosionPlaying) return false;

    b.explosionTimer++;
    if (b.explosionTimer % 8 === 0) {
        b.explosionCount++;
        if (b.explosionCount > 5) {
            b.explosionPlaying = false;
            b.dead = true;
            return true; // dead complete
        }
        playSfx("se_explosion");
    }
    return false;
}

function bossDraw(b) {
    if (!b.visible || b.alpha <= 0) return;

    if (b.explosionPlaying) {
        // Multiple staggered explosions
        for (var i = 0; i <= b.explosionCount; i++) {
            var ox = Math.sin(i * 2.5) * 20;
            var oy = Math.cos(i * 3.1) * 15;
            var ef = Math.min((b.explosionTimer + i * 3) % 21 / 3, 6);
            var expFrame = "explosion0" + String(Math.floor(ef)) + ".gif";
            drawFrame("game_asset", resolveFrameName("game_asset", expFrame),
                toScreenX(b.x + b.width / 2 + ox), toScreenY(b.y + b.height / 2 + oy),
                SCALE, SCALE, 1.0, null);
        }
        return;
    }

    if (b.deadFlg) return;

    // Draw shadow
    if (b.shadowVisible && b.frames.length > 0) {
        var frame = resolveFrameName("game_asset", b.frames[b.animFrame]);
        var shadowColor = Color.new(30, 30, 30, 60);
        drawFrame("game_asset", frame,
            toScreenX(b.x + b.width / 2), toScreenY(b.y + b.height / 2 + 5),
            SCALE, -SCALE, 0.3, shadowColor);
    }

    // Draw boss
    if (b.frames.length > 0) {
        var frame = resolveFrameName("game_asset", b.frames[b.animFrame]);
        var tint = null;
        if (b.tintFlash) {
            tint = Color.new(128, 40, 40, 128);
        }
        drawFrame("game_asset", frame,
            toScreenX(b.x + b.width / 2), toScreenY(b.y + b.height / 2),
            SCALE, SCALE, b.alpha, tint);
    }
}
