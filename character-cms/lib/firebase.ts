// Browser-only Firebase Realtime Database client.
// Loaded ONLY from islands (never from server routes), since it relies
// on the gstatic Firebase ESM bundle.
//
// We re-use the same evil-invaders RTDB that spriteX writes to, so
// /atlases/* are shared between the atlas builder and this CMS.
// CMS-owned game data lives under /games/<gameName>/{playerData,enemyData,bossData}.

// deno-lint-ignore-file no-explicit-any
import { initializeApp } from "firebase/firebase-app.js";
import {
  get as dbGet,
  getDatabase,
  onValue as dbOnValue,
  ref as dbRef,
  set as dbSet,
  update as dbUpdate,
} from "firebase/firebase-database.js";

type FirebaseApp = any;
type Database = any;

export const firebaseConfig = {
  apiKey: "AIzaSyAHY_agipyNEXvY2J4jDgnlk9kLeM6O37Y",
  authDomain: "evil-invaders.firebaseapp.com",
  databaseURL: "https://evil-invaders-default-rtdb.firebaseio.com",
  projectId: "evil-invaders",
  storageBucket: "evil-invaders.firebasestorage.app",
  messagingSenderId: "149257705855",
  appId: "1:149257705855:web:3f048481dfc66cef61224a",
};

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getDB(): Database {
  if (!_db) {
    if (!_app) _app = initializeApp(firebaseConfig);
    _db = getDatabase(_app);
  }
  return _db!;
}

export const ref = dbRef;
export const get = dbGet;
export const set = dbSet;
export const update = dbUpdate;
export const onValue = dbOnValue;

/** Default game key — matches assets/game.json content. */
export const DEFAULT_GAME = "evil-invaders";

export interface PlayerData {
  name?: string;
  maxHp?: number;
  spDamage?: number;
  defaultShootName?: string;
  defaultShootSpeed?: string;
  texture?: string[];
  shootNormal?: ProjectileSpec;
  shootBig?: ProjectileSpec;
  shoot3way?: ProjectileSpec;
  barrier?: { time: number; texture: string[] };
  // deno-lint-ignore no-explicit-any
  [k: string]: any;
}

export interface ProjectileSpec {
  name?: string;
  damage?: number;
  hp?: number;
  interval?: number;
  speed?: number;
  texture?: string[];
}

export interface EnemyData {
  name?: string;
  score?: number;
  spgage?: number;
  hp?: number;
  speed?: number;
  interval?: number;
  texture?: string[];
  shadowReverse?: boolean;
  shadowOffsetY?: number;
  bulletData?: ProjectileSpec;
  movement?: MovementSpec;
  // deno-lint-ignore no-explicit-any
  [k: string]: any;
}

export interface MovementSpec {
  /** "vertical" | "horizontal" | "tween" */
  type?: "vertical" | "horizontal" | "tween";
  vx?: number;
  vy?: number;
  /** Phaser tween config when type === "tween" */
  // deno-lint-ignore no-explicit-any
  tween?: Record<string, any>;
}

export type EnemyMap = Record<string, EnemyData>;
