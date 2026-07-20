---
tags: [status, progress, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 02 · Current State

← back to [[00 - START HERE]]

> Snapshot of exactly where the production stands. Update as things move.

## ✅ Done

- [x] **All 20 frames produced** — `frames/frame_0.svg … frame_19.svg`, each matched to its `references/video-frames/Frame_N.png`. See [[09 - Frame Inventory & Archetypes]].
- [x] **Design system bound & applied** — STS Motion "Persuasion" at `_ds/…-85ac6073-…/`; frames follow the `CLAUDE.md` blue-family narrowing of it.
- [x] **Authentic illustrator waves integrated** — real wave vectors from the DS applied across frames; three distinct variants (**A / B / C**) distributed so neighbouring frames differ.
- [x] **Waves removed where the reference has none** — frames **1, 8, 12, 15, 17, 18** carry no wave band by design; stray wave layers stripped from **5, 11, 12, 14, 16**.
- [x] **Semantic naming pass complete** — every animatable group across all 20 frames has a meaningful snake_case `id` (no NONAME / cryptic codes). Validated against `uploads/svg-validator.html` — **zero naming errors**.
- [x] **Animation manifest audio-locked** — [[11 - The Toolkit|Animation Guider]] carries the authoritative per-frame timecodes (0:00 → 9:46, 30 fps) and exports Remotion JSON with `startSec/endSec/durationFrames/totalDurationSec`. See [[10 - Animation Pipeline]].
- [x] **Component Inventory live-parses** the renamed ids and reports **NAMING CLEAN** on all 20 frames.
- [x] **Toolkit bundled** — QA Checker, Design Review, Animation Guider, Component Inventory + Frame Gallery, plus 4 standalone offline HTML bundles. See [[11 - The Toolkit]].

## 🔲 Pending

- [ ] **Animate in Remotion** — export `animation.json` from the Animation Guider and wire it into the Claude Code + Remotion project with the 9:46 audio. → [[10 - Animation Pipeline]].
- [ ] **Per-frame QA / Design-Review sign-off** — confirm each frame still PASSES QA and reaches **≥ 96%** in Design Review after the latest edits. → [[05 - Frame Production Checklist]].
- [ ] **Reconcile with founder sources** if the *Motion Graphics* style guide PDF / `resolved-tokens.css` surface. → [[07 - Maintenance & Future-Proofing]].

## 📍 You are here

All 20 frames are **Remotion-ready**: authentic waves, clean semantic naming,
validator-compliant, wave-free where the reference is. The Animation Guider is
audio-locked to the real timecodes. The remaining work is the **animation pass**
in Remotion — everything upstream of it is content-complete.

## Recent decisions (so we don't relitigate)

- **Single blue family + one alert** governs colour (per `CLAUDE.md`), even though the parent DS defines a broader three-family palette — see [[04 - Design System Reference#A note on the palette]].
- **0-indexed frame naming**, always — never `frame-01`.
- **Three wave variants (A/B/C)** distributed so no two adjacent frames share a wave; some frames intentionally waveless.
- **Compare panels (07, 13) are text-free and wave-free by design** — the QA tool treats wave/live-text as informational flags there, not failures.
- **QA + Design Review are both gates** — passing QA is necessary but not sufficient; a frame is done only when it also *looks like* its reference (≥ 96%).
