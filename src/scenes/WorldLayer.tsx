import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../utils/palette';
import { SVG_MAP } from '../assets/scenes/svgMap';

/**
 * WorldLayer — the continuous world, rendered ONCE behind every scene.
 *
 * The approved Ballast Water Management film never breaks its world: scene-cut detection
 * across its full 9:11 finds zero cuts even at a 0.1 threshold, and the wave band is
 * present in every single frame (verified at its sparsest moments — 1:09, 6:31, 7:17).
 * Scenes there change by sliding their CONTENTS over water that never moves.
 *
 * Ours used to do the opposite: each scene owned its own `bg` (a flat #f5f6fa full-bleed
 * rect) and, in 14 of 20 frames, its own wave band — so a scene transition washed the
 * entire world to flat light for a full second, 19 times, with the VO still talking. And
 * six frames (1, 8, 12, 15, 17, 18) carry no wave band at all, so once their elements were
 * cued to the narration there was literally nothing left: frame 1 rendered a blank
 * rectangle for 9.9s while two full sentences played.
 *
 * So the water is hoisted here and never fades. motion.ts skips each scene's own `bg` and
 * `waves` (see SKIP_IDS) — the world owns them now. This also retires the design system's
 * A/B/C wave rotation, which is deliberate: one continuous body of water is the point.
 * See knowledge-vault/12 - Motion & Frame Construction Spec.
 */

// Any frame carrying a wave band works as the donor; frame_19 is the closing scene.
const WAVE_DONOR = 'frame_19.svg';

// The design system's re-export (2026-07-17) makes the wave band mandatory in every frame and
// names it `wave-band` (its validator also accepts `wave` / `WaveLine`); the frames in the repo
// today still say `waves`. Try each so the world keeps rendering across the hand-over.
const WAVE_IDS = ['wave-band', 'waves', 'wave', 'WaveLine'];

function extractGroup(svg: string, id: string): string | null {
  const open = new RegExp('<g[^>]*\\bid="' + id + '"[^>]*>').exec(svg);
  if (!open) return null;
  let depth = 0;
  const tag = /<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g;
  tag.lastIndex = open.index;
  let m;
  while ((m = tag.exec(svg))) {
    if (m[1] === '/') {
      depth--;
      if (depth === 0) return svg.slice(open.index, m.index + m[0].length);
    } else if (m[4] !== '/') depth++;
  }
  return null;
}

// <defs> carries the gradients the wave paths reference — without them the band renders flat.
function extractDefs(svg: string): string {
  return (svg.match(/<defs[\s\S]*?<\/defs>/g) || []).join('');
}

export const WorldLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { defs, waves } = React.useMemo(() => {
    const svg = SVG_MAP[WAVE_DONOR] || '';
    let band = '';
    for (const id of WAVE_IDS) {
      band = extractGroup(svg, id) || '';
      if (band) break;
    }
    if (!band && typeof console !== 'undefined') {
      // Loud, because a silent miss here is a blank-screen bug — the exact one this fixes.
      console.warn('[WorldLayer] no wave band found in ' + WAVE_DONOR + ' (tried: ' + WAVE_IDS.join(', ') + ')');
    }
    return { defs: extractDefs(svg), waves: band };
  }, []);

  // The same slow drift motion.ts gave the per-scene band, but continuous across the whole
  // film — it never restarts at a scene boundary, because the water never leaves.
  const t = frame / fps;
  const tx = Math.sin((2 * Math.PI * t) / 33) * 14;
  const ty = Math.sin((2 * Math.PI * t) / 52) * 3;

  const html =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">` +
    defs +
    `<g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)})">${waves}</g>` +
    `</svg>`;

  return (
    <div style={{ position: 'absolute', inset: 0, background: PALETTE.lightPanel }}>
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
