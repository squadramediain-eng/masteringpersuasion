#!/usr/bin/env node
/**
 * SVG Pre-Production Validator for Remotion
 * Usage:  node svg-audit.js file.svg [file2.svg ...]
 *         node svg-audit.js *.svg
 *
 * DEPTH MODEL
 * ───────────
 * Top-level groups  : <g> with NO named ancestor → must have an id
 * Child groups      : <g> inside a named parent  → unnamed is fine (body parts, sub-shapes)
 *
 * The "unnamed %" check only measures top-level (orphaned) groups.
 * Hundreds of unnamed children inside icon_1, fish_3 etc. are expected and ignored.
 */

const fs   = require("fs");
const path = require("path");

// ─── Thresholds ──────────────────────────────────────────────────────────────
const RULES = {
  MAX_ORPHANED_UNNAMED_PCT : 20,   // % of TOP-LEVEL groups allowed without an id
  MAX_FILE_SIZE_KB         : 400,
  MAX_GRADIENTS            : 100,
  MAX_FILTERS              : 8,
};

const UTILITY_ID_PATTERNS = [/^clippath/i, /^clip-path/i];

const KNOWN_TYPOS = {
  elipse    : "ellipse",
  particals : "particles",
  particels : "particles",
  recieve   : "receive",
  hieght    : "height",
};

const RAW_LAYER_RE = /^Layer_?\d+$/i;
const VALID_ID_RE  = /^[a-z][a-z0-9_]*$/;
const PASCAL_RE    = /[A-Z]/;

// IDs that already self-identify as text — see extras/SVG-Naming-Convention.md.
// A top-level group matching this is assumed to know it's text; it's only flagged
// if its path count suggests several bundled lines (see OUTLINED_TEXT checks below).
const TEXT_ISH_ID_RE = /text|caption|label|heading|title|^h[12]\b/i;

// Common decorative-cluster name fragments that legitimately produce several
// small same-color paths in a tight arrangement (particles, bubbles, sparkles) —
// excluded up front so the geometry check isn't the only thing standing between
// them and a false "possible outlined text" flag.
const DECORATIVE_CLUSTER_ID_RE = /particle|bubble|dot|spark|star|dna|molecule|glow|confetti/i;

// A name can contain "text" and still fail the actual goal: telling Claude Code
// WHICH text this is. "icon_text_1" passes a substring check for "text" but is
// exactly the failure case from SVG-Naming-Convention.md — a generic category
// word plus a bare index, no content slug, no distinguishing word. This is a
// DIFFERENT check from the geometry-based one above: that one catches names with
// NO text-indicating word at all; this one catches names that mention "text" but
// still carry no usable identifying information.
const VAGUE_GENERIC_NAME_RE = /^(icon_text|text|caption|description|element|group|layer|shape|item|object)_?\d*$/i;

// A DIFFERENT failure from "vague": the name is specific, but it's plural —
// it already admits "this is several things," not one. "microorganisms__icons"
// tells you what's inside, but not how many, or whether they need to move
// independently. Only treated as suspicious when combined with the same
// bundle-size signal as describeBundleSize() below — a plural name on a small,
// genuinely-one-motif group (e.g. a tight cluster of 3 identical dots) isn't
// a problem.
const COLLECTIVE_PLURAL_ID_RE = /(icons|elements|items|shapes|objects|organisms|species|microorganisms)$/i;

// A THIRD, distinct failure from "vague"/"collective": the name carries zero role
// or content information at all — just a position word or a bare letter. Found
// empirically across this project's Frame_03/21/22/23/24/25 batch: an illustrator
// reused one bare word ("number", "water") for many table rows / wave bands
// instead of indexing it (number_1, wave_1), and either named each copy by its
// ordinal position instead ("first", "second"... "twentynine") or let every
// instance collide under the literal same id. Neither tells Claude Code what
// the group actually is — "first" describes order, not role or content.
const NUMBER_WORD_ID_RE = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|ninteen|nineteen|twenty|twentyone|twentytwo|twentythree|twentyfour|twentyfive|twentysix|twentyseven|twentyeight|twentynine|thirty)$/i;
const ORDINAL_WORD_ID_RE = /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)$/i;
// Bare 1–2 letter ids with no trailing digit ("a", "b", "n", "aa") — distinct from
// this project's legitimate short-abbreviation convention (c1, l3, t2, h1), which
// always ends in a digit identifying the instance. No digit = no instance info.
// "bg" is the one deliberate exception: checked across all 28 production SVGs,
// it's the only bare short id used consistently project-wide (every scene's
// background layer) — not a collision artifact, so it's excluded by name.
const BARE_LETTER_ID_RE = /^(?!bg$)[a-z]{1,2}$/i;

// Illustrator's OTHER way of auto-disambiguating a colliding bare name (besides
// _x5F_ escaping): silently truncating/extending one copy per collision instead of
// indexing it, so duplicates of "number" or "wave" land as a chain of prefixes —
// "n","nu","num","numb","numbe","number" or "wav","wavv","wavvv","wavvvv". Detects
// any two PURE-ALPHA top-level ids (no digits/underscores, so it can't fire on the
// real "box"/"box_1" convention) where one is a strict prefix of the other and
// they're close in length — a real "box" vs "boxes" false positive would need an
// unrelated id pair to coincidentally collide this way, which hasn't happened in
// this project's existing clean files.
function findPrefixChains(ids) {
  const alphaIds = [...new Set(ids)].filter(id => /^[a-z]+$/i.test(id));
  // Union-find: any pair where one is a prefix of the other (within 6 chars) joins
  // the same chain — collapses "n"/"nu"/"num"/"numb" into one reported group
  // instead of every pairwise combination.
  const parent = new Map(alphaIds.map(id => [id, id]));
  const find = (x) => (parent.get(x) === x ? x : find(parent.get(x)));
  const union = (x, y) => { const rx = find(x), ry = find(y); if (rx !== ry) parent.set(rx, ry); };
  for (let i = 0; i < alphaIds.length; i++) {
    for (let j = i + 1; j < alphaIds.length; j++) {
      const a = alphaIds[i].toLowerCase(), b = alphaIds[j].toLowerCase();
      const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
      if (longer.startsWith(shorter) && longer.length - shorter.length <= 6) {
        union(alphaIds[i], alphaIds[j]);
      }
    }
  }
  const groups = new Map();
  for (const id of alphaIds) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(id);
  }
  return [...groups.values()]
    .filter(g => g.length > 1)
    .map(g => g.sort((a, b) => a.length - b.length));
}

