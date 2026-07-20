---
tags: [animation, remotion, pipeline, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 10 · Animation Pipeline

← back to [[00 - START HERE]] · tool: [[11 - The Toolkit]] · frames: [[09 - Frame Inventory & Archetypes]]

> How the 20 static SVG frames become the animated video: **Claude Code +
> Remotion**, driven by an audio-locked manifest exported from the Animation Guider.

## The manifest

The **[[11 - The Toolkit|Animation Guider]]** is the source of truth for timing.
Key constants (in `Animation Guider.html`):

- **FPS:** `30`
- **Audio:** `audio/mastering-persuasion.mp3`
- **Total duration:** `586s` = **9:46**, audio-locked.
- **`FRAME_START` / `FRAME_END`** — the **authoritative per-frame times from the
  audio** (seconds). These are not guesses; they come from the narration.
- Per-frame durations are seeded from `FRAME_END[i] − FRAME_START[i]` and can be
  time-stretched in the tool without breaking the audio lock.

## The exported JSON (`animation.json`)

`Export Remotion JSON` emits, per project:

```
project, style, width:1920, height:1080, fps:30,
totalDurationSec:586, totalDurationFrames, audio, easings,
frames:[ { index, title, archetype, file,
           startSec, durationSec, endSec,
           startFrame, durationFrames, beat,
           elements:[ { id, rec … } ] } ]
```

- **`file`** points at `frames/frame_N.svg`.
- **`elements`** are the semantic snake_case ids Remotion targets — each carries
  its motion recipe (`rec`). This is why the [[03 - Production Process|naming pass]]
  matters: an unnamed group can't be animated.
- **`easings`** — brand `cubic-bezier(0.16,1,0.3,1)` + sine/linear for ambient loops.

## What Remotion consumes

1. Load `animation.json` + the 20 `frame_*.svg` files + the audio.
2. Place each frame at its `startFrame`, mount for `durationFrames`.
3. Animate the named element ids per their recipes (enter/emphasis/exit).
4. Render 1920×1080 @ 30 fps against the 9:46 audio.

## Rules that keep frames animatable

- **Every animatable element in a semantic snake_case `id` group** — wave layers each their own id (`wave_1`, `wave_2`…), characters split (`ab`, `bosun`), numerals / icons / props all named.
- **Live `<text>`** — Remotion loads DM Sans in-composition, so text must stay real text, never outlined.
- **Root `<g isolation="isolate">`** so layer blending is predictable.
- **Decorative loops avoided** in the static SVG — motion is authored in Remotion, so the frames export cleanly to PDF too.

## The wave system (animation-relevant)

- Authentic wave sources live in `references/wave-src/` (`authentic-waves.svg`, `mp-frame_*.svg`, `variant_B.block.txt`, `variant_C.block.txt`).
- **Three variants A / B / C** are distributed so **no two adjacent frames share a wave** — this keeps the water reading alive across cuts.
- Each wave layer has its own id (`wave_1…`) so crests can drift independently.
- Waveless frames (1, 8, 12, 15, 17, 18) have **no** wave group — don't add one.

## When timing changes

Edit `FRAME_START` / `FRAME_END` in the Animation Guider, re-export
`animation.json`, and confirm `totalDurationSec` still equals the audio length.
Log it in [[07 - Maintenance & Future-Proofing#Changelog]].
