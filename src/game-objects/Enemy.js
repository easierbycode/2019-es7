import { BaseUnit } from "./BaseUnit.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { play, stop } from "../soundManager.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

function toTexture(frame) {
    if (!frame) {
        return PIXI.Texture.WHITE;
    }
    if (frame && typeof frame === "object") {
        return frame;
    }
    try {
        return PIXI.Texture.fromFrame(frame);
    } catch (error) {
        try {
            return PIXI.Texture.fromImage(frame);
        } catch (nextError) {
            return PIXI.Texture.WHITE;
        }
    }
}

export class Enemy extends BaseUnit {
    static get CUSTOM_EVENT_DEAD() {
        return CUSTOM_EVENTS.DEAD;
    }

    static get CUSTOM_EVENT_DEAD_COMPLETE() {
        return CUSTOM_EVENTS.DEAD_COMPLETE;
    }

    static get CUSTOM_EVENT_PROJECTILE_ADD() {
        return CUSTOM_EVENTS.PROJECTILE_ADD;
    }

    constructor(data = {}) {
        const textures = Array.isArray(data.texture) ? data.texture.slice() : [];

        if (textures.length > 0 && typeof textures[0] !== "object") {
            for (let i = 0; i < textures.length; i += 1) {
                const tex = PIXI.Texture.fromFrame(textures[i]);
                if (tex && tex.baseTexture) {
                    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                }
                textures[i] = tex;
            }
        }

        if (data.projectileData && Array.isArray(data.projectileData.texture)) {
            for (let i = 0; i < data.projectileData.texture.length; i += 1) {
                if (typeof data.projectileData.texture[i] !== "object") {
                    const tex = PIXI.Texture.fromFrame(data.projectileData.texture[i]);
                    if (tex && tex.baseTexture) {
                        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                    }
                    data.projectileData.texture[i] = tex;
                }
            }
        }

        const explosionFrames = Array.isArray(data.explosion) ? data.explosion : null;

        super(textures, explosionFrames);

        this.name = data.name || "";
        this.unit.name = data.name || "";
        this.interval = data.interval || 0;
        this.score = data.score || 0;
        this.hp = data.hp || 1;
        this.speed = data.speed || 1;
        this.spgage = data.spgage || 0;
        this.projectileData = data.projectileData || null;
        this.itemName = data.itemName || null;
        this.itemTexture = data.itemTexture || null;
        this.deadFlg = false;

        this.whitefilter = new PIXI.filters.ColorMatrixFilter();
        this.whitefilter.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        switch (data.name) {
        case "baraA":
        case "baraB":
            this.shadow.visible = false;
            break;
        case "drum":
            this.unit.hitArea = new PIXI.Rectangle(
                7, 2,
                this.unit.width - 14,
                this.unit.height - 2
            );
            break;
        case "launchpad":
            this.unit.hitArea = new PIXI.Rectangle(
                8, 0,
                this.unit.width - 16,
                this.unit.height
            );
            break;
        default:
            break;
        }

        this.shadowReverse = data.shadowReverse !== undefined ? data.shadowReverse : true;
        this.shadowOffsetY = data.shadowOffsetY !== undefined ? data.shadowOffsetY : 0;

        this.playerBigBulletCnt = 0;
        this.bulletFrameCnt = 0;
        this.shootFlg = true;
        this.hardleFlg = false;

        if (this.interval <= -1) {
            this.hardleFlg = true;
        }

        this.posName = "";
    }

    loop(scrollAmount) {
        this.bulletFrameCnt += 1;

        if (this.shootFlg && !this.hardleFlg && this.bulletFrameCnt % this.interval === 0) {
            this.shoot();
        }

        this.unit.y += this.speed;

        switch (this.name) {
        case "soliderA": {
            const playerUnit = gameState.player && gameState.player.unit
                ? gameState.player.unit
                : null;
            if (this.unit.y >= GAME_DIMENSIONS.HEIGHT / 1.5 && playerUnit) {
                this.unit.x += 0.005 * (playerUnit.x - this.unit.x);
            }
            break;
        }
        case "soliderB":
            if (this.unit.y <= 10) {
                if (this.unit.x >= GAME_DIMENSIONS.WIDTH / 2) {
                    this.unit.x = GAME_DIMENSIONS.WIDTH;
                    this.posName = "right";
                } else {
                    this.unit.x = -this.unit.width;
                    this.posName = "left";
                }
            }
            if (this.unit.y >= GAME_DIMENSIONS.HEIGHT / 3) {
                if (this.posName === "right") {
                    this.unit.x -= 1;
                } else if (this.posName === "left") {
                    this.unit.x += 1;
                }
            }
            break;
        default:
            break;
        }
    }

    shoot() {
        if (!this.projectileData) {
            return;
        }
        this.emit(Enemy.CUSTOM_EVENT_PROJECTILE_ADD);
        stop("se_shoot");
        play("se_shoot");
    }

    onDamage(damage) {
        if (this.hp === "infinity") {
            TweenMax.to(this.character, 0.05, { filters: [this.whitefilter] });
            TweenMax.to(this.character, 0.3, { delay: 0.1, filters: null });
            return;
        }

        if (this.deadFlg) {
            return;
        }

        this.hp -= damage;

        if (this.hp <= 0) {
            this.dead();
            this.deadFlg = true;
        } else {
            TweenMax.to(this.character, 0.1, { tint: 0xff0000 });
            TweenMax.to(this.character, 0.1, { delay: 0.1, tint: 0xffffff });
        }
    }

    dead() {
        if (this.hp === "infinity") {
            return;
        }

        this.emit(Enemy.CUSTOM_EVENT_DEAD);
        this.shootFlg = false;

        if (this.explosion) {
            this.explosion.onComplete = this.explosionComplete.bind(this);
            this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2;
            this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2;
            if (this.explosion.parent !== this) {
                this.addChild(this.explosion);
            }
            this.explosion.play();
        }

        if (this.shadow && this.shadow.parent === this.unit) {
            this.unit.removeChild(this.shadow);
        }
        if (this.character && this.character.parent === this.unit) {
            this.unit.removeChild(this.character);
        }
        if (this.unit && this.unit.parent === this) {
            this.removeChild(this.unit);
        }

        stop("se_damage");
        play("se_explosion");
    }

    explosionComplete() {
        if (this.explosion) {
            this.explosion.destroy();
            if (this.explosion.parent) {
                this.explosion.parent.removeChild(this.explosion);
            }
        }
        this.emit(Enemy.CUSTOM_EVENT_DEAD_COMPLETE);
    }

    castAdded(parent) {
        super.castAdded(parent);
    }

    castRemoved(parent) {
        if (this._isDisposing || this.destroyed) {
            return;
        }
        super.castRemoved(parent);
    }
}

export default Enemy;
