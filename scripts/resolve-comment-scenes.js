#!/usr/bin/env node
/**
 * resolve-comment-scenes.js
 *
 * Fills in scene_id + local_frame for every comment in feedback/v{N}-comments.json,
 * by matching each comment's timecode_sec against the CURRENT src/utils/sceneRegistry.ts
 * (regex-extracted fresh every run — never cached). This is what makes the whole
 * review system survive scenes being added/removed or the audio changing length: if
 * every audioStartSec shifts, re-running this against the same stored timecodes
 * re-assigns everything correctly with no manual frame-math.
 *
 * Usage: node scripts/resolve-comment-scenes.js [v12]   (defaults to feedback/.current-round)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'src', 'utils', 'sceneRegistry.ts');
const FPS = 30;

function extractRegistry() {
  // Strip // line-comments first -- a commented-out example entry (e.g. the template's
  // placeholder SCENE_REGISTRY) must never be mistaken for a real scene.
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const entryRe = /id:\s*'([\w-]+)'[\s\S]*?audioStartSec:\s*(\d+)[\s\S]*?durationFrames:\s*(\d+)/g;
  const scenes = [];
  let m;
  while ((m = entryRe.exec(src))) {
    const [, id, audioStartSec, durationFrames] = m;
    scenes.push({ id, audioStartSec: Number(audioStartSec), durationFrames: Number(durationFrames) });
  }
  return scenes;
}

function resolveScene(scenes, timecodeSec) {
  for (const s of scenes) {
    const start = s.audioStartSec;
    const end = s.audioStartSec + s.durationFrames / FPS;
    if (timecodeSec >= start && timecodeSec < end) {
      return { scene_id: s.id, local_frame: Math.round((timecodeSec - start) * FPS) };
    }
  }
  return null;
}

function main() {
  const round = process.argv[2] || fs.readFileSync(path.join(ROOT, 'feedback', '.current-round'), 'utf8').trim();
  const ledgerPath = path.join(ROOT, 'feedback', `${round}-comments.json`);
  if (!fs.existsSync(ledgerPath)) {
    console.error(`Not found: ${ledgerPath}. Run import-review-comments.js first.`);
    process.exit(1);
  }

  const scenes = extractRegistry();
  if (scenes.length === 0) {
    console.error('Could not extract any scenes from sceneRegistry.ts — check the regex still matches the file format.');
    process.exit(1);
  }

  const comments = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  let resolved = 0;
  const unresolved = [];
  for (const c of comments) {
    const hit = resolveScene(scenes, c.timecode_sec);
    if (hit) {
      c.scene_id = hit.scene_id;
      c.local_frame = hit.local_frame;
      c.status = 'resolved';
      resolved++;
    } else {
      c.scene_id = 'UNRESOLVED';
      c.local_frame = null;
      c.status = 'unresolved';
      unresolved.push(c);
    }
  }

  fs.writeFileSync(ledgerPath, JSON.stringify(comments, null, 2), 'utf8');

  console.log(`Resolved ${resolved}/${comments.length} comment(s) against ${scenes.length} scenes in sceneRegistry.ts.`);
  if (unresolved.length) {
    console.log(`\n${unresolved.length} comment(s) fell in an inter-scene gap or outside all scenes — assign scene_id by hand in ${path.relative(ROOT, ledgerPath)}:`);
    for (const c of unresolved) {
      console.log(`  ${c.id}  @${c.raw_timecode}  "${c.text}"`);
    }
  }
  console.log(`\nNext: node scripts/sync-review-to-execution-text.js ${round}`);
}

main();
