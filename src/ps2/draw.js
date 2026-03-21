// src/ps2/draw.js — Drawing helpers for PS2 AthenaEnv
// Wraps Screen/Draw2D/Image for common rendering operations

// PS2 screen: 640x448 default. Game: 256x480.
// We scale the game to fit vertically: scale = 448/480 ≈ 0.933
// Centered horizontally: offsetX = (640 - 256*scale) / 2

var SCREEN_W = 640;
var SCREEN_H = 448;
var SCALE = SCREEN_H / 480;  // 0.9333...
var OFFSET_X = Math.floor((SCREEN_W - 256 * SCALE) / 2);
var OFFSET_Y = 0;

// Convert game coordinates to screen coordinates
function toScreenX(gx) {
    return Math.floor(gx * SCALE + OFFSET_X);
}

function toScreenY(gy) {
    return Math.floor(gy * SCALE + OFFSET_Y);
}

function toScreenW(gw) {
    return Math.floor(gw * SCALE);
}

function toScreenH(gh) {
    return Math.floor(gh * SCALE);
}

// Draw a filled rectangle in game coordinates
function drawRect(gx, gy, gw, gh, color) {
    var sx = toScreenX(gx);
    var sy = toScreenY(gy);
    var sw = toScreenW(gw);
    var sh = toScreenH(gh);
    Draw.rect(sx, sy, sw, sh, color);
}

// Draw a filled rectangle (screen coords)
function drawRectScreen(sx, sy, sw, sh, color) {
    Draw.rect(sx, sy, sw, sh, color);
}

// Clear side bars (letterbox)
function drawLetterbox() {
    var barColor = Color.new(0, 0, 0);
    // Left bar
    if (OFFSET_X > 0) {
        Draw.rect(0, 0, OFFSET_X, SCREEN_H, barColor);
    }
    // Right bar
    var rightX = OFFSET_X + Math.ceil(256 * SCALE);
    if (rightX < SCREEN_W) {
        Draw.rect(rightX, 0, SCREEN_W - rightX, SCREEN_H, barColor);
    }
}

// Global font instance
var gameFont = new Font("default");

// Print text at screen coordinates (replaces Font.print(Font.default, ...))
function fontPrint(x, y, text, color) {
    if (color) {
        gameFont.color = color;
    }
    gameFont.print(x, y, text);
}

// Draw text at game coordinates using the built-in font
function drawText(gx, gy, text, color, size) {
    fontPrint(toScreenX(gx), toScreenY(gy), text, color);
}

// Set clipping to game area
function setGameClip() {
    Screen.setParam(Screen.SCISSOR_BOUNDS,
        OFFSET_X, OFFSET_Y,
        OFFSET_X + Math.ceil(256 * SCALE),
        OFFSET_Y + Math.ceil(480 * SCALE));
}

function clearGameClip() {
    Screen.setParam(Screen.SCISSOR_BOUNDS, 0, 0, SCREEN_W, SCREEN_H);
}
