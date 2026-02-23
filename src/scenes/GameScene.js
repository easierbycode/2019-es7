import { BaseScene } from "./BaseScene.js";
import { AdvScene } from "./AdvScene.js";
import { ContinueScene } from "./ContinueScene.js";
import {
    BGM_INFO,
    GAME_DIMENSIONS,
    SCENE_NAMES,
    STAGE_DIMENSIONS,
} from "../constants.js";
import { gameState } from "../gameState.js";
import { globals } from "../globals.js";
import { HitTester } from "../HitTester.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { BOSS_STATES } from "../enums/player-boss-states.js";
import { play, bgmPlay, stop } from "../soundManager.js";
import { Player } from "../game-objects/Player.js";
import { Enemy } from "../game-objects/Enemy.js";
import { Bullet } from "../game-objects/Bullet.js";
import { Boss } from "../game-objects/Boss.js";
import { BossBison } from "../game-objects/BossBison.js";
import { BossBarlog } from "../game-objects/BossBarlog.js";
import { BossSagat } from "../game-objects/BossSagat.js";
import { BossVega } from "../game-objects/BossVega.js";
import { BossGoki } from "../game-objects/BossGoki.js";
import { BossFang } from "../game-objects/BossFang.js";
import { HUD } from "../ui/HUD.js";
import { GameTitle } from "../ui/GameTitle.js";
import { StageBackground } from "../ui/StageBackground.js";
import { CutinContainer } from "../ui/CutinContainer.js";
import { BigNumberDisplay } from "../ui/BigNumberDisplay.js";

const AnimatedSpriteClass = PIXI.AnimatedSprite || (PIXI.extras && PIXI.extras.AnimatedSprite);
const TilingSpriteClass = (PIXI.extras && PIXI.extras.TilingSprite) || PIXI.TilingSprite;

function createAnimatedSprite(frames) {
    if (!AnimatedSpriteClass) {
        throw new Error("AnimatedSprite class is not available on PIXI.");
    }
    return new AnimatedSpriteClass(frames || []);
}

function createTilingSprite(texture, width, height) {
    if (!TilingSpriteClass) {
        throw new Error("TilingSprite class is not available on PIXI.");
    }
    return new TilingSpriteClass(texture, width, height);
}

function textureFromFrameSafe(frameName) {
    try {
        return PIXI.Texture.fromFrame(frameName);
    } catch (error) {
        return PIXI.Texture.WHITE;
    }
}

function textureFromResourceSafe(resource) {
    if (resource && resource.url) {
        try {
            return PIXI.Texture.fromImage(resource.url);
        } catch (error) {
            // fallthrough
        }
    }

    if (resource && resource.texture) {
        return resource.texture;
    }

    return PIXI.Texture.WHITE;
}

function removeChildIfPresent(container, child) {
    if (container && child && child.parent === container) {
        container.removeChild(child);
    }
}

function hitTest(a, b) {
    const interaction = globals.interactionManager;
    if (interaction && typeof interaction.hitTestRectangle === "function") {
        return interaction.hitTestRectangle(a, b);
    }

    return HitTester.hitTestFunc(a, b);
}

function parseFlag(value) {
    return value === true || value === "true";
}

function getRecipeData() {
    return globals.resources
        && globals.resources.recipe
        && globals.resources.recipe.data
        ? globals.resources.recipe.data
        : null;
}

function getBossBgmInfo(name) {
    if (!name) {
        return null;
    }

    const key = "boss_" + String(name) + "_bgm";
    return BGM_INFO[key] || null;
}

function removeFromArray(list, target) {
    if (!Array.isArray(list)) {
        return;
    }

    for (let i = 0; i < list.length; i += 1) {
        if (list[i] === target) {
            list.splice(i, 1);
            return;
        }
    }
}

function createItemSprite(textures) {
    const item = createAnimatedSprite(textures);
    item.interactive = true;
    item.animationSpeed = 0.08;
    item.hitArea = new PIXI.Rectangle(0, 0, textures[0] ? textures[0].width : item.width, textures[0] ? textures[0].height : item.height);
    item.play();
    return item;
}

function eventName(klass, key, fallback) {
    if (klass && klass[key]) {
        return klass[key];
    }
    return fallback;
}

function gameWidth() {
    return GAME_DIMENSIONS.WIDTH;
}

function gameHeight() {
    return GAME_DIMENSIONS.HEIGHT;
}

function gameCenterX() {
    return GAME_DIMENSIONS.CENTER_X;
}

