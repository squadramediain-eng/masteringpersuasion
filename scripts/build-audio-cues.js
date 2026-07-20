#!/usr/bin/env node
// ─── build-audio-cues.js ──────────────────────────────────────────────────────
// Resolves each element's narration cue into a real time, so elements land WHEN
// the voiceover says them instead of all front-loading into the first 2 seconds.
//
//   public/animation/audio-cues.json   authored: element -> { cue: "<phrase>" }
//   public/audio/vo-words.json         word timings (whisper base.en, in-repo)
//
// This script fills in "at" (seconds from the SCENE's start) for every cue by
// locating the phrase in the voiceover. motion.ts reads "at" and overrides the
// guider's startMs. Re-run after editing any cue phrase.
//
//   node scripts/build-audio-cues.js          # resolve + write
//   node scripts/build-audio-cues.js --check  # verify only, non-zero on drift
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CUES = path.join(ROOT, 'public/animation/audio-cues.json');
const VO = path.join(ROOT, 'public/audio/vo-words.json');
const SPEC = path.join(ROOT, 'public/animation/animation.json');

const check = process.argv.includes('--check');
const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const vo = JSON.parse(fs.readFileSync(VO, 'utf8'));
const cues = JSON.parse(fs.readFileSync(CUES, 'utf8'));

// Strip every non-alphanumeric so a token like "ship's" -> "ships" stays ONE slot.
// (Replacing with a space instead silently breaks any phrase with an apostrophe.)
const tok = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const hay = vo.words.map((x) => tok(x.w));

// Whisper splits hyphenated words across two tokens ("master" + "-pilot", "high" + "-stakes")
// but keeps apostrophes inside one ("We'll"). So split the needle on whitespace AND hyphens,
// never on apostrophes, or any hyphenated cue silently fails to match.
const needleTokens = (phrase) => phrase.split(/[\s‐-―-]+/).map(tok).filter(Boolean);

function findPhrase(phrase, afterSec) {
  const need = needleTokens(phrase);
  for (let i = 0; i + need.length <= hay.length; i++) {
    if (vo.words[i].t < afterSec) continue;
    let ok = true;
    for (let k = 0; k < need.length; k++) if (hay[i + k] !== need[k]) { ok = false; break; }
    if (ok) return vo.words[i].t;
  }
  return null;
}

const frameOf = (file) => spec.frames.find((f) => f.file.split('/').pop() === file);

// Every cue is keyed by an SVG id. If a re-export renames or drops that id, the cue silently
// stops applying and the element quietly reverts to the guider's canned stagger — a
// regression nothing else would catch. So check the id still exists in the artwork.
// `text_N` is synthetic (motion.ts names bare <text> nodes in document order), so skip those.
const svgIds = {};
function idsIn(file) {
  if (svgIds[file]) return svgIds[file];
  const p = path.join(ROOT, 'src/assets/scenes', file);
  if (!fs.existsSync(p)) return (svgIds[file] = null);
  const svg = fs.readFileSync(p, 'utf8');
  return (svgIds[file] = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
}

let resolved = 0, failed = 0, changed = 0;
const problems = [];
const warnings = [];

for (const [file, els] of Object.entries(cues.frames || {})) {
  const f = frameOf(file);
  if (!f) { problems.push(file + ': not in animation.json'); failed++; continue; }
  const ids = idsIn(file);
  for (const [id, c] of Object.entries(els)) {
    if (ids && !ids.has(id) && !/^text_\d+$/.test(id)) {
      problems.push(file + ' ' + id + ': no element with this id in the SVG — renamed or dropped by a re-export? The cue would be silently ignored.');
      failed++; continue;
    }
    if (typeof c.at === 'number' && !c.cue) { resolved++; continue; } // explicit hand-set time
    if (!c.cue) { problems.push(file + ' ' + id + ': no cue and no at'); failed++; continue; }

    // search from just before the scene opens so a cue spoken over the cut still matches
    const abs = findPhrase(c.cue, f.startSec - 2);
    if (abs === null) { problems.push(file + ' ' + id + ': phrase not found -> "' + c.cue + '"'); failed++; continue; }

    const rel = +(abs - f.startSec).toFixed(2);
    // The narration often leads the cut by a hair (a phrase starting 0.02s before the scene
    // opens is still that scene's line), so tolerate a small negative and clamp to 0 below.
    if (rel < -0.75 || rel > f.durationSec) {
      problems.push(file + ' ' + id + ': cue at +' + rel + 's falls OUTSIDE the ' + f.durationSec + 's scene -> "' + c.cue + '"');
      failed++; continue;
    }
    const lead = typeof c.lead === 'number' ? c.lead : 0;   // negative = land before the word
    const at = +Math.max(0, rel + lead).toFixed(2);

    // SceneWrapper fades the scene out over its last 30 frames (1s). An element cued that
    // late enters straight into the fade — visible for a blink, then gone. Warn, don't fail.
    const fadeStartsAt = f.durationSec - 1;
    if (at + 0.7 > fadeStartsAt) {
      warnings.push(file + ' ' + id + ': cued at +' + at + 's, but the scene fades out at +' + fadeStartsAt.toFixed(1) + 's — it would enter into the fade');
    }
    if (c.at !== at) changed++;
    c.at = at;
    resolved++;
  }
}

console.log('cues resolved: ' + resolved + ' | failed: ' + failed + ' | changed: ' + changed + ' | warnings: ' + warnings.length);
if (problems.length) {
  console.log('\nproblems:');
  problems.forEach((p) => console.log('  ✗ ' + p));
}
if (warnings.length) {
  console.log('\nwarnings:');
  warnings.forEach((w) => console.log('  ! ' + w));
}
if (check) {
  if (failed || changed) { console.log('\n--check: FAIL (' + failed + ' unresolved, ' + changed + ' stale)'); process.exit(1); }
  console.log('--check: OK — every cue resolves and is up to date');
  process.exit(0);
}
if (failed) { console.log('\nNot written — fix the cue phrases above first.'); process.exit(1); }
fs.writeFileSync(CUES, JSON.stringify(cues, null, 1) + '\n');
console.log('\nwrote ' + path.relative(ROOT, CUES));
