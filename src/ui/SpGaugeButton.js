import { BaseCast } from "../game-objects/BaseCast.js";

export class SpGaugeButton extends BaseCast {
    constructor() {
        super();

        this.hudSpbtnBg1 = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtnBg1.gif"));
        this.hudSpbtnBg1.x = 32;
        this.hudSpbtnBg1.y = 32;
        this.hudSpbtnBg1.alpha = 0;
        this.hudSpbtnBg1.anchor.set(0.5);

        this.hudSpbtnBg0 = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtnBg0.gif"));
        this.hudSpbtnBg0.x = -18;
        this.hudSpbtnBg0.y = -18;
        this.hudSpbtnBg0.alpha = 0;

        this.spGageBarBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtn100per.gif"));

        this.spGageBarMask = new PIXI.Graphics();
        this.spGageBarMask.drawRect(0, 0, 50, -50);
        this.spGageBarMask.x = 8;
        this.spGageBarMask.y = 58;
        this.spGageBarMask.scale.y = 0;

        this.spGageBar = new PIXI.Sprite(PIXI.Texture.fromFrame("hudCabtn0per.gif"));
        this.spGageBar.mask = this.spGageBarMask;

        this.overCircle = new PIXI.Graphics();
        this.overCircle.beginFill(0xFFFFFF);
        this.overCircle.drawCircle(33, 33, 28);
        this.overCircle.endFill();
        this.overCircle.alpha = 0;

        this.okFlg = false;
        this.isClear = false;

        this.timeline = new TimelineMax({
            repeat: -1,
            yoyo: this,
        });
        this.timeline.to(this.hudSpbtnBg1, 0.4, {
            alpha: 1,
        });
        this.timeline.to(this.hudSpbtnBg1, 0.4, {
            alpha: 0,
        });
        this.timeline.pause();

        this.hitArea = new PIXI.Rectangle(5, 5, this.spGageBarBg.width - 10, this.spGageBarBg.height - 12);

        this._onOver = this.onOver.bind(this);
        this._onDown = this.onDown.bind(this);
    }

    onOver() {
        TweenMax.to(this.overCircle, 0.1, {
            alpha: 0.65,
        });
        TweenMax.to(this.overCircle, 0.3, {
            delay: 0.1,
            alpha: 0,
        });
    }

    onDown() {
        const x = this.x;
        const y = this.y;

        TweenMax.to(this, 0.001, { delay: 0, x, y: y - 1 });
        TweenMax.to(this, 0.001, { delay: 0.05, x: x - 1, y: y + 1 });
        TweenMax.to(this, 0.001, { delay: 0.1, x: x + 1, y: y - 1 });
        TweenMax.to(this, 0.001, { delay: 0.15, x, y });
    }

    setPercent(percent) {
        this.spGageBarMask.scale.y = percent;

        if (percent >= 1) {
            if (!this.okFlg) {
                this.onPrepareOk();
            }
            this.okFlg = true;
        }
    }

    onPrepareOk() {
        this.hudSpbtnBg0.alpha = 1;
        this.hudSpbtnBg1.alpha = 1;
        this.hudSpbtnBg1.scale.set(1.4);

        TweenMax.to(this.hudSpbtnBg1.scale, 0.5, {
            x: 1,
            y: 1,
        });

        this.timeline.resume();
        if (!this.isClear) {
            this.onActive();
        }
    }

    spFire() {
        this.onDeactive();
        this.okFlg = false;
        this.timeline.pause();
        this.hudSpbtnBg1.alpha = 0;
        this.hudSpbtnBg0.alpha = 0;
    }

    onActive() {
        this.interactive = true;
        this.buttonMode = true;
        this.on("pointerover", this._onOver);
        this.on("pointerdown", this._onDown);
    }

    onDeactive() {
        this.interactive = false;
        this.buttonMode = false;
        this.off("pointerover", this._onOver);
        this.off("pointerdown", this._onDown);
    }

    castAdded() {
        this.addChild(this.hudSpbtnBg1);
        this.addChild(this.hudSpbtnBg0);
        this.addChild(this.spGageBarBg);
        this.addChild(this.spGageBarMask);
        this.addChild(this.spGageBar);
        this.addChild(this.overCircle);
    }

    castRemoved() {
        this.onDeactive();

        this.removeChild(this.hudSpbtnBg1);
        this.removeChild(this.hudSpbtnBg0);
        this.removeChild(this.spGageBarBg);
        this.removeChild(this.spGageBarMask);
        this.removeChild(this.spGageBar);
        this.removeChild(this.overCircle);

        if (this.timeline) {
            this.timeline.pause();
        }
    }
}

export default SpGaugeButton;
