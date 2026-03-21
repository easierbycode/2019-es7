// src/ps2/projectile.js — Enemy/boss projectile entity
// Simplified Bullet equivalent for enemy fire

function createProjectile(data) {
    return {
        x: data.x || 0,
        y: data.y || 0,
        rotX: data.rotX || 0,
        rotY: data.rotY || 1,
        speed: data.speed || 2,
        damage: data.damage || 1,
        hp: data.hp || 1,
        name: data.name || "bullet",
        atlas: "game_asset",
        frames: data.frames || [],
        animFrame: 0,
        animCounter: 0,
        width: data.width || 8,
        height: data.height || 8,
        dead: 0,
        deadFlg: 0,
        // For meka-type homing
        cont: 0,
        start: data.start || 0,
        targetX: null,
    };
}

function projectileLoop(proj, playerRef) {
    if (proj.deadFlg) return 0;

    if (proj.rotX !== 0 || proj.name !== "meka") {
        proj.x += proj.rotX * proj.speed;
        proj.y += proj.rotY * proj.speed;
    } else if (proj.name === "meka") {
        proj.cont++;
        if (proj.cont >= proj.start) {
            if (!proj.targetX && playerRef) {
                proj.targetX = playerRef.x;
            }
            if (proj.targetX) {
                proj.x += 0.009 * (proj.targetX - proj.x);
            }
            proj.y += Math.cos(proj.cont / 5) + 2.5 * proj.speed;
        }
    }

    // Animate
    if (proj.frames && proj.frames.length > 1) {
        proj.animCounter += 0.15;
        if (proj.animCounter >= proj.frames.length) proj.animCounter -= proj.frames.length;
        proj.animFrame = Math.floor(proj.animCounter) % proj.frames.length;
    }

    // Off-screen removal
    if (proj.x < -30 || proj.x > GW + 30 || proj.y < -30 || proj.y > GH + 30) {
        return 0;
    }

    return 1;
}

function projectileOnDamage(proj, damage) {
    if (proj.deadFlg) return;
    proj.hp -= damage;
    if (proj.hp <= 0) {
        proj.deadFlg = 1;
        proj.dead = 1;
    }
}

function projectileDraw(proj) {
    if (proj.deadFlg || proj.dead) return;

    var frame = null;
    if (proj.frames && proj.frames.length > 0) {
        frame = resolveFrameName("game_asset", proj.frames[proj.animFrame]);
    }

    if (frame) {
        drawFrame("game_asset", frame,
            toScreenX(proj.x), toScreenY(proj.y),
            SCALE, SCALE, 1.0, null);
    } else {
        // Fallback: draw a small colored rectangle
        var color = Color.new(255, 100, 100);
        Draw.rect(toScreenX(proj.x - 3), toScreenY(proj.y - 3),
            toScreenW(6), toScreenH(6), color);
    }
}
