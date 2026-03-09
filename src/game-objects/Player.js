import { BaseUnit } from "./BaseUnit.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { PLAYER_STATES } from "../enums/player-boss-states.js";
import { play, stop } from "../soundManager.js";
import { Bullet } from "./Bullet.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

export class Player extends BaseUnit {
    static get CUSTOM_EVENT_DEAD() {
        return CUSTOM_EVENTS.DEAD;
    }

    static get CUSTOM_EVENT_DEAD_COMPLETE() {
        return CUSTOM_EVENTS.DEAD_COMPLETE;
    }

    static get SHOOT_NAME_NORMAL() {
        return PLAYER_STATES.SHOOT_NAME_NORMAL;
    }

    static get SHOOT_NAME_BIG() {
        return PLAYER_STATES.SHOOT_NAME_BIG;
    }

    static get SHOOT_NAME_3WAY() {
        return PLAYER_STATES.SHOOT_NAME_3WAY;
    }

    static get SHOOT_SPEED_NORMAL() {
        return PLAYER_STATES.SHOOT_SPEED_NORMAL;
    }

    static get SHOOT_SPEED_HIGH() {
        return PLAYER_STATES.SHOOT_SPEED_HIGH;
    }

    static get BARRIER() {
        return PLAYER_STATES.BARRIER;
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

        if (data.shootNormal && Array.isArray(data.shootNormal.texture)) {
            for (let i = 0; i < data.shootNormal.texture.length; i += 1) {
                if (typeof data.shootNormal.texture[i] !== "object") {
                    const tex = PIXI.Texture.fromFrame(data.shootNormal.texture[i]);
                    if (tex && tex.baseTexture) {
                        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                    }
                    data.shootNormal.texture[i] = tex;
                }
            }
        }

        if (data.shootBig && Array.isArray(data.shootBig.texture)) {
            for (let i = 0; i < data.shootBig.texture.length; i += 1) {
                if (typeof data.shootBig.texture[i] !== "object") {
                    const tex = PIXI.Texture.fromFrame(data.shootBig.texture[i]);
                    if (tex && tex.baseTexture) {
                        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                    }
                    data.shootBig.texture[i] = tex;
                }
            }
        }

        if (data.barrier && Array.isArray(data.barrier.texture)) {
            for (let i = 0; i < data.barrier.texture.length; i += 1) {
                if (typeof data.barrier.texture[i] !== "object") {
                    const tex = PIXI.Texture.fromFrame(data.barrier.texture[i]);
                    if (tex && tex.baseTexture) {
                        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                    }
                    data.barrier.texture[i] = tex;
                }
            }
        }

        const hitFrames = [];
        const guardFrames = [];
        try {
            for (let i = 0; i < 5; i += 1) {
                hitFrames.push(PIXI.Texture.fromFrame("hit" + String(i) + ".gif"));
            }
            for (let i = 0; i < 5; i += 1) {
                guardFrames.push(PIXI.Texture.fromFrame("guard" + String(i) + ".gif"));
            }
        } catch (error) {
            // textures may not exist
        }

        let barrierEffectTexture = PIXI.Texture.WHITE;
        try {
            barrierEffectTexture = PIXI.Texture.fromFrame("barrierEffect.gif");
        } catch (error) {
            // texture may not exist
        }

        const explosionFrames = Array.isArray(data.explosion) ? data.explosion : null;

        super(textures, explosionFrames);

        this.unit.name = data.name || "";
        this.hp = data.hp || 100;
        this.maxHp = data.maxHp || 100;
        this._percent = this.hp / this.maxHp;

        this.shootNormalData = data.shootNormal || {};
        this.shootNormalData.texture = data.shootNormal ? data.shootNormal.texture : [];
        this.shootNormalData.explosion = hitFrames;
        this.shootNormalData.guard = guardFrames;

        this.shootBigData = data.shootBig || {};
        this.shootBigData.texture = data.shootBig ? data.shootBig.texture : [];
        this.shootBigData.explosion = hitFrames;
        this.shootBigData.guard = guardFrames;

        this.shoot3wayData = data.shoot3way || {};
        this.shoot3wayData.texture = data.shootNormal ? data.shootNormal.texture : [];
        this.shoot3wayData.explosion = hitFrames;
        this.shoot3wayData.guard = guardFrames;

        const barrierTextures = data.barrier && data.barrier.texture ? data.barrier.texture : [];
        this.barrier = createAnimatedSprite(barrierTextures);
        this.barrier.animationSpeed = 0.15;
        this.barrier.hitArea = new PIXI.Rectangle(2, 2, this.barrier.width, this.barrier.height);
        this.barrier.interactive = false;
        this.barrier.buttonMode = false;
        this.barrier.play();
        this.barrier.visible = false;

        this.barrierEffect = new PIXI.Sprite(barrierEffectTexture);
        this.barrierEffect.visible = false;
        this.barrierEffect.interactive = false;
        this.barrierEffect.buttonMode = false;
        this.barrierEffect.anchor.set(0.5);

        this.shootOn = 0;
        this.bulletList = [];
        this.bulletFrameCnt = 0;
        this.bulletIdCnt = 0;
        this.shootSpeed = 0;
        this.shootInterval = 0;
        this.shootData = {};
        this.shootMode = undefined;

        this.unitX = 0;
        this.unitY = 0;

        this.unit.hitArea = new PIXI.Rectangle(
            7, 20,
            this.unit.width - 14,
            this.unit.height - 40
        );

        this.character.animationSpeed = 0.35;
        this.shadow.animationSpeed = 0.35;
        this.shadowOffsetY = 5;

        this.damageAnimationFlg = false;
        this.barrierFlg = false;

        this.screenDragFlg = false;
        this.beforeX = 0;
        this.beforeY = 0;

        this.keyDownFlg = false;
        this.keyDownCode = "";

        this.dragAreaRect = new PIXI.Graphics();
        this.dragAreaRect.beginFill(0xffffff, 0);
        this.dragAreaRect.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.dragAreaRect.endFill();
        this.dragAreaRect.interactive = true;

        this.tl = null;

        this._keyDownListener = null;
        this._keyUpListener = null;
    }

