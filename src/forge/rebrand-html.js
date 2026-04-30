// Browser port of tools/build-level/lib/rebrand.js#rebrandPhaserGameHtml.
// Operates on the source HTML fetched from the running APK.

function xmlEscape(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export async function loadSourceHtml(baseUrl) {
    const r = await fetch((baseUrl || "./") + "phaser-game.html");
    if (!r.ok) throw new Error("Could not load phaser-game.html: " + r.status);
    return r.text();
}

export function rebrandPhaserGameHtml(srcHtml, levelName, offlineLevel) {
    let html = srcHtml;

    html = html.replace(
        /<title>[\s\S]*?<\/title>/,
        "<title>" + xmlEscape(levelName) + "</title>"
    );

    html = html.replace(
        /<script\s+src="\.\/lib\/firebase-app-compat\.js"><\/script>\s*/g,
        ""
    );
    html = html.replace(
        /<script\s+src="\.\/lib\/firebase-database-compat\.js"><\/script>\s*/g,
        ""
    );

    html = html.replace(
        /<script\s+type="module">[\s\S]*?<\/script>/,
        '<script src="./lib/boot.bundle.js"></script>'
    );

    const inject =
        '<script>window.__OFFLINE_LEVEL_NAME__=' +
        JSON.stringify(String(levelName)) + ';' +
        'window.__OFFLINE_LEVEL__=' + JSON.stringify(offlineLevel) + ';</script>';
    html = html.replace(/<body>/, "<body>\n" + inject);

    return html;
}
