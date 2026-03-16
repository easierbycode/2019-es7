import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState } from "../gameState.js";
import { pollGamepads } from "./GamepadInput.js";

var ADV_SCENARIO_JA = {
    stage0: {
        part: [
            { background: "0", text: "君の闘いは我が闘い\nハイスコアを求めるのは\n地球人民の本能" },
            { background: "Done", text: "STG(シューティングゲーム)\nやってみた！" },
        ],
    },
    stage1: {
        part: [
            { background: "1", text: "君こそハイスコア\nそして、私でもあることが" },
            { background: "Done", text: "お分かりいただけただろう！" },
        ],
    },
    stage2: {
        part: [
            { background: "2", text: "地球人民はハイスコアを\n追い求めるからこそ美しい" },
            { background: "Done", text: "美しさとは君であり\nそして私なのだ！" },
        ],
    },
    stage3: {
        part: [
            { background: "3", text: "おお地球人民よ！\nハイスコアを求める地球人民よ" },
            { background: "3", text: "私こそがハイスコア\nそう、君こそが\nハイスコアなのだ" },
            { background: "Done", text: "存分に語り合おうではないか！" },
        ],
    },
    stage4: {
        part: [
            { background: "Done", text: "Thank you for playing" },
            { background: "Done", text: "ありがとう！\nハイスコアは私であり\n君であった！" },
        ],
    },
    stage5: {
        part: [
            { background: "Done", text: "ありがとう！\nハイスコアは私であり\n君であった！！" },
        ],
    },
};

var ADV_SCENARIO_EN = {
    stage0: {
        part: [
            { background: "0", text: "Your fight is our fight.\nIt is up to the citizens \nof the world to challenge \nthe high score" },
            { background: "Done", text: "in this shooting \ngame (STG)!" },
        ],
    },
    stage1: {
        part: [
            { background: "1", text: "Through achieving\nthe high score,\nboth you and I," },
            { background: "Done", text: "can come to a mutual \nunderstanding!" },
        ],
    },
    stage2: {
        part: [
            { background: "2", text: "The people of Earth, \ncoming together to \nachieve the high score, \nis truly a beautiful thing." },
            { background: "Done", text: "This beauty is something \nthat both you as well as I,\nboth possess!" },
        ],
    },
    stage3: {
        part: [
            { background: "3", text: "Now, citizens of the \nearth!\nYou fine people who \nchallenge the high score." },
            { background: "3", text: "My high score\nis also your high score." },
            { background: "Done", text: "Let us talk to\nour heart's content!" },
        ],
    },
    stage4: {
        part: [
            { background: "Done", text: "Thank you for playing." },
            { background: "Done", text: "This high score belongs\n to me,\nand it also belongs to you!" },
        ],
    },
    stage5: {
        part: [
            { background: "Done", text: "This high score belongs\n to me,\nand it also belongs to you!" },
        ],
    },
};

function addPixiPositionedText(scene, x, y, value, style) {
    var textStyle = Object.assign({}, style);
    var padding = textStyle.padding;
    var paddingX = 0;
    var paddingY = 0;

    if (typeof padding === "number") {
        paddingX = padding;
        paddingY = padding;
        textStyle.padding = { x: padding, y: padding };
    } else if (padding) {
        paddingX = padding.x || 0;
        paddingY = padding.y || 0;
    }

    // PIXI trims text padding back out of its bounds, while Phaser keeps it in the box.
    var text = scene.add.text(x - paddingX, y - paddingY, value, textStyle);
    text.setOrigin(0, 0);
    return text;
}

