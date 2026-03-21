// src/ps2/enemy.js — Enemy entity for PS2 AthenaEnv port
// Ported from src/game-objects/Enemy.js

function createEnemy(data) {
    var e = {
        name: data.name || "",
        atlas: "game_asset",
        frames: data.texture || [],
        animFrame: 0,
        animSpeed: 0.15,
        animCounter: 0,
        x: 0,
        y: -32,
        width: 32,
        height: 32,
        hitX: 0,
        hitY: 0,
        hitW: 32,
        hitH: 32,
        hp: data.hp || 1,
        speed: data.speed || 1,
        score: data.score || 0,
        spgage: data.spgage || 0,
        interval: data.interval || 0,
        projectileData: data.projectileData || null,
        itemName: data.itemName || null,
        itemTexture: data.itemTexture || null,
        dead: false,
        deadFlg: false,
        shootFlg: true,
        hardleFlg: false,
        bulletFrameCnt: 0,
        posName: "",
        // Shadow
        shadowReverse: data.shadowReverse !== undefined ? data.shadowReverse : true,
        shadowOffsetY: data.shadowOffsetY || 0,
        shadowVisible: true,
        // Explosion
        explosionPlaying: false,
        explosionFrame: 0,
        explosionTimer: 0,
        // Visual
        visible: true,
        alpha: 1.0,
        tintFlash: 0,
        tintTimer: 0,
        // Big bullet tracking per enemy
        bulletTracking: {},
    };

    if (e.interval <= -1) e.hardleFlg = true;

    // Adjust hit area per enemy type
    switch (data.name) {
    case "baraA":
    case "baraB":
        e.shadowVisible = false;
        break;
    case "drum":
        e.hitX = 7;
        e.hitY = 2;
        e.hitW = e.width - 14;
        e.hitH = e.height - 2;
        break;
    case "launchpad":
        e.hitX = 8;
        e.hitY = 0;
        e.hitW = e.width - 16;
        e.hitH = e.height;
        break;
    }

    // Set dimensions from first frame if possible
    if (e.frames.length > 0) {
        var size = getFrameSize("game_asset", resolveFrameName("game_asset", e.frames[0]));
        if (size.w > 0) {
            e.width = size.w;
            e.height = size.h;
            if (e.hitW === 32) {
                e.hitW = size.w;
                e.hitH = size.h;
            }
        }
    }

    return e;
}

function enemyLoop(e, playerRef) {
    if (e.dead) return false; // signal to remove

    e.bulletFrameCnt++;

    // Animate
    if (e.frames.length > 1) {
        e.animCounter += e.animSpeed;
        if (e.animCounter >= e.frames.length) e.animCounter -= e.frames.length;
        e.animFrame = Math.floor(e.animCounter) % e.frames.length;
    }

    // Movement
    e.y += e.speed;

    switch (e.name) {
    case "soliderA":
        if (e.y >= GH / 1.5 && playerRef) {
            e.x += 0.005 * (playerRef.x - e.x);
        }
        break;
    case "soliderB":
        if (e.y <= 10) {
            if (e.x >= GW / 2) {
                e.x = GW;
                e.posName = "right";
            } else {
                e.x = -e.width;
                e.posName = "left";
            }
        }
        if (e.y >= GH / 3) {
            if (e.posName === "right") e.x -= 1;
            else if (e.posName === "left") e.x += 1;
        }
        break;
    }

    // Tint flash decay
    if (e.tintFlash > 0) {
        e.tintTimer++;
        if (e.tintTimer > 6) {
            e.tintFlash = 0;
            e.tintTimer = 0;
        }
    }

    // Shooting
    var shouldShoot = false;
    if (e.shootFlg && !e.hardleFlg && e.interval > 0 && e.bulletFrameCnt % e.interval === 0) {
        shouldShoot = true;
    }

    // Off-screen check
    if (e.x <= -50 || e.x >= GW + 33 || e.y <= -33 || e.y >= GH) {
        return false; // remove
    }

    return shouldShoot ? "shoot" : true;
}

function enemyOnDamage(e, damage) {
    if (e.hp === "infinity") {
        e.tintFlash = 1;
        e.tintTimer = 0;
        return;
    }
    if (e.deadFlg) return;

    e.hp -= damage;
    if (e.hp <= 0) {
        enemyDead(e);
    } else {
        e.tintFlash = 1;
        e.tintTimer = 0;
    }
}

function enemyDead(e) {
    if (e.hp === "infinity") return;
    e.deadFlg = true;
    e.shootFlg = false;
    e.explosionPlaying = true;
    e.explosionFrame = 0;
    e.explosionTimer = 0;
    playSfx("se_explosion");
}

function enemyDraw(e) {
    if (!e.visible || e.alpha <= 0) return;

    if (e.explosionPlaying) {
        var expFrame = "explosion0" + String(Math.min(e.explosionFrame, 6)) + ".gif";
        e.explosionTimer++;
        if (e.explosionTimer % 3 === 0) e.explosionFrame++;
        if (e.explosionFrame > 6) {
            e.explosionPlaying = false;
            e.dead = true;
        }
        drawFrame("game_asset", resolveFrameName("game_asset", expFrame),
            toScreenX(e.x + e.width / 2), toScreenY(e.y + e.height / 2),
            SCALE, SCALE, 1.0, null);
        return;
    }

    if (e.deadFlg) return;

    // Draw shadow
    if (e.shadowVisible && e.frames.length > 0) {
        var frame = resolveFrameName("game_asset", e.frames[e.animFrame]);
        var shadowColor = Color.new(30, 30, 30, 60);
        var shadowY = e.shadowReverse ? (e.y + e.height / 2 - e.shadowOffsetY) : (e.y + e.height / 2 + e.shadowOffsetY);
        drawFrame("game_asset", frame,
            toScreenX(e.x + e.width / 2), toScreenY(shadowY),
            SCALE, e.shadowReverse ? -SCALE : SCALE, 0.3, shadowColor);
    }

    // Draw enemy
    if (e.frames.length > 0) {
        var frame = resolveFrameName("game_asset", e.frames[e.animFrame]);
        var tint = null;
        if (e.tintFlash) {
            tint = Color.new(128, 40, 40, 128);
        }
        drawFrame("game_asset", frame,
            toScreenX(e.x + e.width / 2), toScreenY(e.y + e.height / 2),
            SCALE, SCALE, e.alpha, tint);
    }
}
