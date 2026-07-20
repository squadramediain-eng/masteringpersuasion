#!/usr/bin/env node
/**
 * sync-review-to-execution-text.js
 *
 * One-time per round. Appends a "## Review — vN" checklist to each affected scene's
 * Execution_Text/Frame_XX.txt, seeded from feedback/v{N}-comments.json. From there the
 * checklist is a human-owned record — open it, fix the code, check the item off with a
 * one-line resolution note, directly in the file. Re-running this script for the same
 * round is safe: if a "## Review — vN" heading already exists in a file it's skipped
 * (warned, not duplicated) so in-progress check-offs are never overwritten.
 *
 * Three valid resolutions once you've looked at an item:
 *   - [x] FIXED: <what changed, e.g. "reordered icon4 before the line, Scene02.tsx">
 *   - [x] WONTFIX: <reason it's not actually a bug>
 *   - [~] NEEDS-CLARIFICATION: <question for the reviewer>
 * All three count as "addressed" for the QA gate — only a bare "- [ ]" blocks it.
 *
 * Usage: node scripts/sync-review-to-execution-text.js [v12]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'src', 'utils', 'sceneRegistry.ts');
const EXEC_TEXT_DIR = path.join(ROOT, 'Execution_Text');
const FPS = 30;

function extractRegistry() {
  // Strip // line-comments first -- a commented-out example entry (e.g. the template's
  // placeholder SCENE_REGISTRY) must never be mistaken for a real scene.
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const entryRe = /id:\s*'([\w-]+)'[\s\S]*?svgFile:\s*'([\w.]+)'[\s\S]*?audioStartSec:\s*(\d+)[\s\S]*?durationFrames:\s*(\d+)/g;
  const scenes = [];
  let m;
  while ((m = entryRe.exec(src))) {
    const [, id, svgFile, audioStartSec, durationFrames] = m;
    scenes.push({ id, svgFile, audioStartSec: Number(audioStartSec), durationFrames: Number(durationFrames) });
  }
  return scenes;
}

function secondsToClock(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function main() {
  const round = process.argv[2] || fs.readFileSync(path.join(ROOT, 'feedback', '.current-round'), 'utf8').trim();
  const ledgerPath = path.join(ROOT, 'feedback', `${round}-comments.json`);
  if (!fs.existsSync(ledgerPath)) {
    console.error(`Not found: ${ledgerPath}. Run import + resolve first.`);
    process.exit(1);
  }

  const comments = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const resolved = comments.filter((c) => c.scene_id && c.scene_id !== 'UNRESOLVED');
  if (resolved.length === 0) {
    console.log('No resolved comments to sync. Run resolve-comment-scenes.js first.');
    return;
  }

  const scenesById = new Map(extractRegistry().map((s) => [s.id, s]));
  const today = new Date().toISOString().slice(0, 10);
  const heading = `## Review — ${round} (${today})`;

  // Group by the Execution_Text FILE (svgFile), not scene_id directly — scene-20-dup
  // shares Frame_18.svg/.txt with scene-18, so both land in the same file, each line
  // still labelled with its own scene_id so the shared file stays unambiguous.
  const byFile = new Map();
  for (const c of resolved) {
    const scene = scenesById.get(c.scene_id);
    if (!scene) {
      console.warn(`Comment ${c.id}: scene_id "${c.scene_id}" not found in sceneRegistry.ts, skipping.`);
      continue;
    }
    const txtFile = scene.svgFile.replace(/\.svg$/, '.txt');
    if (!byFile.has(txtFile)) byFile.set(txtFile, []);
    byFile.get(txtFile).push(c);
  }

  let written = 0, skipped = 0;
  for (const [txtFile, items] of byFile) {
    const filePath = path.join(EXEC_TEXT_DIR, txtFile);
    if (!fs.existsSync(filePath)) {
      console.warn(`${txtFile} does not exist in Execution_Text/ — skipping ${items.length} comment(s).`);
      continue;
    }
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing.includes(heading)) {
      console.log(`${txtFile}: "${heading}" already present, skipping (safe re-run).`);
      skipped++;
      continue;
    }
    // extras/video-review.html adds label/region/author on top of the frame.io fields.
    // Surface them here or they never reach the person (or Claude) doing the fix: a region
    // box is often the only thing that says WHICH element the reviewer meant.
    const extra = (c) => {
      const bits = [];
      if (c.label) bits.push(c.label);
      const pct = (n) => Math.round(n * 100);
      if (c.region) bits.push(`box @ ${pct(c.region.x)},${pct(c.region.y)} ${pct(c.region.w)}×${pct(c.region.h)}% of frame`);
      if (c.drawing && c.drawing.length) {
        // bounding box of all freehand strokes — enough to point Claude at the right area
        let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
        for (const st of c.drawing) for (const p of st) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
        bits.push(`freehand mark (${c.drawing.length} stroke${c.drawing.length > 1 ? 's' : ''}) around ${pct(x0)},${pct(y0)}–${pct(x1)},${pct(y1)}% of frame`);
      }
      if (c.author) bits.push(`by ${c.author}`);
      return bits.length ? ` [${bits.join(' · ')}]` : '';
    };
    const lines = items
      .sort((a, b) => a.timecode_sec - b.timecode_sec)
      .map((c) => `- [ ] (${c.scene_id}, local frame ${c.local_frame} / ${secondsToClock(c.timecode_sec)}) "${c.text}"${extra(c)}`);
    const block = `\n${heading}\n${lines.join('\n')}\n`;
    fs.appendFileSync(filePath, block, 'utf8');
    console.log(`${txtFile}: appended ${items.length} item(s).`);
    written++;
  }

  console.log(`\n${written} file(s) updated, ${skipped} already had this round's section.`);
  console.log('Next: fix each scene, checking items off directly in its Execution_Text file.');
  console.log(`Then: node scripts/qa-review-gate.js ${round}`);
}

main();
