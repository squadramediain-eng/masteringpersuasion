#!/usr/bin/env node
/**
 * audit-typewriter-speed-freshness.js
 *
 * 5th QA audit (joins scene-ids / typewriter-bounds / dasharray-opacity /
 * execution-text-freshness). Catches the exact failure mode found in the v12 review:
 * Execution_Text described title-typing timing using each scene's CODED interpolate()
 * window, but `typewriterReveal()`'s TYPING_SPEED_FACTOR (animationUtils.ts) compresses
 * the actual on-screen completion to a fraction of that window -- and that compression
 * factor, or any individual scene's window, can change independently of the prose
 * describing it. This computes the REAL completion frame fresh from source every run
 * (never hand-maintained) and flags any scene whose Execution_Text doesn't mention it.
 *
 * Run as part of: node scripts/qa-review-gate.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCENES_DIR = path.join(ROOT, 'src', 'scenes');
const EXEC_TEXT_DIR = path.join(ROOT, 'Execution_Text');
const ANIMATION_UTILS_PATH = path.join(ROOT, 'src', 'utils', 'animationUtils.ts');
const REGISTRY_PATH = path.join(ROOT, 'src', 'utils', 'sceneRegistry.ts');

function getSpeedFactor() {
  const src = fs.readFileSync(ANIMATION_UTILS_PATH, 'utf8');
  const m = src.match(/TYPING_SPEED_FACTOR\s*=\s*([\d.]+)/);
  if (!m) throw new Error('Could not find TYPING_SPEED_FACTOR in animationUtils.ts');
  return Number(m[1]);
}

function getSceneToSvgMap() {
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const entryRe = /id:\s*'([\w-]+)'[\s\S]*?svgFile:\s*'([\w.]+)'/g;
  const map = new Map();
  let m;
  while ((m = entryRe.exec(src))) map.set(m[1], m[2].replace(/\.svg$/, '.txt'));
  return map;
}

// Mirrors extractCalls() in audit-typewriter-bounds.js's call-finding regex, but only
// needs the progress-variable's own interpolate() window, not the bounds object.
function extractWindows(tsxSrc) {
  const windows = [];
  const callRe = /const\s+\w+\s*=\s*typewriterReveal\((\w+),/g;
  let m;
  while ((m = callRe.exec(tsxSrc))) {
    const progressVar = m[1];
    const interpRe = new RegExp(`const\\s+${progressVar}\\s*=\\s*interpolate\\(frame,\\s*\\[(\\d+),\\s*(\\d+)\\]`);
    const im = tsxSrc.match(interpRe);
    if (im) windows.push({ start: Number(im[1]), end: Number(im[2]) });
    // Scene18's titleReveal uses a `titleRevealRange` PROP (default [20, 400], overridden
    // per-instance e.g. by Scene20Dup in MainComposition.tsx) -- not a fixed literal, can't
    // be resolved by this regex. Skipped rather than guessed; both occurrences were
    // verified by hand during the v12 prose pass (see Execution_Text/Frame_18.txt).
  }
  return windows;
}

function audit() {
  const SPEED = getSpeedFactor();
  const sceneToTxt = getSceneToSvgMap();
  const sceneFiles = fs.readdirSync(SCENES_DIR).filter((f) => /^Scene\d+\.tsx$/.test(f));
  const issues = [];

  for (const sceneFile of sceneFiles) {
    if (sceneFile === 'SceneTemplate.tsx') continue;
    const tsxSrc = fs.readFileSync(path.join(SCENES_DIR, sceneFile), 'utf8');
    if (tsxSrc.includes('titleRevealRange')) continue; // Scene18: prop-based, see note above
    const windows = extractWindows(tsxSrc);
    if (windows.length === 0) continue;

    const sceneNum = sceneFile.match(/Scene(\d+)\.tsx/)[1];
    const sceneId = `scene-${sceneNum}`;
    const txtFile = sceneToTxt.get(sceneId);
    if (!txtFile) continue; // not in registry (e.g. unused template numbering)
    const txtPath = path.join(EXEC_TEXT_DIR, txtFile);
    if (!fs.existsSync(txtPath)) {
      issues.push(`${sceneFile}: Execution_Text file ${txtFile} missing`);
      continue;
    }
    const text = fs.readFileSync(txtPath, 'utf8');

    for (const { start, end } of windows) {
      const expected = Math.round(start + (end - start) / SPEED);
      if (!text.includes(`frame ${expected}`) && !text.includes(`~frame ${expected}`)) {
        issues.push(`${txtFile} (${sceneFile}): window [${start},${end}] at SPEED=${SPEED} completes at frame ${expected}, not mentioned anywhere in the file`);
      }
    }
  }

  return issues;
}

function main() {
  const issues = audit();
  if (issues.length === 0) {
    console.log('OK — every Execution_Text title-typing description matches the live TYPING_SPEED_FACTOR.');
    process.exit(0);
  }
  console.log(`✗ ${issues.length} stale typewriter-speed description(s):`);
  for (const i of issues) console.log(`    ${i}`);
  console.log('\nFix: update the "fully typed by ~frame N" line(s) to match. Formula: start + (end-start)/SPEED.');
  process.exit(1);
}

if (require.main === module) main();
module.exports = { audit };
