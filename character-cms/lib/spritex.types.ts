// Type-only mirror of the public surface of spriteX's lib/index.js, which is
// an esbuild bundle of spriteX's src/atlasManager.ts (see its `build:lib`
// script). Only the parts the islands actually use are declared here.
//
// These are declarations for a module fetched at runtime, so nothing checks
// them against the real thing — keep them honest by reading atlasManager.ts.

// deno-lint-ignore-file no-explicit-any

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** One piece of a composite sprite: a source region copied to a destination. */
export interface SpritePart {
  sx: number;
  sy: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
}

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Present when the sprite is assembled from pieces, not a plain crop. */
  parts?: SpritePart[];
}

export interface DetectedSprite extends SpriteRect {
  area?: number;
}

export interface SmartDetectResult {
  sprites: DetectedSprite[];
  bgColor: RGB | null;
  tolerance: number;
  usedKeyOut: boolean;
}

export interface AtlasData {
  json: any;
  /** DataURL, prefix included. */
  png: string;
}

/** Detect sprites in a canvas. Takes the context and its dimensions. */
export declare function smartDetectSprites(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  explicitBg?: RGB | null,
): SmartDetectResult;

/** Pack named images (dataURL or bare base64) into one atlas. */
export declare function buildAtlas(
  namedSprites: Record<string, string>,
): Promise<{ dataURL: string; json: any }>;

export declare function fetchAtlas(
  atlasKey: string,
): Promise<AtlasData | null>;

/** Writes to `atlases/<atlasKey>` in RTDB, replacing what is there. */
export declare function saveAtlas(
  atlasKey: string,
  data: AtlasData,
): Promise<void>;

export declare function encodeAtlasFrameKey(name: string): string;
export declare function decodeAtlasFrameKey(key: string): string;
