import { BaseSpriteCast } from "../game-objects/BaseSpriteCast.js";
import { play } from "../soundManager.js";

export class ExternalLinkButton extends BaseSpriteCast {
    constructor(frameName, url) {
        super(PIXI.Texture.fromFrame(frameName));

        this.url = url;
        this.interactive = true;
        this.buttonMode = true;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        play("se_over");
        this.tint = 0xAAAAAA;
    }

    onOut() {
        this.tint = 0xFFFFFF;
    }

    onDown() {}

    onUp() {
        play("se_cursor");
        if (typeof window !== "undefined" && this.url) {
            window.open(this.url, "_blank");
        }
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

export default ExternalLinkButton;
