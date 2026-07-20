---
tags: [maintenance, future-proofing, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 07 · Maintenance & Future-Proofing

← back to [[00 - START HERE]]

> How to keep this system alive, correct, and **reusable for the next series**.
> The core risk is **silent drift** — the reason the QA + Design-Review gates
> exist. Keep the frames, the tools, the design system, and this vault in sync.

## The golden rule of sync

Sources of truth, in priority order:

1. **Founder sources** — the *Motion Graphics* style guide PDF + `resolved-tokens.css` / `DESIGN.md`. **Highest authority.** Not present at authoring time.
2. **The bound design system** — `_ds/…-85ac6073-…/` (`tokens/`, `components/`, guide).
3. **`CLAUDE.md`** — this project's operating rules (narrows #2 to the blue family).
4. **This vault** — a map of #1–#3.

> When any two disagree, the **higher-priority one wins**, and you push the
> correction downward. Never let the frames or vault diverge silently.

## When founder sources finally arrive

- [ ] Diff their token values against [[04 - Design System Reference]] and the DS `tokens/colors.css`.
- [ ] For every mismatch: update `CLAUDE.md` and the DS first, then re-QA every frame, then update this vault.
- [ ] Re-run the QA + Design-Review gates on all 20 frames.
- [ ] Log the reconciliation in the [[#Changelog]] below.

## When the palette / tokens change

Go source-of-truth first, downstream last:

1. Edit `CLAUDE.md` (the operative colour spec for this project) and/or the DS `tokens/*.css`.
2. Update the allowed-palette list inside **[[11 - The Toolkit|QA Checker]]** and `uploads/svg-validator.html` — otherwise QA will reject valid new colours or accept retired ones.
3. Re-run QA + Design Review on affected frames.
4. Update [[04 - Design System Reference]] in this vault.

## When you add a frame, archetype, or wave variant

- [ ] Add the frame to [[09 - Frame Inventory & Archetypes]] and the Component Inventory's `META`/`TITLES` maps.
- [ ] A new archetype → document it in [[03 - Production Process#The layout archetypes]].
- [ ] A new wave variant → add the block to `references/wave-src/` and note it in [[10 - Animation Pipeline]].
- [ ] Re-run the tools so their live counts pick it up.

## When you change a tool

- [ ] Keep the QA Checker + validator **deterministic** — no model judgment; that's their value.
- [ ] After a rule change, run against a known-good frame (must pass) **and** a deliberately-broken one (must fail with a clear message).
- [ ] If you edited a tool, regenerate its **standalone bundle** so the offline copy isn't stale.

## When you change the audio or timing

- [ ] Update `FRAME_START` / `FRAME_END` in **[[11 - The Toolkit|Animation Guider]]** (they are the authoritative audio-locked times).
- [ ] Re-export `animation.json` and re-check `totalDurationSec` = audio length.
- [ ] → [[10 - Animation Pipeline]].

## Reusing this structure for the next video

This vault **is** the reusable structure. For a new script: keep notes 03–08 and
10–11 (process, rules, tools, animation) as-is; rewrite 01, 02, 09 (the
overview, status, and frame inventory) for the new content; drop the new
reference PNGs into `references/video-frames/` and start [[05 - Frame Production Checklist]].

## Backup

- [ ] Keep a copy of `frames/` + the tools outside this project (cloud / git).
- [ ] This vault is a backup of *intent* — keep it current.

---

## Changelog

> Add a dated line for every meaningful change. Newest on top.

- **2026-07-15** — Vault rewritten to map the live Mastering Persuasion production (20 frames done; waves A/B/C integrated; naming clean; Animation Guider audio-locked to 0:00–9:46 @ 30fps; toolkit bundled). Old "skill package" framing retired.
- *(add next change here)*
