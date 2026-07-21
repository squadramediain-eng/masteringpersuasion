/* eslint-disable */
/* ============================================================
   build-text-metrics.js — measure every animatable <text> so the
   typewriter can reveal EXACT character boundaries and place a real
   cursor, instead of estimating glyph widths.

   Why this exists: motion.ts runs inside Remotion's deterministic
   render — it parses the SVG with DOMParser (detached, so getBBox and
   getStartPositionOfChar are unavailable) and emits pure CSS per frame.
   Measuring at render time would need delayRender and would make output
   frame-dependent. So we measure ONCE here, headless, and commit the
   numbers — the same pattern build-audio-cues.js uses for cue times.

   Output: public/animation/text-metrics.json
     { "frame_0.svg": { "text_0": { charX: [...], x0, x1, y, h, transform } } }
   charX[i] = user-space x where character i STARTS; charX[n] = end of the
   last character. All coordinates are in the <text>'s own local space, so
   the caret rect can simply reuse the text's own transform attribute.

   Run after any frame re-export:  node scripts/build-text-metrics.js
   --check  verifies the committed file matches the current SVGs (QA gate).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');
const OUT = path.join(ROOT, 'public', 'animation', 'text-metrics.json');
const CHECK = process.argv.includes('--check');

/* Measure against the EXACT font files the render uses.
   Earlier this page pulled DM Sans with an @import from fonts.googleapis.com.
   That silently never loaded — an https @import from a file:// origin does not
   resolve in the headless launch — so every advance width was measured against a
   fallback face. The clip rects came out too narrow and the frame_0 title
   rendered permanently as "Masterin/Persuasio", its last glyph cut off on every
   line, in every frame of the film.
   So: pull the woff2 URLs straight out of @remotion/google-fonts (the same
   package Root.tsx loads), fetch them here in Node, and inline them as data URIs.
   Identical bytes to the render, and the page needs no network at all. */
