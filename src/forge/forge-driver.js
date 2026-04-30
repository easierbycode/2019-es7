// Top-level orchestrator that turns a level name into an installable APK by
// running the JS pipeline (fetch / merge / download / stage / rebrand) and
// then handing the staged blobs to the native ApkForge plugin for zip + sign.

import { slugify, packageIdFor } from "./slug.js";
import { fetchLevel } from "./fetch-level.js";
import { bakeMergedAtlas } from "./merge-atlas.js";
import { downloadBgmForLevel } from "./download-bgm.js";
import { stageWww, buildOfflineLevelRecord } from "./stage-www.js";
import { loadSourceHtml, rebrandPhaserGameHtml } from "./rebrand-html.js";

function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
        const r = new FileReader();
        r.onloadend = function () {
            const s = String(r.result || "");
            const i = s.indexOf(",");
            resolve(i >= 0 ? s.slice(i + 1) : "");
        };
        r.onerror = function () { reject(r.error); };
        r.readAsDataURL(blob);
    });
}

function strToBlob(s, type) {
    return new Blob([s], { type: type || "text/plain" });
}

function jsonToBlob(obj) {
    return new Blob([JSON.stringify(obj)], { type: "application/json" });
}

function callPlugin(method, opts) {
    return new Promise(function (resolve, reject) {
        if (!window.ApkForge) return reject(new Error("ApkForge plugin not loaded"));
        window.ApkForge[method](opts,
            function (res) { resolve(res); },
            function (err) { reject(new Error(String(err && err.message || err))); });
    });
}

async function writeStaged(workDir, relPath, blob, onProgress, idx, total) {
    const b64 = await blobToBase64(blob);
    if (onProgress) onProgress({ phase: "upload", percent: Math.round(40 + 30 * idx / total),
        message: "Uploading " + relPath + " (" + (idx + 1) + "/" + total + ")" });
    await callPlugin("writeStagedFile", { workDir, relPath, base64: b64 });
}

export async function forgeLevel(opts) {
    const onProgress = opts.onProgress || function () {};
    const levelName = String(opts.levelName || "").trim();
    if (!levelName) throw new Error("levelName is required");

    const slug = slugify(levelName);
    const packageId = opts.packageId || packageIdFor(levelName);

    onProgress({ phase: "fetch", percent: 5, message: "Fetching level from Firebase" });
    const levelData = await fetchLevel(levelName);

    onProgress({ phase: "stage", percent: 12, message: "Staging www tree" });
    const wwwBlobs = await stageWww({ baseUrl: "./" });

    onProgress({ phase: "atlas", percent: 18, message: "Merging atlas" });
    const merged = await bakeMergedAtlas({ baseUrl: "./", levelData });
    wwwBlobs.set("assets/img/game_asset.png", merged.pngBlob);
    wwwBlobs.set("assets/game_asset.json", jsonToBlob(merged.json));

    if (!opts.skipBgm) {
        onProgress({ phase: "bgm", percent: 24, message: "Downloading custom BGM" });
        const bgm = await downloadBgmForLevel(levelData, function (i, n, key) {
            onProgress({ phase: "bgm", percent: 24 + Math.round(8 * i / Math.max(1, n)),
                message: "BGM: " + key + " (" + (i + 1) + "/" + n + ")" });
        });
        for (const [name, blob] of bgm.blobs) {
            wwwBlobs.set("assets/custom-bgm/" + name, blob);
        }
        wwwBlobs.set("assets/custom-bgm/manifest.json", jsonToBlob(bgm.manifest));
    }

    onProgress({ phase: "rebrand", percent: 33, message: "Rebranding HTML" });
    const offlineLevel = buildOfflineLevelRecord(levelData);
    wwwBlobs.set("assets/level-data.json", jsonToBlob(offlineLevel));

    const srcHtml = await loadSourceHtml("./");
    const rebranded = rebrandPhaserGameHtml(srcHtml, levelName, offlineLevel);
    wwwBlobs.set("phaser-game.html", strToBlob(rebranded, "text/html"));

    onProgress({ phase: "workdir", percent: 38, message: "Preparing native workdir" });
    const workDir = await callPlugin("prepareWorkdir", { workDir: slug });

    const relPaths = Array.from(wwwBlobs.keys());
    for (let i = 0; i < relPaths.length; i++) {
        const rel = relPaths[i];
        await writeStaged(workDir, rel, wwwBlobs.get(rel), onProgress, i, relPaths.length);
    }

    onProgress({ phase: "build", percent: 75, message: "Patching shell APK" });

    return await new Promise(function (resolve, reject) {
        window.ApkForge.build({
            workDir: workDir,
            packageId: packageId,
            displayName: levelName,
            slug: slug,
            outFilename: slug + ".apk"
        }, function (ev) {
            onProgress(ev);
            if (ev && ev.phase === "done") resolve(ev);
        }, function (err) {
            reject(new Error(String(err && err.message || err)));
        });
    });
}

export function isAvailable() {
    return !!(typeof window !== "undefined" && window.ApkForge && window.ApkForge.isAvailable && window.ApkForge.isAvailable());
}
