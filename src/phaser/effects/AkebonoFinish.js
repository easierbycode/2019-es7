import { GAME_DIMENSIONS } from "../../constants.js";

var GCX = GAME_DIMENSIONS.CENTER_X;
var GCY = GAME_DIMENSIONS.CENTER_Y;

export function showAkebonoFinish(scene) {
    if (!scene.anims.exists("akebono_bg_anim")) {
        scene.anims.create({
            key: "akebono_bg_anim",
            frames: scene.anims.generateFrameNames("game_ui", {
                prefix: "akebonoBg",
                start: 0,
                end: 2,
                suffix: ".gif",
            }),
            frameRate: 17,
            repeat: -1,
        });
    }

    var akebonoBg = scene.add.sprite(0, 0, "game_ui", "akebonoBg0.gif");
    akebonoBg.setOrigin(0, 0);
    akebonoBg.setDepth(5);
    akebonoBg.play("akebono_bg_anim");
    scene.akebonoBgSprite = akebonoBg;

    var koK = scene.add.sprite(GCX - 41, GCY, "game_ui", "knockoutK.gif");
    koK.setOrigin(0.5);
    koK.setDepth(200);
    koK.setScale(0);

    var koO = scene.add.sprite(GCX + 41, GCY, "game_ui", "knockoutO.gif");
    koO.setOrigin(0.5);
    koO.setDepth(200);
    koO.setScale(0);

    scene.tweens.add({
        targets: koK,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: "Back.easeOut",
    });
    scene.tweens.add({
        targets: koO,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        delay: 150,
        ease: "Back.easeOut",
    });

    scene.playSound("voice_ko", 0.7);
}
