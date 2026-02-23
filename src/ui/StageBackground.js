import { BaseCast } from "../game-objects/BaseCast.js";
import { GAME_DIMENSIONS } from "../constants.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);
const TilingSpriteClass = (PIXI.extras && PIXI.extras.TilingSprite) || PIXI.TilingSprite;

function createTilingSprite(texture, width, height) {
    if (!TilingSpriteClass) {
        throw new Error("TilingSprite class is not available on PIXI.");
    }
    return new TilingSpriteClass(texture, width, height);
}

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames);
}

export class StageBackground extends BaseCast {
    constructor(allStagebgTexturesList) {
        super();

        this.allStagebgTexturesList = allStagebgTexturesList || [];
        this.bg = null;
        this.bgEnd = null;
        this.akebonoBg = null;
        this.akebonoTen = null;
        this.akebonoTenShock = null;
        this.scrollAmount = 0;
        this.scrollCount = 0;
        this.moveFlg = false;
        this.bossAppearFlg = false;
    }

    init(stageId) {
        this.moveFlg = true;
        this.bossAppearFlg = false;
        this.scrollAmount = 0;
        this.scrollCount = 0;

        if (this.bg && this.bg.parent === this) {
            this.removeChild(this.bg);
        }
        if (this.bgEnd && this.bgEnd.parent === this) {
            this.removeChild(this.bgEnd);
        }

        const stageTextureSet = this.allStagebgTexturesList[stageId] || [];
        const loopTexture = stageTextureSet[1] || PIXI.Texture.WHITE;
        const endTexture = stageTextureSet[0] || PIXI.Texture.WHITE;

        this.bg = createTilingSprite(loopTexture, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.bg.width = GAME_DIMENSIONS.WIDTH;
        this.bg.height = GAME_DIMENSIONS.HEIGHT;
        this.addChild(this.bg);

        this.bgEnd = new PIXI.Sprite(endTexture);
        this.bgEnd.y = -this.bgEnd.height;
        this.addChild(this.bgEnd);

        const akebonoFrames = [
            PIXI.Texture.fromFrame("akebonoBg0.gif"),
            PIXI.Texture.fromFrame("akebonoBg1.gif"),
            PIXI.Texture.fromFrame("akebonoBg2.gif"),
        ];
        this.akebonoBg = createAnimatedSprite(akebonoFrames);
        this.akebonoBg.animationSpeed = 0.7;
    }

    loop(scrollAmount) {
        this.scrollAmount = scrollAmount;

        if (this.moveFlg && this.bg) {
            this.bg.tilePosition.y += this.scrollAmount;
        }

        if (this.bossAppearFlg && this.bg && this.bgEnd) {
            this.scrollCount += scrollAmount;
            this.bg.y += this.scrollAmount;
            this.bgEnd.y += this.scrollAmount;
            if (this.scrollAmount >= 214) {
                this.scrollAmount = 0;
            }
            if (this.bgEnd.y >= 42) {
                this.bossAppearFlg = false;
            }
        }
    }

    bossScene() {
        this.moveFlg = false;
        this.bossAppearFlg = true;
    }

    akebonofinish() {
        if (!this.akebonoBg) {
            return;
        }

        this.akebonoBg.play();
        if (this.akebonoBg.parent !== this) {
            this.addChild(this.akebonoBg);
        }
    }

    akebonoGokifinish() {
        if (!this.akebonoBg) {
            return;
        }

        this.akebonoBg.play();
        if (this.akebonoBg.parent !== this) {
            this.addChild(this.akebonoBg);
        }

        this.akebonoTen = new PIXI.Sprite(PIXI.Texture.fromFrame("akebonoTen.gif"));
        this.akebonoTen.anchor.set(0.5);
        this.akebonoTen.x = 27 + this.akebonoTen.width / 2;
        this.akebonoTen.y = 113 + this.akebonoTen.height / 2;
        this.akebonoTen.scale.set(1.2);
        this.addChild(this.akebonoTen);

        this.akebonoTenShock = new PIXI.Sprite(PIXI.Texture.fromFrame("akebonoTen.gif"));
        this.akebonoTenShock.anchor.set(0.5);
        this.akebonoTenShock.x = 27 + this.akebonoTenShock.width / 2;
        this.akebonoTenShock.y = 113 + this.akebonoTenShock.height / 2;
        this.akebonoTenShock.alpha = 0;
        this.addChild(this.akebonoTenShock);

        const timeline = new TimelineMax();
        timeline.to(this.akebonoTen.scale, 0.3, {
            x: 1,
            y: 1,
            ease: Quint.easeIn,
        });
        timeline.to(this.akebonoTenShock, 0.001, {
            alpha: 1,
        });
        timeline.to(this.akebonoTenShock, 0.6, {
            alpha: 0,
            ease: Quint.easeOut,
        });
        timeline.to(this.akebonoTenShock.scale, 0.4, {
            x: 1.5,
            y: 1.5,
            ease: Quint.easeOut,
        }, "-=0.6");
        timeline.to(this.akebonoTen, 0.3, {
            alpha: 0,
            ease: Quint.easeOut,
        });
    }

    castAdded() {}

    castRemoved() {
        if (this.akebonoBg) {
            if (this.akebonoBg.parent === this) {
                this.removeChild(this.akebonoBg);
            }
            this.akebonoBg.destroy();
            this.akebonoBg = null;
        }

        if (this.akebonoTen && this.akebonoTen.parent === this) {
            this.removeChild(this.akebonoTen);
        }
        if (this.akebonoTenShock && this.akebonoTenShock.parent === this) {
            this.removeChild(this.akebonoTenShock);
        }
        this.akebonoTen = null;
        this.akebonoTenShock = null;

        if (this.bg && this.bg.parent === this) {
            this.removeChild(this.bg);
        }
        if (this.bgEnd && this.bgEnd.parent === this) {
            this.removeChild(this.bgEnd);
        }
        this.bg = null;
        this.bgEnd = null;
    }
}

export default StageBackground;