export class GameScene extends BaseScene {
    constructor() {
        super(SCENE_NAMES.GAME);

        this.waveInterval = 80;
        this.waveCount = 0;
        this.frameCnt = 0;
        this.frameCntUp = 1;
        this.stageBgAmountMove = 0.7;
        this.enemyWaveFlg = false;
        this.theWorldFlg = false;
        this.sceneSwitch = 0;

        this.enemyHitTestList = [];
        this.itemHitTestList = [];

        this.explosionTextures = [];
        for (let i = 0; i < 7; i += 1) {
            this.explosionTextures[i] = textureFromFrameSafe("explosion0" + String(i) + ".gif");
        }

        this.spExplosionTextures = [];
        for (let i = 0; i < 8; i += 1) {
            this.spExplosionTextures[i] = textureFromFrameSafe("spExplosion0" + String(i) + ".gif");
        }

        this.itemTextureList = {
            powerupBig: [textureFromFrameSafe("powerupBig0.gif"), textureFromFrameSafe("powerupBig1.gif")],
            powerup3way: [textureFromFrameSafe("powerup3way0.gif"), textureFromFrameSafe("powerup3way1.gif")],
            barrier: [textureFromFrameSafe("barrierItem0.gif"), textureFromFrameSafe("barrierItem1.gif")],
            speedup: [textureFromFrameSafe("speedupItem0.gif"), textureFromFrameSafe("speedupItem1.gif")],
        };

        const stageTextures = [];
        for (let i = 0; i < 5; i += 1) {
            stageTextures.push([
                textureFromResourceSafe(globals.resources && globals.resources["stage_end" + String(i)]),
                textureFromResourceSafe(globals.resources && globals.resources["stage_loop" + String(i)]),
            ]);
        }

        this.stageBg = new StageBackground(stageTextures);
        this.addChildAt(this.stageBg, 0);

        this.normalizeRecipeProjectileData();

        const recipeData = getRecipeData();
        const playerData = recipeData && recipeData.playerData ? recipeData.playerData : null;

        if (!playerData) {
            throw new Error("Player data is missing in recipe resource.");
        }

        playerData.explosion = this.explosionTextures;

        this.player = new Player(playerData);
        this.player.on(eventName(Player, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD), this.gameover.bind(this));
        this.player.on(eventName(Player, "CUSTOM_EVENT_DEAD_COMPLETE", CUSTOM_EVENTS.DEAD_COMPLETE), this.gameoverComplete.bind(this));
        gameState.player = this.player;

        this.unitContainer = new PIXI.Container();
        this.addChildAt(this.unitContainer, 1);

        this.bulletContainer = new PIXI.Container();
        this.addChildAt(this.bulletContainer, 2);

        this.hud = new HUD();
        this.hud.on(eventName(HUD, "CUSTOM_EVENT_SP_FIRE", CUSTOM_EVENTS.SP_FIRE), this.spFire.bind(this));
        this.addChildAt(this.hud, 3);

        this.title = new GameTitle();
        this.title.on(eventName(GameTitle, "EVENT_START", CUSTOM_EVENTS.EVENT_START), this.gameStart.bind(this));
        this.addChildAt(this.title, 4);

        this.cutinCont = new CutinContainer();

        this.spLine = new PIXI.Graphics();
        this.spLine.beginFill(0xff0000);
        this.spLine.drawRect(0, 0, 3, 3);
        this.spLine.pivot.y = 3;
        this.spLine.endFill();

        this.cover = createTilingSprite(textureFromFrameSafe("stagebgOver.gif"), STAGE_DIMENSIONS.WIDTH, STAGE_DIMENSIONS.HEIGHT);
        this.addChildAt(this.cover, 4);

        this.boss = null;
        this.bossTimerCountDown = 99;
        this.bossTimerFrameCnt = 0;
        this.bossTimerStartFlg = false;
        this.bigNumTxt = null;
        this.timeTxt = null;

        this.stageEnemyPositionList = [];
        this.stageBgmName = "";
        this._sceneRemovedHandled = false;
    }

    normalizeRecipeProjectileData() {
        const recipeData = getRecipeData();
        if (!recipeData) {
            return;
        }

        const enemyData = recipeData.enemyData || {};
        const enemyKeys = Object.keys(enemyData);
        for (let i = 0; i < enemyKeys.length; i += 1) {
            const enemy = enemyData[enemyKeys[i]];
            if (!enemy) {
                continue;
            }

            if (enemy.projectileData === undefined) {
                enemy.projectileData = enemy.bulletData !== undefined ? enemy.bulletData : null;
            }
        }

        const bossData = recipeData.bossData || {};
        const bossKeys = Object.keys(bossData);
        for (let i = 0; i < bossKeys.length; i += 1) {
            const boss = bossData[bossKeys[i]];
            if (!boss) {
                continue;
            }

            if (boss.projectileData === undefined) {
                boss.projectileData = boss.bulletData !== undefined ? boss.bulletData : null;
            }
            if (boss.projectileDataA === undefined) {
                boss.projectileDataA = boss.bulletDataA;
            }
            if (boss.projectileDataB === undefined) {
                boss.projectileDataB = boss.bulletDataB;
            }
            if (boss.projectileDataC === undefined) {
                boss.projectileDataC = boss.bulletDataC;
            }
        }
    }

