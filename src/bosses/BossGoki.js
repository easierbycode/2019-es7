import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { play } from "../soundManager.js";
import { Boss, isFrameObject, toTexture } from "./Boss.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

function playerUnitOrFallback() {
    if (gameState.player && gameState.player.unit) {
        return gameState.player.unit;
    }

    return {
        x: GAME_DIMENSIONS.CENTER_X,
        width: 0,
    };
}

export class BossGoki extends Boss {
    constructor(data = {}) {
        const anim = data.anim || {};

        if (anim.idle && anim.idle.length > 0 && !isFrameObject(anim.idle[0])) {
            for (let i = 0; i < anim.idle.length; i += 1) {
                anim.idle[i] = toTexture(anim.idle[i]);
            }
            for (let i = 0; i < anim.syngoku.length; i += 1) {
                anim.syngoku[i] = toTexture(anim.syngoku[i]);
            }
            for (let i = 0; i < anim.syngokuFinish.length; i += 1) {
                anim.syngokuFinish[i] = toTexture(anim.syngokuFinish[i]);
            }
            for (let i = 0; i < anim.syngokuFinishTen.length; i += 1) {
                anim.syngokuFinishTen[i] = toTexture(anim.syngokuFinishTen[i]);
            }
            for (let i = 0; i < anim.shootA.length; i += 1) {
                anim.shootA[i] = toTexture(anim.shootA[i]);
            }
            for (let i = 0; i < anim.shootB.length; i += 1) {
                anim.shootB[i] = toTexture(anim.shootB[i]);
            }
            if (data.projectileDataA && Array.isArray(data.projectileDataA.texture)) {
                for (let i = 0; i < data.projectileDataA.texture.length; i += 1) {
                    data.projectileDataA.texture[i] = toTexture(data.projectileDataA.texture[i]);
                }
            }
            if (data.projectileDataB && Array.isArray(data.projectileDataB.texture)) {
                for (let i = 0; i < data.projectileDataB.texture.length; i += 1) {
                    data.projectileDataB.texture[i] = toTexture(data.projectileDataB.texture[i]);
                }
            }
            data.projectileData = data.projectileDataA;
        }

        super(data);

        if (data.projectileDataA) {
            data.projectileDataA.explosion = data.explosion;
        }
        if (data.projectileDataB) {
            data.projectileDataB.explosion = data.explosion;
        }

        this.unit.hitArea = new PIXI.Rectangle(
            15,
            20,
            Math.max(1, this.unit.width - 30),
            Math.max(1, this.unit.height - 24)
        );
        this.dengerousBalloon.x = 5;
        this.dengerousBalloon.y = 20;

        this.projectileDataA = data.projectileDataA;
        this.projectileDataB = data.projectileDataB;

        this.shungokuHitEffectTextureList = [];
        for (let i = 0; i < 5; i += 1) {
            this.shungokuHitEffectTextureList[i] = PIXI.Texture.fromFrame("hit" + String(i) + ".gif");
        }
    }

    loop() {}

    shootStart() {
        if (this.tlShoot) {
            this.tlShoot.kill();
        }

        const playerUnit = playerUnitOrFallback();
        const edge = this.unit.width - this.unit.hitArea.width;
        let targetX = playerUnit.x + playerUnit.width / 2 - this.unit.width / 2;

        if (targetX - edge / 2 <= -edge / 2) {
            targetX = -edge / 2;
        }
        if (targetX >= GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width - edge / 2) {
            targetX = GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width - edge / 2;
        }

        this.tlShoot = new TimelineMax({
            delay: 0.5,
            onComplete: this.shootStart,
            onCompleteScope: this,
        });

        const seed = Math.random();

        if (seed >= 0 && seed <= 0.34) {
            this.tlShoot.to(this.unit, 0.4, { x: targetX });

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                play("boss_goki_voice_projectile0");
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                play("boss_goki_voice_projectile0");
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                play("boss_goki_voice_projectile0");
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onShootA, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataA;
                this.shoot();
            }, "+=0.32", null, this);

