// src/ps2/atlas.js — Texture atlas system for PS2 AthenaEnv
// Loads PNG atlas + JSON frame data, draws sub-regions using Image startx/starty/endx/endy

var atlases = {};

function loadAtlas(name, pngPath, jsonPath) {
    var jsonText = std.loadFile(jsonPath);
    if (!jsonText) {
        console.log("[Atlas] Failed to load JSON: " + jsonPath);
        return;
    }
    var data = JSON.parse(jsonText);
    var img = new Image(pngPath);

    // Display scale: if atlas was downscaled for PS2, this restores original sizes
    var ds = (data.meta && data.meta.ps2DisplayScale) ? data.meta.ps2DisplayScale : 1;

    var frames = {};
    if (data.frames) {
        if (Array.isArray(data.frames)) {
            for (var i = 0; i < data.frames.length; i++) {
                var f = data.frames[i];
                frames[f.filename] = {
                    x: f.frame.x,
                    y: f.frame.y,
                    w: f.frame.w,
                    h: f.frame.h,
                    dw: f.frame.w * ds,
                    dh: f.frame.h * ds,
                };
            }
        } else {
            var keys = Object.keys(data.frames);
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                var fr = data.frames[key].frame;
                frames[key] = {
                    x: fr.x,
                    y: fr.y,
                    w: fr.w,
                    h: fr.h,
                    dw: fr.w * ds,
                    dh: fr.h * ds,
                };
            }
        }
    }

    atlases[name] = {
        image: img,
        frames: frames,
        displayScale: ds,
        texWidth: img.texWidth || img.width,
        texHeight: img.texHeight || img.height,
    };
    console.log("[Atlas] Loaded " + name + " with " + Object.keys(frames).length +
        " frames (displayScale=" + ds + ")");
}

function getFrame(atlasName, frameName) {
    var atlas = atlases[atlasName];
    if (!atlas) return null;
    return atlas.frames[frameName] || null;
}

function hasFrame(atlasName, frameName) {
    var atlas = atlases[atlasName];
    if (!atlas) return 0;
    return !!atlas.frames[frameName];
}

// Resolve frame name: try exact, then swap .gif/.png extension
function resolveFrameName(atlasName, frameName) {
    if (hasFrame(atlasName, frameName)) return frameName;
    var alt = null;
    if (frameName.endsWith(".gif")) alt = frameName.replace(/\.gif$/, ".png");
    else if (frameName.endsWith(".png")) alt = frameName.replace(/\.png$/, ".gif");
    if (alt && hasFrame(atlasName, alt)) return alt;
    return frameName;
}

// Draw an atlas frame at screen position (x, y) with center origin
function drawFrame(atlasName, frameName, x, y, scaleX, scaleY, alpha, tintColor) {
    var atlas = atlases[atlasName];
    if (!atlas) return;
    var frame = atlas.frames[frameName];
    if (!frame) return;

    var img = atlas.image;
    var sx = scaleX || 1.0;
    var sy = scaleY || 1.0;

    // Set sub-region (texture coordinates)
    img.startx = frame.x;
    img.starty = frame.y;
    img.endx = frame.x + frame.w;
    img.endy = frame.y + frame.h;

    // Set display size using original dimensions (dw/dh)
    var displayW = frame.dw * sx;
    var displayH = frame.dh * sy;
    img.width = displayW;
    img.height = displayH;

    // Apply tint/alpha via color
    if (tintColor) {
        img.color = tintColor;
    } else if (alpha !== undefined && alpha < 1.0) {
        var a = Math.floor(alpha * 128);
        img.color = Color.new(128, 128, 128, a);
    } else {
        img.color = Color.new(128, 128, 128, 128);
    }

    // Draw centered at (x, y)
    img.draw(x - (displayW / 2), y - (displayH / 2));
}

// Draw atlas frame with top-left origin (no centering)
function drawFrameTL(atlasName, frameName, x, y, scaleX, scaleY, alpha) {
    var atlas = atlases[atlasName];
    if (!atlas) return;
    var frame = atlas.frames[frameName];
    if (!frame) return;

    var img = atlas.image;
    img.startx = frame.x;
    img.starty = frame.y;
    img.endx = frame.x + frame.w;
    img.endy = frame.y + frame.h;
    img.width = frame.dw * (scaleX || 1.0);
    img.height = frame.dh * (scaleY || 1.0);

    if (alpha !== undefined && alpha < 1.0) {
        var a = Math.floor(alpha * 128);
        img.color = Color.new(128, 128, 128, a);
    } else {
        img.color = Color.new(128, 128, 128, 128);
    }

    img.draw(x, y);
}

// Load a grid-based spritesheet (uniform frame size, no JSON metadata)
function loadSpritesheet(name, pngPath, frameWidth, frameHeight) {
    var img = new Image(pngPath);
    var imgW = img.width;
    var imgH = img.height;
    var cols = Math.floor(imgW / frameWidth);
    var rows = Math.floor(imgH / frameHeight);
    var frames = {};

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var idx = r * cols + c;
            frames[String(idx)] = {
                x: c * frameWidth,
                y: r * frameHeight,
                w: frameWidth,
                h: frameHeight,
                dw: frameWidth,
                dh: frameHeight,
            };
        }
    }

    atlases[name] = {
        image: img,
        frames: frames,
        displayScale: 1,
        texWidth: imgW,
        texHeight: imgH,
    };
    console.log("[Atlas] Loaded spritesheet " + name + " (" + cols + "x" + rows +
        " = " + (cols * rows) + " frames, " + frameWidth + "x" + frameHeight + ")");
}

// Get frame dimensions (original display size, not texture size)
function getFrameSize(atlasName, frameName) {
    var frame = getFrame(atlasName, frameName);
    if (!frame) return { w: 0, h: 0 };
    return { w: frame.dw, h: frame.dh };
}
