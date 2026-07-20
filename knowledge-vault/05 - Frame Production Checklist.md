---
tags: [checklist, production, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 05 · Frame Production Checklist

← back to [[00 - START HERE]] · process: [[03 - Production Process]] · tools: [[11 - The Toolkit]]

> **The "never miss a gate" note.** Work top to bottom for each frame. Build in
> **batches of 4**; get user confirmation before the next batch.

## Phase A — Read the reference

- [ ] Open `references/video-frames/Frame_N.png` (0-indexed — `Frame_0 … Frame_19`).
- [ ] Note the single idea the frame carries and the emotional beat.
- [ ] Pull palette/linework cues from `references/style-svgs/` **only as style reference** — never as this video's content.

## Phase B — Identify the archetype

- [ ] Match the frame to one archetype (A–H, Cover, or Icon grid) — see [[03 - Production Process#The layout archetypes]] and [[09 - Frame Inventory & Archetypes]].
- [ ] Confirm expected components: numeral? compare panels? table? convergence arrows? scenario scene? wave band or intentionally waveless?

## Phase C — Build the SVG

- [ ] `viewBox="0 0 1920 1080"` + explicit `width`/`height`; root `<g isolation="isolate">`.
- [ ] Light canvas `#f5f6fa` + faint grid — **never a flat full-bleed fill**.
- [ ] Colour in the **single blue family**; alert `#ac4f55` only for hazard.
- [ ] Icons = filled tonal illustrations in concept-circles; rich, not sparse.
- [ ] Live `<text>` in DM Sans (600/700/450), DM Mono for spec captions; body ≥ 22px.
- [ ] Wave band per the frame's variant (or omit if the reference has none).
- [ ] **Every animatable element** in a semantic snake_case `id` group.
- [ ] XML hygiene: no `--` in comments, `&` → `&amp;`, no logo/wordmark.

## Phase D — Gate 1: QA Checker

- [ ] Open the frame in **[[11 - The Toolkit|QA Checker]]** → must **PASS**:
  - [ ] Palette: **0 off-spec** colours.
  - [ ] DM Sans present; structure valid (viewBox, isolate root, named groups).
  - [ ] Concept-circle conformance; sufficient density.
- [ ] Cross-check naming in `uploads/svg-validator.html` → **0 naming errors**.

## Phase E — Gate 2: Design Review

- [ ] Open the frame side-by-side with its reference in **[[11 - The Toolkit|Design Review]]**.
- [ ] Must reach **≥ 96% match** — layout, character, icon fidelity, content-fit.
- [ ] Fix anything below 96% before moving on.

## Phase F — Mark done & record

- [ ] Update [[02 - Current State]] and, if animating, the frame's row in the [[11 - The Toolkit|Animation Guider]].
- [ ] Confirm the batch of 4 with the user before starting the next.
- [ ] Log any rule/decision worth remembering in [[07 - Maintenance & Future-Proofing#Changelog]].

---

### 🧷 Gotchas to watch

- **0-indexed, always.** `frame_N.svg` ↔ `Frame_N.png`. Never 1-index.
- **Compare panels (B) are text-free & wave-free by design** — QA flags wave/live-text there as informational, not failures.
- **Don't copy reference colours literally** — translate every hue into the blue family.
- **Waveless frames are intentional** (1, 8, 12, 15, 17, 18) — don't "fix" them by adding a wave band.
- **QA pass ≠ done.** The Design-Review ≥ 96% gate is the real bar. See [[03 - Production Process#The quality bar]].
