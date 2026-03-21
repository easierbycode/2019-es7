// src/ps2/scene_adv.js — Adventure (pre-game cutscene) scene

function updateAdvScene() {
    var as = advState;
    as.timer++;

    if (as.timer < 60) {
        as.textAlpha = as.timer / 60;
    } else if (as.timer < 180) {
        as.textAlpha = 1.0;
    } else if (as.timer < 240) {
        as.textAlpha = 1.0 - (as.timer - 180) / 60;
    } else {
        // Transition to game
        stopBgm();
        switchScene(SCENE_GAME);
    }

    if (isConfirmPressed() && as.timer > 30) {
        stopBgm();
        switchScene(SCENE_GAME);
    }
}

function drawAdvScene() {
    var as = advState;
    var black = Color.new(0, 0, 0);
    var white = Color.new(255, 255, 255);

    Draw.rect(0, 0, SCREEN_W, SCREEN_H, black);

    var a = Math.floor(as.textAlpha * 128);
    var textColor = Color.new(255, 255, 255, a);

    fontPrint(toScreenX(GCX - 60), toScreenY(GCY - 20),
        "STAGE " + String(gameState.stageId + 1), textColor);

    fontPrint(toScreenX(GCX - 50), toScreenY(GCY + 10),
        "GET READY!", textColor);
}
