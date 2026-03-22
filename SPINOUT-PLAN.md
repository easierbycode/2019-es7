# Spinout Plan: `src/phaser` → New `2028` Repository

## 1. What the New Repo Contains

### 1.1 Phaser Game Code (`src/phaser/` → becomes the core of the new repo)

All 46 files currently under `src/phaser/`:

**Scenes (root level):**
- `PhaserGame.js` — Game config & instantiation
- `boot-entry.js` — esbuild entry point for Cordova/Electron bundles
- `BootScene.js` — Asset preloader, Firebase level fetcher
- `TitleScene.js` — Title screen UI
- `AdvScene.js` — Pre-game advertisement/instructions
- `GameScene.js` — Main gameplay loop
- `ContinueScene.js` — Continue/game-over countdown
- `EndingScene.js` — Credits/ending
- `GamepadInput.js` — Gamepad API polling
- `StaffRollPanel.js` — Staff roll display

**Subdirectories:**
- `game-objects/` — Player, Enemy, Bullet, Boss, Shadow, 6 boss-specific classes, base classes, index
- `bosses/` — Alternative boss specifications (Boss, 6 boss files, index)
- `effects/` — Explosions, AkebonoFinish, index
- `ui/` — HUD, GameTitle, BigNumberDisplay, SmallNumberDisplay, ComboNumberDisplay, ScorePopup, SpGaugeButton, CutinContainer, StageBackground, index

### 1.2 Shared Modules (must be copied into the new repo)

These files live in `src/` and are imported by `src/phaser/` via `../` paths. They must move into the new repo (the import paths will change):

| File | What it exports | Used by |
|------|----------------|---------|
| `src/constants.js` | `GAME_DIMENSIONS`, `LANG`, `BASE_PATH`, `BGM_INFO`, `RESOURCE_PATHS`, `STAGE_IDS`, `SCENE_NAMES`, `ANIMATION`, `FPS`, `Ϫ` | Every scene, every game-object, every UI component |
| `src/gameState.js` | `gameState`, `normalizeScore`, `syncRuntimeFlagsFromLocation`, `setHighScore`, `setScoreSyncStatus`, `loadHighScore`, `saveHighScore` | Every scene, BootScene, EndingScene |
| `src/firebaseScores.js` | `initializeFirebaseScores`, `submitHighScore` | boot-entry, BootScene, EndingScene |
| `src/haptics.js` | `triggerHaptic`, `setHapticsEnabled`, `isHapticsEnabled` | GameScene, Player, UI buttons |
| `src/highScoreUi.js` | `getDisplayedHighScore`, `getWorldBestLabel`, `getHighScoreSyncText`, `getHighScoreSyncTint`, `createScoreTextStyle` | HUD, TitleScene |
| `src/soundManager.js` | `play`, `bgmPlay`, `stop`, `stopAll`, `pauseAll`, `resumeAll`, `setInitialVolumes` | All scenes |
| `src/globals.js` | `globals` (resources, interactionManager, pixiApp, gameManager) | BootScene, soundManager |
| `src/enums/scene-ids.js` | `SCENE_IDS` | constants.js |
| `src/enums/player-boss-states.js` | `PLAYER_STATES`, `BOSS_STATES` | Player, Enemy, GameScene |

**Important note on `soundManager.js`:** Currently references `PIXI.sound` for `stopAll`/`pauseAll`/`resumeAll`. The new repo's copy should be refactored to use Phaser 4's audio system instead of PIXI.sound, since the new repo won't include PIXI at all.

**Important note on `highScoreUi.js`:** The `createScoreTextStyle` function references `PIXI.TextStyle`. This function is only used by the legacy PIXI code—the Phaser scenes use different APIs. Either remove this function or replace it.

**Important note on `globals.js`:** References `__PHASER_GAME__` (the old PIXI game instance). The new repo should clean this up to reference only `__PHASER_4_GAME__`.

### 1.3 Assets (entire `assets/` directory)

