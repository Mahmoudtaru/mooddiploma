"""Render one ad: python3 render.py A [--stills 1,5,9] [--fps 30]
Reads CLIPS/CUES/T from <name>.html, cuts screen-recording frames, renders frames
with Playwright, synthesizes SFX at CUES and mixes them under the VO."""
import asyncio, json, os, subprocess, sys, wave
import numpy as np
from playwright.async_api import async_playwright

CHROME = next(p for p in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'] if os.path.isfile(p))
D = os.path.dirname(os.path.abspath(__file__))
UP = '/root/.claude/uploads/b9e6049b-cfc9-5689-924a-1627739d6317/'
SRC = {  # screen recordings: file, crop (w:h:x:y) that removes phone status/browser bars
    'P': (UP + 'dd9da759-Screenrecorder-2026-10-22-00-12-24-591.mp4', '540:1066:0:64'),
    'W': (UP + '43533b18-Screenrecorder-2026-10-21-23-53-15-992.mp4', '540:980:0:145'),
    'L': (UP + '141ae7ae-Screenrecorder-2026-10-21-23-55-56-976.mp4', '540:980:0:145'),
}


def cut_clips(clips):
    for name, c in clips.items():
        out = f'{D}/frames/{name}'
        n = round(c['dur'] * 30)
        if os.path.isdir(out) and len(os.listdir(out)) == n:
            continue
        os.makedirs(out, exist_ok=True)
        for f in os.listdir(out):
            os.remove(f'{out}/{f}')
        f, crop = SRC[c['src']]
        speed = (c['t1'] - c['t0']) / c['dur']
        vf = f"crop={crop},setpts=PTS/{speed},fps=30,scale={c.get('w', 488)}:-2"
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(c['t0']), '-t', str(c['t1'] - c['t0']), '-i', f,
                        '-vf', vf, '-frames:v', str(n), '-q:v', '3', f'{out}/%04d.jpg'], check=True)
        have = len(os.listdir(out))
        for i in range(have + 1, n + 1):  # pad if source ran short
            os.link(f'{out}/{have:04d}.jpg', f'{out}/{i:04d}.jpg')


def sfx(cues, T, sr=48000):
    out = np.zeros(int((T + 1) * sr))
    rng = np.random.default_rng(7)

    def add(sig, t, g):
        i = int(t * sr)
        j = min(len(out), i + len(sig))
        if i < len(out):
            out[i:j] += sig[:j - i] * g

    def env(n, a=.004, r=.9):
        e = np.ones(n)
        na = max(1, int(a * sr))
        e[:na] = np.linspace(0, 1, na)
        e *= np.exp(-np.linspace(0, 1, n) * r * 6)
        return e

    for t, kind in cues:
        if kind == 'pop':
            n = int(.14 * sr); tt = np.arange(n) / sr
            f = np.linspace(700, 380, n)
            add(np.sin(2 * np.pi * np.cumsum(f) / sr) * env(n), t, .2)
        elif kind == 'whoosh':
            n = int(.5 * sr)
            w = rng.standard_normal(n)
            k = np.hanning(n)
            sig = np.convolve(w, np.ones(24) / 24, 'same') * k
            add(sig / np.abs(sig).max(), t - .2, .14)
        elif kind == 'tick':
            n = int(.03 * sr)
            add(rng.standard_normal(n) * env(n, r=2), t, .06)
        elif kind == 'ding':
            for k_, (fr, dt) in enumerate([(1320, 0), (1760, .09)]):
                n = int(.35 * sr); tt = np.arange(n) / sr
                add(np.sin(2 * np.pi * fr * tt) * env(n, r=.7), t + dt, .1)
        elif kind == 'thud':
            n = int(.45 * sr); tt = np.arange(n) / sr
            f = 40 + 70 * np.exp(-tt * 18)
            add(np.sin(2 * np.pi * np.cumsum(f) / sr) * env(n, a=.002, r=.9), t, .5)
            m = int(.2 * sr)
            add(rng.standard_normal(m) * env(m, a=.001, r=2) * .5, t, .12)
        elif kind == 'crack':
            n = int(.25 * sr)
            sig = rng.standard_normal(n) * env(n, a=.001, r=1.4)
            add(np.convolve(sig, [1, -.95], 'same'), t, .3)
        elif kind == 'shatter':
            for i in range(14):
                n = int(.12 * sr); tt = np.arange(n) / sr
                fr = rng.uniform(2500, 6000)
                add(np.sin(2 * np.pi * fr * tt) * env(n, a=.001, r=1.2) * rng.uniform(.4, 1), t + rng.uniform(0, .45), .07)
            n = int(.6 * sr)
            add(rng.standard_normal(n) * env(n, a=.002, r=.8), t, .12)
    path = f'{D}/out/sfx.wav'
    with wave.open(path, 'wb') as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(sr)
        wv.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    return path


async def main(name, stills=None, fps=30):
    os.makedirs(f'{D}/out', exist_ok=True)
    url = f'file://{D}/{name}.html'
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        await pg.goto(url)
        await pg.evaluate('document.fonts.ready')
        meta = await pg.evaluate('({clips: CLIPS, cues: CUES, T: T, music: (typeof MUSIC !== "undefined" ? MUSIC : null)})')
        cut_clips(meta['clips'])
        T = meta['T']
        if stills:
            for s in stills:
                await pg.evaluate(f'render({s})')
                await pg.screenshot(path=f'{D}/out/{name}_{s:05.2f}.jpg', type='jpeg', quality=85)
            await b.close()
            return
        ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-i', '-',
                               '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                               f'{D}/out/{name}_video.mp4'], stdin=subprocess.PIPE)
        for i in range(int(T * fps)):
            await pg.evaluate(f'render({i / fps})')
            ff.stdin.write(await pg.screenshot(type='jpeg', quality=93))
        ff.stdin.close(); ff.wait()
        await b.close()
    s = sfx(meta['cues'], T)
    import music as mus
    mpath = f'{D}/out/music_{name}.wav'
    mm = meta['music'] or {'style': name, 'drop': None}
    m = mus.music(mm['style'], T, mm.get('drop'))
    with wave.open(mpath, 'wb') as wv:
        wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(48000)
        wv.writeframes((m * 32767).astype(np.int16).tobytes())
    fc = ('[1:a]aresample=48000,apad,asplit=2[v][vsc];'
          '[3:a]volume=0.55[m0];[m0][vsc]sidechaincompress=threshold=0.025:ratio=7:attack=15:release=380:makeup=1[m];'
          '[2:a]volume=0.9[s];'
          '[v][s][m]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[a]')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{D}/out/{name}_video.mp4', '-i', f'{D}/vo/{name}.wav', '-i', s,
                    '-i', mpath, '-filter_complex', fc,
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
                    f'{D}/out/{name}.mp4'], check=True)
    print('done', f'{D}/out/{name}.mp4')


if __name__ == '__main__':
    sys.path.insert(0, D)
    name = sys.argv[1]
    stills = None
    if '--stills' in sys.argv:
        stills = [float(x) for x in sys.argv[sys.argv.index('--stills') + 1].split(',')]
    asyncio.run(main(name, stills))
