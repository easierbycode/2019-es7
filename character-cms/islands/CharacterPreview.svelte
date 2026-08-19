<script lang="ts">
  // Live preview for the character JSON in the editor.
  //
  // Three stacked previews:
  //   1. Texture/animation strip — every frame from `texture[]`, animated.
  //   2. Movement preview         — simulates idle / walk / vertical /
  //                                 horizontal / tween motion on a canvas.
  //   3. Projectile preview        — emits projectiles using bulletData /
  //                                 shootNormal config.
  //
  // Frames come from lib/atlas.ts, which prefers the game's own on-disk
  // atlas (/game-assets/<atlasKey>.{json,png}) over RTDB's shared spriteX
  // namespace. Sprite sheets in the game use the "game_asset" atlas.

  import { onDestroy } from "svelte";
  import {
    type Atlas,
    drawFrame as drawAtlasFrame,
    loadAtlas,
    missingFrames,
    resolveFrame,
  } from "../lib/atlas.ts";
  import {
    allFrameNames,
    projectileFrames,
    spriteFrames,
  } from "../lib/character.ts";
  import { type BossSim, createBossSim } from "../lib/boss-patterns.ts";
  import { getDB, ref as fbRef, get as fbGet } from "../lib/firebase.ts";

  interface Props {
    kind: "player" | "enemy" | "boss";
    gameKey: string;
    // deno-lint-ignore no-explicit-any
    data: any;
    /** RTDB key of this entry — the boss patterns are keyed by it. */
    entryKey?: string;
    atlasKey?: string;
  }

  let { kind, gameKey, data, entryKey, atlasKey = "game_asset" }: Props =
    $props();

  // The game runs its simulation in fixed 8.333ms steps (GameScene.js:903), and
  // playerData intervals and bullet speeds are counted in those steps, not in
  // frames or milliseconds. The previews draw sprites at 2x, so distances
  // scale with them while durations do not.
  const STEP_MS = 8.333333;
  const PREVIEW_SCALE = 2;
  /** Bullet.js: player bullets advance 3.5px per step. */
  const PLAYER_BULLET_PX_PER_MS = 3.5 * PREVIEW_SCALE / STEP_MS;

  // -- Reactive: load atlas once, then re-render whenever data changes -----
  let atlas: Atlas | null = $state(null);
  let atlasError: string | null = $state(null);

  $effect(() => {
    void atlasKey; void gameKey;
    atlas = null;
    atlasError = null;
    loadAtlas(atlasKey, gameKey)
      .then((a) => {
        if (a) atlas = a;
        else atlasError = `Atlas "${atlasKey}" not found (checked ` +
          `games/${gameKey}/atlases/${atlasKey}, /game-assets/${atlasKey}.json ` +
          `and atlases/${atlasKey}).`;
      })
      .catch((e) => atlasError = String((e as Error).message ?? e));
  });

  // Frame names the JSON asks for that this atlas cannot draw. Surfacing these
  // is the whole point: an unresolved name used to render as an empty cell,
  // which looks identical to "still loading".
  let unresolved: string[] = $derived(
    atlas ? missingFrames(atlas, allFrameNames(data)) : [],
  );

  // -- Frame drawing helper -----------------------------------------------
  // A frame the atlas cannot resolve draws a red cross rather than nothing, so
  // a bad frame name shows up in the preview instead of leaving a blank cell.
  function drawFrame(
    ctx: CanvasRenderingContext2D,
    a: Atlas,
    name: string,
    dx: number, dy: number,
    scale = 1,
    rotation = 0,
  ) {
    if (drawAtlasFrame(ctx, a, name, dx, dy, scale, rotation)) return true;
    const s = 16 * scale;
    ctx.save();
    ctx.strokeStyle = "#ff6b6b";
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(Math.round(dx - s / 2) + 0.5, Math.round(dy - s / 2) + 0.5, s, s);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(dx - s / 2, dy - s / 2); ctx.lineTo(dx + s / 2, dy + s / 2);
    ctx.moveTo(dx + s / 2, dy - s / 2); ctx.lineTo(dx - s / 2, dy + s / 2);
    ctx.stroke();
    ctx.restore();
    return false;
  }

  // -- 1. Frame strip ------------------------------------------------------
  let stripCanvas: HTMLCanvasElement | null = $state(null);
  let animFrame = 0;
  let animLoop: number | null = null;

  function getTextureFrames(): string[] {
    return spriteFrames(data);
  }

  // How this kind of character fires, mirroring the runtime:
  //   player      — bullets fly up at 3.5px/step, art rotated -90deg
  //                 (game-objects/Bullet.js shootBullets)
  //   enemy/boss  — bullets fly straight down at bulletData.speed, unrotated
  //                 (game-objects/Enemy.js enemyShoot)
  // Bullet art is drawn facing right, so an unrotated bullet points the way it
  // was authored, not the way it travels.
  const firesUp = $derived(kind === "player");
  const bulletRotation = $derived(firesUp ? -Math.PI / 2 : 0);

  /** Which of the player's three shots is selected, and its config. */
  let shootMode: "normal" | "big" | "3way" = $state("normal");
  function shootCfg() {
    const key = shootMode === "big"
      ? "shootBig"
      : shootMode === "3way"
      ? "shoot3way"
      : "shootNormal";
    return data?.[key] ?? null;
  }

  function getProjectileFrames(): string[] {
    return projectileFrames(data);
  }

  /** The two player frames the boss viewer puts on stage as an aim target. */
  function getPlayerFrames(): string[] {
    if (!atlas) return [];
    return Object.keys(atlas.frames)
      .filter((k) => /^player0[0-9]\.gif$/.test(k))
      .sort()
      .slice(0, 2);
  }

  $effect(() => {
    void atlas; void data;
    if (animLoop) cancelAnimationFrame(animLoop);
    if (!atlas || !stripCanvas) return;
    const ctx = stripCanvas.getContext("2d");
    if (!ctx) return;
    const frames = getTextureFrames();
    let last = performance.now();
    let acc = 0;
    const fps = 8;
    const step = 1000 / fps;
    const loop = (now: number) => {
      acc += now - last;
      last = now;
      while (acc >= step) {
        animFrame = (animFrame + 1) % Math.max(1, frames.length);
        acc -= step;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
      // tile frames horizontally
      const cellW = stripCanvas.width / Math.max(1, frames.length);
      const scale = 2;
      for (let i = 0; i < frames.length; i++) {
        const dim = i === animFrame ? "rgba(255,209,102,0.15)" : null;
        if (dim) { ctx.fillStyle = dim; ctx.fillRect(cellW * i, 0, cellW, stripCanvas.height); }
        drawFrame(ctx, atlas!, frames[i], cellW * i + cellW / 2, stripCanvas.height / 2, scale);
      }
      animLoop = requestAnimationFrame(loop);
    };
    animLoop = requestAnimationFrame(loop);
  });

  // -- 2. Movement preview ------------------------------------------------
  let moveCanvas: HTMLCanvasElement | null = $state(null);
  let moveLoop: number | null = null;

  // Bosses do not "move" in a generic way — they run scripted attack patterns.
  // lib/boss-patterns.ts is the same simulation cmg's level editor boss viewer
  // runs, so this panel shows the tween and the projectiles the boss actually
  // uses. Sibling bosses are fetched because a pattern can fire a projectile
  // its own entry does not define (boss0 carries no bulletData at all).
  // deno-lint-ignore no-explicit-any
  let bossSiblings: Record<string, any> = $state({});
  let bossMove: number | "idle" = $state("idle");

  $effect(() => {
    void gameKey;
    if (kind !== "boss") return;
    fbGet(fbRef(getDB(), `games/${gameKey}/bossData`))
      .then((snap) => { bossSiblings = snap.val() ?? {}; })
      .catch(() => {});
  });

  let bossSim: BossSim | null = $derived.by(() => {
    if (kind !== "boss" || !atlas || !data) return null;
    const sim = createBossSim({
      data,
      bossKey: entryKey ?? "",
      siblings: bossSiblings,
      hasFrame: (n) => !!resolveFrame(atlas!, n),
    });
    return sim.pattern ? sim : null;
  });
  let movementMode: "idle" | "vertical" | "horizontal" | "tween" = $state("idle");

  $effect(() => {
    void atlas; void data; void movementMode; void shootMode;
    if (moveLoop) cancelAnimationFrame(moveLoop);
    // Bosses run their real attack pattern instead — see the boss sim below.
    if (bossSim) return;
    if (!atlas || !moveCanvas) return;
    const ctx = moveCanvas.getContext("2d");
    if (!ctx) return;
    const frames = getTextureFrames();
    if (!frames.length) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, moveCanvas.width, moveCanvas.height);
      ctx.fillStyle = "#8a8f9c"; ctx.font = "12px sans-serif";
      ctx.fillText("No texture frames", 12, 20);
      return;
    }

    const speed: number = (data?.speed ?? 0.8) * 0.8; // px/ms-ish
    // Firing cadence, in the game's fixed steps: the player's comes from the
    // shot mode selected below, an enemy's from its own `interval`.
    const intervalSteps: number = firesUp
      ? (shootCfg()?.interval ?? 23)
      : (data?.interval ?? 36);
    const firePeriodMs = intervalSteps * STEP_MS;
    // Enemy.js: bullet advances by bulletData.speed each step.
    const bulletSpeed: number = data?.bulletData?.speed ??
      data?.bulletDataA?.speed ?? data?.projectileData?.speed ?? 1;
    let frameIdx = 0;
    let lastFrameTime = performance.now();
    const W = moveCanvas.width;
    const H = moveCanvas.height;
    let x = W / 2, y = movementMode === "vertical" ? -16 : H / 2;
    let dx = 1, dy = 1;
    let lastShot = performance.now();
    type Bullet = { x: number; y: number; vx: number; vy: number; born: number };
    const bullets: Bullet[] = [];
    const projectile = firesUp
      ? (shootCfg()?.texture ?? getProjectileFrames())
      : getProjectileFrames();

    // Tween config
    let tweenT0 = performance.now();
    const tween = data?.movement?.tween ?? null;

    let prev = performance.now();
    const draw = (now: number) => {
      const dtMs = Math.min(50, now - prev);
      prev = now;
      // movement
      if (movementMode === "vertical") {
        y += speed * 0.6;
        if (y > H + 16) y = -16;
      } else if (movementMode === "horizontal") {
        x += dx * speed;
        if (x < 24 || x > W - 24) dx = -dx;
      } else if (movementMode === "tween" && tween) {
        const t = ((now - tweenT0) / (tween.duration ?? 1500)) % 1;
        const yAmp = tween.yAmplitude ?? 60;
        const xAmp = tween.xAmplitude ?? 80;
        x = W / 2 + Math.sin(t * Math.PI * 2) * xAmp;
        y = H / 2 + Math.sin(t * Math.PI * 2 * (tween.yFreq ?? 2)) * yAmp;
      } else if (movementMode === "tween") {
        // Boss-style figure-8 default
        const t = ((now - tweenT0) / 2400) % 1;
        x = W / 2 + Math.sin(t * Math.PI * 2) * 80;
        y = H / 2 + Math.sin(t * Math.PI * 4) * 40;
      } else {
        // idle - hover
        y = H / 2 + Math.sin(now / 400) * 4;
        x = W / 2;
      }

      // shooting — muzzle, cadence and travel follow the runtime for this kind
      if (projectile.length && (now - lastShot) >= firePeriodMs) {
        bullets.push({
          x,
          y: firesUp ? y - 16 : y + 12,
          vx: 0,
          vy: firesUp
            ? -PLAYER_BULLET_PX_PER_MS
            : bulletSpeed * PREVIEW_SCALE / STEP_MS,
          born: now,
        });
        lastShot = now;
      }
      for (const b of bullets) { b.x += b.vx * dtMs; b.y += b.vy * dtMs; }
      while (
        bullets.length &&
        (bullets[0].y > H + 16 || bullets[0].y < -16 ||
          (now - bullets[0].born) > 8000)
      ) bullets.shift();

      // animation
      if (now - lastFrameTime > 120) {
        frameIdx = (frameIdx + 1) % frames.length;
        lastFrameTime = now;
      }

      // render
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // bullets
      for (const b of bullets) {
        if (projectile.length) {
          drawFrame(
            ctx, atlas!, projectile[frameIdx % projectile.length],
            b.x, b.y, 2, bulletRotation,
          );
        } else { ctx.fillStyle = "#ffd166"; ctx.fillRect(b.x - 1, b.y - 3, 2, 6); }
      }

      // sprite
      drawFrame(ctx, atlas!, frames[frameIdx], x, y, 2);

      moveLoop = requestAnimationFrame(draw);
    };
    moveLoop = requestAnimationFrame(draw);
  });

  // Boss attack loop. Positions are stage fractions, projectiles are stage
  // pixels — the same coordinate split the viewer uses.
  $effect(() => {
    const sim = bossSim;
    void bossMove;
    if (moveLoop) cancelAnimationFrame(moveLoop);
    if (!sim || !atlas || !moveCanvas) return;
    const ctx = moveCanvas.getContext("2d");
    if (!ctx) return;
    const W = moveCanvas.width, H = moveCanvas.height;
    const playerFrames = getPlayerFrames();

    sim.startMove(bossMove);
    let prev = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(50, now - prev);
      prev = now;
      sim.step(now, dt, W, H);
      const st = sim.state;

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // projectiles
      for (const p of st.projs) {
        drawFrame(ctx, atlas!, p.frames[p.fi % p.frames.length], p.x, p.y, 2);
      }

      // the player the pattern aims at
      if (playerFrames.length) {
        drawFrame(
          ctx, atlas!, playerFrames[st.frame % playerFrames.length],
          st.player.x * W, st.player.y * H, 2,
        );
      }

      // boss, scaled down if the frame is too tall for the stage
      const frames = data?.anim?.[st.animKey] ?? [];
      if (frames.length) {
        const name = frames[st.frame % frames.length];
        const f = resolveFrame(atlas!, name);
        const scale = f
          ? Math.max(1, Math.min(3, Math.floor((H * 0.34) / f.h)))
          : 2;
        ctx.save();
        ctx.globalAlpha = st.alpha;
        drawFrame(ctx, atlas!, name, st.x * W, st.y * H, scale);
        ctx.restore();
      }

      moveLoop = requestAnimationFrame(draw);
    };
    moveLoop = requestAnimationFrame(draw);
  });

  // -- 3. Projectile burst preview (player only) ---------------------------
  let projCanvas: HTMLCanvasElement | null = $state(null);
  let projLoop: number | null = null;

  $effect(() => {
    void atlas; void data; void shootMode;
    if (projLoop) cancelAnimationFrame(projLoop);
    if (!atlas || !projCanvas) return;
    const ctx = projCanvas.getContext("2d");
    if (!ctx) return;

    const W = projCanvas.width;
    const H = projCanvas.height;
    const playerFrames: string[] = Array.isArray(data?.texture) ? data.texture : [];

    const cfg = shootCfg();
    const projFrames: string[] = Array.isArray(cfg?.texture) ? cfg.texture : [];
    // playerData intervals count fixed steps, so Normal (23) fires roughly
    // twice as often as Big (39) — matching GameScene's shoot timer.
    const firePeriodMs = (cfg?.interval ?? 23) * STEP_MS;

    // Geometry copied from game-objects/Bullet.js shootBullets(): bullets leave
    // 16px above the player, climb at 3.5/step, and the art is rotated -90deg
    // into the direction of travel. 3-way fans out by +/-10px of muzzle offset,
    // 0.15 of horizontal drift and 0.2rad of extra tilt per side; big is 1.5x.
    const SPEED = PLAYER_BULLET_PX_PER_MS;
    type B = { x: number; y: number; vx: number; vy: number; rot: number };
    const bullets: B[] = [];
    let lastShot = performance.now();
    let frameIdx = 0;
    let lastF = performance.now();

    const px = W / 2, py = H - 40;
    const bulletScale = 2 * (shootMode === "big" ? 1.5 : 1);

    let prev = performance.now();
    const tick = (now: number) => {
      const dtMs = Math.min(50, now - prev);
      prev = now;
      if (now - lastShot >= firePeriodMs) {
        lastShot = now;
        const lanes = shootMode === "3way" ? [-1, 0, 1] : [0];
        for (const a of lanes) {
          bullets.push({
            x: px + a * 10,
            y: py - 16,
            vx: a * 0.15 * SPEED,
            vy: -SPEED,
            rot: -Math.PI / 2 + a * 0.2,
          });
        }
      }
      for (const b of bullets) { b.x += b.vx * dtMs; b.y += b.vy * dtMs; }
      while (bullets.length && bullets[0].y < -8) bullets.shift();

      if (now - lastF > 120) { frameIdx++; lastF = now; }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0b0d12"; ctx.fillRect(0, 0, W, H);

      // player
      if (playerFrames.length) drawFrame(ctx, atlas!, playerFrames[frameIdx % playerFrames.length], px, py, 2);
      // bullets
      for (const b of bullets) {
        if (projFrames.length) {
          drawFrame(
            ctx, atlas!, projFrames[frameIdx % projFrames.length],
            b.x, b.y, bulletScale, b.rot,
          );
        } else { ctx.fillStyle = "#6cf"; ctx.fillRect(b.x - 1, b.y - 4, 2, 8); }
      }

      projLoop = requestAnimationFrame(tick);
    };
    projLoop = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    if (animLoop) cancelAnimationFrame(animLoop);
    if (moveLoop) cancelAnimationFrame(moveLoop);
    if (projLoop) cancelAnimationFrame(projLoop);
  });
