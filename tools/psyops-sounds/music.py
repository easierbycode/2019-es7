"""Original chiptune loops. Chord progressions are written out per track; the
melodies are generated from a seeded motif (so each track always renders the
same) and kept on the track's scale. Notes that ring past the loop end wrap
round to its start, so each file loops without a seam."""
import numpy as np
from synth import SR, env_adsr, pulse, triangle, sine, lfsr_noise, midi_hz, normalize

SCALES = {
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "harmonic": [0, 2, 3, 5, 7, 8, 11],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
}

# step lengths in 16ths for one beat; 0 = rest of that length
CELLS = [[4], [2, 2], [3, 1], [1, 1, 2], [2, 1, 1], [1, 1, 1, 1], [-2, 2], [-4], [2, -2], [-1, 1, 2]]


class Track:
    def __init__(self, bpm, root, scale, prog, seed, bars_per_chord=1,
                 lead_duty=0.25, drums="drive", bass="eighths", arp=True,
                 lead_oct=0, density=(0.15, 0.25, 0.15, 0.15, 0.1, 0.1, 0.05, 0.02, 0.02, 0.01),
                 loop=True, swing=0.0, lead_vol=0.24):
        self.bpm, self.root, self.scale = bpm, root, SCALES[scale]
        self.prog, self.bpc = prog, bars_per_chord
        self.rng = np.random.default_rng(seed)
        self.lead_duty, self.drums, self.bass_style, self.arp = lead_duty, drums, bass, arp
        self.lead_oct, self.density, self.loop, self.swing = lead_oct, density, loop, swing
        self.lead_vol = lead_vol
        self.step = 60 / bpm / 4  # one 16th, seconds
        self.bars = len(prog) * bars_per_chord
        self.length = int(round(self.bars * 16 * self.step * SR))
        self.L = np.zeros(self.length)
        self.R = np.zeros(self.length)

    # --- pitch helpers -------------------------------------------------
    def deg_to_midi(self, deg, octave=0):
        o, d = divmod(deg, 7)
        return self.root + 12 * (o + octave) + self.scale[d]

    def chord_degs(self, bar):
        root = self.prog[bar // self.bpc]
        return [root, root + 2, root + 4]

    # --- mixing --------------------------------------------------------
    def put(self, x, start_s, pan=0.0, vol=1.0):
        s = int(round(start_s * SR))
        n = len(x)
        idx = np.arange(s, s + n)
        if self.loop:
            idx %= self.length
        else:
            keep = idx < self.length
            idx, x = idx[keep], x[keep]
        lg, rg = vol * np.sqrt((1 - pan) / 2) * np.sqrt(2), vol * np.sqrt((1 + pan) / 2) * np.sqrt(2)
        np.add.at(self.L, idx, x * lg)
        np.add.at(self.R, idx, x * rg)

    def note(self, midi, start_step, steps, kind, vol, pan=0.0, duty=0.5, vib=False):
        dur = steps * self.step
        n = int((dur + 0.06) * SR)
        f = midi_hz(midi)
        if vib and dur > 0.25:
            t = np.arange(n) / SR
            f = f * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1))
        if kind == "pulse":
            x = pulse(f, n, duty)
        elif kind == "tri":
            x = triangle(f, n)
        else:
            x = sine(f, n)
        x *= env_adsr(n, 0.004, 0.07, 0.65, 0.05, gate=max(dur * 0.92, 0.01))
        t0 = start_step * self.step
        if self.swing and start_step % 2 == 1:
            t0 += self.swing * self.step
        self.put(x, t0, pan, vol)

    # --- parts ---------------------------------------------------------
    def phrase_rhythm(self):
        cells = []
        for _ in range(8):  # 2 bars of beats
            cells.append(CELLS[self.rng.choice(len(CELLS), p=np.array(self.density) / sum(self.density))])
        return cells

    def melody(self):
        """AABA-style: phrase motifs over 2-bar spans."""
        span = 2
        nphr = self.bars // span
        motif_a, motif_b = self.phrase_rhythm(), self.phrase_rhythm()
        plan = []
        for i in range(nphr):
            sect = (i // 4) % 2  # 8 bars A, 8 bars B
            plan.append(motif_b if sect else motif_a)
        prev = 4 + 7  # degree, around the 5th above the root, octave up
        for p, cells in enumerate(plan):
            bar0 = p * span
            step = bar0 * 16
            # every 4th phrase: answer by holding the last note longer
            for bi, cell in enumerate(cells):
                beat_start = step + bi * 4
                pos = beat_start
                for j, ln in enumerate(cell):
                    if ln < 0:
                        pos += -ln
                        continue
                    bar = pos // 16
                    chord = [d + 7 for d in self.chord_degs(bar)]
                    on_beat = (pos % 4 == 0)
                    if on_beat:
                        # nearest chord tone (any octave) to prev, with a little leap
                        cands = [c + 7 * o for c in chord for o in (-1, 0, 1)]
                        cands = sorted(cands, key=lambda c: abs(c - prev) + self.rng.uniform(0, 2.5))
                        deg = cands[0]
                    else:
                        deg = prev + int(self.rng.choice([-2, -1, -1, 1, 1, 2]))
                    deg = int(np.clip(deg, 7, 7 + 11))
                    hold = ln
                    # end of a 2-bar phrase: stretch to the bar line
                    if bi == len(cells) - 1 and j == len(cell) - 1:
                        hold = (bar0 + span) * 16 - pos
                    self.note(self.deg_to_midi(deg, self.lead_oct), pos, hold, "pulse",
                              self.lead_vol, 0.0, self.lead_duty, vib=True)
                    # quiet echo of the lead, left
                    self.note(self.deg_to_midi(deg, self.lead_oct), pos + 3, hold, "pulse",
                              self.lead_vol * 0.28, -0.8, 0.5)
                    prev = deg
                    pos += ln

    def bassline(self):
        for bar in range(self.bars):
            r = self.chord_degs(bar)[0]
            b = self.deg_to_midi(r, -1)
            fifth = self.deg_to_midi(r + 4, -1)
            s = bar * 16
            if self.bass_style == "eighths":
                for k in range(8):
                    m = b + (12 if k in (3, 7) else 0)
                    self.note(m, s + 2 * k, 2, "tri", 0.42)
            elif self.bass_style == "walk":
                for k, m in enumerate([b, fifth, b + 12, fifth]):
                    self.note(m, s + 4 * k, 4, "tri", 0.42)
            elif self.bass_style == "funk":
                for st, ln, m in [(0, 3, b), (3, 1, b), (6, 2, b + 12), (8, 2, fifth), (11, 1, b), (12, 2, b + 10), (14, 2, b + 12)]:
                    self.note(m, s + st, ln, "tri", 0.45)
            elif self.bass_style == "half":
                self.note(b, s, 6, "tri", 0.48)
                self.note(b, s + 6, 2, "tri", 0.48)
                self.note(b - 12 if b - 12 > 28 else b, s + 8, 8, "tri", 0.48)
            elif self.bass_style == "pad":
                self.note(b, s, 16, "tri", 0.38)

    def arpeggio(self):
        for bar in range(self.bars):
            ch = self.chord_degs(bar)
            seq = [ch[0], ch[1], ch[2], ch[0] + 7]
            seq = seq + seq[::-1][1:3]
            for k in range(16):
                m = self.deg_to_midi(seq[k % len(seq)], 1)
                self.note(m, bar * 16 + k, 1, "pulse", 0.08, 0.6, 0.125)

    def drum(self, kind, step, vol=1.0):
        t0 = step * self.step
        if kind == "kick":
            n = int(0.16 * SR)
            f = 150 * (45 / 150) ** (np.arange(n) / n)
            x = sine(f, n) * np.exp(-np.arange(n) / SR / 0.06)
            self.put(x, t0, 0, 0.55 * vol)
        elif kind == "snare":
            n = int(0.16 * SR)
            x = lfsr_noise(n, 11000) * np.exp(-np.arange(n) / SR / 0.05) * 0.8
            x += sine(190, n) * np.exp(-np.arange(n) / SR / 0.03) * 0.6
            self.put(x, t0, 0.1, 0.32 * vol)
        elif kind == "hat":
            n = int(0.035 * SR)
            x = lfsr_noise(n, 30000, short=True) * np.exp(-np.arange(n) / SR / 0.01)
            self.put(x, t0, -0.3, 0.12 * vol)

    def beat(self):
        for bar in range(self.bars):
            s = bar * 16
            fill = (bar % 8 == 7)
            if self.drums == "drive":
                for k in (0, 6, 8):
                    self.drum("kick", s + k)
                for k in (4, 12):
                    self.drum("snare", s + k)
                for k in range(0, 16, 2):
                    self.drum("hat", s + k)
                if fill:
                    for k in (13, 14, 15):
                        self.drum("snare", s + k, 0.7)
            elif self.drums == "four":
                for k in (0, 4, 8, 12):
                    self.drum("kick", s + k)
                for k in (4, 12):
                    self.drum("snare", s + k)
                for k in range(16):
                    self.drum("hat", s + k, 0.7 if k % 2 else 1.0)
                if fill:
                    for k in (10, 12, 14, 15):
                        self.drum("snare", s + k, 0.8)
            elif self.drums == "half":
                self.drum("kick", s)
                self.drum("kick", s + 3, 0.7)
                self.drum("snare", s + 8)
                for k in range(0, 16, 4):
                    self.drum("hat", s + k)
            elif self.drums == "tick":
                for k in range(0, 16, 4):
                    self.drum("hat", s + k, 1.2)
                self.drum("kick", s)
            elif self.drums == "none":
                pass

    def render(self):
        self.melody()
        self.bassline()
        if self.arp:
            self.arpeggio()
        self.beat()
        st = np.stack([self.L, self.R], axis=1)
        return normalize(st, 0.89)


TRACKS = {
    # stage 1 boss / stage music
    "boss_bison_bgm": dict(bpm=156, root=50, scale="minor", prog=[0, 5, 6, 0, 3, 5, 6, 4] * 2 + [5, 6, 0, 0, 5, 3, 4, 4] * 2, seed=101, drums="drive", bass="eighths"),
    "boss_barlog_bgm": dict(bpm=138, root=52, scale="dorian", prog=[0, 3, 0, 6] * 4 + [3, 3, 0, 0, 5, 6, 0, 4] * 2, seed=202, drums="four", bass="funk", lead_duty=0.5, swing=0.25),
    "boss_sagat_bgm": dict(bpm=168, root=45, scale="phrygian", prog=[0, 1, 0, 6] * 4 + [5, 6, 0, 1, 5, 6, 4, 4] * 2, seed=303, drums="drive", bass="eighths", lead_duty=0.125, lead_oct=1),
    "boss_vega_bgm": dict(bpm=132, root=48, scale="minor", prog=[0, 5, 2, 6] * 4 + [3, 4, 0, 5, 3, 4, 6, 6] * 2, seed=404, drums="four", bass="walk", lead_duty=0.25, swing=0.33),
    "boss_fang_bgm": dict(bpm=176, root=54, scale="harmonic", prog=[0, 5, 3, 4] * 4 + [0, 0, 5, 5, 3, 1, 4, 4] * 2, seed=505, drums="drive", bass="eighths", lead_duty=0.25),
    "boss_goki_bgm": dict(bpm=120, root=47, scale="phrygian", prog=[0, 0, 1, 0] * 4 + [5, 1, 0, 6] * 4, seed=606, drums="half", bass="half", lead_duty=0.5),
    "adventure_bgm": dict(bpm=110, root=55, scale="minor", prog=[0, 5, 3, 4, 0, 5, 6, 4], seed=707, drums="none", bass="pad", arp=True, lead_vol=0.18,
                          density=(0.3, 0.3, 0.1, 0.05, 0.05, 0.0, 0.1, 0.05, 0.05, 0.0)),
    "bgm_continue": dict(bpm=120, root=57, scale="harmonic", prog=[0, 0, 5, 4, 0, 0, 1, 4], seed=808, drums="tick", bass="pad", arp=True, lead_vol=0.16,
                         density=(0.25, 0.25, 0.1, 0.05, 0.05, 0.0, 0.15, 0.1, 0.05, 0.0)),
}


def gameover_jingle():
    """Short descending sting, not a loop (bgm_gameover)."""
    t = Track(bpm=100, root=45, scale="minor", prog=[0, 0, 0, 0], seed=909, loop=False, arp=False, drums="none")
    t.length = int(4.4 * SR)
    t.L = np.zeros(t.length)
    t.R = np.zeros(t.length)
    seq = [(11, 0, 2), (10, 2, 2), (9, 4, 2), (8, 6, 2), (7, 8, 3), (5, 11, 3), (4, 14, 4), (0, 18, 14)]
    for deg, st, ln in seq:
        t.note(t.deg_to_midi(deg, 1), st, ln, "pulse", 0.3, 0, 0.5, vib=True)
        t.note(t.deg_to_midi(deg, 1), st + 1, ln, "pulse", 0.08, -0.8, 0.25)
    for deg, st, ln in [(0, 0, 8), (5, 8, 6), (3, 14, 4), (0, 18, 14)]:
        t.note(t.deg_to_midi(deg, -1), st, ln, "tri", 0.45)
    st = np.stack([t.L, t.R], axis=1)
    n = st.shape[0]
    st[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]
    return normalize(st, 0.89)
