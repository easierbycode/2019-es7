import { GAME_DIMENSIONS } from "../../constants.js";
import { getDisplayedHighScore, getWorldBestLabel } from "../../highScoreUi.js";
import { SmallNumberDisplay } from "./SmallNumberDisplay.js";
import { BigNumberDisplay } from "./BigNumberDisplay.js";
import { ComboNumberDisplay } from "./ComboNumberDisplay.js";
import { PhaserSpGaugeButton } from "./SpGaugeButton.js";

var GCX = GAME_DIMENSIONS.CENTER_X;

export class PhaserHUD {
    constructor(scene, onSpFire) {
        this.scene = scene;

        this.hudBg = scene.add.sprite(0, 0, "game_ui", "hudBg0.gif");
        this.hudBg.setOrigin(0, 0);
        this.hudBg.setDepth(100);

        this.hpBar = scene.add.sprite(49, 7, "game_ui", "hpBar.gif");
        this.hpBar.setOrigin(0, 0);
        this.hpBar.setDepth(101);

        this.scoreLabel = scene.add.sprite(30, 25, "game_ui", "smallScoreTxt.gif");
        this.scoreLabel.setOrigin(0, 0);
        this.scoreLabel.setDepth(101);

        this.scoreNum = new SmallNumberDisplay(scene, 10);
        this.scoreNum.container.x = this.scoreLabel.x + this.scoreLabel.width + 2;
        this.scoreNum.container.y = 25;
        this.scoreNum.container.setDepth(101);

        this.worldBestText = scene.add.text(
            30, 40,
            getWorldBestLabel() + " " + String(getDisplayedHighScore()),
            { fontFamily: "Arial", fontSize: "9px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 2 }
        );
        this.worldBestText.setDepth(101);

        this.comboLabel = scene.add.sprite(149, 32, "game_ui", "comboBar.gif");
        this.comboLabel.setOrigin(0, 0);
        this.comboLabel.setDepth(101);
        this.comboLabel.setScale(0, 1);

        this.comboNum = new ComboNumberDisplay(scene);

        this.spBtn = new PhaserSpGaugeButton(scene, onSpFire);

        this.bossTimerLabel = scene.add.sprite(GCX - 42, 58, "game_ui", "timeTxt.gif");
        this.bossTimerLabel.setOrigin(0, 0);
        this.bossTimerLabel.setDepth(101);
        this.bossTimerLabel.setVisible(false);

        this.bossTimerNum = new BigNumberDisplay(scene, 2);
        this.bossTimerNum.container.x = this.bossTimerLabel.x + 42 + 3;
        this.bossTimerNum.container.y = 56;
        this.bossTimerNum.container.setDepth(101);
        this.bossTimerNum.container.setVisible(false);
        this.bossTimerNum.setValue(99);

        this.bossHpBarBg = scene.add.graphics();
        this.bossHpBarBg.setDepth(101);
        this.bossHpBarBg.setVisible(false);
        this.bossHpBarFg = scene.add.graphics();
        this.bossHpBarFg.setDepth(101);
        this.bossHpBarFg.setVisible(false);
    }

    updateHpBar(hp, maxHp) {
        this.hpBar.setScale(Math.max(0, hp / maxHp), 1);
    }

    updateScore(scoreCount) {
        this.scoreNum.setValue(scoreCount);
    }

    updateWorldBest(scoreCount) {
        var best = Math.max(getDisplayedHighScore(), scoreCount);
        this.worldBestText.setText(getWorldBestLabel() + " " + String(best));
    }

    updateCombo(comboCount, comboTimeCnt) {
        this.comboNum.setValue(comboCount);
        this.comboLabel.setScale(comboTimeCnt / 100, 1);
    }

    updateSpGauge(ratio) {
        this.spBtn.update(ratio);
    }

    updateBossTimer(countDown) {
        this.bossTimerNum.setValue(Math.max(0, countDown));
    }

    showBossTimer(visible) {
        this.bossTimerLabel.setVisible(visible);
        this.bossTimerNum.container.setVisible(visible);
    }

    updateBossHpBar(active, bossSprite, bossHp, bossMaxHp) {
        if (!active || !bossSprite || !bossSprite.active) {
            this.bossHpBarBg.setVisible(false);
            this.bossHpBarFg.setVisible(false);
            return;
        }

        var barW = 120;
        var barH = 6;
        var barX = GCX - barW / 2;
        var barY = 52;

        this.bossHpBarBg.setVisible(true);
        this.bossHpBarBg.clear();
        this.bossHpBarBg.fillStyle(0x333333, 0.8);
        this.bossHpBarBg.fillRect(barX, barY, barW, barH);

        var hpRatio = Math.max(0, bossHp / bossMaxHp);
        var color = hpRatio > 0.5 ? 0xff4444 : hpRatio > 0.25 ? 0xff8800 : 0xff0000;

        this.bossHpBarFg.setVisible(true);
        this.bossHpBarFg.clear();
        this.bossHpBarFg.fillStyle(color, 1);
        this.bossHpBarFg.fillRect(barX, barY, barW * hpRatio, barH);
    }
}
