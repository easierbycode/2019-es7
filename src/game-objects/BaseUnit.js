import { BaseCast } from "./BaseCast.js";
import { gameState } from "../gameState.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames);
}

export class BaseUnit extends BaseCast {
    static get CUSTOM_EVENT_DEAD() {
        return CUSTOM_EVENTS.DEAD;
    }

    static get CUSTOM_EVENT_DEAD_COMPLETE() {
        return CUSTOM_EVENTS.DEAD_COMPLETE;
    }

    static get CUSTOM_EVENT_PROJECTILE_ADD() {
        return CUSTOM_EVENTS.PROJECTILE_ADD;
    }

    static get CUSTOM_EVENT_TAMA_ADD() {
        return CUSTOM_EVENTS.PROJECTILE_ADD;
    }

    constructor(animationFrames, explosionFrames = null, id) {
        super(id);

        this.shadowReverse = true;
        this.speed = 0;
        this.hp = 1;
        this.deadFlg = false;
        this.shadowOffsetY = 0;
        this.hitbox = null;
        this._isDisposing = false;

        this.character = createAnimatedSprite(animationFrames);
        this.character.animationSpeed = 0.1;
        this.character.anchor.set(0.5);

        this.shadow = createAnimatedSprite(animationFrames);
        this.shadow.animationSpeed = 0.1;
        this.shadow.tint = 0x000000;
        this.shadow.alpha = 0.5;
        this.shadow.anchor.set(0.5);

        this.unit = new PIXI.Container();
        this.unit.interactive = true;
        this.unit.name = "unit";
        this.unit.hitArea = new PIXI.Rectangle(
            -this.character.width / 2,
            -this.character.height / 2,
            this.character.width,
            this.character.height
        );

        this.addChild(this.unit);
        this.unit.addChild(this.shadow);
        this.unit.addChild(this.character);

        if (explosionFrames) {
            this.explosion = createAnimatedSprite(explosionFrames);
            this.explosion.anchor.set(0.5);
            const scaleFactor = Math.min(1, (this.character.height + 50) / this.explosion.height) + 0.2;
            this.explosion.scale.set(scaleFactor);
            this.explosion.animationSpeed = 0.4;
            this.explosion.loop = false;
            this.explosion.visible = false;
            this.addChild(this.explosion);
        } else {
            this.explosion = null;
        }
    }

    castAdded() {
        if (this.character && !this.character.playing) {
            this.character.play();
        }
        if (this.shadow && !this.shadow.playing) {
            this.shadow.play();
        }
        this.updateShadowPosition();

        if (String(gameState.hitAreaFlg) === "true") {
            this.drawHitbox();
        }
    }

    castRemoved() {
        if (this._isDisposing || this.destroyed) {
            return;
        }
        this.destroy();
    }

    updateShadowPosition() {
        if (!this.character || !this.shadow) {
            return;
        }

        this.shadow.scale.y = this.shadowReverse ? -1 : 1;
        this.shadow.x = this.character.x;
        this.shadow.y = this.character.y + this.character.height - this.shadowOffsetY;
    }

    drawHitbox() {
        if (!this.unit || !this.unit.hitArea) {
            return;
        }

        if (this.hitbox && this.hitbox.parent) {
            this.hitbox.parent.removeChild(this.hitbox);
        }

        this.hitbox = new PIXI.Graphics();
        this.hitbox.lineStyle(1, 0xff0000, 0.7);
        this.hitbox.drawRect(
            this.unit.hitArea.x,
            this.unit.hitArea.y,
            this.unit.hitArea.width,
            this.unit.hitArea.height
        );
        this.unit.addChild(this.hitbox);
    }

    destroy(options) {
        if (this._isDisposing || this.destroyed) {
            return;
        }

        this._isDisposing = true;

        if (this.hitbox && this.hitbox.parent) {
            this.hitbox.parent.removeChild(this.hitbox);
        }
        if (this.hitbox) {
            this.hitbox.destroy();
        }

        if (this.explosion && this.explosion.parent) {
            this.explosion.parent.removeChild(this.explosion);
        }
        if (this.explosion) {
            this.explosion.destroy();
        }

        if (this.unit && this.unit.parent) {
            this.unit.parent.removeChild(this.unit);
        }
        if (this.unit) {
            this.unit.destroy({ children: true });
        }

        this.character = null;
        this.shadow = null;
        this.explosion = null;
        this.unit = null;
        this.hitbox = null;

        super.destroy(options);
        this._isDisposing = false;
    }
}

export default BaseUnit;
