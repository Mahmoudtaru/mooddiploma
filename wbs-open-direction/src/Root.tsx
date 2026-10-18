import React, {useEffect, useState} from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {Film} from './Film';
import {DURATION, FPS} from './timing';

const AR = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const WEIGHTS = [400, 500, 600, 700, 800];

const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('Loading Alexandria'));
  useEffect(() => {
    const faces = WEIGHTS.flatMap((w) => [
      new FontFace('Alexandria', `url(${staticFile(`fonts/alexandria-arabic-${w}-normal.woff2`)}) format('woff2')`, {weight: String(w), unicodeRange: AR}),
      new FontFace('Alexandria', `url(${staticFile(`fonts/alexandria-latin-${w}-normal.woff2`)}) format('woff2')`, {weight: String(w), unicodeRange: LAT}),
    ]);
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => {
        loaded.forEach((f) => document.fonts.add(f));
        return document.fonts.ready;
      })
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return <>{children}</>;
};

const Main: React.FC = () => (
  <FontGate>
    <Film />
  </FontGate>
);

export const Root: React.FC = () => (
  <Composition id="WbSFilm" component={Main} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
);
