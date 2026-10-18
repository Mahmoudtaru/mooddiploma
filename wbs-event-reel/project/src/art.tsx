import React from 'react';
import {Img, staticFile} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {C, FONT_BODY} from './theme';
import {mix} from './motion';

/* ───────────────────────── Background: banner-derived corner waves ───────────────────────── */

export const Background: React.FC<{t: number; pink: number}> = ({t, pink}) => {
	const d1 = Math.sin(t * 0.45) * 10;
	const d2 = Math.cos(t * 0.38) * 12;
	const corner = (tint: number, fillA: string, fillB: string, lineA: string, lineB: string) => (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: tint}}>
			<defs>
				<linearGradient id={`g${fillA}`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor={fillA} />
					<stop offset="1" stopColor={fillB} />
				</linearGradient>
			</defs>
			{/* corner accents kept inside the margins: top-left above y≈270, bottom-right below y≈1600 */}
			<g transform={`translate(${d1 * 0.5}, ${d1 * 0.4})`}>
				<path d="M0 0 H560 C470 58 360 92 250 136 C150 176 70 214 0 270 Z" fill={`url(#g${fillA})`} />
				<path d="M-20 300 C90 222 190 176 300 132 C420 84 520 46 600 -10" fill="none" stroke={lineA} strokeWidth={2.5} opacity={0.55} />
				<path d="M-20 336 C100 250 210 202 330 156 C450 110 560 70 650 6" fill="none" stroke={lineB} strokeWidth={2} opacity={0.3} />
			</g>
			<g transform={`translate(${d2 * 0.5}, ${d2 * 0.4})`}>
				<path d="M1080 1920 H500 C590 1858 700 1826 810 1780 C920 1734 1005 1688 1080 1612 Z" fill={`url(#g${fillA})`} />
				<path d="M1100 1588 C1010 1680 910 1740 790 1790 C670 1840 560 1880 460 1940" fill="none" stroke={lineA} strokeWidth={2.5} opacity={0.55} />
				<path d="M1100 1552 C1000 1652 890 1716 770 1764 C650 1812 530 1856 420 1930" fill="none" stroke={lineB} strokeWidth={2} opacity={0.3} />
			</g>
		</svg>
	);
	return (
		<div style={{position: 'absolute', inset: 0, background: C.offWhite}}>
			{corner(1 - pink, '#DDF1FB', '#F5FBFE', C.sky, C.navy)}
			{pink > 0 ? corner(pink, '#FBE1EE', '#FEF6FA', C.pink, C.navy) : null}
		</div>
	);
};

/* ───────────────────────── Text ───────────────────────── */

