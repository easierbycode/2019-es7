// Type-only mirror of the public surface of spriteX's lib/index.js.
// Keep in sync with /Users/.../spriteX/src/lib/index.ts.
//
// Only types we actually use from islands need to be declared.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
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
  json: unknown;
  png: string;
}

export interface BuildAtlasResult {
  json: unknown;
  png: string;
}

export declare function smartDetectSprites(
  imageData: ImageData,
  options?: { minWidth?: number; minHeight?: number; maxIterations?: number },
): SmartDetectResult;

export declare function buildAtlas(
  sprites: Array<{ name: string; rect: SpriteRect; image: ImageData }>,
  options?: { padding?: number; powerOfTwo?: boolean },
): Promise<BuildAtlasResult>;

export declare function fetchAtlas(
  atlasKey: string,
): Promise<AtlasData | null>;

export declare function saveAtlas(
  atlasKey: string,
  data: AtlasData,
): Promise<void>;

export declare const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};
