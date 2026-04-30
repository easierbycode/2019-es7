// Fresh server entry. Vite's @fresh/plugin-vite uses this as the
// serverEntry by default — it picks up `app` and produces:
//   - dev:   in-memory SSR via Vite middleware
//   - build: _fresh/server.js (the Deno Deploy artifact)
//
// `app.fsRoutes()` walks the routes/ directory using the build cache
// populated by the Vite plugin.

import { App, staticFiles, trailingSlashes } from "fresh";

export interface State {}

export const app = new App<State>();

app.use(trailingSlashes("never"));
app.use(staticFiles());
app.fsRoutes();

if (import.meta.main) {
  await app.listen();
}
