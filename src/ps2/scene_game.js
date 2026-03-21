// src/ps2/scene_game.js — Main game scene logic for PS2 AthenaEnv

function updateGameScene() {
    var gs = gameSceneState;
    var p = gs.player;
    if (!p) return;

    if (gs.theWorldFlg) {
        // Check for stage clear / game over completion
        if (p.dead) {
            gs.resultTimer++;
            if (p.explosionPlaying) {
                p.explosionTimer++;
                if (p.explosionTimer % 3 === 0) p.explosionFrame++;
                if (p.explosionFrame > 6) p.explosionPlaying = 0;
            }
            if (gs.resultTimer > 90) {
                gameState.score = hudState.scoreCount;
                switchScene(SCENE_CONTINUE);
            }
            return;
        }

        // Boss dead sequence
        if (gs.boss && gs.boss.deadFlg) {
            var done = bossExplosionUpdate(gs.boss);
            if (done) {
                gs.resultTimer++;
            }
            if (gs.resultTimer > 75) {
                gameState.playerHp = p.hp;
                gameState.spgage = hudState.spgageCount;
                gameState.score = hudState.scoreCount;
                gameState.stageId++;
                if (gameState.stageId > 4) {
                    switchScene(SCENE_ENDING);
                } else {
                    switchScene(SCENE_ADV);
                }
            }
            return;
        }

        // SP fire active
        if (gs.spFireActive) {
            updateSpFire(gs);
        }
        return;
    }

    // --- Player input ---
    if (isLeftHeld()) {
        p.targetX -= PLAYER_MOVE_SPEED;
    }
    if (isRightHeld()) {
        p.targetX += PLAYER_MOVE_SPEED;
    }
    // Clamp
    if (p.targetX < p.hitW / 2) p.targetX = p.hitW / 2;
    if (p.targetX > GW - p.hitW / 2) p.targetX = GW - p.hitW / 2;

    // SP fire
    if (isSpPressed() && hudState.spBtnActive && hudState.spgageCount >= hudState.spgageMax && !gs.spFireActive) {
        startSpFire(gs);
    }

    // --- Update player ---
    playerLoop(p);

    // --- Update HUD ---
    hudLoop();
    hudState.hpPercent = p.percent;

    // --- Enemy waves ---
    if (gs.enemyWaveFlg) {
        gs.frameCnt++;
        if (gs.frameCnt % gs.waveInterval === 0) {
            if (gs.waveCount >= gs.stageEnemyList.length) {
                // Boss time
                spawnBoss(gs);
                gs.enemyWaveFlg = 0;
            } else {
                spawnEnemyWave(gs);
                gs.waveCount++;
            }
        }
    }

    // --- Update enemies ---
    for (var i = gs.enemies.length - 1; i >= 0; i--) {
        var e = gs.enemies[i];
        var result = enemyLoop(e, p);

        if (result === 0) {
            // Remove enemy
            gs.enemies.splice(i, 1);
            continue;
        }

        if (result === "shoot" && e.projectileData) {
            // Enemy shoots
            var proj = createProjectile({
                x: e.x + e.width / 2,
                y: e.y + e.hitH / 2,
                rotX: 0,
                rotY: 1,
                speed: e.projectileData.speed || 2,
                damage: e.projectileData.damage || 1,
                hp: e.projectileData.hp || 1,
                name: e.projectileData.name || "bullet",
                frames: e.projectileData.texture || [],
            });
            gs.projectiles.push(proj);
            playSfx("se_shoot");
        }

        // Hit test: enemy vs player bullets
        if (!e.deadFlg && e.y >= 40 && e.x >= -e.width / 2 && e.x <= GW - e.width / 2) {
            for (var j = p.bullets.length - 1; j >= 0; j--) {
                var b = p.bullets[j];
                if (hitTestAABB(e.x + e.hitX, e.y + e.hitY, e.hitW, e.hitH,
                    b.x, b.y, b.width, b.height)) {
                    enemyOnDamage(e, b.damage);
                    b.hp -= 1;
                    if (b.hp <= 0) {
                        p.bullets.splice(j, 1);
                    }
                    playSfx("se_damage");
                    if (e.deadFlg) {
                        hudOnEnemyKill(e.score, e.spgage);
                        // Drop item
                        if (e.itemName) {
                            gs.items.push({
                                x: e.x, y: e.y,
                                name: e.itemName,
                                frames: e.itemTexture || [],
                                animFrame: 0,
                                animCounter: 0,
                            });
                        }
                    }
                }
            }
        }

        // Hit test: enemy vs player (collision damage)
        if (!e.deadFlg && !p.dead) {
            if (p.barrierFlg) {
                if (hitTestAABB(e.x + e.hitX, e.y + e.hitY, e.hitW, e.hitH,
                    p.x + p.hitX, p.y - 15, p.hitW + 10, p.hitH + 20)) {
                    enemyDead(e);
                    hudOnEnemyKill(e.score, e.spgage);
                    playSfx("se_guard");
                }
            } else if (hitTestAABB(e.x + e.hitX, e.y + e.hitY, e.hitW, e.hitH,
                p.x + p.hitX, p.y + p.hitY, p.hitW, p.hitH)) {
                gamePlayerDamage(gs, 1);
            }
        }
    }

    // --- Update boss ---
    if (gs.boss && !gs.boss.dead) {
        bossLoop(gs.boss);

        // Collect boss projectiles
        while (gs.boss.pendingProjectiles.length > 0) {
            var pd = gs.boss.pendingProjectiles.shift();
            gs.projectiles.push(createProjectile(pd));
        }

        // Hit test: boss vs player bullets
        if (!gs.boss.deadFlg && gs.boss.entryDone) {
            for (var j = p.bullets.length - 1; j >= 0; j--) {
                var b = p.bullets[j];
                if (hitTestAABB(gs.boss.x + gs.boss.hitX, gs.boss.y + gs.boss.hitY,
                    gs.boss.hitW, gs.boss.hitH, b.x, b.y, b.width, b.height)) {
                    bossOnDamage(gs.boss, b.damage);
                    b.hp -= 1;
                    if (b.hp <= 0) {
                        p.bullets.splice(j, 1);
                    }
                    playSfx("se_damage");
                    if (gs.boss.deadFlg) {
                        hudOnEnemyKill(gs.boss.score, gs.boss.spgage);
                        gs.theWorldFlg = 1;
                        gs.resultTimer = 0;
                        p.shootOn = 0;
                        hudState.spBtnActive = 0;
                        playSound("voice_ko");
                    }
                }
            }

            // Hit test: boss vs player
            if (!gs.boss.deadFlg && !p.dead && !p.barrierFlg) {
                if (hitTestAABB(gs.boss.x + gs.boss.hitX, gs.boss.y + gs.boss.hitY,
                    gs.boss.hitW, gs.boss.hitH,
                    p.x + p.hitX, p.y + p.hitY, p.hitW, p.hitH)) {
                    gamePlayerDamage(gs, 1);
                }
            }
        }

        // Boss timer
        if (gs.bossTimerStartFlg) {
            gs.bossTimerFrameCnt++;
            if (gs.bossTimerFrameCnt % 30 === 0) {
                gs.bossTimerCountDown--;
                hudState.bossTimerCount = gs.bossTimerCountDown;
                if (gs.bossTimerCountDown <= 0) {
                    gs.bossTimerStartFlg = 0;
                    // Time over — player loses
                    gamePlayerDamage(gs, 9999);
                }
            }
        }
    }

    // --- Update projectiles ---
    for (var i = gs.projectiles.length - 1; i >= 0; i--) {
        var proj = gs.projectiles[i];
        if (!projectileLoop(proj, p)) {
            gs.projectiles.splice(i, 1);
            continue;
        }

        // Hit test: projectile vs player
        if (!p.dead) {
            if (p.barrierFlg) {
                if (hitTestAABB(proj.x - proj.width / 2, proj.y - proj.height / 2,
                    proj.width, proj.height,
                    p.x + p.hitX, p.y - 15, p.hitW + 10, p.hitH + 20)) {
                    proj.deadFlg = 1;
                    proj.dead = 1;
                    gs.projectiles.splice(i, 1);
                    playSfx("se_guard");
                }
            } else if (hitTestAABB(proj.x - proj.width / 2, proj.y - proj.height / 2,
                proj.width, proj.height,
                p.x + p.hitX, p.y + p.hitY, p.hitW, p.hitH)) {
                gamePlayerDamage(gs, proj.damage);
                proj.deadFlg = 1;
                proj.dead = 1;
                gs.projectiles.splice(i, 1);
            }
        }
    }

    // --- Update items ---
    for (var i = gs.items.length - 1; i >= 0; i--) {
        var item = gs.items[i];
        item.y += 1;
        item.animCounter += 0.08;

        // Hit test: item vs player
        if (hitTestAABB(item.x, item.y, 16, 16,
            p.x + p.hitX, p.y + p.hitY, p.hitW, p.hitH)) {
            switch (item.name) {
            case "speed_high":
                gameState.shootSpeed = item.name;
                playerShootSpeedChange(p, gameState.shootSpeed);
                break;
            case "barrier":
                playerBarrierStart(p);
                break;
            default:
                if (p.shootMode !== item.name) {
                    gameState.shootSpeed = "speed_normal";
                    playerShootSpeedChange(p, gameState.shootSpeed);
                }
                gameState.shootMode = item.name;
                playerShootModeChange(p, gameState.shootMode);
                break;
            }
            gs.items.splice(i, 1);
            continue;
        }

        if (item.y >= GH - 10) {
            gs.items.splice(i, 1);
        }
    }

    // --- Stage background scroll ---
    gs.stageBgScrollY += 0.7;
}

