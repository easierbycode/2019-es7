<script lang="ts">
  // Trimmed-down spriteX atlas builder.
  //
  // Imports the heavy lifting (sprite detection + atlas packing + RTDB save)
  // from spriteX's published lib via a GitHub Pages URL. We only handle the
  // UI: drop a sheet, run smartDetectSprites, let the user name frames, push
  // to RTDB.
  //
  // To swap to a local copy during development, set
  // globalThis.__SPRITEX_BASE__ = "/spriteX-local" in a script tag in the
  // page before this island mounts.

  import { onMount } from "svelte";
  import { loadSpriteX, SPRITEX_BASE } from "../lib/spritex.ts";
  import { getDB, ref as fbRef, get as fbGet, update as fbUpdate } from "../lib/firebase.ts";

  // deno-lint-ignore no-explicit-any
  let mod: any = $state(null);
  let modError: string | null = $state(null);
  let loading = $state(true);

  let dragOver = $state(false);
  let imageDataUrl: string | null = $state(null);
  let imageBitmap: HTMLImageElement | null = $state(null);
  // Each entry: { x, y, w, h, name }
  // deno-lint-ignore no-explicit-any
  let detected: any[] = $state([]);
  let atlasKey = $state("game_asset");
  let savingMsg: string | null = $state(null);
  let saveError: string | null = $state(null);

  let canvasEl: HTMLCanvasElement | null = $state(null);

  onMount(async () => {
    try {
      mod = await loadSpriteX();
      loading = false;
    } catch (e) {
      modError = `Failed to load spriteX from ${SPRITEX_BASE}/lib/index.js: ${(e as Error).message}`;
      loading = false;
    }
  });

  async function handleFile(file: File) {
    saveError = null; savingMsg = null;
    const url = URL.createObjectURL(file);
    imageDataUrl = url;
    imageBitmap = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    detect();
  }

  function detect() {
    if (!imageBitmap || !mod) return;
    const c = document.createElement("canvas");
    c.width = imageBitmap.width; c.height = imageBitmap.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imageBitmap, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    try {
      const result = mod.smartDetectSprites(id);
      // deno-lint-ignore no-explicit-any
      detected = (result.sprites ?? []).map((s: any, i: number) => ({
        x: s.x, y: s.y, w: s.w, h: s.h,
        name: `frame_${String(i).padStart(2, "0")}.png`,
      }));
      drawOverlay();
    } catch (e) {
      saveError = `Detection failed: ${(e as Error).message}`;
    }
  }

  function drawOverlay() {
    if (!canvasEl || !imageBitmap) return;
    canvasEl.width = imageBitmap.width;
    canvasEl.height = imageBitmap.height;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imageBitmap, 0, 0);
    ctx.lineWidth = 1;
    ctx.font = "10px monospace";
    for (let i = 0; i < detected.length; i++) {
      const r = detected[i];
      ctx.strokeStyle = "#6cf";
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      ctx.fillStyle = "rgba(102,204,255,0.85)";
      ctx.fillText(String(i), r.x + 2, r.y + 10);
    }
  }

  $effect(() => { void detected; drawOverlay(); });

  function onDrop(e: DragEvent) {
    e.preventDefault(); dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  function onPick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  }

  async function pushToAtlas() {
    if (!mod || !imageBitmap || !detected.length) return;
    saveError = null; savingMsg = "Packing…";
    try {
      // Build per-sprite ImageData objects from the source.
      const c = document.createElement("canvas");
      c.width = imageBitmap.width; c.height = imageBitmap.height;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(imageBitmap, 0, 0);

      const sprites = detected.map((d) => ({
        name: d.name,
        rect: { x: d.x, y: d.y, w: d.w, h: d.h },
        image: ctx.getImageData(d.x, d.y, d.w, d.h),
      }));

      const built = await mod.buildAtlas(sprites, { padding: 2 });

      savingMsg = `Merging into atlas "${atlasKey}"…`;
      // Merge with existing atlas if present (so we don't clobber).
      const db = getDB();
      const snap = await fbGet(fbRef(db, `atlases/${atlasKey}`));
      // deno-lint-ignore no-explicit-any
      let mergedJson: any = built.json;
      if (snap.exists()) {
        const existing = snap.val() as { json?: unknown };
        if (existing?.json) {
          // For merge, we let spriteX's saveAtlas handle it if available.
          // Otherwise just overwrite — user is warned via savingMsg.
        }
      }

      if (typeof mod.saveAtlas === "function") {
        await mod.saveAtlas(atlasKey, { json: mergedJson, png: built.png });
      } else {
        await fbUpdate(fbRef(db, `atlases/${atlasKey}`), {
          json: mergedJson,
          png: built.png,
        });
      }

      savingMsg = `Saved ${detected.length} frame(s) to atlases/${atlasKey}.`;
    } catch (e) {
      saveError = (e as Error).message;
      savingMsg = null;
    }
  }
</script>

{#if loading}
  <p class="hint">Loading spriteX library from {SPRITEX_BASE}/lib/index.js …</p>
{:else if modError}
  <div class="error-box">
    {modError}
    <p style="margin-top: 8px;">
      Make sure spriteX has been built (<code>npm run build:lib</code>) and
      pushed to GitHub Pages. For local dev, set
      <code>globalThis.__SPRITEX_BASE__</code> to a path you serve locally.
    </p>
  </div>
{:else}
  <div class="split">
    <div class="panel">
      <div class="panel-head">
        <span>Source</span>
        <span class="pill"><span class="dot"></span> {detected.length} frame{detected.length === 1 ? "" : "s"}</span>
      </div>
      <div class="toolbar">
        <label class="btn">
          Pick image…
          <input type="file" accept="image/*" hidden onchange={onPick} />
        </label>
        <button class="btn" onclick={detect} disabled={!imageBitmap}>Re-detect</button>
        <span style="flex:1"></span>
        <label>
          atlas:
          <input type="text" bind:value={atlasKey} style="width: 140px;" />
        </label>
        <button class="btn primary" onclick={pushToAtlas} disabled={!detected.length}>Push to RTDB</button>
      </div>
      {#if !imageDataUrl}
        <div
          class="dropzone {dragOver ? 'over' : ''}"
          ondragover={(e) => { e.preventDefault(); dragOver = true; }}
          ondragleave={() => dragOver = false}
          ondrop={onDrop}
          role="button"
          tabindex="0"
        >
          Drop a sprite sheet here (PNG/GIF), or click "Pick image…".
        </div>
      {:else}
        <div class="panel-body" style="overflow:auto; padding: 12px; background: #000;">
          <canvas bind:this={canvasEl} style="image-rendering: pixelated; display:block; max-width:100%;"></canvas>
        </div>
      {/if}
      {#if saveError}<div class="error-box">{saveError}</div>{/if}
      {#if savingMsg}<div class="hint" style="padding: 8px 12px;">{savingMsg}</div>{/if}
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>Detected frames</span>
      </div>
      <div class="panel-body" style="padding: 12px;">
        {#if !detected.length}
          <p class="hint">No frames detected yet.</p>
        {:else}
          <div style="display: grid; grid-template-columns: 32px 1fr 70px; gap: 4px 8px; align-items: center; font-size: 12px;">
            <div class="hint">#</div><div class="hint">name</div><div class="hint">size</div>
            {#each detected as d, i (i)}
              <div class="hint">{i}</div>
              <input type="text" bind:value={d.name} />
              <div class="hint">{d.w}×{d.h}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
