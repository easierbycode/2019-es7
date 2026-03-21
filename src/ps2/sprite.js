// src/ps2/sprite.js — Sprite system for PS2 AthenaEnv
// Lightweight sprite objects with atlas frame animation, position, scale, alpha

var spriteIdCounter = 0;

function createSprite(atlasName, frameName) {
    return {
        id: spriteIdCounter++,
        atlas: atlasName,
        frame: frameName,
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        rotation: 0,
        visible: 1,
        tint: null,
        // Animation
        frames: null,
        animFrame: 0,
        animSpeed: 0.15,
        animCounter: 0,
        animLoop: 1,
        animPlaying: 0,
        // Hit area (relative to sprite position)
        hitX: 0,
        hitY: 0,
        hitW: 0,
        hitH: 0,
    };
}

function createAnimSprite(atlasName, frameNames) {
    var spr = createSprite(atlasName, frameNames[0]);
    spr.frames = frameNames;
    spr.animPlaying = 1;
    // Set default hit area from first frame
    var size = getFrameSize(atlasName, frameNames[0]);
    spr.hitW = size.w;
    spr.hitH = size.h;
    return spr;
}

function updateSpriteAnim(spr) {
    if (!spr.animPlaying || !spr.frames || spr.frames.length <= 1) return;
    spr.animCounter += spr.animSpeed;
    if (spr.animCounter >= 1.0) {
        spr.animCounter -= 1.0;
        spr.animFrame++;
        if (spr.animFrame >= spr.frames.length) {
            if (spr.animLoop) {
                spr.animFrame = 0;
            } else {
                spr.animFrame = spr.frames.length - 1;
                spr.animPlaying = 0;
            }
        }
        spr.frame = spr.frames[spr.animFrame];
    }
}

function drawSprite(spr) {
    if (!spr.visible || spr.alpha <= 0) return;

    var tintColor = null;
    if (spr.tint) {
        tintColor = spr.tint;
    } else if (spr.alpha < 1.0) {
        var a = Math.floor(spr.alpha * 128);
        tintColor = Color.new(128, 128, 128, a);
    }

    // Convert game coords to screen coords
    var sx = toScreenX(spr.x);
    var sy = toScreenY(spr.y);
    var scX = spr.scaleX * SCALE;
    var scY = spr.scaleY * SCALE;

    drawFrame(spr.atlas, spr.frame, sx, sy, scX, scY, spr.alpha, tintColor);
}

// Draw sprite at game coordinates (no screen transform — for use within game-coord rendering)
function drawSpriteGame(spr) {
    if (!spr.visible || spr.alpha <= 0) return;

    var tintColor = null;
    if (spr.tint) {
        tintColor = spr.tint;
    } else if (spr.alpha < 1.0) {
        var a = Math.floor(spr.alpha * 128);
        tintColor = Color.new(128, 128, 128, a);
    }

    drawFrame(spr.atlas, spr.frame, spr.x, spr.y, spr.scaleX, spr.scaleY, spr.alpha, tintColor);
}

// AABB hit test between two sprites (using hitArea or frame size)
function hitTestSprites(a, b) {
    var aSize = getFrameSize(a.atlas, a.frame);
    var aw = a.hitW || aSize.w;
    var ah = a.hitH || aSize.h;
    var ax = a.x + a.hitX - aw * a.anchorX;
    var ay = a.y + a.hitY - ah * a.anchorY;

    var bSize = getFrameSize(b.atlas, b.frame);
    var bw = b.hitW || bSize.w;
    var bh = b.hitH || bSize.h;
    var bx = b.x + b.hitX - bw * b.anchorX;
    var by = b.y + b.hitY - bh * b.anchorY;

    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Hit test sprite vs rectangle {x, y, w, h}
function hitTestSpriteRect(spr, rect) {
    var sSize = getFrameSize(spr.atlas, spr.frame);
    var sw = spr.hitW || sSize.w;
    var sh = spr.hitH || sSize.h;
    var sx = spr.x + spr.hitX - sw * spr.anchorX;
    var sy = spr.y + spr.hitY - sh * spr.anchorY;

    return sx < rect.x + rect.w && sx + sw > rect.x && sy < rect.y + rect.h && sy + sh > rect.y;
}
