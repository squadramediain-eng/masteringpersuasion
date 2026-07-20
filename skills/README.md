# Remotion Skills — Index

8 files. Read only what you need for the current step. Never read all 8 at once.

## Which file to read when

| You're about to... | Read |
|-------------------|------|
| Start on any new SVG file | `01-svg-pipeline.md` |
| Write a Scene_XX.tsx | `02-scene-build.md` |
| Add any animation | `03-animation-library.md` |
| Plan a scene (before coding) | `04-scene-planning.md` |
| Commit a scene | `05-qa-checklist.md` |
| Check visual quality | `06-creative-standards.md` |
| Wire MainComposition, fix errors, start/end session | `07-project-operations.md` |
| Fix a scene against specific feedback ("feels stiff/presentation-y") | `08-twelve-principles.md` |

## What was eliminated and why

The original 17 files had significant overlap:
- `motion-graphics-expert.md` + `animation-patterns.md` + `creative-standards.md` → merged into `03` + `06` (easing rules appeared 3 times)
- `scene-build-guide.md` → `02-scene-build.md` (removed "what not to do" repetition, kept the pattern)
- `narration-sync.md` → folded into `04-scene-planning.md` (narration sync is part of planning, not separate)
- `scene-timing.md` → folded into `03` and `07` (timing constants belong where they're used)
- `svg-extractor.md` + `svg-depth-rules.md` → merged into `01-svg-pipeline.md` (one file = one SVG workflow)
- `qa-manager.md` (16 checks) → `05-qa-checklist.md` (10 checks — SVG validator handles what was checks 1, 12, 15, 16)
- `batch-workflow.md` + `remotion-composition-guide.md` + `error-patterns.md` + `shared-components.md` → merged into `07-project-operations.md`
- `transitions-cinematic-flow.md` → removed (project uses SceneWrapper fade only, no TransitionSeries)
- `positioning-and-placement.md` → removed (SVG viewBox handles layout; the 1920×1080 grid is enforced by the SVG design, not code)

## Token budget per task

- Simple scene (waves + ship + text): read files 01, 02, 03 → ~3k tokens
- Complex scene (fish, icons, rings): add 04 → ~4k tokens  
- QA pass: file 05 only → ~1k tokens
- Session start/end: file 07 only → ~1k tokens
- Feedback-driven fix pass: file 08 (+ 06 if it's a palette/hierarchy note) → ~2k tokens

**Never read 06-creative-standards.md or 08-twelve-principles.md at first-draft
code-writing time.** Read them at design-review / feedback-fix time — once per
batch or once per scene-feedback-item, not while building a scene from scratch.
