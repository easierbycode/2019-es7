#!/usr/bin/env python3
"""Rebuild every PsyOps.ai sound from scratch.

    python3 tools/generate.py            # writes ../assets/sounds/** and ../mapping.csv

Needs Python 3 with numpy, and ffmpeg built with libmp3lame and flite.
Nothing is downloaded: music and effects are synthesized here, voices come
from ffmpeg's built-in Flite speech engine. Change a line's text in VOICES and
run it again to re-record that line.
"""
import csv
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from synth import SR  # noqa: E402
import sfx  # noqa: E402
import music  # noqa: E402
import voices  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "assets", "sounds")

# key -> folder under assets/sounds (same layout as the game repo)
FOLDER = {
    "voice_titlecall": "scene_title",
    "se_decision": "ui", "se_correct": "ui", "se_cursor_sub": "ui", "se_cursor": "ui", "se_over": "ui",
    "adventure_bgm": "scene_adventure", "g_adbenture_voice0": "scene_adventure",
    "voice_congra": "scene_clear",
    "bgm_continue": "scene_continue", "bgm_gameover": "scene_continue", "voice_gameover": "scene_continue",
    **{f"voice_countdown{i}": "scene_continue" for i in range(10)},
    **{f"g_continue_yes_voice{i}": "scene_continue" for i in range(3)},
    **{f"g_continue_no_voice{i}": "scene_continue" for i in range(2)},
    **{f"g_stage_voice_{i}": "scene_game" for i in range(5)},
}

# The bosses keep their file keys (the code builds them from these names);
# only what they say changes.
BOSS_CHAR = {"bison": "boss1", "barlog": "boss2", "sagat": "boss3", "vega": "boss4", "goki": "boss5", "fang": "boss6"}

