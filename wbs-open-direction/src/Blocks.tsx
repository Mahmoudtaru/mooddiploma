import React from 'react';
import {rng} from './motion';

// A "workday" block: a to-do card — header line, then checkbox rows (no fake text).
export type Block = {
  lane: number;
  x: number;
  y: number; // resting top
  w: number;
  h: number;
  fill: string;
  head: number; // relative width of the header line
  rows: {w: number; done: boolean}[]; // checklist rows
  accent: boolean; // thin sky marker on the reading edge
  flag: string | null; // priority dot colour
};

export const LANE_W = 300;
export const LANE_GAP = 30;
export const LANE_X = [60, 60 + LANE_W + LANE_GAP, 60 + 2 * (LANE_W + LANE_GAP)];
const HEIGHTS = [150, 210, 270, 180, 330, 240];

export const makeLane = (
  lane: number,
  seed: number,
  from: number,
  to: number,
  fills: string[],
  insert?: {top: number; h: number}
): Block[] => {
  const r = rng(seed);
  const out: Block[] = [];
  const mk = (y: number, h: number): Block => ({
    lane,
    x: LANE_X[lane],
    y,
    w: LANE_W,
    h,
    fill: fills[Math.floor(r() * fills.length)],
    head: 0.45 + r() * 0.3,
    rows: Array.from({length: Math.max(1, Math.floor((h - 78) / 46))}, () => ({w: 0.4 + r() * 0.5, done: r() < 0.28})),
    accent: r() < 0.35,
    flag: r() < 0.45 ? (r() < 0.5 ? '#F37B51' : '#16AFE0') : null,
  });
  if (!insert) {
    let y = from;
    while (y < to) {
      const h = HEIGHTS[Math.floor(r() * HEIGHTS.length)];
      out.push(mk(y, h));
      y += h + LANE_GAP;
    }
    return out;
  }
  // build around a fixed hero slot
  let y = insert.top - LANE_GAP;
  const before: Block[] = [];
  while (y > from) {
    const h = HEIGHTS[Math.floor(r() * HEIGHTS.length)];
    before.unshift(mk(y - h, h));
    y -= h + LANE_GAP;
  }
  out.push(...before);
  y = insert.top + insert.h + LANE_GAP;
  while (y < to) {
    const h = HEIGHTS[Math.floor(r() * HEIGHTS.length)];
    out.push(mk(y, h));
    y += h + LANE_GAP;
  }
  return out;
};

export const BlockView: React.FC<{
  b: Block;
  dy: number;
  barColor?: string;
  accentColor?: string;
  opacity?: number;
}> = ({b, dy, barColor = 'rgba(255,255,255,0.2)', accentColor = 'rgba(22,175,224,0.85)', opacity = 1}) => {
  const boxColor = 'rgba(255,255,255,0.32)';
  const top = b.y + dy;
  if (top > 2000 || top + b.h < -80) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top,
        width: b.w,
        height: b.h,
        borderRadius: 26,
        background: b.fill,
        opacity,
        overflow: 'hidden',
      }}
    >
      {b.accent && (
        <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 7, background: accentColor}} />
      )}
      {/* header: title line + priority dot */}
      <div style={{position: 'absolute', right: 30, top: 28, left: 30, height: 20, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 14}}>
        <div style={{width: `${b.head * 100}%`, height: 18, borderRadius: 9, background: barColor}} />
        {b.flag && <div style={{width: 16, height: 16, borderRadius: 8, background: b.flag, opacity: 0.9}} />}
      </div>
      {/* checklist rows */}
      {b.rows.map((row, i) => (
        <div key={i} style={{position: 'absolute', right: 30, left: 30, top: 74 + i * 46, height: 26, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 16}}>
          <div style={{width: 26, height: 26, flex: '0 0 26px', borderRadius: 8, boxSizing: 'border-box',
            border: row.done ? 'none' : `3px solid ${boxColor}`, background: row.done ? accentColor : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {row.done && (
              <svg width={16} height={16} viewBox="0 0 16 16"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </div>
          <div style={{width: `${row.w * 100}%`, height: 12, borderRadius: 6, background: barColor, opacity: row.done ? 0.55 : 1}} />
        </div>
      ))}
    </div>
  );
};
