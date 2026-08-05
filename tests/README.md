# Tests

Two layers, both run by CI (`.github/workflows/test.yml`) on every push/PR.

## Unit / golden (node:test, zero-install for the pure-JS suite)

```bash
cd tools/dezaemon-import
npm install        # once — pngjs (atlas emit tests skip without it)
node --test        # or: node --test --watch
```

Covers the Saturn BUP container parser (block-accurate payload reassembly is
proven by 16/16 section checksums against the fixture saves), the section
table, the game.json mapping/blank-game builder, the executable game.json
schema (with a canary against the shipped `assets/game.json`), and the CLI
(exit codes, `--json` shape, `--out` output).

## E2E (Playwright)

```powershell
cd tests\e2e
npm install
npx playwright install chromium   # once
npm test                          # or: npx playwright test specs/sav-import.spec.js --headed
```

Specs:

- `editor-loads` — editor boots, auto-loads the shipped game, Dezaemon ESM module present, zero page errors.
- `new-game-wizard` — `?new=1` → blank 8×8 game → Play handoff recipe validates against the shared schema.
- `sav-import` — feeds `fixtures/ramsie.sav` through the real file input, asserts modal metadata (DEZA2 SGM, 167,511 bytes, 331 blocks, golden checksum in the hex view), applies, asserts editor state.
- `editor-play-smoke` — seeds a recipe into localStorage, boots `phaser-game.html?editorPlay=1` all the way to `PhaserGameScene` (slow: 7MB assets; isolated in its own project with retries).

The suite runs its own dependency-free static server on **port 3210**
(`static-server.js`) instead of `npx serve`, because `serve` 301-redirects
`page.html?x=1` → `/page` and **drops the query string**, which would silently
break the `?editorPlay=1` / `?new=1` specs. Keep using `serve` for manual dev
(port 3000) — just use extensionless URLs (`/level-editor?new=1`) when you
need query params there.

## Root shortcuts

```bash
npm run test:unit
npm run test:e2e
npm test            # both
```

## Emulator capture harness (local only, not CI)

`tools/dezaemon-import/harness/` replays Saturn emulator input movies to
regenerate controlled-delta save fixtures. It needs the Dezaemon 2 disc image
(never committed — `harness/local/` is git-ignored); its committed outputs in
`fixtures/deltas/` are what CI regression-tests. See the harness README.
