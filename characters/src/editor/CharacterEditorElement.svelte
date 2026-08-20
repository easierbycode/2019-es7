<svelte:options customElement={{ tag: "character-editor", shadow: "open" }} />

<script>
  // <character-editor> — create and modify characters in the shared library
  // (/characters + /atlases in the evil-invaders RTDB). Self-contained custom
  // element: embeddable from any page, framework-free.
  //
  // Attributes: character="red_dress_killer" (preselect), db="https://..." (override).
  // Events: "change" { name, action: "saved" | "deleted" }, "close".

  const DEFAULT_DB = "https://evil-invaders-default-rtdb.firebaseio.com";

  let { character = "", db = "" } = $props();

  const base = () => (db || globalThis.__CHARACTERS_DB__ || DEFAULT_DB).replace(/\/+$/, "");

  const TEMPLATES = {
    enemy: {
      name: "", hp: 5, score: 100, spgage: 4, speed: 0.8, interval: 300,
      shadowReverse: true, shadowOffsetY: 10, texture: [], textureKey: "",
    },
    boss: {
      name: "", hp: 150, score: 2200, spgage: 30, interval: 100,
      shadowReverse: true, shadowOffsetY: 50,
      anim: { idle: [], attack: [] }, bulletData: {}, textureKey: "",
    },
    player: {
      name: "", maxHp: 3, spDamage: 50, speed: 150,
      defaultShootName: "normal", defaultShootSpeed: "speed_normal",
      texture: [], textureKey: "",
      shootNormal: { name: "normal", damage: 1, hp: 1, interval: 23, texture: [] },
    },
  };

  let names = $state([]);
  let atlasKeys = $state([]);
  let filter = $state("");
  let selected = $state("");
  let keyInput = $state("");
  let jsonText = $state("");
  let status = $state("");
  let statusIsError = $state(false);
  let previewSet = $state("idle");
  let atlasFilter = $state("");

  // Atlas art cache: key -> { img, frames } (or a promise while loading)
  const atlasCache = new Map();
  let currentAtlas = $state(null);

  const shown = $derived(names.filter((n) => n.toLowerCase().includes(filter.toLowerCase())));

  function record() {
    try { return JSON.parse(jsonText || "{}"); } catch { return null; }
  }

  const sets = $derived.by(() => {
    const r = record();
    const out = {};
    if (r?.anim && typeof r.anim === "object") {
      for (const [k, v] of Object.entries(r.anim)) {
        if (!k.startsWith("_") && Array.isArray(v)) out[k] = v;
      }
    }
    if (!out.idle && Array.isArray(r?.texture)) out.idle = r.texture;
    return out;
  });
  const setNames = $derived(Object.keys(sets));

  function note(msg, isError = false) {
    status = msg;
    statusIsError = isError;
    if (!isError) setTimeout(() => { if (status === msg) status = ""; }, 3000);
  }

  async function getJson(path, params) {
    const qs = params ? "?" + new URLSearchParams(params) : "";
    const res = await fetch(`${base()}/${path}.json${qs}`);
    if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async function refreshLists() {
    try {
      const [chars, atlases] = await Promise.all([
        getJson("characters", { shallow: "true" }),
        getJson("atlases", { shallow: "true" }),
      ]);
      names = chars ? Object.keys(chars).sort() : [];
      atlasKeys = atlases ? Object.keys(atlases).sort() : [];
    } catch (e) {
      note(String(e.message || e), true);
    }
  }

  async function select(name) {
    try {
      const data = await getJson(`characters/${encodeURIComponent(name)}`);
      if (!data) return note(`'${name}' no longer exists`, true);
      selected = name;
      keyInput = name;
      jsonText = JSON.stringify(data, null, 2);
      previewSet = "idle";
      loadAtlasFor(data);
    } catch (e) {
      note(String(e.message || e), true);
    }
  }

  function startNew(kind) {
    selected = "";
    keyInput = "";
    previewSet = "idle";
    currentAtlas = null;
    jsonText = JSON.stringify(TEMPLATES[kind], null, 2);
    note(`New ${kind} — pick a key, a textureKey, then add frames`);
  }

  async function save() {
    const key = keyInput.trim();
    if (!key) return note("A character key is required", true);
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
      return note("Key must be a valid identifier (letters, digits, _)", true);
    }
    const data = record();
    if (!data) return note("The JSON does not parse", true);
    if (!data.name) data.name = key;
    try {
      const res = await fetch(`${base()}/characters/${encodeURIComponent(key)}.json`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      selected = key;
      jsonText = JSON.stringify(data, null, 2);
      await refreshLists();
      note(`Saved '${key}'`);
      $host().dispatchEvent(new CustomEvent("change", { detail: { name: key, action: "saved" } }));
    } catch (e) {
      note(`Save failed: ${e.message || e}`, true);
    }
  }

  async function remove() {
    if (!selected) return;
    if (!confirm(`Delete character '${selected}' from the library? The atlas is kept.`)) return;
    try {
      const res = await fetch(`${base()}/characters/${encodeURIComponent(selected)}.json`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      note(`Deleted '${selected}'`);
      $host().dispatchEvent(new CustomEvent("change", { detail: { name: selected, action: "deleted" } }));
      selected = "";
      keyInput = "";
      jsonText = "";
      currentAtlas = null;
      await refreshLists();
    } catch (e) {
      note(`Delete failed: ${e.message || e}`, true);
    }
  }

  function duplicate() {
    if (!jsonText) return;
    selected = "";
    keyInput = keyInput ? keyInput + "_copy" : "";
    note("Duplicated — change the key and save");
  }

  // ---- atlas + preview -------------------------------------------------------

  function atlasKeyOf(data) {
    return (data && (data.textureKey || data.name)) || keyInput.trim();
  }

  async function loadAtlas(key) {
    if (!key) return null;
    if (!atlasCache.has(key)) {
      atlasCache.set(key, (async () => {
        const rec = await getJson(`atlases/${encodeURIComponent(key)}`);
        if (!rec || !rec.png || !rec.json) return null;
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("atlas png failed"));
          img.src = rec.png.startsWith("data:") ? rec.png : `data:image/png;base64,${rec.png}`;
        });
        const json = typeof rec.json === "string" ? JSON.parse(rec.json) : rec.json;
        return { img, frames: json.frames || {} };
      })().catch(() => null));
    }
    return atlasCache.get(key);
  }

  async function loadAtlasFor(data) {
    currentAtlas = await loadAtlas(atlasKeyOf(data));
  }

  function setTextureKey(key) {
    const data = record();
    if (!data) return note("Fix the JSON first", true);
    data.textureKey = key;
    jsonText = JSON.stringify(data, null, 2);
    loadAtlasFor(data);
  }

  function addFrame(frameName) {
    const data = record();
    if (!data) return note("Fix the JSON first", true);
    if (data.anim && typeof data.anim === "object" && !Array.isArray(data.texture)) {
      const set = previewSet in data.anim ? previewSet : "idle";
      if (!Array.isArray(data.anim[set])) data.anim[set] = [];
      data.anim[set].push(frameName);
    } else {
      if (!Array.isArray(data.texture)) data.texture = [];
      data.texture.push(frameName);
    }
    jsonText = JSON.stringify(data, null, 2);
  }

  // Animated preview
  let previewCanvas = $state(null);
  $effect(() => {
    const canvas = previewCanvas;
    const atlas = currentAtlas;
    const frames = sets[previewSet] || sets[setNames[0]] || [];
    if (!canvas || !atlas || !frames.length) {
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const r = record();
    const fps = (r && r.frameRate) || 8;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let raf, last = 0, idx = 0;
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 1000 / fps) return;
      last = t;
      const name = frames[idx % frames.length];
      idx++;
      const f = atlas.frames[name] || atlas.frames[name?.replace(/\.gif$/, ".png")] ||
        atlas.frames[name?.replace(/\.png$/, ".gif")];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!f || !f.frame) return;
      const { x, y, w, h } = f.frame;
      const s = Math.min(canvas.width / w, canvas.height / h, 3);
      ctx.drawImage(atlas.img, x, y, w, h,
        (canvas.width - w * s) / 2, (canvas.height - h * s) / 2, w * s, h * s);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  });

  const shownAtlasKeys = $derived(
    atlasKeys.filter((k) => k.toLowerCase().includes(atlasFilter.toLowerCase())).slice(0, 40),
  );
  const currentFrameNames = $derived(currentAtlas ? Object.keys(currentAtlas.frames) : []);

  refreshLists().then(() => {
    if (character) select(character);
  });
