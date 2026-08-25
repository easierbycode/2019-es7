// Which game's leaderboard this page is playing for.
//
// The level editor mints a `gameId` onto a level record the first time it is
// saved and never changes it, so a level keeps its scores across renames and
// re-exports. tools/build-level bakes that id into the exported app's shell as
// __GAME_ID__; the hosted player picks it up off the loaded level record. When
// neither is present the id is derived from the level's name so a record saved
// before gameId existed still gets a stable board of its own.
//
// No id at all (the stock 2028.Ai game with no level loaded) keeps the single
// legacy board — see firebaseScores.js.

const ID_MAX = 48;

// RTDB keys cannot contain . $ # [ ] / or control characters, and level names
// are user-supplied, so everything outside a conservative set is collapsed.
export function slugifyGameId(value) {
    const slug = String(value == null ? "" : value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, ID_MAX);
    return slug;
}

// A short, stable digest of the name — keeps two levels whose names slugify to
// the same thing (e.g. "Ramsie" and "ramsie!") on separate boards.
function nameDigest(name) {
    let h = 0x811c9dc5;
    const s = String(name == null ? "" : name);
    for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
}

// A fresh id for a level the editor is saving for the first time. Readable in
// the RTDB console, and unique without a server round-trip.
export function mintGameId(name) {
    const slug = slugifyGameId(name) || "level";
    const rand = new Uint8Array(4);
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
        globalThis.crypto.getRandomValues(rand);
    } else {
        for (let i = 0; i < rand.length; i += 1) rand[i] = Math.floor(Math.random() * 256);
    }
    let hex = "";
    for (let i = 0; i < rand.length; i += 1) hex += rand[i].toString(16).padStart(2, "0");
    return slug + "-" + hex;
}

// The id for a level record, without minting: an explicit gameId if the record
// carries one, otherwise derived from its name.
export function gameIdForLevel(level) {
    if (!level || typeof level !== "object") return null;
    if (typeof level.gameId === "string" && level.gameId.trim()) {
        return slugifyGameId(level.gameId) || null;
    }
    const name = typeof level.name === "string" ? level.name : "";
    if (!name.trim()) return null;
    const slug = slugifyGameId(name) || "level";
    return slug + "-" + nameDigest(name);
}

// The id for the page we are running on.
export function resolveGameId() {
    if (typeof globalThis === "undefined") return null;

    const baked = globalThis.__GAME_ID__;
    if (typeof baked === "string" && baked.trim()) {
        return slugifyGameId(baked) || null;
    }

    return gameIdForLevel(globalThis.__OFFLINE_LEVEL__);
}

export default resolveGameId;