```
assets/
├── game.json               — Main sprite atlas metadata
├── game_ui.json            — UI sprite atlas
├── game_asset.json         — Game asset definitions
├── title_ui.json           — Title screen atlas
├── img/
│   ├── title_bg.jpg
│   ├── game_ui.png, game_asset.png, title_ui.png  — Atlas spritesheets
│   ├── loading/            — loading_bg.png, loading0-2.gif
│   └── stage/              — stage_loop3.png, stage_loop4.png, stage_end3.png, stage_end4.png
└── sounds/                 — ~200+ MP3 files organized by scene
    ├── scene_title/        — voice_titlecall.mp3
    ├── scene_adventure/    — adventure_bgm.mp3, g_adbenture_voice0.mp3
    ├── scene_game/         — g_stage_voice_0..4.mp3
    ├── scene_continue/     — bgm_continue.mp3, bgm_gameover.mp3, voice_countdown0..9.mp3, etc.
    ├── scene_clear/        — voice_congra.mp3
    ├── ui/                 — se_decision.mp3, se_correct.mp3, se_cursor.mp3, etc.
    ├── boss_*_bgm.mp3      — 6 boss battle BGMs
    ├── boss_*_voice_*.mp3  — Boss voice lines (~30 files)
    └── se_*.mp3            — Sound effects (explosion, shoot, damage, guard, barrier, etc.)
```

### 1.4 Libraries (bundled, not from npm)

```
lib/
├── phaser.min.js                — Phaser 4.0.0-rc.6
├── firebase-app-compat.js       — Firebase v10.12.5 compat
└── firebase-database-compat.js  — Firebase v10.12.5 database
```

### 1.5 HTML Entry Points

- `phaser-game.html` — Primary game entry (web, Cordova, Electron)
- `level-editor.html` — Level editor (loaded in modal)
- `boss-viewer.html` — Boss animation viewer
- `boss-attack-viewer.html` — Boss attack pattern viewer
- `support.html` — Support page

### 1.6 Platform Configs

- `config.xml` — Cordova app definition
- `manifest.json` — PWA manifest
- `electron/` — Electron app (main.js, package.json, afterPack.js)
- `hooks/after_prepare.js` — Cordova hook (Android immersive mode + iOS WKWebView inspectable)
- `src/ps2/` — Entire PS2 port (20 JS files + deploy/ with build.sh + assets/)
- `res/` — Android/iOS icon resources
- `icons/` — PWA and app icons
- `.github/workflows/deploy.yml` — CI/CD for all platforms
- `.github/workflows/ios-testflight.yml` — iOS TestFlight pipeline
- `tools/create-atlas.js` — Atlas generation tool

---

## 2. Title/Name Configuration

The title displayed to the user is controlled in multiple places. The rule is: **builds from `2019-es7` show "2019"; builds from the new `2028` repo show "2028.ai".**

### 2.1 All Locations Where Title/Name Is Set

| File | Current Value | For `2019-es7` | For new `2028` repo |
|------|--------------|-----------------|---------------------|
| `phaser-game.html` `<title>` | `2028.ai — Phaser 4` | `2019` | `2028.ai` |
| `phaser-game.html` `<meta apple-mobile-web-app-title>` | `2028.ai` | `2019` | `2028.ai` |
| `index.html` `<title>` | `2028.ai` | `2019` | N/A (legacy, stays in 2019-es7) |
| `index.html` `<meta apple-mobile-web-app-title>` | `2028.ai` | `2019` | N/A |
| `manifest.json` `name` + `short_name` | `2028.ai` | `2019` | `2028.ai` |
| `config.xml` `<name>` | `2028.ai` | `2019` | `2028.ai` |
| `config.xml` `widget id` | `com.easierbycode.game2028` | `com.easierbycode.game2019` | `com.easierbycode.game2028` |
| `package.json` `name` | `2028-ai` | `2019-es7` | `2028-ai` |
| `electron/package.json` `name` | `phaser-game` | `phaser-game` (or `2019`) | `phaser-game` (or `2028-ai`) |
| `electron/package.json` `description` | `2028.ai — AI vs The World` | `2019` | `2028.ai — AI vs The World` |
| `electron/package.json` `build.appId` | `com.easierbycode.game2028` | `com.easierbycode.game2019` | `com.easierbycode.game2028` |
| `ios-testflight.yml` `APP_NAME` env | `2028.ai` | `2019` | `2028.ai` |
| `ios-testflight.yml` `APP_ID` env | `com.easierbycode.game2028` | `com.easierbycode.game2019` | `com.easierbycode.game2028` |
| `deploy.yml` Cordova create command | `"2028.ai"` | `"2019"` | `"2028.ai"` |
| `electron/main.js` `loadURL` query | `?level=2028` | `?level=2019` (or remove param) | `?level=2028` |
| `config.xml` `<content src>` query | `?level=2028` | `?level=2019` (or remove param) | `?level=2028` |

