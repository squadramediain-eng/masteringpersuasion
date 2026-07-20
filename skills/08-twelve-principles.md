# The 12 Principles — Diagnosing "Feels Like a Presentation"

Read this when fixing per-scene feedback, alongside `06-creative-standards.md`.
Not for first-draft scene building — `02`/`03`/`04` already produce a technically
correct scene. This file is for the pass *after* that, when a scene is wired,
QA-passes, and still doesn't feel right.

This project already implements 8 of Disney's 12 principles well (see table).
**4 are structurally missing from every scene**, and they're the 4 most
responsible for "looks like a slide deck" rather than "looks like motion":
**Anticipation, Arcs, Follow-Through & Overlapping Action, Secondary Action.**
If feedback says "stiff," "presentation-y," "static," or "robotic," start there
before touching anything else.

---

## Status of All 12

| # | Principle | Status | Where it lives |
|---|-----------|--------|-----------------|
| 1 | Squash & Stretch | ✅ Covered | Fish flex (`03`), ship float tilt (`06`) |
| 2 | Anticipation | ❌ Missing | — see below |
| 3 | Staging | ✅ Covered | Visual Hierarchy (`06`) |
| 4 | Straight Ahead / Pose-to-Pose | ⚠️ Partial | Continuous loops keep frames alive (`03`); risk noted below |
| 5 | Follow-Through & Overlapping Action | ❌ Missing | — see below |
| 6 | Slow In / Slow Out | ✅ Covered | `ease.*` presets, "never linear" rule (`03`/`06`) |
| 7 | Arcs | ❌ Missing | — see below |
| 8 | Secondary Action | ⚠️ Partial | Icon+label pairing exists; decorative sub-parts usually don't move |
| 9 | Timing | ✅ Covered | Stagger gaps, hold-time rule (`04`/`06`) |
| 10 | Exaggeration | ✅ Covered (deliberately restrained) | scaleIn 0.65 floor (`06`) |
| 11 | Solid Drawing → Depth/Parallax | ⚠️ Partial | Waves do it (`03`); other layered elements often don't |
| 12 | Appeal | ✅ Covered | Palette, silhouette/contrast rules (`06`) |

---

## The 4 Missing Principles — Patterns to Apply

These are composed from existing `animationUtils.ts` primitives (`fadeIn`,
`slideIn`, `scaleIn`, `floatLoop`, `waveLoop`, `ease.*`) inline in the scene
file. Don't add new exported helpers for a one-off — only promote a pattern
into `animationUtils.ts` if it repeats across 3+ scenes (same rule the project
already followed for `swimAcross`).

### 2 — Anticipation
A small pull *against* the coming motion before the motion starts. Without
it, every entrance just snaps forward — the classic "PowerPoint build" tell.

```tsx
// Before a card/icon scales up 0.65→1.0 at frame `delay`, dip slightly
// SMALLER for a few frames first, then commit to the real scaleIn.
const ANTICIPATION = 6; // frames
const preDip = interpolate(frame, [delay - ANTICIPATION, delay], [1, 0.92], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.gentleOut,
});
const scale = frame < delay ? preDip : scaleIn(frame, delay, 18, 0.65);
```
Reserve for the scene's ONE hero entrance per beat — anticipation on every
element looks twitchy, not lively. Pairs naturally with `ease.spring`'s
overshoot on the back end (anticipation dips back, spring overshoots forward
— same element, two ends of one motion).

### 5 — Follow-Through & Overlapping Action
Right now a parent (ship, card, character) and its children (flag, label,
icon) usually finish moving on the exact same frame — everything locks at
once, which reads as mechanical. Real motion has trailing parts settle
*after* the main mass stops.

```tsx
// Parent settles at frame PARENT_END. Child (flag/antenna/loose part)
// starts there — not at the parent's START — and overshoots past rest
// before settling, so it visibly keeps moving once the parent has stopped.
const PARENT_END = delay + 25;
const flagSettle = scaleIn(frame, PARENT_END, 14, 1.08); // >1 = settles DOWN, not up
```
Apply to: ship flags/antennas, character loose clothing/hair, signboard
chains, anything rigid-attached-to-something-that-just-moved.

### 7 — Arcs
`slideIn` only moves on one axis — perfectly straight, which nothing in
nature does. Pair it with a small parabolic bump on the perpendicular axis
so the path curves.

