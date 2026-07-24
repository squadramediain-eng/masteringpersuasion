# Review System — Review Comments to Verified, Render-Gated Fixes

Read this when a new round of external review comments comes in, or when preparing any
render after v10.

## Two front doors, one pipeline

Comments can arrive two ways. Both produce the SAME `feedback/v{N}-comments.json`, so
everything from step 3 on is identical:

| Source | How | Step 1 |
|---|---|---|
| **`extras/video-review.html`** (offline, preferred) | Reviewer opens the HTML, loads the mp4, comments on the timeline, clicks Export JSON | none — the file it downloads IS `v{N}-comments.json`. Drop it in `feedback/` and skip to step 3. |
| frame.io | Comments panel → Export → CSV | `node scripts/import-review-comments.js export.csv v12` |

### extras/video-review.html — the offline reviewer
Send the reviewer **two files**: `extras/video-review.html` and the rendered mp4. No server,
no install, no upload — the video is read with `URL.createObjectURL` and never leaves their
machine. They set the round (e.g. `v12`), load the video, and comment.

What it gives them, frame.io-style:
- scrub/seek, **frame-accurate stepping** (`,` / `.`), play/pause (space), 1s jumps
- live `HH:MM:SS:FF` timecode at the locked 30fps + the scene label under the playhead
- **draw on the frame** (`D` or ✎ Draw) — freehand pen strokes over the video to circle
  the exact element, and/or ▭ Box to drag a rectangle. Both replay when you seek back to
  that comment's frame. Stored as normalised 0..1 coords so they map to the 1920×1080 still.
- labels (`timing` / `visual` / `text` / `audio` / `other`), reviewer name
- **voice-over panel** under the scrubber — the current scene's narration, karaoke-highlighted
  and auto-scrolling word-by-word with the playhead, so the reviewer sees exactly what line is
  being read while judging the picture. It's the film's own transcript (`public/audio/vo-words.json`)
  inlined into the HTML by `node scripts/build-review-transcript.js` — **re-run that script only
  when the voiceover is re-cut**, then re-send the HTML. Nothing else to send; it stays one file.
- comments are **partitioned by scene** with a per-scene count, and each card carries a big
  half-visible `#N` (its chronological number, matching its timeline dot) plus its comment id
- markers on the timeline, click to jump; edit/delete; autosaves to localStorage
- Export JSON → `v{N}-comments.json`; Import JSON to resume a session or review someone's

It exports `scene_id: null` **on purpose** — scene assignment is recomputed live by
`resolve-comment-scenes.js` so the ledger survives a retime. The scene list inside the HTML
is display-only; if `sceneRegistry.ts` timings change, re-sync that `SCENES` array (it only
affects the label the reviewer sees, never the exported data).

Extra fields (`label`, `region`, `drawing`, `author`) ride through `resolve-comment-scenes.js`
untouched and get printed into each scene's `Execution_Text` checklist by
`sync-review-to-execution-text.js`, e.g.
`- [ ] (scene-06, local frame 191 / 2:52) "this icon is wrong" [visual · freehand mark (1 stroke) around 70,70–83,85% of frame · by QA]`
— which is enough to render that exact still and look at exactly where the reviewer drew.
`drawing` is an array of strokes, each an array of `{x,y}` points in 0..1 frame coords.

## Why this exists

A frame.io PDF export bakes each comment's timecode into a screenshot image, not text —
there's no cheap way to read it back (confirmed the hard way on v10: had to extract raw
embedded JPEGs out of the PDF byte-by-byte and eyeball each one against scene
descriptions). And every comment that gets hand-mapped to a raw frame number goes stale
the moment a scene is added, removed, or the audio changes length, because every later
scene's `audioStartSec` shifts. This system fixes both: comments are anchored to video
*timecode* (seconds), and scene assignment is recomputed live from `sceneRegistry.ts`
every time, never cached.

## The loop

### 1. (frame.io only) Get the export as CSV, not PDF or XLSX
Skip this entirely if the reviewer used `extras/video-review.html` — its download already
IS the ledger. Just save it as `feedback/v12-comments.json`, write `v12` into
`feedback/.current-round`, and go to step 3.
In frame.io's Comments panel, use Export → CSV. Costs near-zero tokens to parse (plain
text) versus a PDF, which forces either expensive image rendering or the embedded-image
extraction trick — both far more expensive than reading a text file. If frame.io's actual
column headers turn out not to match what `import-review-comments.js` expects (it looks
for headers matching `/timecode|tc/i` and `/comment|note|text/i`), the error message
names the header row it found — adjust `TIMECODE_HEADER_RE` / `TEXT_HEADER_RE` in that
script, this hasn't been validated against a real export yet.

### 2. Import
```bash
node scripts/import-review-comments.js path/to/export.csv v12
```
Writes `feedback/v12-comments.json` and remembers `v12` as the active round in
`feedback/.current-round` (later steps default to it — no need to retype the round name).