### 2.2 Implementation Strategy

**Option A (recommended): Build-time variable.** Add a `GAME_TITLE` constant to `constants.js` and reference it everywhere. The HTML files use a build step (or template) to inject the right title. Each repo sets its own value.

**Option B: URL parameter driven.** The `?level=` param already controls which Firebase level data loads. Extend this to also set `document.title`. The new repo defaults `?level=2028` → title "2028.ai"; the old repo defaults `?level=2019` → title "2019".

---

## 3. Build Steps for the New Repo

### 3.1 package.json

```json
{
  "name": "2028-ai",
  "version": "1.0.0",
  "private": true,
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron": "electron .",
    "bundle:cordova": "npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=lib/boot.bundle.js",
    "bundle:electron": "npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=electron/www/lib/boot.bundle.js",
    "ps2:build": "cd src/ps2/deploy && bash build.sh"
  },
  "devDependencies": {
    "electron": "^35.0.0",
    "electron-builder": "^25.1.8",
    "esbuild": "^0.24.0",
    "vite": "^6.0.0"
  }
}
```

### 3.2 GitHub Pages / Web

From `deploy.yml` → `web` job:

```bash
mkdir dist
cp -r assets dist/
cp -r src dist/
cp -r lib dist/
cp -r icons dist/ || true
cp phaser-game.html dist/
cp level-editor.html dist/
cp boss-viewer.html dist/
cp boss-attack-viewer.html dist/
cp support.html dist/
cp manifest.json dist/ || true
cp favicon.ico dist/ || true
```

No bundling needed for web — ES modules loaded natively via `<script type="module">` in `phaser-game.html`.

### 3.3 PWA

Already handled by `manifest.json` + the iOS install banner in `phaser-game.html`. Just needs a service worker file added for true offline support (currently not present).

### 3.4 Cordova (Android + iOS)

**Android** (from `deploy.yml` → `cordova` job):

1. `npm i -g cordova`
2. `cordova create cordova com.easierbycode.game2028 "2028.ai"`
3. `cordova platform add android@14.0.1`
4. Copy `config.xml`, `res/`, `hooks/` into cordova project
5. Normalize SDK versions in config.xml (target SDK 35, compile SDK 35, Gradle 8.14.2)
6. **Bundle JS**: `npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=lib/boot.bundle.js`
7. Copy files to `cordova/www/`: `assets/`, `src/`, `lib/`, `icons/`, `phaser-game.html`, `level-editor.html`, `boss-viewer.html`, `boss-attack-viewer.html`, `manifest.json`, `favicon.ico`
8. Inject `<script src="cordova.js"></script>` into HTML `</head>`
9. Replace ES module `<script type="module">` block with `<script src="./lib/boot.bundle.js"></script>`
10. `cordova prepare android` → `cordova compile android --debug --packageType=apk`

**iOS** (from `ios-testflight.yml`):

1. Same bundling as Android
2. `cordova platform add ios@7.1.1`
3. `config.xml` uses `scheme=https`, `hostname=localhost` for WKWebView fetch() compatibility
4. Archive with `xcodebuild archive`, export IPA, upload to TestFlight via `xcrun altool`
5. Requires Apple certificates, provisioning profiles, and App Store Connect API key (stored as GitHub secrets)

**Cordova hook** (`hooks/after_prepare.js`):
- Android: Patches `MainActivity.kt` for immersive sticky mode (hides status/nav bars)
- iOS: Patches `AppDelegate.swift` to enable `WKWebView.isInspectable` for remote debugging

### 3.5 Electron (Linux AppImage)

From `deploy.yml` → `electron` job:

1. Create `electron/www/` directory
2. Copy `assets/`, `src/`, `lib/`, `phaser-game.html`, `manifest.json`, `favicon.ico`, `icons/` into `electron/www/`
3. **Bundle JS**: `npx esbuild src/phaser/boot-entry.js --bundle --format=iife --outfile=electron/www/lib/boot.bundle.js`
4. Replace ES module block in `electron/www/phaser-game.html` with bundled script
5. `cd electron && npm install && npx electron-builder --linux AppImage --publish never`

