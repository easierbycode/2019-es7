import { BaseCast } from "../game-objects/BaseCast.js";

export class ScorePopup extends BaseCast {
    constructor(score, ratio) {
        super();

        this.textureList = [];
        for (let i = 0; i <= 9; i += 1) {
            const texture = PIXI.Texture.fromFrame("smallNum" + String(i) + ".gif");
            texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            this.textureList[i] = texture;
        }

        const scoreText = String(score);
        let lastX = 0;
        for (let i = 0; i < scoreText.length; i += 1) {
            const sprite = new PIXI.Sprite(this.textureList[Number(scoreText.substr(i, 1))]);
            lastX = i * (sprite.width - 2);
            sprite.x = lastX;
            this.addChild(sprite);
        }

        const kakeru = new PIXI.Sprite(PIXI.Texture.fromFrame("smallNumKakeru.gif"));
        kakeru.x = lastX + 8;
        this.addChild(kakeru);

        const ratioText = String(ratio);
        for (let i = 0; i < ratioText.length; i += 1) {
            const sprite = new PIXI.Sprite(this.textureList[Number(ratioText.substr(i, 1))]);
            sprite.x = kakeru.x + kakeru.width + 1 + i * (sprite.width - 1);
            this.addChild(sprite);
        }
    }
}

export default ScorePopup;