export const T: React.FC<{
	size: number;
	color?: string;
	weight?: number;
	font?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({size, color = C.navy, weight = 700, font = 'Alexandria, sans-serif', style, children}) => (
	<div
		dir="rtl"
		style={{
			fontFamily: font,
			fontSize: size,
			fontWeight: weight,
			color,
			lineHeight: 1.45,
			whiteSpace: 'nowrap',
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; dir?: 'rtl' | 'ltr'}> = ({
	children,
	size = 30,
	color = C.navy,
	dir = 'rtl',
}) => (
	<div dir={dir} style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: size, color, lineHeight: 1.3, whiteSpace: 'nowrap', textAlign: 'center'}}>
		{children}
	</div>
);

/* ───────────────────────── Logos (exact supplied rasters) ───────────────────────── */

// Native pixel sizes of the supplied files, so display sizes stay near 1:1.
export const LOGO = {
	wbs: {file: 'logos/wbs.png', w: 869, h: 751},
	breadfast: {file: 'logos/breadfast.png', w: 404, h: 127},
	ivein: {file: 'logos/ivein.png', w: 305, h: 158},
	baheya: {file: 'logos/baheya.png', w: 319, h: 164},
} as const;

export const Logo: React.FC<{name: keyof typeof LOGO; width: number; style?: React.CSSProperties}> = ({name, width, style}) => {
	const l = LOGO[name];
	return (
		<Img
			src={staticFile(l.file)}
			style={{width, height: (width * l.h) / l.w, display: 'block', ...style}}
		/>
	);
};

/* ───────────────────────── Drawing helpers ───────────────────────── */

export const Drawn: React.FC<{
	d: string;
	p: number;
	stroke: string;
	width: number;
	opacity?: number;
	cap?: 'round' | 'butt';
}> = ({d, p, stroke, width, opacity = 1, cap = 'round'}) => {
	if (p <= 0) return null;
	const ev = evolvePath(Math.min(1, p), d);
	return (
		<path
			d={d}
			fill="none"
			stroke={stroke}
			strokeWidth={width}
			strokeLinecap={cap}
			strokeLinejoin="round"
			strokeDasharray={ev.strokeDasharray}
			strokeDashoffset={ev.strokeDashoffset}
			opacity={opacity}
		/>
	);
};

export const HEART = 'M0 34 C-30 10 -62 -8 -62 -40 C-62 -64 -44 -80 -22 -80 C-10 -80 -2 -73 0 -64 C2 -73 10 -80 22 -80 C44 -80 62 -64 62 -40 C62 -8 30 10 0 34 Z';
export const PULSE = 'M-54 -36 H-24 L-12 -58 L4 -12 L14 -36 H54';

/* ───────────────────────── The working figure (articulated, side view) ───────────────────────── */

type Pt = [number, number];
export type Pose = {
	hip: Pt;
	knee: Pt;
	ankle: Pt;
	toe: Pt;
	shoulder: Pt;
	head: Pt;
	elbow: Pt;
	hand: Pt;
	elbow2: Pt;
	hand2: Pt;
};

export const POSES: Record<string, Pose> = {
	typing: {
		hip: [560, 492], knee: [418, 498], ankle: [428, 738], toe: [372, 752],
		shoulder: [578, 282], head: [566, 206], elbow: [508, 392], hand: [356, 410],
		elbow2: [520, 386], hand2: [372, 404],
	},
	slumped: {
		hip: [565, 495], knee: [420, 500], ankle: [430, 738], toe: [374, 752],
		shoulder: [520, 314], head: [468, 262], elbow: [470, 404], hand: [338, 414],
		elbow2: [482, 398], hand2: [352, 410],
	},
	upright: {
		hip: [560, 492], knee: [418, 498], ankle: [428, 738], toe: [372, 752],
		shoulder: [586, 276], head: [584, 196], elbow: [528, 388], hand: [372, 404],
		elbow2: [540, 382], hand2: [386, 400],
	},
	relaxed: {
		hip: [560, 492], knee: [418, 498], ankle: [428, 738], toe: [372, 752],
		shoulder: [590, 278], head: [596, 200], elbow: [556, 396], hand: [470, 452],
		elbow2: [566, 392], hand2: [480, 446],
	},
	standing: {
		hip: [486, 470], knee: [482, 612], ankle: [486, 750], toe: [430, 758],
		shoulder: [490, 252], head: [490, 172], elbow: [530, 150], hand: [548, 62],
		elbow2: [452, 150], hand2: [436, 62],
	},
};

export const lerpPose = (a: Pose, b: Pose, p: number): Pose => {
	const out = {} as Pose;
	(Object.keys(a) as (keyof Pose)[]).forEach((k) => {
		out[k] = [mix(a[k][0], b[k][0], p), mix(a[k][1], b[k][1], p)];
	});
	return out;
};

const seg = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');

export const DeskScene: React.FC<{
	pose: Pose;
	screenGlow?: number;
	laptopLift?: number;
	chairShift?: number;
	children?: React.ReactNode;
}> = ({pose, screenGlow = 0, laptopLift = 0, chairShift = 0, children}) => {
	const L = laptopLift;
	return (
		<svg viewBox="0 0 800 800" width={800} height={800} style={{overflow: 'visible'}}>
			{/* floor + soft contact shadows for depth */}
			<path d="M20 762 H780" stroke={C.paleLine} strokeWidth={6} strokeLinecap="round" />
			<ellipse cx={210} cy={764} rx={190} ry={12} fill={C.navy} opacity={0.06} />
			<ellipse cx={(pose.ankle[0] + 560) / 2} cy={764} rx={150} ry={12} fill={C.navy} opacity={0.08} />
			<path d="M40 438 H380 V452 H40 Z" fill={C.pale} />
			{/* desk */}
			<path d="M40 430 H380" stroke={C.navy} strokeWidth={14} strokeLinecap="round" />
			<path d="M72 436 V760 M350 436 V760" stroke={C.navy} strokeWidth={10} strokeLinecap="round" />
			{/* laptop stand (appears with good posture) */}
			{L > 0 ? (
				<path d={`M190 ${430 - 6} L210 ${430 - 46 * L} H300 L320 ${430 - 6}`} fill="none" stroke={C.sky} strokeWidth={8} strokeLinejoin="round" opacity={Math.min(1, L * 2)} />
			) : null}
			<g transform={`translate(0 ${-46 * L})`}>
				<path d="M150 422 H332" stroke={C.navy} strokeWidth={10} strokeLinecap="round" />
				<path d="M156 420 L112 262" stroke={C.navy} strokeWidth={14} strokeLinecap="round" />
				<path d="M150 404 L112 268" stroke={C.sky} strokeWidth={4} strokeLinecap="round" opacity={0.25 + 0.6 * screenGlow} />
			</g>
			{/* mug */}
			<path d="M56 392 h40 v26 a8 8 0 0 1 -8 8 h-24 a8 8 0 0 1 -8 -8 z" fill={C.pale} stroke={C.navy} strokeWidth={6} />
			{/* chair (pushed back when the figure stands) */}
			<g transform={`translate(${90 * chairShift} 0)`}>
				<path d="M476 524 H650" stroke={C.navy} strokeWidth={12} strokeLinecap="round" />
				<path d="M650 524 L672 330" stroke={C.navy} strokeWidth={12} strokeLinecap="round" />
				<path d="M500 530 L488 760 M630 530 L640 760" stroke={C.navy} strokeWidth={9} strokeLinecap="round" />
			</g>
			{/* far arm */}
			<path d={seg([pose.shoulder, pose.elbow2, pose.hand2])} fill="none" stroke="#7FCDEB" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
			{/* legs */}
			<path d={seg([pose.hip, pose.knee, pose.ankle, pose.toe])} fill="none" stroke={C.navy} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
			{/* torso */}
			<path d={seg([pose.hip, pose.shoulder])} fill="none" stroke={C.sky} strokeWidth={66} strokeLinecap="round" />
			{/* head */}
			<circle cx={pose.head[0]} cy={pose.head[1]} r={46} fill={C.skin} stroke={C.navy} strokeWidth={7} />
			<path
				d={`M${pose.head[0] - 47} ${pose.head[1] - 2} A47 47 0 0 1 ${pose.head[0] + 47} ${pose.head[1] - 2} Q${pose.head[0] + 6} ${pose.head[1] - 26} ${pose.head[0] - 47} ${pose.head[1] - 2} Z`}
				fill={C.navy}
			/>
			{/* near arm */}
			<path d={seg([pose.shoulder, pose.elbow, pose.hand])} fill="none" stroke={C.sky} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
			<path d={seg([pose.shoulder, pose.elbow, pose.hand])} fill="none" stroke={C.navy} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.0} />
			<circle cx={pose.hand[0]} cy={pose.hand[1]} r={14} fill={C.skin} />
			{children}
		</svg>
	);
};

