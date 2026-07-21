#!/usr/bin/env node
/* ============================================================
   dedupe-frame-text.js — remove stacked duplicate <text> from frame SVGs.

   The mp_v2 export ships some titles two or three times: byte-identical content
   at an identical transform (frame_2 alone carries "04" 3x plus six doubled card
   titles; audit-fonts counts 13 across the film). Stacked copies render heavier
   than intended, and once type-on is running each copy types on its own schedule
   and they ghost through one another.

   Matching is exact — same normalised text content AND same transform attribute —
   so this can never merge two genuinely different labels that happen to read the
   same. Anything less certain is left alone and reported.

   Usage:
     node scripts/dedupe-frame-text.js            report only
     node scripts/dedupe-frame-text.js --write    rewrite the SVGs in place
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');
const WRITE = process.argv.includes('--write');

let totalRemoved = 0;
const perFile = [];

for (const file of fs.readdirSync(SCENES).filter((f) => f.endsWith('.svg')).sort()) {
  const p = path.join(SCENES, file);
  let svg = fs.readFileSync(p, 'utf8');

  // Collect <text>…</text> spans with their offsets, last-to-first so removing one
  // never shifts the offsets of those still to be removed.
  const spans = [];
  const re = /<text\b[^>]*>[\s\S]*?<\/text>/g;
  let m;
  while ((m = re.exec(svg))) spans.push({ start: m.index, end: m.index + m[0].length, raw: m[0] });

  const seen = new Set();
  const dupes = [];
  for (const s of spans) {
    const content = s.raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const tr = (/transform="([^"]*)"/.exec(s.raw) || [, ''])[1];
    const key = content + '|' + tr;
    if (seen.has(key)) dupes.push({ ...s, content });
    else seen.add(key);
  }
  if (!dupes.length) continue;

  perFile.push({ file, count: dupes.length, samples: [...new Set(dupes.map((d) => d.content))].slice(0, 4) });
  totalRemoved += dupes.length;

  if (WRITE) {
    for (const d of dupes.sort((a, b) => b.start - a.start)) {
      svg = svg.slice(0, d.start) + svg.slice(d.end);
    }
    fs.writeFileSync(p, svg);
  }
}

if (!perFile.length) {
  console.log('dedupe-frame-text: no stacked duplicate <text> found');
  process.exit(0);
}

for (const f of perFile) {
  console.log(`  ${f.file.padEnd(16)} ${String(f.count).padStart(3)} duplicate(s)  e.g. ${f.samples.map((s) => JSON.stringify(s.slice(0, 24))).join(', ')}`);
}
console.log(`\ndedupe-frame-text: ${totalRemoved} duplicate <text> across ${perFile.length} frame(s)`);
console.log(WRITE ? 'REWRITTEN in place.' : '(report only — pass --write to remove them)');
