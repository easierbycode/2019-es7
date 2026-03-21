// src/ps2/scenes.js — Scene management for PS2 AthenaEnv port
// Scenes: title, adventure (pre-game), game, continue, ending

var SCENE_TITLE = "title";
var SCENE_ADV = "adventure";
var SCENE_GAME = "game";
var SCENE_CONTINUE = "continue";
var SCENE_ENDING = "ending";

var currentScene = "";
var sceneTimer = 0;
var sceneFadeAlpha = 0;
var sceneFading = false;
var sceneNextScene = "";

// Title scene state
var titleState = {
    introTimer: 0,
    introDone: false,
    startBtnVisible: false,
    bgScrollX: 0,
};

// Adventure (pre-game cutscene) state
var advState = {
    timer: 0,
    phase: 0,
    textAlpha: 0,
};

// Game scene state
var gameSceneState = {
    waveInterval: 80,
    waveCount: 0,
    frameCnt: 0,
    enemyWaveFlg: false,
    theWorldFlg: false,
    enemies: [],
    projectiles: [],
    items: [],
    player: null,
    boss: null,
    bossTimerStartFlg: false,
    bossTimerCountDown: 99,
    bossTimerFrameCnt: 0,
    stageEnemyList: [],
    stageBgScrollY: 0,
    stageBgmName: "",
    sceneSwitch: 0,
    // SP fire
    spLineH: 0,
    spFireActive: false,
    spFireTimer: 0,
    // Stage clear / game over
    resultTimer: 0,
};

// Continue scene state
var continueState = {
    countDown: 9,
    countDownTimer: 0,
    selection: -1, // -1 = none, 0 = yes, 1 = no
    cursorPos: 0,
    gameOverShown: false,
    gameOverTimer: 0,
};

// --- Scene transitions ---

function switchScene(sceneName) {
    sceneFading = true;
    sceneNextScene = sceneName;
    sceneFadeAlpha = 0;
}

function switchSceneImmediate(sceneName) {
    currentScene = sceneName;
    sceneTimer = 0;
    sceneFading = false;
    sceneFadeAlpha = 0;
    initScene(sceneName);
}

function updateSceneTransition() {
    if (!sceneFading) return;

    sceneFadeAlpha += 0.03;
    if (sceneFadeAlpha >= 1.0) {
        sceneFadeAlpha = 1.0;
        currentScene = sceneNextScene;
        sceneTimer = 0;
        initScene(currentScene);
        sceneFading = false;
    }
}

function drawSceneFade() {
    if (sceneFadeAlpha > 0 && sceneFading) {
        var a = Math.floor(sceneFadeAlpha * 128);
        var fadeColor = Color.new(0, 0, 0, a);
        Draw.rect(0, 0, SCREEN_W, SCREEN_H, fadeColor);
    }
}

// --- Scene initialization ---

function initScene(name) {
    killAllTweens();
    clearAllTimers();

    switch (name) {
    case SCENE_TITLE:
        initTitleScene();
        break;
    case SCENE_ADV:
        initAdvScene();
        break;
    case SCENE_GAME:
        initGameScene();
        break;
    case SCENE_CONTINUE:
        initContinueScene();
        break;
    case SCENE_ENDING:
        initEndingScene();
        break;
    }
}

function initTitleScene() {
    titleState.introTimer = 0;
    titleState.introDone = false;
    titleState.startBtnVisible = false;
    titleState.bgScrollX = 0;
    stopAllSounds();
}

function initAdvScene() {
    advState.timer = 0;
    advState.phase = 0;
    advState.textAlpha = 0;
    playBgm("adventure_bgm");
    playSound("g_adbenture_voice0");
}

function initGameScene() {
    var gs = gameSceneState;
    gs.waveCount = 0;
    gs.frameCnt = 0;
    gs.enemyWaveFlg = false;
    gs.theWorldFlg = false;
    gs.enemies = [];
    gs.projectiles = [];
    gs.items = [];
    gs.boss = null;
    gs.bossTimerStartFlg = false;
    gs.bossTimerCountDown = 99;
    gs.bossTimerFrameCnt = 0;
    gs.stageBgScrollY = 0;
    gs.sceneSwitch = 0;
    gs.spFireActive = false;
    gs.spFireTimer = 0;
    gs.spLineH = 0;
    gs.resultTimer = 0;

    // Load stage enemy list from recipe
    var recipe = gameState.recipe;
    if (recipe) {
        var stageKey = "stage" + String(gameState.stageId);
        var stageData = recipe[stageKey];
        if (stageData && stageData.enemylist) {
            gs.stageEnemyList = stageData.enemylist.slice().reverse();
        } else {
            gs.stageEnemyList = [];
        }
    }

    // Create player
    var playerData = recipe ? recipe.playerData : null;
    if (playerData) {
        gs.player = createPlayer(playerData);
        playerSetUp(gs.player, gameState.playerMaxHp || playerData.maxHp,
            gameState.shootMode || "normal", gameState.shootSpeed || "speed_normal");
        gs.player.x = GW / 2 - gs.player.width / 2;
        gs.player.y = GH - gs.player.height - 30;
        gs.player.targetX = GW / 2;
        gs.player.targetY = gs.player.y;
    }

    // Boss BGM
    var bossData = recipe && recipe.bossData ? recipe.bossData["boss" + String(gameState.stageId)] : null;
    if (bossData) {
        gs.stageBgmName = "boss_" + bossData.name + "_bgm";
        stopBgm();
        playBgm(gs.stageBgmName);
    }

    hudReset();
    hudState.scoreCount = gameState.score || 0;
    hudState.highScore = gameState.highScore || 0;
    hudState.spgageCount = gameState.spgage || 0;

    // Start wave spawning after intro delay
    delayedCall(2600, function() {
        gs.enemyWaveFlg = true;
        if (gs.player) gs.player.shootOn = true;
        playSound("g_stage_voice_" + String(gameState.stageId));
    });

    playSound("voice_round" + String(Math.min(gameState.stageId, 3)));
    delayedCall(800, function() { playSound("voice_fight"); });
}

function initContinueScene() {
    continueState.countDown = 9;
    continueState.countDownTimer = 0;
    continueState.selection = -1;
    continueState.cursorPos = 0;
    continueState.gameOverShown = false;
    continueState.gameOverTimer = 0;
    stopAllSounds();
    playBgm("bgm_continue");
}

function initEndingScene() {
    stopAllSounds();
    playSound("voice_congra");
}

// --- Scene update ---

function updateCurrentScene() {
    sceneTimer++;

    switch (currentScene) {
    case SCENE_TITLE:
        updateTitleScene();
        break;
    case SCENE_ADV:
        updateAdvScene();
        break;
    case SCENE_GAME:
        updateGameScene();
        break;
    case SCENE_CONTINUE:
        updateContinueScene();
        break;
    case SCENE_ENDING:
        updateEndingScene();
        break;
    }
}

// --- Scene drawing ---

function drawCurrentScene() {
    switch (currentScene) {
    case SCENE_TITLE:
        drawTitleScene();
        break;
    case SCENE_ADV:
        drawAdvScene();
        break;
    case SCENE_GAME:
        drawGameScene();
        break;
    case SCENE_CONTINUE:
        drawContinueScene();
        break;
    case SCENE_ENDING:
        drawEndingScene();
        break;
    }
}