/* ───────────────────────── Leg with upward venous flow ───────────────────────── */

export const LEG_OUTLINE =
	'M150 40 C120 200 112 320 140 440 C150 480 142 520 136 560 C126 680 150 760 160 800 C120 820 62 830 42 850 C26 866 40 886 72 886 L262 886 C286 886 292 860 282 830 C272 800 270 760 276 720 C300 620 322 560 302 480 C292 440 300 400 312 360 C332 260 332 140 320 40';
export const VEIN = 'M222 812 C236 712 196 650 222 566 C248 486 202 420 224 338 C244 262 214 162 236 30';
export const VEIN_B1 = 'M222 566 C190 540 176 510 172 480';
export const VEIN_B2 = 'M224 338 C256 312 270 290 274 262';

export const Leg: React.FC<{draw: number; veinP: number; flowT: number; ring: number}> = ({draw, veinP, flowT, ring}) => (
	<svg viewBox="0 0 400 960" width={400} height={960} style={{overflow: 'visible'}}>
		<ellipse cx={160} cy={892} rx={150} ry={14} fill={C.navy} opacity={0.07 * Math.min(1, draw * 1.4)} />
		<path d={LEG_OUTLINE + ' Z'} fill={C.pale} opacity={Math.min(1, draw * 1.4)} />
		<Drawn d={LEG_OUTLINE} p={draw} stroke={C.navy} width={8} />
		<Drawn d={VEIN} p={veinP} stroke={C.sky} width={10} />
		<Drawn d={VEIN_B1} p={(veinP - 0.45) * 2.2} stroke={C.sky} width={6} />
		<Drawn d={VEIN_B2} p={(veinP - 0.7) * 3} stroke={C.sky} width={6} />
		{veinP >= 1 ? (
			<path
				d={VEIN}
				fill="none"
				stroke={C.offWhite}
				strokeWidth={5}
				strokeLinecap="round"
				strokeDasharray="6 34"
				strokeDashoffset={-flowT * 120}
				opacity={Math.min(1, (flowT) * 3)}
			/>
		) : null}
		{/* upward cue toward the heart */}
		{veinP > 0.6 ? (
			<g opacity={Math.min(1, (veinP - 0.6) * 2.5)} transform={`translate(236 ${-30 - 10 * Math.sin(flowT * 4)})`}>
				<path d="M-16 0 L0 -18 L16 0" fill="none" stroke={C.sky} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
			</g>
		) : null}
		{ring > 0 ? (
			<circle cx={226} cy={560} r={96} fill="none" stroke={C.navy} strokeWidth={4} strokeDasharray="10 12" opacity={0.55 * ring} transform={`rotate(${flowT * 18} 226 560)`} />
		) : null}
	</svg>
);

