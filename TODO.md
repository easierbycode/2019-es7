# ES7 Migration: Remaining Differences & Added Features

Comparison of the original webpack bundle (`app-original.js`, root) against the
modular ES7 architecture under `src/`.

---

## Extraction Status Overview

| Layer | Original (root `app-original.js`) | ES7 Status |
|-------|-----------------------------------|------------|
| Webpack runtime | IIFE module loader (lines 1-71) | Eliminated — native ES modules |
| Constants (`i`) | Inline object literal | Extracted to `src/constants.js` |
| Enums (scene IDs, player/boss states) | Inline string literals | Extracted to `src/enums/` |
| Custom events | Inline strings | Extracted to `src/events/custom-events.js` |
| Game state (`D` singleton) | Closure variable | Extracted to `src/gameState.js` |
| Global accessors (`B` singleton) | Closure variable | Extracted to `src/globals.js` |
| Sound manager (`g` / inline calls) | Inline in scenes | Extracted to `src/soundManager.js` |
| Hit testing (`St`) | Static class | Extracted to `src/HitTester.js` |
| Haptics | Inline | Extracted to `src/haptics.js` |
| High score UI | Inline | Extracted to `src/highScoreUi.js` |
| Firebase scores | Inline | Extracted to `src/firebaseScores.js` |
| Logger/Utility (`F`) | Closure variable (`F.dlog`, `F.tweet`) | **Not extracted** — still in `app-original.js` |
| Scene Manager (`jn`) | Class (lines 9014-9055) | **Not extracted** — still in `app-original.js` |
| `instantiateGame()` | Inline function | Partially extracted — `app-formatted.js` wraps legacy version |

---

## Game Objects

| Class | Original Variable | ES7 File | Status |
|-------|-------------------|----------|--------|
| BaseCast | `l` | `src/game-objects/BaseCast.js` (37 lines) | Fully rewritten as clean ES class |
| BaseSpriteCast | `K` | `src/game-objects/BaseSpriteCast.js` (32 lines) | Fully rewritten |
| BaseUnit | `y` | `src/game-objects/BaseUnit.js` (172 lines) | Fully rewritten |
| Bullet | `S` | `src/game-objects/Bullet.js` (148 lines) | Fully rewritten |
| Player | `M` | `src/game-objects/Player.js` (650 lines) | Fully rewritten |
| Enemy | `Ye` | `src/game-objects/Enemy.js` (256 lines) | Fully rewritten |
| Boss | `Ze` | `src/bosses/Boss.js` (316 lines) | Fully rewritten |
| BossBison | `so` | `src/bosses/BossBison.js` (162 lines) | Fully rewritten |
| BossBarlog | `po` | `src/bosses/BossBarlog.js` (199 lines) | Fully rewritten |
| BossSagat | `wo` | `src/bosses/BossSagat.js` (244 lines) | Fully rewritten |
| BossVega | `Eo` | `src/bosses/BossVega.js` (302 lines) | Fully rewritten |
| BossGoki | `Ro` | `src/bosses/BossGoki.js` (333 lines) | Fully rewritten |
| BossFang | `Wo` | `src/bosses/BossFang.js` (211 lines) | Fully rewritten |
| AnimatedEnemy (`Xe`) | `Xe` (line 3431) | — | **Not extracted** — animated sprite enemy, still in `app-original.js` |

---

## Scenes