// The group whose id "claims" a given group, skipping through any unnamed
// wrapper <g>s in between — mirrors how hasNamedAncestor already treats
// unnamed wrappers as transparent, just queryable per-node instead of
// accumulated top-down.
function nearestNamedAncestor(grp) {
  let p = grp.parent;
  while (p) {
    if (p.id !== null) return p;
    p = p.parent;
  }
  return null;
}

// A "category group" is a deliberate, well-formed container — see
// SVG-Naming-Convention.md: an otherwise-empty wrapper (no leaf content of
// its own) whose every named descendant — skipping through any unnamed
// wrapper sub-groups Illustrator might insert — resolves straight back to
// it, e.g. "fishes" wrapping fish_1..fish_9. This is the GOOD version of a
// collective/plural name, not the bad one — it should NOT trip the
// collective-name warning below, since (unlike "microorganisms__icons"
// bundling 40 anonymous sub-groups) every instance here already has its own
// id and is fully validated as its own top-level group.
function isWellFormedCategoryGroup(allGroups, grp) {
  // hasDirectLeafContent already confirms every leaf tag under grp belongs
  // to a named descendant, not grp itself — combined with "at least one
  // named descendant exists," that's sufficient: a pure container with one
  // or more individually-named instances inside it.
  if (grp.hasDirectLeafContent) return false;
  const ownedNamedChildren = allGroups.filter(c => c.id !== null && nearestNamedAncestor(c) === grp);
  return ownedNamedChildren.length > 0;
}

// ─── Depth-aware group parser ─────────────────────────────────────────────────
// Walks opening/closing <g> and <defs> tags via a character-level scan.
// Groups inside <defs> (gradients, clip paths) are skipped entirely.
// Each group record carries:
//   id                   – string or null
//   parent               – the enclosing group's record, or null for a root group
//   hasDirectLeafContent – true if this group has its own path/rect/etc. NOT
//                          belonging to one of its direct child groups
//   hasNamedAncestor     – true if an ancestor both has an id AND has direct
//                          leaf content of its own (a "content group" — see
//                          below). A NAMED ancestor with NO direct content of
//                          its own (a "category group", e.g. an empty
//                          "fishes" wrapper around fish_1..fish_9) does NOT
//                          grant exemption to its children — see
//                          SVG-Naming-Convention.md's category-group rule.
//   depth                – nesting depth from <svg> root (informational)
//   startIdx/endIdx      – character offsets of the opening/closing tags, used to
//                          slice out this group's full content span elsewhere
//
// hasDirectLeafContent can only be known once a group's ENTIRE span (including
// children that may appear before OR after its own direct content) has been
// seen, and hasNamedAncestor depends on the PARENT's hasDirectLeafContent — so
// this is computed in two passes after the initial walk, not inline during it.
function parseGroupsDepthAware(src) {
  // Match opening <g ...>, closing </g>, opening <defs>, closing </defs>
  // We need to handle multiline attributes so we use [^>]* (which includes \n in JS)
  const tagRe = /<(\/?)(?:(g)|(defs))([^>]*)>/gi;
  const gStack = [];   // stack of group records for open <g> elements
  let inDefs   = 0;
  const groups = [];
  let m;

  while ((m = tagRe.exec(src)) !== null) {
    const isClosing = m[1] === '/';
    const isG       = !!m[2];
    const isDefs    = !!m[3];
    const attrs     = m[4] || '';

    if (isDefs) {
      if (!isClosing) inDefs++;
      else            inDefs = Math.max(0, inDefs - 1);
      continue;
    }

    if (!isG) continue;
    if (inDefs > 0) continue; // ignore groups inside <defs>

    if (isClosing) {
      const open = gStack.pop();
      if (open) open.endIdx = m.index + m[0].length;
    } else {
      const idMatch = attrs.match(/\bid="([^"]+)"/);
      const id      = idMatch ? idMatch[1] : null;
      // Illustrator writes data-name="<original typed layer name>" whenever it had to
      // auto-rename the exported id to dodge a collision with a name already used
      // elsewhere in the file (see RENAMED_DUPLICATE check below). When present and
      // different from id, this is Illustrator's own breadcrumb pointing at a real,
      // findable duplicate layer. Checked across this project's full Frame_01–28 batch:
      // every plain "_x5F_" id (below) has NO such breadcrumb — there is no second layer
      // anywhere with a matching name to find. _x5F_ ids are a different, wider failure:
      // they consistently land on objects built by duplicating one named instance and
      // renaming each copy (fish_1→fish_9, pipe_1→pipe_3, even a duplicated artboard
      // wrapper) — Illustrator's id generator keeps an internal link to the original
      // object through that duplication and escapes every copy, even though every name
      // typed in the Layers panel is genuinely unique. Don't go looking for a duplicate.
      const dataNameMatch = attrs.match(/\bdata-name="([^"]+)"/);
      const dataName      = dataNameMatch ? dataNameMatch[1] : null;
      const record = {
        id, dataName, depth: gStack.length, startIdx: m.index, endIdx: null,
        parent: gStack.length > 0 ? gStack[gStack.length - 1] : null,
        hasDirectLeafContent: false, hasNamedAncestor: false, // resolved below
      };
      groups.push(record);
      gStack.push(record);
    }
  }

  // Pass 1: hasDirectLeafContent — independent per group, any order is fine.
  // Illustrator routinely wraps even simple content in an extra anonymous
  // <g> (e.g. <g id="icon_1"><g><path/></g></g>), so "direct child only"
  // is too strict — almost no real content group would qualify. Instead, a
  // leaf tag counts as THIS group's own content unless it falls inside one
  // of this group's NAMED descendants (any depth) — unnamed wrapper
  // sub-groups are transparent and don't claim ownership of anything.
  const LEAF_RE = /<(path|rect|circle|ellipse|line|polyline|polygon|text|image|use)\b/gi;
  for (const g of groups) {
    if (g.endIdx == null) continue; // unterminated/malformed — leave as false
    const namedDescendants = groups.filter(c =>
      c !== g && c.id !== null && c.startIdx > g.startIdx && c.endIdx !== null && c.endIdx <= g.endIdx
    );
    let mm;
    LEAF_RE.lastIndex = g.startIdx;
    while ((mm = LEAF_RE.exec(src)) !== null) {
      if (mm.index >= g.endIdx) break;
      const ownedByNamedDescendant = namedDescendants.some(c => mm.index >= c.startIdx && mm.index < c.endIdx);
      if (!ownedByNamedDescendant) { g.hasDirectLeafContent = true; break; }
    }
  }

  // Pass 2: hasNamedAncestor — groups is already in document/creation order
  // (a group is always pushed before any of its descendants), so by the time
  // we reach a group here, its parent's hasNamedAncestor is already final.
  for (const g of groups) {
    if (!g.parent) { g.hasNamedAncestor = false; continue; }
    const parentGrantsExemption = g.parent.id !== null && g.parent.hasDirectLeafContent;
    g.hasNamedAncestor = g.parent.hasNamedAncestor || parentGrantsExemption;
  }

  return groups;
}

