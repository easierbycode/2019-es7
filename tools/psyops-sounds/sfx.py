"""Sound effects, each built from oscillators and noise. Returns mono float
arrays at synth.SR."""
import numpy as np
from synth import (SR, env_adsr, pulse, triangle, sine, saw, lfsr_noise, noise,
                   onepole_lp, onepole_hp, echo, normalize, fade, bitcrush)


def _n(d):
    return int(round(d * SR))


def _exp_sweep(f0, f1, n):
    return f0 * (f1 / f0) ** (np.arange(n) / max(n - 1, 1))


def _decay(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def shoot():  # player shot: short falling pulse blip
    n = _n(0.16)
    f = _exp_sweep(1800, 420, n)
    x = pulse(f, n, 0.25) * _decay(n, 0.05)
    return fade(x)


def shoot_b():  # heavier shot
    n = _n(0.32)
    f = _exp_sweep(900, 140, n)
    x = 0.7 * pulse(f, n, 0.5) + 0.4 * lfsr_noise(n, 12000)
    x *= _decay(n, 0.09)
    return fade(x)


def explosion(dur=1.3, bright=6000, tau=0.32, seed=1):
    n = _n(dur)
    x = lfsr_noise(n, bright)
    cut = _exp_sweep(bright, 180, n)
    x = onepole_lp(x, cut)
    thump = sine(_exp_sweep(120, 35, n), n) * _decay(n, 0.12)
    x = (x * 1.6 + thump) * _decay(n, tau)
    return fade(normalize(x), fout=0.15)


def damage():  # player/boss hit: crunchy zap
    n = _n(0.45)
    f = _exp_sweep(600, 90, n)
    x = 0.6 * pulse(f, n, 0.125) + 0.6 * bitcrush(lfsr_noise(n, 4000, short=True), 3)
    x *= _decay(n, 0.12)
    return fade(x, fout=0.05)


def guard():  # shot blocked: metallic ping
    n = _n(0.7)
    x = sum(sine(f, n) * a for f, a in [(1320, 1), (1987, 0.6), (2803, 0.4), (3570, 0.25)])
    x *= _decay(n, 0.13)
    x[:_n(0.01)] += lfsr_noise(_n(0.01), 20000) * 0.8
    return fade(normalize(x), fout=0.1)


def charge(dur=1.9, f0=110, f1=1760):  # special / charge: rising sweep with vibrato
    n = _n(dur)
    t = np.arange(n) / SR
    f = _exp_sweep(f0, f1, n) * (1 + 0.03 * np.sin(2 * np.pi * 14 * t))
    x = 0.6 * pulse(f, n, 0.5) + 0.4 * pulse(f * 1.5, n, 0.25)
    x *= np.minimum(t / 0.05, 1) * (0.4 + 0.6 * t / dur)
    x[-_n(0.08):] *= np.linspace(1, 0, _n(0.08))
    return x


def big_boom(dur=2.3):  # special explosion
    a = explosion(dur, bright=9000, tau=0.6)
    n = len(a)
    sub = sine(_exp_sweep(80, 28, n), n) * _decay(n, 0.5)
    crackle = bitcrush(lfsr_noise(n, 2500, short=True), 2) * _decay(n, 0.35) * 0.3
    return fade(normalize(a + 0.7 * sub + crackle), fout=0.3)


def barrier(rising=True):  # shield up/down shimmer
    n = _n(2.1)
    t = np.arange(n) / SR
    notes = [72, 76, 79, 84, 88, 91] if rising else [91, 88, 84, 79, 76, 72]
    x = np.zeros(n)
    step = _n(0.07)
    for i in range(24):
        m = notes[i % len(notes)] + 12 * (i // 12 if rising else -(i // 12))
        s = i * step
        if s >= n:
            break
        k = min(_n(0.5), n - s)
        f = 440 * 2 ** ((m - 69) / 12)
        x[s:s + k] += pulse(f, k, 0.125) * _decay(k, 0.12) * 0.35
    x += 0.25 * sine(_exp_sweep(220, 880, n) if rising else _exp_sweep(880, 220, n), n) * np.sin(np.pi * t / t[-1])
    x = np.concatenate([x, np.zeros(_n(0.3))])
    x = echo(x, 0.09, 0.4, 0.4)[:n]
    return fade(normalize(x), fout=0.25)


def finish():  # boss finished: freeze hit, long boom, ringing tail
    hit_n = _n(0.25)
    hit = 0.8 * bitcrush(lfsr_noise(hit_n, 16000), 4) * _decay(hit_n, 0.06)
    hit += sine(_exp_sweep(1600, 200, hit_n), hit_n) * _decay(hit_n, 0.08)
    silence = np.zeros(_n(0.35))
    boom = big_boom(3.2)
    n = len(boom)
    ring = sum(sine(f, n) * a for f, a in [(220, 0.5), (330, 0.35), (440, 0.25)]) * _decay(n, 1.1) * 0.25
    x = np.concatenate([hit, silence, boom + ring])
    x = echo(x, 0.21, 0.35, 0.5)[:_n(5.4)]
    return fade(normalize(x), fout=0.8)


def cursor():  # menu move: two quick ticks
    n = _n(0.09)
    a = pulse(1568, n, 0.5) * _decay(n, 0.025)
    b = pulse(2093, n, 0.5) * _decay(n, 0.025)
    return fade(np.concatenate([a, b * 0.8, np.zeros(_n(0.05))]))


def cursor_sub():  # text advance: soft blip
    n = _n(0.12)
    x = triangle(1046.5, n) * _decay(n, 0.04)
    return fade(np.concatenate([x, np.zeros(_n(0.05))]))


def _arp(notes, step=0.07, hold=0.35, duty=0.25, tail=0.4):
    step_n = _n(step)
    total = step_n * len(notes) + _n(hold + tail)
    x = np.zeros(total)
    for i, m in enumerate(notes):
        k = _n(hold) if i < len(notes) - 1 else _n(hold + tail)
        f = 440 * 2 ** ((m - 69) / 12)
        s = i * step_n
        x[s:s + k] += pulse(f, k, duty) * env_adsr(k, 0.002, 0.05, 0.5, 0.1) * 0.5
    return x


def decision():  # start / confirm: bright rising arpeggio with echo
    x = _arp([72, 76, 79, 84, 88], 0.06, 0.25, 0.5, 0.5)
    x = echo(x, 0.11, 0.35, 0.4)
    return fade(normalize(x)[:_n(1.4)], fout=0.2)


def correct():  # accepted: two-note chime
    x = _arp([79, 91], 0.12, 0.6, 0.125, 0.6)
    y = np.concatenate([np.zeros(_n(0.12)), _arp([86], 0.1, 0.6, 0.5, 0.6)])[:len(x)]
    x[:len(y)] += 0.4 * y
    return fade(normalize(x), fout=0.2)


def over():  # cancel / no: low buzz
    n = _n(0.35)
    f = _exp_sweep(196, 150, n)
    x = pulse(f, n, 0.5) * env_adsr(n, 0.003, 0.05, 0.6, 0.12)
    return fade(x)


ALL = {
    "se_shoot": shoot,
    "se_shoot_b": shoot_b,
    "se_explosion": lambda: explosion(1.3),
    "se_damage": damage,
    "se_guard": guard,
    "se_sp": lambda: charge(1.9, 110, 1760),
    "se_sp_explosion": big_boom,
    "se_ca": lambda: charge(1.8, 220, 2637),
    "se_ca_explosion": lambda: big_boom(2.0),
    "se_barrier_start": lambda: barrier(True),
    "se_barrier_end": lambda: barrier(False),
    "se_finish_akebono": finish,
    "se_cursor": cursor,
    "se_cursor_sub": cursor_sub,
    "se_decision": decision,
    "se_correct": correct,
    "se_over": over,
}
