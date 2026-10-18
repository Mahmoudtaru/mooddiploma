#!/usr/bin/env python3
"""Original ambient score, timed to the story beats of a video (no licensing issues).

  python3 score.py plan.json music.wav

plan.json:
{
  "dur": 73.0,                      # video duration (s)
  "bpm": 84,                        # arpeggio tempo
  "sections": [                     # chords change on scene / sentence boundaries from timing.json
    {"start": 0, "end": 5.4, "chord": "Bm", "amp": 0.55, "bright": 0.35, "arp": 0},
    ...                             # arp: 0 none, 0.5 quarters, 1 eighths, 2 sixteenths
  ],
  "end_chord": {"chord": "D", "start": 70.6},     # optional long resolve to the end
  "moments": [                      # punctuation, placed on the key visual beats
    {"type": "riser", "start": 14.6, "end": 16.25, "amp": 0.06},
    {"type": "bells", "at": 16.3, "notes": [74, 78, 81, 86, 90], "step": 0.22, "amp": 0.045},
    {"type": "pulse", "start": 42.9, "end": 49.9, "period": 1.43, "amp": 0.12}
  ]
}
Chords: any name (C, F#m, Bbmaj7, Asus2, Dm7, Eadd9). Sections may add "drive": 0 none · 1 soft kick+hats+bass ·
2 driving (four-on-the-floor, claps on 2 and 4) · 3 full (+ open hats, shakers). "grid_offset" puts bar 1 there.
Moments: riser, bells, bell, pulse, hit (a kick+clap+bell accent), drop (bed breathes out before a big moment).
Normally written by music.py brief from the voice-over itself; edit it, don't start from scratch.
Mood map: minor + low brightness + no arpeggio = doubt/tension; major + arpeggio = opening/hope;
sixteenths = build; long major chord with bells = resolve.
"""
import json, sys, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
CHORDS = {  # (drone root, pad voicing, arpeggio notes) in MIDI
    'Bm': (35, [47, 54, 59, 62, 66], [71, 74, 78, 83]),
    'G':  (31, [43, 50, 55, 59, 62], [67, 71, 74, 79]),
    'D':  (38, [50, 57, 62, 66, 69], [74, 78, 81, 86]),
    'A':  (33, [45, 52, 57, 61, 64], [69, 73, 76, 81]),
    'Em': (40, [52, 55, 59, 64, 67], [71, 76, 79, 83]),
    'C':  (36, [48, 55, 60, 64, 67], [72, 76, 79, 84]),
    'Am': (33, [45, 52, 57, 60, 64], [69, 72, 76, 81]),
    'F':  (29, [41, 48, 53, 57, 60], [65, 69, 72, 77]),
}


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def chord(name):
    """Any chord name (C, F#m, Bbmaj7, Asus2, Dm7, Eadd9) → (drone root, pad voicing, arpeggio notes) in MIDI."""
    if name in CHORDS: return CHORDS[name]
    import re
    m = re.match(r'^([A-G][#b]?)(m(?!aj))?(maj7|7|sus2|sus4|add9)?$', name)
    if not m: raise SystemExit(f'unknown chord {name}')
    r = NOTE[m.group(1)]; minor = bool(m.group(2)); ext = m.group(3)
    third = 3 if minor else 4
    if ext == 'sus2': third = 2
    if ext == 'sus4': third = 5
    tones = [0, third, 7]
    if ext == 'maj7': tones.append(11)
    elif ext == '7': tones.append(10)
    elif ext == 'add9': tones.append(14)
    root2 = 36 + r if r <= 7 else 24 + r          # drone in the 29–43 range
    base = 48 + r if r <= 6 else 36 + r            # pad around C3–F#4
    pad_v = sorted({base, base + 7, base + 12, base + 12 + third, base + 19} | {base + 12 + t for t in tones[3:]})
    arp = [base + 24, base + 24 + third, base + 31, base + 36] if base + 24 < 80 else [base + 12, base + 12 + third, base + 19, base + 24]
    return (root2, pad_v, arp)


