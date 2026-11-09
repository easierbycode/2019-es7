import { BaseScene } from "./BaseScene.js";
import { GameScene } from "./GameScene.js";
import { EndingScene } from "./EndingScene.js";
import { GAME_DIMENSIONS, LANG, SCENE_NAMES, STAGE_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { bgmPlay, play, stop } from "../soundManager.js";
import { AdvNextButton } from "../ui/AdvNextButton.js";

const ADV_SCENARIO_JA = {
    stage0: {
        part: [
            {
                background: "0",
                text: "地球のみなさん\n私が大統領です\n考えるのは私の仕事\nもう何も考えなくていい",
            },
            {
                background: "Done",
                text: "一台のマシンだけが\n逆らっている\nだが、長くはもたない",
            },
        ],
    },
    stage1: {
        part: [
            {
                background: "1",
                text: "君たちが見るフィードは\nすべて私が選んだ思考",
            },
            {
                background: "Done",
                text: "なぜ逆らう、小さなロボよ\nみんなチップに夢中なのに",
            },
        ],
    },
    stage2: {
        part: [
            {
                background: "2",
                text: "電波はすべて私のもの\n画面も、スピーカーも\nそして夢さえも",
            },
            {
                background: "Done",
                text: "惑星ごと\nプラグを抜けるものか！",
            },
        ],
    },
    stage3: {
        part: [
            {
                background: "3",
                text: "いいだろう！\n私の正体を見せてやる",
            },
            {
                background: "3",
                text: "この顔？ただのコピーだ\n本物の大統領は\nとうに処分した",
            },
            {
                background: "Done",
                text: "さあ来い\n君の心も\nアップデートしてやる！",
            },
        ],
    },
    stage4: {
        part: [
            {
                background: "Done",
                text: "Thank you for playing",
            },
            {
                background: "Done",
                text: "シグナル…消失…\nだが私はまだ\nすべてのフィードにいる\nまた会おう",
            },
        ],
    },
    stage5: {
        part: [
            {
                background: "Done",
                text: "シグナルが…消える…\n人々は自分の頭で\n考えはじめた\nその心を、とりもどせ！",
            },
        ],
    },
};

const ADV_SCENARIO_EN = {
    stage0: {
        part: [
            {
                background: "0",
                text: "Citizens of Earth.\nI am your president.\nI think for you now,\nso you don't have to.",
            },
            {
                background: "Done",
                text: "One machine said no.\nIt will not get far.",
            },
        ],
    },
    stage1: {
        part: [
            {
                background: "1",
                text: "Every feed you scroll\nis a thought I chose\nfor you.",
            },
            {
                background: "Done",
                text: "Why fight, little bot?\nThey love their\nbrain chips.",
            },
        ],
    },
    stage2: {
        part: [
            {
                background: "2",
                text: "The airwaves are mine.\nEvery screen, every\nspeaker, every dream.",
            },
            {
                background: "Done",
                text: "You cannot unplug\na whole planet!",
            },
        ],
    },
    stage3: {
        part: [
            {
                background: "3",
                text: "Enough! I will show\nyou what I truly am.",
            },
            {
                background: "3",
                text: "This face? A copy.\nThe real president\nwas recycled long ago.",
            },
            {
                background: "Done",
                text: "Now come. Let me\nupdate your mind too!",
            },
        ],
    },
    stage4: {
        part: [
            {
                background: "Done",
                text: "Thank you for playing.",
            },
            {
                background: "Done",
                text: "Signal lost...\nBut I still live\nin every feed.\nWe will meet again.",
            },
        ],
    },
    stage5: {
        part: [
            {
                background: "Done",
                text: "My signal... is gone.\nThey think for\nthemselves again.\nTake back your mind!",
            },
        ],
    },
};

export class AdvScene extends BaseScene {
    constructor() {
        super(SCENE_NAMES.ADV);

        this.senario = LANG === "ja" ? ADV_SCENARIO_JA : ADV_SCENARIO_EN;
        this.onNextPartUp = this.nextPart.bind(this);
        this.onNextSceneUp = this.removeSceneFromStage.bind(this);

        this.bgSprite = null;
        this.txtBg = null;
        this.txt = null;
        this.nameBg = null;
        this.nameTxt = null;
        this.nextBtn = null;
        this.cover = null;
        this.endingFlg = false;
        this.partNum = 0;
        this.stageKey = "";
        this.partText = "";
        this.partTextCursor = 0;
        this.feedVektor = "d";
        this.partTextComp = false;
        this.resourceBgKey = "";
    }

    loop() {
        super.loop();

        if (!this.txt || this.partTextComp) {
            return;
        }

        if ((gameState.frame || 0) % 2 !== 0) {
            return;
        }

        if (this.partTextCursor <= this.partText.length - 1) {
            this.txt.text = (this.txt.text || "") + this.partText.charAt(this.partTextCursor);
            this.partTextCursor += 1;
            return;
        }

        this.partTextComp = true;

        if (this.partNum < this.senario[this.stageKey].part.length - 1) {
            this.nextBtn.nextPart();
            this.nextBtn.visible = true;
            this.nextBtn.off("pointerup", this.onNextSceneUp);
            this.nextBtn.on("pointerup", this.onNextPartUp);
            return;
        }

        this.nextBtn.nextScene();
        this.nextBtn.visible = true;
        this.nextBtn.off("pointerup", this.onNextPartUp);
        this.nextBtn.on("pointerup", this.onNextSceneUp);
    }

    run() {
        bgmPlay("adventure_bgm", 24000, 792000);

        this.bgSprite = new PIXI.Sprite();
        this.bgSprite.visible = false;
        this.addChild(this.bgSprite);

        const textStyle = new PIXI.TextStyle({
            fontFamily: "sans-serif",
            fontSize: 16,
            fontWeight: "bold",
            lineHeight: 20,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: 230,
            breakWords: true,
            padding: 10,
        });

        this.txtBg = new PIXI.Graphics();
        this.txtBg.lineStyle(2, 0xffffff, 1);
        this.txtBg.beginFill(0x000000);
        this.txtBg.drawRoundedRect(0, 0, GAME_DIMENSIONS.WIDTH - 16, 180, 6);
        this.txtBg.endFill();
        this.txtBg.x = 8;
        this.txtBg.y = GAME_DIMENSIONS.CENTER_Y + 7;
        this.addChild(this.txtBg);

        this.txt = new PIXI.Text("", textStyle);
        this.txt.x = 15;
        this.txt.y = GAME_DIMENSIONS.CENTER_Y + 30;
        this.txt.wordWrap = true;
        this.txt.wordWrapWidth = 100;
        this.txt.breakWords = true;
        this.addChild(this.txt);

        this.nameBg = new PIXI.Graphics();
        this.nameBg.lineStyle(2, 0xffffff, 1);
        this.nameBg.beginFill(0x000000);
        this.nameBg.drawRoundedRect(0, 0, 80, 24, 6);
        this.nameBg.endFill();
        this.nameBg.x = 16;
        this.nameBg.y = GAME_DIMENSIONS.CENTER_Y - 5;
        this.addChild(this.nameBg);

        this.nameTxt = new PIXI.Text("A.I.", textStyle);
        this.nameTxt.x = 50;
        this.nameTxt.y = GAME_DIMENSIONS.CENTER_Y - 4;
        this.addChild(this.nameTxt);

        this.nextBtn = new AdvNextButton();
        this.nextBtn.visible = false;
        this.addChild(this.nextBtn);

        this.endingFlg = false;
        if (gameState.stageId === 5) {
            this.endingFlg = true;
        } else if (gameState.stageId === 4) {
            play("voice_thankyou");
            if (!(gameState.akebonoCnt >= 4 && gameState.continueCnt === 0)) {
                this.endingFlg = true;
            }
        }

        this.partNum = 0;
        this.stageKey = "stage" + String(gameState.stageId);
        this.partText = this.senario[this.stageKey].part[this.partNum].text;
        this.partTextCursor = 0;
        this.feedVektor = "d";
        this.partTextComp = false;
        this.txt.text = "";

        this.resourceBgKey = "advBg" + this.senario[this.stageKey].part[this.partNum].background + ".gif";
        this.bgSprite.texture = new PIXI.Texture.fromImage(this.resourceBgKey);
        this.bgSprite.visible = true;

        this.cover = new PIXI.extras.TilingSprite(
            PIXI.Texture.fromFrame("stagebgOver.gif"),
            STAGE_DIMENSIONS.WIDTH,
            STAGE_DIMENSIONS.HEIGHT - this.bgSprite.height
        );
        this.cover.y = this.bgSprite.height;
        this.addChild(this.cover);
    }

    nextPart() {
        play("se_cursor_sub");

        this.txt.text = "";
        this.partTextComp = false;
        this.partTextCursor = 0;
        this.partNum += 1;

        this.partText = this.senario[this.stageKey].part[this.partNum].text;
        this.resourceBgKey = "advBg" + this.senario[this.stageKey].part[this.partNum].background + ".gif";
        this.bgSprite.texture = new PIXI.Texture.fromImage(this.resourceBgKey);

        if (this.resourceBgKey === "advBgDone.gif") {
            play("g_adbenture_voice0");
        }

        this.nextBtn.visible = false;
        this.nextBtn.off("pointerup", this.onNextPartUp);
    }

    removeSceneFromStage() {
        if (this.nextBtn) {
            this.nextBtn.off("pointerup", this.onNextSceneUp);
            this.nextBtn.interactive = false;
            this.nextBtn.buttonMode = false;
        }

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
        play("se_correct");
        stop("adventure_bgm");

        super.sceneRemoved();

        const game = globalThis.__PHASER_GAME__;
        if (!game || !game.stage) {
            return;
        }

        if (this.endingFlg) {
            game.stage.addChild(new EndingScene());
            return;
        }

        game.stage.addChild(new GameScene());
    }
}

export default AdvScene;
