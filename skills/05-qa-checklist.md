# QA Checklist — Before Every Commit

Run all 12 checks in order. Report PASS/FAIL for each. Only commit on full PASS.

---

## CHECK 1 — SVG ID Wiring

```bash
node scripts/audit-scene-ids.js src/scenes/SceneXX.tsx src/assets/scenes/Frame_XX.svg
```
**PASS:** Zero IDs in code that don't exist in SVG.
**FAIL:** Silent no-ops found → fix before commit.

---

## CHECK 2 — No Linear Easing

```bash
grep -n "linear\b\|easing: 'linear'\|easing: \"linear\"" src/scenes/SceneXX.tsx
```
**PASS:** Zero results.
**FAIL:** Replace with bezier from `03-animation-library.md`.

---

## CHECK 3 — Wave X+Y Motion

```bash
grep -n "#wave_" src/scenes/SceneXX.tsx
```
Every `#wave_N` CSS rule must have both `translateX(...)` AND `translateY(Math.sin(...))`.
**PASS:** Both components present on every wave rule.
**FAIL:** X-only wave → add `translateY(${(Math.sin(frame * freq + i) * 3).toFixed(1)}px)`.

---

## CHECK 4 — Wave/Loop Diversity

```bash
grep -n "waveLoop\|floatLoop" src/scenes/SceneXX.tsx
```
Verify every call has unique (period, amplitude, phaseOffset). No two lines identical on all three.
**PASS:** All unique.
**FAIL:** Duplicates → adjust period ±5f, amplitude ±2px, phase ±15.

---

## CHECK 5 — Transform-Box on Scale/Rotate

```bash
grep -n "scale(\|rotate(" src/scenes/SceneXX.tsx | grep -v "transform-box\|//\|scaleIn\|scaleVal\|toFixed"
```
Every CSS rule with `scale()` or `rotate()` must also have `transform-box: fill-box; transform-origin: center;`.
**PASS:** All covered.
**FAIL:** Missing transform-box → add to that CSS rule.

---

## CHECK 6 — Headline Uses Wipe Reveal

```bash
grep -n "h1_text\|H1_text\|headline" src/scenes/SceneXX.tsx
```
Headline must use `clip-path: inset(...)` reveal, NOT bare `opacity` fade.
**PASS:** clip-path inset present.
**FAIL:** Bare fade → convert to wipe reveal with `Easing.out(Easing.exp)`.

---

## CHECK 7 — Entry Order

Check delay values in the file:
- BG first: start < 15
- Text last: TEXT_START > 60 and after all ELEM starts
- Nothing new enters after `durationFrames - 60`

**PASS:** BG → subject → elements → text order maintained.
**FAIL:** Text before elements, or simultaneous entries → reorder.

---

## CHECK 8 — No Safe-Zone Violations (overlay elements only)

```bash
grep -n "left: 0\b\|top: 0\b\|left: '0'\|right: 0\b\|bottom: 0\b" src/scenes/SceneXX.tsx
```
Ignore `inset: 0` on the SVG container divs — those are correct. Flag any content element at canvas edge.
**PASS:** Zero content elements at edge.
**FAIL:** Move to safe zone (min 96px from edge).

---

## CHECK 9 — Fish Squash & Stretch (fish scenes only: 13, 18, 28)

```bash
grep -n "scaleX\|scaleY" src/scenes/SceneXX.tsx
```
Each fish must have its OWN cosT/scaleX/scaleY variables (not one shared variable reused across all fish instances).
**PASS:** Independent per-fish flex variables.
**FAIL:** Shared variable → give each fish unique `phase + i * 0.65` offset.

---

## CHECK 10 — Performance

```bash
wc -l src/scenes/SceneXX.tsx
```
**PASS:** Under 400 lines.
**WARNING:** 400–600 → consider extracting sub-components.
**FAIL:** Over 600 → must refactor.

---

## CHECK 11 — Typewriter Cursor Bounds (every scene using `typewriterReveal`)