async function inlineFontFace() {
  const pkg = path.join(ROOT, 'node_modules', '@remotion', 'google-fonts', 'dist', 'cjs', 'DMSans.js');
  const src = fs.readFileSync(pkg, 'utf8');
  const urls = [...new Set([...src.matchAll(/https:\/\/fonts\.gstatic\.com\/[^\s"')]+\.woff2/g)].map((m) => m[0]))];
  if (!urls.length) throw new Error('no DM Sans woff2 urls found in @remotion/google-fonts');
  const faces = [];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`font fetch ${res.status} for ${url}`);
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    // Weight range covers the variable axis; the frames use 400-800.
    faces.push(
      `@font-face{font-family:"DM Sans";font-style:normal;font-weight:100 1000;` +
      `src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block;}`
    );
  }
  return faces.join('');
}

// Mirrors motion.ts planAndWrap(): text_N is assigned by walking the same root's
// direct children in document order. If those yield nothing, divider frames nest
// their labels in #divider_head and the FIRST <text> there is the big numeral,
// which rides the group — so the labels start at index 1. Keep both in step with
// motion.ts or the ids will not line up.
const COLLECT = `(() => {
  const svg = document.querySelector('svg');
  // EVERY <text> in document order — must match motion.ts planAndWrap exactly.
  // A root-children-only walk found zero text in all 20 mp_v2 frames (its text is
  // nested inside groups), which silently disabled type-on and wrote an empty
  // metrics file. Keep these two walks identical or the caret lands on the wrong
  // element.
  // Dedupe stacked duplicates on content+transform — must match motion.ts
  // planAndWrap exactly, or text_N indices diverge between the two walks.
  const texts = [];
  const seen = new Set();
  for (const t of Array.from(svg.querySelectorAll('text'))) {
    const key = (t.textContent || '').replace(/\\s+/g, ' ').trim() + '|' + (t.getAttribute('transform') || '');
    if (seen.has(key)) continue;
    seen.add(key);
    texts.push(t);
  }
  const out = {};
  texts.forEach((el, i) => {
    const n = el.getNumberOfChars();
    if (!n) return;
    // Group characters into LINES by their baseline y. A multi-line block's x
    // positions restart on every line, so a single horizontal sweep is wrong —
    // reveal has to be a per-line staircase (see animationUtils.typewriterReveal).
    const lines = [];
    let cur = null;
    for (let c = 0; c < n; c++) {
      const p = el.getStartPositionOfChar(c);
      const e = el.getEndPositionOfChar(c);
      if (!cur || Math.abs(p.y - cur.y) > 1) {
        cur = { y: p.y, x0: p.x, x1: e.x, xs: [p.x] };
        lines.push(cur);
      }
      cur.xs.push(e.x);
      cur.x1 = Math.max(cur.x1, e.x);
      cur.x0 = Math.min(cur.x0, p.x);
    }
    const b = el.getBBox();
    out['text_' + i] = {
      lines: lines.map((l) => ({
        y: +l.y.toFixed(2),
        x0: +l.x0.toFixed(2),
        x1: +l.x1.toFixed(2),
        xs: l.xs.map((x) => +x.toFixed(2)),
      })),
      chars: n,
      x0: +b.x.toFixed(2),
      x1: +(b.x + b.width).toFixed(2),
      y: +b.y.toFixed(2),
      h: +b.height.toFixed(2),
      transform: el.getAttribute('transform') || '',
    };
  });
  return out;
})()`;

async function main() {
  const fontCss = await inlineFontFace();
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const tmpDir = path.join(ROOT, '.text-metrics-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const result = {};
  const files = fs.readdirSync(SCENES).filter((f) => f.endsWith('.svg')).sort();
  for (const file of files) {
    const svg = fs.readFileSync(path.join(SCENES, file), 'utf8');
    // DM Sans must be loaded or every advance width is measured against a
    // fallback face and the caret lands in the wrong place.
    const html = `<!DOCTYPE html><html><head><style>${fontCss}</style></head>` +
      `<body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmpFile = path.join(tmpDir, file.replace('.svg', '.html'));
    fs.writeFileSync(tmpFile, html);
    await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
    // Fonts load lazily — document.fonts.ready can resolve before anything has
    // asked for the face, so load it explicitly across the weights the frames use
    // and only then wait for quiescence.
    await page.evaluate(
      `Promise.all(['400','500','700','800'].map(w => document.fonts.load(w + ' 130px "DM Sans"')))` +
      `.then(() => document.fonts.ready)`
    );
    // HARD GATE. These advances are only valid if the page measured the SAME face
    // the Remotion render uses. If the webfont did not actually arrive (no network
    // in this environment, Google Fonts blocked, a typo in the @import) the browser
    // silently measures a fallback — narrower or wider — and every clip rect is
    // built to the wrong width. That shipped once: the frame_0 title rendered
    // permanently as "Masterin/Persuasio", the last glyph of each line cut off,
    // and it looked like a typewriter still running rather than a metrics bug.
    const fontOk = await page.evaluate(`document.fonts.check('130px "DM Sans"')`);
    if (!fontOk) {
      console.error('text-metrics: ABORT — "DM Sans" is not loaded in the measuring page.');
      console.error('Every advance width would be measured against a fallback face and');
      console.error('every type-on clip would cut its line short. Check network access to');
      console.error('fonts.googleapis.com, or point the @import at a local copy.');
      process.exit(1);
    }
    const metrics = await page.evaluate(COLLECT);
    if (metrics && Object.keys(metrics).length) result[file] = metrics;
  }
  await browser.close({ silent: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const json = JSON.stringify(result, null, 1) + '\n';
  const totalTexts = Object.values(result).reduce((a, m) => a + Object.keys(m).length, 0);

  if (CHECK) {
    if (!fs.existsSync(OUT)) {
      console.error('text-metrics: public/animation/text-metrics.json is MISSING — run node scripts/build-text-metrics.js');
      process.exit(1);
    }
    if (fs.readFileSync(OUT, 'utf8') !== json) {
      console.error('text-metrics: STALE — the frames changed since it was built. Run node scripts/build-text-metrics.js');
      process.exit(1);
    }
    console.log(`text-metrics: fresh — ${totalTexts} text element(s) across ${Object.keys(result).length} frame(s)`);
    return;
  }

  fs.writeFileSync(OUT, json);
  console.log(`text-metrics: wrote ${totalTexts} text element(s) across ${Object.keys(result).length} frame(s) -> public/animation/text-metrics.json`);
}
main();