/* ───────────────────────── Plate (top-down, assembles) ───────────────────────── */

const leaf = (x: number, y: number, r: number, a: number, fill: string) => (
	<g transform={`translate(${x} ${y}) rotate(${a})`}>
		<path d={`M0 ${-r} C${r * 0.75} ${-r * 0.5} ${r * 0.75} ${r * 0.5} 0 ${r} C${-r * 0.75} ${r * 0.5} ${-r * 0.75} ${-r * 0.5} 0 ${-r} Z`} fill={fill} />
		<path d={`M0 ${-r * 0.8} V${r * 0.8}`} stroke="#E9F6EE" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
	</g>
);

export const Plate: React.FC<{rim: number; items: number[]}> = ({rim, items}) => {
	// items: per-ingredient arrival progress 0..1 (drop-in from slightly above, settle without bounce)
	const drop = (p: number, children: React.ReactNode, dx = 0, dy = -60) => (
		<g opacity={Math.min(1, p * 2)} transform={`translate(${dx * (1 - p)} ${dy * (1 - p)}) `}>
			{children}
		</g>
	);
	return (
		<svg viewBox="-300 -300 600 600" width={600} height={600} style={{overflow: 'visible'}}>
			<circle cx={0} cy={10} r={262} fill={C.navy} opacity={0.06 * rim} />
			<circle cx={0} cy={0} r={258} fill="#FFFFFF" opacity={rim} />
			<Drawn d="M0 -258 A258 258 0 1 1 -0.1 -258" p={rim} stroke={C.paleLine} width={8} />
			<circle cx={0} cy={0} r={204} fill="none" stroke={C.pale} strokeWidth={6} opacity={rim} />
			{/* greens */}
			{drop(items[0],
				<g>
					{leaf(60, -110, 62, 30, '#5DB585')}
					{leaf(120, -40, 56, 80, '#3F9C6C')}
					{leaf(10, -60, 50, -20, '#7CC79C')}
					{leaf(100, -140, 40, -40, '#3F9C6C')}
				</g>, 20, -70)}
			{/* whole grain bread */}
			{drop(items[1],
				<g transform="translate(-100 -80) rotate(-12)">
					<rect x={-70} y={-55} width={140} height={110} rx={34} fill="#EBC27E" />
					<rect x={-56} y={-42} width={112} height={84} rx={26} fill="#F6DDA8" />
					<path d="M-34 -10 l10 -6 M0 6 l10 -6 M26 -18 l10 -6 M-20 22 l10 -6" stroke="#C9974B" strokeWidth={5} strokeLinecap="round" />
				</g>, -20, -70)}
			{/* protein */}
			{drop(items[2],
				<g transform="translate(-70 90) rotate(14)">
					<path d="M-80 -20 C-60 -60 40 -64 78 -26 C96 -6 80 40 40 50 C-10 62 -96 28 -80 -20 Z" fill="#F09A72" />
					<path d="M-40 -30 C-30 -6 -34 20 -44 34 M0 -40 C10 -12 6 20 -4 44 M40 -34 C48 -8 44 18 36 40" stroke="#FBD3BC" strokeWidth={6} fill="none" strokeLinecap="round" />
				</g>, -20, -70)}
			{/* cucumber + tomatoes */}
			{drop(items[3],
				<g>
					{[[90, 70], [140, 120], [70, 140]].map(([x, y], i) => (
						<g key={i}>
							<circle cx={x} cy={y} r={34} fill="#9FD3A9" stroke="#3F9C6C" strokeWidth={6} />
							<circle cx={x} cy={y} r={12} fill="#E4F4E5" />
						</g>
					))}
					<circle cx={150} cy={40} r={24} fill="#E2574C" />
					<circle cx={10} cy={150} r={22} fill="#E2574C" />
					<path d="M150 22 l-6 -8 M10 134 l6 -8" stroke="#3F9C6C" strokeWidth={5} strokeLinecap="round" />
				</g>, 20, -70)}
		</svg>
	);
};

