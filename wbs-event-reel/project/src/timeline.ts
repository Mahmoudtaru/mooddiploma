import data from './timeline.json';

export const FPS = 60;
export const DURATION_S = data.duration;
export const DURATION_FRAMES = Math.ceil(DURATION_S * FPS); // 1500
export const A = data.anchors;
export const S = data.scenes as unknown as Record<string, [number, number]>;
export const SPEECH = data.speech;
