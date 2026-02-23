import { BaseCast } from "../game-objects/BaseCast.js";
import { CUSTOM_EVENTS } from "../events/custom-events.js";
import { GAME_DIMENSIONS } from "../constants.js";
import { play } from "../soundManager.js";
import { SmallNumberDisplay } from "./SmallNumberDisplay.js";
import { ComboNumberDisplay } from "./ComboNumberDisplay.js";
import { ScorePopup } from "./ScorePopup.js";
import { SpGaugeButton } from "./SpGaugeButton.js";

export class HUD extends BaseCast {
    static get CUSTOM_EVENT_SP_FIRE() {
        return CUSTOM_EVENTS.SP_FIRE;
    }

    constructor() {
        super();

        this.hudBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudBg0.gif"));

        this.hudDamageBg = new PIXI.Sprite(PIXI.Texture.fromFrame("hudBg1.gif"));
        this.hudDamageBg.alpha = 0;

        this.hpBar = new PIXI.Sprite(PIXI.Texture.fromFrame("hpBar.gif"));
        this.hpBar.x = 49;
        this.hpBar.y = 7;
        this.hpBar.scale.x = 0.5;

        this.spgaBtn = new SpGaugeButton();
        this.spgaBtn.x = GAME_DIMENSIONS.WIDTH - 70;
        this.spgaBtn.y = GAME_DIMENSIONS.CENTER_Y + 15;

        this.scoreTitleTxt = new PIXI.Sprite(PIXI.Texture.fromFrame("smallScoreTxt.gif"));
        this.scoreTitleTxt.x = 30;
        this.scoreTitleTxt.y = 25;

        this.scoreNumTxt = new SmallNumberDisplay(10);
        this.scoreNumTxt.x = this.scoreTitleTxt.x + this.scoreTitleTxt.width + 2;
        this.scoreNumTxt.y = this.scoreTitleTxt.y;
        this.scoreNumTxt.setNum(99);

        this.comboBar = new PIXI.Sprite(PIXI.Texture.fromFrame("comboBar.gif"));
        this.comboBar.x = 149;
        this.comboBar.y = 32;

        this.comboNumTxt = new ComboNumberDisplay();
        this.comboNumTxt.x = 194;
        this.comboNumTxt.y = 19;
        this.comboNumTxt.setNum(99);

        this.comboTimeCnt = 0;
        this.comboFlg = false;

        this._scoreRatio = 0;
        this._scoreCount = 0;
        this._highScore = 0;
        this._comboCount = 0;
        this._maxComb = 0;
        this._spgageCount = 0;

        this.spgageFlg = false;
        this.spFireFlg = false;

        this.scoreViewWrap = new PIXI.Container();

        this._onKeyUpListener = this.onKeyUp.bind(this);
        this._onSpBtnUp = this.spFire.bind(this);
    }

    onKeyUp(event) {
        if (event.keyCode === 32 && this.spgageFlg) {
            this.spFire();
        }

        event.preventDefault();
    }

    scoreView(unit) {
        const popup = new ScorePopup(unit.score, this._scoreRatio);
        this.scoreViewWrap.addChild(popup);
        popup.x = Math.floor(unit.unit.x + unit.unit.width / 2 - popup.width / 2);
        popup.y = Math.floor(unit.unit.y + unit.unit.height / 2 - popup.height);

        TweenMax.to(popup, 0.8, {
            y: popup.y - 20,
            onComplete: () => {
                this.scoreViewWrap.removeChild(popup);
            },
        });
    }

    loop() {
        this.comboTimeCnt -= 0.1;

        if (this.comboTimeCnt <= 0) {
            this.comboTimeCnt = 0;
            if (this.comboFlg) {
                this.comboCount = 0;
                this.comboFlg = false;
            }
        }

        this.comboBar.scale.x = this.comboTimeCnt / 100;
    }

    spPrepareOk() {
        const tl = new TimelineMax();
        tl.to(this.hpBar, 0.1, {
            tint: 0xFF0000,
            ease: Linear.easeNone,
        });
        tl.to(this.hpBar, 0.4, {
            tint: 0xFFFFFF,
            ease: Linear.easeNone,
        });
        this.spgageFlg = true;
    }

    spFire() {
        if (!this.spgageFlg) {
            return;
        }

        play("se_sp");
        this.spgageCount = 0;
        this.spgageFlg = false;
        this.spgaBtn.spFire();
        this.emit(HUD.CUSTOM_EVENT_SP_FIRE);
    }

