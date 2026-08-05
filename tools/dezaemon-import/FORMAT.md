# Dezaemon 2 (Saturn) save format — reverse-engineering notes

Working notes for the importer. Split into **confirmed** (validated against real
saves and locked by unit tests) and **open** (needs more samples / disc RE).
Four reference saves live in `fixtures/`:

| File                    | Source                        | What it is                       |
|-------------------------|-------------------------------|----------------------------------|
| `ramsie.sav`            | hardware-style cart dump      | full user game "Ramsie"          |
| `mucha-kucha.sav`       | hardware-style cart dump      | full user game "MuchaKucha"      |
| `baseline-cart.bcr`     | OpenEmu / Mednafen battery    | empty (just-formatted) cart      |
| `baseline-internal.bkr` | OpenEmu / Mednafen battery    | 32KB internal RAM, `DEZA2___SYS` |

All multi-byte integers are **big-endian** (Saturn is a big-endian SH-2 machine).

## Container wrappings (confirmed — `lib/bup-source.js`)

Input files arrive in one of three wrappings, all normalized to raw BUP bytes:

- **gzip** — Mednafen / OpenEmu's `.bcr` battery saves. Standard gzip header
  (`1f 8b 08 …`) over the raw 512KB cart image.
- **0xFF-interleaved** — full hardware-style cart dumps. Every even byte is
  `0xFF` (the unused high half of each 16-bit backup-RAM word). 1MB physical,
  512KB+32KB logical. De-interleave by taking the odd bytes.
  (`lib/bup-deinterleave.js`)
- **raw** — internal-RAM dumps (`.bkr`, 32KB) and already-unwrapped cart images.

## Partitions and blocks (confirmed — `lib/bup-parse.js`)

A normalized image holds one or more **partitions**, each starting with a run
of the ASCII magic `"BackUpRam Format"`:

- Hardware-style cart dumps (1MB physical → 0x88000 logical): a 32KB
  internal-RAM mirror partition at `0x0`, then the 512KB cart partition at
  `0x8000`.
- Mednafen `.bcr`: the bare 512KB cart partition at `0x0`.
- Internal `.bkr`: the bare 32KB partition at `0x0`.

**Block size** is 512 bytes for 512KB partitions and 64 bytes for 32KB ones.
Block N lives at `partitionBase + N * blockSize`. Every allocated block begins
with a **4-byte tag**: `0x80000000` for a save's header block, `0x00000000`
for continuation blocks. (This resolves the old "block 3 at page+3*64 lands in
the magic zone" confusion — cart blocks are 512 bytes, and the `0x0000` words
formerly read as list gaps/terminators were continuation-block tags.)

## Directory entry == header block (confirmed)

| Off  | Size      | Field    | Ramsie         | Mucha          |
|------|-----------|----------|----------------|----------------|
| 0x00 | u32       | flag/tag | `0x80000000`   | `0x80000000`   |
| 0x04 | char[12]  | filename | `DEZA2____01`  | `DEZA2____01`  |
| 0x10 | char[10]  | comment  | `DEZA2 SGM`    | `MuchaKucha`   |
| 0x1A | u8        | language | 0 (JP)         | 5              |
| 0x1B | u24       | date     | 2007-12-25     | 1997-12-02     |
| 0x1E | u32       | datasize | 167,511        | 154,015        |
| 0x22 | …         | data stream (block list + payload)             |

`DEZA2____01` is slot 1 of Dezaemon 2's five save slots (`…01`–`…05`); the
user's game title lives inside the payload. `date` is minutes since
1980-01-01. Comments are Shift-JIS (the internal-RAM `DEZA2___SYS` record's
comment decodes to `ﾃﾞｻﾞ2_ｼｽﾃﾑ`, "Deza2 System").

## Data stream and block list (confirmed)

The save's data stream starts at header-block offset 0x22, fills the rest of
that block, and continues through the chained data blocks — skipping each
block's 4-byte tag. The stream contains, in order:

1. **Block list**: u16 block numbers, one per chained data block, terminated
   by `0x0000`. The list itself flows across block boundaries (Ramsie's 331
   entries occupy the rest of the header block plus the start of block 3).
2. **Payload**: exactly `datasize` bytes.

Ramsie: blocks 3..333, payload at logical `0x86BE`. Mucha: blocks 3..306,
payload at `0x8688`. Reassembly follows the chain, so fragmented saves (e.g.
multi-game carts) reassemble correctly. Validated end-to-end by the section
checksums below (`test/payload-table.test.js`).

## Payload: section table (confirmed — `lib/payload-table.js`)

A game payload is a 0x6C-byte table + **8 concatenated sections** consuming
`datasize` exactly:

