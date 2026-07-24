# Mastering Persuasion — Remotion Animation Project

## RULE 0 — NEVER A PRESENTATION (the one that overrides everything)
This is MOTION GRAPHICS, not a slide deck. Two review verdicts have hit this exact
nerve: *"looks like a PowerPoint presentation"* and *"what is the point of motion
graphics."* Both mean the same thing — a scene that fades its elements in and then
holds still reads as slides, not film.
- **No element is static after it appears.** The approved Ballast Water Management
  reference has NOTHING frozen — once a thing lands it keeps living: vessels bob,
  gears and dashed rings rotate, characters breathe, discs drift, the water and its
  fish/bubbles never stop. See [[knowledge-vault/14 - Reference Film Frame-by-Frame Analysis]] §2.5.
- **No scene may read as "fully present then still."** If a viewer can pause at a
  random second in the middle of a scene and it looks like a static poster, the
  scene has failed. Continuous, gentle, VISIBLE, VARIED motion during every hold.
- **The build is not the animation.** Cueing elements onto their words is necessary
  but not sufficient — the 20+ seconds of HOLD after the build is where most of the
  runtime lives, and it must stay alive.
- Motion is the default state, stillness is the exception you must justify.


## Project Status: STAGED — ready to animate
20 frame SVGs staged in src/assets/scenes/ (clean semantic ids, QA 100). sceneRegistry.ts
filled with audio-locked timings from the Animation Guider. palette.ts set to the blue family.
Baseline FrameScene renders every slot, and src/utils/motion.ts READS the Animation
Guider's per-element spec (public/animation/animation.json) — from/to, easing, idle and
orbit all come from the file; classify()/recipe() are only the fallback for what the spec
omits (frame_13, which carries no spec elements).
Element ENTRANCE TIMES come from public/animation/audio-cues.json — each element is cued to
the narration phrase that names it (see Narration Sync below). `npm run start` plays the
full audio-synced 9:46 timeline.

## Project Overview
20 timeline slots, 20 unique SVGs — a maritime safety-communication / persuasion training
explainer. SVG frames are pre-built and animation-ready (semantic snake_case ids on every
group). A single continuous voiceover MP3 (9:46) drives the timeline; per-frame cue offsets
are locked in sceneRegistry.ts.

## Tech Stack
- Remotion 4.x
- React 18 + TypeScript
- Scene-to-scene transitions: plain `Sequence` + local `SceneWrapper` opacity fade
  (`Easing.inOut(Easing.sin)`, 30 frames) — NOT `@remotion/transitions` / `TransitionSeries`
- FPS: 30 | Resolution: 1920×1080

## Directory Structure
```
src/
  index.ts              ← entry point (registerRoot)
  Root.tsx              ← registers MainComposition
  MainComposition.tsx   ← wires every scene via SCENE_REGISTRY + SceneWrapper (fade-only)
  scenes/               ← one .tsx per scene (all built from SceneTemplate.tsx)
    SceneTemplate.tsx   ← base template for any new scene
  utils/
    sceneRegistry.ts    ← SINGLE SOURCE OF TRUTH for every timeline slot — currently empty
    animationUtils.ts   ← shared helpers (fadeIn, slideIn, floatLoop, waveLoop, etc.)
    audioUtils.ts       ← audio duration helpers
    palette.ts          ← shared color constants — PLACEHOLDER colors, replace per project
  assets/scenes/        ← SVG files go here (reference by path, NEVER paste inline)
public/
  audio/                ← voiceover file(s) go here
  images/               ← extracted PNG assets
Execution_Text/         ← one Frame_XX.txt per scene once built: choreography + review log
                           (see Execution_Text/README.md and skills/09-review-system.md)
feedback/                ← regenerable per-round comment ledgers — see skills/09-review-system.md
skills/                 ← skill files — see Skills Index below
scripts/
  check-audio-durations.js     ← measures MP3 durations, prints frame counts
  audit-scene-ids.js           ← diffs SceneXX.tsx id references against real SVG ids
  audit-typewriter-bounds.js   ← self-extracts every typewriterReveal() call, measures real
                                  bbox (getCTM()-aware), flags cursor-position drift — run
                                  after any SVG re-export or new typewriterReveal call
  audit-dasharray-opacity.js   ← flags stroke-dasharray rules with no matching opacity rule
  audit-execution-text-freshness.js ← flags Execution_Text headers that drifted from sceneRegistry.ts
  measure-bbox.js               ← one-off getBBox() measurement tool (edit TARGETS, run, revert)
  measure-path-length.js        ← one-off getTotalLength() tool for stroke-dasharray path lengths
  import-review-comments.js     ← frame.io CSV export -> feedback/v{N}-comments.json
  resolve-comment-scenes.js     ← maps each comment's timecode to a scene, live off sceneRegistry.ts
  sync-review-to-execution-text.js ← seeds a per-round checklist into each scene's Execution_Text
  qa-review-gate.js             ← aggregates all 4 audits + open-comment count; gates render/build
extras/
  svg-audit.js              ← validates SVG naming quality (run before every new SVG)
  SVG-Naming-Convention.md  ← Illustrator layer naming rules — read before exporting any SVG
  video-review.html         ← OFFLINE frame.io replacement. Send it + the mp4 to the reviewer;
                              they comment on the timeline and Export JSON, which IS
                              feedback/v{N}-comments.json. See skills/09-review-system.md
```

