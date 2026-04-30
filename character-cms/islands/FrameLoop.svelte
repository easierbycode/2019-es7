<script lang="ts">
  // Tiny canvas that loops through `frames` at ~8 fps. Used by the
  // character grid for animated thumbnails. Each instance gets its own
  // `delayMs` offset so a wall of cards staggers instead of pulsing in
  // lockstep.

  import { onDestroy } from "svelte";
  import { type Atlas, drawFrame, resolveFrame } from "../lib/atlas.ts";

  interface Props {
    atlas: Atlas | null;
    frames: string[];
    delayMs?: number;
    fps?: number;
    /** Square pixel size of the canvas. */
    size?: number;
    scale?: number;
  }

  let {
    atlas,
    frames,
    delayMs = 0,
    fps = 8,
    size = 96,
    scale = 2,
  }: Props = $props();

  let canvas: HTMLCanvasElement | null = $state(null);
  let raf: number | null = null;

  $effect(() => {
    void atlas; void frames; void canvas; void delayMs;
    if (raf) cancelAnimationFrame(raf);
    if (!canvas || !atlas || !frames.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stepMs = 1000 / fps;
    const t0 = performance.now() + delayMs;

    // Auto-fit: scale down if frames are bigger than the cell at requested scale.
    let s = scale;
    const probe = resolveFrame(atlas, frames[0]);
    if (probe) {
      const max = Math.max(probe.w, probe.h) * scale;
      if (max > size - 8) s = (size - 8) / Math.max(probe.w, probe.h);
    }

    const draw = (now: number) => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, size, size);
      const idx = now < t0
        ? 0
        : Math.floor((now - t0) / stepMs) % frames.length;
      drawFrame(ctx, atlas!, frames[idx], size / 2, size / 2, s);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
  });

  onDestroy(() => { if (raf) cancelAnimationFrame(raf); });
</script>

<canvas
  bind:this={canvas}
  width={size}
  height={size}
  style="width: {size}px; height: {size}px; image-rendering: pixelated; background: #000; border-radius: 4px;"
></canvas>
