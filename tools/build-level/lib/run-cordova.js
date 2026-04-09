"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
function run(cmd, args, opts) {
    console.log("$ " + cmd + " " + args.join(" "));
    const r = spawnSync(cmd, args, Object.assign({ stdio: "inherit", shell: process.platform === "win32" }, opts || {}));
    if (r.status !== 0) throw new Error(cmd + " exited " + r.status);
}

async function buildCordova(opts) {
    const { sourceRoot, wwwRoot, buildRoot, levelName, packageId, slug, platform, configXml } = opts;
    if (platform !== "android" && platform !== "ios") {
        throw new Error("Unsupported cordova platform: " + platform);
    }

    const cordovaDir = path.join(buildRoot, "cordova");
    fs.mkdirSync(path.dirname(cordovaDir), { recursive: true });

    // Fresh create — if dir exists, cordova create will fail; remove first.
    if (fs.existsSync(cordovaDir)) fs.rmSync(cordovaDir, { recursive: true, force: true });
    run("cordova", ["create", cordovaDir, packageId, levelName]);

    // Replace config.xml with our rebranded one
    fs.writeFileSync(path.join(cordovaDir, "config.xml"), configXml);
    // Copy hooks, res, icons
    copyDir(path.join(sourceRoot, "hooks"), path.join(cordovaDir, "hooks"));
    copyDir(path.join(sourceRoot, "res"), path.join(cordovaDir, "res"));
    copyDir(path.join(sourceRoot, "icons"), path.join(cordovaDir, "icons"));

    // Replace www
    const dstWww = path.join(cordovaDir, "www");
    if (fs.existsSync(dstWww)) fs.rmSync(dstWww, { recursive: true, force: true });
    copyDir(wwwRoot, dstWww);

    // Inject <script src="cordova.js"></script> into phaser-game.html
    const htmlPath = path.join(dstWww, "phaser-game.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    if (html.indexOf('src="cordova.js"') === -1) {
        html = html.replace(/<\/head>/, '<script src="cordova.js"></script>\n</head>');
        fs.writeFileSync(htmlPath, html);
    }

    // platform add
    const platformArg = platform === "android" ? "android@14.0.1" : "ios@7.1.1";
    run("cordova", ["platform", "add", platformArg], { cwd: cordovaDir });

    // plugins
    if (platform === "android") {
        const plug = path.join(sourceRoot, "plugins", "cordova-plugin-sprite-share");
        if (fs.existsSync(plug)) {
            run("cordova", ["plugin", "add", plug, "--nosave"], { cwd: cordovaDir });
        }
    } else {
        const plug = path.join(sourceRoot, "plugins", "cordova-plugin-ios-haptics");
        if (fs.existsSync(plug)) {
            run("cordova", ["plugin", "add", plug, "--nosave"], { cwd: cordovaDir });
        }
    }

    // build / prepare
    if (platform === "android") {
        run("cordova", ["compile", "android", "--debug", "--packageType=apk"], { cwd: cordovaDir });
    } else {
        // iOS signing handled externally (matches CI); only prepare.
        run("cordova", ["prepare", "ios"], { cwd: cordovaDir });
    }

    // Copy artifacts
    const outDir = path.join(buildRoot, "dist");
    fs.mkdirSync(outDir, { recursive: true });
    const artifacts = [];
    if (platform === "android") {
        // find .apk
        const apkRoot = path.join(cordovaDir, "platforms/android/app/build/outputs/apk");
        function findApks(dir) {
            if (!fs.existsSync(dir)) return;
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) findApks(full);
                else if (e.isFile() && full.endsWith(".apk")) {
                    const dst = path.join(outDir, slug + "-" + e.name);
                    copyFile(full, dst);
                    artifacts.push(dst);
                }
            }
        }
        findApks(apkRoot);
    } else {
        // iOS: return the Xcode project path for external signing/upload
        const xcodeRoot = path.join(cordovaDir, "platforms/ios");
        artifacts.push(xcodeRoot);
    }
    return { artifacts };
}

module.exports = { buildCordova };
