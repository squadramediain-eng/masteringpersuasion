---
tags: [design-system, motion, spec, reference-derived, hand-off]
updated: 2026-07-17
source: extras/ballast_water_management_reference_video_audio/Ballast water managements.mp4 (approved, 9:11)
---

# 12 · Motion & Frame Construction Spec

← design system: [[04 - Design System Reference]] · pipeline: [[10 - Animation Pipeline]] · inventory: [[09 - Frame Inventory & Archetypes]]

> **Who this is for:** anyone building frame SVGs, and anyone animating them.
> **Where it comes from:** measured, frame-by-frame, off the **approved** Ballast Water
> Management film — not opinion. Every claim below has a timecode you can check.
> **Why it exists:** review feedback on Mastering Persuasion v1 was *"very laggy, empty
> screens, visuals not matching VO, characters not animated."* Every one of those traces
> back to a frame-construction rule that this document fixes.

---

## 0. The one-line version

**The film is a single continuous world that the camera never leaves. Frames don't
cut — the furniture changes while the water stays.** Everything below follows from that.

---

## 1. The law: the world never breaks

**Measured:** scene-cut detection across the full 9:11 of the approved film finds
**zero cuts**, even at a 0.1 sensitivity threshold. The wave band and background are
present in **every single frame sampled**, including the sparsest ones (checked at
1:09, 6:31, 7:17 — all three carry a full wave band, with fish and bubbles in it).

### Rules

1. **Every frame carries the wave band. No exceptions.**
   [[04 - Design System Reference]] currently says *"some frames are intentionally
   waveless"* — **this rule is retired.** It is the direct cause of six Mastering
   Persuasion frames (1, 8, 12, 15, 17, 18) being able to render as a blank light
   rectangle. The approved film never does this, not once.
2. **The background is a world, not a fill.** A flat `#f5f6fa` rect is not a background.
   The background is: light canvas → wave band (multi-layer, with depth) → ambient life.
3. **Nothing that fades out may take the world with it.** Transitions move the *contents*
   of the frame. The water stays put.

> **Why it matters:** at 0:39 in Mastering Persuasion v1 the screen is *completely blank*
> for 9.9 seconds while the narrator delivers two full sentences. That frame has no wave
> band, so when its content was cued to the voiceover there was literally nothing left.

---

## 2. Frame anatomy — build in three layers

Every frame SVG must be constructed and labelled in these layers. **The animator can only
respect a distinction the artwork actually makes.**

| Layer | What's in it | When it appears | Designer must |
|---|---|---|---|
| **WORLD** | canvas, wave band, ambient life (fish, bubbles, seaweed, drifting particles) | **Always. Frame 0 to the last frame.** Never entrances, never exits. | Always include. Give ambient items their own ids so they can loop. |
| **BASE** | title, the scene's main subject (ship / character / table shell / panels), containers | **Lands within ~2s of the scene opening**, before or as the VO starts the thought | Mark clearly. This is what makes the frame *read as a frame*. |
| **CONTENT** | the elements the narration names one by one — icons, tiles, steps, labels, callouts, marks | **Each on the word that names it** | Provide one id per narrated beat. Do not merge three narrated items into one group. |

**Evidence (0:20–0:35):** ship + waves + title land in ~2s → the teal ballast tank flies in
from the right and *travels into the hull* → an arrow draws to "Impact on marine ecosystem"
→ then Sediments, Microorganisms, Marine Species appear **one at a time as each is named**.
Base fast; content on the voice.

### The failure this prevents
Mastering Persuasion frames withheld **the base as well as the content**. Frame 1 held all
49 elements — including its definition card, which *is* the base — for 9.9 seconds.
Result: an empty screen with narration over it.

### Two corollaries — both learned by shipping the mistake

**A container never appears empty.** A concept-circle without its icon, or a compare panel
without its figures, reads as a bug — the viewer sees an unfinished frame, not a pending one.
So a ring and its icon are **one beat**, and a panel arrives **with** its contents or not at
all. If the right-hand side of a compare isn't due until 0:20, show *nothing* there until
0:20 — never an empty box waiting to be filled.
*(Caught twice: frame 18's rings sat empty for 20s, then frames 7 and 13 parked an empty
dashed panel for ~10s. Same mistake, two shapes.)*

**Every archetype's base establishes — including BUILD frames.** A build frame still has to
say what it is before it starts building. Frames 2 and 4 cued their own *titles* to the VO
and opened with ~3.5s of blank water. The build is the tiles; the title is base.

---

## 3. Establish vs Build — by archetype

Not every frame builds. Use the archetype to decide.

| Archetype | Behaviour | Base lands | Content |
|---|---|---|---|
| **Icon grid** · **Step flow** · **Table** · **Compare** | **BUILD** — items genuinely arrive as narrated | title + container/panels ≤ 2s | each tile / step / row / panel on its own phrase |
| **Cover** · **Divider** · **Scenario** · **Convergence** · **Stat** · **Circle cluster** | **ESTABLISH** — the composition is whole almost immediately | **the whole composition ≤ 2–3s** | sync via *emphasis* on what's already there, not by withholding it |

