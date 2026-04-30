// Merges a Firebase level's atlasImageDataURL + atlasFrames with the bundled
// game_asset atlas. Mirrors tools/build-level/lib/merge-atlas.js but uses the
// browser canvas API instead of pngjs so it can run inside the webview.

function fbKeyDecode(name) { return String(name).replace(/․/g, "."); }

function loadImage(src) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("Failed to load image: " + src.slice(0, 80))); };
        img.src = src;
    });
}

function canvasToBlob(canvas, type) {
    return new Promise(function (resolve, reject) {
        canvas.toBlob(function (b) {
            if (b) resolve(b);
            else reject(new Error("toBlob returned null"));
        }, type || "image/png");
    });
}

async function loadJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Failed to load " + url + ": " + r.status);
    return r.json();
}

async function loadLocalAtlas(baseUrl) {
    const candidates = [
        { img: "assets/img/_game_asset.png", json: "assets/_game_asset.json" },
        { img: "assets/img/game_asset.png",  json: "assets/game_asset.json"  }
    ];
    for (const c of candidates) {
        try {
            const head = await fetch(baseUrl + c.json, { method: "HEAD" });
            if (!head.ok) continue;
            const json = await loadJson(baseUrl + c.json);
            const img = await loadImage(baseUrl + c.img);
            return { json, img, imgUrl: baseUrl + c.img };
        } catch (e) {
            // try next
        }
    }
    throw new Error("Could not load any local game_asset atlas");
}

function buildMergedFrameMap(localJson, levelData, localH, mergedW, mergedH) {
    const frames = Object.assign({}, localJson.frames || {});
    const fbFrames = levelData.atlasFrames || {};
    for (const rawName of Object.keys(fbFrames)) {
        const fd = fbFrames[rawName];
        if (!fd || !fd.frame) continue;
        const name = fbKeyDecode(rawName);
        const fw = fd.frame.w;
        const fh = fd.frame.h;
        const entry = {
            frame: { x: fd.frame.x, y: fd.frame.y + localH, w: fw, h: fh },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: fw, h: fh },
            sourceSize: { w: fw, h: fh }
        };
        frames[name] = entry;
        let alt = null;
        if (name.endsWith(".png")) alt = name.slice(0, -4) + ".gif";
        else if (name.endsWith(".gif")) alt = name.slice(0, -4) + ".png";
        if (alt && frames[alt]) frames[alt] = entry;
    }
    return {
        frames: frames,
        meta: Object.assign({}, localJson.meta || {}, {
            app: "forge/merge-atlas.js",
            size: { w: mergedW, h: mergedH },
            scale: "1"
        })
    };
}

// Returns { pngBlob, json, merged: bool }
export async function bakeMergedAtlas(opts) {
    const baseUrl = opts.baseUrl || "./";
    const levelData = opts.levelData;

    const local = await loadLocalAtlas(baseUrl);

    if (!levelData.atlasImageDataURL || !levelData.atlasFrames) {
        const fetched = await fetch(local.imgUrl);
        const blob = await fetched.blob();
        return { pngBlob: blob, json: local.json, merged: false };
    }

    const fbImg = await loadImage(levelData.atlasImageDataURL);
    const localH = local.img.naturalHeight;
    const fbH = fbImg.naturalHeight;
    const width = Math.max(local.img.naturalWidth, fbImg.naturalWidth);
    const height = localH + fbH;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(local.img, 0, 0);
    ctx.drawImage(fbImg, 0, localH);

    const pngBlob = await canvasToBlob(canvas, "image/png");
    const mergedJson = buildMergedFrameMap(local.json, levelData, localH, width, height);
    return { pngBlob, json: mergedJson, merged: true, localH, fbH };
}