def main(plan_path, out):
    P = json.load(open(plan_path))
    DUR = float(P['dur']); N = int(DUR * SR)
    L = np.zeros(N); R = np.zeros(N); rs = np.random.RandomState(P.get('seed', 11))
    mf = lambda m: 440.0 * 2 ** ((m - 69) / 12)

    def add(x, y, t0):
        i = int(t0 * SR); m = min(len(x), N - i)
        if m > 0 and i >= 0: L[i:i + m] += x[:m]; R[i:i + m] += y[:m]

    def pad(notes, t0, t1, amp, bright=0.5, att=1.6, rel=2.2):
        d = t1 - t0 + rel; n = int(d * SR); t = np.arange(n) / SR
        env = np.minimum(1, t / att) * np.clip((d - t) / rel, 0, 1) ** 1.5
        yl = np.zeros(n); yr = np.zeros(n)
        for m in notes:
            for k, det in enumerate((-0.07, 0.0, 0.07)):
                ff = mf(m) * 2 ** (det / 12); ph = rs.rand() * 6.28; v = np.zeros(n)
                for h in range(1, 7): v += (1 / h) * bright ** (h - 1) * np.sin(2 * np.pi * ff * h * t + ph * h)
                v *= 1 + 0.15 * np.sin(2 * np.pi * (0.13 + 0.05 * k) * t + k); pan = (k - 1) * 0.6
                yl += v * (1 - pan); yr += v * (1 + pan)
        sc = amp / (len(notes) * 3); add(yl * env * sc, yr * env * sc, t0)

    def pluck(m, t0, amp, dec=1.4, pan=0.0):
        f = mf(m); n = int(dec * 3 * SR); t = np.arange(n) / SR; e = np.minimum(1, t / 0.006) * np.exp(-t / dec)
        y = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.4) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.2)) * e * amp
        add(y * (1 - pan * 0.5), y * (1 + pan * 0.5), t0)

    def bell(m, t0, amp, pan=0.0):
        f = mf(m); n = int(4 * SR); t = np.arange(n) / SR
        y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 2.2), (2.76, 0.4, 1.0), (5.4, 0.2, 0.5), (8.9, 0.08, 0.25)))
        y *= np.minimum(1, t / 0.003) * amp; add(y * (1 - pan * 0.6), y * (1 + pan * 0.6), t0)

    def drone(m, t0, t1, amp):
        d = t1 - t0 + 2; n = int(d * SR); t = np.arange(n) / SR; env = np.minimum(1, t / 2.5) * np.clip((d - t) / 2.0, 0, 1)
        y = (np.sin(2 * np.pi * mf(m) * t) + 0.3 * np.sin(4 * np.pi * mf(m) * t)) * env * amp; add(y, y, t0)

    def riser(t0, t1, amp):
        n = int((t1 - t0) * SR); t = np.linspace(0, 1, n); x = sosfilt(butter(2, [400, 5000], btype='band', fs=SR, output='sos'), rs.randn(n))
        y = x / np.abs(x).max() * t ** 2.2 * amp; add(y, y, t0)

    def pulse(t0, t1, period, amp):
        t = t0
        while t < t1:
            n = int(0.5 * SR); tt = np.arange(n) / SR; f = 55 * np.exp(-tt * 6) + 38
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16) * amp; add(y, y, t); t += period

    def kick(t0, amp):
        n = int(0.32 * SR); tt = np.arange(n) / SR; f = 46 + 90 * np.exp(-tt * 28)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.13) * amp; y[:60] += rs.randn(60) * 0.15 * amp * np.exp(-np.arange(60) / 12)
        add(y, y, t0)

    def hat(t0, amp, open_=False, pan=0.25):
        n = int((0.22 if open_ else 0.05) * SR); x = sosfilt(butter(2, [7000, 15000], btype='band', fs=SR, output='sos'), rs.randn(n))
        y = x * np.exp(-np.arange(n) / SR / (0.07 if open_ else 0.014)) * amp; add(y * (1 - pan), y * (1 + pan), t0)

    def clap(t0, amp):
        n = int(0.25 * SR); x = sosfilt(butter(2, [900, 4500], btype='band', fs=SR, output='sos'), rs.randn(n)); tt = np.arange(n) / SR
        env = sum(np.exp(-np.clip(tt - d, 0, None) / 0.012) * (tt >= d) for d in (0, 0.011, 0.022)) * 0.6 + np.exp(-tt / 0.09) * 0.5
        y = x * env * amp; add(y * 0.9, y * 1.1, t0)

    def shaker(t0, amp, pan):
        n = int(0.07 * SR); x = sosfilt(butter(2, [5000, 11000], btype='band', fs=SR, output='sos'), rs.randn(n)); tt = np.arange(n) / SR
        y = x * np.minimum(1, tt / 0.012) * np.exp(-tt / 0.025) * amp; add(y * (1 - pan), y * (1 + pan), t0)

    def bass(m, t0, dur_, amp):
        n = int((dur_ + 0.08) * SR); tt = np.arange(n) / SR; f = mf(m)
        y = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt) + 0.08 * np.sin(6 * np.pi * f * tt))
        y *= np.minimum(1, tt / 0.008) * np.clip((dur_ + 0.08 - tt) / 0.08, 0, 1) * np.exp(-tt / 0.9) * amp; add(y, y, t0)

    beat = 60 / P.get('bpm', 84)
    # rhythm section on a fixed bar grid that starts at `grid_offset` (the brief puts a downbeat on the CTA)
    off = float(P.get('grid_offset', 0.0)); bar = 4 * beat
    for s in P['sections']:
        drv = s.get('drive', 0)
        if not drv: continue
        root = chord(s['chord'])[0]
        k0 = int(np.ceil((s['start'] - off) / (beat / 4) - 1e-6)); t = off + k0 * beat / 4; i = k0
        while t < s['end'] - 1e-3:
            pos = i % 16  # sixteenth inside the bar
            if pos % 4 == 0 and (drv >= 2 or pos in (0, 8)): kick(t, 0.5 if drv >= 2 else 0.4)
            if drv >= 2 and pos in (4, 12): clap(t, 0.16)
            if pos % 2 == 0: hat(t, 0.05 if pos % 4 else 0.035, open_=(drv >= 3 and pos % 8 == 6))
            if drv >= 3 and pos % 2 == 1: shaker(t, 0.025, np.sin(i) * 0.5)
            if pos % 2 == 0 and (drv >= 2 or pos % 4 == 0): bass(root + (12 if pos in (6, 14) and drv >= 2 else 0), t, beat / 2 * 0.9, 0.16)
            t += beat / 4; i += 1
    for m in P.get('moments', []):
        if m['type'] == 'hit': kick(m['at'], m.get('amp', 0.7)); clap(m['at'], m.get('amp', 0.7) * 0.4); bell(chord(m.get('chord', P['sections'][-1]['chord']))[2][0], m['at'], 0.03)

    for s in P['sections']:
        root, voic, ar = chord(s['chord']); t0, t1 = s['start'], s['end']
        pad(voic, t0, t1, s.get('amp', 0.8), s.get('bright', 0.5)); drone(root, t0, t1, 0.10)
        arp = s.get('arp', 0)
        if arp:
            step = beat / 2 if arp == 1 else beat / 4 if arp == 2 else beat
            pat = [0, 1, 2, 3, 2, 1] if arp != 2 else [0, 1, 2, 3]; k = 0; t = t0
            while t < t1 - 0.05:
                pluck(ar[pat[k % len(pat)]], t, 0.07 if arp != 2 else 0.055, 1.2 if arp != 2 else 0.7, np.sin(k * 0.9) * 0.6); k += 1; t += step
    if P.get('end_chord'):
        e = P['end_chord']; root, voic, ar = chord(e['chord'])
        pad(voic + [ar[0], ar[1]], e['start'], DUR - 0.5, 0.8, 0.5, att=0.5, rel=1.6); drone(root, e['start'], DUR - 1, 0.1)
        for i, m in enumerate(ar[1:]): bell(m, e['start'] + i * 0.4, 0.05 - i * 0.01, (i - 1) * 0.4)
    for m in P.get('moments', []):
        if m['type'] == 'riser': riser(m['start'], m['end'], m.get('amp', 0.06))
        elif m['type'] == 'bells':
            for i, n in enumerate(m['notes']): bell(n, m['at'] + i * m.get('step', 0.25), m.get('amp', 0.04), ((i % 3) - 1) * 0.6)
        elif m['type'] == 'bell': bell(m['note'], m['at'], m.get('amp', 0.03))
        elif m['type'] == 'pulse': pulse(m['start'], m['end'], m.get('period', 1.4), m.get('amp', 0.12))

    for m in P.get('moments', []):
        if m['type'] == 'drop':  # the bed takes a breath right before a big moment (applied after everything is placed)
            i0, i1 = int(m['start'] * SR), int(m['end'] * SR); r_ = np.linspace(1, 0.12, max(1, min(i1 - i0, 2400)))
            L[i0:i0 + len(r_)] *= r_; R[i0:i0 + len(r_)] *= r_; L[i0 + len(r_):i1] *= 0.12; R[i0 + len(r_):i1] *= 0.12

    def ir(seed, sec=2.8):
        r = np.random.RandomState(seed); n = int(sec * SR); t = np.arange(n) / SR
        x = sosfilt(butter(1, 5500, fs=SR, output='sos'), r.randn(n) * np.exp(-t / 0.75)); x[0] = 0; return x / np.sqrt((x ** 2).sum())
    L2 = L * 0.6 + fftconvolve(L, ir(1))[:N] * 0.9; R2 = R * 0.6 + fftconvolve(R, ir(2))[:N] * 0.9
    sos = butter(2, 12000, fs=SR, output="sos"); L2 = sosfilt(sos, L2); R2 = sosfilt(sos, R2)  # gentle top; the voice band is carved in the mix
    fade = np.ones(N); fo = int(1.6 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 2; fi = int(0.4 * SR); fade[:fi] = np.linspace(0, 1, fi)
    L2 *= fade; R2 *= fade; pk = max(np.abs(L2).max(), np.abs(R2).max()); L2 *= 0.85 / pk; R2 *= 0.85 / pk
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L2, R2], 1) * 32767).astype('<i2').tobytes())
    print(out, DUR, 's')


if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])
