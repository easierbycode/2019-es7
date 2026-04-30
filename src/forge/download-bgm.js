// Downloads each customAudioURL into a Blob keyed by SHA-1(url).slice(0,16).
// Mirrors tools/build-level/lib/download-bgm.js but uses fetch + SubtleCrypto.

async function sha1Hex(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    const arr = new Uint8Array(buf);
    let hex = "";
    for (let i = 0; i < arr.length; i++) {
        hex += arr[i].toString(16).padStart(2, "0");
    }
    return hex;
}

export async function downloadBgmForLevel(levelData, onProgress) {
    if (!levelData || !levelData.customAudioURLs) {
        return { manifest: {}, blobs: new Map() };
    }
    const urls = levelData.customAudioURLs;
    const keys = Object.keys(urls).filter(function (k) {
        return urls[k] && typeof urls[k] === "string";
    });
    const manifest = {};
    const urlToFile = {};
    const blobs = new Map();

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const url = urls[key];
        if (urlToFile[url]) { manifest[key] = urlToFile[url]; continue; }
        const filename = (await sha1Hex(url)).slice(0, 16) + ".mp3";
        if (onProgress) onProgress(i, keys.length, key);
        try {
            const res = await fetch(url, { redirect: "follow" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const blob = await res.blob();
            blobs.set(filename, blob);
            urlToFile[url] = filename;
            manifest[key] = filename;
        } catch (e) {
            console.warn("forge: skip " + key + ": " + (e && e.message));
        }
    }
    return { manifest, blobs };
}
