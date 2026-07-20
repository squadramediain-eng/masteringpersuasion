---
tags: [moc, index, sts-motion, mastering-persuasion]
type: map-of-content
updated: 2026-07-15
---

# 🧭 START HERE — Mastering Persuasion

> Home note for the whole project. Everything links from here.
> If you open Obsidian and don't know where to go — you're already here.

**One-line premise:** we are producing **Mastering Persuasion** — a 20-frame,
**1920×1080 SVG** explainer video (maritime safety-communication training),
built frame-by-frame in the **STS Motion "Persuasion"** house style to feed a
**Claude Code + Remotion** animation pipeline.

- **Runtime:** 9:46 audio-locked · **20 frames**, 0-indexed (`frame_0 … frame_19`)
- **Delivery:** clean, layered, animation-ready SVG · **30 fps**
- **Style authority:** the bound **STS Motion — Persuasion** design system + this project's `CLAUDE.md`

---

## 🗺️ The map

| Note | What it answers |
|---|---|
| [[01 - Project Overview]] | What is this video, who's it for, why it exists |
| [[02 - Current State]] | Exactly where we are — what's done, what's pending |
| [[03 - Production Process]] | The per-frame workflow + the QA/Design-Review gates |
| [[04 - Design System Reference]] | The visual grammar (palette, type, motifs, waves) |
| [[05 - Frame Production Checklist]] | ✅ Step-by-step to build a frame (and a batch) without missing a gate |
| [[06 - File Manifest]] | Every file, where it lives, what it does |
| [[07 - Maintenance & Future-Proofing]] | How to keep this alive & reuse the structure |
| [[08 - Glossary]] | Terms decoded (viewBox, tonal stroke, archetype, wave variant…) |
| [[09 - Frame Inventory & Archetypes]] | All 20 frames: title · archetype · timecode · content |
| [[10 - Animation Pipeline]] | Remotion handoff — Animation Guider, timecodes, JSON export |
| [[11 - The Toolkit]] | The interactive tools: QA · Design Review · Animation · Inventory · Gallery |

---

## ⚡ Quick actions

- **Building a new frame?** → [[05 - Frame Production Checklist]]
- **Coming back after a break?** → [[02 - Current State]]
- **Need to check a color / rule?** → [[04 - Design System Reference]]
- **Ready to animate?** → [[10 - Animation Pipeline]]
- **Which archetype is frame N?** → [[09 - Frame Inventory & Archetypes]]
- **Lost a file?** → [[06 - File Manifest]]

---

## 🎯 The non-negotiables (memorize these)

Hard rules from `CLAUDE.md`. Breaking any one reads as off-brand instantly. Full detail in [[03 - Production Process]] and [[04 - Design System Reference]].

1. **Artboard is always `viewBox="0 0 1920 1080"`** with explicit `width`/`height`.
2. **Frames are 0-indexed** — `frame_0 … frame_19`. `frame_N.svg` ↔ `references/video-frames/Frame_N.png`.
3. **Single blue family + one alert** (`#ac4f55`, hazard only). Translate every multi-color reference into blue. **Never a flat full-bleed fill.**
4. **Text stays live DM Sans** (`<text>`), never outlined. DM Mono for spec captions.
5. **No emoji, no unicode symbols, no icon fonts, no logo/wordmark.**
6. **Every animatable element in a semantic snake_case `id` group** — Remotion targets these.
7. **Two gates before a frame is done** — [[11 - The Toolkit|QA Checker]] must PASS and [[11 - The Toolkit|Design Review]] must reach **≥ 96%** vs the reference.

---

*Vault updated 2026-07-15 to reflect the live Mastering Persuasion production. Keep the "updated:" front-matter current when you edit a note.*
