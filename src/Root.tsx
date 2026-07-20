import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/DMSans';
import { MainComposition } from './MainComposition';
import { FPS, FINAL_FRAMES } from './utils/sceneRegistry';

// Load every weight so any weight used in an illustration just renders
// correctly. Swap DMSans for your project's actual font family if different —
// the font NAME must match exactly what the SVG's stylesheet specifies.
loadFont('normal', { weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] });

export const Root: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={MainComposition}
      durationInFrames={FINAL_FRAMES || 1}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
