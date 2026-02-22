function ensureGameState() {
    if (!globalThis.__GAME_STATE__ || typeof globalThis.__GAME_STATE__ !== "object") {
        globalThis.__GAME_STATE__ = {};
    }
    return globalThis.__GAME_STATE__;
}

function readCookie(name) {
    if (typeof document === "undefined" || typeof document.cookie !== "string") {
        return null;
    }

    const encodedName = encodeURIComponent(name) + "=";
    const parts = document.cookie.split(";");

    for (let i = 0; i < parts.length; i += 1) {
        const cookie = parts[i].trim();
        if (cookie.indexOf(encodedName) === 0) {
            return decodeURIComponent(cookie.substring(encodedName.length));
        }
    }

    return null;
}

export const gameState = ensureGameState();

export function loadHighScore(cookieKey = "afc2019_highScore") {
    const value = readCookie(cookieKey);
    if (value === null) {
        return 0;
    }

    const parsed = Number(value);
    const highScore = Number.isFinite(parsed) ? parsed : 0;
    gameState.highScore = highScore;
    return highScore;
}

export function saveHighScore(cookieKey = "afc2019_highScore") {
    if (typeof document === "undefined") {
        return;
    }

    const parsed = Number(gameState.highScore || 0);
    const highScore = Math.max(0, Math.floor(Number.isFinite(parsed) ? parsed : 0));
    gameState.highScore = highScore;

    const oneYearSeconds = 60 * 60 * 24 * 365;
    document.cookie = encodeURIComponent(cookieKey)
        + "="
        + encodeURIComponent(String(highScore))
        + ";path=/;max-age="
        + String(oneYearSeconds);
}

export default gameState;
