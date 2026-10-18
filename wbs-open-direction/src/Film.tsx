import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT} from './theme';
import {FPS, HALF, T} from './timing';
import {clamp01, eIn, eInOut, eOut, eSoft, lerp, mix, prog, springAt} from './motion';
import {BlockView, LANE_W, makeLane} from './Blocks';
import {CAM_CLOSE, Figure} from './Figure';
import {Ribbon, Tray} from './Props';

// ---------------------------------------------------------------- type helpers
type TxtProps = {
  y: number;
  size: number;
  weight?: number;
  color?: string;
  reveal?: number; // 0..1, right-to-left mask in reading direction
  hide?: number; // 0..1, mask continues leftwards and removes the line
  op?: number;
  dy?: number;
  scale?: number;
  children: React.ReactNode;
};
const Txt: React.FC<TxtProps> = ({y, size, weight = 700, color = C.navy, reveal = 1, hide = 0, op = 1, dy = 0, scale = 1, children}) => {
  if (op <= 0 || reveal <= 0 || hide >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: 1080,
        top: y - size * 0.8,
        height: size * 1.6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `translateY(${dy}px) scale(${scale})`,
        opacity: op,
      }}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: weight,
          color,
          lineHeight: 1.6,
          whiteSpace: 'nowrap',
          padding: '0 24px',
          clipPath: `inset(-30% ${hide * 100}% -30% ${(1 - reveal) * 100}%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Logo: React.FC<{src: string; w: number; cx: number; cy: number; ratio: number; style?: React.CSSProperties; clip?: string}> = ({src, w, cx, cy, ratio, style, clip}) => (
  <Img
    src={staticFile(`logos/${src}`)}
    style={{position: 'absolute', width: w, height: w * ratio, left: cx - w / 2, top: cy - (w * ratio) / 2, clipPath: clip, ...style}}
  />
);
const R = {wbs: 751 / 869, ivein: 158 / 305, breadfast: 127 / 404, baheya: 164 / 319};

// ---------------------------------------------------------------- opening stream
const OPEN_FILLS = ['#15336B', '#1A3D7C', '#21488B', '#183871'];
const STEP = 80;
const stepTimes = Array.from({length: 13}, (_, i) => T.sehetak - HALF * (i + 3)); // ends one beat before «لصحتك»
const openS = (t: number) => {
  let s = 0;
  for (const ts of stepTimes) s += STEP * eInOut(clamp01((t - ts) / (HALF * 0.72)));
  return s + 46 * eOut(clamp01((t - (stepTimes[0] + HALF * 0.72)) / 0.42));
};
const SF = openS(99);
const HERO = {h: 240, top: 960 - 120 + SF};
const LANE_SPEED = [1.12, 1, 0.9];
const OPEN_LANES = [
  makeLane(0, 11, -300, 3700, OPEN_FILLS),
  makeLane(1, 7, -300, 3700, OPEN_FILLS, HERO),
  makeLane(2, 23, -300, 3700, OPEN_FILLS),
];

const SlotHeadline: React.FC<{t: number}> = ({t}) =>
  t >= T.sehetak - 0.25 && t < T.mobadra + 0.5 ? (
    <Txt y={960} size={112} weight={800} reveal={prog(t, T.sehetak - 0.18, T.sehetak + 0.2, eOut)}
      dy={-90 * prog(t, T.mobadra - 0.3, T.mobadra + 0.05, eIn)} op={1 - prog(t, T.mobadra - 0.22, T.mobadra + 0.05)}>
      وقت <span style={{color: C.wbsTeal}}>لصحتك</span>
    </Txt>
  ) : null;

const Opening: React.FC<{t: number}> = ({t}) => {
  const s = openS(t);
  const L = prog(t, T.sehetak - 0.42, T.sehetak, eInOut);
  const E = prog(t, T.mobadra - 0.5, T.mobadra + 0.1, eInOut);
  const grow = prog(t, T.sehetak - 0.3, T.sehetak + 0.2, eOut);
  const heroCy = HERO.top + HERO.h / 2 - s;
  const hw = lerp(lerp(LANE_W, 920, grow), 1180, E);
  const hh = lerp(lerp(HERO.h, 300, grow), 1960, E);
  const fill = L < 0.5 ? mix('#1A3D7C', C.sky, L * 2) : mix(C.sky, C.offWhite, (L - 0.5) * 2);
  const recede = prog(t, T.sehetak - 0.3, T.sehetak + 0.5, eOut);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, #0E2756 0%, ${C.night} 75%)`}}>
      {OPEN_LANES.map((lane, li) =>
        lane.map((b, i) =>
          b.y === HERO.top && li === 1 ? null : (
            <BlockView key={`${li}-${i}`} b={b} dy={-s * LANE_SPEED[li]} opacity={1 - 0.35 * recede} />
          )
        )
      )}
      {/* light spilling from the slot onto the neighbours */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% ${heroCy / 19.2}%, rgba(22,175,224,0.55), rgba(22,175,224,0) 70%)`,
          opacity: L * (1 - E),
          mixBlendMode: 'screen',
        }}
      />
      {/* top/bottom falloff keeps the eye in the middle */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,26,61,0.85) 0%, rgba(8,26,61,0) 22%, rgba(8,26,61,0) 78%, rgba(8,26,61,0.9) 100%)'}} />
      {/* the hero slot */}
      <div
        style={{
          position: 'absolute',
          left: 540 - hw / 2,
          top: heroCy - hh / 2,
          width: hw,
          height: hh,
          borderRadius: lerp(26, 0, E),
          background: fill,
          boxShadow: `0 0 ${160 * L}px ${30 * L}px rgba(22,175,224,${0.5 * L * (1 - E)})`,
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: -(540 - hw / 2), top: -(heroCy - hh / 2), width: 1080, height: 1920}}>
          <SlotHeadline t={t} />
        </div>
        {L < 0.6 && (
          <div style={{position: 'absolute', right: 30, top: 30, left: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, opacity: 1 - L / 0.6}}>
            <div style={{width: '70%', height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.13)'}} />
            <div style={{width: '45%', height: 12, borderRadius: 9, background: 'rgba(255,255,255,0.13)'}} />
          </div>
        )}
      </div>
      <Txt y={960} size={84} color={C.offWhite} reveal={prog(t, T.wasat - 0.08, T.wasat + 0.5, eOut)}
        dy={(1 - prog(t, T.wasat - 0.08, T.wasat + 0.5, eOut)) * 18} op={1 - prog(t, T.sehetak - 0.3, T.sehetak - 0.08)}>
        وسط يوم الشغل…
      </Txt>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- closing stream
const CLOSE_FILLS = ['#15336B', '#1A3D7C', '#21488B', '#183871', '#1D4283'];
const CLOSE_LANES = [makeLane(0, 31, -900, 2900, CLOSE_FILLS), makeLane(1, 37, -900, 2900, CLOSE_FILLS), makeLane(2, 41, -900, 2900, CLOSE_FILLS)];
const closeSteps = Array.from({length: 6}, (_, i) => 21.315 + HALF * (i + 1)); // on the half-beat grid
const CLOSE_DIR = [-1, 1, -1];
const CLOSE_GROUPS = [0, 1].map((half) =>
  CLOSE_LANES.flatMap((lane, li) => lane.filter((b) => (b.y + b.h / 2 + CLOSE_DIR[li] * 336 >= 960) === (half === 1)).map((b) => ({b, li})))
);
const closeS = (t: number) => closeSteps.reduce((s, ts) => s + 56 * eInOut(clamp01((t - ts) / (HALF * 0.7))), 0);

// ---------------------------------------------------------------- the film
export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // world background for the light passages
  const toPale = prog(t, T.october + 0.6, T.nefham + 0.4);
  const toMint = prog(t, T.nekhtar + 0.25, T.nekhtar + 0.85);
  const worldBg = mix(mix(C.offWhite, C.pale, toPale), C.mint, toMint);

  // --- WbS / Breadfast / iVein passage
  const wbsIn = prog(t, T.mobadra + 0.08, T.mobadra + 0.7, eOut);
  const wbsShrink = prog(t, T.fi + 0.0, T.fi + 0.55, eInOut);
  const groupOut = prog(t, T.etnein - 0.55, T.etnein - 0.15, eIn);
  const wbsW = lerp(600, 430, wbsShrink);
  const wbsCy = lerp(880, 650, wbsShrink) - 420 * groupOut;
  const bfLine = prog(t, T.breadfast - 0.05, T.breadfast + 0.3, eOut);
  const bfIn = prog(t, T.breadfast + 0.02, T.breadfast + 0.45, eOut);
  const chipIn = springAt(t, T.bed3am, 14, 150);
  const iveinIn = prog(t, T.ivein - 0.12, T.ivein + 0.28, eOut);
  const chipUp = prog(t, T.etnein - 0.45, T.etnein + 0.12, eInOut);
  const chipOut = prog(t, T.nekhtar + 0.2, T.nekhtar + 0.55, eIn);
  const chipCy = lerp(1185, 315, chipUp) - 120 * chipOut;
  const chipScale = (0.86 + 0.14 * chipIn) * lerp(1, 0.84, chipUp);

  // --- date
  const tileIn = (i: number) => springAt(t, T.etnein + 0.08 + i * 0.06, 15, 160);
  const hero19 = prog(t, T.t19 - 0.05, T.t19 + 0.4, eOut);
  const dateOut = prog(t, T.october + 0.62, T.october + 0.9, eIn);
  const morph = prog(t, T.october + 0.68, T.nefham + 0.42, eInOut);
  const tileW = lerp(lerp(150, 300, hero19), 230, morph);
  const tileH = lerp(lerp(190, 380, hero19), 1180, morph);
  const tileCy = lerp(960, CAM_CLOSE.sy, morph);
  const tileFill = morph > 0 ? (morph < 0.5 ? mix(C.navy, C.sky, morph * 2) : mix(C.sky, '#FFFFFF', morph * 2 - 1)) : mix('#FFFFFF', C.navy, hero19);
  const figureOn = prog(t, T.nefham + 0.38, T.nefham + 0.46, (x) => x);

  // --- topic titles (one anchor line that changes its words)
  const titleA = {reveal: prog(t, T.nefham + 0.0, T.nefham + 0.45, eOut), hide: prog(t, T.nraja3 + 0.35, T.nraja3 + 0.65, eIn)};
  const titleB = {reveal: prog(t, T.nraja3 + 0.55, T.nraja3 + 0.95, eOut), hide: prog(t, T.nekhtar + 0.1, T.nekhtar + 0.38, eIn)};
  const titleC = {reveal: prog(t, T.nekhtar + 0.3, T.nekhtar + 0.72, eOut), hide: prog(t, T.ma3 - 0.05, T.ma3 + 0.25, eIn)};
  const sub = {reveal: prog(t, T.dawaly + 0.05, T.dawaly + 0.5, eOut), op: 1 - prog(t, T.nraja3 + 0.2, T.nraja3 + 0.45)};
  const pan = prog(t, T.nekhtar + 0.2, T.nekhtar + 0.85, eInOut);

  // --- Baheya world: diagonal wipe led by a pink band
  const wipe = prog(t, T.ma3 - 0.42, T.ma3 + 0.12, eInOut);
  const wy = lerp(2380, -480, wipe);
  const slope = 0.42;
  const yL = wy - slope * 540;
  const yR = wy + slope * 540;
  const bahCard = springAt(t, T.baheya + 0.02, 14, 140);
  const l1 = prog(t, T.saratan - 0.12, T.saratan + 0.38, eOut);
  const l2 = prog(t, T.ahamya - 0.05, T.ahamya + 0.42, eOut);

  // --- closing
  const enter = (li: number) => prog(t, T.wasat2 - 0.12 + li * 0.05, T.wasat2 + 0.4 + li * 0.05, eOut);
  const cs = closeS(t);
  const part = prog(t, T.sehetak2 - 0.06, T.sehetak2 + 0.5, eOut);
  const retreat = prog(t, T.makan + 0.45, T.makan + 1.25, eInOut);
  const upperDy = -560 * part - 1000 * retreat;
  const lowerDy = 560 * part + 1000 * retreat;
  const headToLock = prog(t, T.makan + 0.5, T.makan + 1.15, eInOut);
  const headY = lerp(960, 790, headToLock);
  const lockWbs = prog(t, T.makan + 0.62, T.makan + 1.22, eOut);
  const lockBf = prog(t, T.makan + 0.8, T.makan + 1.25, eOut);
  const pill = prog(t, T.makan + 0.85, T.makan + 1.3, eOut);
  const pillTxt = prog(t, T.makan + 0.98, T.makan + 1.4, eOut);
  const wait = prog(t, T.mestanyeen + 0.0, T.mestanyeen + 0.45, eOut);
  const card = springAt(t, T.mestanyeen + 0.42, 16, 120);
  const cardLogo = (d: number) => prog(t, T.mestanyeen + 0.55 + d, T.mestanyeen + 0.95 + d, eOut);
  const ambient = prog(t, T.makan + 1.0, T.makan + 2.2);

  return (
    <AbsoluteFill style={{background: worldBg, fontFamily: FONT}}>
      <Audio src={staticFile('audio/mix.wav')} />

      {/* ============ initiative · host · backing (inside the opened slot) */}
      {t >= T.mobadra - 0.35 && t < T.nefham + 0.6 && (
        <AbsoluteFill>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 50% 42%, rgba(10,155,139,0.10), rgba(10,155,139,0) 70%)', opacity: 1 - groupOut}} />
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 14% at 50% 50%, rgba(170,3,130,0.09), rgba(170,3,130,0) 70%)', opacity: bfIn * (1 - groupOut)}} />
          {wbsIn > 0 && groupOut < 1 && (
            <Logo src="wbs-logo.png" w={wbsW} cx={540} cy={wbsCy + (1 - wbsIn) * 60} ratio={R.wbs}
              clip={`inset(${(1 - wbsIn) * 100}% -5% -5% -5%)`} style={{opacity: 1 - groupOut}} />
          )}
          {bfLine > 0 && groupOut < 1 && (
            <div style={{position: 'absolute', left: 540 - 190 * bfLine, width: 380 * bfLine, top: 868 - 420 * groupOut, height: 3, borderRadius: 2, background: C.breadfast, opacity: 0.55 * (1 - groupOut)}} />
          )}
          {bfIn > 0 && groupOut < 1 && (
            <Logo src="breadfast-logo.png" w={300} cx={540} cy={962 - 420 * groupOut + (1 - bfIn) * 24} ratio={R.breadfast}
              clip={`inset(-5% ${(1 - bfIn) * 100}% -5% -5%)`} style={{opacity: 1 - groupOut}} />
          )}
        </AbsoluteFill>
      )}

      {/* ============ date: one tile in the week */}
      {t >= T.etnein - 0.1 && t < T.nefham + 0.6 && (
        <AbsoluteFill>
          {[17, 18, 20, 21].map((n) => {
            const k = n - 19;
            const i = n - 17;
            const sp = tileIn(i);
            const push = hero19 * 70 * Math.sign(k);
            const x = 540 - k * 174 - push;
            return (
              <div key={n} style={{position: 'absolute', left: x - 75, top: 960 - 95 + (1 - sp) * 80, width: 150, height: 190, borderRadius: 26, background: '#FFFFFF',
                border: `2px solid rgba(16,47,104,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 64, fontWeight: 500, color: C.navy, opacity: sp * lerp(1, 0.32, hero19) * (1 - dateOut)}}>
                {n}
              </div>
            );
          })}
          {t < T.nefham + 0.5 && (
            <div style={{position: 'absolute', left: 540 - tileW / 2, top: tileCy - tileH / 2 + (1 - tileIn(2)) * 80, width: tileW, height: tileH,
              borderRadius: lerp(26, 115, morph), background: tileFill, opacity: tileIn(2) * (1 - prog(t, T.nefham + 0.42, T.nefham + 0.5, (x) => x)),
              border: `2px solid rgba(16,47,104,${0.08 * (1 - hero19)})`,
              boxShadow: `0 ${24 * hero19}px ${60 * hero19}px rgba(16,47,104,${0.22 * hero19 * (1 - morph)})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
              <span style={{fontSize: lerp(64, 196, hero19), fontWeight: lerp(500, 700, hero19), color: mix(C.navy, C.offWhite, hero19),
                opacity: 1 - prog(t, T.october + 0.62, T.october + 0.8), letterSpacing: 0}}>19</span>
            </div>
          )}
          <Txt y={680} size={66} reveal={prog(t, T.etnein - 0.05, T.etnein + 0.35, eOut)} op={1 - dateOut} dy={-30 * dateOut}>الاثنين</Txt>
          <Txt y={1242} size={66} reveal={prog(t, T.october - 0.05, T.october + 0.35, eOut)} op={1 - dateOut} dy={30 * dateOut}>أكتوبر</Txt>
        </AbsoluteFill>
      )}

      {/* ============ vascular health → habits (one camera) */}
      {t >= T.nefham + 0.38 && t < T.nekhtar + 1.0 && (
        <AbsoluteFill style={{opacity: figureOn}}>
          <Figure t={t} />
        </AbsoluteFill>
      )}

      {/* ============ nutrition tray tracks in */}
      {t >= T.nekhtar + 0.2 && t < T.ma3 + 0.4 && <Tray t={t} x={540 - 1150 * (1 - pan)} />}

      {/* topic anchor line */}
      {t >= T.nefham - 0.1 && t < T.ma3 + 0.4 && (
        <>
          <Txt y={470} size={66} {...titleA}>صحة الأوعية الدموية</Txt>
          <Txt y={556} size={46} weight={500} color={C.iveinIndigo} {...sub}>الدوالي: أعراضها والوقاية</Txt>
          <Txt y={470} size={66} {...titleB}>عادات صحية أثناء الشغل</Txt>
          <Txt y={600} size={66} {...titleC}>
            <span style={{color: C.wbsTeal}}>تغذية صحية</span> خلال يومك
          </Txt>
        </>
      )}

      {/* Powered by iVein: introduced with «بدعم من آيفين», carried into the vascular passage */}
      {t >= T.bed3am && chipOut < 1 && (
        <div style={{position: 'absolute', left: 540 - 175, top: chipCy - 112, width: 350, height: 224, transform: `scale(${chipScale})`,
          opacity: chipIn * (1 - chipOut), background: '#FFFFFF', borderRadius: 36, border: `2px solid rgba(0,165,223,0.30)`,
          boxShadow: '0 18px 40px rgba(16,47,104,0.10)'}}>
          <div style={{position: 'absolute', top: 22, width: '100%', textAlign: 'center', fontSize: 34, fontWeight: 500, color: C.iveinIndigo, letterSpacing: 0.5}}>
            Powered by
          </div>
          <Logo src="ivein-logo.png" w={230} cx={175} cy={138} ratio={R.ivein} clip={`inset(-5% ${(1 - iveinIn) * 100}% -5% -5%)`} />
        </div>
      )}

      {/* ============ Baheya: awareness and early detection */}
      {wipe > 0 && t < T.wasat2 + 0.7 && (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: `polygon(0px ${yL}px, 1080px ${yR}px, 1080px 2400px, 0px 2400px)`,
            background: `radial-gradient(ellipse 80% 45% at 50% 46%, #FFFFFF 0%, ${C.blush} 70%)`}}>
            <Ribbon t={t} />
            <div style={{position: 'absolute', left: 540 - 200, top: 330 - 120 + (1 - bahCard) * 40, width: 400, height: 240, borderRadius: 40, background: '#FFFFFF',
              opacity: clamp01(bahCard * 1.4), boxShadow: '0 20px 50px rgba(232,66,145,0.12)', border: '2px solid rgba(5,156,160,0.14)'}}>
              <Logo src="baheya-logo.png" w={300} cx={200} cy={120} ratio={R.baheya} />
            </div>
            <Txt y={1352} size={60} reveal={l1}>
              التوعية <span style={{color: C.baheyaTeal}}>بسرطان الثدي</span>
            </Txt>
            <Txt y={1450} size={60} reveal={l2}>
              أهمية <span style={{color: C.pink}}>الكشف المبكر</span>
            </Txt>
          </AbsoluteFill>
          {/* the pink band that leads the wipe */}
          <div style={{position: 'absolute', left: -200, top: wy - 46, width: 1480, height: 92, background: C.baheyaPink,
            transform: `rotate(${Math.atan(slope) * 57.2958}deg)`, transformOrigin: '50% 50%', opacity: 1 - prog(t, T.ma3 - 0.02, T.ma3 + 0.12)}} />
        </AbsoluteFill>
      )}

      {/* ============ closing: the day closes in, then makes room */}
      {t >= T.wasat2 - 0.15 && (
        <AbsoluteFill>
          <AbsoluteFill style={{background: C.offWhite, opacity: prog(t, T.wasat2 + 0.1, T.wasat2 + 0.4)}} />
          {/* ghost slots: the calm living background of the lockup */}
          <AbsoluteFill style={{opacity: ambient * 0.9}}>
            {CLOSE_LANES.map((lane, li) =>
              lane.map((b, i) => (
                <div key={`g${li}-${i}`} style={{position: 'absolute', left: b.x, top: b.y - (t - T.makan) * (6 + li * 2) + 120, width: b.w, height: b.h,
                  borderRadius: 26, border: '2px solid rgba(16,47,104,0.05)', background: 'rgba(22,175,224,0.025)'}} />
              ))
            )}
          </AbsoluteFill>
          {/* the slot that holds the message */}
          <div style={{position: 'absolute', left: 90, width: 900, top: headY - 100, height: 200, borderRadius: 44,
            background: C.pale, border: '2px solid rgba(22,175,224,0.22)', opacity: prog(t, T.sehetak2 + 0.05, T.sehetak2 + 0.45),
            boxShadow: `0 0 ${70 * ambient}px rgba(22,175,224,${0.12 + 0.05 * Math.sin((t - T.makan) * 1.6) * ambient})`}} />
          <Txt y={headY} size={96} weight={800} scale={lerp(0.94, 1, prog(t, T.sehetak2, T.sehetak2 + 0.5, eSoft))} op={prog(t, T.sehetak2 - 0.05, T.sehetak2 + 0.1)}>
            <span style={{color: C.wbsTeal}}>صحتك</span> ليها مكان.
          </Txt>
          {/* the two halves of the busy day */}
          {[0, 1].map((half) => (
            <div key={half} style={{position: 'absolute', inset: 0, transform: `translateY(${half ? lowerDy : upperDy}px)`, opacity: 1 - retreat * 0.6}}>
              <div style={{position: 'absolute', inset: 0, clipPath: half ? 'inset(960px 0 -2400px 0)' : 'inset(-2400px 0 960px 0)'}}>
                <div style={{position: 'absolute', left: 0, right: 0, top: half ? 960 : -1300, height: 2260, background: C.night,
                  transform: `translateY(${(half ? 1 : -1) * 1300 * (1 - enter(1))}px)`}} />
              </div>
              {CLOSE_GROUPS[half].map(({b, li}, i) => (
                <BlockView key={i} b={b} dy={(half ? 1 : -1) * 1300 * (1 - enter(li)) + CLOSE_DIR[li] * cs} />
              ))}
            </div>
          ))}
          <Txt y={960} size={70} color={C.offWhite} reveal={prog(t, T.wasat2 + 0.3, T.wasat2 + 0.8, eOut)}
            dy={upperDy - 1300 * (1 - enter(1))} op={1 - prog(t, T.sehetak2 - 0.04, T.sehetak2 + 0.2)}>
            وسط كل اللي مطلوب منك…
          </Txt>
          {/* lockup */}
          {lockWbs > 0 && (
            <Logo src="wbs-logo.png" w={320} cx={540} cy={392 + (1 - lockWbs) * 50} ratio={R.wbs} clip={`inset(${(1 - lockWbs) * 100}% -5% -5% -5%)`} />
          )}
          {lockBf > 0 && (
            <Logo src="breadfast-logo.png" w={260} cx={540} cy={596} ratio={R.breadfast} clip={`inset(-5% ${(1 - lockBf) * 100}% -5% -5%)`} />
          )}
          {pill > 0 && (
            <div style={{position: 'absolute', left: 540 - 270, width: 540, top: 985 - 48, height: 96, borderRadius: 48, background: C.navy,
              transform: `scaleX(${lerp(0.15, 1, pill)})`, opacity: clamp01(pill * 3)}} />
          )}
          <Txt y={985} size={52} weight={600} color={C.offWhite} reveal={pillTxt}>الاثنين 19 أكتوبر</Txt>
          <Txt y={1105} size={64} weight={700} color={C.wbsTeal} reveal={wait} dy={(1 - wait) * 20}>مستنيينكم</Txt>
          {card > 0 && (
            <div style={{position: 'absolute', left: 110, width: 860, top: 1200 + (1 - card) * 70, height: 250, borderRadius: 40, background: '#FFFFFF',
              opacity: clamp01(card * 1.5), boxShadow: '0 22px 60px rgba(16,47,104,0.10)', border: '2px solid rgba(16,47,104,0.06)'}}>
              <div style={{position: 'absolute', left: 429, top: 40, bottom: 40, width: 2, background: 'rgba(16,47,104,0.10)'}} />
              <div dir="rtl" style={{position: 'absolute', right: 0, width: 430, top: 28, textAlign: 'center', fontSize: 32, fontWeight: 500, color: C.navy, opacity: cardLogo(0)}}>بالتعاون مع</div>
              <Logo src="baheya-logo.png" w={210} cx={860 - 215} cy={152} ratio={R.baheya} style={{opacity: cardLogo(0)}} />
              <div style={{position: 'absolute', left: 0, width: 430, top: 30, textAlign: 'center', fontSize: 32, fontWeight: 500, color: C.iveinIndigo, opacity: cardLogo(0.12)}}>Powered by</div>
              <Logo src="ivein-logo.png" w={200} cx={215} cy={154} ratio={R.ivein} style={{opacity: cardLogo(0.12)}} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ============ opening (on top until the slot has filled the frame) */}
      {t < T.mobadra + 0.1 ? <Opening t={t} /> : <SlotHeadline t={t} />}
    </AbsoluteFill>
  );
};


