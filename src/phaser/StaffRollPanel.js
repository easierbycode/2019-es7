import { GAME_DIMENSIONS } from "../constants.js";

function openExternalUrl(url) {
    if (!url) {
        return;
    }

    try {
        window.open(url, "_blank");
    } catch (e) {}
}

export class StaffRollPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        this.scene = scene;
        this.GW = GAME_DIMENSIONS.WIDTH;
        this.GH = GAME_DIMENSIONS.HEIGHT;
        this.GCX = GAME_DIMENSIONS.CENTER_X;

        this.bg = scene.add.rectangle(this.GCX, this.GH / 2, this.GW, this.GH, 0x000000, 0.9);
        this.add(this.bg);

        this.panelBg = scene.add.graphics();
        this.panelBg.fillStyle(0x464646, 0.8);
        this.panelBg.fillRoundedRect(12, 72, this.GW - 24, this.GH - 120, 8);
        this.add(this.panelBg);
        this.panelBg.setScale(1, 0);

        this.wakingG = scene.add.sprite(this.GCX, 55, "game_ui", "staffrollG0.gif");
        this.wakingG.setOrigin(0.5);
        this.add(this.wakingG);

        if (!scene.anims.exists("staffroll_waking")) {
            scene.anims.create({
                key: "staffroll_waking",
                frames: scene.anims.generateFrameNames("game_ui", {
                    prefix: "staffrollG",
                    start: 0,
                    end: 7,
                    suffix: ".gif",
                }),
                frameRate: 8,
                repeat: -1,
            });
        }
        this.wakingG.play("staffroll_waking");

        this.namePanel = scene.add.sprite(15, 90, "game_ui", "staffrollName.gif");
        this.namePanel.setOrigin(0, 0);
        this.add(this.namePanel);

        this.closeBtn = scene.add.sprite(this.GW - 12, 102, "game_ui", "staffrollCloseBtn.gif");
        this.closeBtn.setOrigin(1, 0.5);
        this.closeBtn.setInteractive({ useHandCursor: true });
        this.closeBtn.on("pointerup", this.close, this);
        this.add(this.closeBtn);

        this.addLinkButton("staffrollTwitterBtn.gif", 165, 118, "https://twitter.com/takaNakayama");
        this.addLinkButton("staffrollTwitterBtn.gif", 131, 276, "https://twitter.com/bengasu");
        this.addLinkButton("staffrollTwitterBtn.gif", 178, 304, "https://twitter.com/rereibara");
        this.addLinkButton("staffrollLinkBtn.gif", 153, 329, "https://magazine.jp.square-enix.com/biggangan/introduction/highscoregirl/");
        this.addLinkButton("staffrollLinkBtn.gif", 161, 355, "http://hi-score-girl.com/");

        var thanksLabelStyle = { fontSize: "8px", fontFamily: "Arial", fill: "#ffff00", align: "center", stroke: "#000000", strokeThickness: 2 };
        var thanksNameStyle = { fontSize: "7px", fontFamily: "Arial", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 2 };
        this.thanksLabel = scene.add.text(this.GCX, 393, "SPECIAL THANKS", thanksLabelStyle);
        this.thanksLabel.setOrigin(0.5, 0);
        this.add(this.thanksLabel);
        this.thanksName = scene.add.text(this.GCX, 405, "Seamus McNamara", thanksNameStyle);
        this.thanksName.setOrigin(0.5, 0);
        this.add(this.thanksName);

        this.setSize(this.GW, this.GH);
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.GW, this.GH), Phaser.Geom.Rectangle.Contains);
        this.on("pointerup", function () {});

        scene.add.existing(this);
        this.showWithAnimation();
    }

    addLinkButton(frameName, x, y, url) {
        var button = this.scene.add.sprite(x, y, "game_ui", frameName);
        button.setOrigin(0, 0);
        button.setInteractive({ useHandCursor: true });
        button.on("pointerup", function () {
            openExternalUrl(url);
        });
        this.add(button);
    }

    showWithAnimation() {
        this.bg.setAlpha(0);
        this.wakingG.setY(-100);
        this.namePanel.setY(90 + this.namePanel.height);
        this.closeBtn.setAlpha(0);
        this.closeBtn.setRotation(Math.PI * 2);
        this.closeBtn.setScale(2);

        this.scene.tweens.add({
            targets: this.bg,
            alpha: 0.9,
            duration: 200,
        });

        this.scene.tweens.add({
            targets: this.panelBg,
            scaleY: 1,
            duration: 1000,
            ease: "Elastic.easeOut",
        });

        this.scene.tweens.add({
            targets: this.wakingG,
            y: 55,
            duration: 600,
            ease: "Back.easeOut",
        });

        this.scene.tweens.add({
            targets: this.namePanel,
            y: 90,
            duration: 1000,
            ease: "Quint.easeOut",
            delay: 200,
        });

        this.scene.tweens.add({
            targets: this.closeBtn,
            alpha: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            delay: 500,
        });
    }

    close() {
        this.scene.tweens.add({
            targets: this.namePanel,
            y: 90 + this.namePanel.height,
            duration: 400,
            ease: "Quint.easeIn",
        });
        this.scene.tweens.add({
            targets: this.panelBg,
            scaleY: 0,
            duration: 500,
            ease: "Quint.easeOut",
            delay: 200,
        });
        this.scene.tweens.add({
            targets: this.bg,
            alpha: 0,
            duration: 200,
            delay: 300,
            onComplete: () => this.destroy(),
        });
    }
}

export default StaffRollPanel;
