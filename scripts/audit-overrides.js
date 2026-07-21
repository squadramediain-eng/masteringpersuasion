#!/usr/bin/env node
/* ============================================================
   audit-overrides.js — every id in frame-overrides.json must still exist.

   Why: an override that names a renamed or deleted element does NOTHING and says
   nothing. That is the exact failure mode this project has hit on every design
   export so far (frame_1's ids changed twice in two rounds, frame_18's rings were
   deleted). The overrides file is the one place hand-corrections live, so a silent
   drop here loses real work.

   Exits 1 on any unknown frame or id. Wired into scripts/qa-review-gate.js.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OVERRIDES = path.join(ROOT, 'public', 'animation', 'frame-overrides.json');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');

const data = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'));
const frames = data.frames || {};

const problems = [];
let checked = 0;

for (const [svgFile, els] of Object.entries(frames)) {
  const p = path.join(SCENES, svgFile);
  if (!fs.existsSync(p)) {
    problems.push(`${svgFile}: no such frame in src/assets/scenes/`);
    continue;
  }
  const svg = fs.readFileSync(p, 'utf8');
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  // motion.ts synthesises text_N ids for root <text> in document order — they are
  // never literal attributes in the SVG, so accept them if that many texts exist.
  const textCount = (svg.match(/<text[\s>]/g) || []).length;

  for (const id of Object.keys(els)) {
    if (id === '_frame' || id === '_transition') continue;
    checked++;
    if (ids.has(id)) continue;
    const m = /^text_(\d+)$/.exec(id);
    if (m && Number(m[1]) < textCount) continue;
    problems.push(`${svgFile}: "${id}" is not an id in that frame`);
  }
}

if (problems.length) {
  console.error(`audit-overrides: ${problems.length} stale override(s) — these do NOTHING:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\nThe element was renamed or removed by a frame re-export. Update');
  console.error('public/animation/frame-overrides.json to the new id, or drop the entry.');
  process.exit(1);
}

console.log(`audit-overrides: ${checked} override(s) across ${Object.keys(frames).length} frame(s) — all ids resolve`);
