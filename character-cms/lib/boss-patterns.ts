// Boss attack patterns, ported from cmg's level editor boss viewer
// (cmg/static/editor/boss-viewer.html). Same step DSL, same numbers, same
// projectile maths — only the rendering is left to the caller, so the CMS can
// draw the sim on a canvas instead of DOM layers.
//
// Step DSL:
//   tw    tween x/y (fractions of the stage) over `dur`, ease in/lin/out
//   jump  teleport
//   fade  alpha over `dur`
//   wait  hold for ms
//   anim  switch the boss animation
//   fire  spawn projectiles
//
// A move's `steps` builder receives c = { px: player x, B: BASE, r(a,b) }.

// deno-lint-ignore-file no-explicit-any

/** Boss resting y, as a fraction of stage height. */
export const BASE = 0.26;
/** ms before a finished pattern move loops. */
export const REPEAT_DELAY = 1000;

export interface StepCtx {
  px: number;
  B: number;
  r(a: number, b: number): number;
}

export interface FireSpec {
  type: "straight" | "aimed" | "radial" | "spread" | "beam";
  count?: number;
  angle?: number;
  proj?: "A" | "B";
}

export interface Step {
  tw?: { x?: number; y?: number };
  jump?: { x?: number; y?: number };
  fade?: number;
  wait?: number;
  anim?: string;
  fire?: FireSpec;
  dur?: number;
  ease?: "in" | "lin";
  // Filled in while the step runs.
  t0?: number;
  from?: { x: number; y: number };
  fromA?: number;
  animSet?: boolean;
}

export interface BossMove {
  /** Short label, e.g. "WARP ×3". */
  l: string;
  /** Sub-label describing the shape of the attack. */
  sub: string;
  /** Animation the move leads with. */
  a: string;
  steps: (c: StepCtx) => Step[];
}

export interface BossPattern {
  label: string;
  desc: string;
  moves: BossMove[];
}

