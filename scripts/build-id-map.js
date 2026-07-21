/* eslint-disable */
/* ============================================================
   build-id-map.js — recover animation bindings after an export
   that renamed everything.

   The mp_v2 export replaced every semantic id with Illustrator artifacts
   (spot_anchor -> art_2, trait_1 -> part_3, XMLID_000000636...). That broke
   173/207 spec bindings and 133/133 narration cues — the entire VO sync.

   Rather than re-authoring 133 cues by hand, match GEOMETRICALLY: an element
   that draws the same thing in the same place is the same element, whatever it
   is now called. For every id in the OLD frame we measure its rendered box, do
   the same for the NEW frame, and pair them by centre distance + size
   similarity. Confident pairs become a rename map; everything else is reported
   so it can be judged by eye rather than guessed.

   Usage:
     node scripts/build-id-map.js <old-frames-dir>     write id-map.json + report
     node scripts/build-id-map.js <old-frames-dir> --apply   also rewrite
                                   animation.json + audio-cues.json

   Matching thresholds are deliberately strict — a wrong pairing silently
   animates the wrong element, which is worse than an unmatched one.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');
const OUT = path.join(ROOT, 'public', 'animation', 'id-map.json');
const OLD_DIR = process.argv[2];
const APPLY = process.argv.includes('--apply');

if (!OLD_DIR || !fs.existsSync(OLD_DIR)) {
  console.error('usage: node scripts/build-id-map.js <old-frames-dir> [--apply]');
  process.exit(1);
}

// A pair must be close in BOTH position and size. Centre tolerance is generous
// (art gets nudged between rounds); size tolerance is tight (a ring and the icon
// inside it share a centre, and only size tells them apart).
const MAX_CENTRE_DIST = 60;   // px, in the 1920x1080 frame
const SIZE_RATIO = 0.35;      // |1 - new/old| must be under this

const SKIP = /^(SVGID|XMLID)|__|clip|grad|mask|filter|linear-gradient|radial-gradient/i;

const COLLECT = `(() => {
  const out = {};
  document.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (!id) return;
    let b;
    try { b = el.getBoundingClientRect(); } catch (e) { return; }
    if (!b || !b.width || !b.height) return;
    out[id] = {
      cx: +(b.left + b.width / 2).toFixed(1),
      cy: +(b.top + b.height / 2).toFixed(1),
      w: +b.width.toFixed(1),
      h: +b.height.toFixed(1),
    };
  });
  return out;
})()`;

async function measure(page, tmpDir, file, svgPath) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const html = `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&display=swap');</style></head><body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
  const tmpFile = path.join(tmpDir, file.replace('.svg', '.html'));
  fs.writeFileSync(tmpFile, html);
  await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
  await page.evaluate('document.fonts.ready');
  return page.evaluate(COLLECT);
}

async function main() {
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.idmap-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const map = {};
  const unmatched = {};
  let matched = 0, missed = 0;

  const files = fs.readdirSync(SCENES).filter((f) => f.endsWith('.svg')).sort();
  for (const file of files) {
    const oldPath = path.join(OLD_DIR, file);
    if (!fs.existsSync(oldPath)) continue;
    const oldBoxes = await measure(page, tmpDir, 'old_' + file, oldPath);
    const newBoxes = await measure(page, tmpDir, 'new_' + file, path.join(SCENES, file));

    const newEntries = Object.entries(newBoxes).filter(([id]) => !SKIP.test(id));
    const taken = new Set();
    const perFile = {};

    // Match the most distinctive elements first: a big unique shape is far less
    // likely to be mispaired than one of twenty identical small dots.
    const oldEntries = Object.entries(oldBoxes)
      .filter(([id]) => !SKIP.test(id))
      .sort((a, b) => b[1].w * b[1].h - a[1].w * a[1].h);

    for (const [oldId, ob] of oldEntries) {
      let best = null, bestScore = Infinity;
      for (const [newId, nb] of newEntries) {
        if (taken.has(newId)) continue;
        const d = Math.hypot(nb.cx - ob.cx, nb.cy - ob.cy);
        if (d > MAX_CENTRE_DIST) continue;
        const rw = Math.abs(1 - nb.w / (ob.w || 1));
        const rh = Math.abs(1 - nb.h / (ob.h || 1));
        if (rw > SIZE_RATIO || rh > SIZE_RATIO) continue;
        const score = d + (rw + rh) * 100;
        if (score < bestScore) { bestScore = score; best = newId; }
      }
      if (best) {
        taken.add(best);
        if (best !== oldId) perFile[oldId] = best;
        matched++;
      } else {
        (unmatched[file] = unmatched[file] || []).push(oldId);
        missed++;
      }
    }
    if (Object.keys(perFile).length) map[file] = perFile;
  }

  await browser.close({ silent: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  fs.writeFileSync(OUT, JSON.stringify({ _readme: 'old id -> new id, matched geometrically by build-id-map.js', frames: map }, null, 1) + '\n');
  console.log(`\nid-map: matched ${matched}, unmatched ${missed}`);
  console.log(`renames written to public/animation/id-map.json`);

  const unFiles = Object.keys(unmatched);
  if (unFiles.length) {
    console.log(`\nUNMATCHED (no element of similar size within ${MAX_CENTRE_DIST}px) — judge these by eye:`);
    for (const f of unFiles) {
      console.log(`  ${f}: ${unmatched[f].slice(0, 10).join(', ')}${unmatched[f].length > 10 ? ` … +${unmatched[f].length - 10}` : ''}`);
    }
  }

  if (!APPLY) { console.log('\n(dry run — pass --apply to rewrite animation.json + audio-cues.json)'); return; }

  for (const rel of ['public/animation/animation.json', 'public/animation/audio-cues.json']) {
    const p = path.join(ROOT, rel);
    let text = fs.readFileSync(p, 'utf8');
    let n = 0;
    for (const [file, renames] of Object.entries(map)) {
      for (const [oldId, newId] of Object.entries(renames)) {
        // Quote-delimited so a short id can never match inside a longer one.
        const needle = new RegExp(`"${oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
        const before = text;
        text = text.replace(needle, `"${newId}"`);
        if (text !== before) n++;
      }
    }
    fs.writeFileSync(p, text);
    console.log(`  ${rel}: ${n} id(s) rewritten`);
  }
}
main();
