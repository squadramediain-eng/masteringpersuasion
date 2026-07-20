/* eslint-disable */
// Measures the exact rendered bounding box of specific element ids inside
// SVG asset files, using a real headless-Chromium getBBox() call instead of
// estimating widths by eye — used to fix typewriter-cursor mispositioning.
// One-off tool: fill in TARGETS, run, then revert/clear before committing.
const path = require('path');
const fs = require('fs');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');

// [svgFile, [ids...]]
const TARGETS = [
  // ['Frame_01.svg', ['heading']],
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
      const box = await page.evaluate((elId) => {
        const el = document.getElementById(elId);
        if (!el) return null;
        const b = el.getBBox ? el.getBBox() : el.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }, id);
      results[svgFile][id] = box;
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
