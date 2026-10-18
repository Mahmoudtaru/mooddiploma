import React from 'react';
import {C} from './theme';
import {HALF, T} from './timing';
import {clamp01, eInOut, prog, springAt} from './motion';

// ---------- Nutrition: a lunch tray whose compartments are the day's "slots".
const Greens = () => (
  <g>
    <ellipse cx={0} cy={26} rx={78} ry={30} fill="#E7F4EC" />
    <path d="M-60 20 C-70 -30 -20 -50 0 -10 C-10 10 -40 26 -60 20Z" fill="#2E8F57" />
    <path d="M60 18 C78 -34 22 -58 2 -14 C10 8 40 24 60 18Z" fill="#43AE6E" />
    <path d="M-24 22 C-34 -52 30 -62 26 4 C16 22 -6 30 -24 22Z" fill="#7BC67E" />
    <path d="M-20 18 C-6 -6 8 -24 18 -40" stroke="#2E8F57" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);
const Bread = () => (
  <g>
    <path d="M-62 46 L-62 -10 C-84 -18 -82 -62 -40 -62 L40 -62 C82 -62 84 -18 62 -10 L62 46 Z" fill="#C98E43" />
    <path d="M-50 36 L-50 -14 C-68 -22 -64 -50 -36 -50 L36 -50 C64 -50 68 -22 50 -14 L50 36 Z" fill="#EFC77F" />
    {[[-20, -24], [14, -30], [-4, 0], [24, 8], [-28, 14]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={4} ry={2.4} fill="#C98E43" transform={`rotate(${i * 37} ${x} ${y})`} />
    ))}
  </g>
);
const Apple = () => (
  <g>
    <path d="M0 -36 C-30 -58 -74 -40 -70 4 C-66 44 -32 66 0 52 C32 66 66 44 70 4 C74 -40 30 -58 0 -36Z" fill={C.wbsCoral} />
    <path d="M-40 -18 C-46 -6 -46 8 -40 18" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M0 -38 C2 -52 6 -60 12 -66" stroke="#7A4A2A" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M8 -54 C24 -74 48 -68 50 -60 C36 -48 18 -46 8 -54Z" fill="#43AE6E" />
  </g>
);
const Water = () => (
  <g>
    <path d="M-44 -64 L44 -64 L36 62 C35 70 30 74 22 74 L-22 74 C-30 74 -35 70 -36 62 Z" fill="#FFFFFF" stroke="#BFE6F6" strokeWidth={5} />
    <path d="M-39 -14 L39 -14 L35 60 C34 66 30 69 24 69 L-24 69 C-30 69 -34 66 -35 60 Z" fill={C.sky} opacity={0.85} />
    <circle cx={-10} cy={30} r={5} fill="#FFFFFF" opacity={0.7} />
    <circle cx={12} cy={10} r={3.5} fill="#FFFFFF" opacity={0.7} />
    <circle cx={4} cy={-34} r={20} fill="#F5D44A" opacity={0.0} />
  </g>
);

export const Tray: React.FC<{t: number; x: number}> = ({t, x}) => {
  const W = 860;
  const H = 600;
  const cells = [
    {cx: -213, cy: -148, el: <Greens />, at: T.akl + 0.33},
    {cx: 213, cy: -148, el: <Bread />, at: T.akl + 0.33 + HALF},
    {cx: -213, cy: 148, el: <Apple />, at: T.akl + 0.33 + 2 * HALF},
    {cx: 213, cy: 148, el: <Water />, at: T.akl + 0.33 + 3 * HALF},
  ];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="trayShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor={C.navy} floodOpacity="0.12" />
        </filter>
      </defs>
      <g transform={`translate(${x} 1060)`}>
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={48} fill="#FFFFFF" filter="url(#trayShadow)" />
        {cells.map((c, i) => (
          <rect key={i} x={c.cx - 193} y={c.cy - 130} width={386} height={260} rx={32}
            fill={C.mint} stroke={C.wbsTeal} strokeOpacity={0.22} strokeWidth={3} />
        ))}
        {cells.map((c, i) => {
          const s = springAt(t, c.at, 11, 170);
          const drop = (1 - s) * -260;
          const squash = 1 + Math.max(0, Math.sin(clamp01((t - c.at - 0.12) / 0.25) * Math.PI)) * 0.06;
          const op = clamp01((t - c.at) / 0.08);
          return (
            <g key={i} transform={`translate(${c.cx} ${c.cy + drop}) scale(${1.45 * squash} ${1.45 / squash})`} opacity={op}>
              {c.el}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------- Awareness ribbon, drawn as one continuous gesture.
export const Ribbon: React.FC<{t: number}> = ({t}) => {
  const a = prog(t, T.ma3 + 0.05, T.ma3 + 0.5, eInOut);
  const b = prog(t, T.ma3 + 0.5, T.ma3 + 0.8, (x) => x);
  const c = prog(t, T.ma3 + 0.8, T.ma3 + 1.3, (x) => 1 - Math.pow(1 - x, 2.4));
  const breathe = 1 + 0.012 * Math.sin((t - T.ma3) * 2.2) * prog(t, T.ma3 + 1.3, T.ma3 + 2);
  const ring = (t0: number) => {
    const p = clamp01((t - t0) / 1.3);
    return p > 0 && p < 1 ? {r: 70 + 230 * (1 - Math.pow(1 - p, 2.5)), o: 0.55 * (1 - p)} : null;
  };
  const rings = [ring(T.kashf + 0.05), ring(T.kashf + 0.6)];
  const W = 62;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="rib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.baheyaPink} />
          <stop offset="1" stopColor={C.pink} />
        </linearGradient>
        <filter id="ribShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor={C.pink} floodOpacity="0.22" />
        </filter>
      </defs>
      <g transform={`translate(540 905) scale(${1.22 * breathe})`}>
        {rings.map((r, i) =>
          r ? <circle key={i} cx={0} cy={-150} r={r.r} fill="none" stroke={C.pink} strokeWidth={3} opacity={r.o} /> : null
        )}
        <g filter="url(#ribShadow)">
          <path d="M-150 262 C-60 120 60 -40 60 -140" fill="none" stroke="#D9628A" strokeWidth={W}
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - a} />
          <path d="M60 -140 C60 -236 -60 -236 -60 -140" fill="none" stroke="url(#rib)" strokeWidth={W}
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - b} />
          {c > 0 && (
            <>
              <path d="M-60 -140 C-60 -40 60 120 150 262" fill="none" stroke="rgba(120,20,60,0.18)" strokeWidth={W + 10}
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - c} />
              <path d="M-60 -140 C-60 -40 60 120 150 262" fill="none" stroke="url(#rib)" strokeWidth={W}
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - c} />
            </>
          )}
        </g>
      </g>
    </svg>
  );
};