export const BOSS_PATTERNS: Record<string, BossPattern> = {
  boss0: {
    label: "PYRAMID",
    desc: "WARP ×3 → STRAFE VOLLEY ×7 → RADIAL FIELD → DIVE CRUSH ON PLAYER X",
    moves: [
      { l: "WARP ×3", sub: "TELEPORT SWEEP", a: "idle", steps: (c) => [{ fade: 0, dur: 90 }, { jump: { x: 0.12 } }, { fade: 1, dur: 90 }, { wait: 260 }, { fade: 0, dur: 90 }, { jump: { x: 0.88 } }, { fade: 1, dur: 90 }, { wait: 260 }, { fade: 0, dur: 90 }, { jump: { x: c.r(0.2, 0.8) } }, { fade: 1, dur: 90 }] },
      { l: "STRAFE VOLLEY", sub: "STRAIGHT ×7", a: "attack", steps: () => { const s: Step[] = [{ anim: "attack" }]; [0.06, 0.94, 0.14, 0.86, 0.28, 0.72, 0.5].forEach((x) => s.push({ jump: { x } }, { fire: { type: "straight" } }, { wait: 130 })); return s; } },
      { l: "RADIAL FIELD", sub: "RADIAL 14 ×3", a: "attack", steps: (c) => [{ tw: { x: 0.5, y: c.B + 0.05 }, dur: 400, anim: "attack" }, { fire: { type: "radial", count: 14, proj: "B" } }, { wait: 750 }, { fire: { type: "radial", count: 14, proj: "B" } }, { wait: 750 }, { fire: { type: "radial", count: 14, proj: "B" } }] },
      { l: "DIVE CRUSH", sub: "LOCK X · DIVE", a: "attack", steps: (c) => [{ jump: { x: c.px } }, { anim: "attack" }, { tw: { y: c.B - 0.07 }, dur: 220 }, { tw: { y: 0.9 }, dur: 800, ease: "in" }, { fade: 0, dur: 60 }, { jump: { x: 0.5, y: -0.12 } }, { fade: 1, dur: 60 }, { tw: { y: c.B }, dur: 800 }] },
    ],
  },
  boss1: {
    label: "BARLOG",
    desc: "REPOSITION → STRAIGHT SHOT · TRACK PLAYER X + SHOT · POWER DIVE + RETURN",
    moves: [
      { l: "REPOSITION SHOT", sub: "STRAIGHT ×1", a: "shoot", steps: (c) => [{ tw: { x: c.r(0.1, 0.9), y: c.r(0.15, 0.4) }, dur: 600 }, { anim: "shoot" }, { fire: { type: "straight" } }, { wait: 400 }] },
      { l: "TRACK + SHOT", sub: "LOCK X · STRAIGHT", a: "shoot", steps: (c) => [{ tw: { x: c.px }, dur: 300 }, { anim: "shoot" }, { wait: 350 }, { fire: { type: "straight" } }, { wait: 350 }] },
      { l: "POWER DIVE", sub: "SHOT · DIVE", a: "attack", steps: (c) => [{ tw: { x: c.px }, dur: 500 }, { fire: { type: "straight" } }, { anim: "attack" }, { tw: { y: c.B - 0.12 }, dur: 300 }, { tw: { y: 0.88 }, dur: 600, ease: "in" }, { tw: { y: c.B }, dur: 300 }] },
    ],
  },
  boss2: {
    label: "SAGAT",
    desc: "SWEEP 6 STOPS FIRING → RAPID FIRE ×7 → TIGER SHOT (B) → DIVE + RETURN",
    moves: [
      { l: "SWEEP VOLLEY", sub: "STRAIGHT ×6", a: "shoot", steps: () => { const s: Step[] = [{ anim: "shoot" }]; [0.05, 0.22, 0.42, 0.62, 0.82, 0.95].forEach((x) => s.push({ tw: { x }, dur: 250 }, { fire: { type: "straight" } })); return s; } },
      { l: "RAPID FIRE", sub: "STRAIGHT ×7", a: "shoot", steps: (c) => { const s: Step[] = [{ tw: { x: c.r(0.15, 0.85) }, dur: 250, anim: "shoot" }]; for (let i = 0; i < 7; i++) s.push({ fire: { type: "straight" } }, { wait: 200 }); return s; } },
      { l: "TIGER SHOT", sub: "HEAVY SHOT B", a: "charge", steps: (c) => [{ tw: { x: c.r(0.15, 0.85) }, dur: 250, anim: "charge" }, { wait: 500 }, { anim: "shoot" }, { fire: { type: "straight", proj: "B" } }, { wait: 500 }] },
      { l: "DIVE RETURN", sub: "LOCK X · DIVE", a: "attack", steps: (c) => [{ tw: { x: c.px, y: c.B - 0.05 }, dur: 400 }, { fire: { type: "straight" } }, { wait: 300 }, { anim: "attack" }, { tw: { y: 0.88 }, dur: 300, ease: "in" }, { tw: { y: c.B }, dur: 260 }] },
    ],
  },
  boss3: {
    label: "VEGA",
    desc: "TRIPLE WARP · PSYCHO SHOTS ×7 AIMED · RADIAL FIELD 12×5 · IZUNA DIVE + SPREAD",
    moves: [
      { l: "TRIPLE WARP", sub: "TELEPORT ×3", a: "idle", steps: (c) => [{ fade: 0, dur: 80 }, { jump: { x: 0.08 } }, { fade: 1, dur: 80 }, { wait: 220 }, { fade: 0, dur: 80 }, { jump: { x: 0.92 } }, { fade: 1, dur: 80 }, { wait: 220 }, { fade: 0, dur: 80 }, { jump: { x: c.r(0.2, 0.8) } }, { fade: 1, dur: 80 }] },
      { l: "PSYCHO SHOTS", sub: "AIMED ×7", a: "shoot", steps: () => { const s: Step[] = [{ anim: "shoot" }]; [0.08, 0.85, 0.15, 0.5, 0.9, 0.2, 0.5].forEach((x) => s.push({ fade: 0, dur: 80 }, { jump: { x } }, { fade: 1, dur: 80 }, { fire: { type: "aimed" } }, { wait: 240 })); return s; } },
      { l: "RADIAL FIELD", sub: "RADIAL 12 ×3", a: "shoot", steps: (c) => [{ tw: { x: 0.5, y: c.B + 0.03 }, dur: 300, anim: "shoot" }, { fire: { type: "radial", count: 12, proj: "B" } }, { wait: 800 }, { fire: { type: "radial", count: 12, proj: "B" } }, { wait: 800 }, { fire: { type: "radial", count: 12, proj: "B" } }] },
      { l: "IZUNA DIVE", sub: "SPREAD 3 · DIVE", a: "attack", steps: (c) => [{ fade: 0, dur: 80 }, { jump: { x: c.px } }, { fade: 1, dur: 80 }, { anim: "attack" }, { tw: { y: c.B - 0.06 }, dur: 200 }, { fire: { type: "spread", count: 3, angle: 30 } }, { tw: { y: 0.92 }, dur: 800, ease: "in" }, { fade: 0, dur: 60 }, { jump: { x: 0.5, y: -0.12 } }, { fade: 1, dur: 60 }, { tw: { y: c.B }, dur: 800 }] },
    ],
  },
  boss4: {
    label: "FANG",
    desc: "POISON BEAMS 105°/90°/75° · RADIAL BURST ×8 · SMOKE BARRAGE AIMED",
    moves: [
      { l: "POISON BEAMS", sub: "BEAMS 105/90/75°", a: "charge", steps: () => [{ anim: "charge" }, { wait: 500 }, { anim: "shoot" }, { fire: { type: "beam", angle: 105 } }, { wait: 450 }, { fire: { type: "beam", angle: 90 } }, { wait: 450 }, { fire: { type: "beam", angle: 75 } }, { wait: 300 }] },
      { l: "RADIAL BURST", sub: "RADIAL ×8", a: "shoot", steps: () => [{ anim: "shoot" }, { fire: { type: "radial", count: 8 } }, { wait: 600 }] },
      { l: "SMOKE BARRAGE", sub: "AIMED ×8 · JITTER", a: "wait", steps: (c) => { const s: Step[] = [{ anim: "wait" }]; for (let i = 0; i < 8; i++) s.push({ tw: { x: c.r(0.2, 0.8) }, dur: 140 }, { fire: { type: "aimed", proj: "B" } }, { wait: 160 }); return s; } },
    ],
  },
  bossExtra: {
    label: "GOKI",
    desc: "LOCK X ON PLAYER → SHOOT-A VOLLEY ×6 · SHOOT-B HEAVY · ASHURA WARP / DIVE",
    moves: [
      { l: "SHOOT-A VOLLEY", sub: "LOCK X · STRAIGHT ×6", a: "shootA", steps: (c) => { const s: Step[] = [{ tw: { x: c.px }, dur: 400, anim: "shootA" }]; for (let i = 0; i < 6; i++) s.push({ fire: { type: "straight" } }, { wait: 150 }); return s; } },
      { l: "SHOOT-B HEAVY", sub: "LOCK X · HEAVY B", a: "shootB", steps: (c) => [{ tw: { x: c.px }, dur: 400, anim: "shootB" }, { wait: 500 }, { fire: { type: "straight", proj: "B" } }, { wait: 600 }] },
      { l: "ASHURA DIVE", sub: "DIVE · WARP TOP", a: "syngoku", steps: (c) => [{ anim: "syngoku" }, { tw: { y: 0.92 }, dur: 1100, ease: "lin" }, { fade: 0, dur: 60 }, { jump: { x: c.r(0.2, 0.8), y: -0.12 } }, { fade: 1, dur: 60 }, { tw: { y: c.B }, dur: 700 }] },
      { l: "ASHURA WARP", sub: "GLIDE REPOSITION", a: "syngoku", steps: (c) => [{ anim: "syngoku" }, { tw: { x: c.r(0.15, 0.85), y: c.r(0.15, 0.35) }, dur: 700 }] },
    ],
  },
};

