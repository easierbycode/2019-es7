#!/usr/bin/env node
"use strict";

// Build a standalone Cordova (ios/android) or Electron (linux) app from a
// single Firebase level by name.
//
// Usage:
//   node tools/build-level <levelName> <platform>
//   platform ∈ { ios | android | linux | all }
//
// Flags:
//   --out <dir>          Override build root (default: build/<slug>)
//   --package-id <id>    Override package id (default: com.easierbycode.<slug>)
//   --skip-bgm           Skip custom BGM downloads
//
// The tool:
//   1. Fetches the level record from Firebase REST.
//   2. Bakes atlasImageDataURL + atlasFrames into a merged game_asset.png/.json.
//   3. Downloads customAudioURLs into assets/custom-bgm/ with manifest.
//   4. Stages a minimal www/ tree (no PIXI, no level-editor, no viewers).
//   5. Bundles src/phaser/boot-entry.js via esbuild → lib/boot.bundle.js.
//   6. Rebrands: app name = levelName, package id = com.easierbycode.<slug>.
//   7. Invokes cordova compile / electron-builder to produce artifacts in
//      build/<slug>/dist/.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { slugify, packageIdFor } = require("./lib/slug");
const { fetchLevel } = require("./lib/fetch-level");
const { bakeMergedAtlas } = require("./lib/merge-atlas");
const { downloadBgmForLevel } = require("./lib/download-bgm");
const { stageWww, buildOfflineLevelRecord } = require("./lib/strip-assets");
const {
    rebrandConfigXml,
    rebrandElectronPackageJson,
    rebrandManifestJson,
    rebrandPhaserGameHtml
} = require("./lib/rebrand");
const { buildElectronLinux } = require("./lib/run-electron");
const { buildCordova } = require("./lib/run-cordova");

const SOURCE_ROOT = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
    const out = { _: [], flags: {} };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith("--")) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith("--") && key !== "skip-bgm") {
                out.flags[key] = next; i++;
            } else out.flags[key] = true;
        } else out._.push(a);
    }
    return out;
}

function ensureDeps() {
    // pngjs is the one runtime dep actually needed for atlas baking.
    try { require("pngjs"); }
    catch (e) {
        console.log("Installing tool dependencies (pngjs, esbuild)…");
        const r = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
            cwd: __dirname,
            stdio: "inherit",
            shell: process.platform === "win32"
        });
        if (r.status !== 0) throw new Error("Failed to install tool dependencies");
    }
}

async function bundleBoot(destFile, opts) {
    // esbuild: IIFE bundle of src/phaser/boot-entry.js → lib/boot.bundle.js.
    // With GemShell-style Code Minification + Console Log Removal unless
    // `--no-minify` was passed.
    let esbuild;
    try { esbuild = require("esbuild"); }
    catch (e) {
        const r = spawnSync("npm", ["install", "--no-audit", "--no-fund", "esbuild"], {
            cwd: __dirname,
            stdio: "inherit",
            shell: process.platform === "win32"
        });
        if (r.status !== 0) throw new Error("Failed to install esbuild");
        esbuild = require("esbuild");
    }
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(SOURCE_ROOT, "src/phaser/boot-entry.js")],
        bundle: true,
        format: "iife",
        outfile: destFile,
        logLevel: "info",
        target: ["es2017"],
        minify: !!opts.minify,
        drop: opts.dropConsole ? ["console", "debugger"] : undefined
    });
}

// Lightweight HTML whitespace squeeze (GemShell "HTML minification 50-70%").
// Preserves <script>/<style>/<pre> content.
function minifyHtml(html) {
    const blocks = [];
    html = html.replace(/<(script|style|pre)[\s\S]*?<\/\1>/gi, (m) => {
        blocks.push(m);
        return "\u0001B" + (blocks.length - 1) + "\u0001";
    });
    html = html.replace(/<!--[\s\S]*?-->/g, "");
    html = html.replace(/\s+/g, " ");
    html = html.replace(/\s*(<\/?[a-zA-Z][^>]*>)\s*/g, "$1");
    html = html.replace(/\u0001B(\d+)\u0001/g, (_, i) => blocks[+i]);
    return html.trim();
}

