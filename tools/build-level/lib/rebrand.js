"use strict";

// Produces rebranded config.xml, electron package.json, manifest.json and
// phaser-game.html with the level name as display name and
// com.easierbycode.<slug> as package id.

const fs = require("fs");
const path = require("path");

function xmlEscape(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function jsEscape(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function rebrandConfigXml(sourceXml, levelName, packageId) {
    let xml = fs.readFileSync(sourceXml, "utf8");
    // Replace widget id and name (first occurrence only).
    xml = xml.replace(/<widget\s+id="[^"]*"/, '<widget id="' + xmlEscape(packageId) + '"');
    xml = xml.replace(/<name>[\s\S]*?<\/name>/, "<name>" + xmlEscape(levelName) + "</name>");
    xml = xml.replace(/<content\s+src="[^"]*"\s*\/>/, '<content src="phaser-game.html" />');
    return xml;
}

function rebrandElectronPackageJson(sourcePath, levelName, packageId, slug) {
    const pkg = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    pkg.name = slug;
    pkg.productName = levelName;
    pkg.description = levelName;
    pkg.build = pkg.build || {};
    pkg.build.appId = packageId;
    pkg.build.productName = levelName;
    pkg.build.linux = pkg.build.linux || {};
    pkg.build.linux.artifactName = slug + ".AppImage";
    return pkg;
}

function rebrandManifestJson(sourcePath, levelName) {
    const m = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    m.name = levelName;
    m.short_name = levelName;
    m.start_url = "./phaser-game.html";
    return m;
}

// Patches phaser-game.html to:
//  - set <title> to levelName
//  - drop firebase <script> tags (not needed offline, still harmless but stripped)
//  - drop the module script block (src/phaser/boot-entry.js is bundled via esbuild)
//  - inject a bundled boot script + OFFLINE_LEVEL JSON embed
//  - drop iOS install banner references to level-editor.html
function rebrandPhaserGameHtml(sourcePath, levelName, offlineLevelJson) {
    let html = fs.readFileSync(sourcePath, "utf8");

    // Title
    html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + xmlEscape(levelName) + "</title>");

    // Drop firebase script tags (offline build)
    html = html.replace(/<script\s+src="\.\/lib\/firebase-app-compat\.js"><\/script>\s*/g, "");
    html = html.replace(/<script\s+src="\.\/lib\/firebase-database-compat\.js"><\/script>\s*/g, "");

    // Replace the module import boot block with the esbuild-bundled boot.
    // Mirrors what .github/workflows/deploy.yml does for CI builds.
    html = html.replace(
        /<script\s+type="module">[\s\S]*?<\/script>/,
        '<script src="./lib/boot.bundle.js"></script>'
    );

    // Inject OFFLINE_LEVEL + level name just after <body>. Use a data script
    // tag so bootscene can do fetch("assets/level-data.json") too.
    const inject =
        '<script>window.__OFFLINE_LEVEL_NAME__="' + jsEscape(levelName) + '";' +
        'window.__OFFLINE_LEVEL__=' + JSON.stringify(offlineLevelJson) + ';</script>';
    html = html.replace(/<body>/, "<body>\n" + inject);

    return html;
}

module.exports = {
    rebrandConfigXml,
    rebrandElectronPackageJson,
    rebrandManifestJson,
    rebrandPhaserGameHtml
};
