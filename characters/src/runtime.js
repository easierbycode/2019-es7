// Character data + art pipeline, shared by every character component.
//
// Characters live in the evil-invaders Realtime Database:
//   /characters/<name>            gameplay record ({ hp, texture, anim, textureKey, ... })
//   /atlases/<textureKey>         art ({ json: TexturePacker hash string, png: data URL })
//
// Everything here is plain fetch() against the RTDB REST endpoints — no
// Firebase SDK, so the module stays a single self-contained file.

export const DEFAULT_DB = "https://evil-invaders-default-rtdb.firebaseio.com";

export function dbUrl() {
  const base = (globalThis.__CHARACTERS_DB__ || DEFAULT_DB);
  return String(base).replace(/\/+$/, "");
}

async function getJson(path, params) {
  const qs = params ? "?" + new URLSearchParams(params) : "";
  const res = await fetch(`${dbUrl()}/${path}.json${qs}`);
  if (!res.ok) throw new Error(`characters db: GET ${path} -> HTTP ${res.status}`);
  return res.json();
}

/** The full record for one character, or null when it does not exist. */
export function fetchCharacter(name) {
  return getJson(`characters/${encodeURIComponent(name)}`);
}

/** Names of every character in the library. */
export async function listCharacters() {
  const keys = await getJson("characters", { shallow: "true" });
  return keys ? Object.keys(keys).sort() : [];
}

/** One atlas record ({ json, png }), or null. */
export function fetchAtlas(key) {
  return getJson(`atlases/${encodeURIComponent(key)}`);
}

/** Create or overwrite a character record. */
export async function saveCharacter(name, data) {
  const res = await fetch(`${dbUrl()}/characters/${encodeURIComponent(name)}.json`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`characters db: PUT characters/${name} -> HTTP ${res.status}`);
  return res.json();
}

/** Remove a character record (the atlas is left alone — atlases are shared). */
export async function deleteCharacter(name) {
  const res = await fetch(`${dbUrl()}/characters/${encodeURIComponent(name)}.json`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`characters db: DELETE characters/${name} -> HTTP ${res.status}`);
}

// ---- Phaser-side asset loading ---------------------------------------------

/** Resolves once the scene's systems exist (children of <Scene> can mount
 * before Phaser has processed the scene when a preload is still queued). */
export function whenSceneReady(scene) {
  if (scene.sys && scene.sys.displayList) return Promise.resolve(scene);
  return new Promise((resolve) => {
    scene.events.once("start", () => resolve(scene));
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("atlas image failed to decode"));
    img.src = src.startsWith("data:") ? src : `data:image/png;base64,${src}`;
  });
}

/** Frame-name lookup with the same .gif/.png swap tolerance as the game. */
export function resolveFrame(names, want) {
  if (names.has(want)) return want;
  const swap = want.endsWith(".gif")
    ? want.slice(0, -4) + ".png"
    : want.endsWith(".png")
    ? want.slice(0, -4) + ".gif"
    : null;
  if (swap && names.has(swap)) return swap;
  const bare = want.replace(/\.(gif|png)$/i, "");
  if (names.has(bare)) return bare;
  for (const ext of [".png", ".gif"]) if (names.has(bare + ext)) return bare + ext;
  return null;
}

/** Every animation set a record defines: bosses carry an `anim` map, enemies
 * and players a flat `texture` array (exposed as `idle`). Keys starting with
 * `_` are metadata and skipped, matching the game and both editors. */
export function animSets(record) {
  const sets = {};
  const grab = (v) =>
    Array.isArray(v) && v.length && v.every((f) => typeof f === "string") ? v : null;
  if (record && record.anim && typeof record.anim === "object") {
    for (const [k, v] of Object.entries(record.anim)) {
      if (k.startsWith("_")) continue;
      const frames = grab(v);
      if (frames) sets[k] = frames;
    }
  }
  if (!sets.idle) {
    const tex = grab(record && record.texture);
    if (tex) sets.idle = tex;
  }
  return sets;
}

function textureCaches(game) {
  if (!game.__characterCaches) {
    game.__characterCaches = { atlas: new Map(), character: new Map() };
  }
  return game.__characterCaches;
}

async function ensureAtlasTexture(scene, atlasKey) {
  const textureKey = `char:${atlasKey}`;
  if (scene.textures.exists(textureKey)) return textureKey;
  const caches = textureCaches(scene.game);
  if (!caches.atlas.has(atlasKey)) {
    caches.atlas.set(
      atlasKey,
      (async () => {
        const record = await fetchAtlas(atlasKey);
        if (!record || !record.json || !record.png) {
          throw new Error(`atlas '${atlasKey}' not found in /atlases`);
        }
        const img = await loadImage(record.png);
        const json = typeof record.json === "string" ? JSON.parse(record.json) : record.json;
        if (!scene.textures.exists(textureKey)) {
          scene.textures.addAtlas(textureKey, img, json);
        }
        return textureKey;
      })().catch((e) => {
        caches.atlas.delete(atlasKey); // let a later mount retry
        throw e;
      }),
    );
  }
  return caches.atlas.get(atlasKey);
}

/**
 * Fetches a character record, installs its atlas as a texture, and registers
 * one Phaser animation per anim set. Idempotent and deduped per game.
 *
 * Returns { data, textureKey, animKeys: { idle: 'char:<name>:idle', ... }, firstFrame }.
 */
export function ensureCharacterAssets(scene, name) {
  const caches = textureCaches(scene.game);
  if (!caches.character.has(name)) {
    caches.character.set(
      name,
      (async () => {
        const data = await fetchCharacter(name);
        if (!data) throw new Error(`character '${name}' not found in /characters`);
        const atlasKey = data.textureKey || name;
        const textureKey = await ensureAtlasTexture(scene, atlasKey);
        const available = new Set(scene.textures.get(textureKey).getFrameNames());

        const sets = animSets(data);
        const animKeys = {};
        let firstFrame = null;
        for (const [setName, wanted] of Object.entries(sets)) {
          const frames = wanted
            .map((f) => resolveFrame(available, f))
            .filter(Boolean);
          if (!frames.length) continue;
          if (!firstFrame || setName === "idle") firstFrame = frames[0];
          const key = `char:${name}:${setName}`;
          if (!scene.anims.exists(key)) {
            scene.anims.create({
              key,
              frames: frames.map((frame) => ({ key: textureKey, frame })),
              frameRate: data.frameRate || 8,
              repeat: -1,
            });
          }
          animKeys[setName] = key;
        }
        if (!firstFrame) {
          firstFrame = available.values().next().value;
          if (!firstFrame) throw new Error(`character '${name}': atlas '${atlasKey}' has no frames`);
        }
        return { data, textureKey, animKeys, firstFrame };
      })().catch((e) => {
        caches.character.delete(name);
        throw e;
      }),
    );
  }
  return caches.character.get(name);
}