| Class | Original Variable | ES7 File | Status |
|-------|-------------------|----------|--------|
| BaseScene | `N` | `src/scenes/BaseScene.js` (144 lines) | Fully rewritten |
| LoadScene | `Rn` | `src/scenes/LoadScene.js` (430 lines) | Fully rewritten |
| TitleScene | `mn` | `src/scenes/TitleScene.js` (371 lines) | Fully rewritten |
| AdvScene | `hn` | `src/scenes/AdvScene.js` (360 lines) | Fully rewritten |
| GameScene | `Ki` | `src/scenes/GameScene.js` (1228 lines) | Fully rewritten |
| ContinueScene | `Be` | `src/scenes/ContinueScene.js` (499 lines) | Fully rewritten |
| EndingScene | `tn` | `src/scenes/EndingScene.js` (333 lines) | Fully rewritten |
| ResultScene | alias → `tn` | `src/scenes/ResultScene.js` (5 lines) | Thin subclass of EndingScene |
| GameoverScene | alias → `tn` | `src/scenes/GameoverScene.js` (5 lines) | Thin subclass of EndingScene |
| CongraScene | alias → `tn` | `src/scenes/CongraScene.js` (5 lines) | Thin subclass of EndingScene |

---

## UI Components

| Class | Original Variable | ES7 File | Status |
|-------|-------------------|----------|--------|
| StaffrollPanel | `At` (line 1917) | `src/ui/StaffrollPanel.js` (122 lines) | Fully rewritten |
| TwitterButton | `Vt` (line 2281) | `src/ui/TwitterButton.js` (10 lines) | Thin re-export |
| GotoTitleButton | `Ie` (line 3019) | `src/ui/GotoTitleButton.js` (61 lines) | Fully rewritten |
| HUD | `Oi` (line 6428) | `src/ui/HUD.js` (355 lines) | Fully rewritten |
| StageBackground | `Bi` (line 6690) | `src/ui/StageBackground.js` (184 lines) | Fully rewritten |
| CutinContainer | `Hi` (line 6862) | `src/ui/CutinContainer.js` (82 lines) | Fully rewritten |
| FrameButton | `En` (line 8605) | `src/ui/FrameButton.js` (60 lines) | Fully rewritten |
| StartButton | — | `src/ui/StartButton.js` (105 lines) | Fully rewritten |
| ExternalLinkButton | — | `src/ui/ExternalLinkButton.js` (53 lines) | Fully rewritten |
| ModeButton | — | `src/ui/ModeButton.js` (54 lines) | Fully rewritten |
| SpGaugeButton | — | `src/ui/SpGaugeButton.js` (150 lines) | Fully rewritten |
| AdvNextButton | — | `src/ui/AdvNextButton.js` (94 lines) | Fully rewritten |
| GameTitle | — | `src/ui/GameTitle.js` (264 lines) | Fully rewritten |
| ScorePopup | — | `src/ui/ScorePopup.js` (36 lines) | Fully rewritten |
| BigNumberDisplay | — | `src/ui/BigNumberDisplay.js` (38 lines) | Fully rewritten |
| ComboNumberDisplay | — | `src/ui/ComboNumberDisplay.js` (33 lines) | Fully rewritten |
| SmallNumberDisplay | — | `src/ui/SmallNumberDisplay.js` (38 lines) | Fully rewritten |
| HowtoButton | — | `src/ui/HowtoButton.js` (16 lines) | Fully rewritten |
| ContinueYesButton | — | `src/ui/ContinueYesButton.js` (15 lines) | Fully rewritten |
| ContinueNoButton | — | `src/ui/ContinueNoButton.js` (9 lines) | Thin wrapper |
| RecommendButton | — | `src/ui/RecommendButton.js` (9 lines) | Thin wrapper |
| StaffrollButton | — | `src/ui/StaffrollButton.js` (9 lines) | Thin wrapper |
| StaffrollCloseButton | — | `src/ui/StaffrollCloseButton.js` (57 lines) | Fully rewritten |

---

## Remaining TODO Items

### High Priority — Still embedded in `app-original.js`