    loop() {
        const frame = Number(gameState.frame || 0);
        gameState.frame = frame === 59 ? 0 : frame + 1;

        if (this.theWorldFlg) {
            return;
        }

        this.player.loop();
        this.hud.loop();

        for (let i = 0; i < this.enemyHitTestList.length; i += 1) {
            const enemy = this.enemyHitTestList[i];
            if (!enemy || !enemy.unit) {
                continue;
            }

            if (typeof enemy.loop === "function") {
                enemy.loop(this.stageBgAmountMove);
            }

            const minX = -enemy.unit.width / 2;
            const maxX = gameWidth() - enemy.unit.width / 2;

            if (enemy.unit.y >= 40 && enemy.unit.x >= minX && enemy.unit.x <= maxX) {
                for (let j = 0; j < this.player.bulletList.length; j += 1) {
                    const bullet = this.player.bulletList[j];
                    if (!bullet || !bullet.unit) {
                        continue;
                    }

                    if (hitTest(enemy.unit, bullet.unit)) {
                        switch (this.player.shootMode) {
                        case Player.SHOOT_NAME_NORMAL:
                            enemy.onDamage(bullet.damage);
                            bullet.onDamage(1, enemy.hp);
                            break;
                        case Player.SHOOT_NAME_BIG: {
                            const idKey = "bulletid" + String(bullet.id);
                            const frameKey = "bulletframeCnt" + String(bullet.id);

                            if (enemy[idKey] == null) {
                                enemy[idKey] = 0;
                                enemy[frameKey] = 0;
                                enemy.onDamage(bullet.damage);
                                bullet.onDamage(1, enemy.hp);
                            } else {
                                enemy[frameKey] += 1;
                                if (enemy[frameKey] % 15 === 0) {
                                    enemy[idKey] += 1;
                                    if (enemy[idKey] <= 1) {
                                        enemy.onDamage(bullet.damage);
                                        bullet.onDamage(1, enemy.hp);
                                    }
                                }
                            }
                            break;
                        }
                        case Player.SHOOT_NAME_3WAY:
                            enemy.onDamage(bullet.damage);
                            bullet.onDamage(1, enemy.hp);
                            break;
                        default:
                            enemy.onDamage(1);
                            bullet.onDamage(1, enemy.hp);
                            break;
                        }
                    }
                }
            }

            if (this.player.barrierFlg) {
                if (hitTest(enemy.unit, this.player.barrier)) {
                    this.player.barrierHitEffect();
                    if (typeof enemy.dead === "function") {
                        enemy.dead();
                    }
                }
            } else if (hitTest(enemy.unit, this.player.unit)) {
                if (enemy.name === "goki") {
                    this.hud.spBtnDeactive();
                    this.theWorldFlg = true;
                    if (this.boss && typeof this.boss.onTheWorld === "function") {
                        this.boss.onTheWorld(this.theWorldFlg);
                    }
                    if (this.boss && typeof this.boss.shungokusatsu === "function") {
                        this.boss.shungokusatsu(this.player.unit, true);
                    }

                    this.player.alpha = 0;
                    if (this.hud.spgaBtn) {
                        this.hud.spgaBtn.alpha = 0;
                    }

                    for (let b = 0; b < this.player.bulletList.length; b += 1) {
                        const playerBullet = this.player.bulletList[b];
                        if (playerBullet) {
                            removeChildIfPresent(this.player, playerBullet);
                        }
                    }

                    TweenMax.delayedCall(1.8, function onGokiHitReappear() {
                        this.player.alpha = 1;
                    }, null, this);

                    TweenMax.delayedCall(1.9, function onGokiHitBg() {
                        this.stageBg.akebonoGokifinish();
                    }, null, this);

                    TweenMax.delayedCall(2.7, function onGokiHitDamage() {
                        this.playerDamage(100);
                    }, null, this);

                    TweenMax.delayedCall(3, function onGokiHitFinish() {
                        this.title.akebonofinish();
                    }, null, this);
                } else {
                    this.playerDamage(1);
                }
            }

            if ((enemy.unit.x <= -50
                || enemy.unit.x >= gameWidth() + 33
                || enemy.unit.y <= -33
                || enemy.unit.y >= gameHeight())
                && enemy.unit.name !== BOSS_STATES.UNIT_NAME) {
                removeChildIfPresent(this.unitContainer, enemy);
                this.enemyHitTestList.splice(i, 1);
                i -= 1;
            }
        }

        for (let i = 0; i < this.itemHitTestList.length; i += 1) {
            const item = this.itemHitTestList[i];
            item.y += 1;

            if (hitTest(item, this.player.unit)) {
                switch (item.name) {
                case Player.SHOOT_SPEED_HIGH:
                    gameState.shootSpeed = item.name;
                    this.player.shootSpeedChange(gameState.shootSpeed);
                    break;
                case Player.BARRIER:
                    this.player.barrierStart();
                    break;
                default:
                    if (this.player.shootMode !== item.name) {
                        gameState.shootSpeed = Player.SHOOT_SPEED_NORMAL;
                        this.player.shootSpeedChange(gameState.shootSpeed);
                    }
                    gameState.shootMode = item.name;
                    this.player.shootModeChange(gameState.shootMode);
                    break;
                }

                removeChildIfPresent(this.unitContainer, item);
                this.itemHitTestList.splice(i, 1);
                i -= 1;
                continue;
            }

            if (item.y >= gameHeight() - 10) {
                removeChildIfPresent(this.unitContainer, item);
                this.itemHitTestList.splice(i, 1);
                i -= 1;
            }
        }

        this.stageBg.loop(this.stageBgAmountMove);

        if (this.enemyWaveFlg) {
            if (this.frameCnt % this.waveInterval === 0) {
                this.enemyWave();
            }
            this.frameCnt += this.frameCntUp;
        }

        if (this.bossTimerStartFlg) {
            if (this.bossTimerFrameCnt % 60 === 0) {
                if (this.bossTimerCountDown <= 0) {
                    this.bossTimerStartFlg = false;
                    this.timeoverComplete();
                }

                if (this.bigNumTxt) {
                    this.bigNumTxt.setNum(this.bossTimerCountDown);
                }
                this.bossTimerCountDown -= 1;
            }
            this.bossTimerFrameCnt += 1;
        }
    }

