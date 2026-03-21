// src/ps2/scene_title.js — Title scene logic for PS2 AthenaEnv

function updateTitleScene() {
    var ts = titleState;
    ts.bgScrollX += 0.5;

    if (!ts.introDone) {
        ts.introTimer++;
        if (ts.introTimer >= 120) {
            ts.introDone = true;
            ts.startBtnVisible = true;
            playSound("voice_titlecall");
        }
    }

    if (ts.startBtnVisible) {
        if (isConfirmPressed()) {
            playSound("se_decision");
            switchScene(SCENE_ADV);
        }
    }
}

function drawTitleScene() {
    var ts = titleState;
    var white = Color.new(255, 255, 255);
    var yellow = Color.new(255, 255, 0);
    var black = Color.new(0, 0, 0);

    // Background
    if (hasFrame("game_ui", "title_bg")) {
        // Tile the title background
        drawFrameTL("game_ui", "title_bg", 0, 0, SCREEN_W / 256, SCREEN_H / 480, 1.0);
    } else {
        Draw.rect(0, 0, SCREEN_W, SCREEN_H, Color.new(20, 10, 40));
    }

    // Title character
    var introT = Math.min(ts.introTimer / 90, 1.0);
    var eased = 1 - Math.pow(1 - introT, 5);

    if (hasFrame("game_ui", resolveFrameName("game_ui", "titleG.gif"))) {
        var gFrame = resolveFrameName("game_ui", "titleG.gif");
        var gx = SCREEN_W * 0.7 - (SCREEN_W * 0.7 - SCREEN_W / 2) * eased;
        drawFrame("game_ui", gFrame, Math.floor(gx), toScreenY(60), SCALE, SCALE, eased, null);
    }

    // Logo
    if (hasFrame("game_ui", resolveFrameName("game_ui", "logo.gif"))) {
        var logoFrame = resolveFrameName("game_ui", "logo.gif");
        var logoScale = 2 - eased;
        drawFrame("game_ui", logoFrame, toScreenX(GCX), toScreenY(75), SCALE * logoScale, SCALE * logoScale, eased, null);
    }

    // Subtitle
    if (hasFrame("game_ui", resolveFrameName("game_ui", "subTitle.gif"))) {
        var subFrame = resolveFrameName("game_ui", "subTitle.gif");
        drawFrame("game_ui", subFrame, toScreenX(GCX), toScreenY(130), SCALE, SCALE, eased, null);
    }

    // Bottom belt
    Draw.rect(toScreenX(0), toScreenY(GH - 120), toScreenW(GW), toScreenH(120), black);

    // High score
    fontPrint(toScreenX(32), toScreenY(GH - 100), "HI-SCORE", white);
    fontPrint(toScreenX(110), toScreenY(GH - 100), String(gameState.highScore || 0), yellow);

    // Start button (flashing)
    if (ts.startBtnVisible) {
        if (sceneTimer % 40 < 30) {
            fontPrint(toScreenX(GCX - 45), toScreenY(GH - 60), "PRESS START", white);
        }
    }

    // Copyright
    fontPrint(toScreenX(10), toScreenY(GH - 20),
        "(C)CAPCOM", Color.new(128, 128, 128));
}
