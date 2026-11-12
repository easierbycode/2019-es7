"""Tiny chiptune synth used by generate.py. Everything is made from math:
no samples, no recordings. numpy only."""
import numpy as np

SR = 48000


def t_axis(dur):
    return np.arange(int(round(dur * SR))) / SR


def env_adsr(n, a=0.005, d=0.05, s=0.7, r=0.05, gate=None):
    """ADSR envelope of n samples. gate = seconds the key is held (default: all
    but the release)."""
    total = n / SR
    if gate is None:
        gate = max(total - r, 0.0)
    t = np.arange(n) / SR
    e = np.empty(n)
    e[:] = s
    if a > 0:
        m = t < a
        e[m] = t[m] / a
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / max(d, 1e-9)
    m = t >= gate
    if r > 0:
        e[m] = s * np.clip(1 - (t[m] - gate) / r, 0, 1)
    else:
        e[m] = 0
    return e


def phase_from_freq(freq, n):
    """freq: scalar or array of n. Returns phase in cycles."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.cumsum(f) / SR


def pulse(freq, n, duty=0.5):
    ph = phase_from_freq(freq, n) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def triangle(freq, n, steps=16):
    ph = phase_from_freq(freq, n) % 1.0
    tri = 4 * np.abs(ph - 0.5) - 1
    return np.round(tri * steps / 2) / (steps / 2)  # stepped like old sound chips


def saw(freq, n):
    ph = phase_from_freq(freq, n) % 1.0
    return 2 * ph - 1


def sine(freq, n):
    return np.sin(2 * np.pi * phase_from_freq(freq, n))


def noise(n, rng, period=1):
    """White noise, held for `period` samples (lower = brighter)."""
    k = int(np.ceil(n / period))
    v = rng.uniform(-1, 1, k)
    return np.repeat(v, period)[:n]


def lfsr_noise(n, freq=8000, short=False):
    """NES-style 15-bit LFSR noise clocked at freq."""
    steps = int(np.ceil(n * freq / SR)) + 1
    reg = 1
    out = np.empty(steps)
    tap = 6 if short else 1
    for i in range(steps):
        bit = (reg ^ (reg >> tap)) & 1
        reg = (reg >> 1) | (bit << 14)
        out[i] = 1.0 if reg & 1 else -1.0
    idx = (np.arange(n) * freq / SR).astype(int)
    return out[idx]


def onepole_lp(x, cutoff):
    """One-pole low-pass. cutoff scalar or array (Hz)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def onepole_hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def echo(x, delay=0.12, fb=0.35, mix=0.35, taps=6):
    d = int(delay * SR)
    out = np.concatenate([x, np.zeros(d * taps)])
    wet = np.zeros_like(out)
    g = 1.0
    for k in range(1, taps + 1):
        g *= fb
        wet[d * k:d * k + len(x)] += x * g
    return out * 1.0 + wet * mix / max(fb, 1e-9) * fb


def bitcrush(x, bits=6, hold=1):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    if hold > 1:
        y = np.repeat(y[::hold], hold)[:len(x)]
    return y


def normalize(x, peak=0.89):
    m = np.max(np.abs(x)) if len(x) else 0
    return x if m == 0 else x * (peak / m)


def fade(x, fin=0.002, fout=0.01):
    n = len(x)
    a = min(int(fin * SR), n)
    b = min(int(fout * SR), n)
    y = x.copy()
    if a:
        y[:a] *= np.linspace(0, 1, a)
    if b:
        y[-b:] *= np.linspace(1, 0, b)
    return y


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)
