# Animation Library — Every Pattern, One File

All helpers live in `src/utils/animationUtils.ts`. Import from there, never re-implement.

```tsx
import { fadeIn, slideIn, scaleIn, floatLoop, waveLoop, staggerDelay, drawLine } from '../utils/animationUtils';
import { interpolate, Easing } from 'remotion';
```

---

## Entry Animations

```tsx
// Fade in — opacity 0 → 1
fadeIn(frame, delayFrames, durationFrames)
// fadeIn(frame, 0, 20)   → starts immediately, 20f duration
// fadeIn(frame, 30, 15)  → starts at frame 30

// Slide in — returns px offset (apply to translateX or translateY)
slideIn(frame, delay, duration, distance, direction)
// direction: 'left' | 'right' | 'up' | 'down'
style={{ transform: `translateX(${slideIn(frame, 10, 25, 80, 'left')}px)` }}

// Scale pop — returns scale value (0.65 → 1.0)
scaleIn(frame, delay, duration, startScale)
// startScale: 0.65 always (never 0.8 = too subtle, never 0.5 = too dramatic)
style={{ transform: `scale(${scaleIn(frame, 20, 15, 0.65)})`, transformOrigin: 'center center' }}

// Stagger delay — i * stepFrames
staggerDelay(index, stepFrames)
// staggerDelay(0, 8) = 0, staggerDelay(1, 8) = 8, staggerDelay(2, 8) = 16
```

## Headline Reveal (wipe — never bare fade)

```tsx
const titleReveal = interpolate(frame, [START, START + 25], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.out(Easing.exp),   // project standard — fast, snappy
});
// CSS: clip-path: inset(0 ${((1 - titleReveal) * 100).toFixed(1)}% 0 0)
// Inset shrinks from right → text "writes" left to right
```

## Continuous Loops

```tsx
// Float (vertical bob) — ships, icons, characters
floatLoop(frame, period, amplitude, phaseOffset)
// floatLoop(frame, 90, 8, 0)   → ship: 90f cycle, ±8px
// floatLoop(frame, 80, 6, 30)  → offset phase so elements don't sync

// Wave (horizontal sweep) — ocean waves
waveLoop(frame, period, amplitude, phaseOffset)
// ALWAYS pair with translateY for depth:
// translateX(${waveLoop(frame, 100, 16, 0)}px) translateY(${(Math.sin(frame * 0.050 + 0) * 3).toFixed(1)}px)
```

## Wave Rules — Ocean Must Have These

Every wave layer needs BOTH X and Y motion. Every wave needs unique parameters:

```tsx
// CORRECT — staggered periods, amplitudes, phases
const wX = [
  waveLoop(frame, 100, 16, 0),   // slowest = background
  waveLoop(frame,  80, 14, 20),
  waveLoop(frame,  65, 12, 40),
  waveLoop(frame,  72, 10, 60),  // fastest = foreground
];
// Y component in CSS: Math.sin(frame * (0.05 + layer * 0.01) + layer) * 3

// WRONG — identical = robotic
wave_1: waveLoop(frame, 60, 12, 0)
wave_2: waveLoop(frame, 60, 12, 0)  // never same all three params
```

Amplitude guide: ocean foreground ~12–18px, background swell ~6–10px, subtle bob ~4–8px.

## Path Draw-On (arrows, connectors, rings)

```tsx
const PATH_LENGTH = 240; // measure from SVG
drawLine(frame, PATH_LENGTH, startFrame, durationFrames)
// Returns strokeDashoffset: PATH_LENGTH → 0 over durationFrames
// CSS: stroke-dasharray: ${PATH_LENGTH}; stroke-dashoffset: ${drawLine(frame, PATH_LENGTH, 20, 30)};
// Duration standard: 30f for dotted lines
```

## Easing — Never Use Linear

```tsx
Easing.out(Easing.exp)          // headline reveals, fast impactful entries ← PROJECT STANDARD
Easing.bezier(0.0, 0.0, 0.2, 1.0)   // smooth deceleration — all entries
Easing.bezier(0.34, 1.56, 0.64, 1.0) // spring pop — icons, badges (slight overshoot)
Easing.bezier(0.4, 0.0, 0.6, 1.0)   // mechanical — circle draw-on, stroke paths
Easing.inOut(Easing.sin)             // scene wipe (SceneWrapper only)
// linear: NEVER — linear = PowerPoint
```

## Fish / Organic Elements — Squash & Stretch

Each fish needs its OWN variables (never one shared across all fish):

```tsx
const fishFlex = fishCfg.map((f, i) => {
  const cosT = Math.cos(frame * 0.025 + i * 0.65); // unique phase per fish
  return { sx: cosT.toFixed(3), sy: (Math.abs(cosT) < 0.2 ? 1.1 : 1.0).toFixed(3) };
});
// CSS: transform: scaleX(${fishFlex[i].sx}) scaleY(${fishFlex[i].sy});
//      transform-box: fill-box; transform-origin: center;  ← REQUIRED
```

## Birds

```tsx
// Birds: float X + Y at different rates for organic irregular motion
style={{
  transform: `translate(
    ${floatLoop(frame, 120, 5, i * 40)}px,
    ${floatLoop(frame, 80, 8, i * 20)}px
  )`
}}
```

## Staggered Icon Grid

```tsx
{[0,1,2,3].map(i => (
  <React.Fragment key={i}>
    {/* icon + label enter together */}
    <IconElement style={{ opacity: fadeIn(frame, staggerDelay(i, 10) + ELEM_BASE, 20), transform: `scale(${scaleIn(frame, staggerDelay(i, 10) + ELEM_BASE, 18, 0.65)})`, transformOrigin: 'center center' }} />
    <LabelElement style={{ opacity: fadeIn(frame, staggerDelay(i, 10) + ELEM_BASE + 8, 15) }} />
  </React.Fragment>
))}
```

## Scene Entry Order — Never Break This

```
Frame 0–20:   BG fades in
Frame 0+:     Waves loop (continuous from start)
Frame 10–32:  Main subject enters
Frame 25–80:  Supporting elements staggered (8f gap each)
Frame 65–90:  Headline text wipe reveal
Frame 80–120: Secondary text / labels
Frame 120+:   Hold — all loops running, nothing new enters
Last 30f:     SceneWrapper handles fade-out transition
```
