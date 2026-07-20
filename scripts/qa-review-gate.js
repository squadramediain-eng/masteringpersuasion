#!/usr/bin/env node
/**
 * qa-review-gate.js
 *
 * The "is this round actually done" check. Hard-gates npm run render / npm run build
 * via the prerender/prebuild npm lifecycle hooks (see package.json) — exits 1 (blocking
 * the parent command) unless:
 *   1. every "## Review — vN" item across every Execution_Text file is checked off
 *      ([x] FIXED / [x] WONTFIX / [~] NEEDS-CLARIFICATION all count; bare [ ] blocks)
 *   2. all 4 audits pass: scene-ids, typewriter-bounds, dasharray-opacity, and the new
 *      execution-text-freshness check
 *
 * This does NOT claim to verify a fix looks visually correct — that's a fast
 * `npx remotion still` eyeball pass, not something this script can judge. It verifies
 * completeness (nothing left unaddressed) and the 4 mechanically-checkable bug classes.
 *
 * Usage: node scripts/qa-review-gate.js [v12]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EXEC_TEXT_DIR = path.join(ROOT, 'Execution_Text');

function countOpenItems(round) {
  const heading = `## Review — ${round}`;
  const files = fs.readdirSync(EXEC_TEXT_DIR).filter((f) => f.endsWith('.txt'));
  let open = 0, closed = 0;
  const openByFile = {};
  for (const f of files) {
    const text = fs.readFileSync(path.join(EXEC_TEXT_DIR, f), 'utf8');
    const idx = text.indexOf(heading);
    if (idx === -1) continue;
    // Section runs from this heading to the next "## " heading or end of file.
    const rest = text.slice(idx + heading.length);
    const nextHeading = rest.search(/\n## /);
    const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
    const openLines = section.match(/^- \[ \] /gm) || [];
    const closedLines = section.match(/^- \[[x~]\] /gm) || [];
    open += openLines.length;
    closed += closedLines.length;
    if (openLines.length) openByFile[f] = openLines.length;
  }
  return { open, closed, openByFile };
}

function runAudit(label, scriptName, args = []) {
  const result = spawnSync('node', [path.join(__dirname, scriptName), ...args], { cwd: ROOT, encoding: 'utf8' });
  const pass = result.status === 0;
  return { label, pass, output: (result.stdout || '') + (result.stderr || '') };
}

function main() {
  const round = process.argv[2] || (
    fs.existsSync(path.join(ROOT, 'feedback', '.current-round'))
      ? fs.readFileSync(path.join(ROOT, 'feedback', '.current-round'), 'utf8').trim()
      : null
  );

  console.log('═'.repeat(60));
  console.log(' QA REVIEW GATE' + (round ? ` — ${round}` : ''));
  console.log('═'.repeat(60));

  let allPass = true;

  if (round) {
    const { open, closed, openByFile } = countOpenItems(round);
    console.log(`\nReview comments: ${closed} addressed, ${open} open`);
    if (open > 0) {
      allPass = false;
      for (const [f, n] of Object.entries(openByFile)) console.log(`    ${f}: ${n} open`);
    }
  } else {
    console.log('\nNo round specified and no feedback/.current-round found — skipping comment check.');
  }

  console.log('\nAudits:');
  const audits = [
    runAudit('Scene-id wiring', 'audit-scene-ids.js'),
    runAudit('Font & text integrity', 'audit-fonts.js'),
    runAudit('Typewriter cursor bounds', 'audit-typewriter-bounds.js'),
    runAudit('Dasharray/opacity', 'audit-dasharray-opacity.js'),
    runAudit('Execution_Text freshness', 'audit-execution-text-freshness.js'),
    runAudit('Typewriter-speed freshness', 'audit-typewriter-speed-freshness.js'),
    // Every cue must still resolve and its 'at' be current — otherwise motion.ts silently
    // animates to a stale time after someone edits a cue phrase without rebuilding.
    runAudit('Narration cue freshness', 'build-audio-cues.js', ['--check']),
  ];
  for (const a of audits) {
    console.log(`  ${a.pass ? 'PASS' : 'FAIL'}  ${a.label}`);
    if (!a.pass) {
      allPass = false;
      console.log(a.output.split('\n').map((l) => `    ${l}`).join('\n'));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(allPass ? ' GATE: PASS — clear to render' : ' GATE: FAIL — fix the above before rendering');
  console.log('═'.repeat(60));
  process.exit(allPass ? 0 : 1);
}

main();