/** The pattern a boss actually runs: its own key unless attackPattern overrides. */
export function effectivePatternKey(bossKey: string, data: any): string {
  return (data?.attackPattern || "") || bossKey;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  frames: string[];
  fi: number;
  ft: number;
}

export interface BossSimState {
  x: number;
  y: number;
  alpha: number;
  animKey: string;
  frame: number;
  frameT: number;
  projs: Projectile[];
  player: { x: number; y: number };
  moveId: number | string;
  seq: Step[] | null;
  stepIdx: number;
  loopAt: number;
}

export interface BossSimOptions {
  /** The boss entry being edited. */
  data: any;
  /** Its key in bossData, e.g. "boss3". */
  bossKey: string;
  /** Sibling bosses, for the projectile fallbacks the viewer does. */
  siblings?: Record<string, any>;
  /** Whether the atlas can actually draw a frame name. */
  hasFrame: (name: string) => boolean;
}

export interface BossSim {
  state: BossSimState;
  pattern: BossPattern | null;
  moves: BossMove[];
  /** `"idle"`, `"anim:<key>"`, or a move index. */
  startMove(id: number | string): void;
  /** Advance by `dt` ms at absolute time `t`, over a W×H stage. */
  step(t: number, dt: number, W: number, H: number): void;
}

