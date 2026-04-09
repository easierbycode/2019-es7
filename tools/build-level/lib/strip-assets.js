"use strict";

// Copies only the files a single Firebase level needs into build/<slug>/www/.
// Aggressive strip: no PIXI legacy, no level-editor, no viewers, no index.html.
// Keeps all 5 stage backgrounds (BootScene preloads them unconditionally) and
// game_ui/title_ui atlases (UI assets unchanged by level data).

const fs = require("fs");
const path = require("path");

function copyFile(src, dst) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else if (entry.isFile()) fs.copyFileSync(s, d);
    }
}

// `wwwRoot` is the destination folder that will become cordova/www or
// electron/www. This stages all assets EXCEPT the merged game_asset (that
// comes from merge-atlas.js) and custom-bgm (that comes from download-bgm.js).
function stageWww(opts) {
    const sourceRoot = opts.sourceRoot;       // repo root
    const wwwRoot = opts.wwwRoot;             // build/<slug>/www
    const levelName = opts.levelName;

    fs.mkdirSync(wwwRoot, { recursive: true });

    // ----- lib/ (phaser + firebase compat libs -- firebase not actually used
    // at runtime in offline mode, but phaser.min.js is required)
    copyFile(path.join(sourceRoot, "lib/phaser.min.js"), path.join(wwwRoot, "lib/phaser.min.js"));

    // ----- assets/
    // UI atlases unchanged
    for (const base of ["game_ui", "title_ui"]) {
        const pngCandidates = [path.join("assets/img", "_" + base + ".png"), path.join("assets/img", base + ".png")];
        const jsonCandidates = [path.join("assets", "_" + base + ".json"), path.join("assets", base + ".json")];
        for (const c of pngCandidates) {
            const sp = path.join(sourceRoot, c);
            if (fs.existsSync(sp)) { copyFile(sp, path.join(wwwRoot, "assets/img", base + ".png")); break; }
        }
        for (const c of jsonCandidates) {
            const sp = path.join(sourceRoot, c);
            if (fs.existsSync(sp)) { copyFile(sp, path.join(wwwRoot, "assets", base + ".json")); break; }
        }
    }

    // title_bg.jpg (kept unless a custom titleBgDataURL is baked in level-data)
    const titleBg = path.join(sourceRoot, "assets/img/title_bg.jpg");
    if (fs.existsSync(titleBg)) copyFile(titleBg, path.join(wwwRoot, "assets/img/title_bg.jpg"));

    // stage backgrounds (all 5: BootScene unconditionally preloads them)
    copyDir(path.join(sourceRoot, "assets/img/stage"), path.join(wwwRoot, "assets/img/stage"));
    // loading images
    copyDir(path.join(sourceRoot, "assets/img/loading"), path.join(wwwRoot, "assets/img/loading"));
    // fonts + sounds
    copyDir(path.join(sourceRoot, "assets/fonts"), path.join(wwwRoot, "assets/fonts"));
    copyDir(path.join(sourceRoot, "assets/sounds"), path.join(wwwRoot, "assets/sounds"));
    // recipe (base game.json -- needed for bossData/storyData fallbacks)
    const gameJson = path.join(sourceRoot, "assets/game.json");
    if (fs.existsSync(gameJson)) copyFile(gameJson, path.join(wwwRoot, "assets/game.json"));
}

// Build the offline level record that the boot scene will consume. Strips the
// heavy atlasImageDataURL / atlasFrames fields (baked into the merged atlas).
function buildOfflineLevelRecord(levelData) {
    const rec = Object.assign({}, levelData);
    delete rec.atlasImageDataURL;
    delete rec.atlasFrames;
    delete rec.frameThumbnails;
    return rec;
}

module.exports = { stageWww, buildOfflineLevelRecord };
