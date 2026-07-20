#!/usr/bin/env node
/**
 * audit-execution-text-freshness.js
 *
 * 4th QA audit (joins audit-scene-ids.js / audit-typewriter-bounds.js /
 * audit-dasharray-opacity.js). Execution_Text/*.txt is hand-written prose that can't be
 * fully auto-regenerated without risking clobbering careful descriptions — but its two
 * header facts ("Appears in the video at:", "Scene length:") ARE 100% derivable from
 * sceneRegistry.ts, and they're exactly what goes stale the moment a scene is added,
 * removed, or the audio changes length (every audioStartSec after the change shifts).
 * This flags that drift so it can never silently ship.
 *
 * Run as part of: node scripts/qa-review-gate.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'src', 'utils', 'sceneRegistry.ts');
const EXEC_TEXT_DIR = path.join(ROOT, 'Execution_Text');

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

function audit() {
  const scenes = extractRegistry();
  // A txt file can be shared by more than one scene (e.g. scene-20-dup reuses
  // Frame_18.svg/.txt, documented there as "OCCURRENCE 1" / "OCCURRENCE 2" with their
  // own headers each — see CLAUDE.md's "Frame_18 appears twice" note).
  const byFile = new Map();
  for (const s of scenes) {
    const txtFile = s.svgFile.replace(/\.svg$/, '.txt');
    if (!byFile.has(txtFile)) byFile.set(txtFile, []);
    byFile.get(txtFile).push(s);
  }

  const issues = [];
  for (const [txtFile, fileScenes] of byFile) {
    const filePath = path.join(EXEC_TEXT_DIR, txtFile);
    if (!fs.existsSync(filePath)) {
      issues.push(`${txtFile}: file missing for scene "${fileScenes.map((s) => s.id).join(', ')}"`);
      continue;
    }
    const text = fs.readFileSync(filePath, 'utf8');

    if (fileScenes.length === 1) {
      // Single-occurrence file: header line must match exactly.
      const scene = fileScenes[0];
      const expectedClock = secondsToClock(scene.audioStartSec);
      const appearsMatch = text.match(/appears(?:\s+in\s+the\s+video)?\s+at:\s*([\d:]+)/i);
      if (!appearsMatch) {
        issues.push(`${txtFile}: no "Appears ... at:" line found`);
      } else if (appearsMatch[1] !== expectedClock) {
        issues.push(`${txtFile}: "appears at: ${appearsMatch[1]}" but sceneRegistry.ts says ${expectedClock} (audioStartSec=${scene.audioStartSec})`);
      }

      const lengthMatch = text.match(/Scene length:\s*(\d+)\s*frames?/);
      if (!lengthMatch) {
        issues.push(`${txtFile}: no "Scene length:" line found`);
      } else if (Number(lengthMatch[1]) !== scene.durationFrames) {
        issues.push(`${txtFile}: "Scene length: ${lengthMatch[1]} frames" but sceneRegistry.ts says ${scene.durationFrames} (durationFrames)`);
      }
    } else {
      // Multi-occurrence file (shared SVG, e.g. Frame_18): the OCCURRENCE N format
      // isn't worth hardcoding for a one-off — instead just confirm each scene's
      // expected clock + frame count appear SOMEWHERE in the text.
      for (const scene of fileScenes) {
        const expectedClock = secondsToClock(scene.audioStartSec);
        if (!text.includes(expectedClock)) {
          issues.push(`${txtFile}: expected "${expectedClock}" (${scene.id}, audioStartSec=${scene.audioStartSec}) not found anywhere in the file`);
        }
        if (!text.includes(`${scene.durationFrames} frames`)) {
          issues.push(`${txtFile}: expected "${scene.durationFrames} frames" (${scene.id}) not found anywhere in the file`);
        }
      }
    }
  }

  return issues;
}

function main() {
  const issues = audit();
  if (issues.length === 0) {
    console.log('OK — every Execution_Text header matches sceneRegistry.ts.');
    process.exit(0);
  }
  console.log(`✗ ${issues.length} stale Execution_Text header(s):`);
  for (const i of issues) console.log(`    ${i}`);
  console.log('\nFix: update the header line(s) by hand to match sceneRegistry.ts (the locked source of truth).');
  process.exit(1);
}

if (require.main === module) main();
module.exports = { audit };