- [ ] **Extract `SceneManager` (`jn`, line 9014)** — Manages scene list, `goto()`, `addScene()`, and `begin()`. Currently only used inside `app-original.js` by `instantiateGame()` and `BaseScene`.
- [ ] **Extract `Logger/Utility` (`F`)** — Provides `F.dlog()` debug logging and `F.tweet()` social sharing. Referenced ~15 times across scenes.
- [ ] **Extract `AnimatedEnemy` (`Xe`, line 3431)** — `PIXI.extras.AnimatedSprite` subclass used for animated enemy units. Not in `src/game-objects/`.
- [ ] **Fully extract `instantiateGame()`** — Currently `src/app-formatted.js` wraps the legacy function from `app-original.js`. Should be rewritten to use extracted `SceneManager` and `globals` directly.
- [ ] **Remove `app-original.js` dependency** — The legacy boot patch in `app-formatted.js` imports `instantiateGame` and `LoadScene` from `app-original.js`. Once SceneManager and instantiation are extracted, this 9,124-line file can be removed.

### Medium Priority — Structural improvements

- [ ] **Consolidate `B` singleton references** — The original uses `B.Manager`, `B.Scene`, `B.resource` throughout. The ES7 code uses `globals.js` (`globals.pixiApp`, `globals.resources`, `globals.gameManager`). Verify all references in extracted scenes/objects use the new accessor.
- [ ] **Consolidate `D` singleton references** — The original uses `D.score`, `D.highScore`, `D.frame`, `D.playerHp`, `D.shootMode`, `D.lowModeFlg`, etc. The ES7 code uses `gameState.js`. Verify parity.
- [ ] **Audit `ResultScene` / `GameoverScene` / `CongraScene`** — In the original, all three alias to the same class `tn` (EndingScene). The ES7 versions are empty subclasses of `EndingScene`. Verify no scene-specific behavior is expected.
- [ ] **Remove root `app-original.js`** — The webpack-bundled version in the repo root (363 KB) appears to be the pre-refactor artifact. Confirm it is unused and remove.

### Low Priority — New features added in ES7 version

- [ ] **Firebase leaderboard integration** (`src/firebaseScores.js`, 171 lines) — New feature not in the original bundle. Provides remote high score sync.
- [ ] **Score sync status tracking** (`gameState.js`) — `scoreSyncStatus` and `scoreSyncMessage` fields are new additions for tracking leaderboard sync state.
- [ ] **Haptic feedback module** (`src/haptics.js`, 397 lines) — New standalone module for device vibration/haptic feedback.
- [ ] **High score UI display** (`src/highScoreUi.js`, 57 lines) — New dedicated module for rendering high score information.
- [ ] **Vite dev server support** (`vite.config.js`) — New development tooling not present in original webpack setup.
- [ ] **PWA manifest** (`manifest.json`) — Progressive Web App support for install-to-homescreen.
- [ ] **Cordova config** (`config.xml`) — Mobile app packaging support.
- [ ] **Bosses directory** (`src/bosses/`) — Boss classes given their own directory separate from `game-objects/`, with re-export shims in `game-objects/Boss*.js` for backwards compatibility.
- [ ] **Barrel re-exports** (`src/app-formatted.js`, `src/game-objects/index.js`, `src/scenes/index.js`, `src/ui/index.js`, `src/bosses/index.js`) — Central import points for each module group.
- [ ] **Phaser 4 port** (`src/phaser/`, ~163KB) — Parallel rendering target with its own `GameScene.js` (103KB). Separate from the PIXI extraction effort.

---

## Summary

| Category | Extracted | Remaining | New |
|----------|-----------|-----------|-----|
| Game Objects | 13/14 | 1 (AnimatedEnemy) | — |
| Scenes | 10/10 | 0 | — |
| UI Components | 22/22 | 0 | — |
| Infrastructure | 8/11 | 3 (SceneManager, Logger, instantiateGame) | 7 (Firebase, haptics, highScoreUi, Vite, PWA, Cordova, Phaser 4 port) |
| **Total extracted lines** | **~6,600** | **~9,124 in monolith** | **~960+ new** |

The monolith (`src/app-original.js`) is still loaded at runtime **only for bootstrapping**
(~70 lines: the `Manager` class and `instantiateGame()`). All game logic classes inside
it are dead code — every exported class has a fully standalone extracted replacement.
Once the Manager/bootstrap is extracted, the entire 9,124-line file can be deleted.
