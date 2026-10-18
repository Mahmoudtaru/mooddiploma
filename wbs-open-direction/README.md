# وقفتك بصحتك × Breadfast × بهية — Powered by iVein

Original 9:16 motion film announcing the workplace health event (Monday 19 October), built from the
open-direction brief, the four official logos and the supplied voice-over recording.

## Deliverables
| File | What |
|---|---|
| `out/WbS-Event-Film_9x16.mp4` | Final film: 1080×1920, 30 fps, 30.0 s (900 frames), H.264 High yuv420p + AAC-LC 48 kHz stereo 320 kb/s, −14.2 LUFS integrated, −1.1 dBFS peak |
| `out/WbS-Event-Film_closing.png` | Clean still of the finished closing composition (frame 870, 29.0 s) |
| this folder | Editable Remotion project with assets, fonts, timing, score and mix scripts |

## Concept: "the slot" (مكان في يومك)
The workday is a dense dark column of calendar/task blocks advancing in mechanical half-beat steps. The stream
brakes (the *وقفة*), one block lights from within and its widening edge washes «وسط يوم الشغل…» into «وقت لصحتك».
That lit slot carries the whole film:

1. It opens into the frame and becomes the initiative's world: the WbS mark rises, Breadfast arrives on a magenta
   hairline, and the **Powered by iVein** chip lands with «بدعم من آيفين».
2. The iVein chip stays on as the header while the slot turns into the **19** tile of a week strip (الاثنين / 19 / أكتوبر).
3. The tile becomes the stool of a worker seated at a desk (iVein blue world). The camera pushes in to the worker's shin,
   where a vein draws and flows. On «الدوالي» a segment twists and the flow pools; on «الوقاية» it straightens, the valves
   flash and the flow speeds up.
4. The camera pulls back quickly to the worker, still seated. The topic line rolls inside its band (vascular → habits). The
   worker stands, steps back from the desk as the stool slides away, and stretches while the camera moves in on them
   (habits: sitting, standing, movement).
5. The camera tracks to a lunch tray. Each topic line and the iVein header travel with their own scene, and the tray's
   compartments, the day's "slots" again, fill on the half-beats (nutrition).
6. A pink band wipes in Baheya's world and draws the awareness ribbon. «التوعية بسرطان الثدي» and «أهمية الكشف المبكر»
   follow, with an attention pulse on «الكشف».
7. The blocks close back in under «وسط كل اللي مطلوب منك…», then part on the downbeat to make room for
   «صحتك ليها مكان.». The lockup assembles: a WbS | Breadfast co-brand row, the message, the date, مستنيينكم, and Powered by iVein | بالتعاون مع Baheya. It
   holds about 4.4 s (25.6 → 30.0 s) over a quietly drifting ghost-slot background. The 30 s length was requested;
   it is shorter than the brief's 6–8 s hold.

## Voice-over
`audio-src/vo.wav` is the supplied recording (25.00 s, 24 kHz mono), used as delivered with the same words, order, pitch
and pace. It is resampled to 48 kHz, high-passed at 70 Hz, gently levelled (2:1 slow RMS) and starts at +0.40 s.
Word anchors in `src/timing.ts` were measured from the recording itself (energy pauses + prefix-scan Whisper transcription),
not estimated. The recording says «ومع بهية» and «الاتنين تسعتاشر أكتوبر»; the screen shows «الاثنين 19 أكتوبر» as specified.

## Music and sound
`audio-tools/score.py` is an **original composition, synthesized in code** (no samples, no third-party tracks), so there are
no licensing restrictions from third parties. It runs at 117.65 BPM in D major (I–V–vi–IV), with the grid set so downbeats land
on «لصحتك» (2.70 s) and «صحتك ليها مكان» (23.10 s). Structure:
- A muted workday clock that ticks in sync with the block steps, then a riser.
- The full groove drops on the reveal.
- The arrangement thins (no claps, sustained keys) under Baheya.
- A build with the clock returning under «وسط كل اللي مطلوب منك».
- A drop when the day parts, a marimba hook after the VO, and a final hit at 28.2 s (beat 3 of the last bar) with its natural tail.

There are about ten designed effects, all at turning points: the slot lighting, the slot opening, the 19 lock, the pull-back,
the food landing, the pink wipe, the parting with a sub boom, and the invitation. `audio-tools/mix.py` ducks the music about 9.5 dB
under speech with an extra 4 dB carve at 1–4 kHz, dips a further 2.5 dB on the partner names and the date, and drops 4 dB more
after the last word so the ending stays calm. It then normalises to −14 LUFS with a peak ceiling. Under speech the voice sits a
median 10 dB above the bed; after the VO the bed sits about 4 dB below the voice's level.

## Rebuild
```bash
npm install
python3 audio-tools/score.py audio-src                                   # music.wav + sfx.wav
python3 audio-tools/mix.py audio-src/vo.wav audio-src public/audio/mix.wav
npm run render                                                           # -> out/WbS-Event-Film_9x16.mp4
npm run still                                                            # -> out/closing.png (frame 870)
npm run studio                                                           # live preview / editing
```
Requires Node 18+, Python 3 with numpy, scipy and soundfile, plus ffmpeg (used for loudness measurement).
`remotion.config.ts` points to a pre-installed headless Chromium; set `REMOTION_BROWSER`, or delete that line to let Remotion
download its own.

## Sources and rights
- Logos: the four supplied PNGs, used unaltered (sha256 matches `asset-manifest.json`). Each sits on a light or white
  surface, at or below native size. The PNGs are raster, not vector.
- Font: Alexandria (SIL Open Font License), weights 400–800, Arabic and Latin subsets.
- Music and SFX: original, generated by `audio-tools/score.py`.
- Every illustration (blocks, leg/vein, worker, tray and food, ribbon) is drawn as live SVG/HTML vector layers. No
  generative imagery is used.

## Known limitations
- QA covered rendered frames every 0.5 s, full-resolution checks of the critical frames, loudness, peak, mono
  fold-down and voice-to-bed measurements on the encoded MP4. Nobody has yet watched and listened at full speed on a
  phone, so please do that before publishing.
- The iVein PNG includes a thin white outline, so it is always placed on white surfaces.
- Baheya's tagline «في ضهر كل ست مصرية» is part of the supplied logo. It is small at mobile size, but it is shown intact as required.
