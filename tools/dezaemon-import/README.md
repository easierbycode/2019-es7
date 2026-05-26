# dezaemon-import

Imports a Sega Saturn **Dezaemon 2** (Athena, 1996) user-created shoot-em-up
from a backup-RAM `.sav` into this project's level-editor format
(`assets/game.json` + a Phaser sprite atlas).

For personal preservation of your *own* Dezaemon creations. The Dezaemon engine
sprites and fonts baked into a save are Athena's copyright.

## Status

| Stage | State |
|-------|-------|
| Saturn BUP container parse (de-interleave + directory) | **done** |
| Differential analysis tooling | **done** (`dev/diff-saves.js`) |
| Payload region decoders (sprite / palette / enemy / bullet / stage) | **not started** — blocked on format RE |
| game.json + atlas emit | not started |
| BGM | out of scope for v1 (drop in your own MP3) |

The container layout is reverse-engineered and validated against two real saves
(see `FORMAT.md`). The per-region decoders need **controlled-delta sample saves**
to bootstrap — see "Helping the RE" below.

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
dev/
  diff-saves.js          differential-analysis helper (not shipped in builds)
fixtures/                reference saves used by the tests
test/                    node:test unit tests  (npm test)
FORMAT.md                reverse-engineering notes
```

## Tests

```bash
cd tools/dezaemon-import && npm test
```
