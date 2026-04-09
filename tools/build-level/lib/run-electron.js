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

async function buildElectronLinux(opts) {
    const { sourceRoot, wwwRoot, buildRoot, levelName, packageId, slug, rebrandedPackageJson } = opts;
    const perfMode = opts.perfMode !== false;
    const electronDir = path.join(buildRoot, "electron");
    fs.mkdirSync(electronDir, { recursive: true });

    // Copy main/preload/afterPack, applying GemShell-style perf-mode patches to main.js.
    for (const f of ["preload.js", "afterPack.js"]) {
        copyFile(path.join(sourceRoot, "electron", f), path.join(electronDir, f));
    }
    // Patch main.js: prepend Chromium perf flags, register F11 fullscreen
    // accelerator, and optionally expose an FPS overlay.
    let mainJs = fs.readFileSync(path.join(sourceRoot, "electron", "main.js"), "utf8");
    const perfPreamble = [
        "// ----- GemShell-style Performance Mode (injected by tools/build-level) -----",
        "// Disables v-sync and the 60fps frame-rate cap so the game can render at the",
        "// monitor's full refresh rate (144+ Hz). Toggleable via GEMSHELL_PERF=0.",
        "if (process.env.GEMSHELL_PERF !== '0') {",
        "    try {",
        "        const { app } = require('electron');",
        "        app.commandLine.appendSwitch('disable-frame-rate-limit');",
        "        app.commandLine.appendSwitch('disable-gpu-vsync');",
        "        app.commandLine.appendSwitch('disable-renderer-backgrounding');",
        "        app.commandLine.appendSwitch('enable-zero-copy');",
        "    } catch (e) {}",
        "}",
        ""
    ].join("\n");
    const perfPostamble = [
        "",
        "// ----- GemShell-style F11 / Cmd+F fullscreen toggle (injected) -----",
        "try {",
        "    const { app: _app, globalShortcut, BrowserWindow: _BW } = require('electron');",
        "    _app.whenReady().then(() => {",
        "        const toggleFs = () => {",
        "            const w = _BW.getAllWindows()[0];",
        "            if (w) w.setFullScreen(!w.isFullScreen());",
        "        };",
        "        try { globalShortcut.register('F11', toggleFs); } catch (e) {}",
        "        try { globalShortcut.register('CommandOrControl+F', toggleFs); } catch (e) {}",
        "    });",
        "    _app.on('will-quit', () => { try { globalShortcut.unregisterAll(); } catch (e) {} });",
        "} catch (e) {}",
        ""
    ].join("\n");
    if (perfMode) mainJs = perfPreamble + mainJs + perfPostamble;
    fs.writeFileSync(path.join(electronDir, "main.js"), mainJs);

    // www
    copyDir(wwwRoot, path.join(electronDir, "www"));
    // icons
    copyDir(path.join(sourceRoot, "icons"), path.join(electronDir, "icons"));
    // package.json (rebranded)
    fs.writeFileSync(path.join(electronDir, "package.json"), JSON.stringify(rebrandedPackageJson, null, 2));

    // npm install
    run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], { cwd: electronDir });
    // install electron-builder + electron as dev deps required by build
    run("npm", ["install", "--save-dev", "--no-audit", "--no-fund", "electron@^33", "electron-builder@^25"], { cwd: electronDir });
    // build
    run("npx", ["electron-builder", "--linux", "AppImage", "--publish", "never"], { cwd: electronDir });

    // copy artifact(s)
    const distDir = path.join(electronDir, "dist");
    const outDir = path.join(buildRoot, "dist");
    fs.mkdirSync(outDir, { recursive: true });
    const artifacts = [];
    if (fs.existsSync(distDir)) {
        for (const f of fs.readdirSync(distDir)) {
            if (f.endsWith(".AppImage")) {
                copyFile(path.join(distDir, f), path.join(outDir, f));
                artifacts.push(path.join(outDir, f));
            }
        }
    }
    return { artifacts };
}

module.exports = { buildElectronLinux };
