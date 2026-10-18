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
	enter?: boolean;
	children: React.ReactNode;
}> = ({from, to, exit = 0.5, enter = true, children}) => {
	const t = useTime();
	if (t < from - 0.001 || t > to + 0.001) return null;
	// Scenes overlap: the outgoing one lifts away while the incoming one is already rising,
	// so the film reads as one continuous upward flow rather than separate cards.
	const inP = enter ? prog(t, from, 0.65, easeOut) : 1;
	const out = exit > 0 ? prog(t, to - exit, exit, easeIn) : 0;
	// slow, constant camera push while a scene holds, so nothing ever sits dead still
	const drift = 1 + 0.022 * Math.min(1, Math.max(0, (t - from) / Math.max(1, to - from)));
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				opacity: Math.min(1, inP * 1.4) * (1 - out),
				transform: `translateY(${150 * (1 - inP) - 150 * out}px) scale(${drift})`,
				transformOrigin: '505px 900px',
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

type Part = string | {t: string; c?: string};

/**
 * Kinetic headline: whole Arabic words (each keeps its connected shaping) arrive in reading
 * order with a soft rise and a short defocus-to-sharp. Settled text is static and crisp.
 */
export const Words: React.FC<{
	at: number;
	parts: Part[];
	size: number;
	weight?: number;
	color?: string;
	font?: string;
	stagger?: number;
	dur?: number;
	rise?: number;
}> = ({at, parts, size, weight = 800, color = '#102F68', font = 'Alexandria, sans-serif', stagger = 0.09, dur = 0.75, rise = 46}) => {
	const t = useTime();
	const words: {w: string; c: string}[] = [];
	parts.forEach((p) => {
		const text = typeof p === 'string' ? p : p.t;
		const c = typeof p === 'string' ? color : p.c ?? color;
		text.split(' ').filter(Boolean).forEach((w) => words.push({w, c}));
	});
	return (
		<div dir="rtl" style={{display: 'flex', gap: size * 0.26, justifyContent: 'center', whiteSpace: 'nowrap'}}>
			{words.map(({w, c}, i) => {
				const p = prog(t, at + i * stagger, dur, easeOut);
				const blur = (1 - Math.min(1, p * 1.5)) * 10;
				return (
					<div
						key={i}
						style={{
							fontFamily: font,
							fontWeight: weight,
							fontSize: size,
							lineHeight: 1.45,
							color: c,
							opacity: Math.min(1, p * 1.8),
							transform: `translateY(${rise * (1 - p)}px) scale(${0.94 + 0.06 * p})`,
							filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
						}}
					>
						{w}
					</div>
				);
			})}
		</div>
	);
};