```tsx
const t = interpolate(frame, [delay, delay + duration], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.smoothIn,
});
const arcLift = -ARC_HEIGHT * 4 * t * (1 - t); // 0 at both ends, peak at t=0.5
// transform: translateX(${slideIn(frame, delay, duration, distance, dir)}px)
//            translateY(${arcLift}px)
```
`ARC_HEIGHT` of 8–14px reads as a natural curve without looking like a bounce.
Use on: icons landing into position, cards sliding in, anything crossing
empty space. Skip on: pure fades, pure scale-pops (no traversal = no arc).

### 8 — Secondary Action (the missing half)
Icon+label-together already exists. What's missing: decorative sub-parts
that aren't called out by narration but should still be quietly alive during
the hold — smoke from a stack, a flag fluttering, ripples under a hull,
loose rope swaying. A scene where only the narrated elements move feels like
a diagram; a scene where small unimportant things also breathe feels alive.

```tsx
// Low-amplitude, slow, never narrated, never staggered — just always on
// once its parent has entered. Pick period/phase that DON'T match any
// other loop in the scene (see Loop Diversity, 03/06).
style={{ transform: `translateX(${waveLoop(frame, 140, 3, 70)}px)` }} // flag flutter
```
Audit each SVG for these candidates during scene-planning (`04`), not as an
afterthought — list them in the plan alongside the narrated elements.

---

## Partial Principles — Tighten, Don't Rebuild

### 4 — Straight Ahead vs Pose-to-Pose
Risk specific to this project: every element animates start-value → end-value
via `interpolate`, which is pose-to-pose by construction. That's fine *as
long as something in the frame is always running* (waves, floats, breathe) —
the Anti-PowerPoint checklist's "nothing moving during hold" rule in `06` is
this principle's actual enforcement. If a scene feels like a series of static
poses, it's because that rule was skipped, not because pose-to-pose itself
is wrong here.

### 11 — Solid Drawing → Depth/Parallax
Waves already do "farther = slower + more transparent, closer = faster +
opaque." Extend the SAME logic to any other layered elements in a scene
(background clouds vs midground birds vs foreground ship): farther layers
get longer `periodFrames` and lower amplitude in their `floatLoop`/`waveLoop`
calls, nearer layers get shorter period and higher amplitude. If a scene has
layered depth in the SVG but every layer moves at the same rate, it reads flat
regardless of how good any single animation is.

---

## Diagnostic Table — Feedback Symptom → Principle → Fix

| Feedback says... | Likely principle(s) violated | Fix |
|-------------------|------------------------------|-----|
| "feels like a slide deck / PowerPoint" | Anticipation + Follow-through + Arcs + Secondary action (usually all 4 at once) | Apply all four patterns above to the scene's hero beat first, then supporting elements |
| "stiff" / "robotic" / "mechanical" | Slow in/out (check for missed linear), Arcs | Re-check CHECK 2 in `05`; add arc lift to any straight `slideIn` |
| "everything happens at once" | Staging, Timing | Re-stagger per `06` Consistency Standards table; confirm Entry Order (CHECK 7 in `05`) |
| "nothing moving during the hold" | Straight Ahead/Pose-to-Pose, Secondary action | Add secondary-action loop per above; confirm continuous loops run past last keyframe |
| "flat" / "2D-looking" | Solid Drawing (depth/parallax), Arcs | Differentiate period/amplitude by layer depth; add arc lift on traversals |
| "boring" / "nothing interesting happening" | Secondary action, Exaggeration | Add secondary action first — exaggeration has a hard ceiling (`06`), don't raise it |
| "the [part] just stops dead" | Follow-through & overlapping action | Offset that child's settle to start at parent's END frame, give it overshoot |
| "[element] just teleports into place" | Anticipation | Add pre-dip before its main entrance |

---

## Workflow for Per-Scene Feedback

1. Read the feedback for the scene.
2. Map each note to a row in the Diagnostic Table above (or the Status table
   if it's not a "presentation" complaint — e.g. "wrong color" is `06`'s
   palette section, not a principle issue).
3. Apply the matching pattern(s) from this file, respecting the locked
   constants in `06` (stagger gaps, scale floors, hold-time rule) — these
   patterns layer ON TOP of those constants, they don't override them.
4. Re-run the relevant `05-qa-checklist.md` checks (2, 3, 4, 5, 7) since arc/
   follow-through edits touch transform and timing values those checks cover.
5. Note in the commit message which principle(s) were the fix, e.g.
   `fix: scene12 — add anticipation+follow-through to ship entrance`.
