import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import './fonts';
import {Background, DeskScene, Drawn, HEART, Label, Leg, Logo, Plate, POSES, PULSE, Ribbon, T, WaterGlass, lerpPose} from './art';
import {At, Reveal, Scene, easeInOut, easeOut, easeSettle, mix, prog, useTime} from './motion';
import {C, CX, FONT_BODY} from './theme';
import {A, S} from './timeline';

/* ───────────────────────── 1 · Hook: the working day makes room for health ───────────────────────── */

const Hook: React.FC = () => {
	const t = useTime();
	const relax = prog(t, 1.85, 0.7, easeInOut);
	const typing = (1 - relax) * Math.sin(t * 26) * 3;
	const base = lerpPose(POSES.typing, POSES.relaxed, relax);
	const pose = {...base, hand: [base.hand[0], base.hand[1] + typing] as [number, number], hand2: [base.hand2[0], base.hand2[1] - typing] as [number, number]};
	const path = prog(t, 1.78, 0.75, easeInOut);
	const halo = prog(t, 2.2, 0.55, easeOut);
	const heart = prog(t, 2.3, 0.55, easeInOut);
	const pulse = prog(t, 2.55, 0.5, easeInOut);
	return (
		<Scene from={S.hook[0]} to={S.hook[1]} enter={false}>
			<At x={CX} y={380}>
				<Reveal at={-0.45}>
					<T size={100} weight={800}>وسط يوم الشغل…</T>
				</Reveal>
			</At>
			<At x={CX} y={530}>
				<Reveal at={1.72}>
					<T size={132} weight={800} color={C.sky}>وقت لصحتك</T>
				</Reveal>
			</At>
			<div style={{position: 'absolute', left: CX - 400, top: 720}}>
				<DeskScene pose={pose} screenGlow={1 - relax}>
					<circle cx={300} cy={120} r={88 * halo} fill={C.pale} />
					<Drawn d="M150 340 C118 250 140 170 205 120 A95 95 0 1 1 395 120 A95 95 0 1 1 205 120" p={path} stroke={C.sky} width={7} />
					<g transform="translate(300 142) scale(0.82)">
						<Drawn d={HEART} p={heart} stroke={C.navy} width={9} />
						<Drawn d={PULSE} p={pulse} stroke={C.sky} width={8} />
					</g>
				</DeskScene>
			</div>
		</Scene>
	);
};

/* ───────────────────────── 2 · Collaboration identity + date ───────────────────────── */

