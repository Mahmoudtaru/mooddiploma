import React from 'react';
import {FONT} from './theme';
import {rng} from './motion';

// A "workday" block: a task card with a short title, a time / urgent / count tag,
// and bullet or checklist rows. Generic workday props only: no event facts.
export type Task = {title: string; tag: string; kind: 'time' | 'urgent' | 'count'};
export const TASKS: Task[] = [
  {title: 'اجتماع', tag: '10:00', kind: 'time'},
  {title: 'تقرير الشهر', tag: 'عاجل', kind: 'urgent'},
  {title: 'الإيميلات', tag: '24', kind: 'count'},
  {title: 'مكالمة', tag: '12:30', kind: 'time'},
  {title: 'الميزانية', tag: 'عاجل', kind: 'urgent'},
  {title: 'العرض', tag: '3:00', kind: 'time'},
  {title: 'الطلبات', tag: '8', kind: 'count'},
  {title: 'تسليم ملف', tag: 'عاجل', kind: 'urgent'},
  {title: 'مراجعة عقد', tag: '11:00', kind: 'time'},
  {title: 'الشيت', tag: '4:30', kind: 'time'},
  {title: 'متابعة', tag: '5', kind: 'count'},
  {title: 'مراجعة', tag: '2:00', kind: 'time'},
];

export type Block = {
  lane: number;
  x: number;
  y: number; // resting top
  w: number;
  h: number;
  fill: string;
  task: Task | null;
  list: 'bullets' | 'checks';
  rows: {w: number; done: boolean}[];
  accent: boolean; // thin sky marker on the reading edge
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
  let k = Math.floor(r() * TASKS.length);
  const mk = (y: number, h: number): Block => ({
    lane,
    x: LANE_X[lane],
    y,
    w: LANE_W,
    h,
    fill: fills[Math.floor(r() * fills.length)],
    task: TASKS[(k += 1 + Math.floor(r() * 3)) % TASKS.length],
    list: r() < 0.5 ? 'bullets' : 'checks',
    rows: Array.from({length: Math.max(1, Math.floor((h - 92) / 42))}, () => ({w: 0.45 + r() * 0.45, done: r() < 0.3})),
    accent: r() < 0.35,
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

const TAG_STYLE: Record<Task['kind'], React.CSSProperties> = {
  time: {background: 'rgba(22,175,224,0.22)', color: '#7FD3F2'},
  urgent: {background: 'rgba(243,123,81,0.26)', color: '#FFB394'},
  count: {background: '#F37B51', color: '#FFFFFF', minWidth: 34, justifyContent: 'center'},
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
        fontFamily: FONT,
      }}
    >
      {b.accent && (
        <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 7, background: accentColor}} />
      )}
      {/* header: task title + tag */}
      <div dir="rtl" style={{position: 'absolute', right: 28, top: 22, left: 24, height: 44, display: 'flex', alignItems: 'center', gap: 10}}>
        {b.task ? (
          <>
            <div style={{flex: '1 1 auto', minWidth: 0, fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden'}}>
              {b.task.title}
            </div>
            <div style={{flex: '0 0 auto', display: 'flex', alignItems: 'center', height: 32, padding: '0 11px', borderRadius: 16,
              fontSize: 20, fontWeight: 600, lineHeight: 1, ...TAG_STYLE[b.task.kind]}}>
              {b.task.tag}
            </div>
          </>
        ) : (
          <div style={{width: '62%', height: 18, borderRadius: 9, background: barColor}} />
        )}
      </div>
      {/* bullet points or checklist rows */}
      {b.rows.map((row, i) => (
        <div key={i} style={{position: 'absolute', right: 30, left: 30, top: 86 + i * 42, height: 26, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 14}}>
          {b.list === 'bullets' ? (
            <div style={{width: 10, height: 10, flex: '0 0 10px', borderRadius: 5, background: 'rgba(255,255,255,0.55)', margin: '0 8px'}} />
          ) : (
            <div style={{width: 26, height: 26, flex: '0 0 26px', borderRadius: 8, boxSizing: 'border-box',
              border: row.done ? 'none' : `3px solid ${boxColor}`, background: row.done ? accentColor : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {row.done && (
                <svg width={16} height={16} viewBox="0 0 16 16"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
          )}
          <div style={{width: `${row.w * 100}%`, height: 12, borderRadius: 6, background: barColor, opacity: row.done ? 0.55 : 1}} />
        </div>
      ))}
    </div>
  );
};
