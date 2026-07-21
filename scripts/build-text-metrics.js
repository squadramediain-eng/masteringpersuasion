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

// Mirrors motion.ts planAndWrap(): text_N is assigned by walking the same root's
// direct children in document order. If those yield nothing, divider frames nest
// their labels in #divider_head and the FIRST <text> there is the big numeral,
// which rides the group — so the labels start at index 1. Keep both in step with
// motion.ts or the ids will not line up.
const COLLECT = `(() => {
  const svg = document.querySelector('svg');
  const root = svg.querySelector('g[isolation]') || svg;
  let texts = Array.from(root.children).filter((el) => el.tagName.toLowerCase() === 'text');
  if (!texts.length) {
    const head = svg.querySelector('#divider_head');
    if (head) texts = Array.from(head.querySelectorAll('text')).slice(1);
  }
  const out = {};
  texts.forEach((el, i) => {
    const n = el.getNumberOfChars();
    if (!n) return;
    const charX = [];
    for (let c = 0; c < n; c++) charX.push(+el.getStartPositionOfChar(c).x.toFixed(2));
    charX.push(+el.getEndPositionOfChar(n - 1).x.toFixed(2));
    const b = el.getBBox();
    out['text_' + i] = {
      charX,
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
    const html = `<!DOCTYPE html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Mono:wght@300;400;500&display=swap');</style>
</head><body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmpFile = path.join(tmpDir, file.replace('.svg', '.html'));
    fs.writeFileSync(tmpFile, html);
    await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
    await page.evaluate('document.fonts.ready');
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