// ─── Outlined-text-in-a-generic-group heuristic ───────────────────────────────
// See extras/SVG-Naming-Convention.md for the full rationale. Short version: a
// top-level group with several unnamed <path> children and NO internal sub-grouping
// is structurally ambiguous between "a multi-part icon" and "outlined text where
// every letter became its own anonymous path." The distinguishing signal we can
// compute without full path geometry: outlined text is almost always rendered in
// ONE fill color (1-2 distinct classes), while icon illustrations use several
// (different parts, gradients, shadows). Combined with a minimum path count, this
// catches the icon_text_1-style failure without flagging legitimate multi-path icons.
const OUTLINED_TEXT_MIN_PATHS       = 4;   // below this, could be anything — don't flag
const OUTLINED_TEXT_MAX_FILL_CLASSES = 2;  // icons commonly use 3+; text rarely does
const OUTLINED_TEXT_BUNDLE_PATH_WARNING = 20; // even a text-named group this big may bundle multiple lines
const OUTLINED_TEXT_ROW_ASPECT_MAX = 0.35; // ySpread/xSpread below this ≈ "lies along one row"

// "Monochrome + several unnamed paths" alone false-positives hard on legitimate
// single-color icon clusters (particle groups, sparkle/glow effects, gear teeth) —
// this art style uses plenty of those. The second, more specific signal: letters in
// a word share a baseline, so their starting points line up in a tight horizontal
// row (small y-spread relative to x-spread). A 2D-scattered decorative cluster
// (particles, sparkles) or a vertically-stacked icon won't pass this. Requiring
// BOTH signals together is what keeps this usably precise.
function getPathFirstPoints(span) {
  const pathRe = /<path\b[^>]*\bd="([^"]+)"/gi;
  const points = [];
  let m;
  while ((m = pathRe.exec(span)) !== null) {
    const mm = m[1].match(/[Mm]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/);
    if (mm) points.push({ x: parseFloat(mm[1]), y: parseFloat(mm[2]) });
  }
  return points;
}

function looksRowAligned(points) {
  if (points.length < 3) return false;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  if (xSpread <= 0) return false;
  return (ySpread / xSpread) < OUTLINED_TEXT_ROW_ASPECT_MAX;
}

