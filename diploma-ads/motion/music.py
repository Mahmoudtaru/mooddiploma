"""Synthesized music beds (no downloads). music(style, T, drop) -> stereo float array @48k.
A: dark pulse that builds to a drop at `drop` (glass shatter), then a warm groove.
B: punchy 124 BPM groove from the start.
C: light 96 BPM plucks + soft beat."""
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
rng = np.random.default_rng(3)
NOTE = {'A': 57, 'B': 59, 'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67}


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, f, order=2):
    b, a = butter(order, min(f, SR / 2 - 100) / (SR / 2))
    return lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), 'high')
    return lfilter(b, a, x)


def env(n, a=.005, d=1.0):
    e = np.exp(-np.arange(n) / SR / max(d, 1e-3))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    j = min(len(buf), i + len(sig))
    buf[max(i, 0):j] += sig[max(0, -i):j - i] * g


def saw(f, n, detune=(0, -.08, .08)):
    tt = np.arange(n) / SR
    return sum(2 * ((tt * f * 2 ** (d / 12)) % 1) - 1 for d in detune) / len(detune)


def kick(d=.32):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 45 + 95 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .12)


def snare(d=.18):
    n = int(d * SR)
    return lp(hp(rng.standard_normal(n), 900), 7000) * env(n, .001, .05)


def hat(d=.05):
    n = int(d * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, .001, .015)


def pluck(f, d=.45, bright=6000):
    n = int(d * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt) + .15 * np.sin(6 * np.pi * f * tt)
    return lp(s, bright) * env(n, .003, .16)


def pad(chord, n, cutoff=1800):
    s = sum(saw(hz(m), n) for m in chord) / len(chord)
    s = lp(s, cutoff, 2)
    a = int(.4 * SR)
    e = np.ones(n); e[:a] = np.linspace(0, 1, a); e[-a:] = np.linspace(1, 0, a)
    return s * e


PROG = {  # chord roots/tones (midi)
    'A': [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],   # Am F C G
    'B': [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]],   # Dm Bb C Am
    'C': [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],   # C Am F G
}


def music(style, T, drop=None):
    bpm = {'A': 110, 'B': 124, 'C': 96}[style]
    beat = 60 / bpm
    bar = beat * 4
    n = int((T + 1) * SR)
    L = np.zeros(n); R = np.zeros(n)
    prog = PROG[style]
    # align bars so a downbeat lands on the drop
    off = (drop % bar) if drop else 0.0
    t0 = off - bar * np.ceil(off / bar)
    bars = []
    t = t0
    while t < T + bar:
        bars.append(t); t += bar
    for bi, tb in enumerate(bars):
        ch = prog[(bi // 2) % 4] if style != 'B' else prog[bi % 4]
        full = drop is None or tb >= drop - 1e-6
        pre = not full
        # pad
        cutoff = 900 if pre else (2600 if style != 'C' else 2000)
        p = pad([m - 12 for m in ch] + [ch[0]], int(bar * SR), cutoff)
        g = .10 if pre else .085
        place(L, p, tb, g); place(R, np.roll(p, 240), tb, g)
        for k in range(4):
            tk = tb + k * beat
            if tk < 0 or tk > T - .4:
                continue
            if style == 'A' and pre:
                # heartbeat pulse + low tick, building
                build = 1 if tk > drop - 2 * bar else .6
                place(L, kick(.25), tk, .32 * build); place(R, kick(.25), tk, .32 * build)
                continue
            place(L, kick(), tk, .42); place(R, kick(), tk, .42)
            if k in (1, 3):
                s = snare(); place(L, s, tk, .14); place(R, s, tk + .004, .14)
            for h in (.5,) if style != 'B' else (.25, .5, .75):
                place(L, hat(), tk + h * beat, .05); place(R, hat(), tk + h * beat + .003, .05)
            # bass: root on 8ths
            for e8 in (0, .5):
                nb = int(beat * .48 * SR); tt = np.arange(nb) / SR
                b = np.sin(2 * np.pi * hz(ch[0] - 24) * tt) * env(nb, .004, .25)
                place(L, b, tk + e8 * beat, .22); place(R, b, tk + e8 * beat, .22)
        # arp / plucks after drop (C: always)
        if full or style == 'C':
            steps = 8 if style == 'C' else 16
            tones = ch + [ch[0] + 12, ch[1] + 12]
            for s_ in range(steps):
                ts = tb + s_ * bar / steps
                if ts < 0 or ts > T - .3:
                    continue
                m = tones[(s_ * (3 if style == 'B' else 2)) % len(tones)] + 12
                pl = pluck(hz(m), .4 if style != 'C' else .6, 5000 if style != 'C' else 3500)
                pan = .5 + .35 * np.sin(s_)
                gg = .055 if style != 'C' else .07
                place(L, pl, ts, gg * (1.2 - pan)); place(R, pl, ts, gg * (.2 + pan))
    if drop:
        # riser into the drop + impact
        rd = 1.6
        nr = int(rd * SR); tt = np.arange(nr) / SR
        noise = rng.standard_normal(nr)
        rise = np.concatenate([lp(noise[i:i + 4800], 300 + 9000 * (i / nr) ** 2) for i in range(0, nr, 4800)])[:nr]
        rise *= np.linspace(0, 1, nr) ** 2
        sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / rd) ** 2) / SR) * np.linspace(0, 1, nr) ** 3
        place(L, rise * .12 + sweep * .05, drop - rd); place(R, rise * .12 + sweep * .05, drop - rd)
        ni = int(1.8 * SR); ti = np.arange(ni) / SR
        boom = np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-ti * 8)) / SR) * env(ni, .001, .6)
        crash = hp(rng.standard_normal(ni), 3000) * env(ni, .001, .5)
        place(L, boom * .5 + crash * .08, drop); place(R, boom * .5 + crash * .08, drop)
    # outro fade
    fe = int(1.2 * SR); e = int((T - .2) * SR)
    for ch_ in (L, R):
        ch_[max(0, e - fe):e] *= np.linspace(1, 0, min(fe, e))
        ch_[e:] = 0
    m = np.stack([L, R], 1)
    return m / (np.abs(m).max() + 1e-9) * .9


if __name__ == '__main__':
    import sys, wave
    st, T = sys.argv[1], float(sys.argv[2])
    drop = float(sys.argv[3]) if len(sys.argv) > 3 else None
    m = music(st, T, drop)
    with wave.open(sys.argv[4] if len(sys.argv) > 4 else f'out/music_{st}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((m * 32767).astype(np.int16).tobytes())
