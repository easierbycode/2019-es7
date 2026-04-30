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
  // Frames are loaded from the atlas at /atlases/<atlasKey>/{json,png} or
  // /games/<gameKey>/atlases/<atlasKey>/{json,png}. Sprite sheets in the
  // game use the "game_asset" atlas by default.

  import { onDestroy } from "svelte";
  import { getDB, ref as fbRef, get as fbGet } from "../lib/firebase.ts";

  interface Props {
    kind: "player" | "enemy" | "boss";
    gameKey: string;
    // deno-lint-ignore no-explicit-any
    data: any;
    atlasKey?: string;
  }

  let { kind, gameKey, data, atlasKey = "game_asset" }: Props = $props();

  // -- Atlas loader (caches PNG + JSON, parses frames) ---------------------
  type Frame = { x: number; y: number; w: number; h: number };
  type Atlas = { image: HTMLImageElement; frames: Record<string, Frame> };

  // deno-lint-ignore no-explicit-any
  function decodeAtlasJson(raw: any): any {
    if (raw == null) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      try {
        const once = JSON.parse(raw);
        if (typeof once === "string") return JSON.parse(once);
        return once;
      } catch { return null; }
    }
    return null;
  }

  function decodeKey(k: string): string {
    if (!k.startsWith("k_")) return k;
    const hex = k.slice(2);
    let out = "";
    for (let i = 0; i < hex.length; i += 4) {
      out += String.fromCodePoint(parseInt(hex.slice(i, i + 4), 16));
    }
    return out;
  }

  async function loadAtlas(key: string): Promise<Atlas | null> {
    const db = getDB();
    const candidates = [
      `games/${gameKey}/atlases/${key}`,
      `atlases/${key}`,
    ];
    for (const path of candidates) {
      try {
        const snap = await fbGet(fbRef(db, path));
        if (!snap.exists()) continue;
        const v = snap.val() as { json?: unknown; png?: string };
        const json = decodeAtlasJson(v.json);
        if (!json || !json.frames) continue;
        const frames: Record<string, Frame> = {};
        for (const [name, entry] of Object.entries(json.frames as Record<string, unknown>)) {
          const f = (entry as { frame?: Frame })?.frame;
          if (f) frames[decodeKey(name)] = f;
        }
        const png = String(v.png ?? "");
        const src = png.startsWith("data:") ? png : `data:image/png;base64,${png}`;
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = (e) => reject(e);
          i.src = src;
        });
        return { image: img, frames };
      } catch {
        // try next candidate
      }
    }
    return null;
  }

  // -- Reactive: load atlas once, then re-render whenever data changes -----
  let atlas: Atlas | null = $state(null);
  let atlasError: string | null = $state(null);

  $effect(() => {
    void atlasKey;
    atlas = null;
    atlasError = null;
    loadAtlas(atlasKey)
      .then((a) => {
        if (a) atlas = a;
        else atlasError = `Atlas "${atlasKey}" not found in RTDB.`;
      })
      .catch((e) => atlasError = String((e as Error).message ?? e));
  });

  // -- Frame drawing helper -----------------------------------------------
  function drawFrame(
    ctx: CanvasRenderingContext2D,
    a: Atlas,
    name: string,
    dx: number, dy: number,
    scale = 1,
  ) {
    const f = a.frames[name] ?? a.frames[name.replace(/\.png$/, ".gif")] ?? a.frames[name.replace(/\.gif$/, ".png")];
    if (!f) return false;
    ctx.drawImage(
      a.image,
      f.x, f.y, f.w, f.h,
      Math.round(dx - (f.w * scale) / 2), Math.round(dy - (f.h * scale) / 2),
      f.w * scale, f.h * scale,
    );
    return true;
  }

  // -- 1. Frame strip ------------------------------------------------------
  let stripCanvas: HTMLCanvasElement | null = $state(null);
  let animFrame = 0;
  let animLoop: number | null = null;

  function getTextureFrames(): string[] {
    if (!data) return [];
    if (Array.isArray(data.texture)) return data.texture;
    return [];
  }

  function getProjectileFrames(): string[] {
    if (!data) return [];
    const candidates = [
      data.bulletData?.texture,
      data.projectileData?.texture,
      data.shootNormal?.texture,
    ];
    for (const c of candidates) if (Array.isArray(c) && c.length) return c;
    return [];
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
  let movementMode: "idle" | "vertical" | "horizontal" | "tween" = $state("vertical");

  $effect(() => {
    void atlas; void data; void movementMode;
    if (moveLoop) cancelAnimationFrame(moveLoop);
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
    const interval: number = data?.interval ?? 300;
    let frameIdx = 0;
    let lastFrameTime = performance.now();
    const W = moveCanvas.width;
    const H = moveCanvas.height;
    let x = W / 2, y = movementMode === "vertical" ? -16 : H / 2;
    let dx = 1, dy = 1;
    let lastShot = performance.now();
    type Bullet = { x: number; y: number; vx: number; vy: number; born: number };
    const bullets: Bullet[] = [];
    const projectile = getProjectileFrames();

    // Tween config
    let tweenT0 = performance.now();
    const tween = data?.movement?.tween ?? null;

    const draw = (now: number) => {
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

      // shooting
      if (projectile.length && (now - lastShot) > interval * 4) {
        bullets.push({ x, y: y + 12, vx: 0, vy: 1.2, born: now });
        lastShot = now;
      }
      for (const b of bullets) { b.x += b.vx; b.y += b.vy; }
      while (bullets.length && (bullets[0].y > H + 16 || (now - bullets[0].born) > 8000)) bullets.shift();

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
        if (projectile.length) drawFrame(ctx, atlas!, projectile[frameIdx % projectile.length], b.x, b.y, 2);
        else { ctx.fillStyle = "#ffd166"; ctx.fillRect(b.x - 1, b.y - 3, 2, 6); }
      }

      // sprite
      drawFrame(ctx, atlas!, frames[frameIdx], x, y, 2);

      moveLoop = requestAnimationFrame(draw);
    };
    moveLoop = requestAnimationFrame(draw);
  });

  // -- 3. Projectile burst preview (player only) ---------------------------
  let projCanvas: HTMLCanvasElement | null = $state(null);
  let projLoop: number | null = null;
  let shootMode: "normal" | "big" | "3way" = $state("normal");

  $effect(() => {
    void atlas; void data; void shootMode;
    if (projLoop) cancelAnimationFrame(projLoop);
    if (!atlas || !projCanvas) return;
    const ctx = projCanvas.getContext("2d");
    if (!ctx) return;

    const W = projCanvas.width;
    const H = projCanvas.height;
    const playerFrames: string[] = Array.isArray(data?.texture) ? data.texture : [];

    const cfg = (data && data[
      shootMode === "big" ? "shootBig" : shootMode === "3way" ? "shoot3way" : "shootNormal"
    ]) ?? null;
    const projFrames: string[] = Array.isArray(cfg?.texture) ? cfg.texture : [];
    const interval = cfg?.interval ?? 23;

    type B = { x: number; y: number; vx: number; vy: number };
    const bullets: B[] = [];
    let lastShot = performance.now();
    let frameIdx = 0;
    let lastF = performance.now();

    const px = W / 2, py = H - 40;

    const tick = (now: number) => {
      if (now - lastShot > interval * 16) {
        lastShot = now;
        if (shootMode === "3way") {
          bullets.push({ x: px, y: py - 10, vx: 0, vy: -2 });
          bullets.push({ x: px, y: py - 10, vx: -0.7, vy: -2 });
          bullets.push({ x: px, y: py - 10, vx: 0.7, vy: -2 });
        } else if (shootMode === "big") {
          bullets.push({ x: px, y: py - 10, vx: 0, vy: -1.6 });
        } else {
          bullets.push({ x: px, y: py - 10, vx: 0, vy: -2.4 });
        }
      }
      for (const b of bullets) { b.x += b.vx; b.y += b.vy; }
      while (bullets.length && bullets[0].y < -8) bullets.shift();

      if (now - lastF > 120) { frameIdx++; lastF = now; }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0b0d12"; ctx.fillRect(0, 0, W, H);

      // player
      if (playerFrames.length) drawFrame(ctx, atlas!, playerFrames[frameIdx % playerFrames.length], px, py, 2);
      // bullets
      for (const b of bullets) {
        if (projFrames.length) drawFrame(ctx, atlas!, projFrames[frameIdx % projFrames.length], b.x, b.y, 2);
        else { ctx.fillStyle = "#6cf"; ctx.fillRect(b.x - 1, b.y - 4, 2, 8); }
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
  {/if}

  <div>
    <div class="panel-head" style="border-radius: 6px 6px 0 0;">Frames</div>
    <canvas bind:this={stripCanvas} class="preview-canvas" width="640" height="120" style="aspect-ratio: 640/120;"></canvas>
  </div>

  <div>
    <div class="panel-head" style="border-radius: 6px 6px 0 0; display:flex; gap: 8px; align-items: center;">
      <span>Movement</span>
      <span style="flex:1"></span>
      <button class="btn" class:primary={movementMode==='idle'} onclick={() => movementMode='idle'}>Idle</button>
      <button class="btn" class:primary={movementMode==='vertical'} onclick={() => movementMode='vertical'}>Vertical</button>
      <button class="btn" class:primary={movementMode==='horizontal'} onclick={() => movementMode='horizontal'}>Horizontal</button>
      {#if kind === 'boss'}
        <button class="btn" class:primary={movementMode==='tween'} onclick={() => movementMode='tween'}>Tween</button>
      {/if}
    </div>
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
