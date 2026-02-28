import {
    gameState,
    loadHighScore,
    normalizeScore,
    saveHighScore,
    setHighScore,
    setScoreSyncStatus,
} from "./gameState.js";

const DEFAULT_DATABASE_PATH = "leaderboards/globalHighScore";

let initializePromise = null;
let databaseRef = null;

function getFirebaseConfig() {
    const config = globalThis.__FIREBASE_CONFIG__;
    if (!config || typeof config !== "object") {
        return null;
    }

    if (!config.apiKey || !config.databaseURL) {
        return null;
    }

    return config;
}

function getDatabasePath() {
    const path = typeof globalThis.__FIREBASE_DATABASE_PATH__ === "string"
        ? globalThis.__FIREBASE_DATABASE_PATH__
        : DEFAULT_DATABASE_PATH;

    return path.replace(/^\/+/, "").replace(/\/+$/, "") || DEFAULT_DATABASE_PATH;
}

function getFirebaseNamespace() {
    return globalThis.firebase || null;
}

function extractScore(value) {
    if (value && typeof value === "object" && value.value !== undefined) {
        return normalizeScore(value.value);
    }
    return normalizeScore(value);
}

function createScorePayload(firebaseNamespace, score) {
    return {
        value: normalizeScore(score),
        updatedAt: firebaseNamespace.database.ServerValue.TIMESTAMP,
    };
}

function ensureDatabaseRef() {
    if (databaseRef) {
        return databaseRef;
    }

    const firebaseNamespace = getFirebaseNamespace();
    const config = getFirebaseConfig();

    if (!firebaseNamespace || !config) {
        return null;
    }

    if (typeof firebaseNamespace.initializeApp !== "function" || typeof firebaseNamespace.database !== "function") {
        return null;
    }

    if (!firebaseNamespace.apps || firebaseNamespace.apps.length === 0) {
        firebaseNamespace.initializeApp(config);
    }

    databaseRef = firebaseNamespace.database().ref(getDatabasePath());
    return databaseRef;
}

function syncRemoteScoreToState(remoteScore) {
    const mergedHighScore = Math.max(
        normalizeScore(gameState.localHighScore),
        normalizeScore(gameState.highScore),
        normalizeScore(remoteScore)
    );

    setHighScore(remoteScore, "remote");
    setHighScore(mergedHighScore, "merged");
    saveHighScore();
    setScoreSyncStatus("ready");

    return mergedHighScore;
}

function syncFallbackState(status, message = "") {
    loadHighScore();
    setScoreSyncStatus(status, message);
    return normalizeScore(gameState.highScore);
}

function readRemoteHighScore() {
    const ref = ensureDatabaseRef();

    if (!ref) {
        if (getFirebaseConfig()) {
            return Promise.resolve(syncFallbackState("error", "Firebase SDK unavailable."));
        }
        return Promise.resolve(syncFallbackState("disabled", "Firebase config missing."));
    }

    setScoreSyncStatus("loading");

    return ref.once("value").then((snapshot) => {
        const remoteScore = extractScore(snapshot && typeof snapshot.val === "function" ? snapshot.val() : 0);
        const mergedHighScore = syncRemoteScoreToState(remoteScore);

        if (mergedHighScore > remoteScore) {
            return submitHighScore(mergedHighScore).then(() => mergedHighScore);
        }

        return mergedHighScore;
    }).catch((error) => {
        return syncFallbackState("error", error && error.message ? error.message : "Firebase read failed.");
    });
}

export function initializeFirebaseScores() {
    if (!initializePromise) {
        loadHighScore();
        initializePromise = readRemoteHighScore();
    }

    return initializePromise;
}

export function submitHighScore(score) {
    const candidate = normalizeScore(score);
    const ref = ensureDatabaseRef();
    const firebaseNamespace = getFirebaseNamespace();

    if (candidate > 0) {
        setHighScore(candidate, "local");
        saveHighScore();
    }

    if (!ref || !firebaseNamespace) {
        if (!getFirebaseConfig()) {
            setScoreSyncStatus("disabled", "Firebase config missing.");
        } else {
            setScoreSyncStatus("error", "Firebase SDK unavailable.");
        }
        return Promise.resolve(normalizeScore(gameState.highScore));
    }

    setScoreSyncStatus("saving");

    return ref.transaction((currentValue) => {
        const currentScore = extractScore(currentValue);
        if (candidate <= currentScore) {
            return currentValue;
        }

        return createScorePayload(firebaseNamespace, candidate);
    }).then((result) => {
        const nextScore = extractScore(result && result.snapshot ? result.snapshot.val() : candidate);
        return syncRemoteScoreToState(Math.max(candidate, nextScore));
    }).catch((error) => {
        setScoreSyncStatus("error", error && error.message ? error.message : "Firebase write failed.");
        return normalizeScore(gameState.highScore);
    });
}

export default initializeFirebaseScores;