export const WaterGlass: React.FC<{p: number}> = ({p}) => (
	<svg viewBox="-80 -80 160 160" width={160} height={160} style={{overflow: 'visible', opacity: Math.min(1, p * 2)}}>
		<circle r={70} fill="#FFFFFF" stroke={C.paleLine} strokeWidth={6} />
		<circle r={54 * p} fill={C.sky} opacity={0.32} />
		<circle r={54} fill="none" stroke={C.sky} strokeWidth={3} opacity={0.5 * p} />
		<path d="M-30 -30 A42 42 0 0 1 10 -42" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.9 * p} />
	</svg>
);

/* ───────────────────────── Awareness ribbon ───────────────────────── */

export const RIBBON_A = 'M-120 230 L42 -6';
export const RIBBON_LOOP = 'M42 -6 C92 -80 104 -160 60 -206 C30 -238 -30 -238 -60 -206 C-104 -160 -92 -80 -42 -6';
export const RIBBON_B = 'M-42 -6 L120 230';

export const Ribbon: React.FC<{p: number; fill: number}> = ({p, fill}) => {
	const a = Math.min(1, p * 3);
	const b = Math.max(0, Math.min(1, (p - 0.25) * 2));
	const c = Math.max(0, Math.min(1, (p - 0.7) * 3.4));
	return (
		<svg viewBox="-200 -280 400 560" width={400} height={560} style={{overflow: 'visible'}}>
			<circle cx={0} cy={-10} r={250} fill={C.pinkPale} opacity={fill} />
			<Drawn d={RIBBON_B} p={c} stroke="#C9327A" width={64} cap="butt" />
			<Drawn d={RIBBON_LOOP} p={b} stroke={C.pink} width={64} cap="butt" />
			<Drawn d={RIBBON_A} p={a} stroke={C.pink} width={64} cap="butt" />
			<Drawn d={RIBBON_LOOP} p={b} stroke="#F6A9CC" width={10} opacity={0.6} />
		</svg>
	);
};
