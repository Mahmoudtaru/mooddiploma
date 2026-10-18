#!/usr/bin/env python3
"""Builds public/audio/mix.wav: supplied voice-over (untouched timing/pitch) + original music bed + original SFX.

  python3 audio-src/build_audio.py            # from the project root

Inputs : public/audio/voiceover.wav  (the supplied recording, 25.000 s)
         audio-src/music_bed.wav      (original score rendered from audio-src/score.json by audio-src/score.py)
         src/timeline.json            (speech map + SFX cue list shared with the Remotion composition)
Output : public/audio/mix.wav (48 kHz stereo), audio-src/stems/*.wav, and a loudness report.

All music and effects are synthesised here from code (no third-party samples), so there are no licensing constraints.
"""
import json, subprocess, re, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
TL = json.loads((ROOT / 'src/timeline.json').read_text())
DUR = TL['duration']
N = int(round(DUR * SR))
rng = np.random.default_rng(7)


def db(x):
    return 10 ** (x / 20)


def load(path, channels):
    tmp = ROOT / 'audio-src/stems/_tmp.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-ar', str(SR), '-ac', str(channels), '-c:a', 'pcm_f32le', str(tmp)], check=True)
    x, _ = sf.read(tmp, dtype='float32', always_2d=True)
    tmp.unlink()
    out = np.zeros((N, x.shape[1]), np.float32)
    out[: min(N, len(x))] = x[:N]
    return out


def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = r[r.rfind('Summary'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
    lra = float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1))
    return I, tp, lra


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def env_adsr(n, a, d, curve=3.0):
    t = np.arange(n) / SR
    e = np.where(t < a, (t / max(a, 1e-4)) ** 1.5, np.exp(-(t - a) * curve / max(d, 1e-4)))
    return e.astype(np.float32)


def tone(freq, dur, decay, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.004) * np.exp(-t / decay)
    return (amp * np.sin(2 * np.pi * freq * t) * e).astype(np.float32)


# ───────── original effects (all short, soft, mono-compatible) ─────────
def sfx(kind):
    if kind == 'draw':  # soft pencil-like texture that grows and settles
        n = int(0.8 * SR); x = rng.standard_normal(n)
        y = bp(x, 1800, 5200) * np.sin(np.linspace(0, np.pi, n)) ** 1.6
        return y * 0.6
    if kind == 'arrive':  # precise, understated arrival: muted thump + soft mallet (D/F#, in the Gmaj7 bed)
        y = np.zeros(int(1.4 * SR))
        th = tone(92, 0.25, 0.06, 0.9); y[: len(th)] += th
        for f, a in ((587.3, 0.45), (740.0, 0.32), (1174.7, 0.12)):
            m = tone(f, 1.4, 0.38, a); y[: len(m)] += m
        return y
    if kind == 'sweep':  # light upward travelling cue for the venous flow
        n = int(0.75 * SR); x = rng.standard_normal(n)
        out = np.zeros(n); hop = 1024
        for i in range(0, n, hop):
            fr = i / n; lo = 500 + 2200 * fr; seg = x[max(0, i - 2048): i + hop]
            out[i: i + hop] = bp(seg, lo, lo * 1.8)[-len(out[i: i + hop]):]
        return out * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.9
    if kind == 'move':  # small material movement (fabric/chair), no cartoon
        n = int(0.32 * SR); x = rng.standard_normal(n)
        e = np.exp(-((np.arange(n) / SR - 0.06) / 0.04) ** 2) + 0.6 * np.exp(-((np.arange(n) / SR - 0.17) / 0.05) ** 2)
        return bp(x, 250, 1600) * e * 0.9
    if kind == 'place':  # two gentle placements on a ceramic plate
        y = np.zeros(int(0.7 * SR))
        for off, a in ((0.0, 1.0), (0.11, 0.6)):
            i = int(off * SR)
            k = tone(240, 0.3, 0.05, 0.7 * a) + tone(1480, 0.3, 0.03, 0.18 * a)
            c = bp(rng.standard_normal(len(k)), 2000, 6000) * np.exp(-np.arange(len(k)) / SR / 0.006) * 0.25 * a
            y[i: i + len(k)] += k + c
        return y
    if kind == 'air':  # soft airy transition into the Baheya section
        n = int(1.3 * SR); x = rng.standard_normal(n)
        y = bp(x, 4000, 11000) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.35
        for f, d0, a in ((987.8, 0.15, 0.22), (1479.98, 0.32, 0.14)):
            m = tone(f, 1.0, 0.45, a); i = int(d0 * SR); y[i: i + len(m)] += m[: n - i]
        return y
    if kind == 'swell':  # low, slow surface swell (navy panel rising)
        n = int(0.9 * SR); x = rng.standard_normal(n)
        return bp(x, 120, 700) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.9
    if kind == 'accent':  # closing: one muted impact + bell, resolves with the D chord
        y = np.zeros(int(2.0 * SR))
        th = tone(73.4, 0.5, 0.16, 1.0); y[: len(th)] += th
        for f, d0, a in ((587.3, 0.0, 0.32), (880.0, 0.0, 0.22), (1174.7, 0.02, 0.1)):
            m = tone(f, 1.9, 0.6, a); i = int(d0 * SR); y[i: i + len(m)] += m[: len(y) - i]
        return y
    raise SystemExit(f'unknown sfx {kind}')


