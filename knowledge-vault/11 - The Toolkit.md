---
tags: [tools, qa, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 11 · The Toolkit

← back to [[00 - START HERE]] · process: [[03 - Production Process]] · checklist: [[05 - Frame Production Checklist]]

> Five interactive HTML tools (project root) drive QA, review, animation and
> inventory. Each also has an **offline standalone bundle** for sharing.

## QA Checker — `QA Checker.html`  · **Gate 1**

Deterministic pass/fail per frame. Checks:
- **Palette** — every colour must be a system token; **0 off-spec** to pass.
- **Structure** — `viewBox="0 0 1920 1080"`, `<g isolation="isolate">` root, ≥ 3 named groups.
- **Typography** — DM Sans present; live `<text>`.
- **Concept-circle conformance** and **density** (rich, not sparse).

Passing QA is **necessary but not sufficient** — see the Design Review gate.

## Design Review — `Design Review.html`  · **Gate 2**

Side-by-side of each `frame_N.svg` vs its `Frame_N.png` reference. Scores
**layout · character · icon fidelity · content-fit** and must reach **≥ 96%**
before a frame is done. This is the real quality bar.

## Animation Guider — `Animation Guider.html`

The audio-locked timeline and **Remotion manifest** exporter.
- 20 frames · 1920×1080 · **30 fps** · total **9:46** (586s), audio-locked.
- Holds the authoritative `FRAME_START` / `FRAME_END` times.
- `Export Remotion JSON` → `animation.json` (per-frame `startFrame`/`durationFrames`, per-element recipes). → [[10 - Animation Pipeline]].

## Component Inventory — `Component Inventory.html`

Live-parses all 20 frames and reports:
- Each frame's **archetype**, title, and text/illustration breakdown.
- **NAMING CLEAN** status (semantic ids), total shapes, archetypes-in-use, frames-with-characters.
- The **archetype legend** (A–H + Cover + Icon-grid) — the reference used in [[03 - Production Process]] and [[09 - Frame Inventory & Archetypes]].

## Frame Gallery — `Frame Gallery.html`

Grid overview of all produced frames — the fastest way to eyeball the whole
series for consistency.

## Validator — `uploads/svg-validator.html`

Naming / structure validator. Every frame must show **0 naming errors**. Run
alongside QA in Phase D of the [[05 - Frame Production Checklist]].

---

## Standalone bundles (offline / shareable)

Self-contained copies with no external file refs — safe to send to a reviewer:

- `Mastering Persuasion - QA Checker (standalone).html`
- `Mastering Persuasion - Design Review (standalone).html`
- `Mastering Persuasion - Animation Guider (standalone).html`
- `Mastering Persuasion - Frame Gallery (standalone).html`

> **Keep bundles fresh.** If you edit a tool, regenerate its standalone bundle —
> the offline copy does not live-sync. See [[07 - Maintenance & Future-Proofing#When you change a tool]].

## Print variants

Each tool has a `*-print.html` for PDF/print output.
