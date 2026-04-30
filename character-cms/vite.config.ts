// Fresh 2.x uses Vite for the dev server and the build pipeline. The
// fresh() plugin handles file-based routes, islands, SSR, and the static
// file middleware. We add Svelte alongside it so .svelte islands compile.
//
// Run:
//   deno task dev      — Vite dev server with HMR
//   deno task build    — production build, output to _fresh/ for Deno Deploy
//   deno task serve    — boot the SSR entrypoint locally (post-build)

import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
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
