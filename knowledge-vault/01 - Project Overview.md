---
tags: [overview, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 01 · Project Overview

← back to [[00 - START HERE]]

## What is this

**Mastering Persuasion** is a **20-frame, 1920×1080 SVG explainer video** on
**maritime safety-communication training** — how mariners persuade one another
to work safely (AB & Bosun, master–pilot relationship, correcting habits,
resolving terminal disputes, new procedures, the persuasive leader).

Each frame is one screen of the video, carrying **one idea**, produced
frame-by-frame as clean, layered SVG and handed to a **Claude Code + Remotion**
pipeline to animate against a **9:46 audio track** at **30 fps**.

## The house style

Every visual follows **STS Motion — "Persuasion"**, the studio's house style for
infographic explainer videos. It is bound to this project as a design system
(see [[06 - File Manifest]]) and reproduced in brief in [[04 - Design System Reference]].
This project's `CLAUDE.md` narrows that system to the **Mastering Persuasion**
production rules — most importantly a **single blue family + one alert red**,
where all multi-color reference sketches are translated into blue.

## The one promise everything serves

> **One blue family, rendered as live DM Sans text, with filled illustration
> icons, a wave-line water signature, and semantic snake_case ids on every
> animatable group.**

Every rule in [[04 - Design System Reference]] and [[03 - Production Process]]
exists to protect that promise and keep the frames Remotion-ready.

## Who / what it's for

- **Audience of the video:** mariners / maritime crews in safety training.
- **Producer:** future-you (and Claude) generating and refining frames.
- **Consumer of the output:** the Claude Code + Remotion animation pipeline.
- **Output:** 20 on-brand, animation-ready `frame_*.svg` files + an audio-locked
  animation manifest.

## Why it exists (this vault)

The production has many moving parts — 20 frames, a reference corpus, a design
system, wave variants, naming conventions, timecodes, and four interactive QA
tools. This vault is the **single map** of all of it, so a future series can be
built the same way without re-deriving the system. See [[02 - Current State]]
for exactly where things stand.

## Ground truth & authority (important)

- **Content ground truth:** `references/video-frames/Frame_N.png` — the 20
  reference frames for THIS video. `Frame_N.png` ↔ `frame_N.svg`.
- **Style-principle references only:** `references/style-svgs/` are SVGs from
  *other* scripts (Ballast Water, etc.) — palette/linework/layering reference,
  **never this video's content**.
- **Rule authority order:** the founder *Motion Graphics* style guide (if it
  surfaces) > the bound design system > this project's `CLAUDE.md` > this vault.
  This vault is a faithful map, not the origin — log corrections in
  [[07 - Maintenance & Future-Proofing]].
