// Frame-name resolution for a character entry, shared by the grid, the lists
// and the preview.
//
// Players and enemies carry a flat `texture: string[]`. Bosses instead carry an
// `anim` map — `{ idle, attack, shoot, charge, wait, warp, syngoku, … }` — and
// the runtime picks the idle set to stand them up:
//
//   game-objects/Boss.js:88
//   var bossFrames = (bossData.anim && bossData.anim.idle) || bossData.texture || [];
//
// Reading only `texture` is why bosses previewed as blanks.

// deno-lint-ignore-file no-explicit-any

function stringArray(v: unknown): string[] | null {
  if (!Array.isArray(v) || !v.length) return null;
  const out = v.filter((n): n is string => typeof n === "string");
  return out.length ? out : null;
}

/** The frames a character is drawn with at rest, following Boss.js's rule. */
export function spriteFrames(data: any): string[] {
  if (!data || typeof data !== "object") return [];
  const anim = data.anim;
  if (anim && typeof anim === "object") {
    const idle = stringArray(anim.idle);
    if (idle) return idle;
  }
  const texture = stringArray(data.texture);
  if (texture) return texture;
  // No idle set named as such — fall back to whichever animation exists so the
  // entry still shows something rather than an empty cell.
  if (anim && typeof anim === "object") {
    for (const v of Object.values(anim)) {
      const frames = stringArray(v);
      if (frames) return frames;
    }
  }
  return [];
}

/**
 * The frames of the projectile this character fires. Enemies use `bulletData`,
 * bosses split theirs across `bulletDataA`/`B`/`C`, and the player's default
 * shot is `shootNormal`.
 */
export function projectileFrames(data: any): string[] {
  if (!data || typeof data !== "object") return [];
  const keys = [
    "bulletData",
    "bulletDataA",
    "bulletDataB",
    "bulletDataC",
    "projectileData",
    "shootNormal",
  ];
  for (const k of keys) {
    const frames = stringArray(data[k]?.texture);
    if (frames) return frames;
  }
  return [];
}

/**
 * Every frame name the entry references, wherever it sits — `texture`, each
 * `anim.*` set, and the `texture` of each nested shoot/bullet config. Used to
 * report names the atlas cannot draw.
 */
export function allFrameNames(data: any): string[] {
  if (!data || typeof data !== "object") return [];
  const out: string[] = [];
  const eat = (v: unknown) => {
    const frames = stringArray(v);
    if (frames) out.push(...frames);
  };
  const walk = (obj: any, depth: number) => {
    if (!obj || typeof obj !== "object" || depth > 2) return;
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) eat(v);
      else if (v && typeof v === "object") walk(v, depth + 1);
    }
  };
  walk(data, 0);
  return [...new Set(out)];
}