            this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
            return;
        }

        if (seed >= 0.35 && seed <= 0.64) {
            this.tlShoot.to(this.unit, 0.4, { x: targetX });
            this.tlShoot.addCallback(this.onShootB, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.projectileData = this.projectileDataB;
                this.shoot();
            }, "+=0.4", null, this);
            this.tlShoot.addCallback(this.onIdle, "+=0.8", null, this);
            return;
        }

        if (seed >= 0.65 && seed <= 0.89) {
            this.tlShoot.addCallback(this.ashuraSenku, "+=0.4", null, this);
            this.tlShoot.to(this.unit, 1.2, {
                y: GAME_DIMENSIONS.HEIGHT - this.unit.height + 80,
            });
            this.tlShoot.to(this.unit, 0.7, {
                x: Math.random() * (GAME_DIMENSIONS.WIDTH - this.unit.width),
                y: GAME_DIMENSIONS.HEIGHT / 4,
            }, "+=0.2");
            this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
            return;
        }

        if (seed >= 0.9 && seed <= 1) {
            const targetY = Math.random > 0.5 ? 60 : GAME_DIMENSIONS.HEIGHT / 4;
            this.tlShoot.addCallback(this.ashuraSenku, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.7, {
                x: Math.random() * (GAME_DIMENSIONS.WIDTH - this.unit.width),
                y: targetY,
            });
            this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
        }
    }

    onIdle() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.play();
        this.shadow.play();
    }

    onShootA() {
        this.character.textures = this.animList.shootA;
        this.shadow.textures = this.animList.shootA;
        this.character.play();
        this.shadow.play();
        this.character.loop = false;
        this.shadow.loop = false;
    }

    onShootB() {
        this.character.textures = this.animList.shootB;
        this.shadow.textures = this.animList.shootB;
        this.character.play();
        this.shadow.play();
        this.character.loop = false;
        this.shadow.loop = false;
        play("boss_goki_voice_projectile1");
    }

    ashuraSenku() {
        this.character.textures = this.animList.syngoku;
        this.shadow.textures = this.animList.syngoku;
        this.character.play();
        this.shadow.play();
        this.character.loop = false;
        this.shadow.loop = false;
        play("boss_goki_voice_ashura");
    }

    toujou() {
        play("boss_goki_voice_add");
    }

    shungokusatsu(targetUnit, isFinalTen = false) {
        play("boss_goki_voice_syungokusatu0");

        const blackout = new PIXI.Graphics();
        blackout.beginFill(0);
        blackout.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        blackout.endFill();
        this.addChild(blackout);

        const flash = new PIXI.Graphics();
        flash.beginFill(16777215);
        flash.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        flash.endFill();
        flash.alpha = 0;
        this.addChild(flash);

        const tl = new TimelineMax();
        for (let i = 0; i < 10; i += 1) {
            tl.addCallback(() => {
                const effect = createAnimatedSprite(this.shungokuHitEffectTextureList);
                effect.x = targetUnit.x + Math.random() * targetUnit.width;
                effect.y = targetUnit.y + Math.random() * (targetUnit.height / 2);
                effect.animationSpeed = 0.15;
                effect.loop = false;
                effect.onComplete = this.effectComplete.bind(this, effect);
                effect.play();
                play("se_damage");
                this.addChild(effect);
            }, "+=" + String(0.05), null, this);
            tl.addCallback(() => {
                flash.alpha = 0.2;
            }, "+=" + String(0), null, this);
            tl.addCallback(() => {
                flash.alpha = 0;
            }, "+=" + String(0.06), null, this);
        }

        tl.addCallback(() => {
            if (isFinalTen) {
                this.character.textures = this.animList.syngokuFinishTen;
                this.shadow.textures = this.animList.syngokuFinishTen;
            } else {
                this.character.textures = this.animList.syngokuFinish;
                this.shadow.textures = this.animList.syngokuFinish;
            }
        }, "+=0", null, this);

        tl.to(blackout, 0.3, { alpha: 0 }, "+=0.7");
        tl.addCallback(() => {
            play("boss_goki_voice_syungokusatu1");
        }, "-=0.15", null, this);
        tl.addCallback(() => {
            this.character.textures = this.animList.idle;
            this.shadow.textures = this.animList.idle;
            this.character.play();
            this.shadow.play();
            this.character.loop = true;
            this.shadow.loop = true;
        }, "+=1.5", null, this);
    }

    effectComplete(effect) {
        effect.alpha = 0;
        if (effect.parent === this) {
            this.removeChild(effect);
        }
    }

    onDead() {
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
        play("boss_goki_voice_ko");
    }

    castAdded(parent) {
        super.castAdded(parent);
        this.tlShoot = new TimelineMax();

        this.character.textures = this.animList.syngoku;
        this.shadow.textures = this.animList.syngoku;
        this.character.play();
        this.shadow.play();
        this.character.loop = false;
        this.shadow.loop = false;
    }

    castRemoved(parent) {
        super.castRemoved(parent);
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
    }
}

export default BossGoki;
