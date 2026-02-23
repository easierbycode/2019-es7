import { BaseCast } from "../game-objects/BaseCast.js";

export class SmallNumberDisplay extends BaseCast {
    constructor(maxDigit) {
        super();

        this.maxDigit = maxDigit;
        this.textureList = [];
        this.numSpList = [];

        for (let i = 0; i <= 9; i += 1) {
            this.textureList[i] = PIXI.Texture.fromFrame("smallNum" + String(i) + ".gif");
        }

        for (let i = 0; i < maxDigit; i += 1) {
            const sprite = new PIXI.Sprite(this.textureList[0]);
            sprite.x = (maxDigit - 1 - i) * (sprite.width - 2);
            this.addChild(sprite);
            this.numSpList[i] = sprite;
        }
    }

    setNum(num) {
        const text = String(num);
        for (let i = 0; i < this.maxDigit; i += 1) {
            const digit = text.substr(i, 1);
            if (digit) {
                this.numSpList[text.length - 1 - i].texture = this.textureList[Number(digit)];
                this.numSpList[i].alpha = 1;
            } else {
                this.numSpList[i].texture = this.textureList[0];
                this.numSpList[i].alpha = 0.5;
            }
        }
    }
}

export default SmallNumberDisplay;
