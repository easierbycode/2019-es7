import { GAME_DIMENSIONS } from "../constants.js";
import { play } from "../soundManager.js";
import { Boss, isFrameObject, toTexture } from "./Boss.js";

export class BossBison extends Boss {
    constructor(data = {}) {
        const anim = data.anim || {};

        if (anim.idle && anim.idle.length > 0 && !isFrameObject(anim.idle[0])) {
            for (let i = 0; i < anim.idle.length; i += 1) {
                anim.idle[i] = toTexture(anim.idle[i]);
            }
            for (let i = 0; i < anim.attack.length; i += 1) {
                anim.attack[i] = toTexture(anim.attack[i]);
            }
        }

        super(data);

        this.unit.hitArea = new PIXI.Rectangle(
            10,
            20,
            Math.max(1, this.unit.width - 20),
            Math.max(1, this.unit.height - 30)
        );
        this.dengerousBalloon.y = 20;
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
            play("boss_bison_voice_add");
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

        const upY = GAME_DIMENSIONS.HEIGHT / 4;
        const downY = GAME_DIMENSIONS.HEIGHT - this.unit.height + 30;

        this.tlShoot = new TimelineMax({
            delay: 0.5,
            onComplete: this.shootStart,
            onCompleteScope: this,
        });

        const seed = Math.random();

        if (seed >= 0 && seed <= 0.6) {
            const targetX = Math.random() > 0.6
                ? GAME_DIMENSIONS.CENTER_X - this.unit.hitArea.width / 2
                : (GAME_DIMENSIONS.WIDTH - this.unit.hitArea.width) * Math.random();

            this.tlShoot.to(this.unit, 0.3, { x: targetX });
            this.tlShoot.addCallback(this.onStraightAttack, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.5, { y: upY - 10 });
            this.tlShoot.addCallback(this.onStraightAttackVoice, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.35, { y: downY });
            this.tlShoot.to(this.unit, 0.2, { y: upY });
            this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this);
            this.tlShoot.addCallback(() => {}, "+=0.5", null, this);
            return;
        }

        if (seed >= 0.61 && seed <= 0.8) {
            this.tlShoot.to(this.unit, 0.4, { x: 0, y: upY - 20 });
            this.tlShoot.to(this.unit, 0.4, { x: 170, y: upY + 0 }, "+=0.2");
            this.tlShoot.addCallback(this.onFaintVoice, "-=0.2", null, this);
            this.tlShoot.to(this.unit, 0.4, { x: 0, y: upY + 30 });
            this.tlShoot.to(this.unit, 0.4, { x: 170, y: upY + 60 });
            this.tlShoot.addCallback(this.onFaintAttack, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.3, { x: 170, y: downY }, "+=0.2");
            this.tlShoot.to(this.unit, 0.2, { y: upY });
            this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this);
            this.tlShoot.addCallback(() => {}, "+=1", null, this);
            return;
        }

        if (seed >= 0.81 && seed <= 1) {
            this.tlShoot.to(this.unit, 0.4, { x: 170, y: upY - 20 });
            this.tlShoot.to(this.unit, 0.4, { x: 0, y: upY + 0 }, "+=0.2");
            this.tlShoot.addCallback(this.onFaintVoice, "-=0.2", null, this);
            this.tlShoot.to(this.unit, 0.4, { x: 170, y: upY + 30 });
            this.tlShoot.to(this.unit, 0.4, { x: 0, y: upY + 60 });
            this.tlShoot.addCallback(this.onFaintAttack, "+=0", null, this);
            this.tlShoot.to(this.unit, 0.3, { x: 0, y: downY }, "+=0.2");
            this.tlShoot.to(this.unit, 0.2, { y: upY });
            this.tlShoot.addCallback(this.onIdle, "+=0.05", null, this);
            this.tlShoot.addCallback(() => {}, "+=1", null, this);
        }
    }

    onIdle() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.play();
        this.shadow.play();
    }

    onStraightAttack() {
        this.character.textures = this.animList.attack;
        this.shadow.textures = this.animList.attack;
        this.character.play();
        this.shadow.play();
    }

    onStraightAttackVoice() {
        play("boss_bison_voice_punch");
    }

    onFaintVoice() {
        play("boss_bison_voice_faint");
    }

    onFaintAttack() {
        this.character.textures = this.animList.attack;
        this.shadow.textures = this.animList.attack;
        this.character.play();
        this.shadow.play();
        play("boss_bison_voice_faint_punch");
    }

    onDead() {
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
        play("boss_bison_voice_ko");
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

export default BossBison;
