"""Mix the supplied voice-over with the score and effects -> public/audio/mix.wav

The recording is used as delivered (same words, pace and pitch): resampled to 48 kHz,
high-passed at 70 Hz, gently levelled, placed at +0.40 s. The music is ducked under
speech with an extra carve in the 1-4 kHz voice band, and dipped further on the
partner names and the date.

    python3 audio-tools/mix.py audio-src/vo.wav audio-src/ public/audio/mix.wav
"""
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt, sosfiltfilt

SR = 48000
DUR = 33.0
N = int(SR * DUR)
OFFSET = 0.40


def lufs(x):
    sf.write('/tmp/_m.wav', x.astype(np.float32), SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', '/tmp/_m.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    tail = r[r.rfind('Summary'):]
    i = float(tail.split('I:')[1].split('LUFS')[0])
    tp = float(tail.split('Peak:')[1].split('dBFS')[0])
    return i, tp


def main(vo_path, src, out):
    vo, sr = sf.read(vo_path)
    if vo.ndim > 1:
        vo = vo.mean(1)
    vo = resample_poly(vo, SR, sr)
    vo = sosfilt(butter(2, 70, 'high', fs=SR, output='sos'), vo)
    # gentle levelling: slow RMS compressor, 2:1 above threshold
    hop = 240
    rms = np.sqrt(np.convolve(vo ** 2, np.ones(1200) / 1200, 'same') + 1e-10)
    db = 20 * np.log10(rms)
    thr = np.percentile(db[db > -45], 70)
    gain_db = np.where(db > thr, -(db - thr) * 0.5, 0)
    g = 10 ** (sosfiltfilt(butter(1, 8, fs=SR, output='sos'), gain_db) / 20)
    vo = vo * g
    voice = np.zeros(N)
    i0 = int(OFFSET * SR)
    voice[i0:i0 + len(vo)] = vo[:N - i0]
    voice /= np.abs(voice).max()

    music, _ = sf.read(f'{src}/music.wav')
    sfx, _ = sf.read(f'{src}/sfx.wav')

    # speech activity -> ducking envelope (attack ~40 ms, release ~300 ms)
    act = np.sqrt(np.convolve(voice ** 2, np.ones(960) / 960, 'same'))
    act = (20 * np.log10(act + 1e-9) > -38).astype(float)
    env = np.zeros(N)
    a, r = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.30 * SR))
    e = 0.0
    for k in range(0, N, 48):  # control rate 1 kHz
        tgt = act[k]
        c = a if tgt > e else r
        c = c ** 48
        e = tgt + (e - tgt) * c
        env[k:k + 48] = e
    focus = np.zeros(N)  # extra dip on partner names and the date
    for t0, t1 in [(5.85, 6.35), (6.3, 7.15), (7.5, 9.25), (16.4, 17.25), (24.5, 25.25)]:
        idx = (np.arange(N) / SR > t0) & (np.arange(N) / SR < t1)
        focus[idx] = 1
    focus = sosfiltfilt(butter(1, 6, fs=SR, output='sos'), focus)
    duck_db = -9.5 * env - 2.5 * focus * env
    carve_db = -4.0 * env
    band = sosfilt(butter(2, [1000, 4000], 'band', fs=SR, output='sos'), music, axis=0)
    music_c = music + band * (10 ** (carve_db / 20) - 1)[:, None]
    music_d = music_c * (10 ** (duck_db / 20))[:, None]

    v2 = np.stack([voice, voice], 1)
    # set relative levels: voice ~ -16 LUFS short-term, music bed sits ~13 LU under it under speech
    vi, _ = lufs(v2)
    v2 *= 10 ** ((-16 - vi) / 20)
    mi, _ = lufs(music)
    music_d *= 10 ** ((-17.0 - mi) / 20)  # undocked level; ducking brings it to ~-26 under words
    si, _ = lufs(sfx)
    sfx *= 10 ** ((-26 - si) / 20)
    mix = v2 + music_d + sfx
    # loudness to -14 LUFS, then a gentle peak limiter to -1.2 dBFS
    li, _ = lufs(mix)
    mix *= 10 ** ((-14 - li) / 20)
    ceil = 10 ** (-2.3 / 20)
    peak = np.abs(mix).max(1)
    need = np.minimum(1, ceil / np.maximum(peak, 1e-9))
    look = 96
    gmin = np.array([need[max(0, k - look):k + look].min() for k in range(0, N, look)])
    gs = np.repeat(gmin, look)[:N]
    gs = sosfiltfilt(butter(1, 40, fs=SR, output='sos'), gs)
    mix *= np.minimum(gs, need * 1.0 + (gs - need).clip(0))[:, None]
    mix = np.clip(mix, -ceil, ceil)
    sf.write(out, mix.astype(np.float32), SR, subtype='PCM_24')
    # stems at final gain, for QA only
    k = 10 ** ((-14 - li) / 20)
    sf.write(f'{src}/qa_voice.wav', (v2 * k).astype(np.float32), SR)
    sf.write(f'{src}/qa_bed.wav', ((music_d + sfx) * k).astype(np.float32), SR)
    print('mix', lufs(mix))


if __name__ == '__main__':
    main(*sys.argv[1:4])
