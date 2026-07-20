/* eslint-disable */
// Permanent QA tool — catches the "cursor not at the end of the last
// letter" bug class at its root: typewriterReveal()'s cursor position and
// its clip-path reveal are both computed from a `bounds` object that is
// hand-measured ONCE and pasted into source as a literal. If that literal
// ever drifts from the SVG's real bbox (re-export, copy-paste typo, or
// just never having been measured precisely in the first place), the
// cursor silently lands in the wrong place — and nothing else breaks, so
// it's invisible to tsc/audit-scene-ids.
//
// This script extracts every `typewriterReveal(progress, lines, { left,
// top, right, bottom }, frame)` call straight out of the scene source
// files (not a manually maintained list — it can't go stale the way a
// hardcoded table would), figures out which SVG element id each one
// targets (by matching the variable name against `#id { ... clip-path:
// ${var}.clipPath ... }` in the same file's style block), measures that
// id's REAL bounding box with a headless-Chromium getBBox() call against
// the actual SVG asset, and reports any mismatch beyond a small tolerance.
//
// Run after every SVG re-export, and any time a typewriterReveal call is
// added or edited. Per skills/05-qa-checklist.md.
const path = require('path');
const fs = require('fs');
const { openBrowser } = require('@remotion/renderer');

const ROOT = path.resolve(__dirname, '..');
const SCENES_DIR = path.join(ROOT, 'src', 'scenes');
const SVG_DIR = path.join(ROOT, 'src', 'assets', 'scenes');
const TOLERANCE_PX = 1.5;

function extractCalls(sceneFile, source) {
  const svgImportMatch = source.match(/from\s+'\.\.\/assets\/scenes\/(Frame_\d+\.svg)'/);
  if (!svgImportMatch) return [];
  const svgFile = svgImportMatch[1];

  const calls = [];
  // const NAME = typewriterReveal(PROGRESS, LINES, { left: A, top: B, right: C, bottom: D }, frame)
  const callRe = /const\s+(\w+)\s*=\s*typewriterReveal\([^,]+,\s*(\d+),\s*\{\s*left:\s*([\d.]+),\s*top:\s*([\d.]+),\s*right:\s*([\d.]+),\s*bottom:\s*([\d.]+)\s*\}/g;
  let m;
  while ((m = callRe.exec(source))) {
    const [, varName, lines, left, top, right, bottom] = m;
    calls.push({
      varName,
      lines: Number(lines),
      bounds: { left: Number(left), top: Number(top), right: Number(right), bottom: Number(bottom) },
    });
  }

  // Match each call's variable to the id(s) whose clip-path references it:
  // #id { ... clip-path: ${varName}.clipPath ... }
  for (const call of calls) {
    const idRe = new RegExp('#([\\w-]+)\\s*\\{[^}]*clip-path:\\s*\\$\\{' + call.varName + '\\.clipPath\\}', 'g');
    const ids = [];
    let idm;
    while ((idm = idRe.exec(source))) ids.push(idm[1]);
    call.ids = ids;
  }

  return calls.map((c) => ({ sceneFile, svgFile, ...c })).filter((c) => c.ids.length > 0);
}

async function main() {
  const sceneFiles = fs.readdirSync(SCENES_DIR).filter((f) => /^Scene\d+\.tsx$/.test(f));
  const allCalls = [];
  for (const f of sceneFiles) {
    const source = fs.readFileSync(path.join(SCENES_DIR, f), 'utf8');
    allCalls.push(...extractCalls(f, source));
  }

  const browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: undefined });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const tmpDir = path.join(ROOT, '.bbox-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const bySvg = new Map();
  for (const call of allCalls) {
    if (!bySvg.has(call.svgFile)) bySvg.set(call.svgFile, new Set());
    for (const id of call.ids) bySvg.get(call.svgFile).add(id);
  }

  const measured = new Map(); // svgFile -> { id -> box }
  for (const [svgFile, idSet] of bySvg) {
    const svgPath = path.join(SVG_DIR, svgFile);
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `<!DOCTYPE html><html><body style="margin:0">${svgContent.replace('<svg ', '<svg width="1920" height="1080" ')}</body></html>`;
    const tmpFile = path.join(tmpDir, svgFile.replace('.svg', '.html'));
    fs.writeFileSync(tmpFile, html);
    await page.goto({ url: 'file://' + tmpFile.replace(/\\/g, '/'), timeout: 30000 });
    const boxes = {};
    for (const id of idSet) {
      // Plain getBBox() returns the box in the element's OWN local user
      // space — i.e. BEFORE any ancestor <g transform="..."> is applied.
      // If the element (or any parent) sits inside a transformed group
      // (translate/rotate/scale, common for icon sub-parts), that local
      // box can be wildly different from where it actually renders. The
      // cursor <rect> we inject is appended at the SVG ROOT, so it needs
      // bounds in ROOT-level coordinates — map the bbox corners through
      // getCTM() (the element's full ancestor-transform chain) to get that.
      boxes[id] = await page.evaluate((elId) => {
        const el = document.getElementById(elId);
        if (!el || !el.getBBox) return null;
        const b = el.getBBox();
        const ctm = el.getCTM();
        if (!ctm) return { x: b.x, y: b.y, width: b.width, height: b.height };
        const svg = el.ownerSVGElement;
        const corners = [
          [b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height],
        ].map(([x, y]) => {
          const pt = svg.createSVGPoint();
          pt.x = x; pt.y = y;
          return pt.matrixTransform(ctm);
        });
        const xs = corners.map((p) => p.x);
        const ys = corners.map((p) => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }, id);
    }
    measured.set(svgFile, boxes);
  }

  let mismatches = 0;
  let missing = 0;
  console.log(`Checked ${allCalls.length} typewriterReveal call(s) across ${sceneFiles.length} scene file(s).\n`);
  for (const call of allCalls) {
    for (const id of call.ids) {
      const box = measured.get(call.svgFile)[id];
      if (!box) {
        console.log(`✗ ${call.sceneFile} — #${id} (${call.svgFile}): id not found in SVG (renamed/removed by a re-export?)`);
        missing++;
        continue;
      }
      const real = { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height };
      const d = {
        left: real.left - call.bounds.left,
        top: real.top - call.bounds.top,
        right: real.right - call.bounds.right,
        bottom: real.bottom - call.bounds.bottom,
      };
      const maxDiff = Math.max(...Object.values(d).map(Math.abs));
      if (maxDiff > TOLERANCE_PX) {
        console.log(`✗ ${call.sceneFile} — #${id} (${call.svgFile}): bounds drift ${maxDiff.toFixed(1)}px`);
        console.log(`    code:     { left: ${call.bounds.left}, top: ${call.bounds.top}, right: ${call.bounds.right}, bottom: ${call.bounds.bottom} }`);
        console.log(`    measured: { left: ${real.left.toFixed(2)}, top: ${real.top.toFixed(2)}, right: ${real.right.toFixed(2)}, bottom: ${real.bottom.toFixed(2)} }`);
        mismatches++;
      } else {
        console.log(`OK ${call.sceneFile} — #${id}`);
      }
    }
  }

  console.log(`\n--- ${mismatches} bounds mismatch(es), ${missing} missing id(s) out of ${allCalls.reduce((s, c) => s + c.ids.length, 0)} checked ---`);

  process.exit(0);
}

main();
