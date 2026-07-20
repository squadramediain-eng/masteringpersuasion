import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SVG_MAP } from '../assets/scenes/svgMap';
import { planAndWrap, styleFor } from '../utils/motion';

/**
 * FrameScene — data-driven renderer.
 * Applies the Animation Guider's per-element recipes (via src/utils/motion.ts) to
 * every named group / text in the frame: background fade, wave drift, numeral
 * scale-fade, staggered card/icon pops, ship sail-in, character slide-fade + idle,
 * alert pop-shake, watermark pulse. Each element is wrapped in <g id="anim_*"> so
 * its own placement transform is never clobbered.
 *
 * This drives all 20 slots from the guider automatically. To hand-tune one frame
 * beyond the recipe, copy SceneTemplate.tsx -> SceneXX.tsx (skills/02-scene-build.md)
 * and register it in MainComposition's SCENE_COMPONENTS.
 */
export const FrameScene: React.FC<{ svgFile: string; durationFrames: number }> = ({ svgFile, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = SVG_MAP[svgFile] || '';

  // Parse + wrap once per scene; only the <style> block recomputes per frame.
  const { skeleton, plan } = React.useMemo(
    () => planAndWrap(raw, (durationFrames / fps) * 1000, svgFile),
    [raw, durationFrames, fps, svgFile]
  );

  const css = styleFor(plan, frame, fps);
  const html = skeleton.replace('</svg>', `<style>${css}</style></svg>`);

  // No background here — WorldLayer paints the canvas + wave band behind every scene and
  // never fades. A background on the scene would hide the water and re-create the blank
  // transitions this was built to remove.
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
