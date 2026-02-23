import { BaseCast } from "../game-objects/BaseCast.js";
import { GAME_DIMENSIONS } from "../constants.js";

export class CutinContainer extends BaseCast {
    constructor() {
        super();

        this.cutinBg = new PIXI.Graphics();
        this.cutinBg.beginFill(0x000000, 0.9);
        this.cutinBg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.addChild(this.cutinBg);

        this.cutin = new PIXI.Sprite();
        this.cutin.y = GAME_DIMENSIONS.HEIGHT / 2 - 71;
        this.addChild(this.cutin);

        this.flash = new PIXI.Graphics();
        this.flash.beginFill(0xeeeeee, 1);
        this.flash.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.addChild(this.flash);

        this.tl = null;
    }

    start() {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        this.cutinBg.alpha = 0;
        this.flash.alpha = 0;
        this.cutin.texture = null;

        this.tl = new TimelineMax();
        this.tl.to(this.cutinBg, 0.25, {
            alpha: 1,
        });
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin0.gif");
        }, null, this, "+=0.00");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin1.gif");
        }, null, this, "+=0.08");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin2.gif");
        }, null, this, "+=0.08");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin3.gif");
        }, null, this, "+=0.08");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin4.gif");
        }, null, this, "+=0.08");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin5.gif");
        }, null, this, "+=0.08");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin6.gif");
        }, null, this, "+=0.3");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin7.gif");
        }, null, this, "+=0.1");
        this.tl.call(() => {
            this.cutin.texture = PIXI.Texture.fromFrame("cutin8.gif");
        }, null, this, "+=0.1");
        this.tl.to(this.flash, 0.3, {
            delay: 0.3,
            alpha: 1,
        });
    }

    castAdded() {}

    castRemoved() {
        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }
    }
}

export default CutinContainer;