    enemyWave() {
        if (this.waveCount >= this.stageEnemyPositionList.length) {
            this.bossAdd();
        } else {
            this.enemyAdd();
        }
    }

    enemyAdd() {
        const recipeData = getRecipeData();
        if (!recipeData || !recipeData.enemyData) {
            return;
        }

        const row = this.stageEnemyPositionList[this.waveCount] || [];

        for (let i = 0; i < row.length; i += 1) {
            const code = row[i];
            if (String(code) === "00") {
                continue;
            }

            const enemyType = String(code).substr(0, 1);
            const itemCode = String(code).substr(1, 2);
            const enemyData = recipeData.enemyData["enemy" + enemyType];

            if (!enemyData) {
                continue;
            }

            enemyData.explosion = this.explosionTextures;

            switch (itemCode) {
            case "1":
                enemyData.itemName = Player.SHOOT_NAME_BIG;
                enemyData.itemTexture = this.itemTextureList.powerupBig;
                break;
            case "2":
                enemyData.itemName = Player.SHOOT_NAME_3WAY;
                enemyData.itemTexture = this.itemTextureList.powerup3way;
                break;
            case "3":
                enemyData.itemName = Player.SHOOT_SPEED_HIGH;
                enemyData.itemTexture = this.itemTextureList.speedup;
                break;
            case "9":
                enemyData.itemName = Player.BARRIER;
                enemyData.itemTexture = this.itemTextureList.barrier;
                break;
            default:
                enemyData.itemName = null;
                enemyData.itemTexture = null;
                break;
            }

            const enemy = new Enemy(enemyData);
            enemy.unit.x = 32 * i;
            enemy.unit.y = -32;

            enemy.on(eventName(Enemy, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD), this.enemyRemove.bind(this, enemy));
            enemy.on(eventName(Enemy, "CUSTOM_EVENT_DEAD_COMPLETE", CUSTOM_EVENTS.DEAD_COMPLETE), this.enemyRemoveComplete.bind(this, enemy));
            enemy.on(eventName(Enemy, "CUSTOM_EVENT_PROJECTILE_ADD", CUSTOM_EVENTS.PROJECTILE_ADD), this.projectileAdd.bind(this, enemy));

            this.unitContainer.addChild(enemy);
            this.enemyHitTestList.push(enemy);
        }

        this.waveCount += 1;
    }

