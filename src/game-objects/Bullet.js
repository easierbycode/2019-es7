import { BaseUnit } from "./BaseUnit.js";
import { PLAYER_STATES } from "../enums/player-boss-states.js";
import { play, stop } from "../soundManager.js";

export class Bullet extends BaseUnit {
    constructor(data = {}) {
        const textures = Array.isArray(data.texture) ? data.texture : [];
        const explosion = Array.isArray(data.explosion) ? data.explosion : null;

        super(textures, explosion);

        this.name = data.name || "";
        this.unit.name = data.name || "";
        this.damage = data.damage || 1;
        this.speed = data.speed || 1;
        this.hp = data.hp || 1;
        this.score = data.score || 0;
        this.spgage = data.spgage || 0;
        this.guardTexture = data.guard || null;
        this.deadFlg = false;

        this.shadow.visible = false;

        this.unit.hitArea = new PIXI.Rectangle(
            0,
            0,
            this.unit.width,
            this.unit.height
        );

        this.rotX = 0;
        this.rotY = 0;
        this.cont = 0;
        this.start = 0;
        this.player = null;
        this.targetX = null;
    }

    loop() {
        if (this.rotX) {
            this.unit.x += this.rotX * this.speed;
            this.unit.y += this.rotY * this.speed;
        } else if (this.name === "meka") {
            this.cont += 1;
            if (this.cont >= this.start) {
                if (!this.targetX && this.player) {
                    this.targetX = this.player.x;
                }
                if (this.targetX) {
                    this.unit.x += 0.009 * (this.targetX - this.unit.x);
                }
                this.unit.y += Math.cos(this.cont / 5) + 2.5 * this.speed;
            }
        } else {
            this.unit.y += this.speed;
        }
    }

    onDamage(damage, enemyHp) {
        if (this.deadFlg) {
            return;
        }

        this.hp -= damage;

        if (this.hp <= 0) {
            this.dead(enemyHp);
            this.deadFlg = true;
        } else {
            TweenMax.to(this.character, 0.1, { tint: 0xff0000 });
            TweenMax.to(this.character, 0.1, { delay: 0.1, tint: 0xffffff });
        }

        if (this.explosion) {
            this.explosion.onComplete = function onExplosionHit(sprite) {
                if (sprite.parent) {
                    sprite.parent.removeChild(sprite);
                }
            }.bind(this, this.explosion);
            this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2;
            this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2 - 10;
            if (enemyHp === "infinity" && this.guardTexture) {
                this.explosion.textures = this.guardTexture;
            }
            if (this.explosion.parent !== this) {
                this.addChild(this.explosion);
            }
            this.explosion.play();
        }

        if (enemyHp === "infinity") {
            stop("se_guard");
            play("se_guard");
        } else if (this.name === PLAYER_STATES.SHOOT_NAME_NORMAL
            || this.name === PLAYER_STATES.SHOOT_NAME_3WAY) {
            stop("se_damage");
            play("se_damage");
        } else if (this.name === PLAYER_STATES.SHOOT_NAME_BIG) {
            stop("se_damage");
            play("se_damage");
        }
    }

    dead(enemyHp) {
        this.emit(Bullet.CUSTOM_EVENT_DEAD);

        if (this.unit.parent) {
            this.unit.parent.removeChild(this.character);
            this.unit.parent.removeChild(this.shadow);
        }
        if (this.unit.parent === this) {
            this.removeChild(this.unit);
        }

        if (this.explosion) {
            this.explosion.onComplete = this.explosionComplete.bind(this);
            this.explosion.x = this.unit.x + this.unit.width / 2 - this.explosion.width / 2;
            this.explosion.y = this.unit.y + this.unit.height / 2 - this.explosion.height / 2 - 10;
            if (this.explosion.parent !== this) {
                this.addChild(this.explosion);
            }
            this.explosion.play();
        }
    }

    explosionComplete() {
        if (this.explosion && this.explosion.parent) {
            this.explosion.parent.removeChild(this.explosion);
        }
        if (this.explosion) {
            this.explosion.destroy();
        }
        this.emit(Bullet.CUSTOM_EVENT_DEAD_COMPLETE);
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

export default Bullet;
