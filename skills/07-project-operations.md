# Project Operations — Session Workflow & Assembly

## Session Start

```bash
# 1. Orient
cat src/utils/sceneRegistry.ts | grep -A3 "status:"    # what's done vs todo

# 2. For the scene you're about to build
grep -o 'id="[^"]*"' src/assets/scenes/Frame_XX.svg \
  | grep -v 'linear-gradient\|radial-gradient\|clipPath\|filter\|mask' \
  | sed 's/id="//;s/"//' | sort -u
```

## Per-Scene Workflow

```
1. SVG audit  →  01-svg-pipeline.md
2. Write plan →  04-scene-planning.md (confirm before coding)
3. Build      →  02-scene-build.md + 03-animation-library.md
4. QA         →  05-qa-checklist.md
5. Commit     →  git commit -m "feat: SceneXX complete"
6. Wire up    →  Add to SCENE_COMPONENTS map in MainComposition.tsx
7. Update     →  sceneRegistry.ts status → 'done'
```

## MainComposition Wiring

```tsx
// src/MainComposition.tsx — add at top (alphabetical order)
import { SceneXX } from './scenes/SceneXX';

// Add to SCENE_COMPONENTS map
'scene-XX': SceneXX,
```

Scenes are positioned via the `SCENE_REGISTRY.map(...)` loop already in `MainComposition.tsx` —
no per-scene `Sequence` wiring needed, just add the entry to `SCENE_COMPONENTS` and to
`sceneRegistry.ts`. `SceneWrapper` handles the 30f fade-out transition; each scene handles its
own fade-in internally.

---

## Remotion Commands

```bash
npm run start           # open studio with live preview
npm run render          # full render to out/
npm run check-audio     # measure MP3 durations
```

## Global Settings
- FPS: 30  |  Width: 1920  |  Height: 1080  |  Total: FINAL_FRAMES (set once audio is locked)
- Codec: h264  |  Entry: src/index.ts  |  Composition ID: MainComposition

---

## Duration Formula

`durationFrames` for every scene is locked in `sceneRegistry.ts` once set. Do not recompute.
Only for genuinely new scenes: `Math.ceil(audioSeconds * 30) + 15`

Transition model: 30f light gap between scenes (NOT overlap). Gap ADDS time, not subtracts.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `durationInFrames must be positive` | Scene has durationFrames: 0 in registry | Set placeholder 150 or measure MP3 |
| White/blank frame | SVG path wrong | Check `src/assets/scenes/Frame_XX.svg` exists |
| Layer visible but frozen | ID casing mismatch | grep IDs from actual file, match exactly |
| `_x5F_` in IDs | Illustrator encoding bug | File back to illustrator — do not animate |
| 600KB+ SVG loads slowly | Embedded base64 PNGs | Extract PNGs to `public/images/`, use `<image href="">` |
| Audio cuts off early | durationFrames too short | `npm run check-audio`, update registry |
| Audio bleeds to next scene | Audio longer than scene window | Increase durationFrames or trim MP3 |
| Element rotates from corner | Missing `transform-box: fill-box` | Add to every scale/rotate CSS rule |

---

## Blocked Scenes

Track any scene that needs an illustrator fix before animating, e.g.:
- embedded PNGs that need extracting
- encoding corruption (re-export UTF-8)
- `_x5F_` IDs / unnamed groups / excess embedded images (see `extras/svg-audit.js`)

Do not attempt blocked scenes until the validator reports CLEAN.

---

## Session End

```bash
git add -A
git commit -m "batch N complete: scenes XX, XX done"
# Update CLAUDE.md progress log checkboxes
# Update sceneRegistry.ts statuses
```

---

## Final Assembly Checklist

```bash
grep "FINAL_FRAMES" src/utils/sceneRegistry.ts                   # matches locked total
grep "': Scene" src/MainComposition.tsx | wc -l                  # should match scene count
grep -n "SceneWrapper\|TransitionSeries" src/MainComposition.tsx # SceneWrapper YES, TransitionSeries NO
ls -la public/audio/                                              # voiceover file(s) present, sane size
```
