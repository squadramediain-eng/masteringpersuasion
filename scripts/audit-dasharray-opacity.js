/* eslint-disable */
// Permanent QA tool — catches a bug class that recurred across several
// scenes during the 2026-06-24 feedback pass: an element gets a
// `stroke-dasharray`/`stroke-dashoffset` draw-on rule (meant to reveal it
// progressively) but NO `opacity` rule anywhere for that same id. Dasharray
// only affects a STROKE — any fill, any child <circle>/<image> that isn't
// itself stroked, sits at full visibility from frame 0 regardless of the
// offset animation. This is exactly how scene04/06's connector-line end
// dots and scene15/21's outer outlines ended up visible "from the start"
// even though the code clearly intended a reveal.
//
// Heuristic: for every `#id { ... stroke-dasharray ... }` rule in a scene's
// style block, check whether ANY rule in the same file targeting that bare
// id (e.g. `#id { ... }`, not just `#id child { ... }`) sets `opacity`.
// Flags ones that don't. Not a full CSS-selector engine — compound
// selectors are matched by their leading `#id` token, which covers every
// case seen in this project so far.
//
// Run any time a stroke-dasharray rule is added or a scene is touched.
// Per skills/05-qa-checklist.md.
const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, '..', 'src', 'scenes');

function findStyleBlocks(source) {
  // Grab the template literal assigned to `styleBlock` (and any inline
  // `<style>` content built the same way) — good enough for this project's
  // single-styleBlock-per-scene convention.
  const blocks = [];
  const re = /styleBlock\s*=\s*`([\s\S]*?)`;/g;
  let m;
  while ((m = re.exec(source))) blocks.push(m[1]);
  return blocks;
}

// `${...}` JS template interpolations contain their own balanced braces
// (e.g. `${fadeIn(frame, 1, 2).toFixed(1)}`, or worse `${cond ? {a:1} : {}}`)
// — a naive `[^{}]*` body regex stops at the FIRST `}` it sees, which is
// usually the one closing the interpolation, not the one closing the CSS
// rule. That truncates every rule's body and silently produces garbage
// matches. Neutralize every `${...}` (brace-depth aware, so nested object
// literals inside an interpolation don't break it either) down to a single
// placeholder character first — we only need property NAMES (opacity,
// stroke-dasharray), never the interpolated values, so this is lossless
// for this audit's purposes.
function stripInterpolations(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '$' && text[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      out += 'X';
      i = j;
    } else {
      out += text[i];
      i++;
    }
  }
  return out;
}

function parseRules(styleBlock) {
  const cleaned = stripInterpolations(styleBlock);
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(cleaned))) {
    rules.push({ selector: m[1].trim(), body: m[2] });
  }
  return rules;
}

function leadingIds(selector) {
  // Selector can be a comma-separated list ("#a, #b { ... }") — return the
  // bare leading #id of each part that IS just a bare id (no descendant).
  return selector
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^#[\w-]+$/.test(s));
}

function firstIdToken(selector) {
  const m = /^#([\w-]+)/.exec(selector.trim());
  return m ? m[1] : null;
}

function audit(file, source) {
  const issues = [];
  for (const block of findStyleBlocks(source)) {
    const rules = parseRules(block);
    const bareIdHasOpacity = new Set();
    for (const r of rules) {
      if (/\bopacity\s*:/.test(r.body)) {
        for (const id of leadingIds(r.selector)) bareIdHasOpacity.add(id.slice(1));
      }
    }
    for (const r of rules) {
      if (/stroke-dasharray\s*:/.test(r.body)) {
        const id = firstIdToken(r.selector);
        if (id && !bareIdHasOpacity.has(id) && !/\bopacity\s*:/.test(r.body)) {
          issues.push({ selector: r.selector.trim() });
        }
      }
    }
  }
  return issues;
}

function main() {
  const files = fs.readdirSync(SCENES_DIR).filter((f) => /^Scene\d+\.tsx$/.test(f));
  let total = 0;
  for (const f of files) {
    const source = fs.readFileSync(path.join(SCENES_DIR, f), 'utf8');
    const issues = audit(f, source);
    if (issues.length) {
      console.log(`✗ ${f}`);
      for (const issue of issues) {
        console.log(`    "${issue.selector}" has stroke-dasharray but no opacity rule for its id anywhere in the file`);
        total++;
      }
    }
  }
  if (total === 0) {
    console.log('OK — every stroke-dasharray rule has a matching opacity rule.');
  } else {
    console.log(`\n--- ${total} potential dasharray-without-opacity issue(s) ---`);
    console.log(
      'Known false-positive source: this script only sees the TSX rules, not\n' +
      'the SVG\'s own nesting — if the flagged id sits INSIDE another element\n' +
      'that already has its own opacity rule (e.g. a ring nested inside an\n' +
      'icon group that fades in as a whole), the dasharray target is already\n' +
      'correctly hidden and this is a false positive. Confirm with a still\n' +
      'render at frame 0 (or just before the reveal\'s start frame) before\n' +
      'assuming every flag here is a real bug.'
    );
  }
}

main();
