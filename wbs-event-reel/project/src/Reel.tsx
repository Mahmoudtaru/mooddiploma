import React from 'react';
import {AbsoluteFill, Audio, Easing, Freeze, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {Background, DeskScene, Drawn, HEART, Label, Leg, Logo, Plate, POSES, PULSE, Ribbon, T, WaterGlass, lerpPose} from './art';
import {At, Reveal, Words, easeInOut, easeOut, easeSettle, mix, prog, useTime} from './motion';
import {C, CX, FONT_BODY} from './theme';
import {A} from './timeline';

/*
 * One continuous camera. The film is a single tall world: eight "stations" stacked vertically
 * (one screen each), joined by one sky-blue health thread. The thread draws ahead of the camera
 * and becomes each topic's visual: the work-day loop, the underline of the date, the leg's vein,
 * the floor under the figure, the ring around the plate, Baheya's ribbon, the line under the quiet
 * setup and finally the banner line of the closing card.
 */

const H = 1920;
const Y = (k: number) => k * H;

// Camera moves between stations (start time, duration). Each one sits in a real pause of the voice.
const PANS: [number, number][] = [
	[2.95, 0.95], // → 1 collaboration (after «خُد وقت لصحتك»)
	[8.82, 0.9], // → 2 vascular (after the date)
	[11.95, 0.78], // → 3 work habits
	[13.92, 0.7], // → 4 nutrition
	[15.45, 0.8], // → 5 Baheya
	[20.16, 0.85], // → 6 quiet setup (navy)
	[22.45, 0.82], // → 7 closing
];
const camEase = Easing.bezier(0.6, 0, 0.28, 1);

const camera = (t: number) => {
	let y = 0;
	let dip = 0;
	let moving = false;
	for (const [s, d] of PANS) {
		y += H * prog(t, s, d, camEase);
		if (t > s && t < s + d) {
			dip = Math.sin(Math.PI * prog(t, s, d, (x) => x));
			moving = true;
		}
	}
	// a gentle breathing drift so held frames are never dead still; next to the navy band it only
	// moves away from it (station 5 up, station 7 down, none on station 6) so its edges never peek in
	const k = Math.round(y / H);
	const w = 14 * Math.sin((2 * Math.PI * t) / 7.5);
	y += k === 6 ? 0 : k === 5 ? -Math.abs(w) : k === 7 ? Math.abs(w) : w;
	return {y, scale: 1 - 0.085 * dip, moving};
};

/* ───────────────────────── The thread (world coordinates) ───────────────────────── */

const THREAD: {d: string; s: number; dur: number; stroke?: string}[] = [
	// station 0: out of the laptop, a loop that makes room for the heart
	{d: 'M255 1060 C223 970 245 890 310 840 A95 95 0 1 1 500 840 A95 95 0 1 1 310 840', s: 1.78, dur: 0.75},
	// down the left margin into station 1
	{d: 'M310 840 C200 900 60 980 60 1300 C60 1700 300 1900 560 2010 C800 2060 980 2200 980 2500 L980 3220', s: 2.75, dur: 1.6},
	// station 1: underline beneath the date
	{d: 'M980 3220 C980 3380 880 3450 760 3450 L250 3450', s: 7.15, dur: 1.3},
	// down into station 2, ending in the leg's vein (which continues the line upward)
	{d: 'M250 3450 C120 3450 60 3540 60 3700 L60 5200 C60 5330 160 5390 262 5390 C322 5390 338 5350 335 5302', s: 8.72, dur: 0.95},
	// station 2: from the top of the vein (toward the heart) out to the right, then down
	{d: 'M346 4612 C346 4560 420 4540 600 4540 C860 4540 980 4600 980 4800', s: 10.5, dur: 0.7},
	{d: 'M980 4800 L980 6900 C980 7120 940 7212 884 7212', s: 11.9, dur: 0.95},
	// station 3: becomes the floor under the figure
	{d: 'M884 7212 L86 7212', s: 12.55, dur: 0.6},
	{d: 'M86 7212 C40 7212 40 7300 40 7400 L40 8500 C40 8820 200 9020 465 9020', s: 13.85, dur: 0.85},
	// station 4: a ring around the plate
	{d: 'M465 9020 A300 300 0 1 1 465 8420 A300 300 0 1 1 465 9020', s: 14.3, dur: 0.6},
	{d: 'M465 9020 C640 9020 720 9140 860 9140 C960 9140 980 9200 980 9400 L980 10600', s: 15.35, dur: 0.85, stroke: 'url(#toPink)'},
	// station 5: sweeps into the ribbon's first tail, leaves from the second
	{d: 'M980 10600 C980 10720 900 10765 780 10765 L470 10765 C420 10765 395 10745 385 10720', s: 16.55, dur: 0.5, stroke: C.pink},
	{d: 'M625 10720 C660 10765 720 10790 800 10790 C940 10790 980 10850 980 11000 L980 11700', s: 18.05, dur: 0.6, stroke: 'url(#toSky)'},
	// station 6 (navy): down and under the quiet line
	{d: 'M980 11700 L980 12520 C980 12600 950 12640 910 12650', s: 20.1, dur: 0.85},
	{d: 'M910 12650 C760 12730 620 12610 505 12680 C390 12750 260 12650 100 12710', s: 20.95, dur: 1.3},
	// into the closing card, where it settles as the banner's flowing line
	{d: 'M100 12710 C60 12730 40 12800 40 12900 L40 14900 C40 15100 200 15200 400 15250 C650 15310 900 15300 1120 15190', s: 22.3, dur: 1.4},
];

const Thread: React.FC<{t: number}> = ({t}) => (
	<svg width={1080} height={Y(8)} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
		<defs>
			<linearGradient id="toPink" gradientUnits="userSpaceOnUse" x1="0" y1="9300" x2="0" y2="10300">
				<stop offset="0" stopColor={C.sky} />
				<stop offset="1" stopColor={C.pink} />
			</linearGradient>
			<linearGradient id="toSky" gradientUnits="userSpaceOnUse" x1="0" y1="10800" x2="0" y2="11550">
				<stop offset="0" stopColor={C.pink} />
				<stop offset="1" stopColor={C.sky} />
			</linearGradient>
		</defs>
		{THREAD.map((sg, i) => (
			<Drawn key={i} d={sg.d} p={prog(t, sg.s, sg.dur, easeInOut)} stroke={sg.stroke ?? C.sky} width={7} />
		))}
	</svg>
);

/* ───────────────────────── World surfaces: pink wash, navy band, parallax depth ───────────────────────── */

const Surfaces: React.FC = () => (
	<svg width={1080} height={Y(8)} style={{position: 'absolute', left: 0, top: 0}}>
		<defs>
			<linearGradient id="pinkWash" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#FDEEF5" stopOpacity="0" />
				<stop offset="0.16" stopColor="#FDEEF5" stopOpacity="0.85" />
				<stop offset="0.84" stopColor="#FDEEF5" stopOpacity="0.85" />
				<stop offset="1" stopColor="#FDEEF5" stopOpacity="0" />
			</linearGradient>
		</defs>
		<rect x={0} y={Y(5) - 420} width={1080} height={H + 700} fill="url(#pinkWash)" />
		<path
			d={`M0 ${Y(6) + 34} C200 ${Y(6) + 4} 380 ${Y(6) + 8} 560 ${Y(6) + 24} C740 ${Y(6) + 40} 920 ${Y(6) + 36} 1080 ${Y(6) + 6} V${Y(7) - 34} C900 ${Y(7) - 4} 720 ${Y(7) - 8} 540 ${Y(7) - 22} C360 ${Y(7) - 36} 180 ${Y(7) - 38} 0 ${Y(7) - 8} Z`}
			fill={C.navy}
		/>
		<path d={`M-20 ${Y(6) + 1650} C240 ${Y(6) + 1520} 520 ${Y(6) + 1600} 760 ${Y(6) + 1520} C900 ${Y(6) + 1474} 1000 ${Y(6) + 1420} 1100 ${Y(6) + 1340}`} fill="none" stroke="#1D4A8F" strokeWidth={3} />
		<path d={`M-20 ${Y(6) + 1720} C260 ${Y(6) + 1590} 540 ${Y(6) + 1680} 780 ${Y(6) + 1590} C920 ${Y(6) + 1540} 1010 ${Y(6) + 1490} 1100 ${Y(6) + 1420}`} fill="none" stroke="#1D4A8F" strokeWidth={2} opacity={0.7} />
	</svg>
);

// Soft discs on a slower plane: during camera moves they slide at a different speed (depth).
const DEPTH: [number, number, number][] = [
	[1060, 1200, 120], [20, 2400, 90], [1070, 3300, 140], [10, 4300, 110], [1060, 5200, 100],
	[20, 6100, 130], [1070, 7000, 120], [10, 8000, 100], [1060, 9000, 110], [20, 10100, 90],
];
const Parallax: React.FC<{camY: number}> = ({camY}) => (
	<svg width={1080} height={Y(8)} style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${camY * 0.42}px)`}}>
		{DEPTH.map(([x, y, r], i) => (
			<circle key={i} cx={x} cy={y} r={r} fill="#E3F3FC" opacity={0.75} />
		))}
	</svg>
);

/* ───────────────────────── Stations ───────────────────────── */

const Station: React.FC<{k: number; camY: number; children: React.ReactNode}> = ({k, camY, children}) => {
	if (Math.abs(camY - Y(k)) > H * 1.15) return null;
	return <div style={{position: 'absolute', left: 0, top: Y(k), width: 1080, height: H}}>{children}</div>;
};

const shadow = (a = 0.1) => `drop-shadow(0 18px 22px rgba(16,47,104,${a}))`;

const Hook: React.FC<{t: number}> = ({t}) => {
	const relax = prog(t, 1.85, 0.7, easeInOut);
	const typing = (1 - relax) * Math.sin(t * 26) * 3;
	const base = lerpPose(POSES.typing, POSES.relaxed, relax);
	const pose = {...base, hand: [base.hand[0], base.hand[1] + typing] as [number, number], hand2: [base.hand2[0], base.hand2[1] - typing] as [number, number]};
	const halo = prog(t, 2.2, 0.55, easeOut);
	const heart = prog(t, 2.3, 0.55, easeInOut);
	const pulse = prog(t, 2.55, 0.5, easeInOut);
	return (
		<>
			<At x={CX} y={380}>
				<Words at={-0.9} parts={['وسط يوم الشغل…']} size={100} />
			</At>
			<At x={CX} y={530}>
				<Words at={1.7} parts={[{t: 'وقت لصحتك', c: C.sky}]} size={132} stagger={0.14} />
			</At>
			<div style={{position: 'absolute', left: CX - 400, top: 720, filter: shadow()}}>
				<DeskScene pose={pose} screenGlow={1 - relax}>
					<circle cx={300} cy={120} r={88 * halo} fill={C.pale} />
					<g transform="translate(300 142) scale(0.82)">
						<Drawn d={HEART} p={heart} stroke={C.navy} width={9} />
						<Drawn d={PULSE} p={pulse} stroke={C.sky} width={8} />
					</g>
				</DeskScene>
			</div>
		</>
	);
};

const Collab: React.FC<{t: number}> = ({t}) => {
	const settle = prog(t, 6.95, 0.75, easeInOut);
	const dy = mix(190, 0, settle);
	const sc = mix(1, 0.92, settle);
	const wbs = prog(t, 3.5, 0.85, easeSettle);
	const bf = prog(t, 4.98, 0.7, easeSettle);
	const iv = prog(t, 5.78, 0.7, easeSettle);
	const halo = prog(t, 3.4, 1.0, easeOut);
	return (
		<>
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px) scale(${sc})`, transformOrigin: `${CX}px 640px`}}>
				<At x={CX} y={470}>
					<div style={{width: 560 * halo, height: 560 * halo, borderRadius: '50%', background: 'radial-gradient(circle, #E8F5FD 0%, #F1F9FE 50%, rgba(254,254,252,0) 71%)'}} />
				</At>
				<At x={CX} y={470} style={{opacity: wbs, clipPath: `circle(${wbs * 75}% at 50% 50%)`, transform: `translate(-50%, -50%) translateY(${36 * (1 - wbs)}px) scale(${0.94 + 0.06 * wbs})`}}>
					<Logo name="wbs" width={440} />
				</At>
				<At x={CX} y={715}>
					<Reveal at={4.9} dir="none" rise={16}>
						<Label size={38}>في</Label>
					</Reveal>
				</At>
				<At x={CX} y={800} style={{opacity: bf, transform: `translate(-50%, -50%) translateY(${26 * (1 - bf)}px)`, clipPath: `inset(-10% ${(1 - bf) * 50}% -10% ${(1 - bf) * 50}%)`}}>
					<Logo name="breadfast" width={400} />
				</At>
				<At x={CX} y={925}>
					<Reveal at={5.72} dir="ltr" rise={16}>
						<Label size={32} dir="ltr">Powered by</Label>
					</Reveal>
				</At>
				<At x={CX} y={1020} style={{opacity: iv, transform: `translate(-50%, -50%) translateY(${26 * (1 - iv)}px)`, clipPath: `inset(-10% ${(1 - iv) * 100}% -10% 0)`}}>
					<Logo name="ivein" width={270} />
				</At>
			</div>
			<At x={CX} y={1245}>
				<Words at={A.dateDay - 0.08} parts={['الاثنين']} size={64} weight={700} />
			</At>
			<At x={CX} y={1385}>
				<div dir="rtl" style={{display: 'flex', alignItems: 'baseline', gap: 44}}>
					<Reveal at={A.dateNum - 0.15} dir="none" rise={40}>
						<T size={150} weight={800} color={C.sky} style={{fontFamily: 'Alexandria'}}>19</T>
					</Reveal>
					<Words at={A.dateMonth - 0.3} parts={['أكتوبر']} size={118} />
				</div>
			</At>
		</>
	);
};

