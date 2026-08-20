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

- **cmg scene scripts** — `scene-script.js` rewrites the bare URL to
  `characters/browser.js` when compiling.
- **Deno / import-map pages** — map the bare URL to `.../characters/index.js`.

Everywhere else, import `.../characters/browser.js` directly (GitHub Pages
cannot serve an extensionless path as JavaScript).

## Exports

- One component per library character (`red_dress_killer`, `weirdo`,
  `dukeNukem`, ... plus PascalCase aliases) and `CHARACTERS` (the list).
- `character(name, defaults?)` — component for any character, including ones
  created after this build.
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
