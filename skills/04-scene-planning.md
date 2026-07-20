# Scene Planning — Plan Before Code

## The Rule

Write the plan → user confirms → then code. Never reverse this order.
A plan correction costs zero tokens. A code correction costs hundreds.

---

## Planning Steps

**1. Get timing from sceneRegistry.ts**
```
audioStartSec: 131  →  segment starts at 131s in the MP3
durationFrames: 450  →  15 seconds, 450 frames
```

**2. Extract SVG layers** (run the validator first — see 01-svg-pipeline.md)
```bash
grep -o 'id="[^"]*"' src/assets/scenes/Frame_XX.svg \
  | grep -v 'linear-gradient\|radial-gradient\|clipPath\|filter\|mask' \
  | sed 's/id="//;s/"//' | sort -u
```

**3. Map narration → frames**
Listen to the audio segment. Note what the narrator says and at which second within the segment.
```
frame = seconds_into_segment × 30
```
Example for 15s (450f) segment:
- 0–2s: introduces topic → BG + subject enter → frames 0–60
- 2–5s: mentions "8 categories" → icons stagger in → frames 60–150
- 5–9s: continues list → more icons → frames 150–270
- 9–12s: states headline → h1_text reveals → frames 270–360
- 12–15s: elaborates → hold → frames 360–450

**4. Assign animation types**

| Narration says... | Element type | Animation |
|------------------|-------------|-----------|
| Sets the scene | BG + subject | fadeIn + slideIn |
| Lists items | Icons (one per item) | staggered scaleIn |
| States conclusion | h1_text | wipe reveal |
| Describes process | Arrows/lines | drawLine |
| Talks about flow | Waves, float | loops (already running) |

---

## Plan Format (write this before coding)

```
SCENE XX — Frame_XX.svg — NNNf (Ns) — audioStart: NNNs

BACKGROUND
  #bg — fadeIn(0, 20). Static dark blue.

WAVES
  #wave_1→4 — waveLoop from frame 0, unique period/amplitude/phase per wave.

[MAIN SUBJECT — match name to actual SVG ID]
  #ship — slideIn from left frames 0→30, floatLoop(90, 8) from frame 30 onward.

[SUPPORTING ELEMENTS]
  #icon_1→4 — staggered scaleIn(0.65) every 10f starting frame 90.
              (narration mentions them at ~3s = frame 90)

[HEADLINE TEXT — match actual SVG ID]
  #h1_text — clip-path wipe reveal frames 270→295.
             (narration states headline at ~9s = frame 270)

[SECONDARY TEXT]
  #text_1→3 — staggered fadeIn + slideIn(8px down), 12f gaps, starting frame 290.

COMPLETION
  All elements visible by frame 120 (or earlier if scene < 300f).
  Hold: frame [300] → [420]. Transition: last 30 frames.
```

---

## Hold Time Rule

Animate in first 60–70% of scene. Last 30–40% is hold + transition.

| Scene length | Animate until | Hold from | Transition |
|-------------|--------------|-----------|-----------|
| 300f (10s) | frame 180 | 180–270 | 270–300 |
| 450f (15s) | frame 300 | 300–420 | 420–450 |
| 540f (18s) | frame 360 | 360–510 | 510–540 |

---

## After Plan Is Confirmed

Build using `02-scene-build.md` pattern.
Animate using `03-animation-library.md` functions.
QA using `05-qa-checklist.md` before committing.
Do NOT modify the plan mid-build. If a layer ID doesn't exist, note it in QA comments — don't silently substitute.
