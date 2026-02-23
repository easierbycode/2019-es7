import { BaseSpriteCast } from "../game-objects/BaseSpriteCast.js";
import { play } from "../soundManager.js";

function frameTexture(frameName) {
    return PIXI.Texture.fromFrame(frameName);
}

export class FrameButton extends BaseSpriteCast {
    constructor(defaultFrame, overFrame, downFrame) {
        super(frameTexture(defaultFrame));

        this.textureDefault = frameTexture(defaultFrame);
        this.textureOver = frameTexture(overFrame || defaultFrame);
        this.textureDown = frameTexture(downFrame || defaultFrame);

        this.interactive = true;
        this.buttonMode = true;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        play("se_over");
        this.texture = this.textureOver;
    }

    onOut() {
        this.texture = this.textureDefault;
    }

    onDown() {
        this.texture = this.textureDown;
    }

    onUp() {
        play("se_cursor");
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

export default FrameButton;
