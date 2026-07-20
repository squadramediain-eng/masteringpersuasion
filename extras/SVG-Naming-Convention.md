# SVG Naming Convention — For the Illustrator Pass

This is the rule sheet for whoever names layers in Illustrator before export. It exists
because of a specific, repeated failure mode found across this project (see
`SVG-Content-Issues.md` for the casualties: scene-14's 4 unnamed category labels, scene-26's
bundled record-book table) and because of how unlicensed fonts get handled. Follow this before
exporting, not after — once text is outlined, the information needed to name it correctly
(what it says) is gone unless you captured it at the moment of outlining.

> **Policy update — do not outline text.** The "outlining" guidance throughout this doc was
> written for unlicensed fonts you can't legally redistribute. This project only uses **DM
> Sans**, a free Google Font (OFL) with no such restriction — there was never a real reason to
> outline it, and doing so produced worse, more fragile text animation across most of this
> project's 25 scenes. **Never run Type > Create Outlines on text in this project.** Export
> text live (`<text>`/`<tspan>`). Every weight of DM Sans is loaded in `src/Root.tsx` (all
> illustrations are client-approved as-is, so weight choice isn't restricted) — the only thing
> that must match exactly is the font name itself: **`DM Sans`**, never a lookalike like "DM
> Sans 18pt" (a different, unloadable font) or a substituted system font. See
> `extras/Live-Text-Retrofit-Spec.md` for the full per-scene re-export plan this triggered.
> The rules below about *naming* still apply in full to live
> text — only the "outline it" instruction is superseded.

## The rule in one sentence

> **A name has to tell Claude Code three things: what kind of thing this is, which specific
> instance it is, and — if it's text — what it says (or where to look that up).** An id that
> only proves "this group has *a* name" is not enough.

`icon_text_1` fails this. It doesn't say it's text (could be an icon), doesn't say which text,
and gives no way to recover the content once the letters are outlined. `text_sediments` passes
all three.

## Why this matters more than it looks like it should

A named top-level group with unnamed path children inside it is *normally fine* — see
`skills/svg-depth-rules.md`'s two-tier model: animate the named parent, ignore the unnamed
children, that's the whole point of grouping. **Outlined text breaks this model silently.**
The children aren't decorative sub-shapes of one coherent icon (which can always animate as a
single rigid unit) — they're independent letters that conceptually form a sentence. The group
*can* still be animated as one rigid unit (fade/scale), but doing that throws away the option
of a typewriter/clip-path reveal, which is what nearly every text element in the reference video
actually uses. Claude Code can only make that choice if the name says "this is text" — it
cannot infer it from 9 anonymous `<path>` siblings, because a 9-piece icon (a gear, a bird, a
cloud cluster) looks structurally identical from inside the SVG.

## The chain this prevents

This project doesn't outline text (see the policy update above) — DM Sans never required it.
The chain below only applies if a genuinely unlicensed font ever shows up in a future asset and
outlining becomes unavoidable for that one case:

```
Illustrator has live text ("Sediments")
        → font unlicensed, outlining is required before export
        → Type > Create Outlines run on a SINGLE selected text frame (not a batch Select All)
        → immediately group the result and name it from the text you just outlined: text_sediments
        → done — the name survives even though the string itself no longer exists in the file
```

The failure only happens when outlining is done as a **batch operation across many layers at
once** — at that point nobody is looking at content per-group, so the export tool (or a human
working fast) falls back to a generic placeholder name. **Outline one text frame at a time,
name it the moment you outline it, while you can still read what it said.**

## Naming rules

1. **Every top-level group needs a name that identifies role + instance.** Use the prefixes
   already established across this project's 28 SVGs — don't invent new ones per file:
   - `bg`, `bg_circle`, `bg_element_N`, `bg_lines` — background/decorative, rarely individually animated
   - `wave_N` — ocean wave bands
   - `icon_N`, `icon_N_<part>` — a self-contained illustration (ship, gear, book...). `<part>`
     only when a sub-piece genuinely needs independent motion (e.g. `icon_1_magnifier` orbiting
     inside `icon_1`)
   - `box_N`, `box_N_bg`, `box_N_text`, `box_N_line` — a repeated card/panel layout
   - `h1_text`, `h2_text`, `h1_text_1`/`h1_text_2` (for a 2-line title split across lines) — the
     scene's main heading
   - `text`, `caption_N`, `description_text_N`, `your_action_text_N`, `box_N_text` — body/
     caption text, always with an index if there's more than one
2. **Never use a name that only describes the container, not the content**, when content
   identification is possible: `icon_text_1`, `text_1` (when there are 8 text blocks and no way
   to tell which is which), `group_1`, `layer_3`, `element`. If you can read the string before
   outlining, put a slug of it in the name: `text_sediments`, `caption_design_label`,
   `your_action_log_operations`. If the string is too long for a clean slug, use a stable,
   documented index instead (`caption_07`) and keep a side-manifest mapping index → original
   string — but a content slug is always preferred when it fits.
