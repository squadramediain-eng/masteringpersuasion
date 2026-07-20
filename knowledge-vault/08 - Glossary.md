---
tags: [glossary, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 08 · Glossary

← back to [[00 - START HERE]]

Plain-language decoder for the terms used across this vault.

- **Mastering Persuasion** — this project: a 20-frame explainer video on maritime safety-communication / persuasion training.
- **STS Motion** — the illustration + motion-graphics studio whose house style this follows.
- **Persuasion** — the studio's house style for infographic explainer videos; the bound design system.
- **Frame** — one 1920×1080 SVG artboard = one screen of the video, carrying one idea. `frame_0 … frame_19`.
- **0-indexed** — frames count from 0. `frame_N.svg` matches `references/video-frames/Frame_N.png`. Never 1-index.
- **Reference frame** — `Frame_N.png` under `references/video-frames/` — the **content ground truth** for frame N.
- **Style-svg** — an SVG under `references/style-svgs/` from another script — **style-principle reference only**, never this video's content.
- **Archetype** — a reusable frame layout. Eight codes: **A** Section-divider · **B** Compare X/✓ · **C** Comparison table · **D** Stat hero · **E** Convergence · **F** Step flow · **G** Circle cluster · **H** Scenario scene (plus Cover and Icon-grid one-offs). See [[03 - Production Process]].
- **viewBox / artboard** — the SVG coordinate frame. Always `0 0 1920 1080`.
- **Single blue family** — this project's colour rule (`CLAUDE.md`): translate every reference colour into blue. The only non-blue is the alert red.
- **Alert** — `#ac4f55`, the one non-blue value, reserved for hazard / destructive cues. Never decorative.
- **Tonal stroke** — a shape outlined with a **darker step of its own fill**, not a universal black line. The studio's signature linework.
- **Ink** — `#253761`, the deep blue reserved for fine linework / hair detail and text.
- **Concept-circle** — the default icon container: `#f3f4fa` fill + `#71afd8` 2px stroke, r ≈ 80, holding a filled blue icon.
- **Spotlight** — a softly-shaded radial disc framing a filled icon.
- **Wave line / wave band** — the overlapping crest band riding a frame's baseline; the water signature.
- **Wave variant (A/B/C)** — three distinct authentic wave blocks in `references/wave-src/`, rotated so no two adjacent frames share one. Some frames are intentionally waveless.
- **Section numeral** — the large filled `#6084f0` digit on section-divider (A) frames.
- **Semantic id** — a meaningful snake_case `id` on every animatable group (`wave_1`, `ab`, `bosun`, `section_numeral`…). Remotion targets these.
- **QA Checker** — the deterministic pass/fail tool: palette, structure, naming, density. Gate 1. → [[11 - The Toolkit]].
- **Design Review** — the side-by-side-vs-reference tool; the ≥ 96% match gate. Gate 2.
- **Animation Guider** — the audio-locked timeline that exports the Remotion `animation.json`. → [[10 - Animation Pipeline]].
- **Component Inventory** — live-parses all 20 frames and reports archetype + naming-clean status.
- **Frame Gallery** — grid overview of all produced frames.
- **DM Sans / DM Mono** — the only typefaces. DM Sans for everything; DM Mono for spec/caption only. Text stays live `<text>`, never outlined.
- **Remotion** — the React-based video framework the frames animate in. Part of the Claude Code + Remotion pipeline.
- **Audio-locked** — timings tied to the 9:46 (586s) audio track at 30 fps; per-frame `startSec`/`endSec` come from the audio, not guesses.
- **Deterministic** — same input always gives the same result; no model/opinion. Why the QA gate is trustworthy.