## Skills Index
Read `skills/README.md` first — it maps each task to the right skill file.
Never read all skill files at once; each covers one step.

## Knowledge Vault — `knowledge-vault/`
The Obsidian vault for this production travels with the repo. It is the design-system,
process, and content ground truth — read it before making creative or naming decisions.
- `04 - Design System Reference.md` — palette (single blue family + alert), type, motifs, waves
- `03 - Production Process.md` + `05 - Frame Production Checklist.md` — how frames are built & gated
- `09 - Frame Inventory & Archetypes.md` — every frame's title · archetype · timecode · wave status
- `10 - Animation Pipeline.md` — the Remotion handoff this project implements
- `11 - The Toolkit.md` — the QA/Review/Animation tools upstream of this repo
- `12 - Motion & Frame Construction Spec.md` — the reference-derived motion rules (world never
  breaks, WORLD/BASE/CONTENT layers, establish-vs-build, typewriter). READ before animating.
- `13 - Pipeline Architecture & Handoff Contract.md` — who owns what across Design System /
  Frame Project / Film Pipeline, and the animation.json contract. READ before changing process.
When this repo and the vault disagree on a value, the vault's design-system section wins for
look/feel; sceneRegistry.ts wins for timing.


| File | Read when |
|------|-----------|
| `skills/README.md` | Start of any session — navigation guide |
| `skills/01-svg-pipeline.md` | Starting any new SVG / getting layer IDs |
| `skills/02-scene-build.md` | Writing a Scene_XX.tsx file |
| `skills/03-animation-library.md` | Adding any animation |
| `skills/04-scene-planning.md` | Planning a scene (before coding) |
| `skills/05-qa-checklist.md` | Before every commit |
| `skills/06-creative-standards.md` | Design/quality review (once per batch, not per scene) |
| `skills/07-project-operations.md` | Session start/end, wiring MainComposition, fixing errors |
| `skills/08-twelve-principles.md` | Fixing a scene against specific feedback ("feels stiff/presentation-y") |
| `skills/09-review-system.md` | A round of external review comments has come in, or before any render once scenes exist |

## Global Rules
- NEVER paste SVG content inline — always reference: `src/assets/scenes/Frame_XX.svg`
- ALWAYS run `node extras/svg-audit.js` before touching any SVG
- FONT IS LOCKED TO **DM Sans** (DM Mono for spec captions only). Text must stay live `<text>`,
  never outlined to shapes; font-family must read `DM Sans`/`DM Mono`; never export a title twice.
  `node scripts/audit-fonts.js` enforces all three and is part of the QA gate. DM Sans is loaded
  in-composition in `src/Root.tsx` via `@remotion/google-fonts` — the SVG's own @import does NOT
  load during headless render, so never rely on it.
- ALWAYS commit after each scene: `git commit -m "feat: SceneXX complete"`
- ALWAYS update status in sceneRegistry.ts: todo → in-progress → done
- Audio timing should be LOCKED in sceneRegistry.ts once set — do not recalculate from MP3 casually
- No scene is `done` without a passing QA report per `skills/05-qa-checklist.md`
- Run `scripts/audit-scene-ids.js`, `scripts/audit-fonts.js`, `scripts/audit-typewriter-bounds.js`, and
  `scripts/audit-dasharray-opacity.js` as part of that QA gate
- NEVER hand-estimate or reuse an old comment's coordinates for a `typewriterReveal`
  bounds object — always get them from `audit-typewriter-bounds.js`'s measured output
