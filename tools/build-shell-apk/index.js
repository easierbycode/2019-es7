#!/usr/bin/env node
"use strict";

// Builds the placeholder "shell APK" that the cordova-plugin-apk-forge plugin
// stamps on-device. The shell is a normal Cordova Android debug build with:
//   - widget id  = "com.easierbycode.zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz" (47 chars)
//   - app name   = "APKForgeLabelPlaceholder__________________________" (50 chars)
//   - assets/www = empty (just .keep)
// META-INF/ is stripped from the output and a sha256 + length-stable
// placeholder verification report are emitted alongside.
//
// Usage:
//   node tools/build-shell-apk
//
// Environment:
//   CORDOVA_DIR   override the temp Cordova project location
//   APKFORGE_OUT  override the output APK path (default: assets/apkforge/shell-template.apk)

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const crypto = require("crypto");

const SOURCE_ROOT = path.resolve(__dirname, "..", "..");
const PKG_PLACEHOLDER = "com.easierbycode.zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
const LABEL_PLACEHOLDER = "APKForgeLabelPlaceholder__________________________";
const PKG_LEN = 47;
const LABEL_LEN = 50;

if (PKG_PLACEHOLDER.length !== PKG_LEN) {
    throw new Error("PKG_PLACEHOLDER length mismatch");
}
if (LABEL_PLACEHOLDER.length !== LABEL_LEN) {
    throw new Error("LABEL_PLACEHOLDER length mismatch");
}

function run(cmd, args, opts) {
    console.log("$ " + cmd + " " + args.join(" "));
    const r = spawnSync(cmd, args, Object.assign({
        stdio: "inherit",
        shell: process.platform === "win32"
    }, opts || {}));
    if (r.status !== 0) throw new Error(cmd + " exited " + r.status);
}

function readConfigXml(srcPath) {
    return fs.readFileSync(srcPath, "utf8");
}

