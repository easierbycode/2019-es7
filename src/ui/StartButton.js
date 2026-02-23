import { BaseCast } from "../game-objects/BaseCast.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { play } from "../soundManager.js";

export class StartButton extends BaseCast {
    constructor() {
        super();

        this.hitArea = new PIXI.Rectangle(0, 50, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT - 170);

        this.img = new PIXI.Sprite(PIXI.Texture.fromFrame("titleStartText.gif"));
        this.img.anchor.set(0.5);
        this.img.position.set(GAME_DIMENSIONS.CENTER_X, 330);
        this.addChild(this.img);

        this.flashCover = new PIXI.Graphics();
        this.flashCover.beginFill(0xFFFFFF, 1);
        this.flashCover.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT - 120);
        this.flashCover.endFill();
        this.flashCover.alpha = 0;
        this.addChild(this.flashCover);

        this.interactive = true;
        this.buttonMode = true;
        this.tl = null;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        this.img.scale.set(1.05);
    }

    onOut() {
        this.img.scale.set(1.0);
    }

    onDown() {}

    onUp() {
        TweenMax.killTweensOf(this.flashCover);
        play("se_decision");
        this.flash();
    }

    flash() {
        this.flashCover.alpha = 0.3;
        TweenMax.to(this.flashCover, 1.5, {
            alpha: 0,
        });
    }

    startFlashingAnimation() {
        if (this.tl) {
            this.tl.kill();
        }

        this.tl = new TimelineMax({
            repeat: -1,
            yoyo: true,
        });
        this.tl.to(this.img, 0.3, {
            delay: 0.1,
            alpha: 0,
        }).to(this.img, 0.8, {
            alpha: 1,
        });
    }

    stopFlashingAnimation() {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }
        this.img.alpha = 1;
    }

    castAdded() {
        this.on("pointerover", this._onOver);
        this.on("pointerout", this._onOut);
        this.on("pointerdown", this._onDown);
        this.on("pointerupoutside", this._onOut);
        this.on("pointerup", this._onUp);
        this.startFlashingAnimation();
    }

    castRemoved() {
        this.stopFlashingAnimation();
        this.off("pointerover", this._onOver);
        this.off("pointerout", this._onOut);
        this.off("pointerdown", this._onDown);
        this.off("pointerupoutside", this._onOut);
        this.off("pointerup", this._onUp);
    }

    destroy(options) {
        this.stopFlashingAnimation();
        super.destroy(options);
    }
}

export default StartButton;