    get percent() {
        return this._percent;
    }

    set percent(value) {
        this._percent = value;
    }

    onScreenDragStart(event) {
        if (event && event.data && event.data.global) {
            this.unitX = event.data.global.x;
        }
        this.screenDragFlg = true;
    }

    onScreenDragMove(event) {
        if (!this.screenDragFlg) {
            return;
        }

        if (event && event.data && event.data.global) {
            this.unitX = event.data.global.x;
        }

        if (this.unitX <= this.unit.hitArea.width / 2) {
            this.unitX = this.unit.hitArea.width / 2;
        }
        if (this.unitX >= GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width / 2) {
            this.unitX = GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width / 2;
        }
    }

    onScreenDragEnd(event) {
        this.screenDragFlg = false;
    }

    onKeyDown(event) {
        this.keyDownFlg = true;
        this.keyDownCode = event.keyCode;
        event.preventDefault();
    }

    onKeyUp(event) {
        this.keyDownFlg = false;
        event.preventDefault();
    }

    loop() {
        if (this.keyDownFlg) {
            switch (this.keyDownCode) {
            case 37:
                this.unitX -= 6;
                break;
            case 39:
                this.unitX += 6;
                break;
            default:
                break;
            }

            if (this.unitX <= this.unit.hitArea.width / 2) {
                this.unitX = this.unit.hitArea.width / 2;
            }
            if (this.unitX >= GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width / 2) {
                this.unitX = GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width / 2;
            }
        }

        this.unit.x += 0.09 * (this.unitX - (this.unit.x + this.unit.width / 2));
        this.unit.y += 0.09 * (this.unitY - this.unit.y);

        this.barrier.x = this.unit.x + this.unit.width / 2 - this.barrier.width / 2;
        this.barrier.y = this.unit.y - 15;

        this.bulletFrameCnt += 1;

        if (this.shootOn && this.bulletFrameCnt % (this.shootInterval - this.shootSpeed) === 0) {
            this.shoot();
        }

        for (let i = 0; i < this.bulletList.length; i += 1) {
            const bullet = this.bulletList[i];
            bullet.unit.x += 3.5 * Math.cos(bullet.unit.rotation);
            bullet.unit.y += 3.5 * Math.sin(bullet.unit.rotation);

            if (bullet.unit.y <= 40
                || bullet.unit.x <= -bullet.unit.width
                || bullet.unit.x >= GAME_DIMENSIONS.WIDTH) {
                this.bulletRemove(bullet);
                this.bulletRemoveComplete(bullet);
            }
        }
    }

