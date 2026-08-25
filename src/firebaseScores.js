import {
    gameState,
    isExportedLevelApp,
    loadHighScore,
    normalizeScore,
    saveHighScore,
    setDailyHighScore,
    setHighScore,
    setScoreSyncStatus,
} from "./gameState.js";
import { resolveGameId } from "./gameIdentity.js";

// Where a game with no identity of its own scores — the stock 2028.Ai board,
// left exactly where it has always been so its existing world best survives.
const LEGACY_DATABASE_PATH = "leaderboards/globalHighScore";
const LEADERBOARD_ROOT = "leaderboards";

// How long to wait for the compat SDK once the page has told us there is a
// config. Host pages load it deferred so an offline app boots instantly, which
// means it lands *after* this bundle — see the shell in
// cmg/tools/build-level/lib/shell-template.js.
const SDK_WAIT_MS = 8000;

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

function trimPath(path) {
    return String(path).replace(/^\/+/, "").replace(/\/+$/, "");
}

// The UTC day a score belongs to. UTC rather than local time so every player in
// the world rolls over to a new daily board at the same instant.
export function dailyBoardKey(now) {
    const date = now instanceof Date ? now : new Date();
    return date.toISOString().slice(0, 10);
}

// The nodes this page reads and writes.
//
// A game with an id of its own gets its own board, with room for the daily one
// beside the all-time one:
//
//   leaderboards/<gameId>/allTime            { value, updatedAt }
//   leaderboards/<gameId>/daily/<YYYY-MM-DD> { value, updatedAt }
//   leaderboards/<gameId>/meta               { name, updatedAt }
//
// __FIREBASE_DATABASE_PATH__ still pins the all-time node outright, for a
// deployment that wants one shared board; that mode has no daily.
export function getBoardPaths() {
    const override = typeof globalThis.__FIREBASE_DATABASE_PATH__ === "string"
        ? trimPath(globalThis.__FIREBASE_DATABASE_PATH__)
        : "";
    if (override) {
        return { allTime: override, daily: null, meta: null };
    }

    const gameId = resolveGameId();
    if (!gameId) {
        return { allTime: LEGACY_DATABASE_PATH, daily: null, meta: null };
    }

    const root = LEADERBOARD_ROOT + "/" + gameId;
    return {
        allTime: root + "/allTime",
        daily: root + "/daily/" + dailyBoardKey(),
        meta: root + "/meta",
    };
}

function getFirebaseNamespace() {
    return globalThis.firebase || null;
}

// The SDK is loaded deferred, so it can arrive after this module has booted.
// Wait for it — but only when the page claims a config, and only for a bounded
// time, so an offline app settles on its local cache promptly.
function whenFirebaseNamespace() {
    const existing = getFirebaseNamespace();
    if (existing || !getFirebaseConfig()) {
        return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
        let waited = 0;
        const timer = setInterval(() => {
            waited += 100;
            const namespace = getFirebaseNamespace();
            if (namespace || waited >= SDK_WAIT_MS) {
                clearInterval(timer);
                resolve(namespace);
            }
        }, 100);
    });
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

function ensureDatabase() {
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

    return firebaseNamespace.database();
}

function ensureDatabaseRef() {
    if (databaseRef) {
        return databaseRef;
    }

    const db = ensureDatabase();
    if (!db) {
        return null;
    }

    databaseRef = db.ref(getBoardPaths().allTime);
    return databaseRef;
}

function refFor(path) {
    if (!path) {
        return null;
    }
    const db = ensureDatabase();
    return db ? db.ref(path) : null;
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

// Today's board is read for display only — it never feeds gameState.highScore,
// which is this player's own best.
function readDailyHighScore() {
    const ref = refFor(getBoardPaths().daily);
    if (!ref) {
        return Promise.resolve(normalizeScore(gameState.dailyHighScore));
    }

    return ref.once("value").then((snapshot) => {
        const daily = extractScore(snapshot && typeof snapshot.val === "function" ? snapshot.val() : 0);
        return setDailyHighScore(daily);
    }).catch(() => normalizeScore(gameState.dailyHighScore));
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

        return readDailyHighScore().then(() => {
            if (mergedHighScore > remoteScore) {
                return submitHighScore(mergedHighScore).then(() => mergedHighScore);
            }
            return mergedHighScore;
        });
    }).catch((error) => {
        return syncFallbackState("error", error && error.message ? error.message : "Firebase read failed.");
    });
}

