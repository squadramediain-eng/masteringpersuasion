# Creative Standards — Broadcast Quality Rules

## The Benchmark

Every frame must look like a BBC documentary infographic or NatGeo explainer.
Ask before every commit: *"Would a motion graphics creative director approve this frame?"*

---

## What Professional Looks Like — Per Element

### Waves
✅ Different speed, amplitude, phase per layer — no two waves identical  
✅ Both X and Y motion (X sweep + Y vertical oscillation)  
✅ Background waves more transparent than foreground  
❌ All waves same speed  
❌ X motion only (flat, 2D looking)  
❌ Waves that visibly jump/reset  

### Ship / Main Subject
✅ Enters with momentum (spring easing or bezier, slight overshoot allowed)  
✅ Float has subtle ±2° tilt following float direction  
✅ `transform-box: fill-box; transform-origin: center` on every transform  
❌ Subject that just fades in with no movement  
❌ Float with no rotation component  

### Icons
✅ Spring pop entry: scaleIn(0.65 → 1.0) + fadeIn simultaneously  
✅ `transformOrigin: 'center center'` always  
✅ Icon + label enter together as one unit (label 8f after icon max)  
❌ Icon fades in without scale  
❌ Scale starting above 0.7 or below 0.6 (too subtle or too dramatic)  

### Circles / Rings
✅ Outer ring draws on with strokeDashoffset animation  
✅ Content inside fades AFTER ring is complete (12f delay)  
✅ Decorative ring rotates continuously during hold  
❌ Circle that pops into existence  

### Text
✅ Headline: clip-path inset wipe reveal (25f, `Easing.out(Easing.exp)`)  
✅ Body/caption: fadeIn + translateY(8px → 0) rise  
✅ Multiple lines: 12f stagger between each  
❌ Any text that simply fades in  
❌ Text visible before its supporting elements  

### Cards / Boxes
✅ scaleIn from 0.92 → 1.0 (subtle, not dramatic)  
✅ Content inside enters 12f after box is established  
❌ Box that slides from far off-screen  
❌ Box with no entry animation  

---

## Consistency Standards (identical across ALL 28 scenes)

| Property | Value |
|----------|-------|
| Wave slowest period | 100f |
| Wave fastest period | 65f |
| Ship float amplitude | 8px (never more) |
| Icon entry start scale | 0.65 |
| Headline reveal duration | 25f |
| Caption stagger gap | 12f |
| Dotted line draw duration | 30f |
| Max entry frame (all elements in) | 120f |
| Transition overlap (SceneWrapper) | 30f |

---

## Clichés to Avoid

❌ Full 360° spin on entry (only for loading indicators)  
❌ Scale 0 → 1 on large elements (use 0.85 → 1.0 max for cards)  
❌ All elements entering simultaneously  
❌ Nothing moving during hold (everything has at least a subtle breathe)  
❌ Text visible before its context elements are established  

---

## Colour

Never hardcode colours. Use the palette:
```tsx
import { PALETTE } from '../utils/palette';
// PALETTE.bg (#0a1628), PALETTE.accent (#3182ce), PALETTE.textPrimary, etc.
```

Opacity guidelines: background overlays 0.85–0.95, decorative rings 0.4–0.6, shadows 0.15–0.30, inactive text 0.7, active text 1.0.

---

## Visual Hierarchy — Every Scene

One element is the DOMINANT hero (largest, most animated, most contrast).
2–4 elements are SUPPORTING (smaller, gentler).
Everything else is BACKGROUND (barely moving, low contrast).

Never have two elements competing for dominance.

---

## The Anti-PowerPoint Checklist

Before any commit, verify NONE of these are present:
- [ ] Elements appearing with no animation (opacity 0→1 only, no movement)
- [ ] All elements entering same frame
- [ ] Any `linear` easing
- [ ] Text that fades in without spatial movement
- [ ] Icons that scale uniformly without spring/bezier
- [ ] Loops with identical period AND amplitude AND phase
- [ ] Transitions faster than 10f or slower than 30f