const Collab: React.FC = () => {
	const t = useTime();
	const settle = prog(t, 6.95, 0.75, easeInOut); // identity stack makes room for the date
	const dy = mix(190, 0, settle);
	const sc = mix(1, 0.92, settle);
	const wbs = prog(t, 3.45, 0.8, easeSettle);
	const bf = prog(t, 4.98, 0.7, easeSettle);
	const iv = prog(t, 5.78, 0.7, easeSettle);
	const ring = (p: number) => `circle(${Math.max(0, p) * 75}% at 50% 50%)`;
	return (
		<Scene from={S.collab[0]} to={S.collab[1]}>
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px) scale(${sc})`, transformOrigin: `${CX}px 640px`}}>
				<At x={CX} y={470} style={{opacity: wbs, clipPath: ring(wbs), transform: `translate(-50%, -50%) translateY(${30 * (1 - wbs)}px)`}}>
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
				<Reveal at={A.dateDay - 0.08}>
					<T size={64} weight={700}>الاثنين</T>
				</Reveal>
			</At>
			<At x={CX} y={1385}>
				<div dir="rtl" style={{display: 'flex', alignItems: 'baseline', gap: 44}}>
					<Reveal at={A.dateNum - 0.15} dir="none" rise={40}>
						<T size={150} weight={800} color={C.sky} style={{fontFamily: 'Alexandria'}}>19</T>
					</Reveal>
					<Reveal at={A.dateMonth - 0.3}>
						<T size={118} weight={800}>أكتوبر</T>
					</Reveal>
				</div>
			</At>
		</Scene>
	);
};

/* ───────────────────────── 3 · Vascular health, Powered by iVein ───────────────────────── */

const Vascular: React.FC = () => {
	const t = useTime();
	const draw = prog(t, 9.25, 0.7, easeInOut);
	const vein = prog(t, 9.6, 0.85, easeInOut);
	const flowT = Math.max(0, t - 10.45);
	const ring = prog(t, 10.55, 0.5, easeOut);
	const zoom = mix(1, 1.07, prog(t, 10.5, 1.7, easeInOut));
	return (
		<Scene from={S.vascular[0]} to={S.vascular[1]}>
			<At x={CX} y={345}>
				<Reveal at={9.3}>
					<T size={96} weight={800}>صحة الأوعية</T>
				</Reveal>
			</At>
			<At x={CX} y={475}>
				<Reveal at={9.45}>
					<T size={96} weight={800} color={C.sky}>الدموية</T>
				</Reveal>
			</At>
			<At x={CX} y={600}>
				<Reveal at={9.85} dir="ltr" rise={18}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
						<Label size={28} dir="ltr">Powered by</Label>
						<Logo name="ivein" width={168} />
					</div>
				</Reveal>
			</At>
			<div style={{position: 'absolute', left: 112, top: 700, width: 400, height: 960, transform: `scale(${0.8 * zoom})`, transformOrigin: '226px 560px'}}>
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
		</Scene>
	);
};

/* ───────────────────────── 4 · Healthy habits at work: posture and movement ───────────────────────── */

const Habits: React.FC = () => {
	const t = useTime();
	const straighten = prog(t, 12.5, 0.45, easeInOut);
	const stand = prog(t, 13.1, 0.6, easeInOut);
	const pose = lerpPose(lerpPose(POSES.slumped, POSES.upright, straighten), POSES.standing, stand);
	const enter = prog(t, 12.2, 0.5, easeOut);
	return (
		<Scene from={S.habits[0]} to={S.habits[1]}>
			<At x={CX} y={355}>
				<Reveal at={12.24}>
					<T size={96} weight={800}>عادات صحية</T>
				</Reveal>
			</At>
			<At x={CX} y={485}>
				<Reveal at={12.42}>
					<T size={96} weight={800} color={C.sky}>أثناء الشغل</T>
				</Reveal>
			</At>
			<div style={{position: 'absolute', left: CX - 420, top: 690, opacity: enter, transform: `translateY(${60 * (1 - enter)}px) scale(1.05)`, transformOrigin: '400px 760px'}}>
				<DeskScene pose={pose} laptopLift={straighten} screenGlow={0.5} chairShift={stand} />
			</div>
		</Scene>
	);
};

/* ───────────────────────── 5 · Healthy nutrition through the day ───────────────────────── */

const Nutrition: React.FC = () => {
	const t = useTime();
	const rim = prog(t, 14.12, 0.45, easeInOut);
	const items = [14.32, 14.42, 14.5, 14.58].map((s) => prog(t, s, 0.42, easeSettle));
	const glass = prog(t, 14.62, 0.5, easeOut);
	return (
		<Scene from={S.nutrition[0]} to={S.nutrition[1]}>
			<At x={CX} y={355}>
				<Reveal at={14.1}>
					<T size={96} weight={800}>تغذية صحية</T>
				</Reveal>
			</At>
			<At x={CX} y={485}>
				<Reveal at={14.28}>
					<T size={96} weight={800} color={C.sky}>خلال يومك</T>
				</Reveal>
			</At>
			<At x={CX - 40} y={1040} style={{transform: 'translate(-50%, -50%) scale(1.1)'}}>
				<Plate rim={rim} items={items} />
			</At>
			<At x={805} y={1360}>
				<WaterGlass p={glass} />
			</At>
		</Scene>
	);
};

/* ───────────────────────── 6 · Baheya: breast-cancer awareness ───────────────────────── */

const Baheya: React.FC = () => {
	const t = useTime();
	const logo = prog(t, 15.98, 0.75, easeSettle);
	const lift = prog(t, 16.9, 0.7, easeInOut);
	const ribbon = prog(t, 17.0, 1.0, easeInOut);
	const halo = prog(t, 17.0, 0.6, easeOut);
	return (
		<Scene from={S.baheya[0]} to={S.baheya[1]}>
			<At x={CX} y={mix(690, 300, lift)}>
				<Reveal at={15.8} rise={20}>
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
			<At x={CX} y={890} style={{opacity: lift}}>
				<Ribbon p={ribbon} fill={halo} />
			</At>
			<At x={CX} y={1268}>
				<Reveal at={17.3}>
					<T size={74} weight={800}>
						التوعية <span style={{color: C.pink}}>بسرطان الثدي</span>
					</T>
				</Reveal>
			</At>
			<At x={CX} y={1385}>
				<Reveal at={A.earlyDetection - 0.12}>
					<T size={60} weight={700}>أهمية الكشف المبكر</T>
				</Reveal>
			</At>
		</Scene>
	);
};

/* ───────────────────────── 7 · Quiet setup on navy ───────────────────────── */


const NavyPanel: React.FC = () => {
	const t = useTime();
	const rise = prog(t, 20.3, 0.75, easeInOut);
	const leave = prog(t, 22.36, 0.75, easeInOut);
	if (t < 20.25 || t > 23.2) return null;
	const y = mix(1980, 0, rise) - 2160 * leave;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${y}px)`}}>
			<svg width={1080} height={2200} style={{position: 'absolute', top: -140, left: 0}}>
				<path d={`M0 140 C200 40 380 60 560 110 C740 160 920 150 1080 60 V2060 C900 2160 720 2150 540 2100 C360 2050 180 2040 0 2140 Z`} fill={C.navy} />
				<path d="M-20 1650 C240 1520 520 1600 760 1520 C900 1474 1000 1420 1100 1340" fill="none" stroke="#1D4A8F" strokeWidth={3} />
				<path d="M-20 1720 C260 1590 540 1680 780 1590 C920 1540 1010 1490 1100 1420" fill="none" stroke="#1D4A8F" strokeWidth={2} opacity={0.7} />
			</svg>
		</div>
	);
};