# key: (character, text, what plays it)
VOICES = {
    # announcer
    "voice_titlecall": ("announcer", "Psy Ops. A. I.", "title screen"),
    "voice_round0": ("announcer", "Level one.", "stage 1 intro"),
    "voice_round1": ("announcer", "Level two.", "stage 2 intro"),
    "voice_round2": ("announcer", "Level three.", "stage 3 intro"),
    "voice_round3": ("announcer", "Final level.", "stage 4+ intro"),
    "voice_fight": ("announcer", "Engage!", "after the level call"),
    "voice_ko": ("announcer", "Terminated!", "boss finished"),
    "voice_another_fighter": ("announcer", "Warning. Unknown signal detected.", "before the last stage"),
    "voice_gameover": ("announcer", "Game over.", "continue: no"),
    "voice_congra": ("announcer", "Congratulations!", "ending"),
    "voice_thankyou": ("announcer", "Thank you for playing!", "story scene, ending"),
    **{f"voice_countdown{i}": ("announcer", w + ".", "continue countdown")
       for i, w in enumerate(["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"])},
    # the A.I. president, narrator
    "g_adbenture_voice0": ("ai", "Heh heh heh. Update complete.", "story scene"),
    # the player, the little bot
    "g_stage_voice_0": ("bot", "Mission one. Free the feeds.", "stage 1 start"),
    "g_stage_voice_1": ("bot", "Next target. The chip factory.", "stage 2 start"),
    "g_stage_voice_2": ("bot", "Jam the airwaves.", "stage 3 start"),
    "g_stage_voice_3": ("bot", "Find the real president.", "stage 4 start"),
    "g_stage_voice_4": ("bot", "This ends now.", "stage 5 start"),
    "g_damage_voice": ("bot", "Ouch!", "player hit"),
    "g_powerup_voice": ("bot", "Upgrade!", "power-up"),
    "g_sp_voice": ("bot", "Mind blast!", "special attack"),
    "g_ca_voice": ("bot", "Overclock!", "charge attack (level editor)"),
    "g_continue_yes_voice0": ("bot", "Rebooting. I am not done yet!", "continue: yes"),
    "g_continue_yes_voice1": ("bot", "Again!", "continue: yes"),
    "g_continue_yes_voice2": ("bot", "Back online!", "continue: yes"),
    "g_continue_no_voice0": ("bot", "Shutting down.", "continue: no"),
    "g_continue_no_voice1": ("bot", "Take back... your mind.", "continue: no"),
    # bosses (stage order: bison 1, barlog 2, sagat 3, vega 4, fang 5, goki secret)
    "boss_bison_voice_add": ("bison", "Resistance is a bug.", "boss 1 appears"),
    "boss_bison_voice_punch": ("bison", "Delete!", "boss 1 punch"),
    "boss_bison_voice_faint": ("bison", "Rebooting...", "boss 1 feint"),
    "boss_bison_voice_faint_punch": ("bison", "Gotcha!", "boss 1 feint punch"),
    "boss_bison_voice_ko": ("bison", "System. Failure!", "boss 1 defeated"),
    "boss_barlog_voice_add": ("barlog", "You are out of bandwidth.", "boss 2 appears"),
    "boss_barlog_voice_projectile": ("barlog", "Ping!", "boss 2 shot"),
    "boss_barlog_voice_tama": ("barlog", "Ping!", "boss 2 shot (unused copy)"),
    "boss_barlog_voice_barcelona": ("barlog", "Lag spike!", "boss 2 dive"),
    "boss_barlog_voice_ko": ("barlog", "Connection. Lost!", "boss 2 defeated"),
    "boss_sagat_voice_add": ("sagat", "I see every click.", "boss 3 appears"),
    "boss_sagat_voice_projectile0": ("sagat", "Scan!", "boss 3 shot high"),
    "boss_sagat_voice_projectile1": ("sagat", "Track!", "boss 3 shot low"),
    "boss_sagat_voice_tama0": ("sagat", "Scan!", "boss 3 shot (unused copy)"),
    "boss_sagat_voice_tama1": ("sagat", "Track!", "boss 3 shot (unused copy)"),
    "boss_sagat_voice_kick": ("sagat", "Crash!", "boss 3 rush"),
    "boss_sagat_voice_ko": ("sagat", "Unit. Offline!", "boss 3 defeated"),
    "boss_vega_voice_add": ("vega", "Such an ugly little bot.", "boss 4 appears"),
    "boss_vega_voice_warp": ("vega", "Now you see me.", "boss 4 warp"),
    "boss_vega_voice_shoot": ("vega", "Spam attack!", "boss 4 shot"),
    "boss_vega_voice_crusher": ("vega", "Overwrite!", "boss 4 crusher"),
    "boss_vega_voice_projectile": ("vega", "Pop up!", "boss 4 projectile"),
    "boss_vega_voice_tama": ("vega", "Pop up!", "boss 4 projectile (unused copy)"),
    "boss_vega_voice_ko": ("vega", "Not. My. Face!", "boss 4 defeated"),
    "boss_fang_voice_add": ("fang", "Let me algorithm you.", "boss 5 appears"),
    "boss_fang_voice_beam0": ("fang", "Trending!", "boss 5 beam"),
    "boss_fang_voice_beam1": ("fang", "Viral!", "boss 5 beam"),
    "boss_fang_voice_projectile": ("fang", "Like and share!", "boss 5 projectile"),
    "boss_fang_voice_tama": ("fang", "Like and share!", "boss 5 projectile (unused copy)"),
    "boss_fang_voice_ko": ("fang", "Un. Subscribed!", "boss 5 defeated"),
    "boss_goki_voice_add": ("goki", "I am the update.", "secret boss appears"),
    "boss_goki_voice_projectile0": ("goki", "Patch!", "secret boss shot"),
    "boss_goki_voice_projectile1": ("goki", "Hot fix!", "secret boss shot"),
    "boss_goki_voice_tama0": ("goki", "Patch!", "secret boss shot (unused copy)"),
    "boss_goki_voice_tama1": ("goki", "Hot fix!", "secret boss shot (unused copy)"),
    "boss_goki_voice_ashura": ("goki", "Blink!", "secret boss teleport"),
    "boss_goki_voice_syungokusatu0": ("goki", "Final. Update.", "secret boss super, start"),
    "boss_goki_voice_syungokusatu1": ("goki", "Install complete.", "secret boss super, hit"),
    "boss_goki_voice_ko": ("goki", "Fatal. Error!", "secret boss defeated"),
}

MUSIC = {
    "boss_bison_bgm": ("Feed Override", "stage 1 and its boss"),
    "boss_barlog_bgm": ("Chip Factory", "stage 2 and its boss"),
    "boss_sagat_bgm": ("Airwave Siege", "stage 3 and its boss"),
    "boss_vega_bgm": ("Cloned Face", "stage 4 and its boss"),
    "boss_fang_bgm": ("Signal Core", "stage 5 and its boss"),
    "boss_goki_bgm": ("Root Access", "secret boss"),
    "adventure_bgm": ("Broadcast", "story scenes"),
    "bgm_continue": ("Last Chance", "continue screen"),
    "bgm_gameover": ("Signal Lost", "game over sting"),
}