const Vascular: React.FC<{t: number}> = ({t}) => {
	const draw = prog(t, 9.3, 0.7, easeInOut);
	const vein = prog(t, 9.62, 0.85, easeInOut);
	const flowT = Math.max(0, t - 10.45);
	const ring = prog(t, 10.6, 0.5, easeOut);
	return (
		<>
			<At x={CX} y={345}>
				<Words at={9.4} parts={['صحة الأوعية']} size={96} />
			</At>
			<At x={CX} y={475}>
				<Words at={9.6} parts={[{t: 'الدموية', c: C.sky}]} size={96} />
			</At>
			<At x={CX} y={600}>
				<Reveal at={9.9} dir="ltr" rise={18}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
						<Label size={28} dir="ltr">Powered by</Label>
						<Logo name="ivein" width={168} />
					</div>
				</Reveal>
			</At>
			<div style={{position: 'absolute', left: 112, top: 700, width: 400, height: 960, transform: 'scale(0.8)', transformOrigin: '226px 560px', filter: shadow()}}>
				<Leg draw={draw} veinP={vein} flowT={flowT} ring={ring} />
			</div>
			<div style={{position: 'absolute', right: 175, top: 905, width: 430}}>
				<Reveal at={A.dawaly - 0.2}>
					<T size={92} weight={800} color={C.sky} style={{textAlign: 'right'}}>الدوالي:</T>
				</Reveal>
				<Reveal at={A.prevention - 0.15}>
					<T size={56} weight={700} style={{textAlign: 'right', marginTop: 4}}>أعراضها</T>
				</Reveal>
				<Reveal at={A.prevention + 0.05}>
					<T size={56} weight={700} style={{textAlign: 'right'}}>والوقاية</T>
				</Reveal>
			</div>
		</>
	);
};

