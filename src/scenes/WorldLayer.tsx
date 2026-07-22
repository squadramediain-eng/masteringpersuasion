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

  // ── Atmosphere: soft drifting gradient blobs ─────────────────────────────
  // The one item from the design critique that is genuinely the pipeline's, not
  // the artwork's (#5): the canvas behind every scene was a flat #f5f6fa. The
  // reference sits on a subtly atmospheric ground, not a dead fill. These are big,
  // very low-opacity blue washes drifting slowly behind everything — depth without
  // competing with the foreground. Built from radial gradients (soft to
  // transparent), not feGaussianBlur, which is unreliable in headless Chromium.
  // Deterministic in `frame`, so the render stays reproducible.
  const BLOBS = [
    { bx: 380, by: 300, r: 620, c: '#dbe9f7', per: 71, amp: 90 },
    { bx: 1580, by: 240, r: 560, c: '#e3edf8', per: 89, amp: 70 },
    { bx: 1180, by: 820, r: 680, c: '#d7e6f5', per: 103, amp: 110 },
    { bx: 520, by: 760, r: 480, c: '#e6eff9', per: 61, amp: 80 },
  ];
  const blobDefs = BLOBS.map((b, i) =>
    `<radialGradient id="blob${i}" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${b.c}" stop-opacity="0.9"/>` +
    `<stop offset="100%" stop-color="${b.c}" stop-opacity="0"/>` +
    `</radialGradient>`
  ).join('');
  const blobs = BLOBS.map((b, i) => {
    const dx = Math.sin((2 * Math.PI * t) / b.per + i) * b.amp;
    const dy = Math.cos((2 * Math.PI * t) / (b.per * 1.3) + i) * b.amp * 0.5;
    return `<circle cx="${(b.bx + dx).toFixed(1)}" cy="${(b.by + dy).toFixed(1)}" r="${b.r}" fill="url(#blob${i})"/>`;
  }).join('');

  // ── Ambient: rising bubbles ──────────────────────────────────────────────
  // The approved film's holds are never dead — sampled at 3:10 it carries a small
  // cluster of bubbles rising through the wave band. Deliberately restrained: at
  // 1:00 that film shows ship + water and NO fauna at all, so blanket sea life
  // would overshoot the reference, not match it. Fish/seaweed/coral appear there
  // only where the CONTENT is about the ocean.
  //
  // Generated rather than imported so they exist in every scene without touching
  // the frame artwork (which the design project owns and re-exports over).
  // Deterministic: position is a pure function of `frame`, no randomness, so the
  // render stays reproducible.
  // Why more than the old 9: measured against the reference, every one of our 19
  // cuts washed to YAVG ~245 (emptiest the film gets) while the reference never
  // passes 229.65. The per-frame ambient slides out WITH its scene at a cut, so
  // for ~1s only the world layer holds the screen — and a wave band plus 9 near-
  // invisible bubbles is too thin to carry it. This layer never slides, so
  // enriching it fills exactly the content-absent moment without touching the art.
  // Everything stays in the lower water band (y > ~830); these are above-water
  // scenes, so fish/bubbles in the sky would be wrong — they live in the water.
  const BAND_TOP = 830;
  const FLOOR = 1035;

  const BUBBLES = 22;
  const bubbles = Array.from({ length: BUBBLES }, (_, i) => {
    const seedX = ((i * 137.508) % 100) / 100;
    const period = 8 + (i % 5) * 2.2;                 // seconds for one full rise
    const phase = (t / period + seedX) % 1;           // 0 → 1 up through the band
    const x = 60 + seedX * 1800;
    const y = FLOOR - phase * (FLOOR - BAND_TOP);
    const r = 2.5 + (i % 4) * 1.5;
    const o = Math.sin(phase * Math.PI) * 0.5;        // fade in low, out high
    const sway = Math.sin((2 * Math.PI * t) / 5 + i) * 6;
    return `<circle cx="${(x + sway).toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#8fc0e8" opacity="${o.toFixed(3)}"/>`;
  }).join('');

  // A few fish drifting across the band, continuously, never restarting at a cut —
  // the reference's water is never empty of life. Light tint and small, so they
  // read as depth, not as characters competing with the content.
  const FISH = 5;
  const fish = Array.from({ length: FISH }, (_, i) => {
    const seed = ((i * 97.13) % 100) / 100;
    const span = 2160;                                // travel wider than the frame
    const period = 26 + (i % 3) * 9;                  // slow
    const dir = i % 2 === 0 ? 1 : -1;
    const p = ((t / period + seed) % 1);
    const x = dir === 1 ? -120 + p * span : 2040 - p * span;
    const y = BAND_TOP + 40 + seed * (FLOOR - BAND_TOP - 70);
    const bob = Math.sin((2 * Math.PI * t) / 4 + i) * 5;
    const s = 0.5 + (i % 3) * 0.18;
    const flip = dir === 1 ? 1 : -1;
    // Simple filled fish: body ellipse + triangular tail, in the palette's light blue.
    return (
      `<g transform="translate(${x.toFixed(1)},${(y + bob).toFixed(1)}) scale(${(s * flip).toFixed(3)},${s.toFixed(3)})" ` +
      `fill="#a9d0ee" opacity="0.5">` +
      `<ellipse cx="0" cy="0" rx="22" ry="9"/>` +
      `<path d="M18,0 L34,-9 L34,9 Z"/>` +
      `</g>`
    );
  }).join('');

  const html =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">` +
    `<defs>${blobDefs}</defs>` +
    blobs +                       // atmosphere first — everything else sits over it
    defs +
    `<g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)})">${waves}</g>` +
    fish +
    bubbles +
    `</svg>`;

  return (
    <div style={{ position: 'absolute', inset: 0, background: PALETTE.lightPanel }}>
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