    projectileAdd(owner) {
        if (!owner || !owner.projectileData) {
            return;
        }

        const deadEvent = eventName(Bullet, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD);
        const deadCompleteEvent = eventName(Bullet, "CUSTOM_EVENT_DEAD_COMPLETE", CUSTOM_EVENTS.DEAD_COMPLETE);

        switch (owner.projectileData.name) {
        case "beam":
            for (let i = 0; i < 2; i += 1) {
                const startX = i === 0 ? 121 : 141;
                const projectile = new Bullet(owner.projectileData);

                const width = projectile.character.width;
                const height = projectile.character.height;
                let degree = 90;

                switch (owner.projectileData.cnt) {
                case 0:
                    degree = 105;
                    projectile.unit.hitArea = new PIXI.Rectangle(-2.7 * height, width / 2 - 10, height, width / 2);
                    break;
                case 1:
                    degree = 90;
                    projectile.unit.hitArea = new PIXI.Rectangle(-height, width / 2, height, width / 2);
                    break;
                case 2:
                    degree = 75;
                    projectile.unit.hitArea = new PIXI.Rectangle(0.7 * height, width / 2 - 5, height, width / 2);
                    break;
                default:
                    break;
                }

                projectile.character.rotation = degree * Math.PI / 180;
                projectile.rotX = Math.cos(degree * Math.PI / 180);
                projectile.rotY = Math.sin(degree * Math.PI / 180);
                projectile.unit.x = owner.unit.x + startX;
                projectile.unit.y = owner.unit.y + 50;

                projectile.on(deadEvent, this.enemyRemove.bind(this, projectile));
                projectile.on(deadCompleteEvent, this.enemyRemoveComplete.bind(this, projectile));

                this.unitContainer.addChild(projectile);
                this.enemyHitTestList.push(projectile);
            }

            owner.projectileData.cnt = owner.projectileData.cnt >= 2 ? 0 : owner.projectileData.cnt + 1;
            break;

        case "smoke": {
            const degree = 60 * Math.random() + 60;
            const projectile = new Bullet(owner.projectileData);

            projectile.unit.hitArea = new PIXI.Rectangle(
                20,
                20,
                projectile.character.width - 40,
                projectile.character.height - 40
            );
            projectile.rotX = Math.cos(degree * Math.PI / 180);
            projectile.rotY = Math.sin(degree * Math.PI / 180);
            projectile.unit.x = owner.unit.x + owner.unit.width / 2 - 50;
            projectile.unit.y = owner.unit.y + 45;

            projectile.on(deadEvent, this.enemyRemove.bind(this, projectile));
            projectile.on(deadCompleteEvent, this.enemyRemoveComplete.bind(this, projectile));

            projectile.character.loop = false;
            projectile.character.onComplete = function onSmokeAnimComplete() {
                projectile.character.gotoAndPlay(6);
            }.bind(this);

            this.unitContainer.addChild(projectile);
            this.enemyHitTestList.push(projectile);
            break;
        }

        case "meka":
            for (let i = 0; i < 32; i += 1) {
                const projectile = new Bullet(owner.projectileData);
                projectile.cont = 0;
                projectile.start = 10 * i;
                projectile.player = this.player.unit;
                projectile.unit.x = owner.unit.hitArea.x + owner.unit.hitArea.width / 2;
                projectile.unit.y = owner.unit.hitArea.y + owner.unit.hitArea.height;
                projectile.unit.scale.set(0);

                const targetX = Math.random() * (gameWidth() - 2 * owner.unit.hitArea.x);
                const targetY = Math.random() * owner.unit.hitArea.height + owner.unit.hitArea.y;

                TweenMax.to(projectile.unit, 0.3, {
                    x: targetX,
                    y: targetY,
                });
                TweenMax.to(projectile.unit.scale, 0.3, {
                    x: 1,
                    y: 1,
                });

                projectile.on(deadEvent, this.enemyRemove.bind(this, projectile));
                projectile.on(deadCompleteEvent, this.enemyRemoveComplete.bind(this, projectile));

                this.unitContainer.addChild(projectile);
                this.enemyHitTestList.push(projectile);
            }
            break;

        case "psychoField":
            for (let i = 0; i < 72; i += 1) {
                const projectile = new Bullet(owner.projectileData);
                projectile.rotX = Math.cos((i / 72) * 360 * Math.PI / 180);
                projectile.rotY = Math.sin((i / 72) * 360 * Math.PI / 180);
                projectile.unit.x = 50 * projectile.rotX + owner.unit.x + owner.unit.hitArea.width / 2 + projectile.unit.width / 2;
                projectile.unit.y = 50 * projectile.rotY + owner.unit.y + owner.unit.hitArea.height / 2;

                projectile.on(deadEvent, this.enemyRemove.bind(this, projectile));
                projectile.on(deadCompleteEvent, this.enemyRemoveComplete.bind(this, projectile));

                this.unitContainer.addChild(projectile);
                this.enemyHitTestList.push(projectile);
            }
            break;

        default: {
            const projectile = new Bullet(owner.projectileData);
            projectile.unit.x = owner.unit.x + owner.unit.width / 2 - projectile.unit.width / 2;
            projectile.unit.y = owner.unit.y + owner.unit.hitArea.height / 2;

            projectile.on(deadEvent, this.enemyRemove.bind(this, projectile));
            projectile.on(deadCompleteEvent, this.enemyRemoveComplete.bind(this, projectile));

            this.unitContainer.addChild(projectile);
            this.enemyHitTestList.push(projectile);
            break;
        }
        }
    }

    projectileAllRemove() {}

    enemyRemove(unit) {
        this.hud.comboCount = 1;
        this.hud.scoreCount = unit.score;
        this.hud.spgageCount = unit.spgage;
        this.hud.scoreView(unit);

        if (unit.itemName) {
            const item = createItemSprite(unit.itemTexture);
            item.x = unit.unit.x;
            item.y = unit.unit.y;
            item.name = unit.itemName;
            this.unitContainer.addChild(item);
            this.itemHitTestList.push(item);
        }

        removeFromArray(this.enemyHitTestList, unit);
    }

    enemyRemoveComplete(unit) {
        unit.off(eventName(Enemy, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD), this.enemyRemove.bind(this));
        unit.off(eventName(Enemy, "CUSTOM_EVENT_DEAD_COMPLETE", CUSTOM_EVENTS.DEAD_COMPLETE), this.enemyRemoveComplete.bind(this));
        unit.off(eventName(Enemy, "CUSTOM_EVENT_PROJECTILE_ADD", CUSTOM_EVENTS.PROJECTILE_ADD), this.projectileAdd.bind(this));
        removeChildIfPresent(this.unitContainer, unit);
    }

