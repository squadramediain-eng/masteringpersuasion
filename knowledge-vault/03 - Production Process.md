---
tags: [process, workflow, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 03 · Production Process

← back to [[00 - START HERE]] · related: [[04 - Design System Reference]] · [[05 - Frame Production Checklist]] · [[11 - The Toolkit]]

How a single frame goes from reference PNG to Remotion-ready SVG. The rules
below come from this project's `CLAUDE.md` — they are the operating contract.

---

## The per-frame gate sequence (never skip a gate)

For each frame `N`:

1. **Open the reference** — `references/video-frames/Frame_N.png`. This is the content ground truth.
2. **Identify the archetype + content** — match to one of the eight layout archetypes (below) using the Component Inventory. → [[09 - Frame Inventory & Archetypes]].
3. **Build rich SVG** — per the colour, type, illustration and structure rules in [[04 - Design System Reference]].
4. **Run [[11 - The Toolkit|QA Checker]]** → must **PASS**: palette 0 off-spec, DM Sans present, structure valid, concept-circle conformance, sufficient density.
5. **Run [[11 - The Toolkit|Design Review]]** vs the reference → must reach **≥ 96% match** (layout, character, icon fidelity, content-fit).
6. **Only then mark done.**

Work in **batches of 4**; the user confirms before the next batch.

---

## The layout archetypes — every frame is one of these

Identify the archetype **first**, then populate. (Frame assignments in [[09 - Frame Inventory & Archetypes]].)

| Code | Archetype | Shape |
|---|---|---|
| **A** | Section divider | Giant `#6084f0` numeral + two-tone title on bare canvas + scene on the wave band |
| **B** | Compare X / ✓ | Two dashed panels — alert-X (`#ac4f55`) wrong vs blue-✓ right. Text-free, wave-free |
| **C** | Comparison table | 3-column table (Strategy / Approach / Result) + framing scene icons |
| **D** | Stat hero | Giant gradient numeral + orbiting concept icons + faint concentric guides |
| **E** | Convergence | Central element (card / tablet / big "?") with icons + arrows pointing inward |
| **F** | Step flow | Concept-circle steps linked by arrows + supporting icons |
| **G** | Circle cluster | Central hero character ringed by tinted trait concept-circles |
| **H** | Scenario scene | Full illustrated scene + quote / speech bubble + labelled props |
| *Cover* | (frame 0) | Two-tone display title + free-floating library icons + ship on wave band |
| *Icon grid* | (frame 2) | 3×2 tinted tiles, step badge + per-card library icon |

---

## The five hard rules (from `CLAUDE.md`)

1. **`viewBox="0 0 1920 1080"`** + explicit `width`/`height`; root `<g isolation="isolate">`.
2. **Live `<text>` in DM Sans** (headings 600, kickers/emphasis 700, body 450); **DM Mono** for spec captions. Never outline text.
3. **Single blue family + one alert.** Translate every reference colour into blue; the only non-blue is `#ac4f55` for hazard/alert. **Never a flat full-bleed fill** — always layer illustrative vectors on the light canvas.
4. **No emoji / unicode / icon font / logo / wordmark.**
5. **Every animatable element in a semantic snake_case `id` group** — wave layers each their own id (`wave_1…`), characters split (`ab`, `bosun`), numerals/icons/props all named.

## XML hygiene (for the Remotion pipeline)

- Backgrounds: light `#f5f6fa` / `#f4f6f9` canvas + faint grid — never a deep-blue divider block.
- No `--` inside XML comments; escape `&` as `&amp;`.
- Concept-circle is the default icon container (`#f3f4fa` fill + `#71afd8` 2px stroke, r ≈ 80).
- Wave band at base = multi-layer gradient + foam line + particles (see [[10 - Animation Pipeline]] for wave-layer ids).

---

## The quality bar

Passing QA is **necessary but not sufficient**. A frame is done only when it
also **looks like** its reference and **fits the frame's content/context**. When
in doubt, compare side-by-side in [[11 - The Toolkit|Design Review]] and fix to
**≥ 96%** before moving on.
