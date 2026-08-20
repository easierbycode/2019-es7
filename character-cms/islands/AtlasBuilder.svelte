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
  import { getDB, ref as fbRef, get as fbGet } from "../lib/firebase.ts";
  import { type Atlas, loadAtlasAt, resolveFrame } from "../lib/atlas.ts";

  // deno-lint-ignore no-explicit-any
  let mod: any = $state(null);
  let modError: string | null = $state(null);
  let loading = $state(true);

  let dragOver = $state(false);
  let imageDataUrl: string | null = $state(null);
  let imageBitmap: HTMLImageElement | null = $state(null);
  // Each entry: { x, y, w, h, name, sel }. Only selected frames are packed.
  // deno-lint-ignore no-explicit-any
  let detected: any[] = $state([]);
  /** Anchor for shift-click range selection in the frame list. */
  let lastClicked = -1;

  const selected = $derived(detected.filter((d) => d.sel));
  const allSelected = $derived(
    detected.length > 0 && selected.length === detected.length,
  );

  function setAll(sel: boolean) {
    for (const d of detected) d.sel = sel;
  }
  function invertAll() {
    for (const d of detected) d.sel = !d.sel;
  }

  /**
   * Set frame `i` to `want`, extending over the range from the last click when
   * shift is held, and remember `i` as the new anchor.
   */
  function selectRow(i: number, want: boolean, shift: boolean) {
    if (shift && lastClicked >= 0 && lastClicked !== i) {
      const [a, b] = i < lastClicked ? [i, lastClicked] : [lastClicked, i];
      for (let k = a; k <= b; k++) detected[k].sel = want;
    } else {
      detected[i].sel = want;
    }
    lastClicked = i;
  }

  /**
   * The row checkbox is bound with bind:checked, so the browser and Svelte
   * agree on its state without anyone cancelling the click. This handler only
   * adds the shift-range on top; the browser has already applied the toggle to
   * `currentTarget.checked` by the time it runs, so that is the wanted value.
   *
   * Toggling by hand from a click handler instead — preventDefault plus a
   * manual flip — races the browser's canceled-activation restore against
   * Svelte's own write, and once those disagree the box stays stuck.
   */
  function onRowCheckbox(i: number, e: MouseEvent) {
    const want = (e.currentTarget as HTMLInputElement).checked;
    if (e.shiftKey) selectRow(i, want, true);
    else lastClicked = i;
  }

  // Mirror of allSelected that the header checkbox can bind to.
  let headerChecked = $state(false);
  $effect(() => { headerChecked = allSelected; });
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
    try {
      // smartDetectSprites reads the pixels itself — it wants the context and
      // its dimensions, not an ImageData.
      const result = mod.smartDetectSprites(ctx, c.width, c.height);
      // deno-lint-ignore no-explicit-any
      detected = (result.sprites ?? []).map((s: any, i: number) => ({
        x: s.x, y: s.y, w: s.w, h: s.h,
        name: `frame_${String(i).padStart(2, "0")}.png`,
        sel: true,
      }));
      lastClicked = -1;
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
      if (r.sel) {
        ctx.fillStyle = "rgba(102,204,255,0.18)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "#6cf";
      } else {
        // Deselected frames stay visible but read as "not going in".
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "rgba(138,143,156,0.7)";
      }
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      ctx.fillStyle = r.sel ? "rgba(102,204,255,0.85)" : "rgba(138,143,156,0.8)";
      ctx.fillText(String(i), r.x + 2, r.y + 10);
    }
    if (marquee) {
      ctx.strokeStyle = marqueeAdds ? "#6cf" : "#ff6b6b";
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(marquee.x + 0.5, marquee.y + 0.5, marquee.w, marquee.h);
      ctx.setLineDash([]);
    }
  }

  // Redraw whenever a frame's selection or the marquee changes — `detected` is
  // deeply reactive, so each `d.sel` read below subscribes to that frame.
  $effect(() => {
    for (const d of detected) { void d.sel; void d.name; }
    void marquee;
    drawOverlay();
  });

  // ---- Marquee selection on the sheet -----------------------------------
  // Click toggles the frame under the cursor; drag a box to select every frame
  // it touches, or hold Alt while dragging to deselect them.
  let marquee: { x: number; y: number; w: number; h: number } | null = $state(null);
  let marqueeAdds = $state(true);
  let dragStart: { x: number; y: number } | null = null;

  function canvasPos(e: PointerEvent) {
    const r = canvasEl!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasEl!.width / r.width),
      y: (e.clientY - r.top) * (canvasEl!.height / r.height),
    };
  }

  function onCanvasDown(e: PointerEvent) {
    if (!canvasEl || !detected.length) return;
    // Capture keeps the drag alive past the canvas edge; not being able to
    // capture is not a reason to refuse the drag.
    try { canvasEl.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    dragStart = canvasPos(e);
    marqueeAdds = !e.altKey;
    marquee = null;
  }

  function onCanvasMove(e: PointerEvent) {
    if (!dragStart) return;
    const p = canvasPos(e);
    marquee = {
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    };
  }

  function onCanvasUp(e: PointerEvent) {
    if (!dragStart) return;
    const p = canvasPos(e);
    const moved = Math.abs(p.x - dragStart.x) > 3 || Math.abs(p.y - dragStart.y) > 3;
    if (!moved) {
      // Topmost frame wins, so a small frame drawn over a big one is reachable.
      for (let i = detected.length - 1; i >= 0; i--) {
        const d = detected[i];
        if (p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y && p.y <= d.y + d.h) {
          selectRow(i, !d.sel, e.shiftKey);
          break;
        }
      }
    } else if (marquee) {
      const m = marquee;
      for (const d of detected) {
        const hit = d.x < m.x + m.w && d.x + d.w > m.x &&
          d.y < m.y + m.h && d.y + d.h > m.y;
        if (hit) d.sel = marqueeAdds;
      }
    }
    dragStart = null;
    marquee = null;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  function onPick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  }

  // ---- Preview of the atlas currently named in the key field -------------
  // Reads atlases/<key> straight from RTDB — the same node Push writes — so
  // what you see is what is actually stored, not a cached copy or the on-disk
  // atlas that happens to share the key.
  let preview: Atlas | null = $state(null);
  let previewKey = $state("");
  let previewError: string | null = $state(null);
  let previewLoading = $state(false);
  let previewFilter = $state("");

  const previewNames = $derived(
    preview
      ? Object.keys(preview.frames)
        .filter((n) => n.toLowerCase().includes(previewFilter.toLowerCase()))
        .sort()
      : [],
  );
  /** Cap the grid so a 400-frame atlas cannot lock the page up. */
  const PREVIEW_CAP = 240;

  async function loadPreview() {
    const key = atlasKey.trim();
    if (!key) return;
    previewLoading = true;
    previewError = null;
    try {
      const a = await loadAtlasAt(`atlases/${key}`);
      preview = a;
      previewKey = key;
      if (!a) previewError = `No atlas stored at atlases/${key}.`;
    } catch (e) {
      preview = null;
      previewError = String((e as Error).message ?? e);
    } finally {
      previewLoading = false;
    }
  }

  /** Paint one frame of the previewed atlas into its cell, letterboxed. */
  function frameCell(node: HTMLCanvasElement, p: { atlas: Atlas; name: string }) {
    const paint = ({ atlas, name }: { atlas: Atlas; name: string }) => {
      const ctx = node.getContext("2d");
      const f = resolveFrame(atlas, name);
      if (!ctx || !f) return;
      const size = node.width;
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      const scale = Math.min(size / f.w, size / f.h, 4);
      ctx.drawImage(
        atlas.image,
        f.x, f.y, f.w, f.h,
        Math.round((size - f.w * scale) / 2),
        Math.round((size - f.h * scale) / 2),
        f.w * scale, f.h * scale,
      );
    };
    paint(p);
    return { update: paint };
  }

  /** Frame count of an atlas json, in any of the shapes RTDB holds. */
  // deno-lint-ignore no-explicit-any
  function frameCount(raw: any): number {
    let json = raw;
    for (let i = 0; i < 2 && typeof json === "string"; i++) {
      try { json = JSON.parse(json); } catch { return 0; }
    }
    const frames = json?.frames ?? json?.textures?.[0]?.frames;
    if (Array.isArray(frames)) return frames.length;
    if (frames && typeof frames === "object") return Object.keys(frames).length;
    return 0;
  }

  async function pushToAtlas() {
    if (!mod || !imageBitmap || !selected.length) return;
    saveError = null; savingMsg = "Packing…";
    try {
      // buildAtlas packs a { name -> PNG dataURL } map, so cut each selected
      // rect out of the source into its own canvas first.
      const named: Record<string, string> = {};
      for (const d of selected) {
        const cell = document.createElement("canvas");
        cell.width = d.w; cell.height = d.h;
        const cctx = cell.getContext("2d");
        if (!cctx) throw new Error("no 2d context");
        cctx.imageSmoothingEnabled = false;
        cctx.drawImage(imageBitmap, d.x, d.y, d.w, d.h, 0, 0, d.w, d.h);
        named[d.name] = cell.toDataURL("image/png");
      }

      const built = await mod.buildAtlas(named);

      savingMsg = `Saving atlas "${atlasKey}"…`;
      // saveAtlas *replaces* atlases/<key> — it does a set, not an update. That
      // namespace is shared with spriteX and other games, so an existing atlas
      // has to be confirmed before these frames wipe it.
      const db = getDB();
      const snap = await fbGet(fbRef(db, `atlases/${atlasKey}`));
      if (snap.exists()) {
        const existing = snap.val() as { json?: unknown };
        const count = frameCount(existing?.json);
        const ok = confirm(
          [
            `atlases/${atlasKey} already exists` +
            (count ? ` with ${count} frame(s)` : "") + ".",
            `Saving replaces it outright with the ${selected.length} ` +
            "frame(s) selected here. The existing frames will be lost.",
            "Replace it?",
          ].join("\n\n"),
        );
        if (!ok) {
          savingMsg = null;
          return;
        }
      }

      await mod.saveAtlas(atlasKey, { json: built.json, png: built.dataURL });

      savingMsg = `Saved ${selected.length} frame(s) to atlases/${atlasKey}.`;
      await loadPreview();   // show what actually landed
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
        <span class="pill"><span class="dot"></span> {selected.length} / {detected.length} selected</span>
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
        <button class="btn" onclick={loadPreview} disabled={!atlasKey.trim() || previewLoading}>
          {previewLoading ? "Loading…" : "Preview"}
        </button>
        <button class="btn primary" onclick={pushToAtlas} disabled={!selected.length}>
          Push {selected.length} to RTDB
        </button>
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
        <div class="hint" style="padding: 4px 12px 0; font-size: 12px;">
          Click a frame to toggle it · drag a box to select · Alt-drag to deselect
        </div>
        <div class="panel-body" style="overflow:auto; padding: 12px; background: #000;">
          <canvas
            bind:this={canvasEl}
            onpointerdown={onCanvasDown}
            onpointermove={onCanvasMove}
            onpointerup={onCanvasUp}
            onpointercancel={onCanvasUp}
            style="image-rendering: pixelated; display:block; max-width:100%; cursor: crosshair; touch-action: none;"
          ></canvas>
        </div>
      {/if}
      {#if saveError}<div class="error-box">{saveError}</div>{/if}
      {#if savingMsg}<div class="hint" style="padding: 8px 12px;">{savingMsg}</div>{/if}
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>Detected frames</span>
      </div>
      <div class="toolbar">
        <button class="btn" onclick={() => setAll(true)} disabled={!detected.length}>All</button>
        <button class="btn" onclick={() => setAll(false)} disabled={!detected.length}>None</button>
        <button class="btn" onclick={invertAll} disabled={!detected.length}>Invert</button>
        <span style="flex:1"></span>
        <span class="hint" style="font-size: 12px;">shift-click for a range</span>
      </div>
      <div class="panel-body" style="padding: 12px;">
        {#if !detected.length}
          <p class="hint">No frames detected yet.</p>
        {:else}
          <div class="frame-rows">
            <label class="hint">
              <input
                type="checkbox"
                bind:checked={headerChecked}
                indeterminate={selected.length > 0 && !allSelected}
                onchange={() => setAll(headerChecked)}
              />
            </label>
            <div class="hint">#</div><div class="hint">name</div><div class="hint">size</div>
            {#each detected as d, i (i)}
              <input
                type="checkbox"
                bind:checked={d.sel}
                onclick={(e) => onRowCheckbox(i, e)}
              />
              <div class="hint">{i}</div>
              <input type="text" bind:value={d.name} disabled={!d.sel} />
              <div class="hint">{d.w}×{d.h}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="panel" style="margin-top: 12px;">
    <div class="panel-head">
      <span>
        Atlas preview{previewKey ? ` · atlases/${previewKey}` : ""}
      </span>
      <span class="pill">
        <span class="dot"></span>
        {#if preview}
          {Object.keys(preview.frames).length} frame(s) ·
          {preview.image.width}×{preview.image.height}
        {:else}
          not loaded
        {/if}
      </span>
    </div>
    <div class="toolbar">
      <button class="btn" onclick={loadPreview} disabled={!atlasKey.trim() || previewLoading}>
        {previewLoading ? "Loading…" : preview ? "Refresh" : "Load"}
      </button>
      <span style="flex:1"></span>
      {#if preview}
        <label>
          filter:
          <input type="text" bind:value={previewFilter} placeholder="frame name" style="width: 160px;" />
        </label>
      {/if}
    </div>
    {#if previewError}
      <div class="error-box">{previewError}</div>
    {/if}
    <div class="panel-body" style="padding: 12px;">
      {#if !preview}
        <p class="hint">
          Load <code>atlases/{atlasKey || "…"}</code> to see what is stored there.
        </p>
      {:else if !previewNames.length}
        <p class="hint">No frame matches “{previewFilter}”.</p>
      {:else}
        <div class="atlas-grid">
          {#each previewNames.slice(0, PREVIEW_CAP) as name (name)}
            <figure class="atlas-cell" title={name}>
              <canvas width="56" height="56" use:frameCell={{ atlas: preview, name }}></canvas>
              <figcaption>{name}</figcaption>
            </figure>
          {/each}
        </div>
        {#if previewNames.length > PREVIEW_CAP}
          <p class="hint" style="margin-top: 8px;">
            Showing the first {PREVIEW_CAP} of {previewNames.length} — filter to narrow it down.
          </p>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  .frame-rows {
    display: grid;
    grid-template-columns: 24px 32px 1fr 70px;
    gap: 4px 8px;
    align-items: center;
    font-size: 12px;
  }
  .atlas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 8px;
  }
  .atlas-cell {
    margin: 0;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px 4px;
    background: #000;
    border: 1px solid var(--line, #2a2e38);
    border-radius: 6px;
    overflow: hidden;
  }
  .atlas-cell canvas { image-rendering: pixelated; }
  .atlas-cell figcaption {
    font-size: 10px;
    color: var(--muted, #8a8f9c);
    max-width: 100%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
</style>
