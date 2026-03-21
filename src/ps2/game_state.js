// src/ps2/game_state.js — Global game state (equivalent to src/gameState.js)

var gameState = {
    score: 0,
    highScore: 0,
    localHighScore: 0,
    stageId: 0,
    continueCnt: 0,
    akebonoCnt: 0,
    maxCombo: 0,
    spgage: 0,
    playerHp: 0,
    playerMaxHp: 0,
    shootMode: "normal",
    shootSpeed: "speed_normal",
    shortFlg: 0,
    secondLoop: 0,
    recipe: null,
};

function resetGameState() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.spgage = 0;
    gameState.stageId = 0;
    gameState.continueCnt = 0;
    gameState.akebonoCnt = 0;
    gameState.shortFlg = 0;
}

function saveHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
    if (gameState.highScore > gameState.localHighScore) {
        gameState.localHighScore = gameState.highScore;
    }
}
