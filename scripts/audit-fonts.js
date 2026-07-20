#!/usr/bin/env node
/**
 * audit-fonts.js — the "font & text integrity" gate.
 *
 * Encodes the three real export failures that cost days on prior projects:
 *   1. TEXT CONVERTED TO SHAPES   — Illustrator "Create Outlines" turns each glyph
 *      into a <path>. Animation by #id breaks and the font is frozen. We flag any
 *      frame that has NO live <text> at all (warning — some compare frames are
 *      legitimately text-free), and any <path>/<g> whose id looks like text.
 *   2. WRONG FONT                 — text kept live but font-family is not the locked
 *      DM Sans / DM Mono. Hard FAIL.
 *   3. DUPLICATE TITLE            — the same title string exported twice (two <text>
 *      nodes with identical content). Hard FAIL.
 *
 * Locked font: DM Sans (display/body/kicker) + DM Mono (spec captions only).
 * Exits 1 on any hard FAIL so npm run render / build is blocked by qa-review-gate.
 */
const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'scenes');
const ALLOWED = [/^dm\s*sans$/i, /^dm\s*mono$/i];

function auditFile(file, text) {
  const fails = [];
  const warns = [];

  // ── 2. font-family must be DM Sans / DM Mono ──
  const families = [...text.matchAll(/font-family\s*=\s*"([^"]+)"/g)].map((m) => m[1].trim());
  for (const fam of new Set(families)) {
    // a family string may list fallbacks: take each comma part
    const primary = fam.split(',')[0].replace(/['"]/g, '').trim();
    if (!ALLOWED.some((rx) => rx.test(primary))) {
      fails.push(`non-DM font-family "${fam}" — must be DM Sans or DM Mono`);
    }
  }

  // ── 1. text-to-shapes ──
  const textNodes = [...text.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)];
  if (textNodes.length === 0) {
    warns.push('no live <text> — confirm this frame is text-free by design (else text was outlined to shapes)');
  }
  const outlinedIds = [...text.matchAll(/\b(?:id)\s*=\s*"([^"]*\btext\b[^"]*)"/gi)]
    .map((m) => m[1])
    .filter((id) => /path|glyph|outline|char/i.test(id));
  if (outlinedIds.length) {
    warns.push(`id(s) look like outlined text: ${outlinedIds.slice(0, 4).join(', ')}`);
  }

  // ── 3. duplicate title (identical text content) ──
  const contents = textNodes
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 1);
  const seen = new Map();
  for (const c of contents) seen.set(c, (seen.get(c) || 0) + 1);
  for (const [c, n] of seen) {
    if (n > 1) fails.push(`duplicate text exported ${n}× — "${c.slice(0, 48)}" (likely a doubled title)`);
  }

  return { fails, warns };
}

function main() {
  if (!fs.existsSync(SCENES_DIR)) {
    console.log('audit-fonts: no src/assets/scenes/ dir — nothing to check.');
    process.exit(0);
  }
  const files = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.svg'));
  let hardFails = 0;

  for (const f of files.sort()) {
    const text = fs.readFileSync(path.join(SCENES_DIR, f), 'utf8');
    const { fails, warns } = auditFile(f, text);
    if (fails.length) {
      hardFails += fails.length;
      console.log(`FAIL  ${f}`);
      for (const x of fails) console.log(`        ✗ ${x}`);
    } else if (warns.length) {
      console.log(`warn  ${f}`);
    } else {
      console.log(`ok    ${f}`);
    }
    for (const x of warns) console.log(`        · ${x}`);
  }

  console.log(`\naudit-fonts: ${files.length} frames · ${hardFails} hard failure(s)`);
  process.exit(hardFails ? 1 : 0);
}

main();
