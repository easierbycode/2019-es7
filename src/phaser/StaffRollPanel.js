// src/phaser/StaffRollPanel.js
import { GAME_DIMENSIONS } from "../constants.js";

export class StaffRollPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this.scene = scene;
        this.GW = GAME_DIMENSIONS.WIDTH;
        this.GH = GAME_DIMENSIONS.HEIGHT;
        this.GCX = GAME_DIMENSIONS.CENTER_X;

        this.bg = scene.add.rectangle(this.GCX, this.GH / 2, this.GW, this.GH, 0x000000, 0.9);
        this.add(this.bg);

        this.wakingG = scene.add.sprite(this.GCX, 55, "game_ui", "staffrollG0");
        this.wakingG.setOrigin(0.5);

        scene.anims.create({
            key: "staffroll_waking",
            frames: scene.anims.generateFrameNames("game_ui", {
                prefix: "staffrollG",
                start: 0,
                end: 7,
                suffix: ""
            }),
            frameRate: 8,
            repeat: -1
        });

        this.wakingG.play("staffroll_waking");
        this.add(this.wakingG);

        this.namePanel = scene.add.sprite(15, 90, "game_ui", "staffrollName");
        this.namePanel.setOrigin(0, 0);
        this.add(this.namePanel);

        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.GW, this.GH), Phaser.Geom.Rectangle.Contains);
        this.on("pointerup", () => this.close());

        scene.add.existing(this);
        this.showWithAnimation();
    }

    showWithAnimation() {
        this.bg.setAlpha(0);
        this.wakingG.setY(-100);
        this.namePanel.setScale(0.2).setAlpha(0);

        this.scene.tweens.add({
            targets: this.bg,
            alpha: 0.9,
            duration: 300,
            ease: "Quint.easeOut"
        });

        this.scene.tweens.add({
            targets: this.wakingG,
            y: 55,
            duration: 600,
            ease: "Back.easeOut"
        });

        this.scene.tweens.add({
            targets: this.namePanel,
            scale: 1,
            alpha: 1,
            duration: 800,
            ease: "Elastic.easeOut",
            delay: 200
        });
    }

    close() {
        this.scene.tweens.add({
            targets: [this.bg, this.wakingG, this.namePanel],
            alpha: 0,
            duration: 400,
            onComplete: () => this.destroy()
        });
    }
}

export default StaffRollPanel;