const Pause: React.FC = () => {
	const t = useTime();
	const line = prog(t, 20.95, 1.4, easeInOut);
	return (
		<Scene from={S.pause[0]} to={S.pause[1]} exit={0.4}>
			<At x={CX} y={850}>
				<Reveal at={20.7}>
					<T size={100} weight={800} color="#FFFFFF">وسط كل اللي</T>
				</Reveal>
			</At>
			<At x={CX} y={985}>
				<Reveal at={21.25}>
					<T size={100} weight={800} color="#FFFFFF">مطلوب منك…</T>
				</Reveal>
			</At>
			<svg width={1080} height={300} style={{position: 'absolute', left: 0, top: 1080}}>
				<Drawn d="M910 60 C760 140 620 20 505 90 C390 160 260 60 100 120" p={line} stroke={C.sky} width={6} />
			</svg>
		</Scene>
	);
};

/* ───────────────────────── 8 · Closing: health has a place ───────────────────────── */

const Close: React.FC = () => {
	const t = useTime();
	// Beat 1: «صحتك ليها مكان.» gets the screen to itself, where the navy line sat.
	// Beat 2 (from 23.7): the message rises to the top and the invitation, date and partners
	// build beneath it, so the last card is complete by ~25.3 s and holds to the end.
	const up = prog(t, 23.7, 0.65, easeInOut);
	const msgScale = mix(1.1, 1, up);
	const row = (s: number) => {
		const p = prog(t, s, 0.65, easeSettle);
		return {opacity: p, transform: `translate(-50%, -50%) translateY(${34 * (1 - p)}px)`};
	};
	return (
		<Scene from={S.close[0]} to={S.close[1] + 1} exit={0} enter={false}>
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${mix(280, 0, up)}px) scale(${msgScale})`, transformOrigin: `${CX}px 460px`}}>
				<At x={CX} y={370}>
					<Reveal at={22.66}>
						<T size={156} weight={800}>صحتك</T>
					</Reveal>
				</At>
				<At x={CX} y={548}>
					<Reveal at={A.lihaMakan - 0.12}>
						<T size={146} weight={800} color={C.sky}>ليها مكان.</T>
					</Reveal>
				</At>
			</div>
			<At x={CX} y={728}>
				<Reveal at={24.22} rise={28}>
					<T size={74} weight={800}>مستنيينكم</T>
				</Reveal>
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
		</Scene>
	);
};

/* ───────────────────────── Composition ───────────────────────── */

export const Reel: React.FC = () => {
	const t = useTime();
	const pink = prog(t, 15.62, 0.6, easeInOut) * (1 - prog(t, 20.5, 0.4));
	return (
		<AbsoluteFill style={{background: C.offWhite}}>
			<Background t={t} pink={pink} />
			<Hook />
			<Collab />
			<Vascular />
			<Habits />
			<Nutrition />
			<Baheya />
			<Close />
			<NavyPanel />
			<Pause />
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
