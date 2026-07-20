---
tags: [architecture, pipeline, handoff, contract, design-system, reproducibility]
updated: 2026-07-17
---

# 13 · Pipeline Architecture & Handoff Contract

← motion rules: [[12 - Motion & Frame Construction Spec]] · pipeline: [[10 - Animation Pipeline]] · toolkit: [[11 - The Toolkit]]

> **The question this answers:** the "one continuous canvas, slide the scenes over it" setup
> is exactly how a real motion designer works — how do we make it the *default output every
> time*, and does it belong in the Design System or in the frame project?
>
> **The short answer:** it's not one place, it's **three**, and each owns the part it can
> *enforce*. A rule that can't be validated where it lives will drift back to broken. Below is
> who owns what, what to change in each, and the exact data contract between them.

---

## 0. The three layers

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. DESIGN SYSTEM   (STS Motion — cross-project)                       │
│    Owns the LANGUAGE + the VALIDATOR + the canonical sample frame.    │
│    Output: rules a frame must obey, and a machine that rejects        │
│    frames that don't. Renders nothing.                                │
└───────────────┬─────────────────────────────────────────────────────┘
                │  rules + validator + sample-frame.svg
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FRAME PROJECT   (the tools that made the 20 frames:                │
│    QA Checker · Design Review · Animation Guider · …)                 │
│    Owns PRODUCING conforming frames + the timing/cue manifest.        │
│    This is where the voiceover must become an input.                  │
└───────────────┬─────────────────────────────────────────────────────┘
                │  frame_N.svg (layer-tagged, correctly id'd)
                │  + animation.json (per-element spec + CUE PHRASES)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. FILM PIPELINE   (this repo — Remotion)                             │
│    Owns RENDERING: the one canvas, the slide, the build, the gate.    │
│    THIS is where "one continuous canvas" lives. Make it a TEMPLATE.   │
└─────────────────────────────────────────────────────────────────────┘
```

**The direct answer to "Design System or the project?":**

| The thing you noticed | Lives in | Because |
|---|---|---|
| **One continuous canvas, scenes slide over it** | **Film pipeline (3)** — `WorldLayer.tsx` | It's a *rendering* decision. No SVG and no design rule can express "render this once behind everything." |
| **The world may never break / wave mandatory / typewriter / no empty container** | **Design System (1)** — as rules + validator | These must be *enforced* on every frame before it ships, cross-project. |
| **Frames arrive VO-aware, layer-tagged, correctly named** | **Frame Project (2)** — the Animation Guider | It's the only layer that produces the artwork and the manifest. |

So: **the smooth setup is reproduced by making layer 3 a template, guaranteed by a contract that
layers 1 and 2 are validated against.** Not by one edit in one place.

---

## 1. Design System — owns the LANGUAGE and the GUARD

Already accepted the rule changes (2026-07-17): wave mandatory, typewriter reversed, flat
full-bleed rect flagged. Keep going in this direction — **every rule needs a validator check,
or it rots.**

**Owns:**
- The motion rules (the whole of [[12 - Motion & Frame Construction Spec]]) as prose.
- **The validator** — the machine that errors on a non-conforming frame. Current guards: no
  wave marker → error; lone full-bleed `<rect 1920×1080 fill>` with no scene over it → error.
  **Add these, because each maps to a bug we actually shipped:**
  - every root group must be classifiable **WORLD / BASE / CONTENT** (id prefix or a data-attr)
    — an un-tagged element can't be placed by the animator
  - **ambient life present and id'd separately** (`fish_*`, `bubble_*`, `seaweed_*`) — the
    single biggest measured motion gap (0.0017 vs the reference's 0.0029)
  - **id names match artwork** — this is unvalidatable by machine (a bulb named `wind_arrows`
    passes any structural check), so it stays a **human review-gate item**, called out loudly.
- **The canonical `sample-frame.svg`** — the reference implementation: `wave-band` with four
  crests, ambient, a BASE title, a CONTENT tile, all correctly tagged. Everything else copies it.
- **Naming convention** (`SVG-Naming-Convention.md`) and type tokens (`--type-caret`, `--type-cps`).

**Does NOT own:** timing, audio, rendering, the persistent canvas.

---

## 2. Frame Project — owns CONFORMING FRAMES and the VO-AWARE MANIFEST

This is the project with the interactive tools (QA Checker, Design Review, **Animation Guider**,
Component Inventory, Frame Gallery). It made the 20 SVGs and `animation.json`.

**The one structural fix that matters most is here:** the **Animation Guider must hear the
voiceover.** Today it holds the real audio-locked `FRAME_START`/`FRAME_END` (per *frame*), but
its per-**element** `startMs` is a canned role stagger — *byte-identical across all 20 frames*
(text 420ms, circles 800/950/1100/1250ms…). That is the root cause of "visuals not matching
VO," and it is why the film pipeline had to retrofit 251 cues by hand.

**Owns:**
- SVG frames that **pass the Design System validator** — layer-tagged, `wave-band` present,
  ambient id'd, semantically named.
- **`animation.json`, upgraded** so the film pipeline needs zero hand-cueing:
  - keep: `from/to`, `easing`, `orbit`, `idle`, `overshoot`, `direction` (these are correct)
  - **replace** the canned per-element `startMs` with, per element, a **`layer`**
    (`world|base|content`) and — for `content` only — a **`cue`** (the exact narration phrase
    it lands on) and optional `lead`. Base/world elements need no time; they establish.
  - this is the same `cue`-phrase format the film pipeline already resolves (see §4). The
    Guider produces it instead of the pipeline reverse-engineering it.
- The **VO-first storyboard** ([[12 - Motion & Frame Construction Spec|§10]]) as its design
  input — approved before any frame is drawn.

**Does NOT own:** the persistent world render, the back-to-back timing math, the typewriter
implementation, the establish/build *rendering* logic.

---

## 3. Film Pipeline — owns RENDERING, and IS the template

This repo. The "one continuous canvas" you noticed lives here and nowhere else:

- **`src/scenes/WorldLayer.tsx`** — draws canvas + wave band **once**, never fades.
- **`src/utils/motion.ts`** — interprets the spec, applies cues, skips world ids (`SKIP_IDS`),
  wraps elements so their own transforms survive.
- **`src/utils/sceneRegistry.ts`** — scenes **back-to-back** (durationFrames → next start).
- **`src/utils/animationUtils.ts`** — `typewriterReveal()` etc.
- **`scripts/build-audio-cues.js` + the QA gate** — resolve cue phrases to times; block a
  render that regresses.

**To get the same output every time: make this repo a starter template.** A new video =
clone it, drop in the new `frames/`, `animation.json`, and `mp3`, and the world layer,
back-to-back timing, establish/build interpretation, cue resolver, and gate all come for free.
Only the content changes. **Nothing here should be rebuilt per project** — that's the whole
point of a template, and it's why the smoothness is reproducible instead of re-earned.

---

## 4. The contract (the handshake between 2 and 3)

This is the interface. Get it right and the pipeline is plug-and-play.

**Frame Project delivers:**
```
frames/frame_N.svg        # validator-passing, layer-tagged, wave-band, ambient, correct ids
public/animation/animation.json
public/audio/<name>.mp3
public/audio/vo-words.json  # word-level timings (Whisper), if the Guider didn't already emit cue times
```

**`animation.json` element — new shape:**
```jsonc
{ "id": "quote_card",
  "layer": "content",                     // world | base | content   ← NEW, replaces canned startMs
  "cue": "the very large sail area aft",  // content only: the VO phrase it lands on   ← NEW
  "lead": -1.2,                           // optional: land this many s before the phrase
  "anim": "rise-scale", "from": {...}, "to": {...},
  "easing": "cubic-bezier(0.16,1,0.3,1)", "idle": {...}, "orbit": {...} }
```

**Film pipeline guarantees, given that:**
- `world` → stripped, WorldLayer owns it. `base` → lands ≤2s (guider stagger). `content` →
  lands on its `cue`, resolved against the audio.
- A container (ring, panel) and its content share a beat — **never an empty box** ([[12 - Motion & Frame Construction Spec|§2 corollary]]).
- Scenes butt up; the world never breaks; the gate blocks a broken render.

**Invariant that must hold both directions:** *an id in a cue must exist in the SVG.* The
pipeline's `build-audio-cues.js --check` already enforces this — a re-export that renames
`swing_arrow`→`quote_card` fails loudly instead of silently dropping the animation.

---

## 5. Where to write each change — the one-look table

| Change | Design System | Frame Project | Film Pipeline |
|---|---|---|---|
| Wave mandatory, one world | rule + validator | emit `wave-band` every frame | `WorldLayer` renders it once |
| Typewriter titles | rule + `--type-*` tokens | live `<text>`, don't outline | wire `typewriterReveal()` |
| No empty container | rule + (best-effort) validator | ring+icon / panel+content = one group-beat | resolve them to one cue time |
| Establish vs build | rule + archetype table | tag `layer` per element | base ≤2s, content on cue |
| VO drives the visuals | rule ("VO-first storyboard") | **Animation Guider hears the audio; emits `cue`** | resolves `cue` → time |
| Ambient life | rule + validator | `fish_*`/`bubble_*`/`seaweed_*`, id'd | loops them |
| Correct ids | naming convention + human gate | name by what it draws | `--check` rejects unknown ids |
| Back-to-back scenes | — | — | `sceneRegistry` durations |
| "Same output always" | — | — | **ship this repo as a template** |

---

## 6. The sequence

1. **Design System** locks the rules + validator + `sample-frame.svg`. *(rules done; validator
   guards + sample frame in progress on their side.)*
2. **Frame Project** re-exports the 20 frames to pass that validator **and** upgrades the
   Animation Guider to emit `layer` + `cue` from the voiceover. This is the big one — it
   removes the hand-cueing entirely.
3. **Film Pipeline** consumes the new contract with near-zero changes (the cue format already
   matches), then gets templatized so video #2 starts from it.

Until step 2 lands, the film pipeline carries the gap: `WorldLayer` patches the missing world,
and `audio-cues.json` carries by hand what the Guider should emit. Both are **bridges, not the
destination** — the destination is the contract above, enforced at every boundary.
