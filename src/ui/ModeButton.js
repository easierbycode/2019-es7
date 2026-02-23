import { BaseSpriteCast } from "../game-objects/BaseSpriteCast.js";

export class ModeButton extends BaseSpriteCast {
    constructor(defaultFrameName, downFrameName) {
        super(PIXI.Texture.fromFrame(defaultFrameName));

        this.textureDefault = PIXI.Texture.fromFrame(defaultFrameName);
        this.textureDown = PIXI.Texture.fromFrame(downFrameName || defaultFrameName);

        this.interactive = true;
        this.buttonMode = true;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        this.alpha = 0.7;
    }

    onOut() {
        this.alpha = 1;
        this.texture = this.textureDefault;
    }

    onDown() {
        this.texture = this.textureDown;
    }

    onUp() {
        this.alpha = 1;
        this.texture = this.textureDefault;
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

export default ModeButton;
