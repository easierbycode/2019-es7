#!/usr/bin/env node
/**
 * download-custom-bgm.js
 *
 * Fetches the default Firebase level ("foo") and downloads any custom BGM MP3s
 * so offline builds (GitHub Pages, Cordova, Electron) can use local files
 * instead of relying on external URLs at runtime.
 *
 * Usage:  node scripts/download-custom-bgm.js [levelName]
 * Output: assets/custom-bgm/<key>.mp3  +  assets/custom-bgm/manifest.json
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const FIREBASE_DB_URL = "https://evil-invaders-default-rtdb.firebaseio.com";
const LEVELS_PATH = "levels";
const OUTPUT_DIR = path.resolve(__dirname, "..", "assets", "custom-bgm");

// Hardcoded URL overrides: keys listed here are always fetched from these
// URLs instead of the value stored in Firebase (e.g. Notion-hosted files
// that redirect or expire). Keyed by customAudioURLs key.
const URL_OVERRIDES = {
    title_voicecall: "https://easierbycode.com/assets/sounds/title_voicecall.mp3",
};

const levelName = process.argv[2] || "foo";

function fetchJSON(url) {
    return new Promise(function (resolve, reject) {
        var mod = url.startsWith("https") ? https : http;
        mod.get(url, function (res) {
            if (res.statusCode !== 200) {
                reject(new Error("HTTP " + res.statusCode + " for " + url));
                res.resume();
                return;
            }
            var chunks = [];
            res.on("data", function (c) { chunks.push(c); });
            res.on("end", function () {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString()));
                } catch (e) {
                    reject(e);
                }
            });
            res.on("error", reject);
        }).on("error", reject);
    });
}

function downloadFile(url, dest) {
    return new Promise(function (resolve, reject) {
        var mod = url.startsWith("https") ? https : http;
        var request = function (requestUrl, redirectCount) {
            if (redirectCount > 5) {
                reject(new Error("Too many redirects for " + url));
                return;
            }
            mod.get(requestUrl, function (res) {
                // Follow redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    var nextUrl = res.headers.location;
                    var nextMod = nextUrl.startsWith("https") ? https : http;
                    mod = nextMod;
                    res.resume();
                    request(nextUrl, redirectCount + 1);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error("HTTP " + res.statusCode + " downloading " + url));
                    res.resume();
                    return;
                }
                var file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on("finish", function () { file.close(resolve); });
                file.on("error", function (err) {
                    fs.unlink(dest, function () {});
                    reject(err);
                });
            }).on("error", reject);
        };
        request(url, 0);
    });
}

async function main() {
    console.log("Fetching Firebase level '" + levelName + "'...");
    var levelUrl = FIREBASE_DB_URL + "/" + LEVELS_PATH + "/" + levelName + ".json";
    var data;
    try {
        data = await fetchJSON(levelUrl);
    } catch (err) {
        console.log("Could not fetch level: " + err.message);
        console.log("No custom BGM to download.");
        return;
    }

    if (!data || !data.customAudioURLs || typeof data.customAudioURLs !== "object") {
        console.log("Level '" + levelName + "' has no customAudioURLs. Nothing to download.");
        return;
    }

    var audioURLs = data.customAudioURLs;
    var keys = Object.keys(audioURLs).filter(function (k) {
        return audioURLs[k] && typeof audioURLs[k] === "string";
    });

    if (keys.length === 0) {
        console.log("No valid audio URLs found. Nothing to download.");
        return;
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    var manifest = {};
    var failed = [];
    // Track URLs already downloaded to avoid downloading the same MP3 twice
    var urlToFilename = {};

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var url = audioURLs[key];
        if (URL_OVERRIDES[key]) {
            console.log("Overriding " + key + " URL: " + url + " -> " + URL_OVERRIDES[key]);
            url = URL_OVERRIDES[key];
        }
        var filename = key + ".mp3";
        var dest = path.join(OUTPUT_DIR, filename);

        if (urlToFilename[url]) {
            // Same URL already downloaded — copy instead of re-downloading
            var srcFile = path.join(OUTPUT_DIR, urlToFilename[url]);
            console.log("Copying " + key + " (same URL as " + urlToFilename[url].replace(".mp3", "") + ")");
            try {
                fs.copyFileSync(srcFile, dest);
                manifest[key] = filename;
                console.log("  -> copied " + filename);
            } catch (err) {
                console.error("  -> FAILED to copy: " + err.message);
                failed.push(key);
            }
            continue;
        }

        console.log("Downloading " + key + " from " + url + " ...");
        try {
            await downloadFile(url, dest);
            var stat = fs.statSync(dest);
            console.log("  -> saved " + filename + " (" + (stat.size / 1024).toFixed(1) + " KB)");
            manifest[key] = filename;
            urlToFilename[url] = filename;
        } catch (err) {
            console.error("  -> FAILED: " + err.message);
            failed.push(key);
        }
    }

    // Write manifest
    var manifestPath = path.join(OUTPUT_DIR, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("\nManifest written to " + manifestPath);
    console.log("Downloaded " + Object.keys(manifest).length + "/" + keys.length + " files.");

    if (failed.length > 0) {
        console.warn("Failed: " + failed.join(", "));
        process.exit(1);
    }
}

main().catch(function (err) {
    console.error("Fatal error:", err);
    process.exit(1);
});