    bossAdd() {
        const recipeData = getRecipeData();
        if (!recipeData || !recipeData.bossData) {
            return;
        }

        if (Number(gameState.stageId) === 3 && Number(gameState.continueCnt) === 0) {
            const preBossData = recipeData.bossData["boss" + String(gameState.stageId)];
            preBossData.explosion = this.explosionTextures;
            preBossData.gokiFlg = true;
            preBossData.continueCnt = gameState.continueCnt;

            const preBoss = new BossVega(preBossData);

            const onGoki = function onGoki() {
                this.theWorldFlg = true;
                this.hud.spBtnDeactive();

                for (let i = 0; i < this.player.bulletList.length; i += 1) {
                    const bullet = this.player.bulletList[i];
                    this.player.bulletRemove(bullet);
                    this.player.bulletRemoveComplete(bullet);
                }

                this.boss.toujou();

                const timeline = new TimelineMax();
                timeline.to(this.boss.unit, 1, {
                    x: gameCenterX() + this.boss.width / 4,
                });

                timeline.addCallback(function onGokiSequenceA() {
                    this.boss.shungokusatsu(preBoss.unit);
                    this.hud.spgaBtn.alpha = 0;
                    this.player.alpha = 0;

                    for (let i = 0; i < this.player.bulletList.length; i += 1) {
                        const bullet = this.player.bulletList[i];
                        removeChildIfPresent(this.player, bullet);
                    }
                }, "+=1.5", null, this);

                timeline.addCallback(function onGokiSequenceB() {
                    this.hud.spgaBtn.alpha = 1;
                    this.player.alpha = 1;

                    preBoss.off(eventName(BossVega, "CUSTOM_EVENT_GOKI", CUSTOM_EVENTS.GOKI), onGoki);
                    preBoss.hp = 0;
                    preBoss.dead();

                    removeFromArray(this.enemyHitTestList, preBoss);

                    stop(this.stageBgmName);

                    const bossExtra = recipeData.bossData.bossExtra;
                    const bgmInfo = getBossBgmInfo(bossExtra && bossExtra.name);
                    if (bgmInfo) {
                        this.stageBgmName = bgmInfo.name;
                        bgmPlay(this.stageBgmName, bgmInfo.start, bgmInfo.end);
                    }
                }, "+=2.3", null, this);

                timeline.to(this.boss.unit, 1, {
                    x: gameCenterX() - this.boss.width / 2,
                }, "+=1.5");

                timeline.addCallback(function onGokiSequenceC() {
                    removeChildIfPresent(this.unitContainer, preBoss);
                    this.enemyHitTestList.push(this.boss);
                    this.theWorldFlg = false;
                    this.hud.spBtnActive();
                    this.boss.shootStart();
                }, "+=1", null, this);
            }.bind(this);

            preBoss.on(eventName(BossVega, "CUSTOM_EVENT_GOKI", CUSTOM_EVENTS.GOKI), onGoki);
            this.enemyHitTestList.push(preBoss);
            this.unitContainer.addChild(preBoss);

            const gokiData = recipeData.bossData.bossExtra;
            gokiData.explosion = this.explosionTextures;
            gokiData.continueCnt = gameState.continueCnt;

            this.boss = new BossGoki(gokiData);
            this.boss.on(eventName(Boss, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD), this.bossRemove.bind(this, this.boss));
            this.boss.on(eventName(Boss, "CUSTOM_EVENT_PROJECTILE_ADD", CUSTOM_EVENTS.PROJECTILE_ADD), this.projectileAdd.bind(this, this.boss));
            this.unitContainer.addChild(this.boss);
            this.boss.unit.x = gameWidth();
            this.boss.unit.y = gameHeight() / 4;
        } else {
            const bossData = recipeData.bossData["boss" + String(gameState.stageId)];
            bossData.explosion = this.explosionTextures;

            switch (Number(gameState.stageId)) {
            case 0:
                this.boss = new BossBison(bossData);
                break;
            case 1:
                this.boss = new BossBarlog(bossData);
                break;
            case 2:
                this.boss = new BossSagat(bossData);
                break;
            case 3:
                bossData.gokiFlg = false;
                this.boss = new BossVega(bossData);
                break;
            case 4:
                this.boss = new BossFang(bossData);
                break;
            default:
                this.boss = new BossBison(bossData);
                break;
            }

            this.boss.on(eventName(Boss, "CUSTOM_EVENT_DEAD", CUSTOM_EVENTS.DEAD), this.bossRemove.bind(this, this.boss));
            this.boss.on(eventName(Boss, "CUSTOM_EVENT_PROJECTILE_ADD", CUSTOM_EVENTS.PROJECTILE_ADD), this.projectileAdd.bind(this, this.boss));
            this.enemyHitTestList.push(this.boss);
            this.unitContainer.addChild(this.boss);
        }

        this.timeTxt = new PIXI.Sprite(textureFromFrameSafe("timeTxt.gif"));
        this.timeTxt.x = gameCenterX() - this.timeTxt.width;
        this.timeTxt.y = 58;
        this.timeTxt.alpha = 0;
        this.unitContainer.addChild(this.timeTxt);

        this.bigNumTxt = new BigNumberDisplay(2);
        this.bigNumTxt.x = this.timeTxt.x + this.timeTxt.width + 3;
        this.bigNumTxt.y = this.timeTxt.y - 2;
        this.bigNumTxt.setNum(99);
        this.bigNumTxt.alpha = 0;
        this.unitContainer.addChild(this.bigNumTxt);

        TweenMax.to([this.bigNumTxt, this.timeTxt], 0.2, {
            delay: 6,
            alpha: 1,
            onComplete: function onBossTimerStart() {
                this.bossTimerCountDown = 99;
                this.bossTimerFrameCnt = 0;
                this.bossTimerStartFlg = true;
            },
            onCompleteScope: this,
        });

        this.enemyWaveFlg = false;
        this.stageBg.bossScene();
    }

