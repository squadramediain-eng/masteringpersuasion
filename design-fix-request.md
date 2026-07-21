# Frame fix request — Mastering Persuasion (for Claude Design)

Everything below was measured against the 20 frames exported from this design project
and verified in a full 9:46 Remotion render. Fix these upstream and re-export; the film
pipeline consumes the SVGs directly, so local patches get overwritten by the next export.

---

> **Round 2 status (mp_v1.zip).** §1 is fixed for frame_1 and frame_15 — both now hold a
> single filled icon inside the disc, verified in the render. Two things still open:
> **§0 got worse, not better** (frame_1's ids were reverted this round — see below), and
> **§1 has a fourth instance in frame_9** that the first pass missed.

---

## 0. The one that matters most: id stability

The film pipeline animates **by SVG element id**. `public/animation/animation.json` and
`public/animation/audio-cues.json` name ids explicitly, and an id that changes or disappears
does **not** throw — the element silently never animates. The last export did both:

| export | frame | change | effect if unnoticed |
|---|---|---|---|
| round 1 | frame_1 | `mind_left_1..3` → `node_person_l1..l3`, `mind_right_1..3` → `node_person_r1..r3` | 6 elements stop animating |
| round 1 | frame_18 | `ring_1..4` deleted from the artwork | 4 cues point at nothing |
| **round 2** | **frame_1** | **`node_person_l/r*` → `mind_left/right_*` — the round-1 rename REVERTED** | **the same 6 elements stop animating** |

This is the part that has not improved. Round 2 fixed the composition problems in §1, but
it also changed frame_1's ids a second time, in the opposite direction — so the rebinding
done for round 1 had to be undone again by hand. Two exports, two id churns, both silent.

Please adopt one of these going forward:

- **Preferred:** treat ids on animated elements as a stable contract — renaming one is a
  breaking change.
- **Otherwise:** ship a `rename-map.json` with each export (`{"old_id": "new_id"}`, and
  `null` for deletions) so the rebinding can be applied mechanically instead of by
  diffing 929 ids per frame.

Also note ids that don't describe what they draw (`swing_arrow` is a quote card,
`wind_arrows` is a thought bubble, `label_kick_ahead` is the real swing arrow). Not a bug
to fix retroactively, but new ids should name the artwork.

---

## 1. Illustrations overflowing their spotlight discs — 3 confirmed

A wide composite illustration (~2:1) is being placed inside a circular spotlight disc. The
art breaks the dashed orbit ring instead of sitting inside it. Measured rendered size vs
the disc's own orbit radius:

| frame | element | rendered size | orbit r | reach | overflow | status |
|---|---|---|---|---|---|---|
| frame_1 | `input_bottom_3` | 233.4 × 120.2 | 65 | 117.3 | +80% | **fixed in mp_v1** |
| frame_15 | `benefit_survey` | 323.2 × 166.5 | 90 | 162.4 | +80% | **fixed in mp_v1** |
| frame_15 | `benefit_cargo_calc` | 306.1 × 166.6 | 90 | 153.5 | +71% | **fixed in mp_v1** |
| **frame_9** | **`icon_ship`** | **314.2 × 161.9** | **87.5** | **157.9** | **+80%** | **STILL OPEN** |

The three fixed ones are now exactly right — a single filled icon (lightbulb, scales)
centred in the disc. That is the target for frame_9 too.

**frame_9 `icon_ship` is the same defect and the same artwork** — the cargo ship + network
graph + magnifying glass cluster, with the bow and hull breaking the dashed ring on both
sides. It sits above the Aggressive/Rational/Passive strategy table and cues at 3.99s into
the scene. It was missed in round 1 because the first sweep matched discs to contents *by
id name*, and frame_9's names did not pair the way the others did; re-running the sweep
matched by geometry found it. Please apply the same fix used for frame_1 and frame_15.

**Please don't fix this by scaling down.** Making `input_bottom_3` fit its ring needs
`scale(0.8176)` → about `0.47`, a 43% shrink that leaves it tiny next to its siblings
(`input_bottom_2` sits comfortably at 0.6701). The composition is the problem: either

