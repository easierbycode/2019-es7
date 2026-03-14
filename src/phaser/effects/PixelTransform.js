// src/phaser/effects/PixelTransform.js
// Pixel implosion/explosion effect for boss transformation.
// Ported from boss-viewer.html assemblePixels/explodePixels.

import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

/**
 * Explodes a sprite into pixels that scatter outward.
 * Used for the "flirty girl → ugly sister" boss death transition.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} sprite - sprite to explode (will be hidden)
 * @param {Function} onDone - callback when explosion completes
 */
export function explodeToPixels(scene, sprite, onDone) {
    if (!sprite || !sprite.active) {
        if (onDone) onDone();
        return;
    }

    var frameKey = sprite.frame ? sprite.frame.name : null;
    if (!frameKey) {
        if (onDone) onDone();
        return;
    }

    var frame = scene.textures.getFrame("game_asset", frameKey);
    if (!frame) {
        if (onDone) onDone();
        return;
    }

    // Draw frame to temp canvas to read pixel data
    var canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(
        frame.source.image,
        frame.cutX, frame.cutY, frame.width, frame.height,
        0, 0, frame.width, frame.height
    );
    var imageData = ctx.getImageData(0, 0, frame.width, frame.height);

    // Hide original sprite
    sprite.setVisible(false);

    var SAMPLE = 3;
    var MAX = 1200;
    var count = 0;
    var done = 0;
    var scale = 2;
    var resolved = false;

    var container = scene.add.container(sprite.x, sprite.y).setDepth(200);
    var particles = [];

    for (var y = 0; y < frame.height; y += SAMPLE) {
        for (var x = 0; x < frame.width; x += SAMPLE) {
            if (count >= MAX) break;
            var i = (y * frame.width + x) * 4;
            var a = imageData.data[i + 3];
            if (a > 127) {
                var offX = (x - frame.width / 2) * scale;
                var offY = (y - frame.height / 2) * scale;
                var color = Phaser.Display.Color.GetColor(
                    imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]
                );
                var rect = scene.add.rectangle(offX, offY, SAMPLE, SAMPLE, color);
                rect.setAlpha(1);
                container.add(rect);
                particles.push({ img: rect, fx: offX, fy: offY });
                count++;
            }
        }
        if (count >= MAX) break;
    }

    if (count === 0) {
        container.destroy();
        if (onDone) onDone();
        return;
    }

    function finish() {
        if (resolved) return;
        resolved = true;
        // Clean up particles
        for (var p = 0; p < particles.length; p++) {
            if (particles[p].img && particles[p].img.active) {
                particles[p].img.destroy();
            }
        }
        container.destroy();
        if (onDone) onDone();
    }

    // Explode outward from current positions
    for (var p = 0; p < particles.length; p++) {
        (function (part) {
            var angle = Math.random() * Math.PI * 2;
            var dist = GW / 2 + Math.random() * 200;
            scene.tweens.add({
                targets: part.img,
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                alpha: 0,
                duration: 600 + Math.random() * 400,
                delay: Math.random() * 150,
                ease: "Cubic.easeIn",
                onComplete: function () {
                    if (part.img && part.img.active) part.img.destroy();
                    done++;
                    if (done >= count) finish();
                },
            });
        })(particles[p]);
    }

    // Fallback timeout
    setTimeout(finish, 2000);
}

/**
 * Assembles a new sprite from scattered pixels that implode into form.
 * Used for the "ugly sister" reveal after flirty girl explosion.
 *
 * @param {Phaser.Scene} scene
 * @param {string} frameKey - atlas frame to assemble
 * @param {number} targetX - center X position
 * @param {number} targetY - center Y position
 * @param {Function} onDone - callback when assembly completes
 */
export function assembleFromPixels(scene, frameKey, targetX, targetY, onDone) {
    var frame = scene.textures.getFrame("game_asset", frameKey);
    if (!frame) {
        if (onDone) onDone();
        return;
    }

    var canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(
        frame.source.image,
        frame.cutX, frame.cutY, frame.width, frame.height,
        0, 0, frame.width, frame.height
    );
    var imageData = ctx.getImageData(0, 0, frame.width, frame.height);

    var SAMPLE = 3;
    var MAX = 1200;
    var count = 0;
    var done = 0;
    var scale = 2;
    var resolved = false;

    var container = scene.add.container(targetX, targetY).setDepth(200);
    var particles = [];

    for (var y = 0; y < frame.height; y += SAMPLE) {
        for (var x = 0; x < frame.width; x += SAMPLE) {
            if (count >= MAX) break;
            var i = (y * frame.width + x) * 4;
            var a = imageData.data[i + 3];
            if (a > 127) {
                var offX = (x - frame.width / 2) * scale;
                var offY = (y - frame.height / 2) * scale;
                // Start from random scattered positions
                var startX = Phaser.Math.Between(-GW / 2, GW / 2);
                var startY = Phaser.Math.Between(-GH / 2, GH / 2);
                var color = Phaser.Display.Color.GetColor(
                    imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]
                );
                var rect = scene.add.rectangle(startX, startY, SAMPLE, SAMPLE, color);
                rect.setAlpha(0);
                container.add(rect);
                particles.push({ img: rect, fx: offX, fy: offY });
                count++;
            }
        }
        if (count >= MAX) break;
    }

    if (count === 0) {
        container.destroy();
        if (onDone) onDone();
        return;
    }

    function finish() {
        if (resolved) return;
        resolved = true;
        // Clean up particles
        for (var p = 0; p < particles.length; p++) {
            if (particles[p].img && particles[p].img.active) {
                particles[p].img.destroy();
            }
        }
        container.destroy();
        if (onDone) onDone();
    }

    // Implode from random positions to form the character
    for (var p = 0; p < particles.length; p++) {
        (function (part) {
            var delay = Math.random() * 300;
            scene.tweens.add({
                targets: part.img,
                x: part.fx,
                y: part.fy,
                alpha: 1,
                duration: 600 + Math.random() * 300,
                delay: delay,
                ease: "Cubic.easeOut",
                onComplete: function () {
                    done++;
                    if (done >= count) finish();
                },
            });
        })(particles[p]);
    }

    // Fallback timeout
    setTimeout(finish, 2000);
}
