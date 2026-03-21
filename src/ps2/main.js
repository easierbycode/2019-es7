// src/ps2/main.js — Main entry point for PS2 AthenaEnv port
// This file is the single-file bundle that loads all modules and runs the game loop.
//
// Build: Concatenate all ps2/*.js files (in dependency order) into one bundle,
// or use the AthenaEnv module system: std.loadScript("file.js")
//
// Usage on PS2:
//   Copy the built bundle + assets to a PS2 memory card or CD/DVD ISO
//   Run via AthenaEnv: athena main.js
//
// File load order (if using std.loadScript):
//   1. constants.js
//   2. game_state.js
//   3. atlas.js
//   4. draw.js
//   5. sprite.js
//   6. tween.js
//   7. timer.js
//   8. sound.js
//   9. input.js
//   10. hud.js
//   11. projectile.js
//   12. player.js
//   13. enemy.js
//   14. boss.js
//   15. scenes.js
//   16. scene_title.js
//   17. scene_adv.js
//   18. scene_game.js
//   19. scene_continue.js
//   20. scene_ending.js
//   21. main.js (this file)

// --- Module Loading ---
// AthenaEnv uses std.loadScript() to include JS files
// These are loaded in order; each file adds to the global scope

(function() {
    var BASE = "";

    var modules = [
        "constants.js",
        "game_state.js",
        "atlas.js",
        "draw.js",
        "sprite.js",
        "tween.js",
        "timer.js",
        "sound.js",
        "input.js",
        "hud.js",
        "projectile.js",
        "player.js",
        "enemy.js",
        "boss.js",
        "scenes.js",
        "scene_title.js",
        "scene_adv.js",
        "scene_game.js",
        "scene_continue.js",
        "scene_ending.js",
    ];

    for (var i = 0; i < modules.length; i++) {
        std.loadScript(BASE + modules[i]);
    }
})();

// --- Asset Loading ---

// Minimal loader — no file I/O, just fallback recipe
function loadMinimalAssets() {
    console.log("[Main] Loading minimal assets (no files)...");
    gameState.recipe = createFallbackRecipe();

    if (gameState.recipe && gameState.recipe.playerData) {
        var pd = gameState.recipe.playerData;
        gameState.playerMaxHp = pd.maxHp || 100;
        gameState.playerHp = pd.maxHp || 100;
        gameState.spDamage = pd.spDamage || 50;
        gameState.shootMode = pd.defaultShootName || "normal";
        gameState.shootSpeed = pd.defaultShootSpeed || "speed_normal";
    }
    console.log("[Main] Minimal assets ready");
}

function loadAllAssets() {
    console.log("[Main] Loading assets...");

    // Load texture atlases
    // The game uses two main atlases: game_ui and game_asset
    // These need to be pre-converted from the web format to PNG + JSON
    loadAtlas("game_ui", "assets/game_ui.png", "assets/game_ui.json");
    loadAtlas("game_asset", "assets/game_asset.png", "assets/game_asset.json");

    // Load game recipe (level data)
    var recipeText = std.loadFile("assets/game.json");
    if (recipeText) {
        gameState.recipe = JSON.parse(recipeText);
        console.log("[Main] Recipe loaded");
    } else {
        console.log("[Main] WARNING: game.json not found, using fallback");
        gameState.recipe = createFallbackRecipe();
    }

    // Initialize player data defaults from recipe
    if (gameState.recipe && gameState.recipe.playerData) {
        var pd = gameState.recipe.playerData;
        gameState.playerMaxHp = pd.maxHp || 100;
        gameState.playerHp = pd.maxHp || 100;
        gameState.spDamage = pd.spDamage || 50;
        gameState.shootMode = pd.defaultShootName || "normal";
        gameState.shootSpeed = pd.defaultShootSpeed || "speed_normal";
    }

    // Load sound effects (converted to WAV/ADPCM for PS2)
    var sfxList = [
        "se_shoot", "se_shoot_b", "se_explosion", "se_damage", "se_guard",
        "se_sp", "se_sp_explosion", "se_barrier_start", "se_barrier_end",
        "se_decision", "se_correct", "se_cursor", "se_over",
    ];
    for (var i = 0; i < sfxList.length; i++) {
        loadSfx(sfxList[i], "assets/sounds/" + sfxList[i] + ".wav");
    }

    // Load voice clips
    var voiceList = [
        "voice_titlecall", "voice_fight", "voice_ko",
        "voice_another_fighter", "voice_congra", "voice_gameover",
        "voice_round0", "voice_round1", "voice_round2", "voice_round3",
        "g_damage_voice", "g_powerup_voice", "g_sp_voice",
        "g_adbenture_voice0", "voice_thankyou",
    ];
    for (var i = 0; i < voiceList.length; i++) {
        loadSfx(voiceList[i], "assets/sounds/" + voiceList[i] + ".wav");
    }

    // Load voice countdown
    for (var i = 0; i <= 9; i++) {
        loadSfx("voice_countdown" + String(i), "assets/sounds/scene_continue/voice_countdown" + String(i) + ".wav");
    }

    // Load continue voices
    for (var i = 0; i < 3; i++) {
        loadSfx("g_continue_yes_voice" + String(i), "assets/sounds/scene_continue/g_continue_yes_voice" + String(i) + ".wav");
    }
    for (var i = 0; i < 2; i++) {
        loadSfx("g_continue_no_voice" + String(i), "assets/sounds/scene_continue/g_continue_no_voice" + String(i) + ".wav");
    }

    // Load stage voices
    for (var i = 0; i < 5; i++) {
        loadSfx("g_stage_voice_" + String(i), "assets/sounds/scene_game/g_stage_voice_" + String(i) + ".wav");
    }

    // Load boss voices
    var bossNames = ["bison", "barlog", "sagat", "vega", "goki", "fang"];
    for (var i = 0; i < bossNames.length; i++) {
        var bn = bossNames[i];
        loadSfx("boss_" + bn + "_voice_add", "assets/sounds/boss_" + bn + "_voice_add.wav");
        loadSfx("boss_" + bn + "_voice_ko", "assets/sounds/boss_" + bn + "_voice_ko.wav");
    }

    // Load BGM streams (OGG for PS2)
    var bgmList = [
        "adventure_bgm",
        "boss_bison_bgm", "boss_barlog_bgm", "boss_sagat_bgm",
        "boss_vega_bgm", "boss_goki_bgm", "boss_fang_bgm",
        "bgm_continue", "bgm_gameover",
    ];
    for (var i = 0; i < bgmList.length; i++) {
        loadStream(bgmList[i], "assets/sounds/" + bgmList[i] + ".ogg");
    }

    console.log("[Main] Asset loading complete");
}

