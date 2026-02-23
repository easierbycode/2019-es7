import { BaseCast } from "../game-objects/BaseCast.js";
import { GAME_DIMENSIONS } from "../constants.js";

export class AdvNextButton extends BaseCast {
    constructor() {
        super();

        this.hitGra = new PIXI.Graphics();
        this.hitGra.beginFill(0xff0000, 0);
        this.hitGra.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.hitGra.endFill();
        this.addChild(this.hitGra);

        this.flashCover = new PIXI.Graphics();
        this.flashCover.beginFill(0xffffff, 1);
        this.flashCover.drawRect(0, 0, this.hitGra.width, this.hitGra.height);
        this.flashCover.alpha = 0;
        this.addChild(this.flashCover);

        const style = new PIXI.TextStyle({
            fontSize: 16,
            fontFamily: "sans-serif",
            fontWeight: "bold",
            lineHeight: 18,
            fill: 0xffffff,
        });

        this.actionText = new PIXI.Text("", style);
        this.actionText.x = GAME_DIMENSIONS.WIDTH - this.actionText.width;
        this.actionText.y = GAME_DIMENSIONS.HEIGHT - this.actionText.height - 20;
        this.addChild(this.actionText);

        this.interactive = true;
        this.buttonMode = true;
        this.tl = null;

        this._onOver = this.onOver.bind(this);
        this._onOut = this.onOut.bind(this);
        this._onDown = this.onDown.bind(this);
        this._onUp = this.onUp.bind(this);
    }

    nextPart() {
        this.actionText.text = "Next▼";
        this.actionText.x = GAME_DIMENSIONS.WIDTH - this.actionText.width - 10;
    }

    nextScene() {
        this.actionText.text = "LET'S GO! >";
        this.actionText.x = GAME_DIMENSIONS.WIDTH - this.actionText.width - 10;
    }

    onOver() {}

    onOut() {}

    onDown() {}

    onUp() {}

    castAdded() {
        this.tl = new TimelineMax({
            repeat: -1,
            yoyo: true,
        });
        this.tl.to(this.actionText, 0.4, {
            delay: 0.2,
            alpha: 0,
        }).to(this.actionText, 0.8, {
            alpha: 1,
        });

        this.on("pointerover", this._onOver);
        this.on("pointerout", this._onOut);
        this.on("pointerdown", this._onDown);
        this.on("pointerupoutside", this._onOut);
        this.on("pointerup", this._onUp);
    }

    castRemoved() {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        this.off("pointerover", this._onOver);
        this.off("pointerout", this._onOut);
        this.off("pointerdown", this._onDown);
        this.off("pointerupoutside", this._onOut);
        this.off("pointerup", this._onUp);
    }
}

export default AdvNextButton;
