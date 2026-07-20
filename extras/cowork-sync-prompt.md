# Cowork Sync Brief — Design System ⇄ Film Pipeline

Paste the block below into a Claude Cowork session that can see **both** surfaces:
- **Claude Design** (Claude app) — the Design System + the Animation Guider / frame tools
- **The Mastering Persuasion repo** (VS Code) — the Remotion film pipeline

If Cowork can only see one surface at a time, run it in two passes (Design side first, then
the repo side) — the brief is written so each half stands alone. The repo half only *verifies*;
all the real changes are on the Claude Design side.

---

## PROMPT

You are syncing a maritime explainer animation pipeline that spans two surfaces. Work
**evidence-first and verify every change** — do not act from memory or assumption.

### The two surfaces and three layers
- **Claude Design (Claude app)** holds two logical layers:
  - **(1) Design System** — the visual + motion LANGUAGE, its VALIDATOR, and the canonical
    `sample-frame.svg`. Renders nothing; it defines rules and rejects frames that break them.
  - **(2) Frame Project** — the tools that produce frames and the timing manifest (QA Checker,
    Design Review, **Animation Guider**, Component Inventory, Frame Gallery).
- **The Mastering Persuasion repo (VS Code)** is **(3) the Film Pipeline** — Remotion. It
  consumes frames + `animation.json` + the mp3 and renders. It owns the "one continuous
  canvas," the back-to-back timing, the cue resolver, and the QA gate.

### STEP 0 — Read the source of truth first (in the VS Code repo)
These two documents are measured, frame-by-frame, off the APPROVED reference film. They are
the spec. Read them in full before changing anything:
- `knowledge-vault/12 - Motion & Frame Construction Spec.md` — the motion rules, with timecodes.
- `knowledge-vault/13 - Pipeline Architecture & Handoff Contract.md` — who owns what + the
  `animation.json` contract (§4) that layers 2 and 3 hand across.
Also skim `src/scenes/WorldLayer.tsx`, `src/utils/motion.ts`, and `scripts/build-audio-cues.js`
to see how the pipeline consumes the contract today.

Do not restate these docs — treat them as authoritative and implement against them.

### STEP 1 — Map the Claude Design side before touching it
Inspect the Design System and the Animation Guider as they actually exist (do not assume file
names or formats). Report back: where the motion rules live, where the validator lives, what
format the Animation Guider is in, and how it currently emits per-element timing. Then proceed.

### TASK A — Design System (layer 1): rules + validator + sample frame
Apply the rule changes from `12 §11` and add a machine guard for each, because a rule without
a validator drifts back to broken:
1. **Wave band mandatory in every frame** — validator ERRORS if no wave marker
   (`wave-band` | `wave` | `WaveLine`) is present. Retire "some frames are intentionally
   waveless" and the A/B/C variant rotation.
2. **No flat full-bleed background** — validator ERRORS on a lone `<rect 1920×1080 fill>` with
   no wave/scene over it. (These first two may already be done on your side — verify.)
3. **Layer tagging** — every root group must be classifiable as **WORLD / BASE / CONTENT**
   (an id-prefix convention or a `data-layer` attr). Validator ERRORS on an untaggable group.
4. **Ambient life present and id'd** — `fish_*`, `bubble_*`, `seaweed_*` as their own groups.
   Validator WARNS if a frame has a wave band but no ambient ids. (Biggest measured motion gap.)
5. **Typewriter reinstated** — titles/body type on with a cursor; keep decorative letter loops
   banned; keep tokens `--type-caret` / `--type-cps`.
6. **Ids describe the artwork** — unvalidatable by machine, so make it a loud human review-gate
   item. (Real example that shipped: a light bulb named `wind_arrows`, a quote card named
   `swing_arrow` — see `12 §9`.)
Update the canonical `sample-frame.svg` to be the reference implementation of all of the above.

### TASK B — Animation Guider (layer 2): make it HEAR THE VOICEOVER
This is the highest-value change. Today the Guider emits a per-element `startMs` that is a
**canned role stagger, byte-identical across all 20 frames** — it never mapped elements to
words. That is the root cause of "visuals not matching VO," and it forces the film pipeline to
hand-author every cue.

Change the Guider so, per element, it emits the **contract shape from `13 §4`**:
```jsonc
{ "id": "quote_card",
  "layer": "content",                     // world | base | content   (REPLACES the canned startMs)
  "cue": "the very large sail area aft",  // content only: the exact VO phrase it lands on
  "lead": -1.2,                           // optional: land this many seconds before the phrase
  "anim": "...", "from": {...}, "to": {...}, "easing": "...", "idle": {...}, "orbit": {...} }
```
Rules:
- `world` elements get no time (the pipeline strips them; WorldLayer owns them).
- `base` elements get no cue — they establish ≤2s regardless of the VO.
- `content` elements MUST carry a `cue` — the phrase, verbatim from the voiceover transcript.
- Keep `from/to/easing/orbit/idle/overshoot/direction` exactly as today; those are correct.
- Match the transcript's spelling and word-splitting (Whisper writes "behaviors", splits
  "master-pilot" into two tokens) — the repo's resolver tolerates the hyphen split.
- A ring and its icon, or a panel and its contents, share ONE cue/beat — never emit a
  container whose content is cued separately (`12 §2 corollary` — this shipped as empty rings
  and empty panels twice).

### TASK C — Re-export the 20 frames to pass the new validator
Each `frame_N.svg`: wave band present (id `wave-band`), ambient life id'd, WORLD/BASE/CONTENT
tagged, ids named for what they draw. Fix the known mis-namings in frame 6 (`swing_arrow`→the
quote card, `wind_arrows`→the bulb, `idea_bulb`→the gears, `label_kick_ahead`→the real swing
arrow) and audit every other frame the same way.

### TASK D — Sync check (round-trip through the VS Code repo)
Prove the contract holds end-to-end:
1. Drop the re-exported `frames/`, the upgraded `animation.json`, and the mp3 into the repo.
2. Run `node scripts/build-audio-cues.js --check` — every cue id must exist in its SVG, and
   every content element must resolve to a time. It fails loudly on a rename; fix names, not
   the check.
3. Run `npm run qa-review` — all audits must pass.
4. Render a few stills at scene-open (`npx remotion still src/index.ts MainComposition out.png
   --frame=N`) and confirm: no blank frames, no empty containers, base present ≤2s, content on
   its word.

### DEFINITION OF DONE (the invariants — all must hold)
- Every frame carries a wave band; the validator errors without one.
- Every element is WORLD/BASE/CONTENT-tagged; content carries a verbatim `cue`; base/world do not.
- No canned `startMs` stagger remains in `animation.json`.
- Every `cue` id exists in its SVG (`build-audio-cues.js --check` green).
- The film pipeline renders with **zero hand-authored cues** — the Guider now supplies them.
- `npm run qa-review` passes.

Report what you changed on each surface, and any rule in `12`/`13` you could NOT enforce with a
validator (so it stays a human gate).
```
```

---

## After the sync — what the film pipeline (this repo) then does
Once the contract lands, these repo-side adaptations become possible (small, and best done
*after* the re-export so nothing is measured twice):
- `motion.ts` reads `layer`/`cue` straight from `animation.json` — `audio-cues.json` becomes a
  thin override for hand-tuning, not the primary source.
- `WorldLayer.tsx` drops its donor-frame hack once every frame ships a real `wave-band`.
- Wire `typewriterReveal()` onto titles (needs `audit-typewriter-bounds.js` on the new frames).
- Character staging + ambient loops, now that ambient elements are id'd.
