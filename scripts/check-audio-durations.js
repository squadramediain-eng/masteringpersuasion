#!/usr/bin/env node
/**
 * check-audio-durations.js
 *
 * Scans public/audio/ for MP3 files, measures their duration using ffprobe,
 * and prints a report showing which scenes have audio and their frame counts.
 *
 * Usage: npm run check-audio
 * Requires: ffprobe (install via ffmpeg)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
const FPS = 30;

console.log('\nAudio Duration Check\n');
console.log('─'.repeat(65));

// Check ffprobe is available
try {
  execSync('ffprobe -version', { stdio: 'ignore' });
} catch {
  console.error('❌ ffprobe not found. Install ffmpeg: https://ffmpeg.org/download.html');
  process.exit(1);
}

// Scan audio directory
if (!fs.existsSync(AUDIO_DIR)) {
  console.error(`❌ Audio directory not found: ${AUDIO_DIR}`);
  console.log('Create it with: mkdir -p public/audio');
  process.exit(1);
}

const files = fs.readdirSync(AUDIO_DIR)
  .filter(f => f.endsWith('.mp3'))
  .sort();

if (files.length === 0) {
  console.log('No MP3 files found in public/audio/');
  console.log('Add your voiceover file(s), e.g. scene-01.mp3, scene-02.mp3, or one continuous voiceover.mp3.\n');
  process.exit(0);
}

let totalSeconds = 0;
const results = [];

for (const file of files) {
  const filePath = path.join(AUDIO_DIR, file);
  try {
    const output = execSync(
      `ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { encoding: 'utf8' }
    ).trim();
    const seconds = parseFloat(output);
    const frames = Math.ceil(seconds * FPS);
    totalSeconds += seconds;
    results.push({ file, seconds, frames });
    console.log(`  ✅ ${file.padEnd(20)} ${seconds.toFixed(2).padStart(7)}s  →  ${String(frames).padStart(5)} frames`);
  } catch {
    results.push({ file, seconds: null, frames: null });
    console.log(`  ❌ ${file.padEnd(20)} Could not read duration`);
  }
}

console.log('─'.repeat(65));
console.log(`  Total audio: ${totalSeconds.toFixed(2)}s  →  ${Math.ceil(totalSeconds * FPS)} frames (${(totalSeconds / 60).toFixed(1)} min)`);
console.log('\n📋 Copy these durationSeconds values into sceneRegistry.ts:\n');

for (const r of results) {
  if (r.seconds !== null) {
    const sceneId = r.file.replace('.mp3', '');
    console.log(`  { id: '${sceneId}', durationSeconds: ${r.seconds.toFixed(2)}, durationFrames: ${r.frames} },`);
  }
}

console.log('\n💡 Tip: After updating sceneRegistry.ts, run npx remotion studio to preview.\n');