def main():
    stems = ROOT / 'audio-src/stems'; stems.mkdir(exist_ok=True)

    # Voice: the supplied recording, only resampled to 48 kHz; a 60 Hz high-pass removes rumble. No time/pitch change.
    voice = load(ROOT / 'public/audio/voiceover.wav', 1)[:, 0]
    voice = sosfiltfilt(butter(2, 60, 'highpass', fs=SR, output='sos'), voice).astype(np.float32)
    sf.write(stems / 'voice.wav', voice, SR, subtype='FLOAT')
    vI, _, _ = loudness(stems / 'voice.wav')

    music = load(ROOT / 'audio-src/music_bed.wav', 2)
    sf.write(stems / '_m.wav', music, SR, subtype='FLOAT'); mI, _, _ = loudness(stems / '_m.wav'); (stems / '_m.wav').unlink()
    music *= db((vI - 12.5) - mI)  # bed sits ~12.5 LU under the voice before ducking

    # Voice-driven ducking: carve the speech band harder than lows/air, smooth attack/release (no pumping).
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, 'same'))
    active = (20 * np.log10(rms + 1e-9) > -42).astype(np.float32)
    g = np.zeros_like(active); a_att = np.exp(-1 / (0.06 * SR)); a_rel = np.exp(-1 / (0.45 * SR)); s = 0.0
    for i, v in enumerate(active):
        s = (a_att if v > s else a_rel) * s + (1 - (a_att if v > s else a_rel)) * v
        g[i] = s
    mid_gain = db(-7.0 * g); rest_gain = db(-2.5 * g)
    sos_lo = butter(2, 280, 'lowpass', fs=SR, output='sos'); sos_hi = butter(2, 4200, 'highpass', fs=SR, output='sos')
    lo = sosfiltfilt(sos_lo, music, axis=0); hi = sosfiltfilt(sos_hi, music, axis=0); mid = music - lo - hi
    music = (lo + hi) * rest_gain[:, None] + mid * mid_gain[:, None]
    # clean edges: 15 ms fade-in, natural decay into a 0.7 s tail fade to digital silence at the last frame
    fi = int(0.015 * SR); music[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo0 = int((DUR - 0.7) * SR); music[fo0:] *= (np.cos(np.linspace(0, np.pi / 2, N - fo0)) ** 2)[:, None]
    sf.write(stems / 'music_ducked.wav', music.astype(np.float32), SR, subtype='FLOAT')

    fx = np.zeros((N, 2), np.float32)
    for c in TL['sfx']:
        y = sfx(c['kind']).astype(np.float32)
        y /= max(1e-6, np.sqrt(np.mean(y[y != 0] ** 2)))  # equal RMS before gain
        y *= db(c['gain_db'])
        i = int(c['at'] * SR); j = min(N, i + len(y)); y = y[: j - i]
        fx[i:j, 0] += y; fx[i:j, 1] += y
    sf.write(stems / 'sfx.wav', fx, SR, subtype='FLOAT')

    mixd = voice[:, None] + music + fx
    raw = stems / '_mix_raw.wav'; sf.write(raw, mixd.astype(np.float32), SR, subtype='FLOAT')
    I, tp, _ = loudness(raw)
    target = -16.0
    gain = target - I
    out = ROOT / 'public/audio/mix.wav'
    af = f'volume={gain:.2f}dB'
    if tp + gain > -1.2:
        af += ',alimiter=limit=0.83:attack=3:release=60:level=disabled'  # ≈ -1.6 dBFS sample ceiling, only touches rare peaks
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', str(out)], check=True)
    raw.unlink()
    I2, tp2, lra2 = loudness(out)
    print(f'voice {vI:.1f} LUFS | final mix: I {I2:.1f} LUFS, true peak {tp2:.1f} dBTP, LRA {lra2:.1f} LU -> {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