- Review comments: get the export as **CSV**, never PDF — see `skills/09-review-system.md`
- `npm run render` / `npm run build` are hard-gated by `npm run qa-review`
  (`scripts/qa-review-gate.js`, wired via npm's `prerender`/`prebuild` lifecycle hooks)

## Animation Standard
**The world never breaks.** `src/scenes/WorldLayer.tsx` draws the canvas + wave band ONCE
behind every scene and never fades; scenes slide their CONTENTS over it. Per-scene `bg` and
`wave*` groups are stripped by motion.ts (`SKIP_IDS`) — never re-add a background to a scene
component, it hides the water and re-creates the blank transitions this replaced.
Scenes run BACK-TO-BACK (durationFrames carries each to the next scene's audioStartSec).
Three layers per frame — see `knowledge-vault/12 - Motion & Frame Construction Spec`:
- **WORLD** — canvas, wave band, ambient life. Always on, never enters or exits.
- **BASE** — title, subject, containers. Lands ≤2s, regardless of the VO.
- **CONTENT** — what the narration names, one element per phrase, on its cue.
Titles and body copy **type on with a visible cursor** (house signature; the old
"no typewriter" rule was reversed 2026-07-17 against the approved reference film).
Never withhold BASE for a VO cue — that is what produced a 9.9s blank screen at 0:39 in v1.

**Dotted rings & rectangles ALWAYS march.** In the reference, the dotted ring around every
icon (and any dotted rectangle border) is NEVER static — once it appears its dashes travel
continuously round the stroke (which reads as a slow rotation) until the scene ends, and each
ring runs at its OWN speed and direction so a cluster never moves in lockstep. motion.ts does
this automatically: `markDashRings()` finds every VISIBLE dashed `<path>/<circle>/<ellipse>/
<rect>` (stroke ≠ none) and gives it a continuous `ring-march` (varied `pxPerFrame` + `dir`).
Dashed `<line>`s are connector ARROWS that draw-on as an entrance — they are excluded. Invisible
`stroke="none"` dashed paths are Illustrator motion-guides and are skipped. `scripts/audit-ring-
animation.js` (in the QA gate) fails if the artwork adds a visible dotted shape the engine would
leave frozen. This is a creative rule, not just a technical one — a still dotted ring reads as a
dead poster (RULE 0).

## THE GLOBAL BUILD SYSTEM (reviewer-established, enforced in motion.ts)
These are GLOBAL rules the reviewer marked "always follow" — they are engine-level in
`planAndWrap`/`styleFor`, not per-scene hacks. Never regress them.
1. **Nothing before the title.** The heading text (title, then subheading — sequential,
   never simultaneous) types FIRST; every content element is gated to start no earlier
   than the title finishes (`titleEnd`). Only ever delays, never advances. (Comments
   c18/c19/c22/c31/c33/c51/c52/c55/c56.)
2. **Build ONE-BY-ONE, never a clump.** Held content lands ~280ms apart in build order,
   so the scene assembles. Per-scene audio-cues refine to exact VO timing where authored.
   "THIS IS A GLOBAL LOGIC" (c23/c39/c45/c62).
3. **Border / construction guides NEVER render.** `guide_grid` + any `*guideline*` are
   stripped from every frame (c50/c51 "REMOVE {GLOBAL}").
4. **Dotted rings/rects ALWAYS march** (above) — the reviewer confirmed this "perfect".
5. **A logo and its BG are one set — they appear TOGETHER**, then the inner logo animates
   (c44/c45/c54/c76). Where the artwork groups them, cue the group as one; where the inner
   glyph is unnamed, tag it with `scripts/tag-shapes.js` (find shape by on-screen position,
   inject a stable id) and drive it via `frame-overrides.json`. Icon internals rotate about
   their own centre, or a pivot (`orbit.cx/cy`) for clock hands / off-centre arrows.
6. **Icon internals live after they land**: gears spin (varied directions), clock needles
   rotate about the dial, curved arrows rotate, bells/wings/anchors sway. "not a PRESENTATION."
Always cross-check motion feel against the ballast reference (knowledge-vault/14).

## Shared Utilities — `src/utils/animationUtils.ts`
Never re-implement these:
- `fadeIn(frame, delay, duration)`
- `slideIn(frame, delay, duration, distance, direction)`
- `scaleIn(frame, delay, duration, scaleFrom)`
- `staggerDelay(index, staggerFrames)`
- `floatLoop(frame, period, amplitude, phase)` — ships, birds, clouds, any gentle bob
- `waveLoop(frame, period, amplitude, phase)` — oscillating motion
- `swimAcross(frame, period, span, phase, startOffset, reverse)` — continuous one-directional drift
- `drawLine(frame, totalLength, delay, duration)` — arrow/line draw-on
- `typewriterReveal(progress, lines, bounds, frame, snapPoints)` — per-line typing-cursor reveal
- `explainerSequence(frame)` — standard BG/subject/elements/text timing

## Narration Sync — elements land on the words that name them
The Animation Guider's `startMs` values are a canned role-based stagger (text 420ms, circles
800/950/1100/1250ms…) — IDENTICAL in all 20 frames. They were never audio-driven, so every
scene used to land its whole cast inside ~2s and then hold for 11–44s. 91% of the film had no
new element entering. Cues fix that (now 24%, the rest being frames with no more elements).

- `public/audio/vo-words.json` — word-level timings (Whisper `base.en`, generated locally,
  1780 words). Regenerate only if the voiceover is re-cut.
- `public/animation/audio-cues.json` — the authored map: element -> the narration phrase it
  lands on, plus `is:` (what the element ACTUALLY draws) and optional `lead` (negative =
  land slightly before the word, e.g. a quote card you must read as it is spoken).
- `scripts/build-audio-cues.js` — resolves each `cue` phrase to `at` (seconds from the
  SCENE's start). Run after ANY cue edit. `--check` is wired into the QA gate.
- `motion.ts` overrides ONLY `start` with `at`; from/to, easing, orbit and idle still come
  from the guider. animation.json is never written to, so regenerating it cannot wipe sync.

Rules when adding/editing a cue:
- **NEVER trust an SVG id** — several do not describe what they draw (frame_6 `swing_arrow`
  is the quote card, `wind_arrows` is the bulb thought-bubble, `label_kick_ahead` is the real
  swing arrow, `idea_bulb` is the gears icon; frame_1 `spot_input_top_1` is a mind-column
  ring). Check the artwork and record it in `is:` before writing the cue.
- Match Whisper's transcription, not the script: it writes "behaviors" not "behaviours", and
  splits hyphenated words into two tokens ("master" + "-pilot"). The resolver handles the
  hyphen split; it fails loudly if a phrase is not found, so a typo cannot pass silently.
- Watch the tail: a cue inside a scene's last second enters straight into SceneWrapper's
  fade-out. The script warns; pull the cue to an earlier clause instead.

## Tweak Any Frame — full local control
`public/animation/frame-overrides.json` is the LAST layer applied and always wins.
Precedence: `animation.json` (spec) → `audio-cues.json` (cue overrides `start` only) →
`frame-overrides.json` (overrides anything).

It exists for two reasons: any frame can be corrected here in minutes without a Claude
Design round-trip, and — critically — those corrections **survive the next export**. The
SVGs are overwritten wholesale each round; this file is not.

### The workflow
1. **See what you can target.** Since mp_v2 the ids carry no meaning (`art_1`, `scene_7`,
   `XMLID_0000006361…`), so reading the SVG tells you nothing:
   ```
   node scripts/inspect-frame.js frame_9        # or omit the name for all 20
   ```
   Open `frame-inspector/frame_9.inspect.svg` in a browser — every targetable element is
   boxed and labelled with the exact id. Blue = element, red = text (`text_0`, `text_1`, …
   in document order, duplicates removed). `frame-inspector/INDEX.txt` is the same as a
   plain list with positions.
2. **Edit** `frame-overrides.json` (schema in its own `_readme`).
3. **Check** `node scripts/audit-overrides.js` — also in the QA gate.
4. **Preview one scene** without a 12-minute full render:
   ```
   npx remotion still src/index.ts MainComposition out/probe.png --frame=7740
   npx remotion render src/index.ts MainComposition out/probe.mp4 --frames=7560-7800
   ```
   Scene start frame = `audioStartSec × 30` from sceneRegistry.ts.

```jsonc
"frame_9.svg": {
  "_transition": { "inFrom": "bottom", "outTo": "left", "distance": 300, "frames": 24 },
  "_frame":      { "x": 0, "y": -12, "scale": 1.0 },   // the WHOLE composition
  "ship":        { "scale": 0.7, "y": 10 },            // per-element
  "compass":     { "orbit": { "period": 24000, "deg": 360 } },
  "text_4":      { "at": 2.1, "cps": 26 },             // retime + typing speed
  "h1":          { "hide": true }                      // remove artwork entirely
}
```
- **Element:** `at` `dur` `x` `y` `scale` `rotate` `opacity` `hide` `idle` `orbit`.
  `idle: false` / `orbit: false` stop a loop the spec added.
- **Text only:** `cps` (typing speed, default 14), `type: false` (show whole, no typing),
  `caret: false` (type without the cursor).
- **Frame:** `_frame` nudges/scales everything; `_transition` sets that scene's own
  entrance/exit (`inFrom`/`outTo` of `right|left|top|bottom|none`). `none` holds position
  and lets opacity carry it — right when two scenes should read as one continuous board.
- `_note` is free text, ignored by the renderer.

Prefer fixing genuine artwork bugs upstream; use an override to unblock, and record in
`_note` what was reported so the entry can be dropped later.

## Audio Pipeline
- Voiceover file(s) live in `public/audio/`
- Each scene seeks into the track via `startFrom={scene.audioStartSec * 30}` (if using one
  continuous file) or plays its own file directly (if per-scene)
- `durationFrames` and `audioStartSec` get locked in sceneRegistry.ts once measured — don't
  recalculate casually after that
- Helper: `getAudioStartFrame(id)` in sceneRegistry.ts returns `audioStartSec * FPS`

## Video Timing — fill in once locked
- FPS: 30 | Resolution: 1920×1080
- Total slots: 20
- FINAL_FRAMES = 17580 (586s = 9:46, audio-locked)

### Transition Model
- Decide and document: does each scene end exactly N seconds before the next starts (gap ADDS
  time), or do scenes run back-to-back? The ballast-water-management project used a locked
  1-second light gap — re-verify against this video's own reference material rather than
  assuming the same number applies.
- Scene N fades OUT during its last `TRANSITION_FRAMES` (30 in sceneRegistry)
- Scene N+1 fades IN during its first ~30 frames (via internal `fadeIn()` calls)
- Implementation: `<Sequence from={audioStartSec × 30}>` driven by the `SCENE_REGISTRY.map(...)`
  loop in `MainComposition.tsx` — NOT `TransitionSeries`

### Per-scene wrapper background — DO NOT ADD ONE
A scene component must have **no background of its own**. `WorldLayer` paints the canvas and
wave band behind everything and never fades; any per-scene background covers the water and
brings back the blank-frame bug. `FrameScene` deliberately renders a transparent wrapper.

## graphify

This project has a knowledge graph at graphify-out/ once `/graphify` has been run on it, with
god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## ponytail (lazy senior dev mode)

ACTIVE EVERY RESPONSE for coding tasks (writing, adding, refactoring, fixing, reviewing, choosing dependencies). Before writing code, stop at the first rung that holds:

1. Does this need to exist at all? (YAGNI) — skip it, say so in one line.
2. Already in this codebase (animationUtils.ts, palette.ts, sceneRegistry.ts, etc.)? Reuse it, don't re-implement.
3. Stdlib / Remotion / React built-in covers it? Use it.
4. Native platform/CSS feature covers it? Use it.
5. Already-installed dependency solves it? Use it — never add a new one for what a few lines can do.
6. Can it be one line? One line.
7. Only then: the minimum code that works.

Read the task and the code it touches first, trace the real flow, then climb — the ladder is a reflex, not a substitute for understanding. Bug fix = root cause: grep every caller before patching, fix the shared function once. Never lazy about: trust-boundary validation, data-loss handling, security, accessibility, or anything explicitly requested. `/ponytail lite|full|ultra` adjusts intensity; "stop ponytail" disables for the session.

## Progress Log
- [x] Template scaffolded from ballast-water-management's reusable infra
- [x] Review system wired in (`skills/09-review-system.md`, `scripts/qa-review-gate.js`)
- [x] SVGs staged in src/assets/scenes/ (semantic ids, QA 100) — re-run `node extras/svg-audit.js` to confirm in-repo
- [x] `public/audio/mastering-persuasion.mp3` in place (588.21s — 2.21s longer than the locked
      17580f timeline; the tail past scene 19 is not rendered)
- [x] All 20 frames cued to the narration (158 cues, `public/animation/audio-cues.json`).
      93 elements were moved BACK to base by the establish rule — a cue is only for what the
      narration genuinely reveals; everything else must be on screen inside ~2s.
- [x] Persistent `WorldLayer` + back-to-back scenes (no blank frames, no 19 white gaps)
- [x] sceneRegistry.ts filled in with real scenes/timing (audio-locked, verified vs animation.json — all 20 match)
- [x] FrameScene + src/utils/motion.ts drive all 20 slots by READING public/animation/animation.json
      (orbit rings, arrow draw-on, spec directions, full-frame wave drift, divider text stagger all live).
      Replace with a bespoke SceneXX.tsx only where a frame needs hand-tuning beyond the spec.
- [ ] `/graphify` run once there's enough content to be worth graphing
- [ ] QA pass per `skills/05-qa-checklist.md`
- [ ] First full render
