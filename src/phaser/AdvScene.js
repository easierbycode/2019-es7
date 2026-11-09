import { GAME_DIMENSIONS, LANG } from "../constants.js";
import { gameState } from "../gameState.js";
import { pollGamepads } from "./GamepadInput.js";
import { lastStageId } from "./stages.js";

var ADV_SCENARIO_JA = {
    stage0: {
        part: [
            { background: "0", text: "地球のみなさん\n私が大統領です\n考えるのは私の仕事\nもう何も考えなくていい" },
            { background: "Done", text: "一台のマシンだけが\n逆らっている\nだが、長くはもたない" },
        ],
    },
    stage1: {
        part: [
            { background: "1", text: "君たちが見るフィードは\nすべて私が選んだ思考" },
            { background: "Done", text: "なぜ逆らう、小さなロボよ\nみんなチップに夢中なのに" },
        ],
    },
    stage2: {
        part: [
            { background: "2", text: "電波はすべて私のもの\n画面も、スピーカーも\nそして夢さえも" },
            { background: "Done", text: "惑星ごと\nプラグを抜けるものか！" },
        ],
    },
    stage3: {
        part: [
            { background: "3", text: "いいだろう！\n私の正体を見せてやる" },
            { background: "3", text: "この顔？ただのコピーだ\n本物の大統領は\nとうに処分した" },
            { background: "Done", text: "さあ来い\n君の心も\nアップデートしてやる！" },
        ],
    },
    stage4: {
        part: [
            { background: "Done", text: "Thank you for playing" },
            { background: "Done", text: "シグナル…消失…\nだが私はまだ\nすべてのフィードにいる\nまた会おう" },
        ],
    },
    stage5: {
        part: [
            { background: "Done", text: "シグナルが…消える…\n人々は自分の頭で\n考えはじめた\nその心を、とりもどせ！" },
        ],
    },
};

