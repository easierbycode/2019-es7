# dezaemon-import

Imports a Sega Saturn **Dezaemon 2** (Athena, 1996) user-created shoot-em-up
from a backup-RAM `.sav` into this project's level-editor format
(`assets/game.json` + a Phaser sprite atlas).

For personal preservation of your *own* Dezaemon creations. The Dezaemon engine
sprites and fonts baked into a save are Athena's copyright.

## Status

| Stage | State |
|-------|-------|
| Saturn BUP container parse (partitions + directory + block-accurate payload) | **done** — validated by section checksums |
| Payload section table (8 sections, byte-sum checksums) | **done** (`lib/payload-table.js`) |
| Differential analysis tooling | **done** (`dev/diff-saves.js`) |
| Section decompression (Okumura LZSS) | **done** (`lib/decompress.js`) — all 16 fixture sections decode to exact region sizes |
| Payload region decoders (CG pages, palettes, backgrounds, placement, sprite composition, BGM) | **done** (`lib/decode/`) |
| Enemy *attribute* fields inside the 18-byte record | **done** (`lib/decode/decode-enemy.js`) — traced from GAME.CMP's spawn routine: hp, score, speed, fire config, and the four change channels (speed/rotation/scale/direction) |
| game.json + atlas emit | **done** — lossless (see below) |
| BGM | decoded (`lib/decode/decode-song.js`); not converted to audio yet |

The container layout is fully reverse-engineered and validated against real
saves (see `FORMAT.md`). The record decode is engine-traced (the field map and
lookup tables come from the play engine's own reads — see FORMAT.md "Enemy
record"); the small remainders are marked in the decoder: byte 5's exact fire
direction mapping, the per-channel trigger modes, and the 8 movement-pattern
shapes (carried as data, not yet re-implemented shape-for-shape).

## What an import keeps

Nothing the save places is rationed away. For DAIOH's second save — nine
stages, 3,497 placements — the emitted game carries all of it:

| Axis | Kept |
|------|------|
| Stages | every stage the save defines, up to the runtime's ten (`stage0`..`stage9`) |
| Enemy types | one per **(stage, record)** pair placed — 340 for DAIOH. Enemy identity is per stage because the save redefines all sixty slots in every stage, and 56 of DAIOH's 60 differ between them |
| Enemy keys | `enemyA`..`enemyZ`, then `enemyAA`, `enemyAB`, … Grid cells are `"<letters><drop digit>"`, so the roster is not capped at 26 |
| Spawns | all of them. The grid is the save's own 20 placement columns, so no two spawns are ever binned onto one cell |
| Pacing | each wave records the scroll row it came from (`stage.waveRows`), so the gaps between waves — 1 to 177 rows — survive |
| Art | each enemy is drawn with the art **its own stage** defines; identical compositions share atlas frames |
| Bosses | every stage that places one gets its own 4-frame boss art and size class |
| Attributes | **decoded**: hp/score/speed/interval land on the fields the runtime reads, and the full record — fire type/count/rate/direction plus the speed-change, rotation, scale and direction channels — rides on `enemyData.*.dezaemon.behavior`. The raw 18 bytes still travel on `.attributes` for auditability |
| Backgrounds | each stage's 14x768 tile map is exported as `stage.background` (base64 grid) over `backgroundCells` (one atlas sprite per distinct tile); the runtime composes and scrolls it in place of the stock backdrop, on the scene's worldTime clock |

A Dezaemon save carries no player of its own, so the import supplies one: the
**Duke character** (`lib/player-art.js`) — the Firebase record
`characters/dukeNukem` that the live Evil Invaders build loads over its recipe
at boot, with the sparkler shot, the big projectile and the ten-frame shield.
None of those frames are in this project's `game_asset` atlas, so the pixels
are baked into that module (palette + RLE, ~22 KB) and travel with the import
rather than being referenced. The character record and its `duke_atlas` frames
are snapshotted from the database in `dev/duke/`; the rest come from
evil-invaders-phaser4's atlas. Regenerate after changing the source art:

```bash
node tools/dezaemon-import/dev/build-player-art.js         # rewrite lib/player-art.js
node tools/dezaemon-import/dev/build-player-art.js --check # verify it is current
```

"New Game" seeds the same character, so a blank game and an import fly the same
ship. `buildBlankGame()` returns only the record, so whatever calls it must add
`decodePlayerArt()` to the atlas as well — the level editor does that in
`startNewGame()`. `EVIL_INVADERS_PLAYER` is still exported for anywhere that
cannot ship pixels alongside a record: its frames are all already in
`game_asset`.

## Usage

```bash
# Inspect a save's directory metadata (works today):
node tools/dezaemon-import/index.js path/to/game.sav --json

# Full import (decoders pending):
node tools/dezaemon-import/index.js path/to/game.sav --out assets/imported/mygame/
```

Options: `--out <dir>`, `--slot <n>`, `--json`, `--skip-bgm`.

The input may be a raw cartridge dump (byte-interleaved with `0xFF`) or an
already-de-interleaved internal-RAM image — both are detected automatically.

## Helping the RE

The single biggest blocker is sample data. From a Saturn emulator that can
export backup RAM, save the *same* game repeatedly with *one* change between
saves, then diff:

```bash
node tools/dezaemon-import/dev/diff-saves.js base.sav after_one_change.sav --min-gap 64
```

The printed changed-byte ranges pinpoint the field you edited. See the capture
sequence table in `FORMAT.md`.

## Layout

```
index.js                CLI
lib/
  bup-deinterleave.js    strip 0xFF interleave from cartridge dumps
  bup-parse.js           Saturn BUP directory + payload extraction
  decompress.js          Okumura LZSS
  payload-table.js       8-section table + checksums
  decode/                section decoders (CG, stages, placement, sprites, BGM)
  map-to-game.js         decoded save -> level-editor game.json
  game-schema.js         executable schema for that game.json
dev/
  diff-saves.js          differential-analysis helper (not shipped in builds)
fixtures/                reference saves used by the tests
test/                    node:test unit tests  (npm test)
FORMAT.md                reverse-engineering notes
```

The `lib/` tree is copied into the cmg repo (`static/editor/dezaemon/lib/`) by
`deno task dezaemon:vendor` there, so the CLI, these tests, and both editors
run one pipeline.

## Tests

```bash
cd tools/dezaemon-import && npm test
```
