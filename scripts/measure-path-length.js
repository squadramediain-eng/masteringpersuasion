/* eslint-disable */
// Measures real SVG getTotalLength() for stroke-dasharray draw-on effects.
// One-off tool: fill in TARGETS, run, then revert/clear before committing.
const path = require('path');
const fs = require('fs');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  // ['Frame_01.svg', ['arrow1', 'line1']],
];

async function main() {
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.bbox-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const results = {};
  for (const [svgFile, ids] of TARGETS) {
    const svgPath = path.join(ROOT, 'src', 'assets', 'scenes', svgFile);
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `<!DOCTYPE html><html><body style="margin:0">${svgContent.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmpFile = path.join(tmpDir, svgFile.replace('.svg', '.html'));
    fs.writeFileSync(tmpFile, html);
    await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
    results[svgFile] = {};
    for (const id of ids) {
      const len = await page.evaluate((elId) => {
        const el = document.getElementById(elId);
        if (!el) return null;
        // could be a <g> wrapping a <line>/<path>/<polyline>, or the element itself
        const target = el.tagName === 'g' ? el.querySelector('path, line, polyline') : el;
        if (!target || !target.getTotalLength) return 'NO_PATH_METHOD:' + (target ? target.tagName : 'null');
        return target.getTotalLength();
      }, id);
      results[svgFile][id] = len;
    }
  }
  console.log(JSON.stringify(results, null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