export function createBossSim(opts: BossSimOptions): BossSim {
  const { data, bossKey, siblings = {}, hasFrame } = opts;
  const patternKey = effectivePatternKey(bossKey, data);
  const pattern = BOSS_PATTERNS[patternKey] ?? null;

  const animKeys = (b: any): string[] =>
    Object.keys((b && b.anim) || {}).filter((a) => !a.startsWith("_"));
  const idleKey = (): string =>
    data?.anim?.idle ? "idle" : (animKeys(data)[0] ?? "idle");
  const mapAnim = (key: string): string => {
    if (!data?.anim) return key;
    if (data.anim[key]) return key;
    return data.anim.attack
      ? "attack"
      : (data.anim.shoot ? "shoot" : (animKeys(data)[0] ?? key));
  };

  // Projectile lookup, with the viewer's fallbacks: this boss, then the boss
  // whose pattern it borrows, then bossExtra. Bosses like boss0 carry no
  // bulletData of their own but still fire in their pattern.
  function projData(sel: "A" | "B") {
    const pick = (b: any) => {
      if (!b) return null;
      const d = sel === "B"
        ? (b.bulletDataB || b.bulletDataA)
        : (b.bulletDataA || b.bulletData);
      return d && d.texture && d.texture.length ? d : null;
    };
    return pick(data) || pick(siblings[patternKey]) || pick(siblings.bossExtra);
  }

  const state: BossSimState = {
    x: 0.5,
    y: BASE,
    alpha: 1,
    animKey: idleKey(),
    frame: 0,
    frameT: 0,
    projs: [],
    player: { x: 0.5, y: 0.86 },
    moveId: "idle",
    seq: null,
    stepIdx: 0,
    loopAt: 0,
  };

  function buildSeq(idx: number): Step[] | null {
    const move = pattern?.moves[idx];
    if (!move) return null;
    const c: StepCtx = {
      px: Math.max(0.05, Math.min(0.95, state.player.x)),
      B: BASE,
      r: (a, b) => a + Math.random() * (b - a),
    };
    const steps = move.steps(c).map((st) => {
      const s2: Step = { ...st };
      if (s2.anim) s2.anim = mapAnim(s2.anim);
      return s2;
    });
    return [{ anim: mapAnim(move.a) } as Step].concat(steps);
  }

  function startMove(id: number | string) {
    state.moveId = id;
    state.loopAt = 0;
    state.stepIdx = 0;
    state.alpha = 1;
    state.projs = [];
    if (id === "idle") {
      state.seq = [{ tw: { x: 0.5, y: BASE }, dur: 500 }, { anim: idleKey() }];
    } else if (typeof id === "string" && id.startsWith("anim:")) {
      state.seq = [{ tw: { x: 0.5, y: BASE }, dur: 400 }, { anim: id.slice(5) }];
    } else {
      state.seq = buildSeq(id as number);
    }
  }

  function fire(f: FireSpec, W: number, H: number) {
    const d = projData(f.proj || "A");
    if (!d) return;
    const frames = (d.texture as string[]).filter(hasFrame);
    if (!frames.length) return;
    const sp = (d.speed || 1.5) * 0.16;
    const bx = state.x * W, by = state.y * H + 24;
    const dirs: Array<[number, number]> = [];
    const add = (p: Projectile) => state.projs.push(p);

    if (f.type === "straight") dirs.push([0, 1]);
    else if (f.type === "aimed") {
      const dx = state.player.x * W - bx, dy = state.player.y * H - by;
      const m = Math.hypot(dx, dy) || 1;
      dirs.push([dx / m, dy / m]);
    } else if (f.type === "radial") {
      const n = f.count || 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dirs.push([Math.cos(a), Math.sin(a)]);
      }
    } else if (f.type === "spread") {
      const n = f.count || 3, span = (f.angle || 30) * Math.PI / 180;
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 +
          (i - (n - 1) / 2) * span / Math.max(1, n - 1) * 2;
        dirs.push([Math.cos(a), Math.sin(a)]);
      }
    } else if (f.type === "beam") {
      const a = (f.angle || 90) * Math.PI / 180;
      const dx = Math.cos(a), dy = Math.sin(a);
      for (let i = 0; i < 6; i++) {
        add({ x: bx + dx * i * 28, y: by + dy * i * 28, vx: dx * sp * 1.4, vy: dy * sp * 1.4, frames, fi: 0, ft: 0 });
      }
    }
    for (const dir of dirs) {
      add({ x: bx, y: by, vx: dir[0] * sp, vy: dir[1] * sp, frames, fi: 0, ft: 0 });
    }
    if (state.projs.length > 90) state.projs.splice(0, state.projs.length - 90);
  }

  function step(t: number, dt: number, W: number, H: number) {
    state.frameT += dt;
    if (state.frameT > 167) {
      state.frameT = 0;
      state.frame++;
    }

    if (state.seq) {
      for (let guard = 0; guard < 12 && state.seq; guard++) {
        if (state.stepIdx >= state.seq.length) {
          state.seq = null;
          if (typeof state.moveId === "number") {
            state.animKey = idleKey();
            state.frame = 0;
            state.loopAt = t + REPEAT_DELAY;
          }
          break;
        }
        const st = state.seq[state.stepIdx];
        if (st.t0 === undefined) {
          st.t0 = t;
          if (st.tw) st.from = { x: state.x, y: state.y };
          if (st.fade !== undefined) st.fromA = state.alpha;
        }
        const el = t - st.t0;
        if (st.tw) {
          if (st.anim && !st.animSet) {
            st.animSet = true;
            state.animKey = st.anim;
            state.frame = 0;
          }
          const d = st.dur || 400, p = Math.min(1, el / d);
          const e = st.ease === "in"
            ? p * p * p
            : (st.ease === "lin" ? p : 1 - Math.pow(1 - p, 3));
          if (st.tw.x !== undefined) state.x = st.from!.x + (st.tw.x - st.from!.x) * e;
          if (st.tw.y !== undefined) state.y = st.from!.y + (st.tw.y - st.from!.y) * e;
          if (p < 1) break;
          state.stepIdx++;
          continue;
        }
        if (st.fade !== undefined) {
          const d = st.dur || 100, p = Math.min(1, el / d);
          state.alpha = st.fromA! + (st.fade - st.fromA!) * p;
          if (p < 1) break;
          state.stepIdx++;
          continue;
        }
        if (st.wait) {
          if (el < st.wait) break;
          state.stepIdx++;
          continue;
        }
        if (st.jump) {
          if (st.jump.x !== undefined) state.x = st.jump.x;
          if (st.jump.y !== undefined) state.y = st.jump.y;
          state.stepIdx++;
          continue;
        }
        if (st.anim) {
          state.animKey = st.anim;
          state.frame = 0;
          state.stepIdx++;
          continue;
        }
        if (st.fire) {
          fire(st.fire, W, H);
          state.stepIdx++;
          continue;
        }
        state.stepIdx++;
      }
    } else if (state.loopAt && t >= state.loopAt && typeof state.moveId === "number") {
      state.loopAt = 0;
      state.stepIdx = 0;
      state.seq = buildSeq(state.moveId);
    }

    state.projs = state.projs.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ft += dt;
      if (p.ft > 250) {
        p.ft = 0;
        p.fi++;
      }
      return p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
    });
  }

  return { state, pattern, moves: pattern?.moves ?? [], startMove, step };
}
