import { GAME_DIMENSIONS } from "../../constants.js";
import { triggerHaptic } from "../../haptics.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GCY = GAME_DIMENSIONS.CENTER_Y;

export class PhaserSpGaugeButton {
    constructor(scene, onFire) {
        this.scene = scene;
        this.onFire = onFire;
        this.readyHapticPlayed = false;
        this.readyTween = null;

        this.wrap = scene.add.container(GW - 70, GCY + 15);
        this.wrap.setDepth(103);

        this.pulse = scene.add.sprite(32, 32, "game_ui", "hudCabtnBg1.gif");
        this.pulse.setOrigin(0.5);
        this.pulse.setAlpha(0);

        this.readyBg = scene.add.sprite(-18, -18, "game_ui", "hudCabtnBg0.gif");
        this.readyBg.setOrigin(0, 0);
        this.readyBg.setAlpha(0);

        this.barBg = scene.add.sprite(0, 0, "game_ui", "hudCabtn100per.gif");
        this.barBg.setOrigin(0, 0);

        this.bar = scene.add.sprite(0, 0, "game_ui", "hudCabtn0per.gif");
        this.bar.setOrigin(0, 0);

        this.wrap.add([this.pulse, this.readyBg, this.barBg, this.bar]);
        this.wrap.setSize(this.barBg.width, this.barBg.height);
        this.barBg.setInteractive(
            new Phaser.Geom.Circle(
                this.barBg.width / 2,
                this.barBg.height / 2,
                Math.min(this.barBg.width, this.barBg.height) / 2 - 5
            ),
            Phaser.Geom.Circle.Contains
        );
        this.barBg.on("pointerover", function () {
            if (scene.game && scene.game.canvas) {
                scene.game.canvas.style.cursor = "pointer";
            }
        }, scene);
        this.barBg.on("pointerout", function () {
            if (scene.game && scene.game.canvas) {
                scene.game.canvas.style.cursor = "default";
            }
        }, scene);

        var self = this;
        this.barBg.on("pointerup", function () {
            if (self.onFire) self.onFire();
        });
    }

    update(ratio) {
        if (ratio <= 0) {
            this.bar.setCrop(0, 0, 0, 0);
        } else {
            var cropY = Math.round(8 * ratio);
            var cropH = Math.round(50 * ratio);
            this.bar.setCrop(8, cropY, 51, cropH);
        }

        if (ratio >= 1) {
            this.readyBg.setAlpha(1);
            if (!this.readyHapticPlayed) {
                triggerHaptic("ready");
                this.readyHapticPlayed = true;
            }
            if (!this.readyTween) {
                this.readyTween = this.scene.tweens.add({
                    targets: this.pulse,
                    alpha: 1,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                });
            }
        } else {
            this.readyHapticPlayed = false;
            this.readyBg.setAlpha(0);
            this.pulse.setAlpha(0);
            if (this.readyTween) {
                this.readyTween.stop();
                this.readyTween = null;
            }
        }
    }
}
