import { BaseCast } from "../game-objects/BaseCast.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { play } from "../soundManager.js";

export class GameTitle extends BaseCast {
    static get EVENT_START() {
        return CUSTOM_EVENTS.EVENT_START;
    }

    static get EVENT_RESTART() {
        return CUSTOM_EVENTS.EVENT_RESTART;
    }

    constructor() {
        super();

        this.interactive = false;
        this.buttonMode = false;

        this.gameStartBg = new PIXI.Graphics();
        this.gameStartBg.beginFill(0xffffff, 0.2);
        this.gameStartBg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.gameStartBg.visible = false;
        this.gameStartBg.alpha = 0;

        this.stageNumList = [];
        for (let i = 0; i < 4; i += 1) {
            const texture = PIXI.Texture.fromFrame("stageNum" + String(i + 1) + ".gif");
            if (texture && texture.baseTexture) {
                texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            }
            this.stageNumList[i] = texture;
        }

        this.stageNum = new PIXI.Sprite();
        this.stageNum.x = 0;
        this.stageNum.y = GAME_DIMENSIONS.HEIGHT / 2 - 20;
        this.stageNum.visible = false;

        const stageFightTexture = PIXI.Texture.fromFrame("stageFight.gif");
        if (stageFightTexture && stageFightTexture.baseTexture) {
            stageFightTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        }
        this.stageFight = new PIXI.Sprite(stageFightTexture);
        this.stageFight.x = this.stageFight.width / 2;
        this.stageFight.y = GAME_DIMENSIONS.HEIGHT / 2 + this.stageFight.height / 2 - 20;
        this.stageFight.visible = false;
        this.stageFight.anchor.set(0.5);

        this.stageClearBg = new PIXI.Graphics();
        this.stageClearBg.beginFill(0xffffff, 0.4);
        this.stageClearBg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.stageClearBg.visible = false;
        this.stageClearBg.alpha = 0;

        this.stageClearText = new PIXI.Sprite(PIXI.Texture.fromFrame("stageclear.gif"));
        this.stageClearText.x = GAME_DIMENSIONS.WIDTH / 2 - this.stageClearText.width / 2;
        this.stageClearText.y = GAME_DIMENSIONS.HEIGHT / 2 - this.stageClearText.height;

        this.stageTimeoverBg = new PIXI.Graphics();
        this.stageTimeoverBg.beginFill(0xffffff, 0.4);
        this.stageTimeoverBg.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.stageTimeoverBg.visible = false;
        this.stageTimeoverBg.alpha = 0;

        this.stageTimeoverText = new PIXI.Sprite(PIXI.Texture.fromFrame("stageTimeover.gif"));
        this.stageTimeoverText.x = GAME_DIMENSIONS.WIDTH / 2 - this.stageTimeoverText.width / 2;
        this.stageTimeoverText.y = GAME_DIMENSIONS.HEIGHT / 2 - this.stageTimeoverText.height;

        this.knockoutK = new PIXI.Sprite(PIXI.Texture.fromFrame("knockoutK.gif"));
        this.knockoutK.x = GAME_DIMENSIONS.CENTER_X - this.knockoutK.width / 2;
        this.knockoutK.y = GAME_DIMENSIONS.CENTER_Y;
        this.knockoutK.anchor.set(0.5);
        this.knockoutK.visible = false;

        this.knockoutO = new PIXI.Sprite(PIXI.Texture.fromFrame("knockoutO.gif"));
        this.knockoutO.x = GAME_DIMENSIONS.CENTER_X + this.knockoutO.width / 2;
        this.knockoutO.y = GAME_DIMENSIONS.CENTER_Y;
        this.knockoutO.anchor.set(0.5);
        this.knockoutO.visible = false;
    }