3. **One group per independently-revealable unit — never bundle.** This is the scene-26 bug:
   a table's grid/border and every row of content got dumped into one group (`box_2_text_3`),
   so the only way to "reveal" the table was an instant all-or-nothing fade, when the reference
   needed the grid to appear first and rows to fill in over several seconds. The rule:
   - A multi-line paragraph that needs per-line typewriter timing → each line is its own
     top-level group, or a single group whose internal structure groups by line (not by letter
     and not as one flat blob).
   - A table/grid → the border/grid is its own group, separate from the row content; if rows
     need to appear on their own schedule, each row (or row-batch) is its own group too.
   - A multi-step diagram (icon → arrow → icon) → each step is its own group, even if they're
     visually touching.
   - A composite icon with parts that move independently (a rotating outer ring, a separate
     inner ring, ocean waves, several small organisms, all inside one "circle" motif) → each
     part is its own top-level sibling, not nested inside one wrapper. Frame_02.svg has the
     worked example of both the right and wrong way to do this **in the same file**: `icon_3`
     and `icon_4` split their organisms/plants correctly (`species_1`/`species_2`/`species_3`;
     `icon_4_waves`, `icon_4_plant_1`, `icon_4_plant_2`), but `icon_1`'s entire equivalent bundle
     is dumped into one group literally named `group`, and `icon_2`'s organism cluster is one
     group named `microorganisms__icons` — see `SVG-Content-Issues.md` for the exact stats.
     **Important limitation**: no validator can tell you *which* parts inside a bundle need
     independent motion — that's a judgment call against the reference video, not something
     inferable from the SVG alone. What the validator *can* tell you is "this name is vague or
     collective AND the group is unusually large/color-diverse, so it's worth opening and
     checking" — it flags the candidate, a person still makes the call.
4. **A plural or collective name still isn't an instance name.** `microorganisms__icons` tells
   you what's inside, but not how many there are or whether they move independently — same
   problem as rule 2's vague names, different shape. If a name ends in a plural/category word
   (`_icons`, `_elements`, `_organisms`, `_species`...) and wraps more than a handful of pieces,
   it likely needs splitting one-per-instance, not just a better category name.
5. **The fix for rule 4: wrap repeated instances in an empty "category" group, not a bundle.**
   Instead of dumping `fish_1`..`fish_9` loose at the top level (clutters the Layers panel) or
   bundling them anonymously under one collective name (rule 4's problem), do both at once — a
   category group with zero shapes of its own, containing only the individually-named instances:
   ```
   fishes/              ← empty container, no shapes of its own
     fish_1
     fish_2
     ...
     fish_9
   circles/
     circle_1
     circle_2
     circle_3
   ```
   This is structurally different from a normal content group like `icon_1` or `ship` — those DO
   have their own geometry, and their unnamed children are genuinely decorative sub-shapes
   meant to move as one rigid unit (see `skills/svg-depth-rules.md`). A category group has NO
   geometry of its own, so its named children (`fish_1`..`fish_9`) stay fully individually
   targetable and validated, exactly as if they sat loose at the top level — the wrapper exists
   purely to organize the Layers panel.
   - **The test**: select the wrapper in Illustrator. If it shows zero paths/shapes of its own
     (only sub-groups), it's a category group. If it has its own artwork, it's a content group
     and the old "children are exempt" rule applies instead.
   - Naming: plural noun for the wrapper (`fishes`, `circles`), underscore + index per instance
     (`fish_1`, `circle_1`) — matches this project's existing underscore convention everywhere
     else (not `fish-1` — hyphens aren't used anywhere else in this project's ids).
   - `extras/svg-audit.js` / `svg-validator.html` both already recognize this: a well-formed
     category group (empty, every child individually named) does not trigger rule 4's
     collective-name warning, and its children still get full top-level validation — shown with
     a green `TOP-LEVEL` badge in the layer-hierarchy tree, same as any other top-level group.
6. **Don't let a generic id "pass" just because it has a value.** `icon_text_1` technically
   satisfies "every top-level group has an id" — that check is necessary but not sufficient.
   See `extras/svg-audit.js`'s outlined-text heuristic (added alongside this doc) for the
   automated version of this rule.
7. **If a caption's exact final wording isn't locked yet**, still name the group from the
   current draft text, not a placeholder. A wrong-but-specific name (`text_seidiments` — typo
   and all) is more useful than a correct-but-empty one (`text_1`), because at least it's
   traceable back to which caption it is when the copy gets fixed later.

## Quick self-check before exporting

Ask, for every top-level named group: **"If I deleted this file right now and only kept this
one id string, could someone who's never seen the artwork guess roughly what's there?"** If the
answer is no (`icon_text_1`, `group_4`, `layer_12`), rename it before export.

## Related files

- `extras/SVG-Content-Issues.md` — the running list of casualties from before this convention
  existed (scene-14's unnamed labels, scene-26's bundled table) — read these as worked examples
  of what this convention prevents.
- `skills/svg-depth-rules.md` — the two-tier targeting model (named parent vs. unnamed
  children) that this convention's rule 3 is the exception to, for text specifically.
- `extras/svg-audit.js` — run this on every SVG before handing it off; it now flags the
  generic-name-wrapping-outlined-text pattern automatically (see its "possible outlined text"
  check).
- `extras/svg-validator.html` — the same checks as `svg-audit.js`, but with a drag-and-drop UI
  and a "Layer Hierarchy" tree per file: every top-level group shown open (including ones
  nested under an unnamed wrapper — they're still individually targetable), with vague/
  collective/outlined-text findings badged directly on the node they apply to. Useful for
  showing an illustrator or manager exactly what "`group` bundles 157 sub-groups" looks like,
  instead of just reading the sentence.
