# Project Notes

## Architecture
- Two game engines coexist: **PIXI.js** (legacy, `src/`) and **Phaser 4 RC6** (`src/phaser/`)
- Phaser game entry point: `phaser-game.html` (served via `npx serve`)
- PIXI game entry point: `index.html` (mode select screen — NOT the Phaser game)
- Launch config: `.claude/launch.json` with `url: "/phaser-game.html?lowmode=1"`

## Testing the Phaser Game
- Dev server: `npx serve --no-clipboard .` on port 3000
- **IMPORTANT**: Navigate to `/phaser-game.html?lowmode=1` — the root `/` serves the PIXI mode select, NOT the Phaser game
- URL param `?scene=PhaserGameScene` is intended to skip to gameplay but may land on TitleScene; use `game.scene.stop('PhaserTitleScene'); game.scene.start('PhaserGameScene');` via console to force it
- Asset loading takes 30-45 seconds on first load (7MB SP mode)
- Phaser scenes: BootScene, PhaserTitleScene, PhaserAdvScene, PhaserGameScene, PhaserContinueScene, PhaserEndingScene
- Game uses Phaser's tween system (`this.tweens.add()`), GSAP (`TweenMax`/`TimelineMax`) is only in the PIXI codebase

## HUD / Score Display
- Phaser HUD is inline in `src/phaser/GameScene.js` (`createHUD()` method)
- Score uses `SmallNumberDisplay` pattern: a container with individual digit sprites (`smallNum0.gif`–`smallNum9.gif`)
- Score updates via `this.scoreCount += ...` then `this._setSmallNum(this.scoreSmallNum, this.scoreCount)` in `updateHUD()`
- `updateScoreText()` tweens the score container (scale 1.2→1, tint blue→white, 200ms, repeat 2) — called when enemies are destroyed