</script>

<div class="editor">
  <aside>
    <div class="row">
      <input placeholder="filter characters…" bind:value={filter} />
    </div>
    <div class="list">
      {#each shown as n (n)}
        <button class:active={n === selected} onclick={() => select(n)}>{n}</button>
      {/each}
      {#if !shown.length}<div class="dim">no matches</div>{/if}
    </div>
    <div class="row new">
      <span class="dim">new:</span>
      <button onclick={() => startNew("enemy")}>enemy</button>
      <button onclick={() => startNew("boss")}>boss</button>
      <button onclick={() => startNew("player")}>player</button>
    </div>
  </aside>

  <main>
    <div class="row">
      <input class="key" placeholder="character key (e.g. red_dress_killer)" bind:value={keyInput} />
      <button class="primary" onclick={save}>Save</button>
      <button onclick={duplicate} disabled={!jsonText}>Duplicate</button>
      <button class="danger" onclick={remove} disabled={!selected}>Delete</button>
      <button class="dim" onclick={() => $host().dispatchEvent(new CustomEvent("close"))}>✕</button>
    </div>

    <div class="cols">
      <textarea spellcheck="false" bind:value={jsonText} placeholder="character JSON"></textarea>

      <div class="side">
        <canvas bind:this={previewCanvas} width="160" height="160"></canvas>
        <div class="chips">
          {#each setNames as s (s)}
            <button class:active={s === previewSet} onclick={() => (previewSet = s)}>{s}</button>
          {/each}
        </div>

        <div class="row">
          <input placeholder="atlas (textureKey)…" bind:value={atlasFilter} />
        </div>
        <div class="atlas-list">
          {#each shownAtlasKeys as k (k)}
            <button onclick={() => setTextureKey(k)}>{k}</button>
          {/each}
        </div>

        {#if currentFrameNames.length}
          <div class="dim">frames in atlas (click to add to “{previewSet}”):</div>
          <div class="atlas-list frames">
            {#each currentFrameNames as f (f)}
              <button onclick={() => addFrame(f)}>{f}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="status" class:error={statusIsError}>{status}</div>
  </main>
</div>

<style>
  :host {
    display: block;
    color: #ddd;
    font: 12px/1.4 ui-monospace, Menlo, monospace;
  }
  .editor {
    display: flex;
    gap: 10px;
    background: #101014;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 10px;
    height: 100%;
    box-sizing: border-box;
  }
  aside {
    width: 190px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }
  main { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .list { overflow: auto; flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .cols { display: flex; gap: 10px; flex: 1; min-height: 0; }
  textarea {
    flex: 1;
    min-height: 260px;
    background: #0a0a0e;
    color: #cfe8cf;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 8px;
    resize: none;
  }
  .side { width: 250px; display: flex; flex-direction: column; gap: 6px; overflow: auto; }
  canvas {
    background:
      repeating-conic-gradient(#1a1a22 0% 25%, #14141a 0% 50%) 0 0 / 16px 16px;
    border: 1px solid #333;
    border-radius: 6px;
    align-self: center;
  }
  .row { display: flex; gap: 6px; align-items: center; }
  .row.new { flex-wrap: wrap; }
  input {
    background: #0a0a0e;
    border: 1px solid #333;
    color: #ddd;
    border-radius: 5px;
    padding: 5px 7px;
    min-width: 0;
    flex: 1;
  }
  input.key { flex: 1; }
  button {
    background: #1c1c24;
    border: 1px solid #3a3a46;
    color: #ddd;
    border-radius: 5px;
    padding: 4px 8px;
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button:hover { border-color: #84cc16; }
  button.active { border-color: #84cc16; color: #d3f36b; }
  button.primary { background: #84cc16; color: #000; font-weight: 700; }
  button.danger { border-color: #7f1d1d; color: #f87171; }
  button:disabled { opacity: 0.4; cursor: default; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
  .atlas-list { max-height: 110px; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
  .atlas-list.frames { max-height: 150px; }
  .atlas-list button, .list button { flex-shrink: 0; }
  .dim { color: #777; }
  .status { min-height: 16px; color: #84cc16; }
  .status.error { color: #f87171; }
</style>