SFX_USE = {
    "se_shoot": "player shot", "se_shoot_b": "player shot, type B", "se_explosion": "enemy destroyed",
    "se_damage": "hit", "se_guard": "shot blocked", "se_sp": "special attack charge",
    "se_sp_explosion": "special attack blast", "se_ca": "charge attack (level editor)",
    "se_ca_explosion": "charge attack blast (level editor)", "se_barrier_start": "shield on",
    "se_barrier_end": "shield off", "se_finish_akebono": "boss finish", "se_cursor": "menu move",
    "se_cursor_sub": "story text advance", "se_decision": "start / confirm", "se_correct": "accept",
    "se_over": "cancel",
}


# Loudness to aim for, per key (mean dB, measured from the files these replace,
# so the game's own volume settings still balance).
TARGET_DB = {
    "adventure_bgm": -9.5,
    "bgm_continue": -10.9,
    "bgm_gameover": -14.1,
    "boss_barlog_bgm": -15.4,
    "boss_barlog_voice_add": -14.7,
    "boss_barlog_voice_barcelona": -13.1,
    "boss_barlog_voice_ko": -18.2,
    "boss_barlog_voice_projectile": -13.3,
    "boss_barlog_voice_tama": -13.3,
    "boss_bison_bgm": -11.6,
    "boss_bison_voice_add": -14.4,
    "boss_bison_voice_faint": -13.2,
    "boss_bison_voice_faint_punch": -12.5,
    "boss_bison_voice_ko": -16.5,
    "boss_bison_voice_punch": -11.5,
    "boss_fang_bgm": -14.3,
    "boss_fang_voice_add": -14.8,
    "boss_fang_voice_beam0": -13.7,
    "boss_fang_voice_beam1": -10.6,
    "boss_fang_voice_ko": -17.4,
    "boss_fang_voice_projectile": -12.8,
    "boss_fang_voice_tama": -12.8,
    "boss_goki_bgm": -13.6,
    "boss_goki_voice_add": -15.8,
    "boss_goki_voice_ashura": -13.6,
    "boss_goki_voice_ko": -17.1,
    "boss_goki_voice_projectile0": -11.5,
    "boss_goki_voice_projectile1": -10.9,
    "boss_goki_voice_syungokusatu0": -12.9,
    "boss_goki_voice_syungokusatu1": -12.1,
    "boss_goki_voice_tama0": -11.5,
    "boss_goki_voice_tama1": -10.9,
    "boss_sagat_bgm": -12.2,
    "boss_sagat_voice_add": -19.9,
    "boss_sagat_voice_kick": -12.8,
    "boss_sagat_voice_ko": -16.3,
    "boss_sagat_voice_projectile0": -12.0,
    "boss_sagat_voice_projectile1": -11.5,
    "boss_sagat_voice_tama0": -12.0,
    "boss_sagat_voice_tama1": -11.5,
    "boss_vega_bgm": -13.4,
    "boss_vega_voice_add": -14.4,
    "boss_vega_voice_crusher": -15.6,
    "boss_vega_voice_ko": -15.6,
    "boss_vega_voice_projectile": -15.7,
    "boss_vega_voice_shoot": -15.0,
    "boss_vega_voice_tama": -15.7,
    "boss_vega_voice_warp": -13.4,
    "g_adbenture_voice0": -15.1,
    "g_ca_voice": -14.0,
    "g_continue_no_voice0": -14.3,
    "g_continue_no_voice1": -19.6,
    "g_continue_yes_voice0": -17.1,
    "g_continue_yes_voice1": -16.3,
    "g_continue_yes_voice2": -14.9,
    "g_damage_voice": -14.6,
    "g_powerup_voice": -17.9,
    "g_sp_voice": -14.0,
    "g_stage_voice_0": -15.9,
    "g_stage_voice_1": -16.0,
    "g_stage_voice_2": -12.8,
    "g_stage_voice_3": -14.5,
    "g_stage_voice_4": -15.1,
    "se_barrier_end": -18.1,
    "se_barrier_start": -17.6,
    "se_ca": -11.6,
    "se_ca_explosion": -20.0,
    "se_correct": -17.4,
    "se_cursor": -24.8,
    "se_cursor_sub": -29.0,
    "se_damage": -16.7,
    "se_decision": -19.0,
    "se_explosion": -17.3,
    "se_finish_akebono": -10.0,
    "se_guard": -18.0,
    "se_over": -24.9,
    "se_shoot": -26.0,
    "se_shoot_b": -19.0,
    "se_sp": -11.6,
    "se_sp_explosion": -20.0,
    "voice_another_fighter": -17.7,
    "voice_congra": -15.8,
    "voice_countdown0": -15.6,
    "voice_countdown1": -13.5,
    "voice_countdown2": -14.9,
    "voice_countdown3": -15.0,
    "voice_countdown4": -13.1,
    "voice_countdown5": -15.5,
    "voice_countdown6": -17.3,
    "voice_countdown7": -17.0,
    "voice_countdown8": -19.1,
    "voice_countdown9": -16.0,
    "voice_fight": -17.8,
    "voice_gameover": -13.9,
    "voice_ko": -16.5,
    "voice_round0": -14.6,
    "voice_round1": -15.8,
    "voice_round2": -14.8,
    "voice_round3": -15.2,
    "voice_thankyou": -18.3,
    "voice_titlecall": -15.2,
}


