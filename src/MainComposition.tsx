import React from 'react';
import { AbsoluteFill, Easing, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { SCENE_REGISTRY, FPS, TRANSITION_FRAMES } from './utils/sceneRegistry';
import { PALETTE } from './utils/palette';
import { FrameScene } from './scenes/FrameScene';
import { WorldLayer } from './scenes/WorldLayer';
import { transitionOverride } from './utils/motion';

// ─── SCENE COMPONENT MAP ─────────────────────────────────────────
// Every slot renders through the baseline FrameScene until a bespoke SceneXX.tsx
// replaces it here. To hand-animate a frame: build src/scenes/Scene07.tsx from
// SceneTemplate.tsx, import it, and set SCENE_COMPONENTS['scene-07'] = Scene07.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  // 'scene-07': Scene07,
};

// ─── SCENE WRAPPER (slide out left / slide in right) ──────────────
/**
 * Content EXITS BY MOVING, never by dissolving.
 *
 * Measured off the approved Ballast Water Management film, sampled 4×/sec across
 * the 0:55–0:59 transition:
 *   56.00  outgoing title + icons slide OUT TO THE LEFT
 *   56.25  frame nearly clear of content — but the wave band is still there
 *   56.50  incoming subject slides IN FROM THE RIGHT
 *   57.00  it settles; the caret appears and the title types on
 * Total ≈ 1.5s, elements out then in, background untouched throughout.
 *
 * This replaces a cross-fade that dissolved each scene's contents in place. The
 * world (WorldLayer) never participates in either direction — it is behind this
 * wrapper and never fades, which is what keeps a transition from going blank.
 * See knowledge-vault/12 - Motion & Frame Construction Spec §4.
 */
const SLIDE_OUT_PX = 260;   // how far the outgoing content travels
const SLIDE_IN_PX = 300;    // how far the incoming content starts away

// Direction -> unit vector. "none" holds position and lets opacity alone carry it,
// which is what you want for a scene that should not appear to move (a stat hold,
// or a pair of scenes meant to read as one continuous board).
const DIRS: Record<string, [number, number]> = {
  right: [1, 0], left: [-1, 0], top: [0, -1], bottom: [0, 1], none: [0, 0],
};

const SceneWrapper: React.FC<{ durationFrames: number; svgFile: string; children: React.ReactNode }> = ({
  durationFrames, svgFile, children,
}) => {
  const frame = useCurrentFrame();

  // Per-scene overrides from frame-overrides.json "_transition"; otherwise the
  // film-wide default measured off the reference (out left, in from right).
  const t = transitionOverride(svgFile);
  const tf = Math.max(1, t?.frames ?? TRANSITION_FRAMES);
  const dist = t?.distance ?? SLIDE_IN_PX;
  const outDist = t?.distance ?? SLIDE_OUT_PX;
  const [ivx, ivy] = DIRS[t?.inFrom ?? 'right'] ?? DIRS.right;
  const [ovx, ovy] = DIRS[t?.outTo ?? 'left'] ?? DIRS.left;

  // IN: starts offset, decelerates to rest. Brand curve — the same
  // cubic-bezier(0.16,1,0.3,1) the guider uses for element entrances.
  const inP = interpolate(frame, [0, tf], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const inOpacity = interpolate(frame, [0, tf * 0.55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // OUT: accelerates away over the last `tf` frames.
  const outStart = durationFrames - tf;
  const outP = interpolate(frame, [outStart, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  // Fade only over the BACK HALF of the exit, so the eye reads travel first and
  // the frame is genuinely clear before the next subject arrives.
  const outOpacity = interpolate(frame, [outStart + tf * 0.45, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });

  const tx = inP * dist * ivx + outP * outDist * ovx;
  const ty = inP * dist * ivy + outP * outDist * ovy;

  return (
    <AbsoluteFill
      style={{
        opacity: inOpacity * outOpacity,
        transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
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
            <SceneWrapper durationFrames={scene.durationFrames} svgFile={scene.svgFile}>
              {Bespoke ? <Bespoke /> : <FrameScene svgFile={scene.svgFile} durationFrames={scene.durationFrames} />}
            </SceneWrapper>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