    gameStart(stageId) {
        let stageNumIndex = stageId;
        let preOverlay = null;

        if (stageId === 4) {
            stageNumIndex = 3;
            preOverlay = new PIXI.Graphics();
            preOverlay.beginFill(0x000000, 1);
            preOverlay.drawRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
            this.addChild(preOverlay);
            play("voice_another_fighter");
        }

        if (stageNumIndex < 0 || stageNumIndex >= this.stageNumList.length) {
            stageNumIndex = 0;
        }

        this.gameStartBg.visible = true;
        this.gameStartBg.alpha = 0;
        this.stageNum.texture = this.stageNumList[stageNumIndex];
        this.stageNum.visible = true;
        this.stageNum.alpha = 0;
        this.stageFight.visible = true;
        this.stageFight.alpha = 0;
        this.stageFight.scale.set(1.2);

        const timeline = new TimelineMax({
            onComplete: () => {
                this.gameStartBg.visible = false;
                this.emit(GameTitle.EVENT_START);
            },
        });

        if (preOverlay) {
            timeline.to(preOverlay, 0.3, {
                alpha: 0,
            }, "+=3");
            timeline.addCallback(() => {
                if (preOverlay.parent) {
                    preOverlay.parent.removeChild(preOverlay);
                }
                preOverlay.destroy(true);
            });
        }

        timeline.to(this.gameStartBg, 0.3, {
            alpha: 1,
        });
        timeline.addCallback(() => {
            play("voice_round" + String(stageNumIndex));
        }, "+=0");
        timeline.to(this.stageNum, 0.3, {
            alpha: 1,
        });
        timeline.to(this.stageNum, 0.1, {
            delay: 1,
            alpha: 0,
        });
        timeline.to(this.stageFight, 0.2, {
            alpha: 1,
        }, "-=0.1");
        timeline.to(this.stageFight.scale, 0.2, {
            x: 1,
            y: 1,
        }, "-=0.2");
        timeline.addCallback(() => {
            play("voice_fight");
        }, "+=0");
        timeline.to(this.stageFight.scale, 0.2, {
            x: 1.5,
            y: 1.5,
        }, "+=0.4");
        timeline.to(this.stageFight, 0.2, {
            alpha: 0,
        }, "-=0.2");
        timeline.to(this.gameStartBg, 0.2, {
            alpha: 0,
        }, "-=0.1");
    }

    akebonofinish() {
        this.knockoutK.visible = true;
        this.knockoutK.scale.set(0);
        this.knockoutO.visible = true;
        this.knockoutO.scale.set(0);

        const timeline = new TimelineMax();
        timeline.to(this.knockoutK.scale, 0.4, {
            x: 1,
            y: 1,
            ease: Back.easeOut,
        });
        timeline.to(this.knockoutO.scale, 0.4, {
            x: 1,
            y: 1,
            ease: Back.easeOut,
        }, "-=0.25");

        play("voice_ko");
        play("se_finish_akebono");
    }

    stageClear() {
        this.stageClearBg.visible = true;
        TweenMax.to(this.stageClearBg, 0.5, {
            delay: 0.3,
            alpha: 1,
        });
    }

    timeover() {
        this.stageTimeoverBg.visible = true;
        TweenMax.to(this.stageTimeoverBg, 0.5, {
            delay: 0.3,
            alpha: 1,
        });
    }

    onRestart() {
        if (this.gameOverBg) {
            TweenMax.to(this.gameOverBg, 0.5, {
                alpha: 0,
                onComplete: () => {
                    this.gameOverBg.visible = false;
                },
            });
        }

        this.emit(GameTitle.EVENT_RESTART);
    }

    castAdded() {
        this.addChild(this.gameStartBg);
        this.gameStartBg.addChild(this.stageNum);
        this.gameStartBg.addChild(this.stageFight);

        this.addChild(this.stageClearBg);
        this.stageClearBg.addChild(this.stageClearText);

        this.addChild(this.stageTimeoverBg);
        this.stageTimeoverBg.addChild(this.stageTimeoverText);

        this.addChild(this.knockoutK);
        this.addChild(this.knockoutO);
    }

    castRemoved() {
        if (this.gameStartBg.parent === this) {
            this.removeChild(this.gameStartBg);
        }
        if (this.stageNum.parent === this.gameStartBg) {
            this.gameStartBg.removeChild(this.stageNum);
        }
        if (this.stageFight.parent === this.gameStartBg) {
            this.gameStartBg.removeChild(this.stageFight);
        }

        if (this.stageClearBg.parent === this) {
            this.removeChild(this.stageClearBg);
        }
        if (this.stageClearText.parent === this.stageClearBg) {
            this.stageClearBg.removeChild(this.stageClearText);
        }

        if (this.stageTimeoverBg.parent === this) {
            this.removeChild(this.stageTimeoverBg);
        }
        if (this.stageTimeoverText.parent === this.stageTimeoverBg) {
            this.stageTimeoverBg.removeChild(this.stageTimeoverText);
        }

        if (this.knockoutK.parent === this) {
            this.removeChild(this.knockoutK);
        }
        if (this.knockoutO.parent === this) {
            this.removeChild(this.knockoutO);
        }
    }
}

export default GameTitle;