export class PhaserAdvScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserAdvScene" });
    }

    create() {
        this.scenario = LANG === "ja" ? ADV_SCENARIO_JA : ADV_SCENARIO_EN;
        this.partNum = 0;
        this.stageKey = "stage" + String(gameState.stageId);
        this.partText = this.scenario[this.stageKey].part[this.partNum].text;
        this.partTextCursor = 0;
        this.partTextComp = false;
        this.textTimer = 0;

        this.endingFlg = false;
        if (gameState.stageId === 5) {
            this.endingFlg = true;
        } else if (gameState.stageId === 4) {
            this.playSound("voice_thankyou", 0.7);
            if (!(gameState.akebonoCnt >= 4 && gameState.continueCnt === 0)) {
                this.endingFlg = true;
            }
        }

        this.playBgm("adventure_bgm", 0.2);

        var bgKey = "advBg" + this.scenario[this.stageKey].part[this.partNum].background + ".gif";
        this.bgSprite = this.add.sprite(0, 0, "game_ui", bgKey);
        this.bgSprite.setOrigin(0, 0);

        this.txtBg = this.add.graphics();
        this.txtBg.lineStyle(2, 0xffffff, 1);
        this.txtBg.fillStyle(0x000000, 1);
        this.txtBg.fillRoundedRect(8, GAME_DIMENSIONS.CENTER_Y + 7, GAME_DIMENSIONS.WIDTH - 16, 180, 6);
        this.txtBg.strokeRoundedRect(8, GAME_DIMENSIONS.CENTER_Y + 7, GAME_DIMENSIONS.WIDTH - 16, 180, 6);

        var nameBg = this.add.graphics();
        nameBg.lineStyle(2, 0xffffff, 1);
        nameBg.fillStyle(0x000000, 1);
        nameBg.fillRoundedRect(16, GAME_DIMENSIONS.CENTER_Y - 5, 80, 24, 6);
        nameBg.strokeRoundedRect(16, GAME_DIMENSIONS.CENTER_Y - 5, 80, 24, 6);

        this.nameTxt = addPixiPositionedText(this, 50, GAME_DIMENSIONS.CENTER_Y - 4, "G", {
            fontFamily: "sans-serif",
            fontSize: "16px",
            fontStyle: "bold",
            color: "#ffffff",
            padding: { x: 10, y: 10 },
        });

        this.txt = addPixiPositionedText(this, 15, GAME_DIMENSIONS.CENTER_Y + 30, "", {
            fontFamily: "sans-serif",
            fontSize: "16px",
            fontStyle: "bold",
            color: "#ffffff",
            lineSpacing: 4,
            wordWrap: { width: 230, useAdvancedWrap: true },
            padding: { x: 10, y: 10 },
        });

        // PIXI adv scene: "Next▼" for next part, "LET'S GO! ▶︎" for last part
        this.nextBtn = this.add.text(
            GAME_DIMENSIONS.WIDTH - 20,
            GAME_DIMENSIONS.HEIGHT - 30,
            "Next▼",
            {
                fontFamily: "sans-serif",
                fontSize: "16px",
                color: "#ffffff",
            }
        );
        this.nextBtn.setOrigin(1, 1);
        this.nextBtn.setInteractive({ useHandCursor: true });
        this.nextBtn.setVisible(false);

        var self = this;
        this.nextBtn.on("pointerup", function () {
            self.onNextPress();
        });

        this.tapZone = this.add.zone(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            GAME_DIMENSIONS.WIDTH,
            GAME_DIMENSIONS.HEIGHT
        );
        this.tapZone.setInteractive({ useHandCursor: true });
        this.tapZone.on("pointerup", function () {
            if (self.partTextComp) {
                self.onNextPress();
            }
        });

        // Keyboard: Enter/Space to advance dialogue
        this.enterKey = null;
        this.spaceKey = null;
        try {
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        } catch (e) {}
    }

    playSound(key, volume) {
        if (gameState.lowModeFlg) {
            return;
        }
        try {
            var vol = typeof volume === "number" ? volume : 0.7;
            if (this.sound.get(key)) {
                this.sound.play(key, { volume: vol });
            } else if (this.cache.audio.exists(key)) {
                this.sound.add(key).play({ volume: vol });
            }
        } catch (e) {}
    }

    playBgm(key, volume) {
        if (gameState.lowModeFlg) {
            return;
        }
        try {
            var existing = this.sound.get(key);
            if (existing) {
                existing.play({ volume: volume || 0.2, loop: true });
            } else if (this.cache.audio.exists(key)) {
                this.sound.add(key, { loop: true, volume: volume || 0.2 }).play();
            }
        } catch (e) {}
    }

    stopSound(key) {
        try {
            var snd = this.sound.get(key);
            if (snd && snd.isPlaying) {
                snd.stop();
            }
        } catch (e) {}
    }

    onNextPress() {
        var maxParts = this.scenario[this.stageKey].part.length;

        if (this.partNum < maxParts - 1) {
            this.playSound("se_cursor_sub", 0.9);
            this.partNum++;
            this.partText = this.scenario[this.stageKey].part[this.partNum].text;
            this.partTextCursor = 0;
            this.partTextComp = false;
            this.txt.setText("");
            this.nextBtn.setVisible(false);

            var bgKey = "advBg" + this.scenario[this.stageKey].part[this.partNum].background + ".gif";
            if (this.textures.getFrame("game_ui", bgKey)) {
                this.bgSprite.setFrame(bgKey);
            }

            if (bgKey === "advBgDone.gif") {
                this.playSound("g_adbenture_voice0", 0.5);
            }
        } else {
            this.goToNextScene();
        }
    }

    goToNextScene() {
        this.playSound("se_correct", 0.9);
        this.stopSound("adventure_bgm");

        var nextScene = this.endingFlg ? "PhaserEndingScene" : "PhaserGameScene";
        var game = this.game;
        setTimeout(function () {
            game.scene.stop("PhaserAdvScene");
            game.scene.start(nextScene);
        }, 50);
    }

    update(time, delta) {
        // Keyboard + gamepad advance
        var gp = pollGamepads();
        if (this.partTextComp && this.nextBtn && this.nextBtn.visible && (
            (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
            (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
            gp.sp || gp.enter
        )) {
            this.onNextPress();
            return;
        }

        if (this.partTextComp || !this.txt) {
            return;
        }

        this.textTimer += delta;
        if (this.textTimer < 33) {
            return;
        }
        this.textTimer = 0;

        if (this.partTextCursor <= this.partText.length - 1) {
            this.txt.setText(this.txt.text + this.partText.charAt(this.partTextCursor));
            this.partTextCursor++;
            return;
        }

        this.partTextComp = true;
        this.nextBtn.setVisible(true);

        if (this.partNum >= this.scenario[this.stageKey].part.length - 1) {
            this.nextBtn.setText("LET'S GO! ▶︎");
        } else {
            this.nextBtn.setText("Next▼");
        }
    }
}

export default PhaserAdvScene;
