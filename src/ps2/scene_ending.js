// src/ps2/scene_ending.js — Ending / congratulations scene

var endingState = {
    timer: 0,
    scrollY: 0,
    phase: 0,
};

function updateEndingScene() {
    endingState.timer++;
    endingState.scrollY += 0.5;

    // After credits, return to title
    if (endingState.timer > 600 && isConfirmPressed()) {
        resetGameState();
        switchScene(SCENE_TITLE);
    }

    if (endingState.timer > 900) {
        resetGameState();
        switchScene(SCENE_TITLE);
    }
}

function drawEndingScene() {
    var black = Color.new(0, 0, 0);
    var white = Color.new(255, 255, 255);
    var yellow = Color.new(255, 255, 0);
    var gold = Color.new(255, 200, 50);

    Draw.rect(0, 0, SCREEN_W, SCREEN_H, black);

    // Congratulations
    var congAlpha = Math.min(endingState.timer / 60, 1.0);
    var ca = Math.floor(congAlpha * 128);
    var congColor = Color.new(255, 255, 0, ca);

    fontPrint(toScreenX(GCX - 60), toScreenY(40), "CONGRATULATIONS!", congColor);

    // Score summary
    if (endingState.timer > 60) {
        fontPrint(toScreenX(40), toScreenY(100), "FINAL SCORE", white);
        fontPrint(toScreenX(40), toScreenY(120), String(gameState.score), yellow);

        fontPrint(toScreenX(40), toScreenY(150), "MAX COMBO", white);
        fontPrint(toScreenX(40), toScreenY(170), String(hudState.maxCombo), yellow);

        fontPrint(toScreenX(40), toScreenY(200), "CONTINUES", white);
        fontPrint(toScreenX(40), toScreenY(220), String(gameState.continueCnt), yellow);
    }

    // Credits scroll
    if (endingState.timer > 180) {
        var credY = 300 - endingState.scrollY + 90;
        var credits = [
            "ORIGINAL GAME",
            "CAPCOM",
            "",
            "PS2 PORT",
            "AthenaEnv v4",
            "",
            "PROGRAMMING",
            "Claude Code",
            "",
            "THANK YOU",
            "FOR PLAYING!",
        ];

        for (var i = 0; i < credits.length; i++) {
            var cy = toScreenY(credY + i * 20);
            if (cy > 0 && cy < SCREEN_H) {
                fontPrint(toScreenX(GCX - 50), cy, credits[i], white);
            }
        }
    }

    // Press start to continue
    if (endingState.timer > 600) {
        if (sceneTimer % 40 < 30) {
            fontPrint(toScreenX(GCX - 50), toScreenY(GH - 40),
                "PRESS START", white);
        }
    }
}
