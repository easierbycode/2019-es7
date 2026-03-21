// src/ps2/scene_continue.js — Continue / Game Over scene

function updateContinueScene() {
    var cs = continueState;

    if (cs.gameOverShown) {
        cs.gameOverTimer++;
        // Wait for input to return to title
        if (cs.gameOverTimer > 90 && isConfirmPressed()) {
            switchScene(SCENE_TITLE);
        }
        return;
    }

    // Countdown
    cs.countDownTimer++;
    if (cs.countDownTimer % 40 === 0 && cs.countDown >= 0) {
        playSound("voice_countdown" + String(cs.countDown));
        cs.countDown--;
    }

    // Time's up — auto select No
    if (cs.countDown < 0 && cs.selection === -1) {
        continueSelectNo();
        return;
    }

    // D-pad navigation
    if (isLeftHeld() || isRightHeld()) {
        cs.cursorPos = cs.cursorPos === 0 ? 1 : 0;
    }

    // Confirm selection
    if (isConfirmPressed()) {
        if (cs.cursorPos === 0) {
            continueSelectYes();
        } else {
            continueSelectNo();
        }
    }
}

function continueSelectYes() {
    var cs = continueState;
    cs.selection = 0;

    var voiceIdx = Math.floor(Math.random() * 3);
    playSound("g_continue_yes_voice" + String(voiceIdx));
    stopBgm();

    // Reset player state and go to game
    var recipe = gameState.recipe;
    var playerData = recipe ? recipe.playerData : null;
    if (playerData) {
        gameState.playerMaxHp = playerData.maxHp;
        gameState.playerHp = gameState.playerMaxHp;
        gameState.shootMode = playerData.defaultShootName || "normal";
        gameState.shootSpeed = playerData.defaultShootSpeed || "speed_normal";
    }
    gameState.continueCnt++;
    gameState.score = gameState.continueCnt;

    switchScene(SCENE_GAME);
}

function continueSelectNo() {
    var cs = continueState;
    cs.selection = 1;
    cs.gameOverShown = true;
    cs.gameOverTimer = 0;

    playSound("voice_gameover");
    playSound("bgm_gameover");

    // Save high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
    saveHighScore();

    var voiceIdx = Math.floor(Math.random() * 2);
    playSound("g_continue_no_voice" + String(voiceIdx));
}

function drawContinueScene() {
    var cs = continueState;
    var black = Color.new(0, 0, 0);
    var white = Color.new(255, 255, 255);
    var yellow = Color.new(255, 255, 0);
    var red = Color.new(255, 60, 60);
    var gray = Color.new(128, 128, 128);

    Draw.rect(0, 0, SCREEN_W, SCREEN_H, black);

    if (cs.gameOverShown) {
        // Game Over screen
        fontPrint(toScreenX(GCX - 40), toScreenY(GCY - 60),
            "GAME OVER", red);

        fontPrint(toScreenX(40), toScreenY(GCY), "SCORE", white);
        fontPrint(toScreenX(100), toScreenY(GCY), String(gameState.score), yellow);

        fontPrint(toScreenX(40), toScreenY(GCY + 20), "HI-SCORE", white);
        fontPrint(toScreenX(120), toScreenY(GCY + 20), String(gameState.highScore), yellow);

        fontPrint(toScreenX(40), toScreenY(GCY + 40), "MAX COMBO", white);
        fontPrint(toScreenX(130), toScreenY(GCY + 40), String(hudState.maxCombo), yellow);

        if (cs.gameOverTimer > 90) {
            if (sceneTimer % 40 < 30) {
                fontPrint(toScreenX(GCX - 50), toScreenY(GH - 60),
                    "PRESS START", white);
            }
        }
        return;
    }

    // Continue screen
    // Title
    if (hasFrame("game_ui", resolveFrameName("game_ui", "continueTitle.gif"))) {
        drawFrame("game_ui", resolveFrameName("game_ui", "continueTitle.gif"),
            toScreenX(GCX), toScreenY(90), SCALE, SCALE, 1.0, null);
    } else {
        fontPrint(toScreenX(GCX - 40), toScreenY(70), "CONTINUE?", white);
    }

    // Face
    if (hasFrame("game_ui", resolveFrameName("game_ui", "continueFace0.gif"))) {
        var faceFrame = (sceneTimer % 20 < 10) ? "continueFace0.gif" : "continueFace1.gif";
        drawFrame("game_ui", resolveFrameName("game_ui", faceFrame),
            toScreenX(60), toScreenY(180), SCALE, SCALE, 1.0, null);
    }

    // Countdown
    var countStr = cs.countDown >= 0 ? String(cs.countDown) : "0";
    fontPrint(toScreenX(160), toScreenY(160), countStr,
        cs.countDown <= 3 ? red : yellow);

    // Yes / No buttons
    var yesColor = cs.cursorPos === 0 ? yellow : gray;
    var noColor = cs.cursorPos === 1 ? yellow : gray;

    fontPrint(toScreenX(GCX - 60), toScreenY(GCY + 50), "YES", yesColor);
    fontPrint(toScreenX(GCX + 30), toScreenY(GCY + 50), "NO", noColor);

    // Cursor indicator
    var cursorX = cs.cursorPos === 0 ? (GCX - 70) : (GCX + 20);
    fontPrint(toScreenX(cursorX), toScreenY(GCY + 50), ">", white);
}
