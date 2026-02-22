# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a Street Fighter-themed browser game built with PixiJS. The game runs as a vanilla ES module app (no bundler, no npm) loaded directly via `index.html`. It supports Cordova for mobile deployment.

## Running the Game

There is no build step. Serve the project root with any static HTTP server and open `index.html`:

```sh
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

There are no tests, no linter, and no `package.json`.

## Architecture

### Core vs. Extension Layer

The codebase is split into two layers:

1. **Core layer** (`src/app-original.js`) — A large, minified/transpiled JS file (~9200 lines) containing all original game logic: class definitions, scene management, rendering, physics, sound, and game constants. It exports named classes and `instantiateGame`. This file also exists at the repo root as `app-original.js` (webpack bundle format), but the one under `src/` is the ES module version used at runtime.

2. **Extension layer** (`src/game-objects/*.js`, `src/scenes/*.js`) — Thin ES module wrapper classes that extend the core classes. Every file follows the same pattern: import a core class from `app-original.js`, re-export a subclass that simply calls `super(...args)`. These exist as extension points — override methods here to customize behavior without modifying the core.

### Entry Point Flow

`index.html` → loads PixiJS, TweenMax, and pixi-sound from `src/lib/` as global scripts → loads `src/main.js` as an ES module → calls `instantiateGame()` which creates a `PIXI.Application` (256×480), attaches it to `#canvas`, and starts the scene manager.

`src/main.js` listens for the Cordova `deviceready` event; in non-Cordova environments it dispatches a synthetic one after 50ms.

### Re-export Barrel File

`src/app-formatted.js` re-exports all game-objects, scenes, and `instantiateGame` from a single import path. Use this when you need to import multiple classes without reaching into individual files.

### Scene Flow

The game uses a custom scene manager (`B.Manager`) with scenes: Load → Title → Adv (adventure/story) → Game (with boss fights: Bison, Barlog, Sagat, Vega, Goki, Fang) → Result/Continue/Gameover/Congra → Ending.

### Key Constants (in `app-original.js`)

- Game resolution: 256×480 (`GAME_WIDTH` / `GAME_HEIGHT`)
- Target FPS: 30
- Assets are referenced via the `RESOURCE` map pointing to `assets/` (JSON sprite atlases, sounds, images)

### Class Hierarchy (Game Objects)

`BaseCast` → `BaseSpriteCast` → `BaseUnit` → `Player` / `Enemy`
`Boss` (extends from core) with specific bosses: `BossBison`, `BossBarlog`, `BossSagat`, `BossVega`, `BossGoki`, `BossFang`
`Bullet` (projectile)

### Libraries (vendored in `src/lib/`, loaded as globals)

- **PixiJS** — 2D rendering (accessed via global `PIXI`)
- **pixi-sound** — Audio playback
- **TweenMax (GSAP)** — Animation/tweening
