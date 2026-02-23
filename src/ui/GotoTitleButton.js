import { BaseCast } from "../game-objects/BaseCast.js";
import { play } from "../soundManager.js";

export class GotoTitleButton extends BaseCast {
    constructor() {
        super();

        this.interactive = true;
        this.buttonMode = true;

        this.textureDefault = PIXI.Texture.fromFrame("gotoTitleBtn0.gif");
        this.textureOver = PIXI.Texture.fromFrame("gotoTitleBtn1.gif");
        this.textureDown = PIXI.Texture.fromFrame("gotoTitleBtn2.gif");

        this.btn = new PIXI.Sprite(this.textureDefault);
        this.addChild(this.btn);

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    onOver() {
        play("se_over");
        this.btn.texture = this.textureOver;
    }

    onOut() {
        this.btn.texture = this.textureDefault;
    }

    onDown() {
        this.btn.texture = this.textureDown;
    }

    onUp() {
        this.interactive = false;
        this.buttonMode = false;
        play("se_correct");
        this.btn.texture = this.textureDefault;
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

export default GotoTitleButton;