### 3. Resolve scenes
```bash
node scripts/resolve-comment-scenes.js v12
```
Regex-extracts `{ id, audioStartSec, durationFrames }` straight from the *current*
`src/utils/sceneRegistry.ts` and matches each comment's timecode into the scene whose time
window contains it. Anything landing in the 1-second inter-scene gap, or outside every
scene, prints as `UNRESOLVED` — assign `scene_id` by hand in the JSON for those, the
script never guesses.

### 4. Seed the per-scene checklists
```bash
node scripts/sync-review-to-execution-text.js v12
```
One-time per round. Appends a `## Review — v12 (date)` checklist to each affected scene's
`Execution_Text/Frame_XX.txt`. Safe to re-run — if that heading already exists in a file
it's skipped, never duplicated or overwritten.

### 5. Fix scene by scene
Open one scene's `Execution_Text/Frame_XX.txt`. The choreography description and the
open review items now live in the same file, so you have the full context for that scene
in one read. Fix the code, then check the item off **in that file**, one of three ways:
```
- [x] FIXED: reordered icon4 before the connecting line (Scene02.tsx)
- [x] WONTFIX: not a bug, the reviewer was describing the intended transition
- [~] NEEDS-CLARIFICATION: which element — the line or the arrow?
```
All three count as "addressed." Only a bare `- [ ]` blocks the gate — nothing gets
silently dropped, including the comments that turn out not to be real bugs or need a
question answered first.

For anything described as "glitchy" with no other detail: that's a motion problem a
single frame can't show. Render a still at the comment's exact moment first —
`npx remotion still src/index.ts MainComposition out.png --frame=<global frame>` — to
at least rule out a static-frame bug before assuming you need to watch full playback.

### 6. Gate
```bash
npm run qa-review
```
Runs all 5 audits (scene-ids, typewriter-bounds, dasharray-opacity,
Execution_Text-freshness, and typewriter-speed-freshness) plus a count of every open
`## Review — v12` item across every scene. Exits non-zero if anything is open or any
audit fails.

This also runs **automatically** before `npm run render` and `npm run build` (npm's
native `prerender` / `prebuild` lifecycle hooks in `package.json` — no separate step to
remember, no way to accidentally ship with an open item).

### 7. Render
```bash
npm run render
```
Only runs if step 6 passed.

## The 4th and 5th audits: Execution_Text freshness

`scripts/audit-execution-text-freshness.js` checks the one thing in `Execution_Text` that
actually matters mechanically and is exactly what breaks when scenes are added, removed,
or audio length changes: each file's `Appears in the video at:` / `Scene length:` header
against the live numbers in `sceneRegistry.ts`. It does **not** try to regenerate the
prose choreography description — that's hand-written and the freshness check would risk
clobbering a careful description for a benefit (auto-prose) that isn't reliable to build.
If it flags drift, fix the header line by hand to match `sceneRegistry.ts` (the locked
source of truth) — usually a 30-second fix once it's pointed at exactly which file and
which number.

Files shared by two scenes (e.g. `Frame_18.txt`, reused by `scene-18` and `scene-20-dup`
at different speeds — see CLAUDE.md's "Frame_18 appears twice" note) are checked more
loosely: each scene's expected clock time and frame count just need to appear somewhere
in the file, since the dual-`OCCURRENCE` format isn't worth hardcoding for a one-off.

`scripts/audit-typewriter-speed-freshness.js` exists because of a real failure found in
the v12 review: every scene's title-typing prose documented the CODED `interpolate()`
window, but `typewriterReveal()`'s `TYPING_SPEED_FACTOR` (animationUtils.ts) compresses
the actual on-screen completion frame to a fraction of that — and that factor, or any
scene's own window, can change independently of prose describing it (it did, twice: once
for the speed fix, once earlier for a VO-sync retiming that also went undocumented). This
audit computes the real completion frame fresh from source every run — never hand-
maintained — and flags any scene whose `Execution_Text` doesn't mention it. Fixing v12's
drift also surfaced 5 cases where the mechanism itself was wrong (e.g. a scene documented
as "fades in" or "wipes on" when the code actually uses a full typewriter+cursor effect) —
this audit only catches frame-number drift, not mechanism description; a wrong mechanism
needs a human (or Claude) to actually read the scene's code and compare.

## What this system does NOT do

It does not verify a fix *looks* correct — only a human or a quick `npx remotion still` +
eyeball pass (or, for motion-only issues, an actual playback) can judge that. The gate
verifies **completeness** (nothing left unaddressed) and 5 specific, mechanically-checkable
bug classes. Treat "gate passes" as "nothing was forgotten and no known bug class
regressed," not as "every fix is visually perfect" or "every description is accurate" —
mechanism-level prose accuracy still needs an occasional human read-through.

## Files this system owns

```
feedback/
  v{N}-comments.json     ← regenerable ledger, not hand-edited
  .current-round         ← which round is in progress
scripts/
  import-review-comments.js
  resolve-comment-scenes.js
  sync-review-to-execution-text.js
  audit-execution-text-freshness.js
  audit-typewriter-speed-freshness.js
  qa-review-gate.js
Execution_Text/Frame_XX.txt   ← gains a "## Review — vN" section per round (human-owned
                                  from there — the pipeline never touches it again once
                                  written)
```
