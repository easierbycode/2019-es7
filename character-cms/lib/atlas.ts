// Shared atlas loader. Fetches /atlases/<key>/{json,png} (with fallbacks)
// from RTDB once, decodes the json, builds a frame map, and caches the
// resulting Image so multiple consumers (preview, grid, etc.) share one
// network round-trip per atlas.

import { get as fbGet, getDB, ref as fbRef } from "./firebase.ts";

export interface Frame { x: number; y: number; w: number; h: number }
export interface Atlas {
  image: HTMLImageElement;
  frames: Record<string, Frame>;
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

export function loadAtlas(
  atlasKey: string,
  gameKey?: string,
): Promise<Atlas | null> {
  const cacheKey = `${gameKey ?? ""}:${atlasKey}`;
  const cached = _cache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<Atlas | null> => {
    const db = getDB();
    const candidates = [
      gameKey ? `games/${gameKey}/atlases/${atlasKey}` : null,
      `atlases/${atlasKey}`,
    ].filter((p): p is string => !!p);

    for (const path of candidates) {
      try {
        const snap = await fbGet(fbRef(db, path));
        if (!snap.exists()) continue;
        const v = snap.val() as { json?: unknown; png?: string };
        const json = decodeAtlasJson(v.json);
        if (!json || !json.frames) continue;
        const frames: Record<string, Frame> = {};
        for (
          const [name, entry] of Object.entries(
            json.frames as Record<string, unknown>,
          )
        ) {
          const f = (entry as { frame?: Frame })?.frame;
          if (f) frames[decodeFrameKey(name)] = f;
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
  })();

  _cache.set(cacheKey, promise);
  return promise;
}

/** Draw a frame centered at (dx, dy), pixelated, optionally scaled. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  name: string,
  dx: number,
  dy: number,
  scale = 1,
): boolean {
  const f = resolveFrame(atlas, name);
  if (!f) return false;
  ctx.drawImage(
    atlas.image,
    f.x, f.y, f.w, f.h,
    Math.round(dx - (f.w * scale) / 2),
    Math.round(dy - (f.h * scale) / 2),
    f.w * scale,
    f.h * scale,
  );
  return true;
}