// FPS overlay script that activates when ?fps=1 is in the URL. Mirrors
// GemShell's "Developer tools: FPS graph" feature without requiring a build
// dependency. Lives inline in phaser-game.html so it can't be tree-shaken.
const FPS_OVERLAY_SNIPPET =
"(function(){if(!/[?&]fps=1/.test(location.search))return;" +
"var el=document.createElement('div');" +
"el.style.cssText='position:fixed;top:4px;left:4px;z-index:99999;padding:2px 6px;" +
"background:rgba(0,0,0,.6);color:#0f0;font:12px/1.2 monospace;pointer-events:none';" +
"document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(el)});" +
"var frames=0,last=performance.now();function tick(t){frames++;if(t-last>=500){" +
"el.textContent=(frames*1000/(t-last)).toFixed(0)+' fps';frames=0;last=t;}" +
"requestAnimationFrame(tick);}requestAnimationFrame(tick);})();";

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const levelName = args._[0];
    const platformArg = (args._[1] || "linux").toLowerCase();
    if (!levelName) {
        console.error("Usage: node tools/build-level <levelName> <ios|android|linux|all> [--out DIR] [--package-id ID] [--skip-bgm]");
        process.exit(2);
    }
    const platforms = platformArg === "all"
        ? ["linux", "android", "ios"]
        : [platformArg];
    for (const p of platforms) {
        if (!["ios", "android", "linux"].includes(p)) {
            console.error("Unknown platform: " + p);
            process.exit(2);
        }
    }

    ensureDeps();

    const slug = slugify(levelName);
    const packageId = args.flags["package-id"] || packageIdFor(levelName);
    const buildRoot = path.resolve(args.flags.out || path.join(SOURCE_ROOT, "build", slug));
    const wwwRoot = path.join(buildRoot, "www");
    // GemShell-inspired toggles
    const minify = args.flags["no-minify"] ? false : true;
    const dropConsole = args.flags["keep-console"] ? false : true;
    const perfMode = args.flags["no-perf"] ? false : true;
    console.log("Level    : " + levelName);
    console.log("Slug     : " + slug);
    console.log("Package  : " + packageId);
    console.log("Build    : " + buildRoot);
    console.log("Platforms: " + platforms.join(", "));

    // Fresh workspace
    if (fs.existsSync(wwwRoot)) fs.rmSync(wwwRoot, { recursive: true, force: true });
    fs.mkdirSync(wwwRoot, { recursive: true });

    // 1. Fetch level
    console.log("\n[1/7] Fetching Firebase level…");
    let levelData;
    try { levelData = await fetchLevel(levelName); }
    catch (err) {
        console.error("ERROR: " + err.message);
        process.exit(err.code === "LEVEL_NOT_FOUND" ? 3 : 1);
    }

    // 2. Stage www skeleton (phaser, ui atlases, stages, sounds, fonts…)
    console.log("\n[2/7] Staging minimal www/ asset tree…");
    stageWww({ sourceRoot: SOURCE_ROOT, wwwRoot, levelName });

    // 3. Bake merged game_asset atlas
    console.log("\n[3/7] Baking merged atlas…");
    const mergeReport = await bakeMergedAtlas({
        sourceRoot: SOURCE_ROOT,
        destAssetsDir: path.join(wwwRoot, "assets"),
        levelData
    });
    console.log("  merged=" + mergeReport.merged + (mergeReport.merged ? (" frames=" + mergeReport.frames) : ""));

    // 4. Download custom BGM
    if (args.flags["skip-bgm"]) {
        console.log("\n[4/7] Skipping BGM download (--skip-bgm).");
    } else {
        console.log("\n[4/7] Downloading custom BGM…");
        await downloadBgmForLevel(levelData, path.join(wwwRoot, "assets/custom-bgm"));
    }

    // 5. Build offline level record + write as assets/level-data.json AND
    // embed in phaser-game.html so the boot scene has zero-network path.
    console.log("\n[5/7] Writing level-data.json + rebranding HTML…");
    const offlineLevel = buildOfflineLevelRecord(levelData);
    fs.writeFileSync(path.join(wwwRoot, "assets/level-data.json"), JSON.stringify(offlineLevel));

    // Rebranded phaser-game.html + FPS overlay + (optional) HTML minification.
    const srcHtml = path.join(SOURCE_ROOT, "phaser-game.html");
    let rebrandedHtml = rebrandPhaserGameHtml(srcHtml, levelName, offlineLevel);
    // Inject FPS overlay (toggle via ?fps=1 — GemShell-style FPS graph).
    rebrandedHtml = rebrandedHtml.replace(
        /<\/body>/,
        '<script>' + FPS_OVERLAY_SNIPPET + '</script>\n</body>'
    );
    if (minify) rebrandedHtml = minifyHtml(rebrandedHtml);
    fs.writeFileSync(path.join(wwwRoot, "phaser-game.html"), rebrandedHtml);

    // Rebranded manifest.json
    const rebrandedManifest = rebrandManifestJson(path.join(SOURCE_ROOT, "manifest.json"), levelName);
    fs.writeFileSync(path.join(wwwRoot, "manifest.json"), JSON.stringify(rebrandedManifest, null, 2));

    // 6. Bundle boot.bundle.js (with minify + drop console per GemShell mode)
    console.log("\n[6/7] Bundling boot-entry.js via esbuild (minify=" + minify + ", dropConsole=" + dropConsole + ")…");
    await bundleBoot(path.join(wwwRoot, "lib/boot.bundle.js"), { minify, dropConsole });

    if (args.flags["stage-only"]) {
        console.log("\n--stage-only: skipping platform builds. www staged at " + wwwRoot);
        return;
    }

    // 7. Platform builds
    console.log("\n[7/7] Platform builds…");
    const results = {};
    const rebrandedConfig = rebrandConfigXml(
        path.join(SOURCE_ROOT, "config.xml"),
        levelName,
        packageId
    );
    for (const p of platforms) {
        console.log("\n--- " + p.toUpperCase() + " ---");
        try {
            if (p === "linux") {
                const pkg = rebrandElectronPackageJson(
                    path.join(SOURCE_ROOT, "electron", "package.json"),
                    levelName,
                    packageId,
                    slug
                );
                results.linux = await buildElectronLinux({
                    sourceRoot: SOURCE_ROOT, wwwRoot, buildRoot,
                    levelName, packageId, slug,
                    rebrandedPackageJson: pkg,
                    perfMode
                });
            } else {
                results[p] = await buildCordova({
                    sourceRoot: SOURCE_ROOT, wwwRoot, buildRoot,
                    levelName, packageId, slug, platform: p,
                    configXml: rebrandedConfig
                });
            }
        } catch (err) {
            console.error(p + " build failed: " + err.message);
            process.exitCode = 1;
        }
    }

    console.log("\nDone. Artifacts:");
    for (const p of Object.keys(results)) {
        for (const a of (results[p].artifacts || [])) {
            console.log("  " + p + "  " + a);
        }
    }
}

main().catch(function (err) {
    console.error("FATAL:", err && err.stack || err);
    process.exit(1);
});
