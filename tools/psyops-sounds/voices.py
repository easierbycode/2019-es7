"""Voice lines: speech from CMU Flite (built into ffmpeg's flite filter; Flite
and its US voices kal16, slt, rms and awb are under CMU's BSD-style license,
which allows commercial use), then run through robot effects so each
character has its own sound."""
import os
import subprocess
import tempfile
import numpy as np
from synth import SR, sine, bitcrush, echo, normalize, fade


def speak(text, voice):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(text)
        path = f.name
    try:
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
             f"flite=textfile={path}:voice={voice}",
             "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"],
            check=True, capture_output=True).stdout
    finally:
        os.unlink(path)
    x = np.frombuffer(raw, dtype="<i2").astype(float) / 32768
    # trim silence at both ends
    idx = np.nonzero(np.abs(x) > 0.01)[0]
    if len(idx):
        x = x[max(idx[0] - 200, 0):idx[-1] + 2000]
    return x


def repitch(x, factor):
    """factor > 1: higher and faster; < 1: lower and slower."""
    n = int(len(x) / factor)
    return np.interp(np.arange(n) * factor, np.arange(len(x)), x)


def ring(x, hz, mix):
    return x * (1 - mix) + x * sine(hz, len(x)) * mix


def chorus(x, cents=12, delay=0.012):
    d = int(delay * SR)
    y = repitch(x, 2 ** (cents / 1200))
    out = np.copy(x)
    k = min(len(y), len(x) - d)
    out[d:d + k] += 0.6 * y[:k]
    return out


def drive(x, amt=3.0):
    return np.tanh(x * amt) / np.tanh(amt)


# Each character: Flite voice and the chain applied after it.
CHARACTERS = {
    # system announcer: deep, slow, a little echo
    "announcer": dict(voice="rms", pitch=0.86, crush=10, ring=None, echo=(0.16, 0.3, 0.35), drive=1.5),
    # the A.I. president who narrates the story
    "ai": dict(voice="kal16", pitch=0.93, crush=None, ring=(55, 0.45), chorus=True, echo=(0.09, 0.25, 0.25)),
    # the player: the little bot that said no
    "bot": dict(voice="slt", pitch=1.22, crush=7, hold=2, ring=(95, 0.25)),
    # bosses, one sound each
    "boss1": dict(voice="awb", pitch=0.80, ring=(38, 0.35), drive=3.0),
    "boss2": dict(voice="rms", pitch=0.97, ring=(70, 0.5), crush=8),
    "boss3": dict(voice="kal16", pitch=0.74, ring=None, echo=(0.2, 0.35, 0.4), drive=2.0),
    "boss4": dict(voice="slt", pitch=0.88, ring=(140, 0.4), chorus=True),
    "boss5": dict(voice="awb", pitch=0.68, ring=(30, 0.6), echo=(0.24, 0.45, 0.5), drive=2.5),
    "boss6": dict(voice="kal16", pitch=1.10, crush=5, hold=3, ring=(110, 0.3)),
}


def line(text, character, extra_pitch=1.0):
    c = CHARACTERS[character]
    x = speak(text, c["voice"])
    x = repitch(x, c["pitch"] * extra_pitch)
    if c.get("ring"):
        x = ring(x, *c["ring"])
    if c.get("chorus"):
        x = chorus(x)
    if c.get("drive"):
        x = drive(normalize(x), c["drive"])
    if c.get("crush"):
        x = bitcrush(normalize(x), c["crush"], c.get("hold", 1))
    if c.get("echo"):
        d, fb, mix = c["echo"]
        x = echo(x, d, fb, mix, taps=4)
    return fade(normalize(x, 0.85), fout=0.04)
