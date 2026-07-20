# Scene Build — The Exact Pattern

## File Structure (copy this, don't invent)

```tsx
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { fadeIn, slideIn, scaleIn, floatLoop, waveLoop, staggerDelay, drawLine } from '../utils/animationUtils';
import svgContent from '../assets/scenes/Frame_XX.svg';

// ── Timeline constants ────────────────────────────────────────────────────────
const BG_START      = 0;
const SUBJECT_START = 10;
const ELEM_BASE     = 25;   // first supporting element
const ELEM_STEP     = 8;    // frames between staggered elements
const TEXT_START    = 65;   // headline — always after elements

export const SceneXX: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Values ──────────────────────────────────────────────────────────────────
  const bgOp      = fadeIn(frame, BG_START, 20);
  const subjectOp = fadeIn(frame, SUBJECT_START, 22);
  const subjectY  = floatLoop(frame, 90, 8, 0);          // float after entry
  
  // Staggered elements
  const N = 4;
  const elemOps = Array.from({ length: N }, (_, i) =>
    fadeIn(frame, ELEM_BASE + staggerDelay(i, ELEM_STEP), 18)
  );
  
  // Waves — every parameter unique
  const wX = [
    waveLoop(frame, 100, 16, 0),
    waveLoop(frame,  80, 14, 20),
    waveLoop(frame,  65, 12, 40),
    waveLoop(frame,  72, 10, 60),
  ];
  
  // Headline — clip-path wipe reveal (never bare fade)
  const titleReveal = interpolate(frame, [TEXT_START, TEXT_START + 25], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.exp),
  });

  // ── CSS style block ──────────────────────────────────────────────────────────
  // Match IDs EXACTLY as they appear in the SVG (case-sensitive)
  const styleBlock = `
    #bg          { opacity: ${bgOp.toFixed(3)}; }
    #ship        { opacity: ${subjectOp.toFixed(3)}; transform: translateY(${subjectY.toFixed(1)}px); transform-box: fill-box; transform-origin: center; }
    #element_1   { opacity: ${elemOps[0].toFixed(3)}; }
    #element_2   { opacity: ${elemOps[1].toFixed(3)}; }
    #element_3   { opacity: ${elemOps[2].toFixed(3)}; }
    #element_4   { opacity: ${elemOps[3].toFixed(3)}; }
    #wave_1      { transform: translateX(${wX[0].toFixed(1)}px) translateY(${(Math.sin(frame * 0.050 + 0) * 3).toFixed(1)}px); }
    #wave_2      { transform: translateX(${wX[1].toFixed(1)}px) translateY(${(Math.sin(frame * 0.060 + 1) * 3).toFixed(1)}px); }
    #wave_3      { transform: translateX(${wX[2].toFixed(1)}px) translateY(${(Math.sin(frame * 0.070 + 2) * 3).toFixed(1)}px); }
    #wave_4      { transform: translateX(${wX[3].toFixed(1)}px) translateY(${(Math.sin(frame * 0.080 + 3) * 3).toFixed(1)}px); }
    #h1_text     { clip-path: inset(0 ${((1 - titleReveal) * 100).toFixed(1)}% 0 0); }
  `;

  // ── Inject & render ──────────────────────────────────────────────────────────
  const animatedSvg = svgContent
    .replace('<svg ', '<svg width="1920" height="1080" ')
    .replace('</svg>', `<style>${styleBlock}</style></svg>`);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0a1628' }}>
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: animatedSvg }} />
    </div>
  );
};
```

---

## The Three-Step Pattern — Never Deviate

1. **Import SVG as raw string** — `import svgContent from '../assets/scenes/Frame_XX.svg'`
2. **Build CSS style block** with per-frame computed values targeting `#id` selectors
3. **Inject** style into SVG string before `</svg>`, render with `dangerouslySetInnerHTML`

**These patterns DON'T WORK — never use:**
```tsx
// WRONG — ReactComponent import can't accept per-frame CSS
import { ReactComponent as Frame07 } from '...svg';

// WRONG — inline div style doesn't reach inside SVG
<div style={{ opacity: bgOp }} dangerouslySetInnerHTML={{ __html: svgContent }} />

// WRONG — useRef can't reach SVG groups inside dangerouslySetInnerHTML
const ref = useRef<SVGElement>(null);
```

---

## Overlay Layer (when SVG can't do it)

For counter-rotating rings, particle effects, or text overlays:

```tsx
return (
  <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0a1628' }}>
    {/* Base layer */}
    <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: animatedSvg }} />
    {/* Overlay layer */}
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 1920 1080" width="1920" height="1080">
      <circle cx={960} cy={540} r={200} fill="none" stroke="rgba(108,182,251,0.3)"
        style={{ transform: `rotate(${frame * 1.2}deg)`, transformOrigin: '960px 540px' }} />
    </svg>
  </div>
);
```

---

## CSS Rules Inside SVG — Quick Reference

```css
/* Target a named group */
#wave_1 { transform: translateX(12px); }

/* Target cls-* shapes inside a named group */
#icon_1 .cls-20 { stroke-dashoffset: 45; }

/* Override SVG's own embedded styles */
.cls-7 { opacity: 0 !important; }

/* REQUIRED on every scale/rotate rule */
#ship { transform: translateY(8px); transform-box: fill-box; transform-origin: center; }
```

`transform-box: fill-box` is mandatory on every scale/rotate. Without it, the pivot is the SVG viewport origin (0,0) and elements orbit the corner.

---

## Timeline Quick Reference

| Element | Start frame | Duration |
|---------|------------|---------|
| Background | 0 | 20f fade |
| Waves | 0 | continuous |
| Main subject | 10 | 22f fade + slide |
| Supporting elements | 25+ (stagger 8f) | 18f each |
| Headline text | 65+ | 25f wipe reveal |
| All elements visible by | 120 | — |
| Hold state | 120 → end-30 | loops only |
| Transition out | last 30f | SceneWrapper handles |

Scale for scene length: multiply all starts by `durationFrames / 450` for non-standard lengths.
