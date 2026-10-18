import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

const AR =
	'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LAT =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const faces: {family: string; file: string; weight: string; range: string}[] = [];
for (const w of ['500', '700', '800']) {
	faces.push({family: 'Alexandria', file: `alexandria-arabic-${w}-normal.woff2`, weight: w, range: AR});
	faces.push({family: 'Alexandria', file: `alexandria-latin-${w}-normal.woff2`, weight: w, range: LAT});
}
for (const w of ['500', '600']) {
	faces.push({family: 'IBM Plex Sans Arabic', file: `ibm-plex-sans-arabic-arabic-${w}-normal.woff2`, weight: w, range: AR});
	faces.push({family: 'IBM Plex Sans Arabic', file: `ibm-plex-sans-arabic-latin-${w}-normal.woff2`, weight: w, range: LAT});
}

const handle = delayRender('Loading packaged fonts');
Promise.all(
	faces.map((f) =>
		loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, unicodeRange: f.range, format: 'woff2'}),
	),
)
	.then(() => document.fonts.ready)
	.then(() => continueRender(handle))
	.catch((err) => {
		throw err;
	});
