import React from 'react';
import { AbsoluteFill, Easing, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { SCENE_REGISTRY, FPS, TRANSITION_FRAMES } from './utils/sceneRegistry';
import { PALETTE } from './utils/palette';
import { FrameScene } from './scenes/FrameScene';
import { WorldLayer } from './scenes/WorldLayer';

// ─── SCENE COMPONENT MAP ─────────────────────────────────────────
// Every slot renders through the baseline FrameScene until a bespoke SceneXX.tsx
// replaces it here. To hand-animate a frame: build src/scenes/Scene07.tsx from
// SceneTemplate.tsx, import it, and set SCENE_COMPONENTS['scene-07'] = Scene07.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  // 'scene-07': Scene07,
};

// ─── SCENE WRAPPER (fade-out only over last TRANSITION_FRAMES) ────
const SceneWrapper: React.FC<{ durationFrames: number; children: React.ReactNode }> = ({ durationFrames, children }) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(
    frame,
    [durationFrames - TRANSITION_FRAMES, durationFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) }
  );
  return <AbsoluteFill style={{ opacity: fadeOut }}>{children}</AbsoluteFill>;
};

// ─── MAIN COMPOSITION ────────────────────────────────────────────
export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.lightPanel }}>
      <Audio src={staticFile('audio/mastering-persuasion.mp3')} />
      {/* The world sits behind every scene and never fades — scenes slide their contents
          over it. This is what stops a transition (or an uncued scene) rendering blank. */}
      <WorldLayer />
      {SCENE_REGISTRY.map((scene) => {
        const Bespoke = SCENE_COMPONENTS[scene.id];
        return (
          <Sequence key={scene.id} from={scene.audioStartSec * FPS} durationInFrames={scene.durationFrames}>
            <SceneWrapper durationFrames={scene.durationFrames}>
              {Bespoke ? <Bespoke /> : <FrameScene svgFile={scene.svgFile} durationFrames={scene.durationFrames} />}
            </SceneWrapper>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
