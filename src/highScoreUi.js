import { gameState, normalizeScore } from "./gameState.js";

const SYNC_COPY = {
    idle: "WORLD BEST STANDBY",
    loading: "SYNCING WORLD BEST",
    ready: "FIREBASE ONLINE",
    saving: "UPDATING WORLD BEST",
    disabled: "LOCAL CACHE ONLY",
    error: "FIREBASE OFFLINE",
};

const SYNC_TINT = {
    idle: 0xcccccc,
    loading: 0xf6d365,
    ready: 0x9be37f,
    saving: 0xf6d365,
    disabled: 0xcccccc,
    error: 0xff8a80,
};

export function getDisplayedHighScore() {
    return normalizeScore(gameState.highScore);
}

export function getWorldBestLabel() {
    return "WORLD BEST";
}

export function getHighScoreSyncText() {
    const status = typeof gameState.scoreSyncStatus === "string" ? gameState.scoreSyncStatus : "idle";
    return SYNC_COPY[status] || SYNC_COPY.idle;
}

export function getHighScoreSyncTint() {
    const status = typeof gameState.scoreSyncStatus === "string" ? gameState.scoreSyncStatus : "idle";
    return SYNC_TINT[status] || SYNC_TINT.idle;
}

export function createScoreTextStyle(options = {}) {
    const {
        fontSize = 10,
        fill = 0xffffff,
        align = "left",
    } = options;

    return new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize,
        fontWeight: "bold",
        fill,
        align,
        letterSpacing: 1,
        lineJoin: "round",
        stroke: 0x000000,
        strokeThickness: 2,
    });
}
