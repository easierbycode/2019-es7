import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCY = GAME_DIMENSIONS.CENTER_Y;

export function showCutin(scene, onComplete) {
    var cutinBg = scene.add.graphics();
    cutinBg.setDepth(160);
    cutinBg.fillStyle(0x000000, 0.9);
    cutinBg.fillRect(0, 0, GW, GH);
    cutinBg.setAlpha(0);

    var cutinSprite = scene.add.sprite(0, GCY - 71, "game_asset", "cutin0.gif");
    cutinSprite.setOrigin(0, 0);
    cutinSprite.setDepth(161);
    cutinSprite.setAlpha(0);

    var cutinFlash = scene.add.graphics();
    cutinFlash.setDepth(162);
    cutinFlash.fillStyle(0xeeeeee, 1);
    cutinFlash.fillRect(0, 0, GW, GH);
    cutinFlash.setAlpha(0);

    scene.tweens.add({ targets: cutinBg, alpha: 1, duration: 250 });

    var cutinFrames = [
        { frame: "cutin0.gif", delay: 0 },
        { frame: "cutin1.gif", delay: 80 },
        { frame: "cutin2.gif", delay: 160 },
        { frame: "cutin3.gif", delay: 240 },
        { frame: "cutin4.gif", delay: 320 },
        { frame: "cutin5.gif", delay: 400 },
        { frame: "cutin6.gif", delay: 700 },
        { frame: "cutin7.gif", delay: 800 },
        { frame: "cutin8.gif", delay: 900 },
    ];

    scene.time.delayedCall(250, function () {
        cutinSprite.setAlpha(1);
        for (var cf = 0; cf < cutinFrames.length; cf++) {
            (function (f) {
                scene.time.delayedCall(f.delay, function () {
                    if (cutinSprite.active) {
                        cutinSprite.setFrame(f.frame);
                    }
                });
            })(cutinFrames[cf]);
        }
    });

    scene.time.delayedCall(550, function () {
        cutinFlash.setAlpha(1);
        scene.tweens.add({
            targets: cutinFlash,
            alpha: 0,
            duration: 300,
        });
    });

    scene.time.delayedCall(1700, function () {
        scene.tweens.add({
            targets: [cutinBg, cutinSprite],
            alpha: 0,
            duration: 200,
            onComplete: function () {
                cutinBg.destroy();
                cutinSprite.destroy();
                cutinFlash.destroy();
                if (onComplete) onComplete();
            },
        });
    });
}