const Habits: React.FC<{t: number}> = ({t}) => {
	const straighten = prog(t, 12.72, 0.45, easeInOut);
	const stand = prog(t, 13.22, 0.58, easeInOut);
	const pose = lerpPose(lerpPose(POSES.slumped, POSES.upright, straighten), POSES.standing, stand);
	return (
		<>
			<At x={CX} y={355}>
				<Words at={12.3} parts={['عادات صحية']} size={96} />
			</At>
			<At x={CX} y={485}>
				<Words at={12.48} parts={[{t: 'أثناء الشغل', c: C.sky}]} size={96} />
			</At>
			<div style={{position: 'absolute', left: CX - 420, top: 690, transform: 'scale(1.05)', transformOrigin: '400px 760px', filter: shadow()}}>
				<DeskScene pose={pose} laptopLift={straighten} screenGlow={0.5} chairShift={stand} />
			</div>
		</>
	);
};

const Nutrition: React.FC<{t: number}> = ({t}) => {
	const rim = prog(t, 14.35, 0.45, easeInOut);
	const items = [14.52, 14.6, 14.68, 14.76].map((s) => prog(t, s, 0.45, easeSettle));
	const glass = prog(t, 14.85, 0.5, easeOut);
	return (
		<>
			<At x={CX} y={355}>
				<Words at={14.22} parts={['تغذية صحية']} size={96} />
			</At>
			<At x={CX} y={485}>
				<Words at={14.4} parts={[{t: 'خلال يومك', c: C.sky}]} size={96} />
			</At>
			<At x={CX - 40} y={1040} style={{transform: 'translate(-50%, -50%) scale(1.1)', filter: shadow()}}>
				<Plate rim={rim} items={items} />
			</At>
			<At x={805} y={1360}>
				<WaterGlass p={glass} />
			</At>
		</>
	);
};

