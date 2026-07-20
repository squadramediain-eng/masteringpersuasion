---
tags: [manifest, files, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 06 · File Manifest

← back to [[00 - START HERE]]

> Every file that matters, where it lives, what it does.

## 🎞️ The deliverables — `frames/`

*(0-indexed; `frame_N.svg` ↔ `references/video-frames/Frame_N.png`)*

| Path | Role |
|---|---|
| `frames/frame_0.svg … frame_19.svg` | The 20 produced, animation-ready SVG frames. See [[09 - Frame Inventory & Archetypes]]. |

## 🖼️ References — `references/`

| Path | Role |
|---|---|
| `references/video-frames/Frame_0.png … Frame_19.png` | **Content ground truth** — the 20 reference frames for THIS video. |
| `references/style-svgs/` | SVGs from **other** scripts (Ballast Water, etc.) — **style-principle reference ONLY**, never this video's content. |
| `references/donors/` | Donor illustrator SVGs (`cc1`, `comm4`, `mp6`…) — objects extracted for reuse. |
| `references/art-library/` | Extracted, reusable art grouped `char/ data/ decor/ equip/ icon/ scene/ ship/`. |
| `references/wave-src/` | Authentic wave sources + the A/B/C variant blocks (`authentic-waves.svg`, `variant_B.block.txt`, `variant_C.block.txt`). → [[10 - Animation Pipeline]]. |
| `references/art-palette.json` | Sampled palette from the art library. |
| `references/_compositor.js` | Helper for composing extracted art. |

## 🎨 The bound design system — `_ds/`

*Style authority (narrowed by `CLAUDE.md`). Do not hand-edit compiler output.*

| Path | Role |
|---|---|
| `_ds/sts-motion-persuasion-design-system-85ac6073-…/` | The bound STS Motion — Persuasion system: `tokens/`, `components/`, `assets/`, `_ds_bundle.js`, `styles.css`. |

## 🛠️ The toolkit (project root) — see [[11 - The Toolkit]]

| Path | Role |
|---|---|
| `QA Checker.html` | Deterministic per-frame QA gate (palette, structure, naming, density). |
| `Design Review.html` | Side-by-side vs reference; ≥ 96% match gate. |
| `Animation Guider.html` | Audio-locked timeline + Remotion JSON export. → [[10 - Animation Pipeline]]. |
| `Component Inventory.html` | Live-parses all 20 frames; archetype + naming-clean status. |
| `Frame Gallery.html` | Grid view of all frames. |
| `Mastering Persuasion - … (standalone).html` | 4 offline bundles (QA · Design Review · Animation Guider · Frame Gallery). |
| `*-print.html` | Print variants of the tools. |
| `uploads/svg-validator.html` | Naming / structure validator (0 errors required). |
| `CLAUDE.md` | The project operating rules (colour, naming, gates). Authority for this project. |
| `support.js` | DC runtime (do not edit). |

## 🗂️ This vault — `uploads/`

Open the `uploads/` folder in Obsidian as a vault. Notes:
[[00 - START HERE]] · [[01 - Project Overview]] · [[02 - Current State]] ·
[[03 - Production Process]] · [[04 - Design System Reference]] ·
[[05 - Frame Production Checklist]] · [[06 - File Manifest]] ·
[[07 - Maintenance & Future-Proofing]] · [[08 - Glossary]] ·
[[09 - Frame Inventory & Archetypes]] · [[10 - Animation Pipeline]] ·
[[11 - The Toolkit]]

*Also in `uploads/`: reference PNGs (`pasted-*.png`, `Frame_19.jpg`, `draw-*.png`) — working screenshots, not deliverables.*
