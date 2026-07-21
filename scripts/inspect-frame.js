#!/usr/bin/env node
/* ============================================================
   inspect-frame.js — see what you can actually target.

   frame-overrides.json can move, retime or hide any element, but only if you
   know its id. Since the mp_v2 export the ids carry no meaning (art_1, part_3,
   scene_7, XMLID_00000063618881...), so reading the SVG tells you nothing about
   which one is the ship and which is a background swash.

   This renders each frame with every TARGETABLE element outlined and labelled
   with the exact id to paste into frame-overrides.json. Targetable means: what
   motion.ts actually wraps — top-level groups/shapes that survive SKIP_IDS, plus
   every <text> (deduped), which it addresses as text_0, text_1, … in document
   order.

   Usage:
     node scripts/inspect-frame.js              every frame -> frame-inspector/
     node scripts/inspect-frame.js frame_9      just that one
     node scripts/inspect-frame.js frame_9 --open   ... and open it

   Output is gitignored — regenerate whenever the frames change.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');
const OUT_DIR = path.join(ROOT, 'frame-inspector');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const OPEN = process.argv.includes('--open');
const only = args[0] ? args[0].replace(/\.svg$/, '') + '.svg' : null;

// Mirrors motion.ts: these never animate — the world layer owns them.
const SKIP_IDS = /^(bg|background)$|^wave/i;
const JUNK = /__|clip|grad|mask|filter|linear-gradient|radial-gradient|^SVGID|^XMLID_\d/i;

const ANNOTATE = `((skipSrc, junkSrc) => {
  const SKIP = new RegExp(skipSrc, 'i');
  const JUNK = new RegExp(junkSrc, 'i');
  const svg = document.querySelector('svg');
  const root = svg.querySelector('g[isolation]') || svg;

  const targets = [];

  // 1. top-level groups/shapes, exactly what planAndWrap walks
  for (const el of Array.from(root.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'text') continue;
    const id = el.getAttribute('id');
    if (!id || JUNK.test(id) || SKIP.test(id)) continue;
    targets.push({ el, id, kind: 'element' });
  }

  // 2. every <text>, deduped on content+transform, addressed as text_N
  const seen = new Set();
  let n = 0;
  for (const t of Array.from(svg.querySelectorAll('text'))) {
    const key = (t.textContent || '').replace(/\\s+/g, ' ').trim() + '|' + (t.getAttribute('transform') || '');
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ el: t, id: 'text_' + n, kind: 'text', sample: (t.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 28) });
    n++;
  }

  const NS = 'http://www.w3.org/2000/svg';
  const layer = document.createElementNS(NS, 'g');
  layer.setAttribute('id', '__inspector');

  const out = [];
  targets.forEach((t, i) => {
    let b;
    try { b = t.el.getBoundingClientRect(); } catch (e) { return; }
    if (!b || !b.width || !b.height) return;
    const colour = t.kind === 'text' ? '#ac4f55' : '#0840a5';

    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', b.left); r.setAttribute('y', b.top);
    r.setAttribute('width', b.width); r.setAttribute('height', b.height);
    r.setAttribute('fill', 'none'); r.setAttribute('stroke', colour);
    r.setAttribute('stroke-width', '2'); r.setAttribute('stroke-dasharray', '6 4');
    r.setAttribute('opacity', '0.85');
    layer.appendChild(r);

    // Label sits just above the box, nudged inside the frame at the edges.
    const label = t.id + (t.kind === 'text' ? '  "' + (t.sample || '') + '"' : '');
    const lx = Math.max(4, Math.min(b.left, 1920 - 8 * label.length - 10));
    const ly = b.top > 22 ? b.top - 6 : b.bottom + 16;

    const bgr = document.createElementNS(NS, 'rect');
    bgr.setAttribute('x', lx - 3); bgr.setAttribute('y', ly - 14);
    bgr.setAttribute('width', 8 * label.length + 6); bgr.setAttribute('height', 18);
    bgr.setAttribute('fill', '#ffffff'); bgr.setAttribute('opacity', '0.9');
    layer.appendChild(bgr);

    const tx = document.createElementNS(NS, 'text');
    tx.setAttribute('x', lx); tx.setAttribute('y', ly);
    tx.setAttribute('font-family', 'monospace'); tx.setAttribute('font-size', '14');
    tx.setAttribute('font-weight', '700'); tx.setAttribute('fill', colour);
    tx.textContent = label;
    layer.appendChild(tx);

    out.push({ id: t.id, kind: t.kind, x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), sample: t.sample || '' });
  });

  svg.appendChild(layer);
  return out;
})(${JSON.stringify(SKIP_IDS.source)}, ${JSON.stringify(JUNK.source)})`;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.inspect-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const files = fs.readdirSync(SCENES).filter((f) => f.endsWith('.svg') && (!only || f === only)).sort();
  if (!files.length) { console.error(`no such frame: ${only}`); process.exit(1); }

  const index = {};
  for (const file of files) {
    const svg = fs.readFileSync(path.join(SCENES, file), 'utf8');
    const html = `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&display=swap');</style></head><body style="margin:0;background:#f5f6fa">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmpFile = path.join(tmpDir, file.replace('.svg', '.html'));
    fs.writeFileSync(tmpFile, html);
    await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
    await page.evaluate('document.fonts.ready');
    const found = await page.evaluate(ANNOTATE);
    index[file] = found;

    // Write the annotated SVG next to the listing — open it in any browser and
    // zoom, which beats a flat PNG when labels crowd.
    const annotated = await page.evaluate(`document.querySelector('svg').outerHTML`);
    fs.writeFileSync(path.join(OUT_DIR, file.replace('.svg', '.inspect.svg')), annotated);
    console.log(`  ${file.padEnd(16)} ${String(found.length).padStart(3)} targetable`);
  }

  await browser.close({ silent: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // A plain-text listing is what you actually paste from.
  const lines = [];
  for (const [file, items] of Object.entries(index)) {
    lines.push(`\n${file}`);
    lines.push('  id'.padEnd(34) + 'kind     x     y     w     h   text');
    for (const it of items) {
      lines.push(
        '  ' + it.id.padEnd(32) + it.kind.padEnd(7) +
        String(it.x).padStart(5) + String(it.y).padStart(6) + String(it.w).padStart(6) + String(it.h).padStart(6) +
        (it.sample ? '   "' + it.sample + '"' : '')
      );
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'INDEX.txt'), lines.join('\n') + '\n');

  console.log(`\nwrote frame-inspector/*.inspect.svg + INDEX.txt`);
  console.log('Open an .inspect.svg in a browser: every box is a targetable id for frame-overrides.json.');
  if (OPEN && only) {
    const p = path.join(OUT_DIR, only.replace('.svg', '.inspect.svg'));
    require('child_process').spawn('cmd', ['/c', 'start', '', p], { detached: true, stdio: 'ignore' }).unref();
  }
}
main();
