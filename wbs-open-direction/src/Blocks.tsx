import React from 'react';
import {rng} from './motion';

// A "workday" block: a calendar/task slot with abstract content bars (no fake text).
export type Block = {
  lane: number;
  x: number;
  y: number; // resting top
  w: number;
  h: number;
  fill: string;
  bars: number[]; // relative widths of content bars
  accent: boolean; // thin sky marker on the reading edge
  dot: boolean;
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
    bars: [0.55 + r() * 0.35, 0.3 + r() * 0.4, ...(h > 200 ? [0.25 + r() * 0.35] : [])],
    accent: r() < 0.35,
    dot: r() < 0.3,
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
}> = ({b, dy, barColor = 'rgba(255,255,255,0.13)', accentColor = 'rgba(22,175,224,0.75)', opacity = 1}) => {
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
      <div style={{position: 'absolute', right: 30, top: 30, left: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16}}>
        {b.bars.map((w, i) => (
          <div key={i} style={{width: `${w * 100}%`, height: i === 0 ? 18 : 12, borderRadius: 9, background: barColor}} />
        ))}
      </div>
      {b.dot && (
        <div style={{position: 'absolute', left: 30, bottom: 26, width: 30, height: 30, borderRadius: 15, background: barColor}} />
      )}
    </div>
  );
};
