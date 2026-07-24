#!/usr/bin/env node
'use strict';
// Inlines the word-level voiceover transcript into extras/video-review.html so the offline
// review tool is a SINGLE self-contained file (fetch() does not work from file://). We REUSE
// the transcript we already generate for the film — public/audio/vo-words.json (Whisper
// base.en, word timings) — never a second copy. Re-run this ONLY when the voiceover is re-cut.
//
//   node scripts/build-review-transcript.js
//
// It replaces the block between the /* VO_WORDS_START */ … /* VO_WORDS_END */ markers with a
// compact [t, e, "word"] array. Compact tuples keep the inlined payload roughly half the size
// of the source JSON.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'public', 'audio', 'vo-words.json');
const htmlPath = path.join(root, 'extras', 'video-review.html');

const words = JSON.parse(fs.readFileSync(srcPath, 'utf8')).words;
if (!Array.isArray(words) || !words.length) {
  console.error('vo-words.json has no words — aborting.');
  process.exit(1);
}

const compact = words.map(function (w) { return [w.t, w.e, w.w]; });
const payload = 'var VO_WORDS = ' + JSON.stringify(compact) + ';';

let html = fs.readFileSync(htmlPath, 'utf8');
const re = /\/\* VO_WORDS_START \*\/[\s\S]*?\/\* VO_WORDS_END \*\//;
if (!re.test(html)) {
  console.error('Could not find the /* VO_WORDS_START */ … /* VO_WORDS_END */ markers in video-review.html.');
  process.exit(1);
}
html = html.replace(re, '/* VO_WORDS_START */\n  ' + payload + '\n  /* VO_WORDS_END */');
fs.writeFileSync(htmlPath, html);

console.log('Inlined ' + compact.length + ' words into extras/video-review.html.');
