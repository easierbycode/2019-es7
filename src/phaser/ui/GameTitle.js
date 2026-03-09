import { GAME_DIMENSIONS } from "../../constants.js";
import { gameState } from "../../gameState.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;
var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

export function showGameTitle(scene, onComplete) {
    var stageId = gameState.stageId || 0;

    var bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRect(0, 0, GW, GH);
    bg.setDepth(200);
    bg.setAlpha(0);

    var stageNumIdx = Math.min(stageId + 1, 4);
    var stageNumSprite = scene.add.image(0, GCY - 20, "game_ui", "stageNum" + String(stageNumIdx) + ".gif");
    stageNumSprite.setOrigin(0, 0);
    stageNumSprite.setDepth(201);
    stageNumSprite.setAlpha(0);

    var fightSprite = scene.add.image(GCX, GCY + 12, "game_ui", "stageFight.gif");
    fightSprite.setOrigin(0.5);
    fightSprite.setDepth(201);
    fightSprite.setAlpha(0);
    fightSprite.setScale(1.2);

    scene.tweens.add({ targets: bg, alpha: 1, duration: 300 });

    scene.time.delayedCall(300, function () {
        scene.playSound("voice_round" + String(Math.min(stageId, 3)), 0.7);
        scene.tweens.add({ targets: stageNumSprite, alpha: 1, duration: 300 });
    });

    scene.time.delayedCall(1600, function () {
        scene.tweens.add({ targets: stageNumSprite, alpha: 0, duration: 100 });
        scene.tweens.add({ targets: fightSprite, alpha: 1, duration: 200 });
        scene.tweens.add({ targets: fightSprite, scaleX: 1, scaleY: 1, duration: 200 });
    });

    scene.time.delayedCall(1800, function () {
        scene.playSound("voice_fight", 0.7);
    });

    scene.time.delayedCall(2200, function () {
        scene.tweens.add({ targets: fightSprite, scaleX: 1.5, scaleY: 1.5, duration: 200 });
        scene.tweens.add({ targets: fightSprite, alpha: 0, duration: 200 });
    });

    scene.time.delayedCall(2300, function () {
        scene.tweens.add({
            targets: bg,
            alpha: 0,
            duration: 200,
            onComplete: function () {
                bg.destroy();
                stageNumSprite.destroy();
                fightSprite.destroy();
                if (onComplete) onComplete();
            },
        });
    });
}
