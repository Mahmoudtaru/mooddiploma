"""Original score + sound effects for the WbS event film (fully synthesized, no samples).

Writes music.wav and sfx.wav (48 kHz stereo) into the given folder.
Grid: 117.65 BPM; downbeats on «لصحتك» (2.70 s) and «صحتك ليها مكان» (23.10 s).

    python3 audio-tools/score.py audio-src/
"""
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt
import soundfile as sf

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.51
BAR = BEAT * 4
S16 = BEAT / 4
D0 = 2.70  # first full-groove downbeat
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def buf():
    return np.zeros((N, 2))


def add(dst, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    j = min(N, i + len(sig))
    s0 = max(0, -i)
    dst[max(0, i):j] += gain * sig[s0:j - i]


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x, axis=0)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x, axis=0)


def env(n, a, d, sustain=0.0, rel=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (sustain + (1 - sustain) * np.exp(-t / d))
    if rel:
        e *= np.clip((n / SR - t) / rel, 0, 1)
    return e


# ------------------------------------------------------------------ instruments
def kick(vel=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 48 + 105 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.20) + 0.25 * np.sin(ph * 2) * np.exp(-t / 0.03)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.25
    return np.tanh(1.4 * (s + click)) * vel


def clap(vel=1.0):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1100, 3200)
    e = np.zeros(n)
    for k, o in enumerate([0, 0.011, 0.022]):
        e += (t >= o) * np.exp(-np.maximum(t - o, 0) / (0.006 if k < 2 else 0.11))
    return noise * e * 0.55 * vel


def hat(vel=1.0, dec=0.035):
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500) * np.exp(-t / dec) * 0.3 * vel


def shaker(vel=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.012) * np.exp(-t / 0.045)
    return bp(rng.standard_normal(n), 4500, 10000) * e * 0.22 * vel


def tick(hi=True, vel=1.0):  # the workday clock
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 2350 if hi else 1580
    s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.51 * t)) * np.exp(-t / 0.018)
    return s * 0.32 * vel


def bass(m, dur, vel=1.0):
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    e = np.minimum(1, t / 0.006) * (0.55 + 0.45 * np.exp(-t / 0.09)) * np.clip((dur + 0.08 - t) / 0.06, 0, 1)
    return np.tanh(1.6 * s * e) * 0.5 * vel


def keys(ms, dur, vel=1.0, bright=1.0):  # soft electric-piano pluck, stereo chorus
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in ms:
        f = mtof(m)
        for ch, det in ((0, -0.0025), (1, 0.0025)):
            s = np.zeros(n)
            for h in range(1, 7):
                a = (1 / h ** 1.6) * (bright if h > 2 else 1)
                s += a * np.sin(2 * np.pi * f * (1 + det) * h * t + h) * np.exp(-t / (0.9 / h ** 0.8))
            out[:, ch] += s
    e = np.minimum(1, t / 0.004) * np.clip((dur + 0.25 - t) / 0.25, 0, 1)
    return out * e[:, None] * 0.11 * vel


def pad(ms, dur, vel=1.0, bright=0.5):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in ms:
        f = mtof(m)
        for ch in (0, 1):
            for d in (-0.004, 0.0, 0.0045):
                s = np.zeros(n)
                for h in range(1, 9):
                    s += (bright ** (h - 1)) / h * np.sin(2 * np.pi * f * (1 + d + ch * 0.001) * h * t + rng.uniform(0, 6))
                out[:, ch] += s
    e = np.minimum(1, t / 0.35) * np.clip((dur + 0.6 - t) / 0.6, 0, 1)
    return out * e[:, None] * 0.018 * vel


def bell(m, vel=1.0, dec=0.7):  # marimba-ish lead
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / dec) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.08)
    return s * np.minimum(1, t / 0.003) * 0.17 * vel


def riser(dur, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = n // 24
    for k in range(24):  # stepped band sweep
        c = 400 * (14 ** (k / 23))
        part = bp(noise, c * 0.7, min(c * 1.4, 20000))
        out[k * seg:(k + 1) * seg] = part[k * seg:(k + 1) * seg]
    glide = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * p)) / SR) * 0.25
    return (out * 0.5 + glide) * p ** 2.2 * vel


