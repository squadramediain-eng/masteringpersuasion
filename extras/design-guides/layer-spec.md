# Motion Layer & Naming Spec — Mastering Persuasion

How every `frames/frame_N.svg` is structured for the Claude Code + Remotion pipeline.
Applied uniformly across all 20 frames so the animator can bind by **id**, composite
by **layer**, and time by **cue**.

## 1. Ids — semantic, snake_case, unique per frame
- No Illustrator noise: `art_N`, `part_N`, `scene_N`, `square`, `round`, `element`
  are gone; `_x5f_` (Illustrator's escaped underscore) is normalised to `_`.
- Every animatable top-level group carries a role-based id, numbered in document
  (paint) order where a role repeats: `pillar_disc_1`, `concept_icon_3`,
  `person_2`, `step_1`, `tile_safety_tool`, `crane_1`, `row_aggressive`, etc.
- Character figures are one group per person (`ab`, `bosun`, `leader`,
  `officer_1`…) with limbs nested inside (`head`, `torso`, `arm_l`, `leg_r`…),
  not scattered as top-level siblings.
- Text is named by role: `title`, `heading`, `kicker`, `subhead`, `body`,
  `numeral`, `stat`, `caption`, `label`.

## 2. Layers — `data-layer`, painted back → front
A fixed z-stack. Every top-level group gets exactly one:

| order | `data-layer` | holds |
|-------|--------------|-------|
| 1 | `bg`     | flat canvas fill, faint grid, sky gradient |
| 2 | `env`    | environment depth: water body, seabed, coral, fish, plants, ocean, port, buildings |
| 3 | `waves`  | the four-layer signature wave band |
| 4 | `decor`  | atmosphere + guides: dashed frame, guide grid, concentric rings, bubbles, stars, clouds, birds, sparkles |
| 5 | `scene`  | narrative hero vehicles/structures: ships, cranes, machinery, equipment |
| 6 | `char`   | character figures |
| 7 | `icon`   | concept / spotlight / benefit disc icons |
| 8 | `card`   | panels, tiles, tables, rows, quote boxes, speech bubbles, connector arrows |
| 9 | `text`   | all live `<text>` |
| 10| `fx`     | top-most effect overlays (rare) |

## 3. Cue binding — narration timing
Cued groups carry the attributes the pipeline reads (source of truth stays
`motion/cue-bindings.json`, whose `target` now names the real id):
- `data-cue`   — VO word the element enters on
- `data-t`     — absolute enter time (sec)
- `data-relt`  — seconds after the scene's own start
- `data-beat`  — beat index within the scene
- `data-enter` — entrance style (`typewriter`, `fade`, `pop`, `slide`, `draw`)
- `data-cx` / `data-cy` — transform-origin for `pop`/scale entrances

## 4. Invariant
Renaming / regrouping / layering must **not** change a single rendered pixel —
groups get ids, wrappers, and `data-*` only; geometry, fills, and paint order
are untouched. Verified frame-by-frame against `references/video-frames/Frame_N.png`.
