// src/phaser/GamepadInput.js
// Gamepad support — polls all connected gamepads each frame.
// Face buttons (A/B/X/Y) and shoulder buttons (L1/R1/L2/R2) → "sp" (SPACE equivalent)
// Start button → "enter" (ENTER equivalent)
// D-pad and left stick → directional input

// Standard gamepad button indices (W3C Gamepad API)
var FACE_BOTTOM  = 0;  // A / Cross
var FACE_RIGHT   = 1;  // B / Circle
var FACE_LEFT    = 2;  // X / Square
var FACE_TOP     = 3;  // Y / Triangle
var SHOULDER_L1  = 4;  // LB / L1
var SHOULDER_R1  = 5;  // RB / R1
var SHOULDER_L2  = 6;  // LT / L2
var SHOULDER_R2  = 7;  // RT / R2
var BTN_SELECT   = 8;  // Select / Back
var BTN_START    = 9;  // Start / Options
var BTN_R3       = 11; // Right stick click

var SP_BUTTONS = [FACE_BOTTOM, FACE_RIGHT, FACE_LEFT, FACE_TOP, SHOULDER_L1, SHOULDER_R1, SHOULDER_L2, SHOULDER_R2];
var ENTER_BUTTONS = [BTN_START];

// D-pad indices
var DPAD_UP    = 12;
var DPAD_DOWN  = 13;
var DPAD_LEFT  = 14;
var DPAD_RIGHT = 15;

var STICK_THRESHOLD = 0.5;

/**
 * Gamepad state tracker — call pollGamepads() once per frame,
 * then use justPressed/isDown helpers to read input.
 */
var _prevButtons = {};  // gamepadIndex -> { buttonIndex -> wasPressed }
var _gamepadConnected = false;

// Chromium/Electron requires a gamepadconnected event before getGamepads()
// returns non-null entries. Listen early so the API activates on first connect.
try {
    window.addEventListener("gamepadconnected", function (e) {
        _gamepadConnected = true;
        console.log("Gamepad connected: " + e.gamepad.id + " (index " + e.gamepad.index + ")");
    });
    window.addEventListener("gamepaddisconnected", function (e) {
        delete _prevButtons[e.gamepad.index];
        console.log("Gamepad disconnected: " + e.gamepad.id);
    });
} catch (e) {}

function getGamepads() {
    if (!navigator.getGamepads) return [];
    try {
        var raw = navigator.getGamepads();
        if (!raw) return [];
        var pads = [];
        for (var i = 0; i < raw.length; i++) {
            if (raw[i]) pads.push(raw[i]);
        }
        return pads;
    } catch (e) {
        return [];
    }
}

function isButtonPressed(btn) {
    if (!btn) return false;
    return typeof btn === "object" ? btn.pressed : btn > 0.5;
}

/**
 * Call once per frame. Returns a snapshot of gamepad state with
 * justPressed detection (edge-triggered) for all connected gamepads.
 */
export function pollGamepads() {
    var pads = getGamepads();
    var result = {
        sp: false,         // any face/shoulder button just pressed
        enter: false,      // start button just pressed
        editor: false,     // R3 just pressed (or SELECT on controllers with fewer buttons)
        spDown: false,     // any face/shoulder button held
        enterDown: false,  // start button held
        left: false,
        right: false,
        up: false,
        down: false,
    };

    for (var p = 0; p < pads.length; p++) {
        var gp = pads[p];
        if (!gp || !gp.buttons) continue;

        var idx = gp.index;
        if (!_prevButtons[idx]) _prevButtons[idx] = {};

        // Check SP buttons (face + shoulder)
        for (var i = 0; i < SP_BUTTONS.length; i++) {
            var bi = SP_BUTTONS[i];
            var pressed = isButtonPressed(gp.buttons[bi]);
            var wasPressed = !!_prevButtons[idx][bi];
            if (pressed && !wasPressed) result.sp = true;
            if (pressed) result.spDown = true;
            _prevButtons[idx][bi] = pressed;
        }

        // Check ENTER buttons (start)
        for (var i = 0; i < ENTER_BUTTONS.length; i++) {
            var bi = ENTER_BUTTONS[i];
            var pressed = isButtonPressed(gp.buttons[bi]);
            var wasPressed = !!_prevButtons[idx][bi];
            if (pressed && !wasPressed) result.enter = true;
            if (pressed) result.enterDown = true;
            _prevButtons[idx][bi] = pressed;
        }

        // Editor button: R3 if available, otherwise SELECT for controllers
        // with fewer buttons (e.g. NES-style controllers)
        var editorBtn = (gp.buttons.length > BTN_R3) ? BTN_R3 : BTN_SELECT;
        if (editorBtn < gp.buttons.length) {
            var editorPressed = isButtonPressed(gp.buttons[editorBtn]);
            var editorWas = !!_prevButtons[idx]["_editor_" + editorBtn];
            if (editorPressed && !editorWas) result.editor = true;
            _prevButtons[idx]["_editor_" + editorBtn] = editorPressed;
        }

        // D-pad
        if (isButtonPressed(gp.buttons[DPAD_LEFT])) result.left = true;
        if (isButtonPressed(gp.buttons[DPAD_RIGHT])) result.right = true;
        if (isButtonPressed(gp.buttons[DPAD_UP])) result.up = true;
        if (isButtonPressed(gp.buttons[DPAD_DOWN])) result.down = true;

        // Left stick
        if (gp.axes && gp.axes.length >= 2) {
            if (gp.axes[0] < -STICK_THRESHOLD) result.left = true;
            if (gp.axes[0] > STICK_THRESHOLD) result.right = true;
            if (gp.axes[1] < -STICK_THRESHOLD) result.up = true;
            if (gp.axes[1] > STICK_THRESHOLD) result.down = true;
        }
    }

    return result;
}