function checkOutlinedText(src, topNamedGroups) {
  const findings = { possibleOutlinedText: [], possibleBundledText: [] };

  for (const g of topNamedGroups) {
    if (g.endIdx == null) continue; // unterminated/malformed — skip rather than guess
    if (DECORATIVE_CLUSTER_ID_RE.test(g.id)) continue;
    const span = src.slice(g.startIdx, g.endIdx);

    const pathCount = (span.match(/<path\b/gi) || []).length;
    if (pathCount < OUTLINED_TEXT_MIN_PATHS) continue;

    // Nested named subgroups (other than this group's own opening tag) mean the
    // asset already has internal structure — lower risk, don't flag.
    const idGroupMatches = (span.match(/<g\b[^>]*\bid="/gi) || []).length;
    const nestedNamedGroups = Math.max(0, idGroupMatches - 1);
    if (nestedNamedGroups > 0) continue;

    const fillClasses = new Set((span.match(/\bclass="([^"]+)"/gi) || []).map(s => s.toLowerCase()));
    const looksMonochrome = fillClasses.size <= OUTLINED_TEXT_MAX_FILL_CLASSES;
    if (!looksMonochrome) continue;

    // Text-ish-named groups skip the row-alignment gate for the bundling check
    // below (a text group spanning multiple lines won't be row-aligned either —
    // that's fine, we still want to warn about it). Non-text-named groups need
    // BOTH signals before we accuse them of being outlined text.
    if (!TEXT_ISH_ID_RE.test(g.id) && !looksRowAligned(getPathFirstPoints(span))) continue;

    if (!TEXT_ISH_ID_RE.test(g.id)) {
      findings.possibleOutlinedText.push(
        `"${g.id}" — ${pathCount} unnamed same-color path(s), no internal sub-grouping, ` +
        `and a name that doesn't say "text". Classic outlined-text signature (see ` +
        `SVG-Naming-Convention.md) — open it and check: if this is outlined text, rename ` +
        `to "text_<content-slug>" and confirm Claude Code can tell what it says.`
      );
    } else if (pathCount >= OUTLINED_TEXT_BUNDLE_PATH_WARNING) {
      findings.possibleBundledText.push(
        `"${g.id}" — ${pathCount} paths, no internal sub-grouping. If this spans more than ` +
        `one line, it can only be revealed as one all-or-nothing block, not a per-line ` +
        `typewriter (see scene-26's box_2_text_3 in SVG-Content-Issues.md for the cost of ` +
        `this). Split into one group per line if independent timing is needed.`
      );
    }
  }

  return findings;
}

// ─── Bundled-composite-icon size signal ────────────────────────────────────────
// Not a standalone detector — a vague name ("group", "element") is already
// flagged on its own. This just makes that warning actionable: a vague name
// wrapping a LARGE, color-diverse subtree is a strong sign it bundles several
// distinct motifs (a ring + waves + several microorganisms, say) into one
// group, instead of giving each independently-animatable part its own
// top-level id the way this file's OTHER icons already correctly do (see
// Frame_02.svg's icon_3 → species_1/2/3, icon_4 → icon_4_waves/_plant_1/_2 as
// the worked example — icon_1's whole equivalent bundle is literally named
// "group"). High path/sub-group count alone isn't suspicious (a single
// complex rigid icon, or a ring built from many dash segments, can have
// plenty of paths in ONE color) — color diversity is what distinguishes
// "one rigid multi-path shape" from "several different colored things
// stuffed under one name." This still can't tell you WHICH parts need
// independent animation — that's a judgment call against the reference
// video — it just flags "this is worth opening and checking."
const BUNDLE_NOTABLE_MIN_NESTED_GROUPS = 10;
const BUNDLE_NOTABLE_MIN_PATHS         = 30;
const BUNDLE_NOTABLE_MIN_FILL_CLASSES  = 4;

function describeBundleSize(src, grp) {
  if (grp.endIdx == null) return "";
  const span = src.slice(grp.startIdx, grp.endIdx);
  const nestedGroups = (span.match(/<g\b/gi) || []).length - 1; // exclude self
  const pathCount = (span.match(/<path\b/gi) || []).length;
  const fillClasses = new Set((span.match(/\bclass="([^"]+)"/gi) || []).map(s => s.toLowerCase()));

  const isLarge = nestedGroups >= BUNDLE_NOTABLE_MIN_NESTED_GROUPS || pathCount >= BUNDLE_NOTABLE_MIN_PATHS;
  if (!isLarge || fillClasses.size < BUNDLE_NOTABLE_MIN_FILL_CLASSES) return "";

  return ` — ${nestedGroups} nested sub-groups, ${pathCount} paths, ${fillClasses.size} distinct colors: ` +
    `likely bundles multiple motifs (e.g. a ring + waves + several organisms) into one name. ` +
    `If any part needs independent animation, give it its own top-level id instead of nesting it here.`;
}

// ─── Two-sentence feedback synthesizer ─────────────────────────────────────────
// One headline an illustrator can act on without reading the full report.
// Sentence 1 names the single most severe issue category present (in priority
// order — a file with 5 problems gets told about the worst one, not all 5).
// Sentence 2 is the concrete action to take. If more than one category is
// present, a short tail notes how many others are listed below.
function generateFeedback(ctx) {
  const categoriesPresent = [
    ctx.unnamedGroupsOver,
    ctx.x5fCount > 0,
    ctx.renamedDuplicateCount > 0,
    ctx.contentFreeCount > 0,
    ctx.duplicateCount > 0,
    ctx.rawLayerCount > 0,
    ctx.outlinedTextCount > 0,
    (ctx.vagueCount + ctx.collectiveCount) > 0,
    ctx.bundledTextCount > 0,
    ctx.gradientOver || ctx.sizeOver,
    ctx.filterCount > 0,
    ctx.imageCount > 0,
  ].filter(Boolean).length;
  const others = categoriesPresent > 1 ? ` (${categoriesPresent - 1} more issue${categoriesPresent > 2 ? "s" : ""} listed below.)` : "";

  let s1, s2;

  if (ctx.unnamedGroupsOver) {
    s1 = `${ctx.unnamedTopCount} of ${ctx.topGroupsCount} top-level groups (${ctx.unnamedTopPct}%) have no id at all — these elements cannot be selected or animated in any way.`;
    s2 = `Open the Layers panel and name every one of them before this file can be used.`;
  } else if (ctx.x5fCount > 0) {
    s1 = `${ctx.x5fCount} id(s) are corrupted by Illustrator's "_x5F_" escape encoding, so a selector written against the clean name (e.g. "wave_1") silently fails.`;
    s2 = `Your layer names are very likely already fine — don't go searching the Layers panel for a matching duplicate, in this project's files there usually isn't one to find (no "data-name" breadcrumb, which is what Illustrator leaves when it CAN point at a real collision). This instead hits objects built by duplicating one named instance and renaming each copy (fish_1→fish_9, pipe_1→pipe_3, even a duplicated artboard) — Illustrator's id generator keeps an internal link to the original through that duplication and escapes every copy. Fix: rebuild the affected instances without Alt/Option-drag-duplicating a named original (draw fresh, or ungroup+regroup to break the link) and re-export.`;
  } else if (ctx.renamedDuplicateCount > 0) {
    s1 = `${ctx.renamedDuplicateCount} id(s) were silently auto-renamed by Illustrator because their original name collided with another layer elsewhere in the file (confirmed — Illustrator left a "data-name" breadcrumb pointing at the original), shown as a bare extra digit (e.g. "character1" used twice becomes "character1" and "character11"). Unlike the plain _x5F_ check above, this one only fires when a real duplicate IS findable.`;
    s2 = `Open each layer named in the list below, find the OTHER layer using that exact same name, and rename one of them to something distinct and descriptive (per SVG-Naming-Convention.md) before re-exporting.`;
  } else if (ctx.contentFreeCount > 0) {
    s1 = `${ctx.contentFreeCount} id(s) carry zero role or content information — bare ordinals/number-words ("first", "twentynine"), single letters with no instance digit ("a", "n"), or a chain of truncated/extended duplicates of the same bare name ("n"→"nu"→"number").`;
    s2 = `These usually mean one bare name (e.g. "wave" or "number") was reused for every instance instead of being indexed ("wave_1", "number_1") — rename each one in the Layers panel to its actual role + instance, then re-export.`;
  } else if (ctx.duplicateCount > 0) {
    s1 = `${ctx.duplicateCount} id(s) are duplicated, so only the first occurrence of each is reachable in code — every other copy can't be animated.`;
    s2 = `Give each one a unique name before re-exporting.`;
  } else if (ctx.rawLayerCount > 0) {
    s1 = `${ctx.rawLayerCount} group(s) still have Illustrator's default "Layer N" name instead of a real one.`;
    s2 = `Rename them in the Layers panel to describe what they actually are.`;
  } else if (ctx.outlinedTextCount > 0) {
    s1 = `${ctx.outlinedTextCount} group(s) look like outlined text (several same-color, row-aligned paths) hiding behind a name that doesn't say "text" — the reveal animation this needs can't be applied correctly.`;
    s2 = `Open each one, confirm whether it's text, and rename it "text_<content-slug>" if so.`;
  } else if (ctx.vagueCount + ctx.collectiveCount > 0) {
    s1 = `${ctx.vagueCount + ctx.collectiveCount} group(s) have names that don't identify their specific content (a bare category word, or a collective name covering several bundled parts) — it's unclear what they are or whether they need independent animation.`;
    s2 = `Rename each to describe its specific content, and split any bundle of independently-moving parts (rings, waves, organisms, etc.) into its own top-level id per part.`;
  } else if (ctx.bundledTextCount > 0) {
    s1 = `${ctx.bundledTextCount} text group(s) bundle multiple lines or rows into one block with no internal sub-grouping, so they can only fade in all at once instead of revealing line-by-line.`;
    s2 = `Split each into one group per line (or per row) if independent timing matters for that text.`;
  } else if (ctx.gradientOver || ctx.sizeOver) {
    s1 = `This file is structurally clean, but ${ctx.gradientOver ? `${ctx.gradientCount} gradients (over the ${ctx.gradientLimit} guideline)` : `${ctx.sizeKB} KB (over the ${ctx.sizeLimit} KB guideline)`} will slow down rendering.`;
    s2 = `Not blocking for animation — consider deduplicating gradients or simplifying fills if render time becomes a problem.`;
  } else if (ctx.filterCount > 0) {
    s1 = `This file is structurally clean, but has ${ctx.filterCount} SVG filter element(s) (drop shadows) that may not render the same way in Remotion's headless Chromium.`;
    s2 = `Not blocking — just render a test frame before assuming the shadow shows up.`;
  } else if (ctx.imageCount > 0) {
    s1 = `This file is structurally clean, but has ${ctx.imageCount} embedded <image> element(s) left over from a previous export.`;
    s2 = `Confirm each is intentional and base64-embedded, or remove it if it's dead weight.`;
  } else {
    s1 = `This file is clean — every top-level group has a clear, specific name and no structural ambiguity was found.`;
    s2 = `It's ready to animate exactly as exported, no further changes needed.`;
  }

  return `${s1} ${s2}${others}`;
}

// ─── Full parser ──────────────────────────────────────────────────────────────
function parse(src) {
  const groups = parseGroupsDepthAware(src);
  const result = {
    groups,
    elements     : {},
    allIds       : [],
    linearGrads  : 0,
    radialGrads  : 0,
    clipPaths    : 0,
    filters      : 0,
    images       : 0,
    inlineStyles : 0,
    classAttrs   : 0,
    textElements : 0,
  };

  const idRe = /\bid="([^"]+)"/g;
  let m;
  while ((m = idRe.exec(src)) !== null) result.allIds.push(m[1]);

  const elRe = /<(path|rect|circle|ellipse|line|polyline|polygon|text|image|use)\b/gi;
  while ((m = elRe.exec(src)) !== null) {
    const tag = m[1].toLowerCase();
    result.elements[tag] = (result.elements[tag] || 0) + 1;
  }

  result.linearGrads  = (src.match(/<linearGradient\b/gi)  || []).length;
  result.radialGrads  = (src.match(/<radialGradient\b/gi)  || []).length;
  result.clipPaths    = (src.match(/<clipPath\b/gi)         || []).length;
  result.filters      = (src.match(/<filter\b/gi)          || []).length;
  result.images       = (src.match(/<image\b/gi)           || []).length;
  result.inlineStyles = (src.match(/\bstyle="/gi)          || []).length;
  result.classAttrs   = (src.match(/\bclass="/gi)          || []).length;
  result.textElements = (src.match(/<text\b/gi)            || []).length;

  return result;
}

// ─── Validator ────────────────────────────────────────────────────────────────
function validate(filePath) {
  const filename = path.basename(filePath);
  const stat     = fs.statSync(filePath);
  const sizeKB   = Math.round(stat.size / 1024);
  const src      = fs.readFileSync(filePath, "utf8");
  const p        = parse(src);

  const errors   = [];
  const warnings = [];
  const info     = [];

  // ── 1. File size ────────────────────────────────────────────────────────────
  if (sizeKB > RULES.MAX_FILE_SIZE_KB) {
    warnings.push(
      `File is ${sizeKB} KB (limit ${RULES.MAX_FILE_SIZE_KB} KB) — likely gradient bloat; run SVGO or deduplicate gradients`
    );
  }

  // ── 2. Unnamed top-level groups ─────────────────────────────────────────────
  // Only groups with NO named ancestor must have an id.
  // Unnamed groups inside a named parent (body parts, strokes, sub-shapes) are exempt.
  const topGroups      = p.groups.filter(g => !g.hasNamedAncestor);
  const childGroups    = p.groups.filter(g => g.hasNamedAncestor);
  const namedTop       = topGroups.filter(g => g.id);
  const unnamedTop     = topGroups.filter(g => !g.id);
  const unnamedTopPct  = topGroups.length > 0
    ? Math.round((unnamedTop.length / topGroups.length) * 100)
    : 0;

  if (unnamedTopPct > RULES.MAX_ORPHANED_UNNAMED_PCT) {
    errors.push(
      `${unnamedTopPct}% of top-level groups have no id (${unnamedTop.length}/${topGroups.length}) — limit is ${RULES.MAX_ORPHANED_UNNAMED_PCT}%.\n` +
      `      Name every animatable group in the Layers panel.\n` +
      `      (${childGroups.length} child groups inside named parents are exempt — they don't need ids)`
    );
  }

  // ── 3. ID quality checks ────────────────────────────────────────────────────
  const namedGroupIds = p.groups.filter(g => g.id).map(g => g.id);
  const utilityIds    = [];
  const invalidIds    = [];
  const pascalIds     = [];
  const rawLayerIds   = [];
  const typoIds       = [];
  const numericIds    = [];
  const x5fIds        = [];
  const duplicateIds  = [];
  const vagueNameIds  = [];
  const collectiveNameIds = [];
  const renamedDuplicateIds = [];

  const idCounts = {};
  for (const id of p.allIds) idCounts[id] = (idCounts[id] || 0) + 1;
  for (const [id, count] of Object.entries(idCounts)) {
    if (count > 1) duplicateIds.push(`"${id}" (×${count})`);
  }

  // Illustrator auto-disambiguates a colliding name by appending a bare digit to the
  // END of it (no separator) — "character1" reused on a nested layer becomes
  // "character11", with data-name="character1" left behind as proof of the original
  // name it collided with. This check only fires when that data-name breadcrumb is
  // present, i.e. when there IS a real, findable duplicate layer — different from the
  // plain x5F check below, which fires on ids with no such breadcrumb (no real
  // duplicate to find; see the comment on that check for the actual cause).
  for (const grp of p.groups.filter(g => g.id && g.dataName && g.dataName !== g.id)) {
    renamedDuplicateIds.push(`"${grp.id}" — Illustrator renamed this from "${grp.dataName}" because that name was already used by another layer elsewhere in the file (often a parent/ancestor layer, or another instance entirely). Find the other layer named "${grp.dataName}" and give ONE of them a distinct, descriptive name.`);
  }

  for (const grp of p.groups.filter(g => g.id)) {
    const id = grp.id;
    if (UTILITY_ID_PATTERNS.some(re => re.test(id))) { utilityIds.push(`"${id}"`); continue; }
    if (id.includes("_x5F_")) { x5fIds.push(`"${id}" → should be "${id.replace(/_x5F_/g, "_")}"`); continue; }
    if (/^[_\d]/.test(id))   { numericIds.push(`"${id}"`); continue; }
    if (RAW_LAYER_RE.test(id)) { rawLayerIds.push(`"${id}"`); continue; }
    if (VAGUE_GENERIC_NAME_RE.test(id)) { vagueNameIds.push(`"${id}"${describeBundleSize(src, grp)}`); }
    if (!VAGUE_GENERIC_NAME_RE.test(id) && COLLECTIVE_PLURAL_ID_RE.test(id) && !isWellFormedCategoryGroup(p.groups, grp)) {
      const bundleDesc = describeBundleSize(src, grp);
      if (bundleDesc) collectiveNameIds.push(`"${id}"${bundleDesc}`);
    }
    if (PASCAL_RE.test(id))  { pascalIds.push(`"${id}" → should be "${id.toLowerCase()}"`); }
    for (const [typo, fix] of Object.entries(KNOWN_TYPOS)) {
      if (id.toLowerCase().includes(typo))
        typoIds.push(`"${id}" → "${id.toLowerCase().replace(typo, fix)}"`);
    }
    if (!VALID_ID_RE.test(id) && !PASCAL_RE.test(id) && !/^[_\d]/.test(id))
      invalidIds.push(`"${id}"`);
  }

  // ── Content-free ids: ordinals, number words, bare letters, mutation chains ──
  // Top-level only — a child id like "c1" inside a named parent is exempt by the
  // same two-tier model as everything else (skills/svg-depth-rules.md).
  const numberWordIds  = namedTop.filter(g => NUMBER_WORD_ID_RE.test(g.id)).map(g => `"${g.id}"`);
  const ordinalWordIds = namedTop.filter(g => ORDINAL_WORD_ID_RE.test(g.id)).map(g => `"${g.id}"`);
  const bareLetterIds  = namedTop.filter(g => BARE_LETTER_ID_RE.test(g.id)).map(g => `"${g.id}"`);
  const prefixChains   = findPrefixChains(namedTop.map(g => g.id));

  if (x5fIds.length)     errors.push(`_x5F_ encoded IDs (a clean-name selector like "#wave_1" will return null) — NOT a sign of a findable duplicate layer name (no "data-name" breadcrumb on any of these), and NOT caused by spaces or slashes in the name. Almost always comes from duplicating a named object to make siblings and renaming each copy (fish_1→fish_9, pipe_1→pipe_3, even a duplicated artboard) — Illustrator keeps an internal link to the original through the duplication and escapes every copy. Rebuild without Alt/Option-drag-duplicating a named original, or ungroup+regroup to break the link, then re-export:\n      ${x5fIds.join("\n      ")}`);
  if (renamedDuplicateIds.length) errors.push(
    `Renamed due to a duplicate layer name elsewhere in the file (Illustrator auto-disambiguated; confirmed via its "data-name" breadcrumb, so a real duplicate IS findable here — unlike the plain _x5F_ ids above):\n      ` +
    renamedDuplicateIds.join("\n      ")
  );
  if (numericIds.length)  errors.push(`IDs starting with digit or underscore (crash JS selectors):\n      ${numericIds.join(", ")}`);
  if (rawLayerIds.length) errors.push(`Raw Illustrator layer names (rename in Layers panel):\n      ${rawLayerIds.join(", ")}`);
  if (pascalIds.length)   errors.push(`IDs with uppercase letters (standardise to snake_case):\n      ${pascalIds.join("\n      ")}`);
  if (typoIds.length)     errors.push(`Typos in IDs:\n      ${typoIds.join("\n      ")}`);
  if (utilityIds.length)  warnings.push(`Utility def IDs surfaced as layers (not animatable, remove from Layers panel):\n      ${utilityIds.join(", ")}`);
  if (invalidIds.length)  warnings.push(`Non-standard ID characters:\n      ${invalidIds.join(", ")}`);
  if (duplicateIds.length) errors.push(`Duplicate IDs (only first will be reachable in JS):\n      ${duplicateIds.join(", ")}`);
  if (numberWordIds.length || ordinalWordIds.length) errors.push(
    `Number-word / ordinal-word ids — these identify POSITION, not role or content, so Claude Code has no way to know what the group actually is (e.g. "twentynine" could be a table row, a wave band, anything):\n      ` +
    [...numberWordIds, ...ordinalWordIds].join(", ")
  );
  if (bareLetterIds.length) errors.push(`Bare 1–2 letter ids with no instance digit (this project's real short-id convention always ends in a digit, e.g. "c1"/"t2" — these don't):\n      ${bareLetterIds.join(", ")}`);
  // Warning, not error: unlike the number-word/bare-letter checks above (exact
  // string matches against a known list), this is inferred from string shape —
  // "hand"/"handline" or "dot"/"dots" could legitimately be two distinct,
  // intentional ids that just happen to share a prefix. Same confidence tier as
  // the outlined-text heuristic below: flag for a human look, don't block on it.
  if (prefixChains.length) warnings.push(
    `Possible duplicate-name mutation chain — Illustrator's OTHER way of disambiguating a colliding bare name besides _x5F_ escaping is silently truncating/extending one copy per collision (e.g. "n"→"nu"→"num"→"number", or "wav"→"wavv"→"wavvv"). Each group below MAY be the SAME intended name repeated without an instance suffix — open the file and check; if so, rename to a real instance id (number_1, wave_1...) and re-export:\n      ` +
    prefixChains.map(g => g.join(" → ")).join("\n      ")
  );
  if (vagueNameIds.length) warnings.push(
    `Vague names — a category word plus a bare index, no content/role specifics ` +
    `(see SVG-Naming-Convention.md's "icon_text_1" example):\n      ${vagueNameIds.join("\n      ")}`
  );
  if (collectiveNameIds.length) warnings.push(
    `Collectively-named groups — the name describes a category but not an individual instance, ` +
    `and the group is large/color-diverse enough that it likely bundles several distinct elements:\n      ` +
    collectiveNameIds.join("\n      ")
  );

  // ── 3b. Outlined text trapped in a generic group ────────────────────────────
  // See extras/SVG-Naming-Convention.md. A group can pass every check above (it
  // has a valid, unique, lowercase id) and still be unusable — if it's outlined
  // text named like an icon, Claude Code can't tell it's text or what it says.
  // This is a warning, not an error: unlike the deterministic checks above
  // (x5F encoding, duplicate ids), this is inferred from geometry + color, not
  // certain. It will occasionally flag a legitimate icon — that's an acceptable
  // false-positive rate for "go look at this," not grounds to block the file.
  const outlinedTextFindings = checkOutlinedText(src, namedTop);
  if (outlinedTextFindings.possibleOutlinedText.length) {
    warnings.push(
      `Possible outlined text in a non-text-named group (see SVG-Naming-Convention.md):\n      ` +
      outlinedTextFindings.possibleOutlinedText.join("\n      ")
    );
  }
  if (outlinedTextFindings.possibleBundledText.length) {
    warnings.push(
      `Possible multi-line text bundled into one group:\n      ` +
      outlinedTextFindings.possibleBundledText.join("\n      ")
    );
  }

  // ── 4. Gradient count ───────────────────────────────────────────────────────
  const totalGrads = p.linearGrads + p.radialGrads;
  if (totalGrads > RULES.MAX_GRADIENTS) {
    warnings.push(
      `${totalGrads} gradients (${p.linearGrads} linear + ${p.radialGrads} radial) — ` +
      `above ${RULES.MAX_GRADIENTS} limit; run gradient deduplication before Remotion render`
    );
  }

  // ── 5. Filters ──────────────────────────────────────────────────────────────
  if (p.filters > 0) {
    warnings.push(
      `${p.filters} SVG <filter> element(s) — feDropShadow may not render in Remotion headless Chromium; test before full render`
    );
  }

  // ── 6. Embedded images ──────────────────────────────────────────────────────
  if (p.images > 0) {
    warnings.push(
      `${p.images} <image> element(s) — verify each is base64-embedded; external href paths will break in Remotion bundler`
    );
  }

  // ── 7. Styling method ───────────────────────────────────────────────────────
  if (p.classAttrs > 0 && p.inlineStyles === 0) {
    info.push(`All ${p.classAttrs} style declarations are class-based (cls-*) — CSS class map must be preserved in Remotion`);
  }

  // ── 8. Text / heading layer (info only) ────────────────────────────────────
  const hasTextLayer = namedGroupIds.some(id => /^(?:h[12]|text)/i.test(id));
  if (!hasTextLayer) {
    info.push(`No text or heading layer found (h1, h2, text_*) — verify this scene has no narration text`);
  }

  // ── 9. Sequential gap detection ─────────────────────────────────────────────
  // Ids Illustrator auto-renamed due to a name collision (data-name !== id) are
  // disambiguation artifacts, not a deliberate numbered series — "character1" +
  // "character11" is not "items 1 through 11 with one missing", it's the same bug
  // the renamedDuplicateIds check above already reports. Excluding them here stops
  // them from also generating a wall of unrelated "sequence gap" noise.
  const renamedIdSet = new Set(p.groups.filter(g => g.id && g.dataName && g.dataName !== g.id).map(g => g.id));
  const families = {};
  for (const id of namedGroupIds) {
    if (renamedIdSet.has(id)) continue;
    const m = id.match(/^([a-z][a-z_]*)(\d+)$/);
    if (m) {
      const [, prefix, num] = m;
      if (!families[prefix]) families[prefix] = [];
      families[prefix].push(parseInt(num, 10));
    }
  }
  for (const [prefix, nums] of Object.entries(families)) {
    if (nums.length < 2) continue;
    nums.sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] - nums[i] > 1) {
        for (let gap = nums[i] + 1; gap < nums[i + 1]; gap++) {
          warnings.push(`Sequence gap: "${prefix}${gap}" is missing (have ${prefix}${nums[i]} and ${prefix}${nums[i + 1]})`);
        }
      }
    }
  }

  // ── Scoring ─────────────────────────────────────────────────────────────────
  let score;
  if      (errors.length === 0 && warnings.length === 0) score = "Excellent";
  else if (errors.length === 0 && warnings.length <= 2)  score = "Good";
  else if (errors.length <= 2  && warnings.length <= 4)  score = "Fair";
  else                                                    score = "Poor";

  // "Ready" used to mean "zero hard errors" — but that let files like
  // Frame_02.svg (zero errors, but a 157-path icon dumped under the name
  // "group") show as passing when they clearly weren't ready to animate.
  // Ready now means fully clean: zero errors AND zero warnings, same bar as
  // "Excellent". A file with any warning needs a human look before handoff.
  const ready = errors.length === 0 && warnings.length === 0;

  const feedback = generateFeedback({
    unnamedGroupsOver: unnamedTopPct > RULES.MAX_ORPHANED_UNNAMED_PCT,
    unnamedTopCount: unnamedTop.length, topGroupsCount: topGroups.length, unnamedTopPct,
    x5fCount: x5fIds.length, renamedDuplicateCount: renamedDuplicateIds.length,
    contentFreeCount: numberWordIds.length + ordinalWordIds.length + bareLetterIds.length,
    duplicateCount: duplicateIds.length, rawLayerCount: rawLayerIds.length,
    outlinedTextCount: outlinedTextFindings.possibleOutlinedText.length,
    vagueCount: vagueNameIds.length, collectiveCount: collectiveNameIds.length,
    bundledTextCount: outlinedTextFindings.possibleBundledText.length,
    gradientOver: totalGrads > RULES.MAX_GRADIENTS, gradientCount: totalGrads, gradientLimit: RULES.MAX_GRADIENTS,
    sizeOver: sizeKB > RULES.MAX_FILE_SIZE_KB, sizeKB, sizeLimit: RULES.MAX_FILE_SIZE_KB,
    filterCount: p.filters, imageCount: p.images,
  });

  return {
    filename, sizeKB, p, errors, warnings, info, score, ready, feedback,
    totalGroups  : p.groups.length,
    topGroups    : topGroups.length,
    namedTop     : namedTop.length,
    unnamedTop   : unnamedTop.length,
    childGroups  : childGroups.length,
    unnamedTopPct,
  };
}

// ─── Reporter ─────────────────────────────────────────────────────────────────
const C = {
  reset  : "\x1b[0m",
  bold   : "\x1b[1m",
  error  : "\x1b[94m",
  green  : "\x1b[32m",
  yellow : "\x1b[33m",
  cyan   : "\x1b[36m",
  grey   : "\x1b[90m",
};

function colorScore(score) {
  return (score === "Excellent" || score === "Good")
    ? C.green + score + C.reset
    : score === "Fair"
    ? C.yellow + score + C.reset
    : C.error + score + C.reset;
}

function report(r) {
  const totalEls = Object.values(r.p.elements).reduce((a, b) => a + b, 0);
  const elBreakdown = Object.entries(r.p.elements)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}s`)
    .join(", ");
  const readyStr = r.ready
    ? C.green + "✅  YES" + C.reset
    : C.error   + "❌  NO"  + C.reset;

  console.log("\n" + C.bold + "━".repeat(68) + C.reset);
  console.log(C.bold + C.cyan + r.filename + C.reset);
  console.log("━".repeat(68));
  console.log(`  File size                : ${r.sizeKB} KB`);
  console.log(`  Total <g> groups         : ${r.totalGroups}`);
  console.log(`  ├─ Top-level groups      : ${r.topGroups}  (named: ${r.namedTop} / unnamed: ${r.unnamedTop} — ${r.unnamedTopPct}%)`);
  console.log(`  └─ Child groups (exempt) : ${r.childGroups}  (inside named parents — no id required)`);
  console.log(`  Total elements           : ${totalEls}  (${elBreakdown})`);
  console.log(`  Gradients                : ${r.p.linearGrads} linear + ${r.p.radialGrads} radial = ${r.p.linearGrads + r.p.radialGrads}`);
  console.log(`  Clip paths               : ${r.p.clipPaths}   Filters: ${r.p.filters}   Images: ${r.p.images}`);
  console.log(`  Cleanliness              : ${colorScore(r.score)}`);
  console.log(`  Ready for Claude Code    : ${readyStr}`);

  console.log("\n  " + C.bold + "Feedback:" + C.reset + " " + r.feedback);

  if (r.errors.length) {
    console.log("\n  " + C.error + C.bold + "ERRORS — must fix before Claude Code:" + C.reset);
    r.errors.forEach(e => console.log("  " + C.error + "✗ " + C.reset + e));
  }
  if (r.warnings.length) {
    console.log("\n  " + C.yellow + C.bold + "WARNINGS — should fix:" + C.reset);
    r.warnings.forEach(w => console.log("  " + C.yellow + "⚠ " + C.reset + w));
  }
  if (r.info.length) {
    console.log("\n  " + C.grey + C.bold + "INFO:" + C.reset);
    r.info.forEach(i => console.log("  " + C.grey + "ℹ " + C.reset + i));
  }
  if (r.errors.length === 0 && r.warnings.length === 0) {
    console.log("\n  " + C.green + "✓ All checks passed — file is clean." + C.reset);
  }
}

// ─── Summary table ────────────────────────────────────────────────────────────
function summary(results) {
  console.log("\n" + "═".repeat(68));
  console.log(C.bold + " SUMMARY" + C.reset);
  console.log("═".repeat(68));
  console.log(C.bold + " File".padEnd(24) + "Score".padEnd(12) + "Ready".padEnd(8) + "Errors".padEnd(8) + "Warnings" + C.reset);
  console.log("─".repeat(68));
  for (const r of results) {
    const name  = r.filename.padEnd(23);
    const score = r.score.padEnd(11);
    const ready = (r.ready ? "YES" : "NO").padEnd(7);
    const errs  = String(r.errors.length).padEnd(7);
    const warns = String(r.warnings.length);
    const line  = ` ${name} ${score} ${ready} ${errs} ${warns}`;
    console.log((r.ready ? C.green : C.error) + line + C.reset);
  }
  console.log("─".repeat(68));
  const passed = results.filter(r => r.ready).length;
  const failed = results.length - passed;
  const pct = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;
  console.log(
    ` ${results.length} file(s) checked — ` +
    C.green + `${passed} ready (${pct}%)` + C.reset + " — " +
    (failed > 0 ? C.error : C.green) + `${failed} not ready` + C.reset
  );
  console.log(
    ` ` + C.bold + `"Ready" now means zero errors AND zero warnings` + C.reset +
    ` — a file with even one warning needs a look before handoff.`
  );
  console.log("═".repeat(68) + "\n");
}

// ─── Entry point ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter(a => !a.startsWith("--"));

if (args.length === 0) {
  console.error("Usage: node svg-audit.js file.svg [file2.svg ...]");
  process.exit(1);
}

const results = [];
for (const arg of args) {
  if (!fs.existsSync(arg)) { console.error(`File not found: ${arg}`); continue; }
  try {
    const r = validate(arg);
    report(r);
    results.push(r);
  } catch (err) {
    console.error(`Error processing ${arg}: ${err.message}`);
  }
}

if (results.length > 1) summary(results);

process.exit(results.some(r => !r.ready) ? 1 : 0);
