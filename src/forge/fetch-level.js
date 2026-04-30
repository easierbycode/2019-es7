const FIREBASE_DB_URL = "https://evil-invaders-default-rtdb.firebaseio.com";
const LEVELS_PATH = "levels";

export async function fetchLevel(levelName) {
    const url = FIREBASE_DB_URL + "/" + LEVELS_PATH + "/" +
        encodeURIComponent(levelName) + ".json";
    const res = await fetch(url);
    if (!res.ok) {
        const err = new Error("HTTP " + res.status + " for " + url);
        err.code = "HTTP_ERROR";
        throw err;
    }
    const data = await res.json();
    if (!data || !data.enemylist) {
        const err = new Error('Level "' + levelName + '" not found');
        err.code = "LEVEL_NOT_FOUND";
        throw err;
    }
    return data;
}