    bossRemove(boss) {
        this.theWorldFlg = true;

        this.hud.comboCount = 1;
        this.hud.scoreCount = boss.score;
        this.hud.spgageCount = boss.spgage;
        this.hud.scoreView(boss);
        this.hud.spBtnDeactive();

        for (let i = 0; i < this.player.bulletList.length; i += 1) {
            const bullet = this.player.bulletList[i];
            removeChildIfPresent(this.player, bullet);
        }

        this.enemyHitTestList = [];
        this.player.bulletList = [];

        TweenMax.delayedCall(2.5, function onBossClearDelay() {
            this.stageClear();
        }, null, this);

        if (this.hud.spFireFlg) {
            this.stageBg.akebonofinish();
            this.title.akebonofinish();
            gameState.akebonoCnt += 1;
        } else {
            this.title.stageClear();
        }
    }

    playerDamage(amount) {
        (new TimelineMax())
            .call(function onShake0() {
                this.x = 4;
                this.y = -2;
            }, null, this, "+=0.0")
            .call(function onShake1() {
                this.x = -3;
                this.y = 1;
            }, null, this, "+=0.08")
            .call(function onShake2() {
                this.x = 2;
                this.y = -1;
            }, null, this, "+=0.07")
            .call(function onShake3() {
                this.x = -2;
                this.y = 1;
            }, null, this, "+=0.05")
            .call(function onShake4() {
                this.x = 1;
                this.y = 1;
            }, null, this, "+=0.05")
            .call(function onShakeEnd() {
                this.x = 0;
                this.y = 0;
            }, null, this, "+=0.04");

        this.player.onDamage(amount);
        this.hud.onDamage(this.player.percent);
    }

    comboReset() {
        this.hud.comboCount = 0;
    }

    spFire() {
        this.theWorldFlg = true;
        this.hud.spFireFlg = true;

        if (this.boss) {
            this.boss.onTheWorld(this.theWorldFlg);
        }

        this.addChild(this.cutinCont);
        this.cutinCont.start();

        this.spLine.x = this.player.unit.x + 12;
        this.spLine.y = this.player.unit.y + 5;
        this.unitContainer.addChild(this.spLine);

        for (let i = 0; i < this.player.bulletList.length; i += 1) {
            const bullet = this.player.bulletList[i];
            this.player.bulletRemove(bullet);
            this.player.bulletRemoveComplete(bullet);
        }

        const timeline = new TimelineMax();

        timeline.call(function onSpVoice() {
            play("g_sp_voice");
        }, null, this, "+=0.2");

        timeline.call(function onSpCutinEnd() {
            removeChildIfPresent(this, this.cutinCont);
        }, null, this, "+=1.7");

        timeline.to(this.spLine, 0.3, {
            height: gameHeight(),
        });

        timeline.to(this.spLine, 0.3, {
            y: 0,
            height: 0,
        });

        timeline.call(function onSpExplosions() {
            let x = 0;
            let row = 0;

            const spawnExplosion = function spawnExplosion(index) {
                if (index % 8 === 0) {
                    x = row % 2 === 0 ? -30 : -45;
                    row += 1;
                }

                const explosion = createAnimatedSprite(this.spExplosionTextures);
                explosion.animationSpeed = 0.2;
                explosion.loop = false;
                explosion.x = x;
                explosion.y = gameHeight() - 45 * row - 120;
                explosion.onComplete = function onExplosionComplete(explosionSprite) {
                    explosionSprite.destroy();
                    removeChildIfPresent(this.unitContainer, explosionSprite);
                }.bind(this, explosion);

                x += 30;

                TweenMax.delayedCall(0.01 * index, function onExplosionDelay() {
                    this.unitContainer.addChild(explosion);
                    explosion.play();
                    if (index % 16 === 0) {
                        play("se_sp_explosion");
                    }
                }, null, this);
            }.bind(this);

            for (let i = 0; i < 64; i += 1) {
                spawnExplosion(i);
            }
        }, null, this, "-=0.1");

        timeline.call(function onSpDamage() {
            const targets = this.enemyHitTestList.slice();

            if (targets.length >= 100) {
                for (let i = 0; i < targets.length; i += 1) {
                    const target = targets[i];
                    if (target.unit.x >= -target.unit.width / 2
                        && target.unit.x <= gameWidth()
                        && target.unit.y >= 20
                        && target.unit.y <= gameHeight()) {
                        target.onDamage(gameState.spDamage);
                    }
                }
                return;
            }

            for (let i = 0; i < targets.length; i += 1) {
                const target = targets[i];
                if (target.unit.x >= -target.unit.width / 2
                    && target.unit.x <= gameWidth()
                    && target.unit.y >= 20
                    && target.unit.y <= gameHeight()) {
                    TweenMax.delayedCall(0.005 * i, function onSpDamageDelay() {
                        target.onDamage(gameState.spDamage);
                    }, null, this);
                }
            }
        }, null, this, "+=0.8");

        timeline.call(function onSpEnd() {
            removeChildIfPresent(this.unitContainer, this.spLine);
            this.theWorldFlg = false;
            this.hud.spFireFlg = false;

            if (this.boss) {
                if (this.boss.hp <= 0) {
                    this.theWorldFlg = true;
                } else {
                    this.boss.onTheWorld(this.theWorldFlg);
                }
            }
        }, null, this, "+=0.7");
    }

