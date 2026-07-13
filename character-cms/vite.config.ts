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

export default defineConfig({
  plugins: [
    stripDenoDepQuery(),
    fresh(),
    svelte({
      // vitePreprocess strips TS from <script lang="ts"> via esbuild before
      // Svelte's parser sees it. Without this, types like `interface { ... }`
      // and arrow type-cast expressions trip the parser.
      preprocess: [vitePreprocess()],
      compilerOptions: { runes: true },
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".svelte"],
  },
});
