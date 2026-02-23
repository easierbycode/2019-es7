import { BaseSpriteCast } from "../game-objects/BaseSpriteCast.js";
import { play } from "../soundManager.js";

export class StaffrollCloseButton extends BaseSpriteCast {
    constructor() {
        super(PIXI.Texture.fromFrame("staffrollCloseBtn.gif"));

        this.anchor.set(0.5);
        this.interactive = true;
        this.buttonMode = true;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        play("se_over");
        TweenMax.to(this, 0.3, {
            rotation: Math.PI * 2,
        });
    }

    onOut() {
        TweenMax.to(this, 0.3, {
            rotation: 0,
        });
    }

    onDown() {}

    onUp() {
        TweenMax.to(this, 0.3, {
            rotation: 0,
        });
        play("se_cursor");
    }

    castAdded() {
        this.on("pointerover", this._onOver);
        this.on("pointerout", this._onOut);
        this.on("pointerdown", this._onDown);
        this.on("pointerupoutside", this._onOut);
        this.on("pointerup", this._onUp);
    }

    castRemoved() {
        this.off("pointerover", this._onOver);
        this.off("pointerout", this._onOut);
        this.off("pointerdown", this._onDown);
        this.off("pointerupoutside", this._onOut);
        this.off("pointerup", this._onUp);
    }
}

export default StaffrollCloseButton;
