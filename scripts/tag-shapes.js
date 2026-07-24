/* eslint-disable */
// tag-shapes.js — give a stable id to a specific inner SHAPE that the artwork left
// unnamed, so a review comment about it (a gear, the clock needle, the ship's wheel,
// the soundwave arcs) can be animated via frame-overrides. Finds the shape by its
// on-screen position (headless getBoundingClientRect), sets an id, and re-serialises
// the svg. These ids live in the repo copy until the next Design export; document them
// so Design can bake them in.
//
//   explore:  node scripts/tag-shapes.js explore frame_5.svg 1050 300 1750 620
//             -> lists every leaf shape whose centre falls in that box (id, tag, box)
//   inject:   node scripts/tag-shapes.js inject frame_5.svg ship_wheel 1290 470
//             -> ids the SMALLEST group/shape whose box contains the point, writes back
const path = require('path');
const fs = require('fs');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src/assets/scenes');

async function withPage(file, fn) {
  const svg = fs.readFileSync(path.join(SCENES, file), 'utf8');
  const html = `<!DOCTYPE html><html><body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
  const tmpDir = path.join(ROOT, '.tag-tmp'); fs.mkdirSync(tmpDir, { recursive: true });
  const tmp = path.join(tmpDir, file.replace('.svg', '.html'));
  fs.writeFileSync(tmp, html);
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto({ url: 'file://' + tmp.replace(/\\/g, '/'), timeout: 30000 });
  const out = await fn(page);
  await browser.close({ silent: true }).catch(() => {});
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return out;
}

// Batch: one browser session for many frames. config = [{ file, explore?: [[x0,y0,x1,y1]...],
// inject?: [{id,x,y}...] }]. Explores print shapes; injects add ids and rewrite the svg.
async function batch(configPath) {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.tag-tmp'); fs.mkdirSync(tmpDir, { recursive: true });
  for (const job of cfg) {
    const raw = fs.readFileSync(path.join(SCENES, job.file), 'utf8');
    // strip the font @import for the throwaway measurement page so goto does not block
    // on the network; keep the ORIGINAL for writing back so the saved svg is unchanged.
    const svg = raw.replace(/@import\s+url\([^)]*\)\s*;?/g, '');
    const html = `<!DOCTYPE html><html><body style="margin:0">${svg.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const origImport = (raw.match(/@import\s+url\([^)]*\)\s*;?/) || [])[0] || '';
    const tmp = path.join(tmpDir, job.file.replace('.svg', '.html'));
    fs.writeFileSync(tmp, html);
    await page.goto({ url: 'file://' + tmp.replace(/\\/g, '/'), timeout: 30000 });
    console.log('\n══ ' + job.file + ' ══');
    for (const box of job.explore || []) {
      const els = await page.evaluate((b) => {
        const [x0, y0, x1, y1] = b; const res = [];
        for (const el of document.querySelectorAll('path,circle,ellipse,rect,line,polygon,polyline,g')) {
          const r = el.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
          if (cx < x0 || cx > x1 || cy < y0 || cy > y1 || r.width < 3 || r.height < 3) continue;
          if (r.width > 1900 && r.height > 1060) continue;
          res.push({ id: el.id || '', tag: el.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), a: Math.round(r.width * r.height) });
        }
        return res.sort((a, b) => b.a - a.a);
      }, box);
      console.log(` box ${box.join(',')}:`);
      for (const e of els) console.log(`   ${(e.id || '(no id)').padEnd(24)} <${e.tag}> cx${e.x + (e.w >> 1)} cy${e.y + (e.h >> 1)} [${e.w}x${e.h}]`);
    }
    if (job.inject && job.inject.length) {
      const newSvg = await page.evaluate((targets) => {
        for (const t of targets) {
          // pick the element containing the point whose SIZE is closest to t.size
          // (a spoked wheel ~86px, not the 2px centre bolt); default = smallest.
          let best = null, bestScore = Infinity;
          for (const el of document.querySelectorAll('path,circle,ellipse,rect,line,polygon,polyline,g')) {
            const r = el.getBoundingClientRect();
            if (t.x < r.x || t.x > r.x + r.width || t.y < r.y || t.y > r.y + r.height || r.width < 3 || r.height < 3) continue;
            const dim = Math.max(r.width, r.height);
            const score = t.size ? Math.abs(dim - t.size) : dim;
            if (score < bestScore) { best = el; bestScore = score; }
          }
          if (best) best.setAttribute('id', t.id);
        }
        return document.querySelector('svg').outerHTML;
      }, job.inject);
      // put the font @import back (it was stripped only for the measurement page)
      const out = origImport && !newSvg.includes('@import')
        ? newSvg.replace(/(<svg[^>]*>)/, '$1<style type="text/css">' + origImport + '</style>')
        : newSvg;
      fs.writeFileSync(path.join(SCENES, job.file), out);
      console.log(' injected: ' + job.inject.map((t) => t.id).join(', '));
    }
  }
  await browser.close({ silent: true }).catch(() => {});
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function main() {
  const [mode, file] = process.argv.slice(2);
  if (mode === 'batch') { await batch(file); return; }
  if (mode === 'explore') {
    const [x0, y0, x1, y1] = process.argv.slice(4).map(Number);
    const els = await withPage(file, (page) => page.evaluate((box) => {
      const [x0, y0, x1, y1] = box;
      const res = [];
      for (const el of document.querySelectorAll('path,circle,ellipse,rect,line,polygon,polyline,g')) {
        const r = el.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
        if (r.width < 3 || r.height < 3) continue;
        if (r.width > 1900 && r.height > 1060) continue;
        res.push({ id: el.id || '', tag: el.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), area: Math.round(r.width * r.height) });
      }
      return res.sort((a, b) => b.area - a.area);
    }, [x0, y0, x1, y1]));
    for (const e of els) console.log(`${(e.id || '(no id)').padEnd(26)} <${e.tag}>  [x${e.x} y${e.y} ${e.w}x${e.h}]`);
    console.log(`\n${els.length} shapes in box.`);
    return;
  }

  if (mode === 'inject') {
    // repeatable: node ... inject file id1 x1 y1 [id2 x2 y2 ...]
    const rest = process.argv.slice(4);
    const targets = [];
    for (let i = 0; i < rest.length; i += 3) targets.push({ id: rest[i], x: +rest[i + 1], y: +rest[i + 2] });
    const newSvg = await withPage(file, (page) => page.evaluate((targets) => {
      for (const t of targets) {
        // smallest element whose box contains the point (deepest specific shape)
        let best = null, bestArea = Infinity;
        for (const el of document.querySelectorAll('path,circle,ellipse,rect,line,polygon,polyline,g')) {
          const r = el.getBoundingClientRect();
          if (t.x < r.x || t.x > r.x + r.width || t.y < r.y || t.y > r.y + r.height) continue;
          if (r.width < 3 || r.height < 3) continue;
          const area = r.width * r.height;
          if (area < bestArea) { best = el; bestArea = area; }
        }
        if (best) best.setAttribute('id', t.id);
      }
      return document.querySelector('svg').outerHTML;
    }, targets));
    const outPath = path.join(SCENES, file);
    fs.writeFileSync(outPath, newSvg);
    console.log(`tagged ${targets.map((t) => t.id).join(', ')} in ${file}`);
    return;
  }

  console.error('usage: tag-shapes.js explore <file> x0 y0 x1 y1   |   inject <file> id x y [id x y ...]');
  process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
