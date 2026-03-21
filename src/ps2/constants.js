// src/ps2/constants.js — Game constants for PS2 AthenaEnv port
// Original game: 256x480. PS2 default: 640x448.
// We render the game centered with a scale factor.

var GW = 256;
var GH = 480;
var GCX = 128;
var GCY = 240;

var FPS = 30;
var FRAME_MS = 1000 / FPS;

// Boss BGM names (index = stageId)
var BOSS_NAMES = ["bison", "barlog", "sagat", "vega", "fang"];

// Item codes from enemy wave data
var ITEM_CODES = {
    "1": "big",
    "2": "3way",
    "3": "speed_high",
    "9": "barrier",
};