function createFallbackRecipe() {
    // Minimal recipe for testing without assets
    return {
        playerData: {
            name: "player",
            texture: [],
            hp: 100,
            maxHp: 100,
            spDamage: 50,
            defaultShootName: "normal",
            defaultShootSpeed: "speed_normal",
            shootNormal: { texture: [], interval: 8, damage: 1, hp: 1 },
            shootBig: { texture: [], interval: 12, damage: 3, hp: 3 },
            shoot3way: { texture: [], interval: 10, damage: 1, hp: 1 },
            barrier: { texture: [] },
        },
        enemyData: {
            enemyA: { name: "soliderA", texture: [], hp: 2, speed: 1, score: 100, spgage: 5, interval: 60 },
            enemyB: { name: "soliderB", texture: [], hp: 3, speed: 0.8, score: 150, spgage: 8, interval: 45 },
        },
        bossData: {
            boss0: { name: "bison", texture: [], hp: 80, score: 5000, spgage: 50, speed: 1, projectileData: { texture: [], speed: 2, damage: 1, hp: 1, name: "bullet" } },
            boss1: { name: "barlog", texture: [], hp: 100, score: 6000, spgage: 50, speed: 1, projectileData: { texture: [], speed: 2.5, damage: 1, hp: 1, name: "bullet" } },
            boss2: { name: "sagat", texture: [], hp: 120, score: 7000, spgage: 50, speed: 1, projectileData: { texture: [], speed: 2, damage: 1, hp: 1, name: "bullet" } },
            boss3: { name: "vega", texture: [], hp: 140, score: 8000, spgage: 50, speed: 1, projectileData: { texture: [], speed: 2, damage: 1, hp: 1, name: "bullet" } },
            boss4: { name: "fang", texture: [], hp: 160, score: 10000, spgage: 50, speed: 1, projectileData: { texture: [], speed: 2, damage: 1, hp: 1, name: "bullet" } },
        },
        stage0: { enemylist: [["A0","00","A0","00","A0","00","A0","00"],["00","A0","00","A0","00","A0","00","A0"],["A1","00","A2","00","A9","00","A3","00"]] },
        stage1: { enemylist: [["B0","A0","B0","00","A0","B0","A0","00"],["00","A0","00","B0","00","A0","00","B0"],["A1","00","A2","00","A9","00","A3","00"]] },
        stage2: { enemylist: [["A0","B0","A0","B0","A0","B0","A0","00"],["B0","00","B0","00","B0","00","B0","00"],["A1","00","A2","00","A9","00","A3","00"]] },
        stage3: { enemylist: [["B0","B0","A0","A0","B0","B0","A0","00"],["A0","A0","B0","B0","A0","A0","B0","00"],["A1","A2","A9","00","A3","00","A1","00"]] },
        stage4: { enemylist: [["B0","A0","B0","A0","B0","A0","B0","A0"],["A0","B0","A0","B0","A0","B0","A0","B0"],["A1","A2","A9","A3","A1","A2","A9","A3"]] },
    };
}

// --- Main Game Loop ---

// Visual progress helper — draw a colored bar and flip to show progress
function showProgress(step, msg) {
    Screen.clear(Color.new(0, 0, 0));
    // Progress bar
    Draw.rect(20, 200, step * 50, 20, Color.new(0, 255, 0));
    // Step indicator squares
    for (var i = 0; i < step; i++) {
        Draw.rect(20 + i * 55, 230, 40, 40, Color.new(255, 255, 0));
    }
    // Label
    gameFont.color = Color.new(128, 128, 128);
    gameFont.scale = 1.0;
    gameFont.print(20, 170, msg);
    Screen.flip();
}

function main() {
    console.log("[Main] PS2 STG - AthenaEnv Port");

    Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
    gameFont.scale = 1.0;

    showProgress(1, "initInput...");
    initInput();

    showProgress(2, "initSound...");
    try { initSound(); } catch(e) { console.log("initSound error: " + e); }

    showProgress(3, "loadAllAssets...");
    try { loadMinimalAssets(); } catch(e) { console.log("loadAssets error: " + e); }

    showProgress(4, "switchScene...");
    switchSceneImmediate(SCENE_TITLE);

    showProgress(5, "Starting loop...");

    // Main loop
    var frameTime = 1000 / FPS;
    var clearColor = Color.new(0, 0, 0);

    while (true) {
        Screen.clear(clearColor);

        updateInput();
        updateTimers(frameTime);
        updateTweens(frameTime);
        updateSceneTransition();

        if (!sceneFading) {
            updateCurrentScene();
        }

        drawCurrentScene();
        drawSceneFade();
        drawLetterbox();

        // Debug: show that loop is running
        Draw.rect(0, 0, 10, 10, Color.new(255, 0, 0));

        Screen.flip();
    }
}

// --- Entry Point ---
main();
