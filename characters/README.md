# characters — importable game characters

An ES module served at `https://easierbycode.com/2019-es7/characters/` that
exports every character in the shared library (`/characters` in the
evil-invaders RTDB) as a Svelte 5 component for
[5velte-ph4ser](https://github.com/easierbycode/svelte-phaser) scenes — plus a
`<character-editor>` custom element for creating and modifying them.

```svelte
<script>
  import * as chars from "https://easierbycode.com/2019-es7/characters";
  const { Game, Scene } = chars;
</script>

<Game width={480} height={640}>
  <Scene key="main">
    <chars.red_dress_killer x={240} y={300} />
  </Scene>
</Game>
```

> **Lowercase names:** Svelte parses lowercase tags as HTML elements, so a
> lowercase component must be used via dot notation (`<chars.red_dress_killer/>`)
> or its generated PascalCase alias (`import { RedDressKiller }`). Plain
> `import { red_dress_killer }` works fine for `spawn()`/`mount()`-style use.

## Files

| File | What |
| --- | --- |
| `index.js` | The module with **bare** `svelte` / `phaser` imports — for bundlers (Vite + svelte plugin), Deno, or pages with an import map. |
| `browser.js` | Same module with `svelte` pinned to `https://esm.sh/svelte@5.16.0` — the build cmg's scene-script runtime uses, so components share one Svelte runtime with in-browser-compiled scene scripts. `phaser` stays bare (map it, or let the game page's import map supply the running instance). |
| `editor.js` | Self-contained `<character-editor>` custom element (create / modify / delete library characters). No dependencies. |
| `demo.html` / `demo.js` | Working demo of everything above (`npx serve .` then `/characters/demo.html`). |
| `src/`, `build.mjs` | Source. Rebuild with `node characters/build.mjs` (also regenerates the per-character named exports from the live database). |

## Where the bare URL works

`import ... from "https://easierbycode.com/2019-es7/characters"` (no file) is
resolved for you in:

- **cmg scene scripts** — `scene-script.js` rewrites the bare URL when
  compiling: on cmg-served pages to the cmg app's live `/characters` route
  (below), elsewhere to `characters/browser.js`.
- **Deno / import-map pages** — map the bare URL to `.../characters/index.js`.

Everywhere else, import `.../characters/browser.js` directly (GitHub Pages
cannot serve an extensionless path as JavaScript) — or use the live endpoint.

## Named-export freshness (no rebuilds needed)

The named exports in these static files are regenerated automatically, but the
live endpoint never goes stale at all:

- **Live endpoint** — `https://cmg.easierbycode.deno.net/characters` (cmg's
  `routes/characters/index.ts`) generates the export list from the database on
  every request (60s cache) and re-exports the component code from
  `browser.js`. A character created seconds ago imports by name. Extensionless,
  correct MIME type, open CORS — importable from anywhere. cmg game pages
  point scene-script imports here via `__CHARACTERS_MODULE__`.
- **CI regeneration** — every Pages deploy reruns `characters/build.mjs`, so
  the deployed static files carry current exports even when the committed
  `generated.js` is stale.
- **Scheduled refresh** — `.github/workflows/refresh-characters.yml` rebuilds
  every 30 minutes (or on manual dispatch), commits only when the library
  changed, and dispatches the Pages deploy.

`node characters/build.mjs` by hand is now only needed when the component
*code* in `src/` changes. `character("name")` works regardless of all of this.

## Using `character(name)`

Named exports are baked in when the module is built, but `character(name)`
looks the character up **at mount time** — it works for any character in the
library, including ones created seconds ago in the editor, with no rebuild or
redeploy. Assigning it to a Capitalized const also sidesteps Svelte's
lowercase-tag rule, so no dot notation or alias is needed:

```svelte
<script>
  import { Game, Scene, character } from "https://easierbycode.com/2019-es7/characters";

  // Any /characters entry, by name — resolved when the component mounts.
  const RedDress = character("red_dress_killer");

  // Optional defaults become the component's baseline props.
  const Weirdo = character("weirdo", { scale: 2, animation: "idle" });
</script>

<Game width={480} height={640}>
  <Scene key="main">
    <RedDress x={140} y={300} />
    <Weirdo x={340} y={300} flipX />
  </Scene>
</Game>
```

In a cmg scene script the game is already running, so adopt its scene instead
of creating a `<Game>`:

```svelte
<script>
  import { Adopt, character } from "https://easierbycode.com/2019-es7/characters";
  const RedDress = character("red_dress_killer");
  let { ctx } = $props();
</script>

<Adopt scene={ctx.scene}>
  <RedDress x={120} y={220} scale={0.6} onready={({ sprite }) => sprite.setDepth(9999)} />
</Adopt>
```

For fully dynamic names (e.g. picked from `listCharacters()`), skip the
factory and pass the name as a prop: `<Character name={picked} x={240} />`.

The scene-script example above ships with the module —
[`examples/adopt-scene-script.svelte`](examples/adopt-scene-script.svelte) —
and can be tried on any cmg game page with
`?titleScript=https://easierbycode.com/2019-es7/characters/examples/adopt-scene-script.svelte`.

## Exports

- One component per library character (`red_dress_killer`, `weirdo`,
  `dukeNukem`, ... plus PascalCase aliases) and `CHARACTERS` (the list).
- `character(name, defaults?)` — component for any character, including ones
  created after this build (see above).
- `Character` — generic component: `<Character name={picked} x={240} />`.
- `Adopt` — provide a *running* game/scene as context (cmg scene scripts):
  ```svelte
  <Adopt scene={ctx.scene}>
    <chars.red_dress_killer x={240} y={300} />
  </Adopt>
  ```
- Everything 5velte-ph4ser exports: `<Game>`, `<Scene>`, `<Sprite>`, `<Text>`,
  ..., `getScene()`, `useSprite()`, `onGameEvent()`, context keys, etc.
- Data access: `fetchCharacter`, `listCharacters`, `saveCharacter`,
  `deleteCharacter`, `fetchAtlas`, `ensureCharacterAssets`, `animSets`,
  `DEFAULT_DB` (override with `globalThis.__CHARACTERS_DB__`).
- Editor: `openCharacterEditor({ character? })` opens the editor in an
  overlay; `loadCharacterEditor()` just registers `<character-editor>`.

## Component props

`x`, `y`, `animation` (an anim-set name — `idle`, `attack`, ...), `play`,
`scale`/`scaleX`/`scaleY`, `depth`, `alpha`, `angle`, `flipX`, `flipY`,
`tint`, `visible`, `originX`/`originY`, and callbacks
`onready({ sprite, data, animations })` / `onerror(e)`. All reactive.

## Data model

- `/characters/<name>` — the gameplay record (same shape as the game's
  `enemyData` / `bossData` / `playerData` entries) plus `textureKey`, naming
  the atlas record in `/atlases/<textureKey>` (`{ json, png }`).
- Animations: bosses use the `anim` map (one Phaser animation per key),
  everything else gets `idle` from `texture[]`. `frameRate` defaults to 8.
