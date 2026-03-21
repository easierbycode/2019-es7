// src/ps2/hud.js — HUD (heads-up display) for PS2 AthenaEnv port
// Draws score, HP bar, combo counter, SP gauge, boss timer

var hudState = {
    scoreCount: 0,
    highScore: 0,
    comboCount: 0,
    maxCombo: 0,
    comboTimeCnt: 0,
    spgageCount: 0,
    spgageMax: 100,
    spFireFlg: 0,
    spBtnActive: 0,
    hpPercent: 1.0,
    bossTimerVisible: 0,
    bossTimerCount: 99,
};

function hudReset() {
    hudState.scoreCount = 0;
    hudState.comboCount = 0;
    hudState.maxCombo = 0;
    hudState.comboTimeCnt = 0;
    hudState.spgageCount = 0;
    hudState.spFireFlg = 0;
    hudState.spBtnActive = 0;
    hudState.hpPercent = 1.0;
    hudState.bossTimerVisible = 0;
    hudState.bossTimerCount = 99;
}

function hudOnDamage(percent) {
    hudState.hpPercent = percent;
}

function hudOnEnemyKill(score, spgage) {
    hudState.comboCount++;
    hudState.scoreCount += score * hudState.comboCount;
    hudState.spgageCount += spgage;
    if (hudState.spgageCount > hudState.spgageMax) {
        hudState.spgageCount = hudState.spgageMax;
    }
    hudState.comboTimeCnt = 60; // 2 seconds at 30fps
    if (hudState.comboCount > hudState.maxCombo) {
        hudState.maxCombo = hudState.comboCount;
    }
}

function hudLoop() {
    // Combo timer
    if (hudState.comboTimeCnt > 0) {
        hudState.comboTimeCnt--;
        if (hudState.comboTimeCnt <= 0) {
            hudState.comboCount = 0;
        }
    }
}

function hudDraw() {
    var white = Color.new(255, 255, 255);
    var yellow = Color.new(255, 255, 0);
    var red = Color.new(255, 60, 60);
    var green = Color.new(60, 255, 60);
    var cyan = Color.new(60, 200, 255);
    var barBg = Color.new(40, 40, 40);

    var lx = toScreenX(4);
    var rx = toScreenX(GW - 4);
    var topY = toScreenY(4);

    // Score
    fontPrint(lx, topY, "SCORE", white);
    fontPrint(lx + 50, topY, String(hudState.scoreCount), yellow);

    // High Score
    fontPrint(lx, topY + 14, "HI", white);
    fontPrint(lx + 20, topY + 14, String(hudState.highScore), white);

    // HP Bar
    var barX = toScreenX(4);
    var barY = toScreenY(GH - 18);
    var barW = toScreenW(GW - 8);
    var barH = toScreenH(6);
    Draw.rect(barX, barY, barW, barH, barBg);

    var hpW = Math.floor(barW * hudState.hpPercent);
    var hpColor = hudState.hpPercent > 0.3 ? green : red;
    if (hpW > 0) {
        Draw.rect(barX, barY, hpW, barH, hpColor);
    }

    // SP Gauge
    var spY = toScreenY(GH - 10);
    var spW = toScreenW(GW - 8);
    var spH = toScreenH(4);
    Draw.rect(barX, spY, spW, spH, barBg);

    var spFill = Math.floor(spW * (hudState.spgageCount / hudState.spgageMax));
    if (spFill > 0) {
        Draw.rect(barX, spY, spFill, spH, cyan);
    }

    // SP ready indicator
    if (hudState.spgageCount >= hudState.spgageMax && hudState.spBtnActive) {
        fontPrint(toScreenX(GCX - 20), toScreenY(GH - 28), "SP READY!", cyan);
    }

    // Combo
    if (hudState.comboCount > 1) {
        fontPrint(toScreenX(GCX - 20), toScreenY(50), String(hudState.comboCount) + " COMBO!", yellow);
    }

    // Boss timer
    if (hudState.bossTimerVisible) {
        fontPrint(toScreenX(GCX - 10), toScreenY(58), "TIME", white);
        fontPrint(toScreenX(GCX + 15), toScreenY(58), String(hudState.bossTimerCount), yellow);
    }
}
