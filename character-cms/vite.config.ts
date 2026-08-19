// Fresh 2.x uses Vite for the dev server and the build pipeline. The
// fresh() plugin handles file-based routes, islands, SSR, and the static
// file middleware. We add Svelte alongside it so .svelte islands compile.
//
// Run:
//   deno task dev      — Vite dev server with HMR
//   deno task build    — production build, output to _fresh/ for Deno Deploy
//   deno task serve    — boot the SSR entrypoint locally (post-build)

import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "node:process";

// Workaround for @fresh/plugin-vite's Deno loader (src/plugins/deno.ts).
// Its `load` hook does `path.toFileUrl(id)` and hands the result to Deno's
// loader WITHOUT stripping Vite's query string. In dev, Vite serves some
// Deno-resolved deps *raw* (not pre-bundled) with a cache-busting query, e.g.
//   .../preact/debug/dist/debug.module.js?v=ff43403f
//   .../@prefresh/core/src/index.js?v=3589703d
// Deno then tries to open a file literally named "index.js?v=3589703d" and
// fails with ENOENT, 500-ing the page. The casualties are the dev-only modules
// Preact/Prefresh inject for debugging and HMR (preact/debug, preact/devtools,
// @prefresh/core, @prefresh/utils). (The plugin's `enforce: "pre"` resolveId
// ignores `vite:resolve`, so optimizeDeps can't force these into the pre-bundle
// — the raw path always wins. The query must be stripped at load time instead.)
//
// We run first (enforce: "pre", listed before fresh()) and load these
// query-suffixed files ourselves with the query removed. In the browser
// environment the Deno loader only resolves ESM builds, so returning the file's
// contents verbatim is correct — no Deno/Babel transform is needed. (These
// paths already 500 without us, so we can only improve on the status quo.)
function stripDenoDepQuery(): Plugin {
  return {
    name: "strip-deno-dep-query",
    enforce: "pre",
    load(id) {
      const q = id.indexOf("?");
      if (q === -1) return null;
      const clean = id.slice(0, q);
      if (
        /[\\/]node_modules[\\/]\.deno[\\/].*\.(js|mjs|cjs)$/.test(clean) &&
        existsSync(clean)
      ) {
        return { code: readFileSync(clean, "utf8"), map: null };
      }
      return null;
    },
  };
}

// Expose the game's own texture atlases to the CMS at /game-assets/<key>.{json,png}.
//
// The Phaser runtime loads `assets/game_asset.json` + `assets/img/game_asset.png`
// straight off disk (see src/phaser/BootScene.js), so those files — not RTDB —
// are what the game actually renders. RTDB's shared spriteX namespace happens to
// contain an unrelated atlas ALSO called "game_asset" (monkeyBrain/flirty_girl
// frames from another game), which is what the previews used to bind to: every
// lookup missed and the canvases came up empty.
//
// character-cms is a Vite root of its own, so ../assets is outside it. Serve the
// two files by hand in dev and copy them into the client bundle on build.
const GAME_ASSETS_ROUTE = "/game-assets/";
const GAME_ASSETS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
);

/** /game-assets/foo.json -> ../assets/foo.json; /game-assets/foo.png -> ../assets/img/foo.png */
function gameAssetPath(name: string): string | null {
  if (!/^[\w.-]+\.(json|png)$/.test(name)) return null; // no traversal, no surprises
  const file = name.endsWith(".png")
    ? join(GAME_ASSETS_DIR, "img", name)
    : join(GAME_ASSETS_DIR, name);
  return existsSync(file) ? file : null;
}

function gameAssets(): Plugin {
  return {
    name: "game-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (!url.startsWith(GAME_ASSETS_ROUTE)) return next();
        const file = gameAssetPath(url.slice(GAME_ASSETS_ROUTE.length));
        if (!file) return next();
        res.setHeader(
          "content-type",
          file.endsWith(".png") ? "image/png" : "application/json",
        );
        res.end(readFileSync(file));
      });
    },
    // Client build only — the SSR bundle has no use for them.
    generateBundle(_options, _bundle) {
      if (this.environment?.name !== "client") return;
      for (const name of ["game_asset.json", "game_asset.png"]) {
        const file = gameAssetPath(name);
        if (!file) continue;
        this.emitFile({
          type: "asset",
          fileName: `game-assets/${name}`,
          source: readFileSync(file),
        });
      }
    },
  };
}

// Keep Vite's dependency optimizer switched OFF.
//
// @fresh/plugin-vite sets `optimizeDeps.noDiscovery: true` on purpose ("Optimize
// deps somehow leads to duplicate modules"). Vite only *really* disables the
// optimizer when noDiscovery is set AND `optimizeDeps.include` is empty; a
// non-empty include list brings it back to life. @sveltejs/vite-plugin-svelte
// contributes an include list (svelte + its dependency reinclusions), and Vite
// merges plugin arrays by concatenation — so adding Svelte silently re-enabled
// the optimizer.
//
// With the optimizer live, `vite:resolve` appends `?v=<browserHash>` to every
// node_modules resolution it handles (ensureVersionQuery). Fresh's Deno plugin
// resolves bare specifiers itself at `enforce: "pre"`, so imports coming from
// Deno-resolved modules never get that query. The result was two URLs for one
// file, i.e. two live copies of Preact:
//
//   preact/dist/preact.module.js?v=3589703d   <- islands, fresh:client-entry
//   preact/dist/preact.module.js              <- fresh's preact_hooks_client.ts
//
// Two copies means two `options` objects. Fresh hydrated with one of them while
// islands pulled hooks bound to the other, so `currentComponent` was never set
// for the island's hooks module and preact/debug threw
// "Hook can only be invoked from render methods." on the first useRef.
//
// Nothing here needs pre-bundling — every dep is ESM resolved through Deno's
// node_modules — so emptying the include list is the whole fix.
function disableDepOptimizer(): Plugin {
  return {
    name: "disable-dep-optimizer",
    enforce: "post",
    config(config) {
      config.optimizeDeps = {
        ...config.optimizeDeps,
        noDiscovery: true,
        include: [],
      };
      const client = config.environments?.client;
      if (client?.optimizeDeps) {
        client.optimizeDeps = {
          ...client.optimizeDeps,
          noDiscovery: true,
          include: [],
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [
    stripDenoDepQuery(),
    gameAssets(),
    fresh(),
    svelte({
      // vitePreprocess strips TS from <script lang="ts"> via esbuild before
      // Svelte's parser sees it. Without this, types like `interface { ... }`
      // and arrow type-cast expressions trip the parser.
      preprocess: [vitePreprocess()],
      compilerOptions: { runes: true },
    }),
    disableDepOptimizer(),
  ],
  // Vite does not read PORT on its own; honouring it lets a launcher place the
  // dev server on a free port. Unset leaves Vite's own default (5173) alone.
  server: env.PORT ? { port: Number(env.PORT) } : {},
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".svelte"],
  },
});