function drawGameScene() {
    var gs = gameSceneState;

    // Stage background
    drawStageBg(gs);

    // Items
    for (var i = 0; i < gs.items.length; i++) {
        var item = gs.items[i];
        if (item.frames && item.frames.length > 0) {
            var fi = Math.floor(item.animCounter) % item.frames.length;
            var fname = resolveFrameName("game_asset", item.frames[fi]);
            drawFrame("game_asset", fname,
                toScreenX(item.x + 8), toScreenY(item.y + 8),
                SCALE, SCALE, 1.0, null);
        } else {
            // Fallback colored square
            Draw.rect(toScreenX(item.x), toScreenY(item.y), toScreenW(12), toScreenH(12),
                Color.new(255, 255, 0));
        }
    }

    // Enemies
    for (var i = 0; i < gs.enemies.length; i++) {
        enemyDraw(gs.enemies[i]);
    }

    // Boss
    if (gs.boss) {
        bossDraw(gs.boss);
    }

    // Projectiles
    for (var i = 0; i < gs.projectiles.length; i++) {
        projectileDraw(gs.projectiles[i]);
    }

    // Player
    if (gs.player) {
        playerDraw(gs.player);
    }

    // SP fire effect
    if (gs.spFireActive && gs.player) {
        var spColor = Color.new(255, 50, 50, 100);
        Draw.rect(toScreenX(gs.player.x + 12), toScreenY(gs.player.y - gs.spLineH),
            toScreenW(3), toScreenH(gs.spLineH), spColor);
    }

    // HUD
    hudDraw();

    // Stage/round title overlay
    if (sceneTimer < 90) {
        var titleAlpha = sceneTimer < 60 ? 1.0 : (1.0 - (sceneTimer - 60) / 30);
        var ta = Math.floor(titleAlpha * 128);
        var titleColor = Color.new(255, 255, 255, ta);
        fontPrint(toScreenX(GCX - 30), toScreenY(GCY - 40),
            "ROUND " + String(gameState.stageId + 1), titleColor);
    }
    if (sceneTimer >= 40 && sceneTimer < 100) {
        var fightAlpha = sceneTimer < 80 ? 1.0 : (1.0 - (sceneTimer - 80) / 20);
        var fa = Math.floor(fightAlpha * 128);
        var fightColor = Color.new(255, 200, 0, fa);
        fontPrint(toScreenX(GCX - 20), toScreenY(GCY),
            "FIGHT!", fightColor);
    }

    // Game over text
    if (gs.player && gs.player.dead && gs.resultTimer > 30) {
        fontPrint(toScreenX(GCX - 20), toScreenY(GCY - 10),
            "K.O.", Color.new(255, 60, 60));
    }

    // Stage clear text
    if (gs.boss && gs.boss.dead && gs.resultTimer > 20) {
        fontPrint(toScreenX(GCX - 35), toScreenY(GCY - 10),
            "STAGE CLEAR!", Color.new(255, 255, 0));
    }
}

