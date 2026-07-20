// Dev/build config for the ps2-sp browser demo. The demo imports the game
// straight from the published JSR module @easierbycode/svelte-ps2 (resolved
// via .npmrc + the npm: alias in package.json), so there is no dependency on
// a local ../src checkout. Root is resolved from this file so the server
// works regardless of the cwd `npx vite` is launched from.

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: {
    port: 5180,
    strictPort: true,
  },
  // The demo and the JSR package both pull in Phaser 4 — keep a single copy
  // so instanceof checks and the WebGL renderer share one runtime.
  resolve: {
    dedupe: ['phaser'],
  },
})