const Baheya: React.FC<{t: number}> = ({t}) => {
	const logo = prog(t, 16.02, 0.75, easeSettle);
	const lift = prog(t, 16.9, 0.7, easeInOut);
	const ribbon = prog(t, 17.0, 1.0, easeInOut);
	const halo = prog(t, 17.0, 0.6, easeOut);
	return (
		<>
			<At x={CX} y={mix(690, 300, lift)}>
				<Reveal at={15.9} rise={20}>
					<Label size={mix(44, 34, lift)}>بالتعاون مع</Label>
				</Reveal>
			</At>
			<At
				x={CX}
				y={mix(860, 420, lift)}
				style={{
					opacity: logo,
					transform: `translate(-50%, -50%) translateY(${24 * (1 - logo)}px) scale(${mix(1, 0.8, lift)})`,
					clipPath: `inset(-10% 0 -10% ${(1 - logo) * 100}%)`,
				}}
			>
				<Logo name="baheya" width={400} />
			</At>
			<At x={CX} y={890} style={{opacity: lift, filter: 'drop-shadow(0 18px 24px rgba(232,66,145,0.16))'}}>
				<Ribbon p={ribbon} fill={halo} />
			</At>
			<At x={CX} y={1268}>
				<Words at={17.3} parts={['التوعية', {t: 'بسرطان الثدي', c: C.pink}]} size={74} />
			</At>
			<At x={CX} y={1385}>
				<Words at={A.earlyDetection - 0.12} parts={['أهمية الكشف المبكر']} size={60} weight={700} />
			</At>
		</>
	);
};