def match_loudness(key, x):
    target = TARGET_DB.get(key)
    if target is None:
        return x
    rms = np.sqrt(np.mean(x ** 2)) + 1e-12
    x = x * 10 ** ((target - 20 * np.log10(rms)) / 20)
    peak = np.max(np.abs(x))
    if peak > 0.97:
        # soft-limit up to 4 dB over, then scale the rest down
        k = min(peak / 0.97, 10 ** (4 / 20))
        x = np.tanh(x / 0.97 * 1.0) * 0.97 if k > 1 else x
        x = x / max(np.max(np.abs(x)) / 0.97, 1.0)
    return x


BOSS_NAMES = {"bison": "M. Bison", "barlog": "Balrog", "sagat": "Sagat", "vega": "Vega", "goki": "Akuma (Gouki)", "fang": "F.A.N.G"}


def old_sound(key):
    """What the replaced file was, judged from its name and where it plays."""
    if key.startswith("boss_"):
        name = BOSS_NAMES[key.split("_")[1]]
        if key.endswith("_bgm"):
            return f"Street Fighter music for {name} (Capcom)"
        return f"{name} voice clip from Street Fighter (Capcom)"
    if key.startswith("voice_"):
        return "fight announcer voice from the original Capcom game"
    if key.startswith("g_"):
        return "G's voice from the original Capcom game"
    if key.startswith("se_"):
        return "sound effect from the original Capcom game"
    return "music from the original Capcom game"


def path_for(key):
    folder = FOLDER.get(key, "")
    return os.path.join(folder, key + ".mp3") if folder else key + ".mp3"


def write_mp3(key, x, stereo=False, kbps=None):
    rel = path_for(key)
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    x = np.clip(match_loudness(key, x), -1, 1)
    pcm = (x * 32767).astype("<i2").tobytes()
    ch = 2 if stereo else 1
    kbps = kbps or (128 if stereo else 64)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", f"{kbps}k", "-map_metadata", "-1", dst],
                   input=pcm, check=True)
    return rel, (len(x) / SR)


def main():
    rows = []
    for key, (title, use) in MUSIC.items():
        if key == "bgm_gameover":
            x = music.gameover_jingle()
        else:
            x = music.Track(**music.TRACKS[key]).render()
        rel, d = write_mp3(key, x, stereo=True)
        rows.append((key, rel, "music", f'original chiptune "{title}"', "", use, d))
        print("music", key, round(d, 1))
    for key, fn in sfx.ALL.items():
        rel, d = write_mp3(key, fn())
        rows.append((key, rel, "sfx", "synthesized effect", "", SFX_USE[key], d))
    print("sfx done")
    for key, (who, text, use) in VOICES.items():
        char = BOSS_CHAR.get(who, who)
        rel, d = write_mp3(key, voices.line(text, char))
        rows.append((key, rel, "voice", f"{who} voice", text, use, d))
    print("voices done")
    with open(os.path.join(os.path.dirname(HERE), "mapping.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["key", "file (old and new, same path under assets/sounds)", "kind", "old sound (judged from name)",
                    "new sound", "new line", "plays on", "new length s"])
        for r in sorted(rows, key=lambda r: r[1]):
            w.writerow([r[0], r[1], r[2], old_sound(r[0])] + list(r[3:6]) + [f"{r[6]:.2f}"])
    print(len(rows), "files")


if __name__ == "__main__":
    main()
