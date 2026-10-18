import React from 'react';
import {C} from './theme';
import {T} from './timing';
import {clamp01, eInOut, eOut, lerp, mix, prog} from './motion';

// The worker at a desk, drawn in world units. The close-up of the shin (zoom 5)
// is the vein passage; pulling back reveals the person (habits passage).
const RAD = Math.PI / 180;
const K = {x: -200, y: 0}; // knee (fixed)
const A = {x: -200, y: 190}; // ankle (fixed)
const THIGH = 200;
const TORSO = 225;
const UPPER = 112;
const FORE = 108;
const LIMB = 46;

const pt = (o: {x: number; y: number}, len: number, deg: number) => ({
  x: o.x + len * Math.cos(deg * RAD),
  y: o.y + len * Math.sin(deg * RAD),
});

export const CAM_CLOSE = {zoom: 5, wx: -200, wy: 95, sx: 540, sy: 1330};
const CAM_FAR = {zoom: 1.02, wx: -200, wy: -190, sx: 540, sy: 1115};

// vein centre-line in world units, from ankle (s=0) to knee (s=1)
const veinX = (y: number, v: number) => {
  const env = Math.sin(clamp01((y - 38) / 124) * Math.PI);
  return -205 + v * env * (Math.sin(((y - 38) / 124) * Math.PI * 3) * 10 + 3);
};
const veinAt = (s: number, v: number) => {
  const y = 186 - 180 * s;
  return {x: veinX(y, v), y};
};

// integrated flow phase (speed varies with the story)
const flowSpeed = (t: number, v: number) => {
  if (t < T.nefham + 0.7) return 0;
  const base = t < T.wiqaya + 0.4 ? 0.42 : lerp(0.42, 0.78, prog(t, T.wiqaya + 0.4, T.wiqaya + 0.9));
  return base * (1 - 0.8 * v);
};

export const varicose = (t: number) =>
  prog(t, T.dawaly, T.dawaly + 0.6, eInOut) * (1 - prog(t, T.wiqaya, T.wiqaya + 0.55, eOut));

