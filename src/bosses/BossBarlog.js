import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
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

export class BossBarlog extends Boss {
    constructor(data = {}) {
        const anim = data.anim || {};

        if (anim.idle && anim.idle.length > 0 && !isFrameObject(anim.idle[0])) {
            for (let i = 0; i < anim.idle.length; i += 1) {
                anim.idle[i] = toTexture(anim.idle[i]);
            }
            for (let i = 0; i < anim.charge.length; i += 1) {
                anim.charge[i] = toTexture(anim.charge[i]);
            }
            for (let i = 0; i < anim.attack.length; i += 1) {
                anim.attack[i] = toTexture(anim.attack[i]);
            }
            for (let i = 0; i < anim.shoot.length; i += 1) {
                anim.shoot[i] = toTexture(anim.shoot[i]);
            }
            if (data.projectileData && Array.isArray(data.projectileData.texture)) {
                for (let i = 0; i < data.projectileData.texture.length; i += 1) {
                    data.projectileData.texture[i] = toTexture(data.projectileData.texture[i]);
                }
            }
        }

        super(data);

        this.unit.hitArea = new PIXI.Rectangle(
            30,
            20,
            Math.max(1, this.unit.width - 60),
            Math.max(1, this.unit.height - 30)
        );
        this.dengerousBalloon.x = 30;
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
            this.character.stop();
            this.shadow.stop();
            play("boss_barlog_voice_add");
            TweenMax.delayedCall(1, () => {
                this.shootStart();
            });
        }

        this.bulletFrameCnt += 1;
    }

    shootStart() {
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
        const diveY = GAME_DIMENSIONS.HEIGHT - this.unit.height + 34;

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
            const randomX = Math.random() * (GAME_DIMENSIONS.WIDTH - this.unit.width);
            const randomY = Math.random() * (GAME_DIMENSIONS.HEIGHT - 400) + 60;
            this.tlShoot.addCallback(this.onMove, "+=0.0", null, this);
            this.tlShoot.to(this.unit, 0.6, { x: randomX, y: randomY });
            this.tlShoot.addCallback(this.onMoveStop, "+=0.1", null, this);
            return;
        }

        if (seed >= 0.31 && seed <= 0.8) {
            this.tlShoot.addCallback(this.onMove, "+=0.0", null, this);
            this.tlShoot.to(this.unit, 0.3, { x: targetX });
            this.tlShoot.addCallback(this.onShoot, "+=0.4", null, this);
            this.tlShoot.addCallback(this.onMoveStop, "+=0.5", null, this);
            return;
        }

        if (seed >= 0.81 && seed <= 1) {
            this.tlShoot.addCallback(this.onMove, "+=0.0", null, this);
            this.tlShoot.to(this.unit, 0.5, { x: targetX });
            this.tlShoot.addCallback(this.onCharge, "+=0.0", null, this);
            this.tlShoot.addCallback(this.onAttack, "+=0.7", null, this);
            this.tlShoot.to(this.unit, 0.3, { y: baseY - 70 }, "+=0.0");
            this.tlShoot.to(this.unit, 0.6, { y: diveY }, "+=0.1");
            this.tlShoot.to(this.unit, 0.2, { y: baseY }, "+=0.0");
            this.tlShoot.addCallback(this.onMoveStop, "+=0.0", null, this);
        }
    }

    onMove() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.play();
        this.shadow.play();
    }

    onMoveStop() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
        this.character.stop();
        this.shadow.stop();
    }

    onIdle() {
        this.character.textures = this.animList.idle;
        this.shadow.textures = this.animList.idle;
    }

    onCharge() {
        this.character.textures = this.animList.charge;
        this.shadow.textures = this.animList.charge;
        this.character.play();
        this.shadow.play();
    }

    onAttack() {
        this.character.textures = this.animList.attack;
        this.shadow.textures = this.animList.attack;
        this.character.play();
        this.shadow.play();
        play("boss_barlog_voice_barcelona");
    }

    onAttackVoice() {}

    onShoot() {
        this.character.textures = this.animList.shoot;
        this.shadow.textures = this.animList.shoot;
        this.character.play();
        this.shadow.play();
        this.shoot();
        play("boss_barlog_voice_projectile");
    }

    onDead() {
        if (this.tlShoot) {
            this.tlShoot.pause();
            this.tlShoot.kill();
        }
        play("boss_barlog_voice_ko");
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

export default BossBarlog;
