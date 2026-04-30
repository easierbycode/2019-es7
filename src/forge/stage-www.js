// Builds the in-memory www/ tree (Map<relPath, Blob>) for a forged APK.
// Source files are read from the running APK via fetch("./assets/...") because
// Cordova serves www/ from /android_asset/www/.

const KEEP_DIRS = [
    "assets/img/stage",
    "assets/img/loading",
    "assets/fonts",
    "assets/sounds"
];

const KEEP_FILES = [
    "lib/phaser.min.js",
    "lib/boot.bundle.js",
    "assets/img/title_bg.jpg",
    "assets/game.json",
    "assets/img/game_ui.png",
    "assets/game_ui.json",
    "assets/img/title_ui.png",
    "assets/title_ui.json"
];

const UI_ATLAS_FALLBACKS = [
    { from: "assets/img/_game_ui.png",   to: "assets/img/game_ui.png" },
    { from: "assets/_game_ui.json",      to: "assets/game_ui.json" },
    { from: "assets/img/_title_ui.png",  to: "assets/img/title_ui.png" },
    { from: "assets/_title_ui.json",     to: "assets/title_ui.json" }
];

async function fetchBlobIfPresent(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.blob();
    } catch (e) {
        return null;
    }
}

async function listDirIndex(baseUrl, dirRel) {
    // The running APK doesn't expose a directory listing; the staging routine
    // relies on a manifest file at <dir>/manifest.json. CI generates these
    // index files (see tools/build-shell-apk).
    const idxUrl = baseUrl + dirRel + "/index.json";
    try {
        const r = await fetch(idxUrl);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

export async function stageWww(opts) {
    const baseUrl = opts.baseUrl || "./";
    const map = new Map();

    for (const rel of KEEP_FILES) {
        const blob = await fetchBlobIfPresent(baseUrl + rel);
        if (blob) map.set(rel, blob);
    }

    for (const fb of UI_ATLAS_FALLBACKS) {
        if (map.has(fb.to)) continue;
        const blob = await fetchBlobIfPresent(baseUrl + fb.from);
        if (blob) map.set(fb.to, blob);
    }

    for (const dir of KEEP_DIRS) {
        const idx = await listDirIndex(baseUrl, dir);
        if (!idx || !Array.isArray(idx.files)) continue;
        for (const name of idx.files) {
            const rel = dir + "/" + name;
            const blob = await fetchBlobIfPresent(baseUrl + rel);
            if (blob) map.set(rel, blob);
        }
    }

    return map;
}

export function buildOfflineLevelRecord(levelData) {
    const rec = Object.assign({}, levelData);
    delete rec.atlasImageDataURL;
    delete rec.atlasFrames;
    delete rec.frameThumbnails;
    return rec;
}