def whoosh(dur, lo=300, hi=3000, vel=1.0, peak=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = max(1, n // 20)
    for k in range(20):
        q = k / 19
        c = lo * (hi / lo) ** (np.sin(np.pi * min(q / peak, 1) / 2) if q < peak else 1 - (q - peak) / (1 - peak) * 0.5)
        part = bp(noise, c * 0.6, min(c * 1.6, 20000))
        out[k * seg:(k + 1) * seg] = part[k * seg:(k + 1) * seg]
    e = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    return out * e * 0.5 * vel


def sub_boom(vel=1.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = 38 + 30 * np.exp(-t / 0.15)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45) * 0.6 * vel


def pop(vel=1.0, f0=520):  # soft food drop
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.8 * np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045) * 0.35 * vel


def reverb_ir(sec=1.8, damp=5000):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / (sec / 5.5))[:, None]
    ir = lp(ir, damp)
    ir[:int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0))


# ------------------------------------------------------------------ arrangement
CH = {  # bass root, key voicing, pad voicing
    'D': (38, [66, 69, 74], [50, 57, 62, 66]),
    'A': (45, [64, 69, 73], [45, 52, 57, 61]),
    'Bm': (47, [66, 71, 74], [47, 54, 59, 62]),
    'G': (43, [67, 71, 74], [43, 50, 55, 59]),
    'Em': (40, [67, 71, 76], [40, 47, 52, 55]),
    'F#m': (42, [66, 69, 73], [42, 49, 54, 57]),
}
PROG = ['D', 'A', 'Bm', 'G']


