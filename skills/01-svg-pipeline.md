# SVG Pipeline — Validate First, Code Never Guesses

## The Rule: Validator Before Everything

The SVG validator runs BEFORE writing any scene code. Never assume IDs from svg-layers.md
(the snapshot) — always verify against the actual file. The validator is the source of truth.

```bash
# Step 1 — Run the validator
node extras/svg-audit.js src/assets/scenes/Frame_XX.svg

# Step 2 — Extract clean layer IDs only
grep -o 'id="[^"]*"' src/assets/scenes/Frame_XX.svg \
  | grep -v 'linear-gradient\|radial-gradient\|clipPath\|clip-path\|filter\|mask' \
  | sed 's/id="//;s/"//' \
  | sort -u
```

**If validator reports ANY of the following → STOP, file the SVG back to illustrator:**
- Top-level unnamed groups > 5%
- `_x5F_` encoded IDs (Illustrator encoding bug)
- Embedded PNG images (base64 inside SVG)
- Duplicate IDs
- "Possible outlined text" warning on h1/text groups

**Only proceed when validator output shows: CLEAN / READY.**

---

## Three-Tier Group Model

| Tier | What it is | Animate? |
|------|-----------|---------|
| **Content group** | Named, has its own geometry (`bg`, `wave_1`, `ship`, `icon_1`) | YES — target directly |
| **Category group** | Named, empty wrapper around other named groups (`fishes` → `fish_1..9`) | NO — animate its named children |
| **Exempt child** | Unnamed sub-parts inside a content group (paths, strokes, shapes) | NEVER — they move with parent |

**The test:** does the group have geometry of its own, or only named children? Geometry → content group. Only named children → category group.

```
<g id="fishes">          ← category group — don't target
  <g id="fish_1">        ← content group — target this
    <g><path/></g>       ← exempt child — ignore
  </g>
</g>
```

---

## ID Casing Issues (Known — Fix in Code)

These SVG files use uppercase IDs that must be matched exactly:
- Frames 07, 08, 09, 10, 11, 12, 14: `BG` not `bg`, `H1_text` not `h1_text`, `Icon_1` not `icon_1`
- Frames 20, 21, 22, 23, 26: `H1_text` not `h1_text`

CSS `#id` selectors are case-sensitive. If `#wave_1 { }` does nothing → check casing.

---

## Pre-Code SVG Audit Report (write this before any .tsx)

```
SVG AUDIT — Frame_XX.svg
━━━━━━━━━━━━━━━━━━━━━━━━
Validator: CLEAN ✅ / BLOCKED ❌ — [reason]
Background:   bg, [others]
Subject:      ship / character / [main element]
Supporting:   icon_1→N, wave_1→N, [others]
Text:         h1_text, text_1→N
Decorative:   bg_circle, bg_lines, [others]
Skip (don't animate): [gradient IDs, clip IDs, mask IDs]
Casing notes: [any uppercase IDs]
```

---

## After Building the Scene — Wiring Audit

```bash
# Verify every ID in SceneXX.tsx actually exists in the SVG
node scripts/audit-scene-ids.js src/scenes/SceneXX.tsx src/assets/scenes/Frame_XX.svg
```

Any ID in code but not in SVG = silent no-op. Fix before committing.
