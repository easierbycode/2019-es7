# Dezaemon 2 (Saturn) save format — reverse-engineering notes

Working notes for the importer. Split into **confirmed** (validated against real
saves) and **open** (needs more samples). Four reference saves live in
`fixtures/`:

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
  (`1f 8b 08 …`) over the raw 512KB cart image. The "COMPRESS POINT / 87%"
  screen Dezaemon 2 shows during SAVE is just deflate running on the user data.
- **0xFF-interleaved** — full hardware-style cart dumps. Every even byte is
  `0xFF` (the unused high half of each 16-bit backup-RAM word). 1MB physical,
  512KB logical. De-interleave by taking the odd bytes. (`lib/bup-deinterleave.js`)
- **raw** — internal-RAM dumps (`.bkr`, 32KB) and already-unwrapped cart images.

After normalization, the BUP image starts with the ASCII magic
`"BackUpRam Format"` repeated some number of times. Internal RAM has 4 copies
(64 bytes); cart dumps have varying amounts (32 copies / 512 bytes on a
Mednafen-formatted cart, plus a second magic block at logical `0x8000` on the
hardware-style Ramsie / Mucha dumps).

## Targets: where each save type lives (confirmed)

Dezaemon 2 splits its data across two backup memory targets:

- **Internal RAM** holds `DEZA2___SYS` — the system/settings record (17 bytes).
  Its Shift-JIS comment decodes to `デザ2_ｼｽﾃﾑ` ("Deza2 System"). This is what
  gets written automatically on save without prompting.
- **External cart** holds user game projects as `DEZA2____01` (and presumably
  `_02`, `_03` …). Cart writes require an extra confirm step in the save flow.
  An empty just-formatted cart has no directory entries at all.

## Directory entry (confirmed — `lib/bup-parse.js`)

Single entry per save at logical `0x8400`. Field boundaries were pinned by
diffing the two saves byte-for-byte:

| Off  | Size      | Field    | Ramsie         | Mucha          |
|------|-----------|----------|----------------|----------------|
| 0x00 | u32       | flag     | `0x80000000`   | `0x80000000`   |
| 0x04 | char[12]  | filename | `DEZA2____01`  | `DEZA2____01`  |
| 0x10 | char[10]  | comment  | `DEZA2 SGM`    | `MuchaKucha`   |
| 0x1A | u8        | language | 0 (JP)         | 5              |
| 0x1B | u24       | date     | 2007-12-25     | 1997-12-02     |
| 0x1E | u32       | datasize | 167,511        | 154,015        |
| 0x22 | u16[]     | blocks   | 3,4,5,… (0-term) | same         |

The filename `DEZA2____01` is the same in both saves — it's Dezaemon 2's fixed
slot name, not the user's game title. The user's title lives **inside** the
payload (see open questions). `date` is 3 bytes here; a 4-byte date would shove
`datasize` one byte over and produce impossible values.

## Block allocation list (partially understood)

Starts at `0x22` as u16 BE values `0003 0004 0005 …`, mostly sequential, with
`0x0000` words appearing as gaps (e.g. block numbers `0xF0`,`0xF1` are skipped)
and a trailing value after the apparent terminator. The parser currently stops
at the first `0x0000`. The list is **identical** between the two games
(`0x8422`–`0x8685` does not differ), so it encodes a fixed cartridge layout, not
per-game data. Block→offset math is **not yet solved** (block 3 at the naive
`page+3*64` lands in the magic zone), so payload reassembly does not use it yet.

## Payload (provisional)

`lib/bup-parse.js extractPayload()` returns a **contiguous** `datasize`-byte
slice starting just past the block list. This works because the Dezaemon data is
stored as one essentially-contiguous run. Diffing the two games:

```
     start        end      len
0x00008410 0x00008421       18    ← directory metadata (comment/date/size)
0x00008686 0x0003abc2   206141    ← main payload (sprites/stages/enemies/…)
0x0003ac04 0x0003d396    10131    ← tail payload
```

Everything outside these ranges is identical → fixed structure or empty cart.
Payload begins at ~`0x8686`; the region `0x8604`–`0x8685` is also game-invariant
(likely a fixed payload header).

## Open questions — need controlled-delta samples

Two *different* games differ in ~99% of payload bytes, which can't localize
individual fields. To map the payload we need **same game, one change, re-saved**
pairs. Use a Saturn emulator (Mednafen / SSF / Yabause) that can export backup
RAM, then `node dev/diff-saves.js a.sav b.sav` to see exactly which bytes moved.

Suggested capture sequence (each builds on the previous):

| Sample              | Change from previous          | Localizes        |
|---------------------|-------------------------------|------------------|
| `00_base`           | minimal game (1 sprite/enemy/stage) | baseline    |
| `01_sprite_1px`     | repaint one pixel of sprite 1 | sprite pixel data + bpp |
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

Regions still to find: title/text, sprite/CG table, palette table, enemy table,
bullet-pattern table, stage script, background tilemap, BGM sequence + samples.

## Cross-check option (high-leverage)

Load the Dezaemon 2 disc into Ghidra (SH-2). The save load path calls the BIOS
`BUP_Read`; tracing pointer arithmetic on the returned payload buffer confirms
every offset above without guesswork.
