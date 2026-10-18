import {Easing, interpolateColors, spring} from 'remotion';
import {FPS} from './timing';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// A small, consistent easing vocabulary.
export const eOut = Easing.bezier(0.16, 1, 0.3, 1); // decisive arrival
export const eInOut = Easing.bezier(0.65, 0, 0.35, 1); // travel / camera
export const eIn = Easing.bezier(0.55, 0, 0.8, 0.2); // exits
export const eSoft = Easing.bezier(0.33, 0, 0.2, 1); // gentle settle

export const prog = (t: number, a: number, b: number, ease: (x: number) => number = eInOut) =>
  ease(clamp01((t - a) / (b - a)));

export const springAt = (t: number, t0: number, damping = 15, stiffness = 140, mass = 1) =>
  t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: {damping, stiffness, mass}});

export const mix = (a: string, b: string, p: number) => interpolateColors(clamp01(p), [0, 1], [a, b]);

// Deterministic PRNG so every render is identical.
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