function drawStageBg(gs) {
    // Draw tiled stage background
    var stageKey = "stage_loop" + String(gameState.stageId);
    if (hasFrame("game_ui", stageKey)) {
        // Tile vertically with scroll
        var bgH = 480;
        var scrollY = gs.stageBgScrollY % bgH;
        drawFrameTL("game_ui", stageKey, toScreenX(0), toScreenY(-bgH + scrollY),
            SCALE, SCALE, 1.0);
        drawFrameTL("game_ui", stageKey, toScreenX(0), toScreenY(scrollY),
            SCALE, SCALE, 1.0);
    } else {
        // Solid color fallback per stage
        var bgColors = [
            Color.new(20, 20, 60),
            Color.new(40, 15, 15),
            Color.new(15, 40, 15),
            Color.new(30, 15, 40),
            Color.new(40, 30, 10),
        ];
        var bgColor = bgColors[gameState.stageId % bgColors.length];
        Draw.rect(toScreenX(0), toScreenY(0), toScreenW(GW), toScreenH(GH), bgColor);
    }
}

// --- Enemy wave spawning ---

function spawnEnemyWave(gs) {
    var recipe = gameState.recipe;
    if (!recipe || !recipe.enemyData) return;

    var row = gs.stageEnemyList[gs.waveCount] || [];
    for (var i = 0; i < row.length; i++) {
        var code = String(row[i]);
        if (code === "00") continue;

        var enemyType = code.substr(0, 1);
        var itemCode = code.substr(1, 2);
        var eData = recipe.enemyData["enemy" + enemyType];
        if (!eData) continue;

        var enemy = createEnemy(eData);
        enemy.x = 32 * i;
        enemy.y = -32;

        // Assign item drop
        switch (itemCode) {
        case "1":
            enemy.itemName = "big";
            enemy.itemTexture = ["powerupBig0.gif", "powerupBig1.gif"];
            break;
        case "2":
            enemy.itemName = "3way";
            enemy.itemTexture = ["powerup3way0.gif", "powerup3way1.gif"];
            break;
        case "3":
            enemy.itemName = "speed_high";
            enemy.itemTexture = ["speedupItem0.gif", "speedupItem1.gif"];
            break;
        case "9":
            enemy.itemName = "barrier";
            enemy.itemTexture = ["barrierItem0.gif", "barrierItem1.gif"];
            break;
        }

        gs.enemies.push(enemy);
    }
}

