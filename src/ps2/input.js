// src/ps2/input.js — Gamepad input for PS2 AthenaEnv
// Maps DualShock 2 buttons to game actions

var pad = null;
var padPrev = null;

var BTN = {
    CROSS: 0x0040,    // Cross (X)
    CIRCLE: 0x0020,   // Circle
    SQUARE: 0x0080,   // Square
    TRIANGLE: 0x0010, // Triangle
    L1: 0x0004,
    R1: 0x0008,
    L2: 0x0001,
    R2: 0x0002,
    START: 0x0800,
    SELECT: 0x0100,
    UP: 0x1000,
    DOWN: 0x4000,
    LEFT: 0x8000,
    RIGHT: 0x2000,
};

function initInput() {
    Pads.init();
}

function updateInput() {
    padPrev = pad;
    pad = Pads.get(0);
}

function isDown(btn) {
    return pad && (pad.btns & btn) !== 0;
}

function isPressed(btn) {
    return pad && (pad.btns & btn) !== 0 && (!padPrev || (padPrev.btns & btn) === 0);
}

function getAnalogX() {
    if (!pad) return 0;
    // Analog stick: 0-255, center ~128
    var raw = pad.lx !== undefined ? pad.lx : 128;
    return (raw - 128) / 128.0;
}

function getAnalogY() {
    if (!pad) return 0;
    var raw = pad.ly !== undefined ? pad.ly : 128;
    return (raw - 128) / 128.0;
}

// High-level game input helpers
function isLeftHeld() {
    return isDown(BTN.LEFT) || getAnalogX() < -0.3;
}

function isRightHeld() {
    return isDown(BTN.RIGHT) || getAnalogX() > 0.3;
}

function isUpHeld() {
    return isDown(BTN.UP) || getAnalogY() < -0.3;
}

function isDownHeld() {
    return isDown(BTN.DOWN) || getAnalogY() > 0.3;
}

function isFirePressed() {
    return isPressed(BTN.CROSS) || isPressed(BTN.CIRCLE);
}

function isSpPressed() {
    return isPressed(BTN.TRIANGLE) || isPressed(BTN.R1);
}

function isStartPressed() {
    return isPressed(BTN.START);
}

function isSelectPressed() {
    return isPressed(BTN.SELECT);
}

function isConfirmPressed() {
    return isPressed(BTN.CROSS) || isPressed(BTN.START);
}

function isBackPressed() {
    return isPressed(BTN.CIRCLE) || isPressed(BTN.TRIANGLE);
}

function isYesPressed() {
    return isPressed(BTN.CROSS);
}

function isNoPressed() {
    return isPressed(BTN.CIRCLE);
}