**Electron entry** (`electron/main.js`):
- Registers custom `app://` protocol to serve `www/` files with CORS support
- Fullscreen, frameless window
- Portrait rotation via `xrandr` for handheld devices (Legion Go, etc.)
- Loads `app://game/phaser-game.html?level=2028`
- Gamepad extensions enabled via Chromium flags
- Clears Steam environment variables to avoid library conflicts

### 3.6 PS2 (AthenaEnv v4)

From `deploy.yml` → `ps2` job + `src/ps2/deploy/build.sh`:

**Prerequisites:** Python 3 + Pillow, genisoimage, ffmpeg (optional), athena.elf binary

**Build steps:**
1. Bundle JS: Concatenates all `src/ps2/*.js` files into a single `main.js` (order matters — see `JS_FILES` array in build.sh)
2. Process texture atlases: Downscale to 512x512 max (PS2 has 4MB GS VRAM). Uses Python/Pillow to resize PNG and scale JSON frame coordinates
3. Convert audio: MP3 → WAV (22kHz mono for SFX/voices) and MP3 → OGG (44kHz stereo for BGM) via ffmpeg
4. Copy stage backgrounds and title image
5. Create boot config: `SYSTEM.CNF` (boot descriptor), `athena.ini` (AthenaEnv config), `ATHA_000.01` (renamed athena.elf)
6. Create ISO: `genisoimage -udf -l -allow-lowercase -allow-multidot -o ps2.iso iso_root/`

**PS2 source files** (`src/ps2/`): A complete reimplementation (not Phaser) using AthenaEnv v4's JS runtime. 20 source files covering scenes, rendering, input, audio, sprites, tweening, and timers. These reference `assets/` via the same relative paths but with WAV/OGG extensions instead of MP3.

---

## 4. Linking the New Repo from `2019-es7`

### 4.1 Git Submodule Approach (recommended)

```bash
# In 2019-es7 repo
git submodule add https://github.com/easierbycode/2028.git packages/2028
```

Then update `2019-es7`'s build/deploy scripts to:
- Use the submodule's `assets/`, `src/phaser/`, `lib/`, HTML files, and configs
- Override title references to "2019" in `2019-es7`'s own HTML/config copies
- The submodule is the single source of truth for game code; `2019-es7` wraps it with its own title/branding

### 4.2 npm Package Approach (alternative)

Publish the new repo as a private npm package. `2019-es7` installs it and imports:

```javascript
import { createPhaserGame } from "2028-ai/src/phaser/PhaserGame.js";
```

### 4.3 What Stays in `2019-es7`

After the spinout, `2019-es7` retains:
- `src/app-original.js` — Legacy PIXI game (367KB)
- `src/app-formatted.js` — PIXI boot wrapper
- `src/main.js` — Legacy entry point
- `src/scenes/` — PIXI scenes (LoadScene, TitleScene, etc.)
- `src/bosses/` — PIXI-era boss definitions
- `src/game-objects/` — PIXI game objects
- `src/ui/` — PIXI UI components
- `src/lib/` — PIXI.js, pixi-sound, TweenMax
- `src/HitTester.js` — PIXI hit test
- `index.html` — Legacy entry point (title: "2019")
- A submodule/link to the new `2028` repo for the Phaser game

The shared modules (`constants.js`, `gameState.js`, etc.) would live in the new repo. `2019-es7` would either:
- Import them from the submodule path, or
- Keep its own copies (simpler but risks drift)

---

## 5. Suggested New Repo Structure