</script>

<div class="preview-stack">
  {#if atlasError}
    <div class="error-box">{atlasError}</div>
  {:else if unresolved.length}
    <div class="error-box">
      {unresolved.length} frame name{unresolved.length === 1 ? "" : "s"} not in
      atlas <code>{atlasKey}</code> ({atlas?.source}):
      <code>{unresolved.slice(0, 12).join(", ")}</code>{unresolved.length > 12
        ? ` +${unresolved.length - 12} more`
        : ""}
    </div>
  {/if}

  <div>
    <div class="panel-head" style="border-radius: 6px 6px 0 0;">Frames</div>
    <canvas bind:this={stripCanvas} class="preview-canvas" width="640" height="120" style="aspect-ratio: 640/120;"></canvas>
  </div>

  <div>
    <div class="panel-head" style="border-radius: 6px 6px 0 0; display:flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <span>{bossSim ? `Attack · ${bossSim.pattern?.label}` : 'Movement'}</span>
      <span style="flex:1"></span>
      {#if bossSim}
        <button class="btn" class:primary={bossMove==='idle'} onclick={() => bossMove='idle'}>Idle</button>
        {#each bossSim.moves as move, i (move.l)}
          <button class="btn" class:primary={bossMove===i} title={move.sub} onclick={() => bossMove=i}>{move.l}</button>
        {/each}
      {:else}
        <button class="btn" class:primary={movementMode==='idle'} onclick={() => movementMode='idle'}>Idle</button>
        <button class="btn" class:primary={movementMode==='vertical'} onclick={() => movementMode='vertical'}>Vertical</button>
        <button class="btn" class:primary={movementMode==='horizontal'} onclick={() => movementMode='horizontal'}>Horizontal</button>
        {#if kind === 'boss'}
          <button class="btn" class:primary={movementMode==='tween'} onclick={() => movementMode='tween'}>Tween</button>
        {/if}
      {/if}
    </div>
    {#if bossSim}
      <div class="hint" style="margin: 0; padding: 6px 12px; font-size: 12px;">
        {bossSim.pattern?.desc}
      </div>
    {/if}
    <canvas bind:this={moveCanvas} class="preview-canvas" width="640" height="360"></canvas>
  </div>

  {#if kind === 'player'}
    <div>
      <div class="panel-head" style="border-radius: 6px 6px 0 0; display:flex; gap: 8px; align-items: center;">
        <span>Projectiles</span>
        <span style="flex:1"></span>
        <button class="btn" class:primary={shootMode==='normal'} onclick={() => shootMode='normal'}>Normal</button>
        <button class="btn" class:primary={shootMode==='big'} onclick={() => shootMode='big'}>Big</button>
        <button class="btn" class:primary={shootMode==='3way'} onclick={() => shootMode='3way'}>3-way</button>
      </div>
      <canvas bind:this={projCanvas} class="preview-canvas" width="640" height="360"></canvas>
    </div>
  {/if}
</div>