```bash
node scripts/audit-typewriter-bounds.js
```
Self-extracts every `typewriterReveal(...)` call straight from the scene
source (not a maintained list — can't go stale), measures each target id's
REAL bounding box in document-space (accounts for ancestor transforms via
`getCTM()`, not just local `getBBox()`), and flags any hardcoded `{ left,
top, right, bottom }` that drifts from the measurement. This is the root
cause of "cursor not at the end of the last letter" — the cursor position
AND the clip-path reveal are both computed from that one bounds literal;
if it was ever eyeballed, copy-pasted from an old comment, or measured
against a since-changed SVG, the cursor silently lands in the wrong place.
**PASS:** `0 bounds mismatch(es)` for all scenes.
**FAIL:** Any mismatch reported → paste the script's `measured:` values
straight into the flagged scene's `typewriterReveal(...)` call. Never
hand-estimate or reuse an old comment's coordinates.

---

## CHECK 12 — Dasharray Without Opacity

```bash
node scripts/audit-dasharray-opacity.js
```
Static check: every CSS rule with `stroke-dasharray` must have a matching
`opacity` rule for the same id somewhere in the file. Dasharray only
affects a stroke — a sibling `<circle>` end-dot, an `<image>`, or any
unstroked fill inside that same group sits fully visible from frame 0
regardless of the offset animation, with no error anywhere. This exact bug
shipped in scenes 04, 06, 15, and 21 in the 2026-06-24 pass (small dots /
outlines visible "from the start") before being caught by eye.
**PASS:** `OK — every stroke-dasharray rule has a matching opacity rule.`
**FAIL:** Add `opacity: ${fadeIn(...)}` to the flagged id's rule, tied to
the same start frame as its draw-on.

---

## QA Report

```
QA — SceneXX — [date]
CHECK 1  ID Wiring:          PASS / FAIL
CHECK 2  No Linear:          PASS / FAIL
CHECK 3  Wave X+Y:           PASS / FAIL
CHECK 4  Loop Diversity:     PASS / FAIL
CHECK 5  Transform-Box:      PASS / FAIL
CHECK 6  Headline Wipe:      PASS / FAIL
CHECK 7  Entry Order:        PASS / FAIL
CHECK 8  Safe Zone:          PASS / FAIL
CHECK 9  Fish Squash:        PASS / N/A
CHECK 10 Line Count:         PASS / FAIL — [N lines]
CHECK 11 Typewriter Bounds:  PASS / FAIL
CHECK 12 Dasharray Opacity:  PASS / FAIL

OVERALL: APPROVED / NEEDS FIXES
```

---

## Common Silent Failures (check these if scene renders wrong)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Layer visible but not animating | ID casing mismatch | grep IDs from actual SVG |
| All black frame | SVG import path wrong | check `src/assets/scenes/Frame_XX.svg` exists |
| Element rotates from corner | Missing `transform-box: fill-box` | add to every rotate/scale rule |
| Waves move in lockstep | Identical phase offsets | add `+ i * 20` per wave |
| Reveal looks choppy | Linear math on titleReveal | use `interpolate` + `Easing.out(Easing.exp)` |
| Audio at wrong time | `audioStartSec` modified | revert to sceneRegistry.ts value |
| Cursor sits mid-word, not after the last typed letter | `typewriterReveal` bounds were hand-estimated or reused from an old comment instead of measured | run CHECK 11 (`audit-typewriter-bounds.js`), paste in the measured values |
| Dot/line/outline visible from frame 0 despite a draw-on animation | `stroke-dasharray` rule with no `opacity` rule for that id — dasharray doesn't hide fills/unstroked children | run CHECK 12 (`audit-dasharray-opacity.js`), add the missing `opacity` |
| Rotation wobbles instead of spinning cleanly in place | `transform-box: fill-box; transform-origin: center` on a `<g>` with mixed/offset children — bbox center ≠ visual center | measure the true pivot (`scripts/measure-bbox.js` or a one-off `getBBox()`/`getCTM()` check) and use `transform-box: view-box; transform-origin: {cx}px {cy}px` instead |