```
2028/
├── package.json
├── vite.config.js
├── phaser-game.html              — Primary entry point
├── level-editor.html
├── boss-viewer.html
├── boss-attack-viewer.html
├── support.html
├── manifest.json                 — PWA manifest (name: "2028.ai")
├── config.xml                    — Cordova config (name: "2028.ai")
├── favicon.ico
│
├── assets/                       — All game assets (sprites, sounds, images)
│   └── [same structure as current]
│
├── lib/                          — Bundled libraries
│   ├── phaser.min.js
│   ├── firebase-app-compat.js
│   └── firebase-database-compat.js
│
├── src/
│   ├── phaser/                   — Game scenes & objects (current src/phaser/)
│   │   ├── PhaserGame.js
│   │   ├── boot-entry.js
│   │   ├── BootScene.js
│   │   ├── TitleScene.js
│   │   ├── AdvScene.js
│   │   ├── GameScene.js
│   │   ├── ContinueScene.js
│   │   ├── EndingScene.js
│   │   ├── GamepadInput.js
│   │   ├── StaffRollPanel.js
│   │   ├── game-objects/
│   │   ├── bosses/
│   │   ├── effects/
│   │   └── ui/
│   │
│   ├── shared/                   — Shared modules (moved from src/)
│   │   ├── constants.js
│   │   ├── gameState.js
│   │   ├── firebaseScores.js
│   │   ├── haptics.js
│   │   ├── highScoreUi.js
│   │   ├── soundManager.js       — Refactored: remove PIXI.sound, use Phaser audio
│   │   ├── globals.js
│   │   └── enums/
│   │       ├── scene-ids.js
│   │       └── player-boss-states.js
│   │
│   └── ps2/                      — PS2 AthenaEnv port
│       ├── main.js
│       ├── [18 other source files]
│       ├── assets/               — PS2-specific assets (level_2028.json, etc.)
│       └── deploy/
│           └── build.sh
│
├── electron/
│   ├── main.js
│   ├── package.json
│   └── afterPack.js
│
├── hooks/
│   └── after_prepare.js          — Cordova platform hooks
│
├── res/                          — Android/iOS icon resources
├── icons/                        — PWA and app icons
├── tools/
│   └── create-atlas.js
│
└── .github/
    └── workflows/
        ├── deploy.yml            — Web + Android + Electron + PS2
        └── ios-testflight.yml    — iOS TestFlight
```

### 5.1 Import Path Changes

All `src/phaser/` files currently use `../` to reach shared modules. After moving shared modules to `src/shared/`, the imports change:

```javascript
// Before (in 2019-es7)
import { GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";

// After (in new repo)
import { GAME_DIMENSIONS } from "../shared/constants.js";
import { gameState } from "../shared/gameState.js";
```

The `boot-entry.js` file also needs its imports updated from `../gameState.js` to `../shared/gameState.js`, etc.

---

## 6. Optimization Opportunities in the New Repo

With a dedicated repo, every file can be optimized:

- **Tree-shake Phaser 4**: If RC6 supports it, import only the modules used (Scene, Sprite, Audio, etc.) instead of the full 1.2MB bundle
- **Audio compression**: Audit all 200+ MP3 files for bitrate, trim silence, normalize levels
- **Atlas optimization**: Re-pack sprite atlases with tighter packing, remove unused frames
- **Code splitting**: Lazy-load boss-specific code only when that boss stage is reached
- **Dead code removal**: `soundManager.js` PIXI references, `globals.js` PIXI references, `highScoreUi.js` PIXI TextStyle
- **PS2 asset pipeline**: Pre-convert all assets at build time instead of relying on runtime ffmpeg
- **Service worker**: Add proper offline caching for the PWA
- **esbuild minification**: Add `--minify` to the Cordova/Electron bundle step

---

## 7. Checklist for Executing the Spinout

1. Create new GitHub repo (`easierbycode/2028` or similar)
2. Copy all files listed in sections 1.1–1.6 into the new repo
3. Restructure shared modules into `src/shared/` and update all import paths
4. Refactor `soundManager.js` to remove PIXI.sound dependency
5. Refactor `highScoreUi.js` to remove `createScoreTextStyle` PIXI dependency
6. Clean up `globals.js` to remove PIXI references
7. Set all title/name references to "2028.ai" (section 2.1, "For new 2028 repo" column)
8. Copy and adapt both GitHub Actions workflow files
9. Verify builds: `vite dev`, esbuild bundle, Cordova Android, Cordova iOS, Electron, PS2 ISO
10. Add the new repo as a git submodule in `2019-es7`
11. Update `2019-es7` to consume the submodule (import paths, build scripts)
12. Change all title/name references in `2019-es7` to "2019" (section 2.1, "For 2019-es7" column)
13. Verify `2019-es7` still builds and works on all platforms with the submodule link
