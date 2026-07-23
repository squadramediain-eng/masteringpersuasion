#!/usr/bin/env node
/* ============================================================
   audit-motion.js — the QA check the gate was missing: RENDERED MOTION.

   Every other audit is static (ids, fonts, cues, metrics). None of them can see
   a frozen hold ("looks like a PowerPoint", CLAUDE.md RULE 0) or jittering
   ambient ("stuck bubbles/waves") — because those only exist in the pixels. This
   analyses the actual rendered film, per scene, and flags both.

   For each scene it samples a mid-scene HOLD (55-70% through, past the build) at
   10fps and measures frame-to-frame change (ffmpeg tblend difference -> YAVG):
     FROZEN   mean motion < 0.10  — the scene sits static, reads as slides. FAIL.
     JITTER   a fast up-down-up reversal signature — motion bouncing every frame
              rather than drifting. Flags the "stuck/vibrating" ambient class. WARN.
   Also reports each scene's number so a bad one is named, not just counted.

   Usage:  node scripts/audit-motion.js [path-to.mp4]
           (defaults to out/mastering_persuasion_v8.mp4)
   Slow by design — it renders nothing, but it decodes video. Run before shipping
   a cut, or wire into `npm run qa-motion`.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FROZEN = 0.10;   // below this, the hold is effectively static
const video = process.argv[2] || path.join(ROOT, 'out', 'mastering_persuasion_v8.mp4');

if (!fs.existsSync(video)) {
  console.error(`audit-motion: no render at ${video} — render first, or pass a path.`);
  process.exit(2);
}

// Find ffmpeg: PATH first, then the known winget location.
function ffmpegBin() {
  const cands = ['ffmpeg', 'C:\\Users\\Squadra_01\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe'];
  for (const c of cands) {
    try { execFileSync(c, ['-version'], { stdio: 'ignore' }); return c; } catch (e) { /* next */ }
  }
  console.error('audit-motion: ffmpeg not found on PATH.');
  process.exit(2);
}
const FF = ffmpegBin();

// Scene windows from sceneRegistry.
function scenes() {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/sceneRegistry.ts'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const re = /svgFile:\s*'([\w.]+)'[\s\S]*?audioStartSec:\s*(\d+)[\s\S]*?durationFrames:\s*(\d+)/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ file: m[1], start: +m[2], dur: +m[3] / 30 });
  return out;
}

// Sample a scene's mid-hold and return the per-frame motion series.
function motionSeries(startSec, lenSec) {
  // signalstats metadata prints to the log (stderr), so capture both streams.
  const r = spawnSync(FF, [
    '-v', 'info', '-ss', String(startSec), '-i', video, '-t', String(lenSec),
    '-vf', 'fps=10,scale=320:-1,tblend=all_mode=difference,signalstats,metadata=print',
    '-f', 'null', '-',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  return [...out.matchAll(/YAVG=([\d.]+)/g)].map((x) => +x[1]);
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
// Jitter = fraction of frames where motion reverses direction (up then down). A
// smooth drift barely reverses; a vibrating element reverses almost every frame.
function jitterRatio(a) {
  let rev = 0;
  for (let i = 2; i < a.length; i++) {
    const d1 = a[i - 1] - a[i - 2], d2 = a[i] - a[i - 1];
    if (d1 * d2 < 0 && Math.abs(d2) > 0.04) rev++;
  }
  return a.length > 3 ? rev / (a.length - 2) : 0;
}

const problems = [];
const rows = [];
let n = 0;
for (const s of scenes()) {
  // Mid-hold window: 55-70% through the scene, but never in the last 2s (exit).
  const holdStart = s.start + Math.min(s.dur * 0.55, s.dur - 3);
  const holdLen = Math.max(1.5, Math.min(s.dur * 0.15, s.dur - 3 - (holdStart - s.start)));
  if (holdLen < 1) { n++; continue; }
  const series = motionSeries(holdStart, holdLen);
  const mo = mean(series);
  const ji = jitterRatio(series);
  const flags = [];
  if (mo < FROZEN) { flags.push('FROZEN'); problems.push(`scene ${String(n).padStart(2)} (${s.file}): hold is FROZEN (motion ${mo.toFixed(3)} < ${FROZEN}) — reads as a static slide (RULE 0).`); }
  if (ji > 0.55) { flags.push('JITTER'); problems.push(`scene ${String(n).padStart(2)} (${s.file}): hold JITTERS (${(ji * 100).toFixed(0)}% frames reverse) — ambient/element vibrating in place.`); }
  rows.push(`  scene ${String(n).padStart(2)}  ${s.file.padEnd(14)} motion=${mo.toFixed(3)}  jitter=${(ji * 100).toFixed(0)}%  ${flags.join(' ') || 'ok'}`);
  n++;
}

console.log('\nRENDERED-MOTION AUDIT (per-scene mid-hold)\n');
console.log(rows.join('\n'));
if (problems.length) {
  console.error(`\naudit-motion: ${problems.length} scene(s) FAIL:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\naudit-motion: every scene\'s hold is alive and drifting — no frozen or jittering scenes.');