const Pause: React.FC = () => (
	<>
		<At x={CX} y={850}>
			<Words at={20.72} parts={['وسط كل اللي']} size={100} color="#FFFFFF" stagger={0.12} />
		</At>
		<At x={CX} y={985}>
			<Words at={21.3} parts={['مطلوب منك…']} size={100} color="#FFFFFF" stagger={0.14} />
		</At>
	</>
);

const Close: React.FC<{t: number}> = ({t}) => {
	// Beat 1: «صحتك ليها مكان.» gets the screen to itself.
	// Beat 2 (from 23.7): it rises, and the invitation, date and partners build beneath it;
	// the card is complete by ~25.3 s and holds to the end.
	const up = prog(t, 23.7, 0.65, easeInOut);
	const row = (s: number) => {
		const p = prog(t, s, 0.65, easeSettle);
		return {opacity: p, transform: `translate(-50%, -50%) translateY(${34 * (1 - p)}px)`};
	};
	return (
		<>
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${mix(280, 0, up)}px) scale(${mix(1.1, 1, up)})`, transformOrigin: `${CX}px 460px`}}>
				<At x={CX} y={370}>
					<Words at={22.72} parts={['صحتك']} size={156} />
				</At>
				<At x={CX} y={548}>
					<Words at={A.lihaMakan - 0.14} parts={[{t: 'ليها مكان.', c: C.sky}]} size={146} stagger={0.12} />
				</At>
			</div>
			<At x={CX} y={728}>
				<Words at={24.2} parts={['مستنيينكم']} size={74} rise={30} />
			</At>
			<At x={CX} y={838}>
				<Reveal at={24.34} dir="none" rise={20}>
					<div dir="rtl" style={{background: C.pale, borderRadius: 999, padding: '6px 34px 10px', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 40, color: C.navy, whiteSpace: 'nowrap', lineHeight: 1.5}}>
						الاثنين <span style={{fontFamily: 'Alexandria', fontWeight: 700, color: C.sky}}>19</span> أكتوبر
					</div>
				</Reveal>
			</At>
			{/* partner arrangement: the initiative at the workplace, then the supporting partners */}
			<At x={700} y={1085} style={row(24.42)}>
				<Logo name="wbs" width={232} />
			</At>
			<At x={530} y={1090} style={row(24.47)}>
				<Label size={34}>في</Label>
			</At>
			<At x={340} y={1090} style={row(24.52)}>
				<Logo name="breadfast" width={290} />
			</At>
			<At x={660} y={1262} style={row(24.6)}>
				<Label size={33}>بالتعاون مع</Label>
			</At>
			<At x={660} y={1352} style={row(24.64)}>
				<Logo name="baheya" width={244} />
			</At>
			<At x={352} y={1262} style={row(24.68)}>
				<Label size={33} dir="ltr">Powered by</Label>
			</At>
			<At x={352} y={1352} style={row(24.72)}>
				<Logo name="ivein" width={206} />
			</At>
			<div style={{position: 'absolute', left: CX - 1, top: 1232, width: 2, height: 190, background: C.paleLine, opacity: prog(t, 24.65, 0.5)}} />
		</>
	);
};

/* ───────────────────────── Composition ───────────────────────── */

const Frame: React.FC = () => {
	const t = useTime();
	const cam = camera(t);
	const pink = prog(t, 15.5, 0.7, easeInOut) * (1 - prog(t, 20.2, 0.5));
	return (
		<AbsoluteFill style={{background: C.offWhite}}>
			<Background t={t} pink={pink} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: 1080,
					height: Y(8),
					transformOrigin: '0 0',
					transform: `translate(540px, 960px) scale(${cam.scale}) translate(-540px, ${-960 - cam.y}px)`,
				}}
			>
				<Parallax camY={cam.y} />
				<Surfaces />
				<Thread t={t} />
				<Station k={0} camY={cam.y}><Hook t={t} /></Station>
				<Station k={1} camY={cam.y}><Collab t={t} /></Station>
				<Station k={2} camY={cam.y}><Vascular t={t} /></Station>
				<Station k={3} camY={cam.y}><Habits t={t} /></Station>
				<Station k={4} camY={cam.y}><Nutrition t={t} /></Station>
				<Station k={5} camY={cam.y}><Baheya t={t} /></Station>
				<Station k={6} camY={cam.y}><Pause /></Station>
				<Station k={7} camY={cam.y}><Close t={t} /></Station>
			</div>
		</AbsoluteFill>
	);
};

/**
 * Film-camera motion blur (same sampling as @remotion/motion-blur's CameraMotionBlur: N exposures
 * across a 180° shutter, averaged). A held frame is rendered once at the *mean*
 * exposure time, so switching between 1 and N samples never shifts time (no one-frame jump).
 */
const SHUTTER = 0.5;
const MotionBlur: React.FC<{samples: number; children: React.ReactNode}> = ({samples, children}) => {
	const frame = useCurrentFrame();
	const N = 10;
	const mean = 1 - SHUTTER * ((N + 1) / (2 * N));
	if (samples <= 1) return <Freeze frame={frame + mean}>{children}</Freeze>;
	return (
		<AbsoluteFill style={{isolation: 'isolate'}}>
			{/* running average: exposure i is laid over the mean of the previous ones at opacity 1/(i+1);
			    unlike additive blending this has no 8-bit rounding bias, so the frame's tone never steps */}
			{new Array(samples).fill(true).map((_, i) => (
				<AbsoluteFill key={i} style={{opacity: 1 / (i + 1)}}>
					<Freeze frame={frame + 1 - SHUTTER * ((i + 1) / samples)}>{children}</Freeze>
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};

export const Reel: React.FC = () => {
	const t = useTime();
	const moving = camera(t).moving || camera(t - 1 / 60).moving;
	return (
		<AbsoluteFill style={{background: C.offWhite}}>
			{/* film-camera blur sampled only while the camera travels; held frames stay sharp */}
			<MotionBlur samples={moving ? 10 : 1}>
				<Frame />
			</MotionBlur>
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
