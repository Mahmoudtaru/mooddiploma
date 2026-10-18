import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {DURATION_FRAMES, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="WbSReel"
		component={Reel}
		durationInFrames={DURATION_FRAMES}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);
