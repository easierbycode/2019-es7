// Web-imported reusable spriteX pieces.
//
// spriteX is published to GitHub Pages, and exposes its atlas/sprite-detection
// utilities at <SPRITEX_BASE>/lib/index.js. We import lazily from islands so
// the modules are pulled at runtime in the browser, not at server startup.
//
// To swap to a local copy during development, set the env or override SPRITEX_BASE
// at build time.

export const SPRITEX_BASE =
  (globalThis as { __SPRITEX_BASE__?: string }).__SPRITEX_BASE__ ??
  "https://easierbycode.com/spriteX";

export type SpriteXModule = typeof import("./spritex.types.ts");

let _modPromise: Promise<SpriteXModule> | null = null;

/** Lazily load the spriteX library from GitHub Pages. */
export function loadSpriteX(): Promise<SpriteXModule> {
  if (!_modPromise) {
    const url = `${SPRITEX_BASE}/lib/index.js`;
    _modPromise = import(/* @vite-ignore */ url) as Promise<SpriteXModule>;
  }
  return _modPromise;
}
