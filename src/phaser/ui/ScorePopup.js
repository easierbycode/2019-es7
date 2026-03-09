// src/phaser/ui/ScorePopup.js
// PIXI zo class: sprite-based score popup showing "{score} x {ratio}"
// using smallNum0-9.gif digits + smallNumKakeru.gif (x symbol)

/**
 * Shows a bitmap score popup that floats up and fades out.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} score  - the base score value
 * @param {number} ratio  - the combo multiplier
 */
export function showScorePopup(scene, x, y, score, ratio) {
    var container = scene.add.container(0, 0);
    container.setDepth(110);
    var scoreStr = String(Math.floor(score));
    var cx = 0;
    for (var i = 0; i < scoreStr.length; i++) {
        var sp = scene.add.image(cx, 0, "game_ui", "smallNum" + scoreStr[i] + ".gif");
        sp.setOrigin(0, 0);
        container.add(sp);
        cx = i * (sp.width - 2) + sp.width;
    }
    // Use last digit's x for proper spacing (matches PIXI: r = h * (u.width - 2))
    cx = (scoreStr.length - 1) * (8 - 2) + 8;
    var kakeru = scene.add.image(cx, 0, "game_ui", "smallNumKakeru.gif");
    kakeru.setOrigin(0, 0);
    container.add(kakeru);
    var ratioStr = String(Math.max(1, Math.floor(ratio)));
    var rx = kakeru.x + kakeru.width + 1;
    for (var j = 0; j < ratioStr.length; j++) {
        var rsp = scene.add.image(rx + j * (8 - 1), 0, "game_ui", "smallNum" + ratioStr[j] + ".gif");
        rsp.setOrigin(0, 0);
        container.add(rsp);
    }
    // Center container on enemy position (matches PIXI: x = unit.x + width/2 - e.width/2)
    var bounds = container.getBounds();
    container.x = Math.floor(x - bounds.width / 2);
    container.y = Math.floor(y - bounds.height);
    scene.tweens.add({
        targets: container,
        y: container.y - 20,
        duration: 800,
        onComplete: function () { container.destroy(); },
    });
}
