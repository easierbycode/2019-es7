# Evil Invaders — Character CMS

A Deno Fresh 2.3 + Svelte 5 app for editing the game's player and enemy
data live, with instant preview of textures, movement, and projectiles.

## Stack

- **Fresh 2.3** (`jsr:@fresh/core`) — file-based routing, islands, SSR.
- **`@fresh/plugin-vite`** — official Vite-based build pipeline for Fresh 2.x.
- **Svelte 5** via `@sveltejs/vite-plugin-svelte` (with `vitePreprocess` so
  `<script lang="ts">` blocks accept full TypeScript).
- **CodeMirror 6** — JSON editor with the One Dark theme.
- **Firebase RTDB (`evil-invaders-default-rtdb`)** — same database that
  spriteX writes atlases to. Player/enemy/boss data lives at
  `/games/<gameKey>/{playerData,enemyData,bossData}`.
- **Web import of spriteX** — the atlas builder lazily imports
  `https://easierbycode.com/spriteX/lib/index.js`, so this app never
  bundles a copy of spriteX. Update spriteX, push to GitHub Pages,
  refresh this app.

## Local development

```bash
cd character-cms
deno task dev          # vite dev server with HMR
```

Open http://localhost:5173 (or whatever Vite picks).

## Seed the database

If `/games/evil-invaders/playerData` etc. are empty, populate them from the
existing `assets/game.json`:

```bash
deno task seed
# or with custom paths:
deno run -A scripts/seed-from-game-json.ts --game evil-invaders --src ../assets/game.json
```

## Build & deploy

```bash
deno task build        # vite build → _fresh/server.js + _fresh/client/
deno task serve        # boot the SSR entrypoint locally to spot-check
```

To deploy to Deno Deploy:

1. Run `deno task build` and commit (or, more typically, run it as the
   build step in Deno Deploy's project settings).
2. Push to GitHub.
3. Create a Deno Deploy project pointing to:
   - **entrypoint**: `character-cms/_fresh/server.js`
   - **build command**: `cd character-cms && deno task build`

The Firebase config is bundled (it's the same public anon-read/write
config spriteX uses) so no extra environment variables are required.

## Routes

| Path | Description |
| --- | --- |
| `/` | Overview tiles for each section. |
| `/players` | Live editor for `games/<game>/playerData`. |
| `/enemies` | List of all enemies in `games/<game>/enemyData`. |
| `/enemies/[id]` | Live editor + preview for one enemy. |
| `/bosses` | List of bosses (`bossData`). |
| `/bosses/[id]` | Live editor + preview (with tween-based attacks). |
| `/atlas` | Trimmed atlas builder — imports spriteX from web URL. |

## How Svelte islands fit into a Preact-based Fresh app

Fresh 2.x's island runtime is Preact. To run Svelte islands, every Svelte
component is mounted via a small Preact wrapper, `islands/SvelteIsland.tsx`.
The wrapper:

1. Server-renders an empty `<div class="svelte-island">` placeholder.
2. On hydration, dynamically imports the named `.svelte` module
   (`import("./CharacterEditor.svelte")`).
3. Calls Svelte 5's `mount(component, { target, props })` to attach.

Routes use `<SvelteIsland name="CharacterEditor" props={...} />` instead of
importing `.svelte` files directly.

## Architecture

```
character-cms/
├── deno.json                # tasks + import map (Fresh, Svelte, Firebase, CodeMirror)
├── vite.config.ts           # fresh() + svelte() with vitePreprocess
├── main.ts                  # serverEntry — defines App + fsRoutes()
├── client.ts                # client entry (auto-hydration)
├── routes/
│   ├── _app.tsx             # HTML shell + nav (Preact, server-rendered)
│   ├── index.tsx            # overview
│   ├── players/index.tsx
│   ├── enemies/{index,[id]}.tsx
│   ├── bosses/{index,[id]}.tsx
│   └── atlas/index.tsx
├── islands/
│   ├── SvelteIsland.tsx          # Preact wrapper — mounts a named .svelte module
│   ├── EnemyList.svelte          # live list of enemy/boss entries
│   ├── CharacterEditor.svelte    # split-pane: CodeMirror + preview
│   ├── CharacterPreview.svelte   # canvas previews of frames/movement/projectiles
│   └── AtlasBuilder.svelte       # trimmed spriteX, web-imports the lib
├── lib/
│   ├── firebase.ts          # browser RTDB client (gstatic ESM)
│   ├── spritex.ts           # lazy loader for the spriteX web library
│   └── spritex.types.ts     # type-only mirror of the lib's surface
├── scripts/
│   └── seed-from-game-json.ts
└── static/styles.css
```

## Live JSON → preview

`CharacterEditor.svelte` parses the editor buffer on every keystroke. The
preview re-renders synchronously from the parsed value, so frame
animations, movement curves, and projectile patterns update as you type.
Saves to RTDB are debounced 600 ms and only fire when the JSON parses.

Movement preview supports vertical scrolling (default enemy behavior),
horizontal bouncing, idle hover, and tween-based motion (figure-8 by
default, configurable via `movement.tween` in the JSON for bosses).

## spriteX integration

`islands/AtlasBuilder.svelte` lazily imports
`https://easierbycode.com/spriteX/lib/index.js`. To rebuild and republish
spriteX:

```bash
cd ../../spriteX
npm run build              # builds dist/lib/index.js (and dist/assets/main.js)
# push dist/ to gh-pages branch — exact command depends on your CI
```

To override the source during local development, set
`globalThis.__SPRITEX_BASE__ = "/your/path"` before the island mounts
(for example, in a `<script>` tag in `routes/atlas/index.tsx`).
