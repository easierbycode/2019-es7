---
name: build-firebase-level
description: Build a standalone iOS, Android, or Linux app from a single Firebase level by name. Strips unused assets, bakes atlas overrides into a single merged atlas, downloads custom BGM, and rebrands the app (display name + package id) to match the level. Trigger when the user asks to "build level X for ios/android/linux", "package level foo as an app", "make an apk/appimage/ipa for level X", or similar.
---

# Build a Firebase Level into a Cordova/Electron App

## What this skill does

Wraps `tools/build-level/index.js`, which given a Firebase level name:

1. Pulls `/levels/{name}` from the evil-invaders Firebase RTDB via REST.
2. Bakes `atlasImageDataURL` + `atlasFrames` into a merged `game_asset.png` / `game_asset.json` (no runtime merge).
3. Downloads every `customAudioURLs` entry into `assets/custom-bgm/` with a manifest.
4. Stages a minimal `www/` tree — only `phaser-game.html`, the Phaser lib, bundled boot script, UI atlases, stage backgrounds, loading images, fonts, sounds, merged game atlas, level data, and custom BGM. No PIXI, no level editor, no viewers.
5. Bundles `src/phaser/boot-entry.js` via `esbuild` into `lib/boot.bundle.js`.
6. Rebrands: app display name = the exact Firebase level name; Cordova widget id + Electron `appId` = `com.easierbycode.<slug>` where `<slug>` is the lowercase alphanumeric form of the level name (max 30 chars).
7. Runs the platform build:
   - **linux** → `electron-builder --linux AppImage` → `build/<slug>/dist/<slug>.AppImage`
   - **android** → `cordova compile android --debug --packageType=apk` → `build/<slug>/dist/*.apk`
   - **ios** → `cordova prepare ios` → Xcode project at `build/<slug>/cordova/platforms/ios` (signing handled externally)

## How to invoke

From the repo root:

```bash
node tools/build-level "<levelName>" <platform>
```

Where `<platform>` is `ios`, `android`, `linux`, or `all`.

Optional flags:
- `--package-id <id>` — override the package id.
- `--out <dir>` — override the build root (default `build/<slug>`).
- `--skip-bgm` — skip custom BGM downloads (dev only).
- `--no-minify` — disable esbuild minification + HTML whitespace squeeze (default on).
- `--keep-console` — keep `console.log`/`debugger` statements in the bundle (default dropped).
- `--no-perf` — disable the injected Electron Performance Mode (frame-rate cap + v-sync stay at Chromium defaults).
- `--stage-only` — stop after staging `www/` (skip platform builds).

## GemShell-inspired features baked into the Electron build

Inspired by [GemShell](https://itch.io/t/5446364/gemshell-desktop-packer-for-webgames-ditch-the-bloat):

- **Performance Mode** (default on): injects `disable-frame-rate-limit`, `disable-gpu-vsync`, `disable-renderer-backgrounding`, and `enable-zero-copy` Chromium switches into the Electron `main.js` so the game can render past 60 fps. Runtime opt-out: set `GEMSHELL_PERF=0` when launching. Build-time opt-out: `--no-perf`.
- **Fullscreen Toggle**: F11 (all platforms) and Cmd/Ctrl+F registered as global shortcuts in Electron.
- **Code Minification**: esbuild `minify: true` on the boot bundle (~46% size reduction observed), plus a lightweight HTML whitespace squeeze.
- **Console Log Removal**: esbuild `drop: ['console','debugger']` during bundling.
- **FPS Overlay**: a tiny inline script in `phaser-game.html` that shows a live fps counter when the URL contains `?fps=1` — mirrors GemShell's "FPS graph" dev tool without pulling in deps.
- **Duplicate Asset Detection / stripping bloat**: handled by the staging phase itself — no PIXI, no level editor, no viewers, no unused assets. The merged atlas replaces the runtime merge path entirely.
- **Single-file executable**: the Electron target is AppImage.
- **Custom App Icons**: pulled from the repo's existing `icons/icon-512.png`.

Features GemShell offers that are intentionally **not** implemented (already covered or not applicable): Service Worker caching (the build is fully bundled, no network at runtime), auto-update detection (distribution is manual), universal HTML5 compatibility (this pipeline is Phaser-specific by design).

## Usage rules for Claude

- Always run the command from the repo root (`C:\Users\phatm\CODE\2019-es7` or wherever the user has cloned `2019-es7`).
- Use the level name **exactly as the user provides it** — do not lowercase or slugify when passing to the CLI. The tool derives the slug itself, and the display name is the raw string.
- The first run of the tool will `npm install` its own dependencies inside `tools/build-level/` (pngjs, esbuild) and inside `build/<slug>/electron/` (electron, electron-builder). That is expected.
- Linux builds require `electron-builder`'s toolchain; Android builds require an Android SDK + JDK; iOS builds require macOS + Xcode. If a platform build fails because the toolchain is missing, report the specific missing piece to the user — do not try to install SDKs.
- On success, print the list of artifact paths from the tool's output verbatim so the user can locate them.
- If Firebase returns "level not found" (exit code 3), surface the error clearly and suggest checking the level name via the level editor — do not retry.

## Example

User: *"build level foo for linux"*

Claude runs:

```bash
node tools/build-level "foo" linux
```

Expected final artifact: `build/foo/dist/foo.AppImage`, display name "foo", appId `com.easierbycode.foo`.
