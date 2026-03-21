// src/ps2/sound.js — Sound manager for PS2 AthenaEnv
// Stub implementation — all sound calls are no-ops until assets are deployed

var sounds = {};
var streams = {};
var currentBgm = null;
var currentBgmKey = "";
var soundEnabled = 0;

function initSound() {
    // No-op until sound files are deployed
}

function loadSfx(key, path) {}
function loadStream(key, path) {}

function playSfx(key, volume) {}
function playBgm(key, volume) {}
function stopBgm() {}
function stopAllSounds() {}
function playSound(key, volume) {}

function saveHighScore() {
    // TODO: persist high score to memory card
}
