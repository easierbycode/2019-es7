import { BaseCast } from "../game-objects/BaseCast.js";

export class ComboNumberDisplay extends BaseCast {
    constructor() {
        super();

        this.numTextureList = [];
        for (let i = 0; i <= 9; i += 1) {
            this.numTextureList[i] = PIXI.Texture.fromFrame("comboNum" + String(i) + ".gif");
        }

        this.nowDisplayNumList = [];
    }

    setNum(num) {
        for (let i = 0; i < this.nowDisplayNumList.length; i += 1) {
            this.removeChild(this.nowDisplayNumList[i]);
        }

        this.nowDisplayNumList = [];

        const text = String(num);
        for (let i = 0; i < text.length; i += 1) {
            const digit = text.substr(i, 1);
            const sprite = new PIXI.Sprite(this.numTextureList[digit]);
            sprite.x = i * sprite.width;
            this.addChild(sprite);
            this.nowDisplayNumList[i] = sprite;
        }
    }
}

export default ComboNumberDisplay;
