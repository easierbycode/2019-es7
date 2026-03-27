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

// Normalize recipe: convert web game.json format to PS2 expected format
// Web bosses use anim.idle/anim.attack; PS2 expects flat texture array
// Web bosses use bulletData; PS2 expects projectileData
function normalizeRecipe(recipe) {
    if (!recipe || !recipe.bossData) return;

    var bossKeys = Object.keys(recipe.bossData);
    for (var i = 0; i < bossKeys.length; i++) {
        var boss = recipe.bossData[bossKeys[i]];

        // Map anim.idle -> texture (for sprite animation)
        if ((!boss.texture || boss.texture.length === 0) && boss.anim) {
            boss.texture = boss.anim.idle || [];
            boss.attackTexture = boss.anim.attack || [];
        }

        // Map bulletData -> projectileData
        if (!boss.projectileData && boss.bulletData && boss.bulletData.texture) {
            boss.projectileData = {
                texture: boss.bulletData.texture || [],
                speed: boss.bulletData.speed || 2,
                damage: boss.bulletData.damage || 1,
                hp: boss.bulletData.hp || 1,
                name: "bullet",
            };
        }

        // Ensure projectileData exists (some bosses have no bullets)
        if (!boss.projectileData) {
            boss.projectileData = { texture: [], speed: 2, damage: 1, hp: 1, name: "bullet" };
        }

        // Ensure speed exists
        if (!boss.speed) boss.speed = 1;
    }
    // Normalize enemy data: map bulletData -> projectileData
    if (recipe.enemyData) {
        var enemyKeys = Object.keys(recipe.enemyData);
        for (var j = 0; j < enemyKeys.length; j++) {
            var enemy = recipe.enemyData[enemyKeys[j]];
            if (!enemy.projectileData && enemy.bulletData && enemy.bulletData.texture) {
                enemy.projectileData = {
                    texture: enemy.bulletData.texture || [],
                    speed: enemy.bulletData.speed || 2,
                    damage: enemy.bulletData.damage || 1,
                    hp: enemy.bulletData.hp || 1,
                    name: "bullet",
                    interval: enemy.bulletData.interval || 120,
                };
            }
        }
    }

    console.log("[Main] Recipe normalized");
}

// Load a pre-exported Firebase level file and merge it into the base recipe.
// Mirrors the Phaser BootScene._loadFirebaseLevel() merge logic.
// The level file is a JSON export of a Firebase levels/{name} entry containing
// at minimum: { enemylist: [...], stageKey?: "stageN", enemyData?: {...} }
function loadFirebaseLevel(recipe, levelPath) {
    var levelText = std.loadFile(levelPath);
    if (!levelText) {
        console.log("[Main] Firebase level file not found: " + levelPath);
        return;
    }

    var data = JSON.parse(levelText);
    if (!data || !data.enemylist) {
        console.log("[Main] Firebase level missing enemylist, skipping");
        return;
    }

    // Merge enemylist into recipe at the appropriate stageKey
    var stageKey = data.stageKey || "stage0";
    recipe[stageKey] = { enemylist: data.enemylist };
    console.log("[Main] Firebase level merged into " + stageKey +
        " (" + data.enemylist.length + " waves)");

    // Merge enemyData: use Firebase values, textures come from level_atlas
    // Tag each enemy with its atlas source so rendering knows where to look
    if (data.enemyData) {
        var merged = JSON.parse(JSON.stringify(data.enemyData));

        for (var ek in merged) {
            // Mark that this enemy's textures are in the level atlas
            merged[ek].atlas = "level_atlas";
            // Tag projectile atlas too
            var projKey = merged[ek].projectileData ? "projectileData" : (merged[ek].bulletData ? "bulletData" : null);
            if (projKey && merged[ek][projKey]) {
                merged[ek][projKey].atlas = "level_atlas";
            }
        }

        recipe.enemyData = merged;
        console.log("[Main] Firebase enemyData merged (level_atlas)");
    }

    // Merge bossData: use Firebase values, tag textures with level_atlas
    if (data.bossData) {
        var mergedBoss = JSON.parse(JSON.stringify(data.bossData));

        for (var bk in mergedBoss) {
            var boss = mergedBoss[bk];
            if (boss && boss.anim) {
                boss.atlas = "level_atlas";
            }
            var bossProjKey = boss && boss.bulletData ? "bulletData" : null;
            if (bossProjKey && boss[bossProjKey]) {
                boss[bossProjKey].atlas = "level_atlas";
            }
        }

        recipe.bossData = mergedBoss;
        console.log("[Main] Firebase bossData merged (level_atlas)");
    }

    // Parse stageId from stageKey and set in gameState
    var stageId = parseInt(stageKey.replace("stage", ""), 10);
    if (isNaN(stageId) || stageId < 0) stageId = 0;
    if (stageId > 4) stageId = 4;
    gameState.stageId = stageId;
}

function loadAllAssets() {
    console.log("[Main] Loading assets...");

    // Load texture atlases
    // The game uses two main atlases: game_ui and game_asset
    // These need to be pre-converted from the web format to PNG + JSON
    loadAtlas("game_ui", "assets/game_ui.png", "assets/game_ui.json");
    loadAtlas("game_asset", "assets/game_asset.png", "assets/game_asset.json");

    // Load cyber-liberty player spritesheet (32x32 frames)
    loadSpritesheet("cyber-liberty", "assets/cyber-liberty.png", 32, 32);

    // Load 2028 level custom enemy atlas (pre-exported from Firebase)
    loadAtlas("level_atlas", "assets/level_2028_atlas.png", "assets/level_2028_atlas.json");

    // Load game recipe (level data)
    var recipeText = std.loadFile("assets/game.json");
    if (recipeText) {
        gameState.recipe = JSON.parse(recipeText);
        console.log("[Main] Recipe loaded");
    } else {
        console.log("[Main] WARNING: game.json not found, using fallback");
        gameState.recipe = createFallbackRecipe();
    }

    // Normalize recipe: map web format -> PS2 format
    normalizeRecipe(gameState.recipe);

    // Load and merge the pre-exported Firebase 2028 level
    // This file is a JSON export of the Firebase levels/2028 entry
    loadFirebaseLevel(gameState.recipe, "assets/level_2028.json");

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

function main() {
    console.log("[Main] PS2 STG - AthenaEnv Port");

    Screen.setParam(Screen.DEPTH_TEST_ENABLE, 0);
    gameFont.scale = 1.0;

    initInput();
    initSound();
    loadAllAssets();
    switchSceneImmediate(SCENE_TITLE);

    // Main loop
    var frameTime = 1000 / FPS;
    var clearColor = Color.new(0, 0, 0);

    while (1) {
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

        Screen.flip();
    }
}

// --- Entry Point ---
main();