| Off  | Type      | Field | Meaning                                          |
|------|-----------|-------|--------------------------------------------------|
| 0x00 | u32       | checksumTotal | sum of the 8 section checksums           |
| 0x04 | u32       | tableAddr | LWRAM staging address of this table (`0x002C8A84` in both saves); sections start at `tableAddr + 0x6C` |
| 0x08 | u32       | endAddr | last section's addr + size                     |
| 0x0C | u32×3 × 8 | per-section `(checksum, lwramAddr, size)` — checksum is a plain 32-bit byte-sum; addresses chain contiguously |

Section sizes (Ramsie / Mucha): 21065/19310, 25320/24188, 26710/17909,
21853/21877, **447/448**, **56643/53492**, 14676/15977, 689/706.

Observations:

- **sec4** (~447 B) is nearly byte-identical between two *different* games →
  engine-default data; a free known-plaintext anchor for compression RE.
- **sec5** is the largest (~53–57 KB) with the lowest entropy → likely CG
  (sprite) data.
- sec7 (~700 B) and sec4 are the small sections — likely settings/title-ish.

## Section compression (confirmed — `lib/decompress.js`)

Sections are individually compressed with **classic Okumura LZSS** (the
"COMPRESS POINT / 87%" screen during SAVE). Identified by brute-forcing the
variant space (`dev/scan-compression.js`) with a virgin-ring-read
discriminator and the sec4 known-plaintext anchor:

- flag byte governs the next 8 items, **LSB first**; bit 1 = literal (1 byte),
  bit 0 = match (2 bytes `b1 b2`)
- match: offset = `b1 | ((b2 & 0xF0) << 4)` (absolute ring index),
  length = `(b2 & 0x0F) + 3`
- ring buffer 4096 bytes, **zero-filled**, write position starts at `0xFEE`
  (encoders reference the zero prefill to emit leading zero-runs)
- stream ends when the compressed input is exhausted

**Proof:** all 16 fixture sections decode cleanly to *exact, game-invariant*
region sizes:

| Section | Decompressed size | Cross-game similarity | Reading |
|---------|------------------:|----------------------:|---------|
| sec0    | 65,536 | 30.8% | game data (64KB region) |
| sec1    | 65,536 | 17.7% | game data |
| sec2    | 65,536 |  4.3% | game data |
| sec3    | 65,536 | 18.6% | game data |
| sec4    |    512 | 98.0% | settings-ish (delta diffs land at 0x180–0x1FF) |
| sec5    | 396,640 | 82.6% | CG / sprite pages (first ~55% dense, then sparse) |
| sec6    | 101,472 | 69.0% | game data |
| sec7    |  5,828 | 99.8% | engine-constant table |

Locked by `test/decompress.test.js`.

## Open: decoded section semantics

With decompression solved, these regions still need field-level mapping:
title/text, sprite/CG table + palettes (BGR555), enemy table, bullet-pattern
table, stage script, background tilemap, BGM sequence + samples. (No ASCII or
Shift-JIS title text was found in the decompressed data — titles are likely
stored as graphics/tile indices.)

**Controlled-delta captures** localize fields to sections *without*
decompression (a one-field edit changes exactly that section's checksum).
Capture sequence (same game, one change, re-saved; diff with
`dev/diff-saves.js` or the harness report):

| Sample              | Change from previous          | Localizes        |
|---------------------|-------------------------------|------------------|
| `00_base`           | minimal game (1 sprite/enemy/stage) | baseline    |
| `01_sprite_1px`     | repaint one pixel of sprite 1 | CG section + bpp |
| `02_sprite_frame`   | add one animation frame       | frame stride / count |
| `03_palette`        | change one palette color      | palette table + BGR555 layout |
| `10_enemy_hp`       | enemy HP 1 → 99               | enemy struct + HP field |
| `11_enemy_sprite`   | re-point enemy to sprite 2    | enemy struct stride |
| `20_spawn_time`     | move first spawn 1 tick later | stage script time field |
| `21_spawn_x`        | move first spawn 8px in X     | stage script X field |
| `30_bullet_nway`    | 3-way → 5-way                 | bullet pattern way-count |
| `31_bullet_speed`   | change bullet speed           | bullet speed field |
| `40_bgm_note`       | change one note               | BGM sequence vs sample bank |
| `50_title`          | rename the in-game title      | title string location |

## Cross-check option (high-leverage)

Load a Mednafen savestate taken inside Dezaemon 2 into Ghidra (SH-2, with the
VGKintsugi Sega Saturn loader). Search for references to `0x002C8A84` /
`0x002C8AF0` — the function that builds the section table leads directly to
the per-section compress call, and its LOAD-path counterpart is the
decompressor. Tracing `BUP_Read` pointer arithmetic confirms the staging
layout without guesswork.