**The distinction that was missed:** VO sync is not "when the element is born." For
ESTABLISH frames it's "when the element is **emphasised**" — a pulse, a highlight, a
scale accent on something the viewer can already see. Only BUILD frames earn a real
entrance per beat.

> Mastering Persuasion got this right for frame 2 (six tiles landing on "safety tool…
> master-pilot… correcting habits…") and frame 4 (three steps on "First… Second… Third").
> Those are correct and should be kept. It got it wrong for every ESTABLISH frame.

---

## 4. Transitions — slide, never wash

**Measured (0:52–0:58, sampled every 0.5s):**

| t | What happens |
|---|---|
| 52.0–55.5 | scene holds; **seaweed sways**, bubbles drift |
| 56.0 | text + seaweed **slide out to the left** |
| 56.5 | frame is nearly clear — **but the wave band is still there** |
| 57.0 | container ship **slides in**; typing cursor appears |
| 57.5 | next title typing on |

Total ≈ **1.5s**, elements out then in, **background untouched throughout**.

### Rules
- Scenes **butt up against each other**. No dead slot between them.
- Content **exits by moving** (slide left / drift off), not by dissolving the whole frame.
- **Never fade the frame to the canvas colour.** Mastering Persuasion v1 does this
  19 times — a full second of flat `#f5f6fa` with the narrator still talking, every time.
- A brief sparse beat (~0.5s) between scenes is fine and good. A *blank* one is not. The
  difference is entirely whether the world is still there.

---

## 5. Type — titles type on

**Measured:** typing cursors are visible mid-stroke throughout the approved film —
`Management|` (0:02), `Bal|` (0:20), `What is yo|` (0:37), `If|` (3:02),
`when a critical alarm is triggered|` (6:31). Body and caption text types on too
("An automatic shutdown of the BWMS may o‑c‑c‑u‑r" mid-type at 3:07).

### Rules
- **Titles and body copy type on, with a visible cursor.** This is the house signature.
- `animation.json`'s convention **"no letter-spin / typewriter on text" is wrong** and must
  be corrected — it contradicts the approved film. (The tooling already exists and is
  unused: `typewriterReveal()` in `animationUtils.ts`, plus `audit-typewriter-bounds.js`
  and `audit-typewriter-speed-freshness.js` — both written *for this house style*.)
- Text stays **live `<text>`** — never outlined. A typewriter cannot reveal a path.
- Two-tone titles are house style: `Ballast` `#0840a5` / `Water` `#6084f0` (seen at 1:09).

---

## 6. Ambient life — the frame is never still

**Measured** (frame-to-frame change, both films sampled 4×/sec, identical method):

| | approved film | Mastering Persuasion v1 |
|---|---|---|
| Mean visual activity | **0.0029** | 0.0017 |
| Time in holds > 2s | 65% | 65% |
| Longest single hold | **21.8s** | 16.3s |

**Read this carefully — it corrects the obvious assumption.** The approved film holds
*more* than ours does. **Long holds are not the problem and never were.** The difference
is what you're holding *on*: a complete, breathing frame versus a half-built one. Ours
carries ~40% less ambient motion.

### Rules
- **Ambient never stops:** wave drift, foam, **fish**, **bubbles**, **swaying seaweed**,
  drifting particles. Present in the approved film at 1:09, 6:31, 7:17 and everywhere else.
- Ambient items need **their own ids** — an animator cannot loop a fish welded into the
  wave path.
- Holding on a finished composition with life in it is correct and restful. Holding on a
  blank canvas is the bug.

---

## 7. Characters — staging, not rigging

**Measured (3:02–3:14, stepped 1s at a time):** the gas-alarm officer fades in, holds
**one pointing pose**, and floats gently. He is *not* rigged. He has no gesture animation.
Technically he does exactly what Mastering Persuasion's characters do.

**So why did the reviewer say "characters not animated"?** Because of **staging**:

- He is **posed pointing at where the content will appear** — and the bell, the shutdown
  box, and the fan then build **exactly where he is pointing**, one per narrated beat.
- The character is doing something *because the scene is doing something around him*.

### Rules
- **Do not re-export characters as rigged limb sets.** That is not the house standard and
  it is not what this feedback requires.
- **Pose every character in relation to their content** — pointing, presenting, reacting
  toward the space the narrated items will occupy.
- Give the character a **decorative arc/glow behind them** (present in the approved film,
  rotating slowly).
- A character alone in dead space will always read as "not animated," no matter how they
  are built.

---

## 8. Pacing

| | approved film | Mastering Persuasion |
|---|---|---|
| Narration rate | **154 wpm** | 182 wpm |
| Speech density | **73% talking** | 83% talking |

Our script is **denser and faster** — meaningfully less silence to animate into. This is a
**scripting** note, not an animation one: the approved film's breathing room is part of why
it feels calm. If a future VO can be written at ~155 wpm with real pauses at beat changes,
the animation has somewhere to live.

---

## 9. Designer's delivery checklist

Per frame, before hand-off to animation:

- [ ] **Wave band present** — no exceptions, no "intentionally waveless" frames
- [ ] **Ambient life** included, each item with its own id (fish, bubbles, seaweed)
- [ ] Layers separable: **WORLD / BASE / CONTENT** identifiable from ids alone
- [ ] **One id per narrated beat** — never merge two narrated items into one group
- [ ] **Ids describe what the element draws.** (Mastering Persuasion has `swing_arrow`
      that is a quote card, `wind_arrows` that is a light bulb, `idea_bulb` that is a
      gears icon, `label_kick_ahead` that is the actual swing arrow. Four wrong out of
      eight in one frame. This costs real hours and causes wrong animation.)
- [ ] Text is **live `<text>`**, DM Sans, never outlined
- [ ] Characters **posed toward their content**, with room for it to build
- [ ] **The VO line each element serves is written down** (see §10)

---

## 10. The process fix — design against the voiceover

> The reviewer's own words: *"i need to see the illustration with the corresponding VOs
> otherwise its very confusing what is for what."*
>
> If the reviewer can't tell which illustration serves which line, the frames were not
> designed against the line.

The voiceover was never an input to the illustration — only to the timing, and only at the
very end. **The Animation Guider never heard the audio**: its `startMs` values are a canned
role-based stagger, *byte-identical across all 20 frames* (text at 420ms, circles at
800/950/1100/1250ms…). That is why nothing lined up.

**Required from now on — a VO-first storyboard, approved before any frame is drawn:**

| VO sentence (verbatim, with timecode) | Frame | Layer | Element | Behaviour |
|---|---|---|---|---|
| "…he specifically notes the very large **sail area** aft" (3:02.6) | 6 | CONTENT | quote card | sets 1.2s before the phrase, so it reads as spoken |
| "the master immediately recognizes…" (2:46.7) | 6 | BASE | ship | already on screen |

Nobody draws until this table is agreed. It is also exactly the artifact the reviewer
asked for, and it makes illustration review possible without watching a video.

---

## 11. Summary of rule changes to [[04 - Design System Reference]]

| Rule | Status |
|---|---|
| "some frames are intentionally waveless" | **RETIRED** — wave band is mandatory in every frame |
| "no letter-spin / typewriter on text" (`animation.json` conventions) | **REVERSED** — titles and body type on with a cursor; it's the house signature |
| "Canvas: never a flat single-colour full-bleed fill" | **REINFORCED** — this rule was right and was violated; a flat `#f5f6fa` rect is what the blank frames actually are |
| Frame-to-frame transition | **CHANGED** — slide contents over a persistent world; never wash the frame to canvas colour |
| Character kit "expressive poses" | **SHARPENED** — pose *toward the content that will build*; do not rig |
| Ambient | **ADDED** — fish / bubbles / sway are mandatory, id'd separately |
| VO-first storyboard | **ADDED** — precondition for drawing (§10) |

---

## 12. Status — accepted by the design system, 2026-07-17

All three headline rules were **accepted and landed on the design-system side**. Their
validator now **errors** when a frame has no wave marker, and again on a lone full-bleed
`<rect 1920×1080 fill>` with no wave/scene over it — a direct machine guard against the
blank-screen bug. Their canonical `sample-frame.svg` now ships a proper
`<g id="wave-band">` with four crests, and typing is tokenised (`--type-caret`, `--type-cps`).

### Landed in this repo (the film pipeline)

| File | Change |
|---|---|
| `public/animation/animation.json` | letter-spin rule **reversed**; waveless retired in the wave convention |
| `src/utils/motion.ts` | `SKIP_IDS` now `/^(bg\|background)$\|^wave/i` — matches the incoming `wave-band` **and** today's `waves` |
| `src/scenes/WorldLayer.tsx` | tries `wave-band` → `waves` → `wave` → `WaveLine`; warns loudly if none found |
| `knowledge-vault/04` | waveless retired · A/B/C rotation retired · typewriter reversed · wave band = 4 crests, id `wave-band` |

### Naming hand-over — the trap to watch

The re-exported frames call the band **`wave-band`**; the frames in the repo today call it
**`waves`**. Both the interpreter and the world layer accept either, so the two can coexist
during the swap. **If only one had been handled, the new frames would have painted their own
band on top of the world layer** — doubled water and a wave that restarts at every cut.

### Still stale — needs a re-pull from the design system

- `extras/svg-audit.js` — zero mentions of `wave-band` / `WaveLine`; it cannot enforce the
  new rules and will pass frames the design system's own validator now rejects.
- `extras/SVG-Naming-Convention.md` — same; still documents the old naming.
- Both came from `uploads/illustration-system.zip`, **which the design system has flagged as
  stale and offered to repackage. Take them up on it**, then replace both files here.