export const Figure: React.FC<{t: number}> = ({t}) => {
  const v = varicose(t);
  // ---- camera
  const pull = prog(t, T.nraja3 + 0.25, T.nraja3 + 1.05, eInOut);
  const zoom = Math.exp(lerp(Math.log(CAM_CLOSE.zoom), Math.log(CAM_FAR.zoom), pull));
  const pan = prog(t, T.nekhtar + 0.2, T.nekhtar + 0.85, eInOut);
  const wx = lerp(CAM_CLOSE.wx, CAM_FAR.wx, pull);
  const wy = lerp(CAM_CLOSE.wy, CAM_FAR.wy, pull);
  const sx = lerp(CAM_CLOSE.sx, CAM_FAR.sx, pull) + 1150 * pan;
  const sy = lerp(CAM_CLOSE.sy, CAM_FAR.sy, pull);

  // ---- pose
  const grow = prog(t, T.nefham + 0.4, T.nefham + 0.85, eOut);
  const stand = prog(t, T.adatna - 0.1, T.adatna + 0.55, eInOut);
  const stretch = prog(t, T.adatna + 0.5, T.adatna + 0.95, eOut) * (1 - prog(t, T.nekhtar + 0.3, T.nekhtar + 0.8));
  const thighA = lerp(0, -90, stand);
  const hip = pt(K, THIGH, thighA);
  const torsoA = lerp(-95, -90, stand) - 26 * Math.sin(Math.PI * stand);
  const sh = pt(hip, TORSO, torsoA);
  const head = pt(sh, 84, torsoA);
  const upA = lerp(lerp(112, 96, stand), -118, stretch);
  const foA = lerp(lerp(186, 101, stand), -100, stretch);
  const el = pt(sh, UPPER, upA);
  const hand = pt(el, FORE, foA);
  const elF = pt({x: sh.x + 12, y: sh.y - 4}, UPPER, upA + 9);
  const handF = pt(elF, FORE, foA + 9);
  const hipF = {x: hip.x + lerp(10, 22, stand), y: hip.y - lerp(6, 0, stand)};
  const kneeF = {x: K.x + lerp(10, 22, stand), y: K.y - lerp(6, 0, stand)};
  const ankF = {x: A.x + 22 * stand + 10 * (1 - stand), y: A.y};

  const thighEnd = {x: lerp(K.x, hip.x, grow), y: lerp(K.y, hip.y, grow)};
  const toe = {x: A.x - 64 * grow, y: A.y};
  const world = prog(t, T.nraja3 + 0.55, T.nraja3 + 1.0); // desk, stool, rest of body
  const pz = 1 + (CAM_CLOSE.zoom / zoom - 1) * 0.45; // particles stay legible when pulled back

  // ---- flow particles
  let phase = 0;
  const dt = 1 / 60;
  for (let s = T.nefham; s < t; s += dt) phase += flowSpeed(s, varicose(s)) * dt;
  const N = 12;
  const parts = Array.from({length: N}, (_, i) => {
    let s = (i / N + phase) % 1;
    const inBulge = s > 0.15 && s < 0.82;
    if (inBulge && v > 0) s += Math.sin(t * 9 + i * 1.7) * 0.004 * v;
    const p = veinAt(s, v);
    const fade = Math.min(1, s / 0.08, (1 - s) / 0.08);
    return {p, fade, i};
  });

  const veinPath = Array.from({length: 46}, (_, i) => {
    const y = 186 - i * 4;
    return `${i ? 'L' : 'M'}${veinX(y, v).toFixed(2)} ${y}`;
  }).join(' ');
  const veinDraw = prog(t, T.nefham + 0.45, T.nefham + 1.0, eOut);
  const veinCol = mix(C.iveinCyan, '#5A3E9E', v);
  const flash = (s0: number) => Math.max(0, 1 - Math.abs(t - (T.wiqaya + 0.25 + s0 * 0.5)) / 0.18);

  const limb = (a: {x: number; y: number}, b: {x: number; y: number}, col = '#FFFFFF', w = LIMB) => (
    <>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(16,47,104,0.30)" strokeWidth={w + 7} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth={w} strokeLinecap="round" />
    </>
  );
  const far = '#C4DCF0';

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor={C.navy} floodOpacity="0.13" />
        </filter>
        <radialGradient id="heavy">
          <stop offset="0" stopColor="#5A3E9E" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5A3E9E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${sx} ${sy}) scale(${zoom}) translate(${-wx} ${-wy})`}>
        {/* floor + desk + stool */}
        <g opacity={world}>
          <line x1={-700} y1={214} x2={420} y2={214} stroke={C.navy} strokeOpacity={0.12} strokeWidth={4} />
          <line x1={-470} y1={-80} x2={-470} y2={212} stroke="#2A4F8F" strokeWidth={12} strokeLinecap="round" />
          <line x1={-160} y1={-80} x2={-160} y2={212} stroke="#2A4F8F" strokeWidth={12} strokeLinecap="round" />
          <line x1={-505} y1={-80} x2={-128} y2={-80} stroke={C.navy} strokeWidth={16} strokeLinecap="round" />
          <line x1={-345} y1={-96} x2={-185} y2={-96} stroke={C.navy} strokeWidth={9} strokeLinecap="round" />
          <line x1={-345} y1={-96} x2={-372} y2={-214} stroke={C.navy} strokeWidth={11} strokeLinecap="round" />
          <line x1={-352} y1={-118} x2={-370} y2={-196} stroke={C.sky} strokeWidth={4} strokeLinecap="round" />
          <rect x={-22} y={26} width={150} height={186} rx={24} fill={C.sky} />
          <rect x={-22} y={26} width={150} height={20} rx={10} fill="#FFFFFF" opacity={0.35} />
        </g>
        <g filter="url(#soft)">
          {/* far side limbs */}
          <g opacity={world}>
            {limb(sh, elF, far)}
            {limb(elF, handF, far)}
            {limb(hipF, kneeF, far)}
            {limb(kneeF, ankF, far)}
            {limb(ankF, {x: ankF.x - 64, y: ankF.y}, far)}
          </g>
          {/* near leg: always present (it is the close-up) */}
          {grow > 0 && limb(K, thighEnd)}
          {limb(K, A)}
          {grow > 0 && limb(A, toe)}
          <g opacity={world}>
            {limb(hip, sh, '#FFFFFF', 66)}
            <circle cx={head.x} cy={head.y} r={57.5} fill="rgba(16,47,104,0.30)" />
            <circle cx={head.x} cy={head.y} r={54} fill="#FFFFFF" />
            {limb(sh, el)}
            {limb(el, hand)}
          </g>
        </g>
        {/* the vein inside the near shin */}
        <circle cx={-203} cy={100} r={78} fill="url(#heavy)" opacity={v * (0.7 + 0.3 * Math.sin(t * 7))} />
        <path d={veinPath} fill="none" stroke={veinCol} strokeOpacity={0.22} strokeWidth={9 + 4 * v} strokeLinecap="round"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - veinDraw} />
        <path d={veinPath} fill="none" stroke={veinCol} strokeWidth={4.4 + 2.2 * v} strokeLinecap="round"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - veinDraw} />
        {[0.22, 0.5, 0.78].map((s, i) => {
          const p = veinAt(s, v);
          const open = 3.6 + 3 * v;
          const f = flash(i);
          return (
            <path key={i} d={`M${p.x - open} ${p.y + 3.2} L${p.x} ${p.y - 1.6} L${p.x + open} ${p.y + 3.2}`}
              fill="none" stroke={mix('#FFFFFF', C.sky, f)} strokeWidth={1.3 + f * 0.8} strokeLinecap="round"
              opacity={veinDraw * (0.75 - 0.35 * v + 0.25 * f)} />
          );
        })}
        {parts.map(({p, fade, i}) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={1.5 * pz} ry={3.2 * pz} fill={mix('#FFFFFF', '#CBB8F0', v)}
            opacity={fade * prog(t, T.nefham + 0.8, T.nefham + 1.0)} />
        ))}
      </g>
    </svg>
  );
};