export function initializeFirebaseScores() {
    if (!initializePromise) {
        // Restore the local best synchronously, so the title screen has a
        // number to show on the frame it is built; the world best merges in
        // whenever the network gets back to us.
        loadHighScore();
        // Say so while the deferred SDK is still on its way. Left on "idle"
        // the title would read WORLD BEST STANDBY for the whole wait, which is
        // the label for a sync that never even started.
        if (getFirebaseConfig() && !getFirebaseNamespace()) {
            setScoreSyncStatus("loading");
        }
        initializePromise = whenFirebaseNamespace().then(() => readRemoteHighScore());
    }

    return initializePromise;
}

// Raise a board to `candidate` if it is higher. Resolves to whatever the board
// holds afterwards, or to `candidate` when there is nothing to write to.
function raiseBoard(path, candidate, firebaseNamespace) {
    const ref = refFor(path);
    if (!ref) {
        return Promise.resolve(candidate);
    }

    return ref.transaction((currentValue) => {
        const currentScore = extractScore(currentValue);
        if (candidate <= currentScore) {
            return currentValue;
        }

        return createScorePayload(firebaseNamespace, candidate);
    }).then((result) => {
        return extractScore(result && result.snapshot ? result.snapshot.val() : candidate);
    });
}

// Name the board in the database so it is legible in the console — and so a
// future "every game" listing has something to render.
function stampBoardMeta(path, firebaseNamespace) {
    const ref = refFor(path);
    const level = globalThis.__OFFLINE_LEVEL__;
    const name = level && typeof level.name === "string" ? level.name : null;
    if (!ref || !name) {
        return Promise.resolve();
    }

    return ref.update({
        name,
        updatedAt: firebaseNamespace.database.ServerValue.TIMESTAMP,
    }).catch(() => {});
}

export function submitHighScore(score) {
    // An invincible (?god=1) run's score never reaches the shared leaderboard.
    // On the hosted game it is not a local record either. An exported level
    // app is the exception: god mode there is authored into the cartridge and
    // there is no leaderboard to protect, so the run still sets the local best
    // (see scoreCountsAsRecord in gameState.js).
    const godRun = !!gameState.godFlg;
    if (godRun && !isExportedLevelApp()) {
        return Promise.resolve(normalizeScore(gameState.highScore));
    }

    const candidate = normalizeScore(score);

    if (candidate > 0) {
        setHighScore(candidate, "local");
        saveHighScore();
    }

    if (godRun) {
        setScoreSyncStatus("disabled", "God mode run — not submitted.");
        return Promise.resolve(normalizeScore(gameState.highScore));
    }

    // Announced before the wait, not after: the deferred SDK can still be in
    // flight, and "UPDATING WORLD BEST" is what is actually happening.
    if (getFirebaseConfig()) {
        setScoreSyncStatus("saving");
    }

    return whenFirebaseNamespace().then((firebaseNamespace) => {
        const ref = ensureDatabaseRef();

        if (!ref || !firebaseNamespace) {
            if (!getFirebaseConfig()) {
                setScoreSyncStatus("disabled", "Firebase config missing.");
            } else {
                setScoreSyncStatus("error", "Firebase SDK unavailable.");
            }
            return normalizeScore(gameState.highScore);
        }

        const paths = getBoardPaths();

        // The all-time board decides WORLD BEST; today's board rides along so
        // the daily standings are already being kept when a screen for them
        // arrives. Neither should sink the other, hence allSettled.
        return Promise.allSettled([
            raiseBoard(paths.allTime, candidate, firebaseNamespace),
            raiseBoard(paths.daily, candidate, firebaseNamespace),
            stampBoardMeta(paths.meta, firebaseNamespace),
        ]).then((results) => {
            const [allTime, daily] = results;

            if (daily.status === "fulfilled") {
                setDailyHighScore(Math.max(candidate, normalizeScore(daily.value)));
            }

            if (allTime.status !== "fulfilled") {
                const error = allTime.reason;
                setScoreSyncStatus("error", error && error.message ? error.message : "Firebase write failed.");
                return normalizeScore(gameState.highScore);
            }

            return syncRemoteScoreToState(Math.max(candidate, normalizeScore(allTime.value)));
        });
    });
}

export default initializeFirebaseScores;
