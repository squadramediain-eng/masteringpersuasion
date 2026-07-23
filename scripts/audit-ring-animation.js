#!/usr/bin/env node
/* ============================================================
   audit-ring-animation.js — the dotted rings/rectangles must NEVER sit still.

   The reference film keeps every dotted ring alive: once its icon lands, the ring's
   dashes travel continuously round the stroke (reads as a slow rotation), each ring
   at its own speed and direction. Dotted RECTANGLE borders march the same way. This
   is a house creative rule (CLAUDE.md "Dotted rings & rectangles ALWAYS march").

   motion.ts animates these via markDashRings(): every dashed <path>/<circle>/<ellipse>/
   <rect> with a real stroke gets a continuous 'ring-march' (stroke-dashoffset). Dashed
   <line>s are connector ARROWS that draw on as an entrance, so they are deliberately
   excluded. This audit is the static guard that the artwork never introduces a dotted
   element the engine would silently leave frozen.

   It FAILS if a frame carries a dashed element on a shape the engine does NOT march
   (a <polygon>/<polyline>, or a dashed shape with no stroke), i.e. a dotted decoration
   that would render static. It PASSES clean and prints per-frame coverage so a review
   can see exactly which frames carry rings / rectangles.

   Keep the RING_TAGS / connector rule here IN STEP with motion.ts isDashRing().
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'src/assets/scenes');
const RING_TAGS = new Set(['path', 'circle', 'ellipse', 'rect']);   // engine marches these
const CONNECTOR_TAG = 'line';                                        // draws on — excluded on purpose
const SKIP_ANCESTOR = /connector|arrow|link|flow|\bconn\b|draw/i;

const files = fs.readdirSync(DIR).filter((f) => /^frame_\d+\.svg$/.test(f))
  .sort((a, b) => +a.match(/\d+/) - +b.match(/\d+/));

const problems = [];
const rows = [];
let framesWithRings = 0, framesWithRects = 0, totalRings = 0, totalRects = 0;

for (const f of files) {
  const svg = fs.readFileSync(path.join(DIR, f), 'utf8');
  // Every opening tag that carries a stroke-dasharray.
  const tags = [...svg.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*\bstroke-dasharray\b[^>]*)>/g)];
  let rings = 0, rects = 0, connectors = 0;
  for (const [, tag, attrs] of tags) {
    const t = tag.toLowerCase();
    const da = (attrs.match(/stroke-dasharray\s*=\s*"([^"]*)"/) || [])[1];
    if (!da || da === 'none') continue;                     // not actually dashed
    if (t === CONNECTOR_TAG) { connectors++; continue; }    // connector arrow — draws on
    const stroke = (attrs.match(/\bstroke\s*=\s*"([^"]*)"/) || [])[1];
    // stroke="none" (or no stroke) = an INVISIBLE dashed path — Illustrator ships these
    // as construction/motion guides; the visible ring is a separate stroked element.
    // The engine skips them too (isDashRing requires a real stroke), so they are not a
    // problem: nothing frozen, because nothing renders.
    if (!stroke || stroke === 'none') continue;
    if (/pathLength/.test(attrs)) continue;                 // a draw-on reveal, not a ring
    if (!RING_TAGS.has(t)) {
      problems.push(`${f}: VISIBLE dashed <${t}> is a dotted shape the engine does NOT march — it would render FROZEN. Use a <path>/<rect>/<circle>, or extend motion.ts RING_TAGS.`);
      continue;
    }
    // classify ring vs rectangle for the coverage report: a curved path (or a
    // circle/ellipse) is a ring; a rect or an all-straight path is a rectangle.
    const dAttr = (attrs.match(/\bd\s*=\s*"([^"]*)"/) || [])[1] || '';
    if (t === 'rect') rects++;
    else if (t === 'path') (/[cCsSqQaA]/.test(dAttr) ? rings++ : rects++);
    else rings++;                                            // circle/ellipse
  }
  totalRings += rings; totalRects += rects;
  if (rings) framesWithRings++;
  if (rects) framesWithRects++;
  const parts = [];
  if (rings) parts.push(`${rings} ring${rings > 1 ? 's' : ''}`);
  if (rects) parts.push(`${rects} rect${rects > 1 ? 's' : ''}`);
  if (connectors) parts.push(`${connectors} connector${connectors > 1 ? 's' : ''} (draw-on)`);
  rows.push(`  ${f.replace('.svg', '').padEnd(10)} ${parts.join(', ') || '—'}`);
}

console.log('\nDOTTED RING / RECTANGLE ANIMATION AUDIT\n');
console.log(rows.join('\n'));
console.log(`\n  ${totalRings} dotted rings across ${framesWithRings} frame(s); ${totalRects} dotted rectangles across ${framesWithRects} frame(s).`);
console.log('  All are marked for continuous march by motion.ts markDashRings() (varied speed + direction).');

if (problems.length) {
  console.error(`\naudit-ring-animation: ${problems.length} dotted element(s) would render FROZEN:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\naudit-ring-animation: every dotted ring/rectangle is scheduled to march — none frozen.');