def build():
    drums, bassb, keyb, padb, lead, fx = buf(), buf(), buf(), buf(), buf(), buf()

    # ---- pre-roll: the workday clock (ticks on every half beat = the block steps)
    for k in range(1, 11):
        ts = D0 - k * (BEAT / 2)
        if ts >= 0.1:
            add(drums, tick(k % 2 == 0, 0.8 + 0.2 * (k % 2)), ts, pan=0.15 if k % 2 else -0.15)
    for k in range(5):  # low muted pulse under it
        ts = D0 - BAR + k * BEAT - BEAT
        if ts >= 0:
            add(drums, lp(kick(0.45), 400), ts)
    add(padb, pad(CH['Bm'][2], D0 + 0.2, 0.8, bright=0.25), 0.0)
    add(fx, riser(1.0, 0.55), D0 - 1.0)

    # ---- bars
    bars = []
    t = D0
    i = 0
    while t < 27.3:
        bars.append((i, t))
        t += BAR
        i += 1
    for i, t0 in bars:
        sec = 'groove'
        if 16.9 < t0 < 21.0:
            sec = 'soft'
        if 21.0 < t0 < 23.0:
            sec = 'build'
        half_bar = t0 > 27.1  # last bar: two beats, then the final hit on beat 3
        chord = PROG[i % 4]
        if sec == 'soft':
            chord = ['G', 'D', 'A', 'Bm'][(i - 7) % 4]
        if sec == 'build':
            chord = 'Em'
        root, kv, pv = CH[chord]
        if half_bar:
            # final resolution on beat 3 of the last bar: one confident hit and its natural tail
            te = t0 + 2 * BEAT
            add(drums, kick(1.0), te)
            add(drums, hp(rng.standard_normal(int(1.6 * SR)), 5000) * np.exp(-np.arange(int(1.6 * SR)) / SR / 0.5)[:] * 0.12, te)
            add(bassb, bass(26 + 12, 1.3, 1.0), te)
            add(keyb, keys([62, 66, 69, 74, 78], 1.3, 1.25), te)
            add(padb, pad(CH['D'][2] + [69], 1.2, 1.2, 0.45), te)
            add(lead, bell(81, 0.8, 1.0), te)
            add(fx, sub_boom(0.7), te)
        full = sec == 'groove'
        energy = 1.0 if t0 < 21 else 1.1
        for s in range(8 if half_bar else 16):
            ts = t0 + s * S16 + (0.012 if s % 2 else 0)  # light swing
            if sec in ('groove', 'build') and s in (0, 4, 8, 12):
                add(drums, kick(0.95 * energy), ts)
            if sec == 'soft' and s in (0, 8):
                add(drums, lp(kick(0.6), 900), ts)
            if full and s in (4, 12):
                add(drums, clap(0.85 * energy), ts, pan=0.05)
            if sec != 'build' or s < 8:
                if s % 4 == 2:
                    add(drums, hat(0.9 if full else 0.6), ts, pan=0.25)
                add(drums, shaker(0.6 + 0.4 * (s % 2)), ts, pan=-0.3)
            # bass
            if sec != 'soft' and s in (0, 3, 6, 8, 11, 14):
                note = root + (12 if s == 14 else (7 if s == 11 else 0))
                add(bassb, bass(note, S16 * (1.6 if s in (0, 8) else 1.1), 0.9 if s in (0, 8) else 0.7), ts)
            if sec == 'soft' and s in (0, 8):
                add(bassb, bass(root, S16 * 6, 0.55), ts)
            # chord plucks on the off-beats
            if sec != 'soft' and s in (2, 6, 10, 14):
                add(keyb, keys(kv, S16 * 1.4, 0.95 if s != 14 else 0.75), ts)
        if sec == 'soft':
            for b in range(4):
                add(keyb, keys(kv, BEAT * 0.9, 0.7, bright=0.6), t0 + b * BEAT + BEAT / 2)
        add(padb, pad(pv, BAR / 2 if half_bar else BAR, 1.0 if sec != 'soft' else 1.4, bright=0.35 if sec != 'groove' else 0.45), t0)
        if sec == 'build':
            for k in range(12):  # tightening snare roll into the drop
                ts = t0 + BAR / 2 + k * (BAR / 2) / 12
                add(drums, clap(0.25 + 0.5 * k / 11), ts)
            for k in range(1, 7):  # the clock returns with the blocks
                add(drums, tick(k % 2 == 0, 0.7), 21.315 + k * BEAT / 2)
            add(fx, riser(BAR * 0.9, 0.7), t0 + BAR * 0.1)

        # lead hook: only where the voice leaves room (between phrases and after the VO)
        if t0 >= 23.0:
            motif = [(0, 78), (1.5, 81), (2.5, 83), (3.0, 81), (6, 78), (7, 76), (8, 78), (11, 74), (12, 76), (14, 78)]
            if t0 > 27:
                motif = [(0, 81), (1.5, 83), (2.5, 85), (3.0, 83), (6, 81), (8, 78), (11, 78), (12, 81)]
            for st, m in motif:
                if half_bar and st >= 8:
                    continue
                vel = 0.55 if t0 < 25 else 1.0
                add(lead, bell(m, vel), t0 + st * S16, pan=0.2)

    # ---- sound design (few, at the turns)
    add(fx, whoosh(0.55, 800, 9000, 0.35, peak=0.85), 2.18)  # slot catching light
    shimmer = sum(bell(m, 0.5, 1.2) for m in (86, 90, 93))
    add(fx, shimmer, 2.66, pan=0.0)
    add(fx, whoosh(0.7, 200, 2500, 0.45), 3.45)  # slot opens into the frame
    wood = tick(False, 1.0) * 1.2
    add(fx, lp(wood, 3000), 8.2 - 0.02)  # 19 locks in place
    add(fx, whoosh(0.6, 150, 1500, 0.4), 12.3)  # camera pulls back
    for k in range(4):
        add(fx, pop(0.8, 480 + 60 * k), 15.36 + k * (BEAT / 2))  # food lands
    add(fx, whoosh(0.55, 500, 6000, 0.45), 16.05)  # pink wipe
    add(fx, whoosh(0.6, 180, 4000, 0.6, peak=0.4), 22.98)  # the day parts
    add(fx, sub_boom(0.9), 23.1)
    add(fx, sum(bell(m, 0.35, 1.4) for m in (81, 86)), 24.56)  # invitation lands
    return drums, bassb, keyb, padb, lead, fx


def main(out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    drums, bassb, keyb, padb, lead, fx = build()
    ir = reverb_ir()
    wet = lambda x, a: np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1) * a
    padb = hp(padb, 170)  # pads carry harmony, not sub
    music = (drums * 0.9 + wet(drums, 0.08) + bassb * 0.9 + keyb + wet(keyb, 0.35) + padb + wet(padb, 0.25)
             + lead * 0.8 + wet(lead, 0.4))
    music = hp(music, 28)
    sfx = fx + wet(fx, 0.3)
    # end the film cleanly: everything is silent by the last frame
    tail = np.clip((DUR - np.arange(N) / SR) / 0.35, 0, 1)[:, None]
    music *= tail
    sfx *= tail
    for name, x in (('music.wav', music), ('sfx.wav', sfx)):
        x = x / (np.abs(x).max() + 1e-9) * 0.7
        sf.write(out / name, x.astype(np.float32), SR, subtype='FLOAT')
    print('wrote', out / 'music.wav', out / 'sfx.wav')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'audio-src')