- swap in a **square-ish single-subject icon** per the design system's own 48×48 filled
  illustration set (`dialogue`, `exchange`, `branch`, `weigh`, `social`, `influence`,
  `insight`, `reframe`), which is what the spotlight motif is specified to hold — one
  filled blue icon, not a scene; or
- give these three a **larger or non-circular container** if the composite scene is the
  intent.

This got more conspicuous in the latest export, not less: the new `discShadow` filter draws
a defined disc edge where there used to be only a soft glow, so the overflow now reads as a
mistake rather than a loose crop.

---

## 2. Off-palette colours — 11 values

The system is one blue family + ink + a single muted-brick alert. `#ac4f55` / `#8a3b41`
are correctly used and are **not** in this list. These are:

**Violet — explicitly banned ("no violet, no teal, no second decorative hue anywhere")**

| hex | uses | frames |
|---|---|---|
| `#311273` | 7 | 0, 1, 5, 9, 15, 19 |
| `#311173` | 3 | 6, 7 |

Small (≈3px radius dots) but real, and they sit next to `#fef4f2` warm-white dots.

**Neutral grey — should be ink-tinted (`#253761`-based), never neutral**

| hex | uses | frames |
|---|---|---|
| `#8a8c8f` | 143 | 15 |
| `#dedfe1` | 16 | 0,1,2,4,5,9,10,11,12,13,15,16 |
| `#8c8c8c` | 16 | 0,1,2,4,5,9,10,11,12,13,15,16 |
| `#939393` | 13 | 0,1,2,4,5,9,10,15,16 |
| `#a0a0a0` | 9 | 1,3,4,9,15 |
| `#acacac` | 9 | 1,3,4,9,15 |
| `#d0d2d3` | 7 | 15 |
| `#e6e6e6` | 2 | 3,4 |

The 143 uses in frame_15 are the tablet's screen detail (rendered with
`mix-blend-mode:multiply`, so they are visible). The design system requires shadows and
neutrals to read cool, not grey.

**Warm off-palette**

| hex | uses | frames |
|---|---|---|
| `#f1ebe9` | 4 | 6, 7, 12, 13 |

Gradient stops inside the ship gradients (`ship__linear-gradient-2`).

---

## 3. Smaller items

- **frame_8 — 113 gradients** (111 linear + 2 radial), over the 100 guideline. It renders
  correctly and is not blocking; worth deduplicating if convenient.
- **frame_8 — `crew__layer_N` numbering gaps** (20–24, 26–32, 34–40, 42–48 missing). Purely
  cosmetic Illustrator artefacts, no functional impact. Ignore unless you're tidying.
- **frame_7 — no live `<text>` element.** Please confirm this frame is text-free by design
  and that nothing was outlined to shapes. Font rule is DM Sans / DM Mono, always live text.

---

## 4. Confirmed good — please don't "fix" these

- **`data-layer="world|base|icon"`** (50 attributes across the 20 frames) is a genuine
  improvement — keep it and extend it. It matches the pipeline's world/base/content model
  exactly; verified against every tagged group with zero disagreement.
- **`bg` fill `#f5f6fa`** is correct and must stay. It differs from the design system token
  `--wash-canvas: #f2f4f9`, but the pipeline paints `#f5f6fa` behind every scene; changing
  the frames to the token would introduce a seam. If the token is meant to win, that is a
  separate decision and both sides must change together.
- **`waves` group id** — the pipeline lifts the wave band out of `frame_19.svg` by this id
  to render one continuous body of water behind all 20 scenes. Renaming it to `wave-band`
  is tolerated but `waves`/`wave`/`WaveLine` are the only accepted names; anything else
  produces a blank world.
- **frame_18 without `ring_1..4`** renders cleanly — the `spot_trait_N` rings carry those
  beats on their own. Removal looks intentional and correct; just flag deletions per §0.
