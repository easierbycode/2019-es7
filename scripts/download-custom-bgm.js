#!/usr/bin/env node
/**
 * download-custom-bgm.js
 *
 * Fetches the default Firebase level ("foo") and downloads any custom BGM MP3s
 * so offline builds (GitHub Pages, Cordova, Electron) can use local files
 * instead of relying on external URLs at runtime.
 *
 * Files are named by the SHA-1 hash of their source URL, so multiple keys
 * pointing at the same URL share a single file on disk. The manifest maps
 * each audio key to its (possibly shared) filename.
 *
 * Usage:  node scripts/download-custom-bgm.js [levelName]
 * Output: assets/custom-bgm/<sha1>.mp3  +  assets/custom-bgm/manifest.json
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FIREBASE_DB_URL = "https://evil-invaders-default-rtdb.firebaseio.com";
const LEVELS_PATH = "levels";
const OUTPUT_DIR = path.resolve(__dirname, "..", "assets", "custom-bgm");

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
                    var err = new Error("HTTP " + res.statusCode + " downloading " + url);
                    err.statusCode = res.statusCode;
                    reject(err);
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

function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// Retry downloads on transient failures (5xx responses and network errors).
// Uses exponential backoff: 1s, 2s, 4s between attempts.
async function downloadFileWithRetry(url, dest, maxAttempts) {
    maxAttempts = maxAttempts || 4;
    var lastErr;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await downloadFile(url, dest);
            return;
        } catch (err) {
            lastErr = err;
            var transient = !err.statusCode || err.statusCode >= 500;
            if (!transient || attempt === maxAttempts) throw err;
            var delay = 1000 * Math.pow(2, attempt - 1);
            console.warn("  -> attempt " + attempt + " failed (" + err.message +
                "), retrying in " + (delay / 1000) + "s ...");
            await sleep(delay);
        }
    }
    throw lastErr;
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
    // Map each unique URL to its on-disk filename so duplicate URLs are
    // downloaded once and shared by every key that references them.
    var urlToFilename = {};
    var downloadedCount = 0;
    var sharedCount = 0;

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var url = audioURLs[key];
        var filename = urlToFilename[url];

        if (filename) {
            // Same URL already mapped — reuse the shared file, no copy needed
            console.log("Sharing " + key + " -> " + filename + " (same URL as previous key)");
            manifest[key] = filename;
            sharedCount++;
            continue;
        }

        // Derive filename from URL hash so identical URLs collapse to one file
        filename = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16) + ".mp3";
        var dest = path.join(OUTPUT_DIR, filename);

        if (fs.existsSync(dest)) {
            // Already on disk from an earlier run with the same URL
            console.log("Reusing existing " + filename + " for " + key);
            manifest[key] = filename;
            urlToFilename[url] = filename;
            continue;
        }

        console.log("Downloading " + key + " from " + url + " -> " + filename + " ...");
        try {
            await downloadFileWithRetry(url, dest);
            var stat = fs.statSync(dest);
            console.log("  -> saved " + filename + " (" + (stat.size / 1024).toFixed(1) + " KB)");
            manifest[key] = filename;
            urlToFilename[url] = filename;
            downloadedCount++;
        } catch (err) {
            console.error("  -> FAILED: " + err.message);
            failed.push(key);
        }
    }

    // Write manifest
    var manifestPath = path.join(OUTPUT_DIR, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("\nManifest written to " + manifestPath);
    var uniqueFiles = Object.keys(urlToFilename).length;
    console.log("Mapped " + Object.keys(manifest).length + "/" + keys.length + " keys to " +
        uniqueFiles + " unique file(s) (" + downloadedCount + " downloaded, " +
        sharedCount + " shared duplicates).");

    if (failed.length > 0) {
        console.warn("Failed: " + failed.join(", "));
        process.exit(1);
    }
}

main().catch(function (err) {
    console.error("Fatal error:", err);
    process.exit(1);
});
