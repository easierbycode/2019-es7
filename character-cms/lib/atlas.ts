// Shared atlas loader. Resolves an atlas key to a decoded frame map plus one
// cached Image, so multiple consumers (preview, grid, etc.) share a single
// round-trip per atlas.
//
// Sources are tried in order:
//   1. games/<gameKey>/atlases/<key>  — per-game override in RTDB
//   2. /game-assets/<key>.{json,png}  — the game's own on-disk atlas, served by
//                                       the game-assets Vite plugin
//   3. atlases/<key>                  — the shared spriteX namespace in RTDB
//
// (3) is last on purpose: it is a global namespace shared with other games, so
// a key like "game_asset" there is not necessarily *this* game's atlas.

import { get as fbGet, getDB, ref as fbRef } from "./firebase.ts";

export interface Frame { x: number; y: number; w: number; h: number }
export interface Atlas {
  image: HTMLImageElement;
  frames: Record<string, Frame>;
  /** Where the atlas came from, for diagnostics. */
  source: string;
}

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

/** Decode `k_HHHH...` Firebase-safe frame keys back to their original. */
export function decodeFrameKey(k: string): string {
  if (!k.startsWith("k_")) return k;
  const hex = k.slice(2);
  let out = "";
  for (let i = 0; i < hex.length; i += 4) {
    out += String.fromCodePoint(parseInt(hex.slice(i, i + 4), 16));
  }
  return out;
}

/**
 * Build a name -> Frame map from any of the atlas shapes we see in the wild:
 *
 *   { frames: { "a.gif": { frame: {...} } } }   TexturePacker hash (assets/*.json)
 *   { frames: [ { filename: "a.png", frame: {...} } ] }        TexturePacker array
 *   { textures: [ { frames: [ { filename, frame } ] } ] }      TexturePacker v3
 *
 * Only the hash form used to be handled, so array-form atlases produced a map
 * keyed "0", "1", "2"… and every frame lookup silently missed.
 */
// deno-lint-ignore no-explicit-any
export function normalizeFrames(json: any): Record<string, Frame> | null {
  const out: Record<string, Frame> = {};

  // deno-lint-ignore no-explicit-any
  const add = (name: unknown, entry: any) => {
    if (typeof name !== "string" || !name) return;
    const f = entry?.frame ?? entry;
    if (!f) return;
    for (const k of ["x", "y", "w", "h"]) {
      if (typeof f[k] !== "number") return;
    }
    out[decodeFrameKey(name)] = { x: f.x, y: f.y, w: f.w, h: f.h };
  };

  // deno-lint-ignore no-explicit-any
  const eat = (frames: any) => {
    if (Array.isArray(frames)) {
      for (const e of frames) add(e?.filename ?? e?.name, e);
    } else if (frames && typeof frames === "object") {
      for (const [k, e] of Object.entries(frames)) add(k, e);
    }
  };

  eat(json?.frames);
  if (Array.isArray(json?.textures)) for (const t of json.textures) eat(t?.frames);

  return Object.keys(out).length ? out : null;
}

const _cache = new Map<string, Promise<Atlas | null>>();

/**
 * Resolve a frame name to its Frame, tolerating .gif/.png swaps and the
 * RTDB-encoded form.
 */
export function resolveFrame(atlas: Atlas, name: string): Frame | null {
  return atlas.frames[name]
    ?? atlas.frames[name.replace(/\.png$/, ".gif")]
    ?? atlas.frames[name.replace(/\.gif$/, ".png")]
    ?? null;
}

/** Names in `wanted` that this atlas cannot draw. */
export function missingFrames(atlas: Atlas, wanted: string[]): string[] {
  return wanted.filter((n) => !resolveFrame(atlas, n));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(`image failed to load: ${src.slice(0, 64)}`));
    i.src = src;
  });
}

/** The game's on-disk atlas, served by the game-assets Vite plugin. */
async function loadLocalAtlas(atlasKey: string): Promise<Atlas | null> {
  const base = `/game-assets/${atlasKey}`;
  const res = await fetch(`${base}.json`);
  if (!res.ok) return null;
  const frames = normalizeFrames(await res.json());
  if (!frames) return null;
  return { image: await loadImage(`${base}.png`), frames, source: base };
}

/**
 * Load exactly one RTDB atlas node, skipping both the source order and the
 * cache. The atlas builder needs this: it reads and writes `atlases/<key>`
 * specifically, and must see its own last save rather than a cached copy or
 * the on-disk atlas that happens to share the key.
 */
export function loadAtlasAt(path: string): Promise<Atlas | null> {
  return loadRtdbAtlas(path);
}

async function loadRtdbAtlas(path: string): Promise<Atlas | null> {
  const snap = await fbGet(fbRef(getDB(), path));
  if (!snap.exists()) return null;
  const v = snap.val() as { json?: unknown; png?: string };
  const frames = normalizeFrames(decodeAtlasJson(v.json));
  if (!frames) return null;
  const png = String(v.png ?? "");
  if (!png) return null;
  const src = png.startsWith("data:") ? png : `data:image/png;base64,${png}`;
  return { image: await loadImage(src), frames, source: path };
}

export function loadAtlas(
  atlasKey: string,
  gameKey?: string,
): Promise<Atlas | null> {
  const cacheKey = `${gameKey ?? ""}:${atlasKey}`;
  const cached = _cache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<Atlas | null> => {
    const sources: Array<() => Promise<Atlas | null>> = [];
    if (gameKey) {
      sources.push(() => loadRtdbAtlas(`games/${gameKey}/atlases/${atlasKey}`));
    }
    sources.push(() => loadLocalAtlas(atlasKey));
    sources.push(() => loadRtdbAtlas(`atlases/${atlasKey}`));

    for (const load of sources) {
      try {
        const atlas = await load();
        if (atlas) return atlas;
      } catch {
        // try next source
      }
    }
    return null;
  })();

  _cache.set(cacheKey, promise);
  return promise;
}

/**
 * Draw a frame centered at (dx, dy), pixelated, optionally scaled and rotated.
 * `rotation` is radians clockwise about the centre, matching Phaser's
 * `setRotation` — bullet art is drawn facing right and rotated into its
 * direction of travel.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  name: string,
  dx: number,
  dy: number,
  scale = 1,
  rotation = 0,
): boolean {
  const f = resolveFrame(atlas, name);
  if (!f) return false;
  const w = f.w * scale;
  const h = f.h * scale;
  if (rotation) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rotation);
    ctx.drawImage(atlas.image, f.x, f.y, f.w, f.h, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
  ctx.drawImage(
    atlas.image,
    f.x, f.y, f.w, f.h,
    Math.round(dx - w / 2),
    Math.round(dy - h / 2),
    w,
    h,
  );
  return true;
}