// --- Boss spawning ---

function spawnBoss(gs) {
    var recipe = gameState.recipe;
    if (!recipe || !recipe.bossData) return;

    var bossData = recipe.bossData["boss" + String(gameState.stageId)];
    if (!bossData) return;

    gs.boss = createBoss(bossData, gameState.stageId);
    gs.boss.x = GCX - gs.boss.width / 2;
    gs.boss.moveTargetX = gs.boss.x;
    bossEntry(gs.boss);

    // Start boss timer after entry
    delayedCall(6000, function() {
        gs.bossTimerStartFlg = 1;
        gs.bossTimerCountDown = 99;
        gs.bossTimerFrameCnt = 0;
        hudState.bossTimerVisible = 1;
        hudState.bossTimerCount = 99;
    });

    hudState.spBtnActive = 1;
    playSound("voice_another_fighter");
}

// --- Player damage ---

function gamePlayerDamage(gs, amount) {
    if (!gs.player || gs.player.dead) return;
    playerOnDamage(gs.player, amount);
    hudState.hpPercent = gs.player.percent;
    if (gs.player.dead) {
        gs.theWorldFlg = 1;
        gs.resultTimer = 0;
        gameState.score = hudState.scoreCount;
        hudState.spBtnActive = 0;
        if (gs.boss) gs.boss.theWorld = 1;
    }
}

// --- SP fire ---

function startSpFire(gs) {
    gs.spFireActive = 1;
    gs.spFireTimer = 0;
    gs.spLineH = 0;
    gs.theWorldFlg = 1;
    hudState.spFireFlg = 1;
    hudState.spgageCount = 0;
    hudState.spBtnActive = 0;
    if (gs.boss) gs.boss.theWorld = 1;
    playSound("g_sp_voice");
    playSound("se_sp");
}

function updateSpFire(gs) {
    gs.spFireTimer++;

    // Phase 1: beam extends (0-30)
    if (gs.spFireTimer < 30) {
        gs.spLineH = (gs.spFireTimer / 30) * GH;
    }
    // Phase 2: explosions (30-90)
    else if (gs.spFireTimer < 90) {
        if (gs.spFireTimer % 4 === 0) {
            playSound("se_sp_explosion");
        }
    }
    // Phase 3: apply damage (90)
    else if (gs.spFireTimer === 90) {
        var spDamage = gameState.spDamage || 50;
        // Damage all enemies
        for (var i = gs.enemies.length - 1; i >= 0; i--) {
            enemyOnDamage(gs.enemies[i], spDamage);
            if (gs.enemies[i].deadFlg) {
                hudOnEnemyKill(gs.enemies[i].score, gs.enemies[i].spgage);
            }
        }
        // Damage boss
        if (gs.boss && !gs.boss.deadFlg) {
            bossOnDamage(gs.boss, spDamage);
            if (gs.boss.deadFlg) {
                hudOnEnemyKill(gs.boss.score, gs.boss.spgage);
                gs.resultTimer = 0;
                playSound("voice_ko");
            }
        }
        // Clear projectiles
        gs.projectiles = [];
    }
    // Phase 4: end (120)
    else if (gs.spFireTimer >= 120) {
        gs.spFireActive = 0;
        gs.spLineH = 0;
        hudState.spFireFlg = 0;
        if (gs.boss && !gs.boss.deadFlg) {
            gs.theWorldFlg = 0;
            gs.boss.theWorld = 0;
        }
    }
}

// --- AABB helper ---

function hitTestAABB(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
