import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { play } from "../soundManager.js";
import { Boss, isFrameObject, toTexture } from "./Boss.js";

function playerUnitOrFallback() {
    if (gameState.player && gameState.player.unit) {
        return gameState.player.unit;
    }

    return {
        x: GAME_DIMENSIONS.CENTER_X,
        width: 0,
    };
}

export class BossVega extends Boss {
    static get CUSTOM_EVENT_GOKI() {
        return CUSTOM_EVENTS.GOKI;
    }

    constructor(data = {}) {
        const anim = data.anim || {};

        if (anim.idle && anim.idle.length > 0 && !isFrameObject(anim.idle[0])) {
            for (let i = 0; i < anim.idle.length; i += 1) {
                anim.idle[i] = toTexture(anim.idle[i]);
            }
            for (let i = 0; i < anim.attack.length; i += 1) {
                anim.attack[i] = toTexture(anim.attack[i]);
            }
            for (let i = 0; i < anim.shoot.length; i += 1) {
                anim.shoot[i] = toTexture(anim.shoot[i]);
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
            if (data.projectileDataB) {
                data.projectileDataB.name = "psychoField";
            }
            data.projectileData = data.projectileDataA;
        }

        super(data);

        this.projectileDataA = data.projectileDataA;
        this.projectileDataB = data.projectileDataB;

        this.unit.hitArea = new PIXI.Rectangle(
            20,
            13,
            Math.max(1, this.unit.width - 40),
            Math.max(1, this.unit.height - 20)
        );
        this.dengerousBalloon.y = 15;

        this.vegaBlur = new PIXI.filters.BlurFilter();
        this.vegaBlur.blur = 0;
        this.character.filters = [this.vegaBlur];

        this.gokiFlg = data.gokiFlg;
    }

    loop() {
        if (this.moveFlg) {
            if (this.unit.y >= GAME_DIMENSIONS.HEIGHT / 4) {
                this.unit.y = GAME_DIMENSIONS.HEIGHT / 4;
                this.moveFlg = false;
            }
            this.unit.y += 1;
            return;
        }

        if (this.shootOn && this.bulletFrameCnt % this.interval === 0) {
            this.shootOn = false;
            if (this.gokiFlg) {
                this.emit(BossVega.CUSTOM_EVENT_GOKI);
            } else {
                play("boss_vega_voice_add");
                TweenMax.delayedCall(1, () => {
                    this.shootStart();
                });
            }
        }

        this.bulletFrameCnt += 1;
    }

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

        const baseY = GAME_DIMENSIONS.HEIGHT / 4;

        this.tlShoot = new TimelineMax({
            delay: 0.5,
            onComplete: this.shootStart,
            onCompleteScope: this,
        });

        const seed = Math.random();

        if (seed >= 0 && seed <= 0.1) {
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 10 });
            this.tlShoot.addCallback(this.onWarp, "+=0", null, this);
            this.tlShoot.addCallback(() => {
                this.unit.x = 0;
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 10 }, "+=0.2");
            this.tlShoot.addCallback(() => {
                this.unit.x = GAME_DIMENSIONS.WIDTH - this.unit.width;
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 10 }, "+=0.2");
            this.tlShoot.addCallback(() => {
                this.unit.x = Math.floor(Math.random() * (GAME_DIMENSIONS.WIDTH - this.unit.width));
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.addCallback(() => {}, "+=0.5", null, this);
            return;
        }

        if (seed >= 0.11 && seed <= 0.4) {
            this.projectileData = this.projectileDataA;

            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 0;
                play("boss_vega_voice_projectile");
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 160;
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 16;
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 128;
                play("boss_vega_voice_projectile");
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 32;
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = 96;
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.vegaBlur, 0.1, { delay: 0.3, blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = GAME_DIMENSIONS.CENTER_X - this.unit.width / 2;
                play("boss_vega_voice_projectile");
                this.onPsychoShoot();
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.addCallback(() => {}, "+=4.0", null, this);
            return;
        }

        if (seed >= 0.41 && seed <= 0.7) {
            this.projectileData = this.projectileDataB;
            this.tlShoot.to(this.unit, 0.3, {
                x: GAME_DIMENSIONS.CENTER_X - this.unit.width / 2,
                y: baseY + 10,
            });
            this.tlShoot.addCallback(() => {
                this.onPsychoFieldAttack();
            }, "+=0.5", null, this);
            this.tlShoot.addCallback(this.onPsychoShoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this);
            this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this);
            this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this);
            this.tlShoot.addCallback(this.onPsychoShoot, "+=1", null, this);
            this.tlShoot.addCallback(this.onIdle, "+=0.0", null, this);
            this.tlShoot.addCallback(() => {}, "+=3.0", null, this);
            return;
        }

        if (seed >= 0.71 && seed <= 1) {
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 15 });
            this.tlShoot.addCallback(() => {
                this.unit.x = targetX;
            }, "+=0", null, this);
            this.tlShoot.to(this.vegaBlur, 0.1, { blur: 0 });

            this.tlShoot.to(this.unit, 0.2, { y: baseY - 20 });
            this.tlShoot.addCallback(this.onAttack, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.9, { y: GAME_DIMENSIONS.HEIGHT - 15 });
            this.tlShoot.addCallback(this.onIdle, "+=0.0", null, this);
            this.tlShoot.addCallback(() => {
                this.unit.x = GAME_DIMENSIONS.CENTER_X - this.unit.width / 2;
                this.unit.y = -this.unit.height;
            }, "+=0.0", null, this);
            this.tlShoot.to(this.unit, 1, { y: baseY });
            this.tlShoot.addCallback(() => {}, "+=1", null, this);
        }
    }

    onIdle() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.play();
        this.shadow.play();
    }

    onPsychoShoot() {
        this.shoot();
    }

    onPsychoFieldShoot() {
        this.shoot();
    }

    onWarp() {
        play("boss_vega_voice_warp");
    }

    onAttack() {
        play("boss_vega_voice_crusher");
        this.character.textures = this.animList.attack;
        this.shadow.textures = this.animList.attack;
        this.character.play();
        this.shadow.play();
    }

    onPsychoFieldAttack() {
        play("boss_vega_voice_shoot");
        this.character.textures = this.animList.shoot;
        this.shadow.textures = this.animList.shoot;
        this.character.play();
        this.shadow.play();
    }

    onDead() {
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
        play("boss_vega_voice_ko");
    }

    castAdded(parent) {
        super.castAdded(parent);
        this.tlShoot = new TimelineMax();
    }

    castRemoved(parent) {
        super.castRemoved(parent);
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
    }
}

export default BossVega;
