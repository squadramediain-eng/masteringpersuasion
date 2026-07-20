---
tags: [design-system, reference, sts-motion, mastering-persuasion]
updated: 2026-07-15
---

# 04 · Design System Reference

← back to [[00 - START HERE]] · process: [[03 - Production Process]]

> Condensed field guide for **Mastering Persuasion**. The operative colour rules
> here are this project's `CLAUDE.md` (single blue family). The parent design
> system's broader palette is noted at the bottom.

## Palette — single blue family + one alert

Reference sketches are multi-colour hand drawings; **translate everything to blue.**
Never copy orange / green / yellow / teal as-is.

**Backgrounds**
- Canvas: light `#f5f6fa` (or `#f4f6f9`) + faint grid. **Never a flat single-colour full-bleed fill** — always layer illustrative vectors on the light canvas.

**Ink / heading / linework**
- Primary ink `#0840a5` · deep `#17439e` / `#1b1959`.
- Figure/helmet ink `#18469d` · hair/dark detail `#253761` · face `#eaf4fd` (or `#6cb6fb`).

**Accent / labels**
- Accent + numerals `#6084f0` (periwinkle) · labels/kickers `#6685e8`.

**Connectors & accents**
- Dashed connectors `#1b2f69`, dash ~12 · cyan accent `#2482b7` · steel `#53769f` / `#a2c4d5`.
- Concept-circle: fill `#f3f4fa`, stroke `#71afd8` 2px.
- Wash / icon fills: `#bfdff9 #e2eff8 #c5e2f9 #9ac7fd #d4e7f6 #b8d9f5`.
- Ship ramp: `#6497e0 → #3761b6`.

**Alert (only non-blue)**
- `#ac4f55` — hazard / destructive **only**, never decorative.
- Compare frames: **alert-red ✗ vs blue ✓** (never green). Keyword highlight: **blue-wash `#bfdff9`** (never yellow).

## Typography

- **DM Sans only** — headings SemiBold **600**, kickers/emphasis **700**, body **450**. **DM Mono** for spec captions. Never substitute; never outline — always live `<text>`.
- **Titles and body copy TYPE ON with a visible cursor** — the house signature (design-system
  tokens `--type-caret` / `--type-cps`). Decorative letter loops (spin / bounce / pulse) stay
  banned. Text must stay live `<text>` — a typewriter cannot reveal an outlined path.
  *Rule reversed 2026-07-17:* the old "no letter-spin / typewriter on text" contradicted the
  approved film, which types every title on (`Management|` 0:02, `Bal|` 0:20, `If|` 3:02).
- Roles: heading `#0840a5` (two-tone allowed with `#6084f0`); kicker/label `#6685e8` UPPERCASE tracked (+0.18em); body `#17439e`; caption `#6c7da4`.
- 1080p scale: body **≥ 22px**; headings **100–150px**.

## Illustration principles

- Icons = **filled tonal illustrations** (light-blue fill under darker-step blue stroke `#0840a5`), NOT flat outline glyphs. Rich, never sparse.
- **Concept-circle is the default icon container** (`#f3f4fa` + `#71afd8`, r ≈ 80). Free-floating icons only where the reference clearly does AND density stays high.
- **Section numerals:** bold filled `#6084f0` digits, large (font-size ~300).
- **Wave band** at base: four crests, multi-layer gradient + foam line + particles.
  **Mandatory in every frame** — id `wave-band` (validator also accepts `wave` / `WaveLine`).
- **Mariner character kit:** expressive poses (calm vs rushing), ink `#18469d`, wash coveralls, `#253761` hair. Faces must carry the scene's emotion.
- Depth from outline + layered cool shadow (`rgba(8,64,165,…)`), **never gradient panels**.

## The two motifs

- **Spotlight / concept-circle** — softly-shaded disc framing a filled blue icon; one focal disc per idea.
- **Wave line** — overlapping long-wavelength crests riding the baseline; the water signature.
  **Present in every frame, no exceptions.** → [[10 - Animation Pipeline]], [[12 - Motion & Frame Construction Spec]].

> **Rule change 2026-07-17 — "some frames are intentionally waveless" is RETIRED**, along
> with the A/B/C variant rotation. Both are superseded by one continuous body of water.
> *Why:* the approved Ballast Water Management film has **zero scene cuts** across its full
> 9:11 and a wave band in **every** frame. Waveless frames are what let Mastering Persuasion
> render a **blank rectangle for 9.9s at 0:39** with two full sentences of VO over it — six
> frames (1, 8, 12, 15, 17, 18) had no water, so cueing their content left nothing on screen.
> In the film pipeline the band is hoisted to `src/scenes/WorldLayer.tsx` and drawn once
> behind every scene, so the water never breaks at a transition.

## Structure & depth

- **Artboard:** `viewBox="0 0 1920 1080"` + explicit `width`/`height`; root `<g isolation="isolate">`.
- **Every animatable element** in a semantic snake_case `id` group (`wave_1`, `ab`, `bosun`, numerals, icons, props).
- Live `<text>` (DM Sans via `@import`; Remotion loads the font in-composition).
- XML hygiene: no `--` in comments; escape `&` as `&amp;`. No logo / wordmark anywhere.

## Voice

Coaching, **second person**, present tense, active voice. Plain, declarative,
confident. Short sentences. No exclamation marks, **no emoji ever**. A single
number can carry a whole frame.

---

## A note on the palette

This project's `CLAUDE.md` deliberately narrows the parent design system to a
**single blue family + one alert red**. The bound STS Motion — Persuasion design
system itself defines a broader **three-family** palette (blue backbone +
lavender/indigo co-lead + seafoam-teal accent). For **Mastering Persuasion**,
**`CLAUDE.md` wins** — build blue. If a future series wants the fuller palette,
that's a project-level decision to log in [[07 - Maintenance & Future-Proofing]].
