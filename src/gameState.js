function ensureGameState() {
    if (!globalThis.__GAME_STATE__ || typeof globalThis.__GAME_STATE__ !== "object") {
        globalThis.__GAME_STATE__ = {};
    }
    return globalThis.__GAME_STATE__;
}

export function normalizeScore(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 0;
    }
    return Math.max(0, Math.floor(parsed));
}

function ensureScoreState(state) {
    if (typeof state.score !== "number") {
        state.score = normalizeScore(state.score);
    }
    state.highScore = normalizeScore(state.highScore);
    state.localHighScore = normalizeScore(state.localHighScore);
    state.remoteHighScore = normalizeScore(state.remoteHighScore);
    state.highScore = Math.max(state.highScore, state.localHighScore, state.remoteHighScore);

    if (typeof state.scoreSyncStatus !== "string" || !state.scoreSyncStatus) {
        state.scoreSyncStatus = "idle";
    }
    if (typeof state.scoreSyncMessage !== "string") {
        state.scoreSyncMessage = "";
    }
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
ensureScoreState(gameState);

export function setHighScore(value, source = "merged") {
    const normalized = normalizeScore(value);

    if (source === "local") {
        gameState.localHighScore = normalized;
    } else if (source === "remote") {
        gameState.remoteHighScore = normalized;
    } else {
        gameState.localHighScore = Math.max(normalizeScore(gameState.localHighScore), normalized);
        gameState.remoteHighScore = Math.max(normalizeScore(gameState.remoteHighScore), normalized);
    }

    gameState.highScore = Math.max(
        normalized,
        normalizeScore(gameState.localHighScore),
        normalizeScore(gameState.remoteHighScore)
    );

    return gameState.highScore;
}

export function setScoreSyncStatus(status, message = "") {
    gameState.scoreSyncStatus = typeof status === "string" && status ? status : "idle";
    gameState.scoreSyncMessage = typeof message === "string" ? message : "";
}

export function loadHighScore(cookieKey = "afc2019_highScore") {
    const value = readCookie(cookieKey);
    if (value === null) {
        setHighScore(0, "local");
        return 0;
    }

    const highScore = normalizeScore(value);
    setHighScore(highScore, "local");
    return highScore;
}

export function saveHighScore(cookieKey = "afc2019_highScore") {
    if (typeof document === "undefined") {
        return normalizeScore(gameState.highScore);
    }

    const highScore = setHighScore(
        Math.max(
            normalizeScore(gameState.highScore),
            normalizeScore(gameState.localHighScore),
            normalizeScore(gameState.remoteHighScore)
        ),
        "local"
    );

    const oneYearSeconds = 60 * 60 * 24 * 365;
    document.cookie = encodeURIComponent(cookieKey)
        + "="
        + encodeURIComponent(String(highScore))
        + ";path=/;max-age="
        + String(oneYearSeconds);

    return highScore;
}

export default gameState;