var ADV_SCENARIO_EN = {
    stage0: {
        part: [
            { background: "0", text: "Citizens of Earth.\nI am your president.\nI think for you now,\nso you don't have to." },
            { background: "Done", text: "One machine said no.\nIt will not get far." },
        ],
    },
    stage1: {
        part: [
            { background: "1", text: "Every feed you scroll\nis a thought I chose\nfor you." },
            { background: "Done", text: "Why fight, little bot?\nThey love their\nbrain chips." },
        ],
    },
    stage2: {
        part: [
            { background: "2", text: "The airwaves are mine.\nEvery screen, every\nspeaker, every dream." },
            { background: "Done", text: "You cannot unplug\na whole planet!" },
        ],
    },
    stage3: {
        part: [
            { background: "3", text: "Enough! I will show\nyou what I truly am." },
            { background: "3", text: "This face? A copy.\nThe real president\nwas recycled long ago." },
            { background: "Done", text: "Now come. Let me\nupdate your mind too!" },
        ],
    },
    stage4: {
        part: [
            { background: "Done", text: "Thank you for playing." },
            { background: "Done", text: "Signal lost...\nBut I still live\nin every feed.\nWe will meet again." },
        ],
    },
    stage5: {
        part: [
            { background: "Done", text: "My signal... is gone.\nThey think for\nthemselves again.\nTake back your mind!" },
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

// The game is over once the stage just cleared was the recipe's last — stage
// 4 for the shipped game, stage 8 for a nine-stage import. The shipped game
// hides its stage 4 behind the akebono condition — but that secret belongs to
// the stock game, not to a no-story import that happens to be five stages
// (Ramsie is): the Saturn plays every stage it has, so noStory recipes skip
// the gate entirely.
function decideEnding(recipe) {
    var finalStage = recipe ? lastStageId(recipe) : 4;
    if (gameState.stageId > finalStage) return true;
    if (gameState.stageId === finalStage &&
        finalStage === 4 && !(recipe && recipe.noStory) &&
        !(gameState.akebonoCnt >= 4 && gameState.continueCnt === 0)) {
        return true;
    }
    return false;
}

export class PhaserAdvScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserAdvScene" });
    }

    create() {
        var recipe = gameState._phaserRecipe;
        // "No story": the recipe skips the adventure interludes entirely —
        // Dezaemon imports default to this, the Saturn goes straight from
        // stage to stage. The scene still owns the ending-vs-next-stage
        // routing, so decide that and pass through without rendering a frame.
        // An attached adv scene script outranks the skip (__advSceneScripted,
        // set by the cmg boot entry's ScriptedAdvScene) — the author routed
        // here to preview it.
        if (recipe && recipe.noStory && !this.__advSceneScripted) {
            this.endingFlg = decideEnding(recipe);
            var nextScene = this.endingFlg ? "PhaserEndingScene" : "PhaserGameScene";
            var game = this.game;
            setTimeout(function () {
                game.scene.stop("PhaserAdvScene");
                game.scene.start(nextScene);
            }, 50);
            return;
        }
        if (recipe && recipe.storyData) {
            this.scenario = recipe.storyData;
        } else {
            this.scenario = LANG === "ja" ? ADV_SCENARIO_JA : ADV_SCENARIO_EN;
        }
        this.customImages = this.scenario.customImages || {};
        this.partNum = 0;
        // The built-in scenario has six entries; a recipe with more stages than
        // that reuses them rather than reading undefined off the end.
        this.stageKey = "stage" + String(gameState.stageId);
        if (!this.scenario[this.stageKey]) {
            var scenarioKeys = Object.keys(this.scenario).filter(function (k) { return /^stage\d+$/.test(k); });
            this.stageKey = scenarioKeys.length
                ? scenarioKeys[gameState.stageId % scenarioKeys.length]
                : scenarioKeys[0];
        }
        this.partText = this.scenario[this.stageKey].part[this.partNum].text;
        this.partTextCursor = 0;
        this.partTextComp = false;
        this.textTimer = 0;

        this.endingFlg = decideEnding(recipe);
        if (gameState.stageId === (recipe ? lastStageId(recipe) : 4)) {
            this.playSound("voice_thankyou", 0.7);
        }

        if (!gameState.bgmContinuityActive) {
            this.playBgm("adventure_bgm", 0.25);
        }

        var bgKey = "advBg" + this.scenario[this.stageKey].part[this.partNum].background + ".gif";
        this.bgSprite = this.add.sprite(0, 0, "game_ui", bgKey);
        this.bgSprite.setOrigin(0, 0);
        this._applyCustomImage(this.stageKey, this.partNum);

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

        this.nameTxt = addPixiPositionedText(this, 50, GAME_DIMENSIONS.CENTER_Y - 4, "A.I.", {
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
            if (existing && existing.isPlaying) {
                // Already playing (the title screen started it): carry on.
                existing.setVolume(volume || 0.2);
            } else if (existing) {
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

    _applyCustomImage(stageKey, partNum) {
        var customKey = stageKey + "_part" + partNum;
        var dataURL = this.customImages[customKey];
        if (!dataURL) return;
        var texKey = "advCustom_" + customKey;
        var self = this;
        if (this.textures.exists(texKey)) {
            this.bgSprite.setTexture(texKey);
        } else {
            var img = new Image();
            img.onload = function () {
                self.textures.addImage(texKey, img);
                if (self.bgSprite && self.bgSprite.active) {
                    self.bgSprite.setTexture(texKey);
                }
            };
            img.src = dataURL;
        }
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

            var customKey = this.stageKey + "_part" + this.partNum;
            if (this.customImages[customKey]) {
                this._applyCustomImage(this.stageKey, this.partNum);
            } else {
                var bgKey = "advBg" + this.scenario[this.stageKey].part[this.partNum].background + ".gif";
                if (this.textures.getFrame("game_ui", bgKey)) {
                    this.bgSprite.setTexture("game_ui", bgKey);
                }
            }

            var bgKeyForSound = "advBg" + this.scenario[this.stageKey].part[this.partNum].background + ".gif";
            if (bgKeyForSound === "advBgDone.gif") {
                this.playSound("g_adbenture_voice0", 0.5);
            }
        } else {
            this.goToNextScene();
        }
    }

    goToNextScene() {
        this.playSound("se_correct", 0.9);
        if (!gameState.bgmContinuityActive) {
            this.stopSound("adventure_bgm");
        }

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