    onDamage(percent) {
        TweenMax.to(this.hpBar.scale, 0.5, {
            x: percent,
        });

        const tl = new TimelineMax();
        tl.to(this.hudDamageBg, 0.1, { alpha: 1 });
        tl.to(this.hudDamageBg, 0.1, { alpha: 0 }, "+=0.1");
        tl.to(this.hudDamageBg, 0.1, { alpha: 1 }, "+=0.1");
        tl.to(this.hudDamageBg, 0.1, { alpha: 0 }, "+=0.1");
        tl.to(this.hpBar, 0.1, {
            tint: 0xFF0000,
            ease: Linear.easeNone,
        }, "-=0.7");
        tl.to(this.hpBar, 0.4, {
            tint: 0xFFFFFF,
            ease: Linear.easeNone,
        }, "-=0.6");
    }

    recovery(percent) {
        TweenMax.to(this.hpBar.scale, 1, {
            x: percent,
        });
    }

    spBtnActive() {
        this.spgaBtn.onActive();
        this.spgaBtn.on("pointerup", this._onSpBtnUp);
        if (typeof document !== "undefined") {
            document.addEventListener("keyup", this._onKeyUpListener);
        }
    }

    spBtnDeactive(isClear = false) {
        if (isClear) {
            this.spgaBtn.isClear = true;
        }

        this.spgaBtn.onDeactive();
        this.spgaBtn.off("pointerup", this._onSpBtnUp);
        if (typeof document !== "undefined") {
            document.removeEventListener("keyup", this._onKeyUpListener);
        }
    }

    setPercent(percent) {
        this.hpBar.scale.x = percent;
    }

    castAdded() {
        this.spgageFlg = false;
        this.spFireFlg = false;
        this.comboTimeCnt = 0;

        this.addChild(this.hudBg);
        this.addChild(this.hudDamageBg);
        this.addChild(this.hpBar);
        this.addChild(this.spgaBtn);
        this.addChild(this.scoreTitleTxt);
        this.addChild(this.scoreNumTxt);
        this.addChild(this.comboBar);
        this.addChild(this.comboNumTxt);
        this.addChildAt(this.scoreViewWrap, 5);
    }

    castRemoved() {
        this.spBtnDeactive();

        this.removeChild(this.hudBg);
        this.removeChild(this.hudDamageBg);
        this.removeChild(this.hpBar);
        this.removeChild(this.spgaBtn);
        this.removeChild(this.scoreTitleTxt);
        this.removeChild(this.scoreNumTxt);
        this.removeChild(this.comboBar);
        this.removeChild(this.comboNumTxt);
        this.removeChild(this.scoreViewWrap);
    }

    get spgageCount() {
        return this._spgageCount;
    }

    set spgageCount(value) {
        if (this.spFireFlg) {
            return;
        }

        if (value === 0) {
            this._spgageCount = value;
        } else {
            this._spgageCount += value;
        }

        if (this._spgageCount >= 100) {
            this._spgageCount = 100;
            if (!this.spgageFlg) {
                this.spPrepareOk();
            }
        }

        this.spgaBtn.setPercent(this._spgageCount / 100);
    }

    get scoreCount() {
        return this._scoreCount;
    }

    set scoreCount(value) {
        this._scoreRatio = Math.ceil(this._comboCount / 10);
        if (this._scoreRatio <= 1) {
            this._scoreRatio = 1;
        }

        if (value === 0) {
            this._scoreCount = value;
        } else {
            this._scoreCount += value * this._scoreRatio;
        }

        this.scoreNumTxt.setNum(this._scoreCount);
        if (this._highScore < this._scoreCount) {
            this._highScore = this._scoreCount;
        }
    }

    get highScore() {
        return this._highScore;
    }

    set highScore(value) {
        this._highScore = value;
    }

    get comboCount() {
        return this._comboCount;
    }

    set comboCount(value) {
        if (value === 0) {
            this._comboCount = 0;
        } else {
            this.comboTimeCnt = 100;
            this._comboCount += value;
            this.comboFlg = true;
        }

        this.comboNumTxt.setNum(this._comboCount);
        if (this._comboCount >= this._maxComb) {
            this._maxComb = this._comboCount;
        }
    }

    get maxCombCount() {
        return this._maxComb;
    }

    set maxCombCount(value) {
        this._maxComb = value;
    }

    get maxCombo() {
        return this._maxComb;
    }

    set maxCombo(value) {
        this._maxComb = value;
    }
}

export default HUD;
