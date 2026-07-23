/* eslint-disable */
// resolve-comment-targets.js — map each review comment (Comments/*.json) to the
// EXACT svg element(s) under its drawn region, using a real headless-Chromium
// getBoundingClientRect. The reviewer marks WHERE on screen each note applies, so
// even the meaningless svgid_ ids become targetable: we just find which element's
// on-screen box best matches the region the reviewer drew.
//
// Usage: node scripts/resolve-comment-targets.js [Comments/scene1-6.json]
// Prints, per comment: the scene, the region, and the ranked candidate element ids
// (id, tag, on-screen box, IoU / containment) so a frame-overrides entry can target
// the right one.
const path = require('path');
const fs = require('fs');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const W = 1920, H = 1080;

// scene windows from sceneRegistry
function scenes() {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/sceneRegistry.ts'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const re = /svgFile:\s*'([\w.]+)'[\s\S]*?audioStartSec:\s*(\d+)[\s\S]*?durationFrames:\s*(\d+)/g;
  const out = []; let m;
  while ((m = re.exec(src))) out.push({ file: m[1], start: +m[2], dur: +m[3] / 30 });
  return out;
}
const S = scenes();
const sceneAt = (t) => S.find((s) => t >= s.start && t < s.start + s.dur);

// region (or drawing bbox) -> pixel rect
function commentRect(c) {
  if (c.region) return { x: c.region.x * W, y: c.region.y * H, w: c.region.w * W, h: c.region.h * H };
  if (c.drawing) {
    const pts = c.drawing.flat();
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    return { x: x0 * W, y: y0 * H, w: (x1 - x0) * W, h: (y1 - y0) * H };
  }
  return null;
}
function iou(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni > 0 ? inter / uni : 0;
}
// fraction of the region covered by the element (containment of the region)
function coverage(region, el) {
  const ix = Math.max(0, Math.min(region.x + region.w, el.x + el.w) - Math.max(region.x, el.x));
  const iy = Math.max(0, Math.min(region.y + region.h, el.y + el.h) - Math.max(region.y, el.y));
  return (ix * iy) / (region.w * region.h || 1);
}

async function main() {
  const cmPath = process.argv[2] || path.join(ROOT, 'Comments/scene1-6.json');
  const comments = JSON.parse(fs.readFileSync(cmPath, 'utf8'));
  // group comments by scene file
  const byFile = {};
  for (const c of comments) {
    const s = sceneAt(c.timecode_sec);
    if (!s) continue;
    (byFile[s.file] = byFile[s.file] || []).push(c);
  }

  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.ctarget-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const file of Object.keys(byFile)) {
    const svg = fs.readFileSync(path.join(ROOT, 'src/assets/scenes', file), 'utf8');
    const html = `<!DOCTYPE html><html><body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmp = path.join(tmpDir, file.replace('.svg', '.html'));
    fs.writeFileSync(tmp, html);
    await page.goto({ url: 'file://' + tmp.replace(/\\/g, '/'), timeout: 30000 });

    // every element that has an id -> on-screen box (skip full-frame and zero-size)
    const els = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('[id]')) {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        if (r.width > 1900 && r.height > 1060) continue;        // whole-frame wrappers
        out.push({ id: el.id, tag: el.tagName.toLowerCase(), x: r.x, y: r.y, w: r.width, h: r.height });
      }
      return out;
    });

    console.log('\n══ ' + file + ' ══');
    for (const c of byFile[file]) {
      const reg = commentRect(c);
      console.log(`\n[${c.id}] @${c.timecode_sec}s  ${c.text.replace(/\s+/g, ' ').slice(0, 90)}`);
      if (!reg) { console.log('   (no region)'); continue; }
      console.log(`   region px: x${Math.round(reg.x)} y${Math.round(reg.y)} ${Math.round(reg.w)}x${Math.round(reg.h)}`);
      const ranked = els
        .map((e) => ({ e, iou: iou(reg, e), cov: coverage(reg, e) }))
        .filter((r) => r.cov > 0.25 || r.iou > 0.1)             // element meaningfully under the region
        .sort((a, b) => (b.iou - a.iou) || (b.cov - a.cov))
        .slice(0, 6);
      if (!ranked.length) { console.log('   no id\'d element under the region (target shape has no id)'); continue; }
      for (const r of ranked) {
        console.log(`   ${(r.iou).toFixed(2)} IoU  ${(r.cov).toFixed(2)} cov  <${r.e.tag}> ${r.e.id}  [x${Math.round(r.e.x)} y${Math.round(r.e.y)} ${Math.round(r.e.w)}x${Math.round(r.e.h)}]`);
      }
    }
  }

  await browser.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
main().catch((e) => { console.error(e); process.exit(1); });
