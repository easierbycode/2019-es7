import { GAME_DIMENSIONS } from "../constants.js";
import { play } from "../soundManager.js";
import { Boss, isFrameObject, toTexture } from "./Boss.js";

export class BossFang extends Boss {
    constructor(data = {}) {
        const anim = data.anim || {};

        if (anim.idle && anim.idle.length > 0 && !isFrameObject(anim.idle[0])) {
            for (let i = 0; i < anim.idle.length; i += 1) {
                anim.idle[i] = toTexture(anim.idle[i]);
            }
            for (let i = 0; i < anim.wait.length; i += 1) {
                anim.wait[i] = toTexture(anim.wait[i]);
            }
            for (let i = 0; i < anim.charge.length; i += 1) {
                anim.charge[i] = toTexture(anim.charge[i]);
            }
            for (let i = 0; i < anim.shoot.length; i += 1) {
                anim.shoot[i] = toTexture(anim.shoot[i]);
            }
            if (data.projectileDataA && Array.isArray(data.projectileDataA.texture)) {
                for (let i = 0; i < data.projectileDataA.texture.length; i += 1) {
                    data.projectileDataA.texture[i] = toTexture(data.projectileDataA.texture[i]);
                }
                data.projectileDataA.name = "beam";
                data.projectileDataA.cnt = 0;
            }
            if (data.projectileDataB && Array.isArray(data.projectileDataB.texture)) {
                for (let i = 0; i < data.projectileDataB.texture.length; i += 1) {
                    data.projectileDataB.texture[i] = toTexture(data.projectileDataB.texture[i]);
                }
                data.projectileDataB.name = "smoke";
                data.projectileDataB.cnt = 0;
            }
            if (data.projectileDataC && Array.isArray(data.projectileDataC.texture)) {
                for (let i = 0; i < data.projectileDataC.texture.length; i += 1) {
                    data.projectileDataC.texture[i] = toTexture(data.projectileDataC.texture[i]);
                }
                data.projectileDataC.name = "meka";
            }
            data.projectileData = data.projectileDataA;
        }

        super(data);

        this.unit.hitArea = new PIXI.Rectangle(
            35,
            55,
            Math.max(1, this.unit.width - 70),
            Math.max(1, this.unit.height - 70)
        );
        this.dengerousBalloon.x = 70;
        this.dengerousBalloon.y = 40;

        this.projectileDataA = data.projectileDataA;
        this.projectileDataB = data.projectileDataB;
        this.projectileDataC = data.projectileDataC;

        if (this.shadow && this.shadow.parent === this.unit) {
            this.unit.removeChild(this.shadow);
        }
    }

    loop() {
        if (this.moveFlg) {
            if (this.unit.y >= 48) {
                this.moveFlg = false;
            }
            this.unit.y += 0.7;
            return;
        }

        if (this.shootOn && this.bulletFrameCnt % this.interval === 0) {
            this.shootOn = false;
            play("boss_fang_voice_add");
            TweenMax.delayedCall(1, () => {
                this.shootStart();
            });
        }

        this.bulletFrameCnt += 1;
    }

    shootStart() {
        if (this.tlShoot) {
            this.tlShoot.kill();
        }

        this.tlShoot = new TimelineMax({
            delay: 0.5,
            onComplete: this.shootStart,
            onCompleteScope: this,
        });

        const seed = Math.random();

        if (seed >= 0 && seed <= 0.3) {
            this.projectileData = this.projectileDataA;
            this.tlShoot.addCallback(this.onCharge, "+=0", null, this);
            this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this);
            this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this);
            this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this);
            this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this);
            this.tlShoot.addCallback(this.onShoot, "+=0.5", null, this);
            this.tlShoot.addCallback(this.onBeamVoice2, "+=0.0", null, this);
            this.tlShoot.addCallback(this.onIdle, "+=0.3", null, this);
            this.tlShoot.addCallback(() => {}, "+=1", null, this);
            return;
        }

        if (seed >= 0.31 && seed <= 0.7) {
            this.projectileData = this.projectileDataC;
            play("boss_fang_voice_beam1");
            this.tlShoot.addCallback(this.shoot, "+=0.0", null, this);
            this.tlShoot.addCallback(this.onWait, "+=0.5", null, this);
            this.tlShoot.addCallback(() => {}, "+=4", null, this);
            return;
        }

        if (seed >= 0.71 && seed <= 1) {
            this.projectileData = this.projectileDataB;
            this.tlShoot.addCallback(this.onSmoke, "+=0", null, this);
            this.tlShoot.addCallback(this.onWait, "+=1.0", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(this.shoot, "+=0.3", null, this);
            this.tlShoot.addCallback(() => {}, "+=7", null, this);
        }
    }

    onCharge() {
        this.character.textures = this.animList.charge;
        this.shadow.textures = this.animList.charge;
        this.character.play();
        this.shadow.play();
    }

    onBeamVoice2() {
        play("boss_fang_voice_beam0");
    }

    onBeamVoice() {
        play("boss_fang_voice_beam1");
    }

    onShoot() {
        this.character.textures = this.animList.shoot;
        this.shadow.textures = this.animList.shoot;
        this.character.play();
        this.shadow.play();
        this.shoot();
        this.character.loop = false;
        this.shadow.loop = false;
    }

    onSmoke() {
        play("boss_fang_voice_projectile");
    }

    onIdle() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.play();
        this.shadow.play();
        this.character.loop = true;
        this.shadow.loop = true;
    }

    onWait() {
        this.character.textures = this.animList.wait;
        this.shadow.textures = this.animList.wait;
        this.character.play();
        this.shadow.play();
        this.character.loop = true;
        this.shadow.loop = true;
    }

    onDead() {
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
        play("boss_fang_voice_ko");
    }

    castAdded(parent) {
        super.castAdded(parent);
        this.tlShoot = new TimelineMax();
        this.unit.y = -249;
    }

    castRemoved(parent) {
        super.castRemoved(parent);
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
    }
}

export default BossFang;
