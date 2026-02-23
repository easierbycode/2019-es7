import { BaseCast } from "../game-objects/BaseCast.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { StaffrollCloseButton } from "./StaffrollCloseButton.js";
import { ExternalLinkButton } from "./ExternalLinkButton.js";

export class StaffrollPanel extends BaseCast {
    constructor() {
        super();

        this.interactive = true;

        this.bg = new PIXI.Graphics();
        this.bg.beginFill(0x000000, 0.9);
        this.bg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.bg.endFill();
        this.addChild(this.bg);

        this.panelBg = new PIXI.Graphics();
        this.panelBg.beginFill(0x464646, 0.8);
        this.panelBg.drawRoundedRect(12, 72, GAME_DIMENSIONS.WIDTH - 24, GAME_DIMENSIONS.HEIGHT - 120, 8);
        this.panelBg.endFill();
        this.addChild(this.panelBg);

        this.panel = new PIXI.Sprite(PIXI.Texture.fromFrame("staffrollName.gif"));
        this.panel.x = 15;
        this.panel.y = 90;
        this.addChild(this.panel);

        this.closeBtn = new StaffrollCloseButton();
        this.closeBtn.x = GAME_DIMENSIONS.WIDTH - this.closeBtn.width / 2 - 12;
        this.closeBtn.y = 102;
        this.addChild(this.closeBtn);
        this._onCloseUp = this.close.bind(this);
        this.closeBtn.on("pointerup", this._onCloseUp);

        this.addLinkButton("staffrollTwitterBtn.gif", 165, 118, "https://twitter.com/takaNakayama");
        this.addLinkButton("staffrollTwitterBtn.gif", 131, 276, "https://twitter.com/bengasu");
        this.addLinkButton("staffrollTwitterBtn.gif", 178, 304, "https://twitter.com/rereibara");
        this.addLinkButton("staffrollLinkBtn.gif", 153, 329, "https://magazine.jp.square-enix.com/biggangan/introduction/highscoregirl/");
        this.addLinkButton("staffrollLinkBtn.gif", 161, 355, "http://hi-score-girl.com/");

        this.tl = null;
    }

    addLinkButton(frameName, x, y, url) {
        const button = new ExternalLinkButton(frameName, url);
        button.x = x;
        button.y = y;
        this.panel.addChild(button);
    }

    open() {
        if (this.tl) {
            this.tl.kill();
        }

        this.bg.alpha = 0;
        this.panelBg.scale.y = 0;
        this.panel.y = this.panelBg.y + this.panel.height;
        this.closeBtn.alpha = 0;
        this.closeBtn.rotation = Math.PI * 2;
        this.closeBtn.scale.set(2, 2);

        this.tl = new TimelineMax();
        this.tl.to(this.bg, 0.2, { alpha: 1 });
        this.tl.to(this.panelBg.scale, 1.0, {
            y: 1,
            ease: Elastic.easeOut,
        }, "-=0.05");
        this.tl.to(this.panel, 1.0, {
            y: 90,
            ease: Quint.easeOut,
        }, "-=0.8");
        this.tl.to(this.closeBtn, 0.6, {
            rotation: 0,
            alpha: 1,
        }, "-=0.5");
        this.tl.to(this.closeBtn.scale, 0.6, {
            x: 1,
            y: 1,
        }, "-=0.6");
    }

    close() {
        if (this.tl) {
            this.tl.kill();
        }

        this.tl = new TimelineMax({
            onComplete: () => {
                if (this.parent) {
                    this.parent.removeChild(this);
                }
            },
        });

        this.tl.to(this.panel, 0.4, {
            y: this.panelBg.y + this.panel.height,
            ease: Quint.easeIn,
        });
        this.tl.to(this.panelBg.scale, 0.5, {
            y: 0,
            ease: Quint.easeOut,
        }, "-=0.15");
        this.tl.to(this.bg, 0.2, {
            alpha: 0,
        }, "-=0.2");
    }

    castRemoved() {
        if (this.closeBtn) {
            this.closeBtn.off("pointerup", this._onCloseUp);
        }

        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }
    }
}

export default StaffrollPanel;
