#!/usr/bin/env node
/**
 * import-review-comments.js
 *
 * Parses a frame.io CSV comment export into feedback/v{N}-comments.json.
 * CSV, not PDF/XLSX: frame.io's PDF export bakes the per-comment timecode into a
 * screenshot image (no cheap way to read it back); CSV needs zero new dependency
 * (plain split-on-comma + quote handling, same lazy approach as the rest of this
 * folder) and carries the timecode as real text.
 *
 * Usage: node scripts/import-review-comments.js <export.csv> v12
 *
 * Column matching is name-tolerant (case-insensitive substring match) since the
 * exact frame.io export schema hasn't been confirmed against a real file yet —
 * adjust TIMECODE_HEADER_RE / TEXT_HEADER_RE below after the first real run if
 * frame.io's actual column names differ.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FPS = 30; // locked project framerate (src/utils/sceneRegistry.ts)

const TIMECODE_HEADER_RE = /timecode|time code|\btc\b/i;
const TEXT_HEADER_RE = /comment|note|text|feedback/i;

function parseCsv(raw) {
  // Minimal RFC4180-ish parser: handles quoted fields with embedded commas/newlines
  // and "" escaped quotes. No library needed for this — frame.io's export is a
  // simple flat table.
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuotes) {
      if (c === '"') {
        if (raw[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function timecodeToSeconds(tc) {
  // frame.io format HH:MM:SS:FF (confirmed against this project's actual exports,
  // e.g. "00:00:26:24") — FF is a frame number at FPS, not decimal seconds.
  const m = tc.trim().match(/^(\d+):(\d+):(\d+)[:;](\d+)$/);
  if (!m) return null;
  const [, h, mi, s, f] = m.map(Number);
  return h * 3600 + mi * 60 + s + f / FPS;
}

function main() {
  const [, , csvPath, round] = process.argv;
  if (!csvPath || !round) {
    console.error('Usage: node scripts/import-review-comments.js <export.csv> v12');
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(raw);
  if (rows.length < 2) {
    console.error('CSV has no data rows.');
    process.exit(1);
  }

  const header = rows[0];
  const tcCol = header.findIndex((h) => TIMECODE_HEADER_RE.test(h));
  const textCol = header.findIndex((h) => TEXT_HEADER_RE.test(h));
  if (tcCol === -1 || textCol === -1) {
    console.error(`Could not find timecode/comment columns in header: ${header.join(', ')}`);
    console.error('Adjust TIMECODE_HEADER_RE / TEXT_HEADER_RE in this script to match.');
    process.exit(1);
  }

  const comments = [];
  let skipped = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawTc = (r[tcCol] || '').trim();
    const text = (r[textCol] || '').trim();
    if (!rawTc || !text) continue;
    const seconds = timecodeToSeconds(rawTc);
    if (seconds === null) { skipped++; continue; }
    comments.push({
      id: `c${comments.length + 1}`,
      raw_timecode: rawTc,
      timecode_sec: Math.round(seconds * 100) / 100,
      text,
      scene_id: null,
      local_frame: null,
      status: 'unresolved',
    });
  }

  const feedbackDir = path.join(ROOT, 'feedback');
  fs.mkdirSync(feedbackDir, { recursive: true });
  const outPath = path.join(feedbackDir, `${round}-comments.json`);
  fs.writeFileSync(outPath, JSON.stringify(comments, null, 2), 'utf8');
  fs.writeFileSync(path.join(feedbackDir, '.current-round'), round, 'utf8');

  console.log(`Imported ${comments.length} comment(s) -> ${path.relative(ROOT, outPath)}`);
  if (skipped) console.log(`Skipped ${skipped} row(s) with an unparseable timecode.`);
  console.log(`Next: node scripts/resolve-comment-scenes.js ${round}`);
}

main();
