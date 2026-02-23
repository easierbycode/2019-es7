import { BaseUnit } from "../game-objects/BaseUnit.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { BOSS_STATES } from "../enums/player-boss-states.js";
import { play, stop } from "../soundManager.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

function isFrameObject(frame) {
    return frame && typeof frame === "object";
}

function toTexture(frame) {
    if (!frame) {
        return PIXI.Texture.WHITE;
    }

    if (isFrameObject(frame)) {
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

function normalizeTextureArray(frames) {
    if (!Array.isArray(frames)) {
        return [];
    }

    for (let i = 0; i < frames.length; i += 1) {
        frames[i] = toTexture(frames[i]);
    }

    return frames;
}

function makeDangerFrames() {
    const dangerFrames = [];
    for (let i = 0; i < 3; i += 1) {
        dangerFrames[i] = PIXI.Texture.fromFrame("boss_dengerous" + String(i) + ".gif");
    }
    return dangerFrames;
}

function playerSpDamage() {
    const value = Number(gameState.spDamage || gameState.caDamage || 0);
    return Number.isFinite(value) ? value : 0;
}

export class Boss extends BaseUnit {
    constructor(data = {}) {
        const anim = data.anim || {};
        const idleFrames = normalizeTextureArray(Array.isArray(anim.idle) ? anim.idle : []);
        const explosionFrames = normalizeTextureArray(Array.isArray(data.explosion) ? data.explosion : []);

        super(idleFrames, explosionFrames);

        this.name = data.name;
        this.bossName = data.name;
        this.unit.name = BOSS_STATES.UNIT_NAME;

        this.interval = data.interval;
        this.score = data.score;
        this.hp = data.hp;
        this.spgage = data.spgage;

        this.animList = anim;
        this.projectileData = data.projectileData;

        this.dengerousBalloon = createAnimatedSprite(makeDangerFrames());
        this.dengerousBalloon.animationSpeed = 0.2;
        this.dengerousBalloon.pivot.y = this.dengerousBalloon.height;
        this.dengerousBalloon.scale.set(0);

        this.shadowReverse = data.shadowReverse;
        this.shadowOffsetY = data.shadowOffsetY;

        this.shootOn = true;
        this.bulletFrameCnt = 0;
        this.moveFlg = false;
        this.deadFlg = false;
        this.gokiFlg = false;
        this.dengerousFlg = false;

        this.unit.hitArea = new PIXI.Rectangle(
            5,
            5,
            Math.max(1, this.unit.width - 10),
            Math.max(1, this.unit.height - 10)
        );

        this.tlShoot = null;

        // BaseUnit uses centered anchors; original app logic is top-left based.
        this.character.anchor.set(0, 0);
        this.shadow.anchor.set(0, 0);
    }

    static get CUSTOM_EVENT_DEAD() {
        return CUSTOM_EVENTS.DEAD;
    }

    static get CUSTOM_EVENT_DEAD_COMPLETE() {
        return CUSTOM_EVENTS.DEAD_COMPLETE;
    }

    static get CUSTOM_EVENT_PROJECTILE_ADD() {
        return CUSTOM_EVENTS.PROJECTILE_ADD;
    }

    updateShadowPosition() {
        if (!this.shadow) {
            return;
        }

        if (this.shadowReverse) {
            this.shadow.scale.y = -1;
            this.shadow.y = 2 * this.shadow.height - this.shadowOffsetY;
        } else {
            this.shadow.scale.y = 1;
            this.shadow.y = this.shadow.height - this.shadowOffsetY;
        }
        this.shadow.x = 0;
    }

    shoot() {
        this.emit(Boss.CUSTOM_EVENT_PROJECTILE_ADD);
        stop("se_shoot");
        play("se_shoot");
    }

    onTheWorld(freeze) {
        if (!this.tlShoot) {
            return;
        }

        if (freeze) {
            this.tlShoot.pause();
        } else if (this.hp >= 1) {
            this.tlShoot.resume();
        }
    }

    onDamage(damage) {
        if (this.deadFlg) {
            return;
        }

        this.hp -= damage;

        if (this.hp <= 0) {
            this.dead();
            this.deadFlg = true;
            return;
        }

        if (TweenMax.isTweening(this.character)) {
            TweenMax.killTweensOf(this.character, { tint: true });
        }

        TweenMax.to(this.character, 0.1, { tint: 16773120 });
        TweenMax.to(this.character, 0.1, {
            delay: 0.2,
            tint: 16777215,
        });

        if (this.hp <= playerSpDamage() && !this.dengerousFlg) {
            this.unit.addChild(this.dengerousBalloon);
            this.dengerousBalloon.play();
            TweenMax.to(this.dengerousBalloon.scale, 1, {
                x: 1,
                y: 1,
                ease: Elastic.easeOut,
            });
            this.dengerousFlg = true;
        }
    }

    dead() {
        if (this.hp > 0) {
            return;
        }

        if (!this.gokiFlg) {
            this.emit(Boss.CUSTOM_EVENT_DEAD);
        }

        this.character.stop();
        this.shadow.stop();
        this.explotionCnt = 0;

        stop("se_damage");

        for (let i = 0; i < 5; i += 1) {
            TweenMax.delayedCall(0.25 * i, () => {
                const explosion = createAnimatedSprite(this.explosion ? this.explosion.textures : []);
                explosion.scale.set(1);
                explosion.animationSpeed = 0.15;
                explosion.loop = false;
                explosion.onComplete = this.explosionComplete.bind(this, explosion);
                explosion.x = this.unit.x + Math.random() * this.unit.hitArea.width - explosion.width / 2;
                explosion.y = this.unit.y + Math.random() * this.unit.hitArea.height - explosion.height / 2;
                this.addChild(explosion);
                explosion.play();
                play("se_explosion");
            });
        }

        const startX = this.unit.x;
        const startY = this.unit.y;
        new TimelineMax()
            .call(() => {
                this.unit.x = startX + 4;
                this.unit.y = startY - 2;
            }, null, this, "+=0.0")
            .call(() => {
                this.unit.x = startX - 3;
                this.unit.y = startY + 1;
            }, null, this, "+=0.08")
            .call(() => {
                this.unit.x = startX + 2;
                this.unit.y = startY - 1;
            }, null, this, "+=0.07")
            .call(() => {
                this.unit.x = startX - 2;
                this.unit.y = startY + 1;
            }, null, this, "+=0.05")
            .call(() => {
                this.unit.x = startX + 1;
                this.unit.y = startY + 1;
            }, null, this, "+=0.05")
            .call(() => {
                this.unit.x = startX;
                this.unit.y = startY;
            }, null, this, "+=0.04")
            .call(() => {
                this.unit.x = startX + 4;
                this.unit.y = startY - 2;
            }, null, this, "+=0.0")
            .call(() => {
                this.unit.x = startX - 3;
                this.unit.y = startY + 1;
            }, null, this, "+=0.08")
            .call(() => {
                this.unit.x = startX + 2;
                this.unit.y = startY - 1;
            }, null, this, "+=0.07")
            .call(() => {
                this.unit.x = startX - 2;
                this.unit.y = startY + 1;
            }, null, this, "+=0.05")
            .call(() => {
                this.unit.x = startX + 1;
                this.unit.y = startY + 1;
            }, null, this, "+=0.05")
            .call(() => {
                this.unit.x = startX;
                this.unit.y = startY;
            }, null, this, "+=0.04")
            .to(this.unit, 1, {
                delay: 0.5,
                alpha: 0,
            });

        this.onDead();
    }

    explosionComplete(explosion) {
        if (explosion && explosion.parent) {
            explosion.parent.removeChild(explosion);
        }

        if (this.explotionCnt === 4) {
            if (this.shadow && this.shadow.parent === this.unit) {
                this.unit.removeChild(this.shadow);
            }
            if (this.unit && this.unit.parent === this) {
                this.removeChild(this.unit);
            }
        }

        this.explotionCnt += 1;
    }

    onDead() {}

    castAdded(parent) {
        super.castAdded(parent);
        this.unit.x = GAME_DIMENSIONS.WIDTH / 2 - this.unit.width / 2;
        this.unit.y = -298;
        this.moveFlg = true;
    }

    castRemoved(parent) {
        super.castRemoved(parent);
    }
}

export { isFrameObject, toTexture, normalizeTextureArray };
export default Boss;