function rebrandConfigXml(xml, packageId, appLabel) {
    let out = xml;
    out = out.replace(/<widget\s+id="[^"]*"/, '<widget id="' + packageId + '"');
    out = out.replace(/<name>[\s\S]*?<\/name>/, "<name>" + appLabel + "</name>");
    out = out.replace(/<content\s+src="[^"]*"\s*\/>/, '<content src="phaser-game.html" />');
    return out;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function copyFile(s, d) {
    ensureDir(path.dirname(d));
    fs.copyFileSync(s, d);
}

function copyDir(s, d) {
    if (!fs.existsSync(s)) return;
    ensureDir(d);
    for (const e of fs.readdirSync(s, { withFileTypes: true })) {
        const sp = path.join(s, e.name);
        const dp = path.join(d, e.name);
        if (e.isDirectory()) copyDir(sp, dp);
        else if (e.isFile()) fs.copyFileSync(sp, dp);
    }
}

function stripMetaInf(apkPath) {
    const yauzl = tryRequire("yauzl");
    const yazl = tryRequire("yazl");
    if (!yauzl || !yazl) {
        ensureNpmInstall();
        return stripMetaInf(apkPath);
    }
    return new Promise(function (resolve, reject) {
        const tmp = apkPath + ".tmp";
        const writer = new yazl.ZipFile();
        const out = fs.createWriteStream(tmp);
        writer.outputStream.pipe(out);
        yauzl.open(apkPath, { lazyEntries: true }, function (err, zip) {
            if (err) return reject(err);
            zip.readEntry();
            zip.on("entry", function (e) {
                if (/^META-INF\//.test(e.fileName)) { zip.readEntry(); return; }
                zip.openReadStream(e, function (err2, rs) {
                    if (err2) return reject(err2);
                    const opts = { mtime: e.getLastModDate() || new Date() };
                    writer.addReadStream(rs, e.fileName, opts);
                    rs.on("end", function () { zip.readEntry(); });
                });
            });
            zip.on("end", function () {
                writer.end();
                out.on("close", function () {
                    fs.renameSync(tmp, apkPath);
                    resolve();
                });
            });
        });
    });
}

function tryRequire(name) {
    try { return require(name); } catch (e) { return null; }
}

function ensureNpmInstall() {
    console.log("Installing local zip libs (yauzl, yazl)…");
    run("npm", ["install", "--no-audit", "--no-fund", "yauzl", "yazl"], { cwd: __dirname });
}

function verifyPlaceholdersInApk(apkPath) {
    const data = fs.readFileSync(apkPath);
    const hits = {
        pkgUtf16: searchUtf16(data, PKG_PLACEHOLDER),
        labelUtf8: searchUtf8(data, LABEL_PLACEHOLDER),
        labelUtf16: searchUtf16(data, LABEL_PLACEHOLDER)
    };
    const ok = hits.pkgUtf16 > 0 && (hits.labelUtf8 > 0 || hits.labelUtf16 > 0);
    return { ok, hits };
}

function searchUtf16(data, str) {
    const buf = Buffer.from(str, "utf16le");
    return countOccurrences(data, buf);
}

function searchUtf8(data, str) {
    const buf = Buffer.from(str, "utf8");
    return countOccurrences(data, buf);
}

function countOccurrences(haystack, needle) {
    let count = 0; let i = 0;
    while ((i = haystack.indexOf(needle, i)) !== -1) { count++; i += needle.length; }
    return count;
}

async function main() {
    const cordovaDir = process.env.CORDOVA_DIR
        || path.join(SOURCE_ROOT, "build", "shell-apk", "cordova");
    const outApk = process.env.APKFORGE_OUT
        || path.join(SOURCE_ROOT, "assets", "apkforge", "shell-template.apk");

    console.log("Source root: " + SOURCE_ROOT);
    console.log("Cordova dir: " + cordovaDir);
    console.log("Out APK    : " + outApk);

    if (fs.existsSync(cordovaDir)) {
        fs.rmSync(cordovaDir, { recursive: true, force: true });
    }
    ensureDir(path.dirname(cordovaDir));

    run("cordova", ["create", cordovaDir, PKG_PLACEHOLDER, LABEL_PLACEHOLDER]);

    const baseConfig = readConfigXml(path.join(SOURCE_ROOT, "config.xml"));
    const rebranded = rebrandConfigXml(baseConfig, PKG_PLACEHOLDER, LABEL_PLACEHOLDER);
    fs.writeFileSync(path.join(cordovaDir, "config.xml"), rebranded);

    copyDir(path.join(SOURCE_ROOT, "hooks"), path.join(cordovaDir, "hooks"));
    copyDir(path.join(SOURCE_ROOT, "res"),   path.join(cordovaDir, "res"));

    const www = path.join(cordovaDir, "www");
    if (fs.existsSync(www)) fs.rmSync(www, { recursive: true, force: true });
    ensureDir(www);
    fs.writeFileSync(path.join(www, ".keep"), "");
    fs.writeFileSync(path.join(www, "phaser-game.html"),
        '<!doctype html><html><head><title>' + LABEL_PLACEHOLDER + '</title></head><body></body></html>\n');

    run("cordova", ["platform", "add", "android@14.0.1"], { cwd: cordovaDir });

    const apkForgePlugin = path.join(SOURCE_ROOT, "plugins", "cordova-plugin-apk-forge");
    if (fs.existsSync(apkForgePlugin)) {
        run("cordova", ["plugin", "add", apkForgePlugin, "--nosave"], { cwd: cordovaDir });
    }

    run("cordova", ["compile", "android", "--debug", "--packageType=apk"], { cwd: cordovaDir });

    const apkRoot = path.join(cordovaDir, "platforms", "android", "app", "build", "outputs", "apk");
    const found = [];
    (function find(dir) {
        if (!fs.existsSync(dir)) return;
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const fp = path.join(dir, e.name);
            if (e.isDirectory()) find(fp);
            else if (e.isFile() && fp.endsWith(".apk")) found.push(fp);
        }
    })(apkRoot);
    if (found.length === 0) throw new Error("no APK produced under " + apkRoot);

    ensureDir(path.dirname(outApk));
    copyFile(found[0], outApk);
    console.log("Copied: " + found[0] + " -> " + outApk);

    await stripMetaInf(outApk);

    const sha = crypto.createHash("sha256").update(fs.readFileSync(outApk)).digest("hex");
    fs.writeFileSync(outApk + ".sha256", sha + "  " + path.basename(outApk) + "\n");
    console.log("sha256 " + sha);

    const v = verifyPlaceholdersInApk(outApk);
    console.log("Placeholder verification: " + JSON.stringify(v.hits));
    if (!v.ok) {
        throw new Error("Placeholder strings not found in shell APK — manifest/arsc rewriting will fail at runtime");
    }
    console.log("Shell APK ready: " + outApk);
}

main().catch(function (err) {
    console.error("FATAL:", err && err.stack || err);
    process.exit(1);
});
