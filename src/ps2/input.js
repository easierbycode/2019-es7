// src/ps2/input.js — Gamepad input for PS2 AthenaEnv
// Maps DualShock 2 buttons to game actions

var pad = null;
var padPrevBtns = {};

function initInput() {
    // No initialization needed — Pads module is ready immediately
}

function updateInput() {
    pad = Pads.get();
    if (pad) {
        pad.update();
    }
}

function isDown(btn) {
    return pad && pad.pressed(btn);
}

function isPressed(btn) {
    return pad && pad.justPressed(btn);
}

function getAnalogX() {
    if (!pad) return 0;
    return pad.lx / 128.0;
}

function getAnalogY() {
    if (!pad) return 0;
    return pad.ly / 128.0;
}

// High-level game input helpers
function isLeftHeld() {
    return isDown(Pads.LEFT) || getAnalogX() < -0.3;
}

function isRightHeld() {
    return isDown(Pads.RIGHT) || getAnalogX() > 0.3;
}

function isUpHeld() {
    return isDown(Pads.UP) || getAnalogY() < -0.3;
}

function isDownHeld() {
    return isDown(Pads.DOWN) || getAnalogY() > 0.3;
}

function isFirePressed() {
    return isPressed(Pads.CROSS) || isPressed(Pads.CIRCLE);
}

function isSpPressed() {
    return isPressed(Pads.TRIANGLE) || isPressed(Pads.R1);
}

function isStartPressed() {
    return isPressed(Pads.START);
}

function isSelectPressed() {
    return isPressed(Pads.SELECT);
}

function isConfirmPressed() {
    return isPressed(Pads.CROSS) || isPressed(Pads.START);
}

function isBackPressed() {
    return isPressed(Pads.CIRCLE) || isPressed(Pads.TRIANGLE);
}

function isYesPressed() {
    return isPressed(Pads.CROSS);
}

function isNoPressed() {
    return isPressed(Pads.CIRCLE);
}
