import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Easing vocabulary: soft deceleration for arrivals, controlled acceleration for exits.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 0.85, 0.3);
export const easeSettle = Easing.bezier(0.22, 1, 0.36, 1);

export const useTime = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return frame / fps;
};

/** 0→1 progress of a timed move, clamped. */
export const prog = (t: number, start: number, dur: number, ease = easeOut) =>
	dur <= 0
		? Number(t >= start)
		: interpolate(t, [start, start + dur], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: ease,
	});

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Scene container. The film's main transition language: the outgoing scene lifts
 * up and clears (the day moves on), the incoming one rises in from below.
 */
export const Scene: React.FC<{
	from: number;
	to: number;
	exit?: number;
	exitLift?: number;
	children: React.ReactNode;
}> = ({from, to, exit = 0.32, exitLift = 90, children}) => {
	const t = useTime();
	if (t < from - 0.001 || t > to + 0.001) return null;
	const out = prog(t, to - exit, exit, easeIn);
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				opacity: 1 - out,
				transform: `translateY(${-exitLift * out}px)`,
			}}
		>
			{children}
		</div>
	);
};

/**
 * Line reveal for Arabic: the whole shaped line rises while a mask opens in reading
 * direction (right→left). Letters are never split; the mask has vertical slack so dots
 * and diacritics are never clipped.
 */
export const Reveal: React.FC<{
	at: number;
	dur?: number;
	rise?: number;
	dir?: 'rtl' | 'ltr' | 'none';
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({at, dur = 0.6, rise = 34, dir = 'rtl', style, children}) => {
	const t = useTime();
	const p = prog(t, at, dur, easeOut);
	const m = prog(t, at, dur * 0.85, easeInOut);
	const clip =
		dir === 'rtl'
			? `inset(-40% -5% -40% ${(1 - m) * 105 - 5}%)`
			: dir === 'ltr'
				? `inset(-40% ${(1 - m) * 105 - 5}% -40% -5%)`
				: undefined;
	return (
		<div
			style={{
				opacity: Math.min(1, p * 1.6),
				transform: `translateY(${rise * (1 - p)}px)`,
				clipPath: clip,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** Absolutely positioned box whose centre sits at (x, y). */
export const At: React.FC<{x: number; y: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	x,
	y,
	style,
	children,
}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...style}}>{children}</div>
);