    shoot() {
        switch (this.shootMode) {
        case Player.SHOOT_NAME_NORMAL: {
            const bullet = new Bullet(this.shootNormalData);
            bullet.unit.rotation = 270 * Math.PI / 180;
            bullet.unit.x = this.unit.x + 5 * Math.sin(bullet.unit.rotation) + 14;
            bullet.unit.y = this.unit.y + 5 * Math.sin(bullet.unit.rotation) + 11;
            bullet.name = Player.SHOOT_NAME_NORMAL;
            bullet.id = this.bulletIdCnt;
            this.bulletIdCnt += 1;
            bullet.shadowReverse = false;
            bullet.shadowOffsetY = 0;
            bullet.on(Bullet.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, bullet));
            bullet.on(Bullet.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, bullet));
            this.addChild(bullet);
            this.bulletList.push(bullet);
            stop("se_shoot");
            play("se_shoot");
            break;
        }
        case Player.SHOOT_NAME_BIG: {
            const bullet = new Bullet(this.shootBigData);
            bullet.unit.rotation = 270 * Math.PI / 180;
            bullet.unit.x = this.unit.x + 5 * Math.sin(bullet.unit.rotation) + 10;
            bullet.unit.y = this.unit.y + 5 * Math.sin(bullet.unit.rotation) + 22;
            bullet.name = Player.SHOOT_NAME_BIG;
            bullet.id = this.bulletIdCnt;
            this.bulletIdCnt += 1;
            bullet.shadowReverse = false;
            bullet.shadowOffsetY = 0;
            bullet.on(Bullet.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, bullet));
            bullet.on(Bullet.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, bullet));
            this.addChild(bullet);
            this.bulletList.push(bullet);
            stop("se_shoot_b");
            play("se_shoot_b");
            break;
        }
        case Player.SHOOT_NAME_3WAY: {
            for (let i = 0; i < 3; i += 1) {
                const bullet = new Bullet(this.shoot3wayData);
                if (i === 0) {
                    bullet.unit.rotation = 280 * Math.PI / 180;
                    bullet.unit.x = this.unit.x + 5 * Math.cos(bullet.unit.rotation) + 14;
                    bullet.unit.y = this.unit.y + 5 * Math.sin(bullet.unit.rotation) + 11;
                } else if (i === 1) {
                    bullet.unit.rotation = 270 * Math.PI / 180;
                    bullet.unit.x = this.unit.x + 5 * Math.cos(bullet.unit.rotation) + 10;
                    bullet.unit.y = this.unit.y + 5 * Math.sin(bullet.unit.rotation) + 11;
                } else if (i === 2) {
                    bullet.unit.rotation = 260 * Math.PI / 180;
                    bullet.unit.x = this.unit.x + 5 * Math.cos(bullet.unit.rotation) + 6;
                    bullet.unit.y = this.unit.y + 5 * Math.sin(bullet.unit.rotation) + 11;
                }

                bullet.id = this.bulletIdCnt;
                this.bulletIdCnt += 1;
                bullet.shadowReverse = false;
                bullet.shadowOffsetY = 0;
                bullet.on(Bullet.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, bullet));
                bullet.on(Bullet.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, bullet));
                this.addChild(bullet);
                this.bulletList.push(bullet);
            }
            stop("se_shoot");
            play("se_shoot");
            break;
        }
        default:
            break;
        }
    }

    bulletRemove(bullet) {
        for (let i = 0; i < this.bulletList.length; i += 1) {
            if (bullet.id === this.bulletList[i].id) {
                this.bulletList.splice(i, 1);
                break;
            }
        }
    }

    bulletRemoveComplete(bullet) {
        bullet.off(Bullet.CUSTOM_EVENT_DEAD, this.bulletRemove.bind(this, bullet));
        bullet.off(Bullet.CUSTOM_EVENT_DEAD_COMPLETE, this.bulletRemoveComplete.bind(this, bullet));
        if (bullet.parent === this) {
            this.removeChild(bullet);
        }
    }

    shootModeChange(mode) {
        this.shootMode = mode;

        switch (this.shootMode) {
        case Player.SHOOT_NAME_NORMAL:
            this.shootData = this.shootNormalData;
            this.shootInterval = this.shootData.interval;
            break;
        case Player.SHOOT_NAME_BIG:
            this.shootData = this.shootBigData;
            this.shootInterval = this.shootData.interval;
            break;
        case Player.SHOOT_NAME_3WAY:
            this.shootData = this.shoot3wayData;
            this.shootInterval = this.shootData.interval;
            break;
        default:
            break;
        }

        play("g_powerup_voice");
    }

    shootSpeedChange(speed) {
        switch (speed) {
        case Player.SHOOT_SPEED_NORMAL:
            this.shootSpeed = 0;
            break;
        case Player.SHOOT_SPEED_HIGH:
            this.shootSpeed = 15;
            break;
        default:
            break;
        }

        play("g_powerup_voice");
    }

    setUp(hp, shootMode, shootSpeed) {
        this.hp = hp;
        this._percent = this.hp / this.maxHp;
        this.shootMode = shootMode;

        switch (this.shootMode) {
        case Player.SHOOT_NAME_NORMAL:
            this.shootData = this.shootNormalData;
            this.shootInterval = this.shootData.interval;
            break;
        case Player.SHOOT_NAME_BIG:
            this.shootData = this.shootBigData;
            this.shootInterval = this.shootData.interval;
            break;
        case Player.SHOOT_NAME_3WAY:
            this.shootData = this.shoot3wayData;
            this.shootInterval = this.shootData.interval;
            break;
        default:
            break;
        }

        switch (shootSpeed) {
        case Player.SHOOT_SPEED_NORMAL:
            this.shootSpeed = 0;
            break;
        case Player.SHOOT_SPEED_HIGH:
            this.shootSpeed = 15;
            break;
        default:
            break;
        }
    }

    shootStop() {
        this.shootOn = 0;
    }

    shootStart() {
        this.shootOn = 1;
    }

    barrierStart() {
        play("se_barrier_start");
        this.barrierFlg = true;
        this.barrier.alpha = 0;
        this.barrier.visible = true;

        this.barrierEffect.x = this.unit.x + this.unit.width / 2;
        this.barrierEffect.y = this.unit.y - 15 + this.barrier.height / 2;
        this.barrierEffect.alpha = 1;
        this.barrierEffect.visible = true;
        this.barrierEffect.scale.set(0.5);

        TweenMax.to(this.barrierEffect.scale, 0.4, {
            x: 1,
            y: 1,
            ease: Quint.easeOut,
        });
        TweenMax.to(this.barrierEffect, 0.5, { alpha: 0 });

        if (this.tl) {
            this.tl.kill();
            this.tl = null;
        }

        this.tl = new TimelineMax({
            onComplete: function onBarrierEnd() {
                this.barrier.visible = false;
                this.barrierFlg = false;
                this.barrierEffect.visible = false;
                play("se_barrier_end");
            },
            onCompleteScope: this,
        });

        this.tl.to(this.barrier, 0.3, { alpha: 1 }, "+=0")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=4.0")
            .to(this.barrier, 1, { alpha: 1 }, "+=0")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=1")
            .to(this.barrier, 1, { alpha: 1 }, "+=0")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.5")
            .to(this.barrier, 0.5, { alpha: 1 }, "+=0")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.5")
            .to(this.barrier, 0.5, { alpha: 1 }, "+=0")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 1; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 1; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 1; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 1; }, null, this, "+=0.1")
            .call(function () { this.barrier.alpha = 0; }, null, this, "+=0.1");
    }

    barrierHitEffect() {
        this.barrier.tint = 0xff0000;
        TweenMax.to(this.barrier, 0.2, { tint: 0xffffff });
        play("se_guard");
    }

    spFire() {}

    onDamage(amount) {
        if (this.barrierFlg) {
            return;
        }

        if (this.damageAnimationFlg) {
            return;
        }

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
        }

        this._percent = this.hp / this.maxHp;

        if (this.hp <= 0) {
            this.dead();
        } else {
            const tl = new TimelineMax({
                onComplete: function () {
                    this.damageAnimationFlg = false;
                }.bind(this),
            });
            tl.to(this.unit, 0.15, { delay: 0, y: this.unit.y + 2, tint: 0xff0000, alpha: 0.2 });
            tl.to(this.unit, 0.15, { delay: 0, y: this.unit.y - 2, tint: 0xffffff, alpha: 1 });
            tl.to(this.unit, 0.15, { delay: 0.05, y: this.unit.y + 2, tint: 0xff0000, alpha: 0.2 });
            tl.to(this.unit, 0.15, { delay: 0, y: this.unit.y - 2, tint: 0xffffff, alpha: 1 });
            tl.to(this.unit, 0.15, { delay: 0.05, y: this.unit.y + 2, tint: 0xff0000, alpha: 0.2 });
            tl.to(this.unit, 0.15, { delay: 0, y: this.unit.y + 0, tint: 0xffffff, alpha: 1 });
            tl.to(this.unit, 0.15, { delay: 0.05, y: this.unit.y + 2, tint: 0xff0000, alpha: 0.2 });
            tl.to(this.unit, 0.15, { delay: 0, y: this.unit.y + 0, tint: 0xffffff, alpha: 1 });

            play("g_damage_voice");
            play("se_damage");
        }

        this.damageAnimationFlg = true;
    }

    dead() {
        this.emit(Player.CUSTOM_EVENT_DEAD);
        this.shootStop();

        if (this.explosion) {
            this.explosion.onComplete = this.explosionComplete.bind(this);
            this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2;
            this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2;
            if (this.explosion.parent !== this) {
                this.addChild(this.explosion);
            }
            this.explosion.play();
        }

        if (this.unit.parent === this) {
            this.removeChild(this.unit);
        }
        if (this.shadow && this.shadow.parent) {
            this.shadow.parent.removeChild(this.shadow);
        }

        for (let i = 0; i < this.bulletList.length; i += 1) {
            const bullet = this.bulletList[i];
            if (bullet.parent === this) {
                this.removeChild(bullet);
            }
        }

        play("se_explosion");
        play("g_continue_no_voice0");
    }

    explosionComplete() {
        this.emit(Player.CUSTOM_EVENT_DEAD_COMPLETE);
        if (this.explosion && this.explosion.parent) {
            this.explosion.parent.removeChild(this.explosion);
        }
    }

    castAdded(parent) {
        super.castAdded(parent);

        this.addChild(this.barrier);
        this.addChild(this.barrierEffect);
        this.addChild(this.dragAreaRect);

        this.dragAreaRect.on("pointerdown", this.onScreenDragStart.bind(this));
        this.dragAreaRect.on("pointerup", this.onScreenDragEnd.bind(this));
        this.dragAreaRect.on("pointerupoutside", this.onScreenDragEnd.bind(this));
        this.dragAreaRect.on("pointermove", this.onScreenDragMove.bind(this));

        this._keyDownListener = this.onKeyDown.bind(this);
        this._keyUpListener = this.onKeyUp.bind(this);
        document.addEventListener("keydown", this._keyDownListener);
        document.addEventListener("keyup", this._keyUpListener);

        this.damageAnimationFlg = false;
    }

    castRemoved(parent) {
        if (this._isDisposing || this.destroyed) {
            return;
        }

        this.dragAreaRect.off("pointerdown");
        this.dragAreaRect.off("pointerup");
        this.dragAreaRect.off("pointerupoutside");
        this.dragAreaRect.off("pointermove");

        if (this._keyDownListener) {
            document.removeEventListener("keydown", this._keyDownListener);
        }
        if (this._keyUpListener) {
            document.removeEventListener("keyup", this._keyUpListener);
        }
        this._keyDownListener = null;
        this._keyUpListener = null;

        super.castRemoved(parent);
    }
}

export default Player;
