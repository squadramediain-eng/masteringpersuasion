/**
 * SCENE TEMPLATE — copy this file for every new scene
 * 
 * Usage:
 *   1. Copy this file → src/scenes/Scene07.tsx
 *   2. Replace SCENE_ID and SVG_FILE with real values
 *   3. Import SVG layers and add animations
 *   4. Add to MainComposition.tsx: import { Scene07 } from './scenes/Scene07'
 *   5. Add to SCENE_COMPONENTS in MainComposition.tsx
 *   6. Update status in sceneRegistry.ts → 'done'
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  fadeIn,
  slideIn,
  scaleIn,
  floatLoop,
  staggerDelay,
  explainerSequence,
} from '../utils/animationUtils';

// ─── REPLACE THESE ───────────────────────────────────────────────
const SCENE_ID = 'scene-XX';
const SVG_FILE = 'Frame_XX.svg';
// ─────────────────────────────────────────────────────────────────

export const SceneXX: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Standard explainer sequence timing
  const seq = explainerSequence(frame);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a1628',
      }}
    >
      {/* ── BACKGROUND ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: seq.bg,
        }}
      >
        {/* BG layer — reference: #bg in SVG */}
      </div>

      {/* ── MAIN SUBJECT ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: seq.subject,
          transform: `translateY(${slideIn(frame, 10, 25, 60, 'down')}px)`,
        }}
      >
        {/* Subject layer — reference: #ship, #character etc */}
      </div>

      {/* ── SUPPORTING ELEMENTS (staggered) ── */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            opacity: fadeIn(frame, staggerDelay(i, 8) + 25, 20),
          }}
        >
          {/* element_{i+1} */}
        </div>
      ))}

      {/* ── TEXT / HEADLINE ── */}
      <div
        style={{
          position: 'absolute',
          opacity: seq.text,
          transform: `translateY(${slideIn(frame, 40, 20, 30, 'down')}px)`,
        }}
      >
        {/* h1_text layer */}
      </div>
    </div>
  );
};
