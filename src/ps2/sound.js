// src/ps2/sound.js — Sound manager for PS2 AthenaEnv
// Wraps Sound.Stream (BGM) and Sound.Sfx (SFX) modules
// PS2 uses WAV for streams and ADPCM for SFX
// Audio files need to be converted from MP3 to WAV/OGG for PS2

var sounds = {};
var streams = {};
var currentBgm = null;
var currentBgmKey = "";
var masterVolume = 80;

function initSound() {
    // Sound.setVolume not available in all AthenaEnv builds
}

// Load a sound effect (ADPCM .adp or WAV)
function loadSfx(key, path) {
    try {
        sounds[key] = Sound.Sfx(path);
    } catch (e) {
        console.log("[Sound] Failed to load SFX: " + path);
    }
}

// Load a BGM stream (WAV or OGG)
function loadStream(key, path) {
    try {
        streams[key] = { path: path, stream: null };
    } catch (e) {
        console.log("[Sound] Failed to register stream: " + path);
    }
}

function playSfx(key, volume) {
    if (!sounds[key]) return;
    try {
        var ch = Sound.findChannel();
        if (volume !== undefined) {
            sounds[key].volume = Math.floor(volume * 100);
        }
        sounds[key].play(ch);
    } catch (e) {}
}

function playBgm(key, volume) {
    stopBgm();
    var entry = streams[key];
    if (!entry) return;
    try {
        var s = Sound.Stream(entry.path);
        s.loop = true;
        s.play();
        currentBgm = s;
        currentBgmKey = key;
    } catch (e) {
        console.log("[Sound] Failed to play BGM: " + key);
    }
}

function stopBgm() {
    if (currentBgm) {
        try {
            currentBgm.pause();
            currentBgm.free();
        } catch (e) {}
        currentBgm = null;
        currentBgmKey = "";
    }
}

function stopAllSounds() {
    stopBgm();
    // SFX channels auto-stop; no explicit stop needed
}

function playSound(key, volume) {
    // Try SFX first, then stream
    if (sounds[key]) {
        playSfx(key, volume);
    } else if (streams[key]) {
        // One-shot stream (voice lines, etc.)
        try {
            var s = Sound.Stream(streams[key].path);
            s.loop = false;
            s.play();
        } catch (e) {}
    }
}