    run() {
        const recipeData = getRecipeData();
        if (!recipeData || !recipeData.bossData) {
            return;
        }

        const stageBossData = recipeData.bossData["boss" + String(gameState.stageId)];
        const stageBgmInfo = getBossBgmInfo(stageBossData && stageBossData.name);

        if (stageBgmInfo) {
            this.stageBgmName = stageBgmInfo.name;

            if (Number(gameState.stageId) === 4) {
                TweenMax.delayedCall(3, function onStage4BgmDelay() {
                    bgmPlay(this.stageBgmName, stageBgmInfo.start, stageBgmInfo.end);
                }, null, this);
            } else {
                bgmPlay(this.stageBgmName, stageBgmInfo.start, stageBgmInfo.end);
            }
        }

        this.title.gameStart(gameState.stageId);
        this.stageBg.init(gameState.stageId);

        this.hud.spBtnDeactive();
        TweenMax.delayedCall(2.6, function onRoundVoiceDelay() {
            play("g_stage_voice_" + String(gameState.stageId));
            this.hud.spBtnActive();
        }.bind(this));

        const stageData = recipeData["stage" + String(gameState.stageId)];
        const enemyList = stageData && Array.isArray(stageData.enemylist) ? stageData.enemylist.slice() : [];
        this.stageEnemyPositionList = enemyList.reverse();

        if (parseFlag(gameState.shortFlg)) {
            this.stageEnemyPositionList = [];
            this.stageEnemyPositionList.push(["00", "00", "A1", "A2", "A9", "00", "00", "00"]);
            this.stageEnemyPositionList.push(["00", "00", "A3", "A3", "00", "00", "00", "00"]);
        }

        this.player.setUp(gameState.playerMaxHp, gameState.shootMode, gameState.shootSpeed);
        this.player.unit.x = gameWidth() / 2 - this.player.unit.width / 2;
        this.player.unit.y = gameHeight() - this.player.unit.height - 30;
        this.player.unitX = gameWidth() / 2;
        this.player.unitY = this.player.unit.y;

        this.addChildAt(this.player, 2);

        this.hud.setPercent(this.player.percent);
        this.hud.scoreCount = gameState.score;
        this.hud.highScore = gameState.highScore;
        this.hud.comboCount = gameState.combo;
        this.hud.maxCombo = gameState.maxCombo;
        this.hud.spgageCount = gameState.spgage;
        this.hud.comboTimeCnt = 0;

        gameState.combo = 0;

        this.enemyWaveFlg = false;
        this.theWorldFlg = false;
        this.waveCount = 0;
        this.waveInterval = 80;
        this.frameCnt = 0;
        this.frameCntUp = 1;
        this.sceneSwitch = 0;
        this.enemyHitTestList = [];
        this.itemHitTestList = [];
    }

    stageClear() {
        this.theWorldFlg = true;
        gameState.playerHp = this.player.hp;
        gameState.spgage = this.hud.spgageCount;
        gameState.score = this.hud.scoreCount;

        this.hud.spBtnDeactive(true);
        gameState.stageId += 1;
        this.sceneSwitch = 1;

        this.player.shootStop();

        TweenMax.delayedCall(2.3, function onStageClearRemove() {
            this.removeSceneFromStage();
        }.bind(this));
    }

    gameover() {
        this.theWorldFlg = true;
        gameState.score = this.hud.scoreCount;
        this.hud.spBtnDeactive();

        if (this.boss) {
            this.boss.onTheWorld(true);
        }
    }

    gameoverComplete() {
        if (this.boss) {
            this.boss.onTheWorld(true);
        }

        removeChildIfPresent(this, this.player);

        TweenMax.delayedCall(2, function onGameoverRemove() {
            this.removeSceneFromStage();
        }.bind(this));
    }

    timeoverComplete() {
        this.title.timeover();

        this.theWorldFlg = true;
        gameState.score = this.hud.scoreCount;
        this.hud.spBtnDeactive();

        if (this.boss) {
            this.boss.onTheWorld(true);
        }

        TweenMax.delayedCall(2.5, function onTimeoverRemove() {
            removeChildIfPresent(this, this.player);
            this.removeSceneFromStage();
        }.bind(this));
    }

    gameStart() {
        this.enemyWaveFlg = true;
        this.player.shootStart();
    }

    removeSceneFromStage() {
        if (this.parent) {
            this.parent.removeChild(this);
            return;
        }

        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage && game.stage.children.indexOf(this) !== -1) {
            game.stage.removeChild(this);
        }
    }

    sceneRemoved() {
        if (this._sceneRemovedHandled) {
            return;
        }
        this._sceneRemovedHandled = true;

        if (this.stageBgmName) {
            stop(this.stageBgmName);
        }

        super.sceneRemoved();

        const game = globalThis.__PHASER_GAME__;
        if (!game || !game.stage) {
            return;
        }

        const nextScene = this.sceneSwitch === 1 ? new AdvScene() : new ContinueScene();
        game.stage.addChild(nextScene);
    }
}

export default GameScene;
