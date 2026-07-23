#!/usr/bin/env node
/* ============================================================
   build-execution-text.js — regenerate Execution_Text/*.txt as-built.

   These files are the per-scene choreography record. They had drifted badly:
   they still described mp_v1 artwork ("ICON — helm", "CONCEPT CIRCLE") that no
   longer exists, listed SHIP twice, said the exit was a cross-fade (it slides
   now), and told the animator to "adjust once voiceover.mp3 is in place" — it
   has been in place since the timeline was locked.

   Regenerating beats hand-editing because the frames get replaced wholesale
   every Claude Design round, so any hand-written element list is stale within a
   day. Everything here is derived from what the render actually reads:
     src/utils/sceneRegistry.ts        header facts (audited)
     src/assets/scenes/*.svg           the real elements, in motion.ts's order
     public/animation/animation.json   spec timing / idle / orbit
     public/animation/audio-cues.json  narration cues (currently empty)
     public/animation/text-metrics.json which text types on
     public/animation/frame-overrides.json  local corrections

   PRESERVES any "## Review — vN" section (seeded by
   sync-review-to-execution-text.js) — those are review state, not derived, and
   would be destroyed by a naive rewrite.

   Usage:  node scripts/build-execution-text.js [--check]
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'src', 'assets', 'scenes');
const OUT_DIR = path.join(ROOT, 'Execution_Text');
const CHECK = process.argv.includes('--check');

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const SPEC = readJson('public/animation/animation.json');
const CUES = readJson('public/animation/audio-cues.json').frames || {};
const METRICS = readJson('public/animation/text-metrics.json');
const OVERRIDES = readJson('public/animation/frame-overrides.json').frames || {};

// Mirrors motion.ts — keep in step or this file describes a render that does not happen.
const SKIP_IDS = /^(bg|background)$|^wave/i;
const JUNK = /__|clip|grad|mask|filter|linear-gradient|radial-gradient|^SVGID|^XMLID/i;
const NO_IDLE = new Set(['text', 'background', 'ambient', 'arrow', 'alert']);
const DEFAULT_IDLE = {
  ship: '9.0px / 4.8s', character: '5.0px / 4.2s', icon: '4.5px / 4.6s',
  card: '2.6px / 6.0s', circle: '4.0px / 5.2s', prop: '4.0px / 5.0s',
  decor: '3.0px / 6.6s', stat: '3.4px / 5.4s', numeral: '3.0px / 6.0s',
  watermark: '3.4px / 8.0s',
};

function classify(id) {
  const s = id.toLowerCase();
  if (/^bg$|^background|backdrop/.test(s)) return 'background';
  if (/wave|foam|water|sea/.test(s)) return 'ambient';
  if (/guide|grid|scatter|decor|dot|ring_bg|scaffold/.test(s)) return 'decor';
  if (/divider|numeral|^num|sec_num|section_num/.test(s)) return 'numeral';
  if (/stat|thirty|count|_30|num30/.test(s)) return 'stat';
  if (/watermark|qmark|question|bigq|q_mark/.test(s)) return 'watermark';
  if (/alert|hazard|_x\b|spark|warn|clash|shout|danger|snapback/.test(s)) return 'alert';
  if (/ship|vessel|hull|boat|tanker|carrier|crane|gantry/.test(s)) return 'ship';
  if (/crew|officer|\bab\b|bosun|master|pilot|engineer|fitter|leader|figure|mariner|hero|person|men|character|\bch\d/.test(s)) return 'character';
  if (/arrow|connector|flow|link|_path|conn/.test(s)) return 'arrow';
  if (/card|panel|tile|table|row|col|coaster|def_card|quote/.test(s)) return 'card';
  if (/spot|^cc_|circle|disc/.test(s)) return 'circle';
  if (/anchor|helm|gear|shield|compass|tablet|doc|life|wrench|clock|scale|brain|\bear\b|puzzle|globe|lighthouse|handshake|growth|megaphone|radio|checklist|survey|schedule|cargo|stopwatch|bulb|magnif|icon|hazmat|lifering|ventil|torch/.test(s)) return 'icon';
  return 'prop';
}

function registry() {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/sceneRegistry.ts'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const re = /id:\s*'([\w-]+)'[\s\S]*?label:\s*'([^']*)'[\s\S]*?svgFile:\s*'([\w.]+)'[\s\S]*?audioStartSec:\s*(\d+)[\s\S]*?durationFrames:\s*(\d+)/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ id: m[1], label: m[2], svgFile: m[3], audioStartSec: +m[4], durationFrames: +m[5] });
  return out;
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

// Walk the SVG the way planAndWrap does: top-level groups/shapes that survive
// SKIP_IDS, then every <text> (deduped on content+transform) as text_N.
function elementsOf(svgFile) {
  const svg = fs.readFileSync(path.join(SCENES, svgFile), 'utf8');
  const body = svg.replace(/<defs[\s\S]*?<\/defs>/g, '');
  const out = [];
  const seenTop = new Set();
  for (const m of body.matchAll(/<(g|path|line|polyline|polygon|circle|ellipse|rect|image)\s[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const id = m[2];
    if (seenTop.has(id) || JUNK.test(id) || SKIP_IDS.test(id)) continue;
    seenTop.add(id);
    const tag = m[0];
    const attr = (n) => (new RegExp(`data-${n}="([^"]*)"`).exec(tag) || [, null])[1];
    out.push({
      id, role: classify(id), kind: 'element',
      // Narration binding authored into the artwork — see motion.ts withData().
      dataT: attr('t'), dataEnter: attr('enter'), dataCue: attr('cue'),
      dataLayer: attr('layer'), dataBeat: attr('beat'),
    });
  }
  const seenText = new Set();
  let n = 0;
  for (const m of svg.matchAll(/<text\b[^>]*>[\s\S]*?<\/text>/g)) {
    const raw = m[0];
    const content = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const tr = (/transform="([^"]*)"/.exec(raw) || [, ''])[1];
    const key = content + '|' + tr;
    if (seenText.has(key)) continue;
    seenText.add(key);
    out.push({ id: 'text_' + n, role: 'text', kind: 'text', content });
    n++;
  }
  return out;
}

function describe(el, svgFile, specEls, sceneStartSec) {
  const ov = OVERRIDES[svgFile]?.[el.id];
  if (ov?.hide) return `  ${el.id} — REMOVED by frame-overrides.json (hide: true).`;

  const cue = CUES[svgFile]?.[el.id];
  const se = specEls.get(el.id);
  const bits = [];

  // Entrance — precedence matches motion.ts: spec -> data-* -> cue -> override.
  if (ov?.at !== undefined) bits.push(`enters ${ov.at.toFixed(2)}s (frame-overrides)`);
  else if (cue?.at !== undefined) bits.push(`enters ${cue.at.toFixed(2)}s on the narration cue "${cue.cue}"`);
  else if (el.dataLayer === 'world') bits.push('WORLD — on from frame 0, never enters or exits');
  else if (el.dataT !== null && el.dataT !== undefined) {
    // data-t is ABSOLUTE film time; show both clocks so it can never be misread
    // the way motion.ts first misread it (treating it as scene-relative silently
    // dropped every element whose t exceeded the scene length).
    const abs = Number(el.dataT);
    const rel = Math.max(0, abs - sceneStartSec);
    bits.push(
      `enters at ${clock(abs)} (${abs.toFixed(1)}s film time = ${rel.toFixed(1)}s into this scene)` +
      ` on the narration beat` +
      (el.dataCue ? ` "${el.dataCue}"` : '') +
      (el.dataBeat ? ` (beat ${el.dataBeat})` : '') +
      (el.dataEnter ? `, ${el.dataEnter}` : '')
    );
  }
  else if (se) bits.push(`enters ${(se.startMs / 1000).toFixed(2)}s (guider spec, ${se.anim})`);
  else bits.push('enters on the fallback recipe (no spec entry — role-based stagger)');

  // Type-on
  const tm = METRICS[svgFile]?.[el.id];
  if (el.kind === 'text') {
    if (ov?.type === false) bits.push('shown whole, type-on disabled');
    else if (tm) {
      const cps = ov?.cps || 14;
      const secs = Math.min(tm.chars / cps, 2.5);
      bits.push(`types on over ${secs.toFixed(2)}s (${tm.chars} chars @ ${cps}/s, ${tm.lines.length} line${tm.lines.length > 1 ? 's' : ''})${ov?.caret === false ? ', no caret' : ' with a caret'}`);
    } else bits.push('no measured metrics — appears without typing');
  }

  // Continuous motion
  if (ov?.orbit) bits.push(`orbit ${ov.orbit.deg}deg / ${(ov.orbit.period / 1000).toFixed(1)}s (override)`);
  else if (se?.orbit) bits.push(`orbit ring turns continuously (${(se.orbit.dur / 1000).toFixed(1)}s)`);

  if (ov?.idle === false) bits.push('idle disabled (override)');
  else if (ov?.idle) bits.push(`idle ${ov.idle.amp}px / ${(ov.idle.period / 1000).toFixed(1)}s (override)`);
  else if (se?.idle) bits.push('idle loop from the guider spec');
  else if (!NO_IDLE.has(el.role) && DEFAULT_IDLE[el.role]) bits.push(`default idle ${DEFAULT_IDLE[el.role]}`);

  // Static adjustments
  const adj = [];
  if (ov?.x || ov?.y) adj.push(`offset ${ov.x || 0},${ov.y || 0}px`);
  if (ov?.scale !== undefined) adj.push(`scale x${ov.scale}`);
  if (ov?.rotate !== undefined) adj.push(`rotate ${ov.rotate}deg`);
  if (adj.length) bits.push(adj.join(' + ') + ' (override)');

  const label = el.kind === 'text' ? `${el.id} "${el.content.slice(0, 46)}"` : `${el.id} [${el.role}]`;
  return `  ${label}\n      ${bits.join('; ')}.`;
}

function build(scene) {
  const specFrame = SPEC.frames.find((f) => f.file.endsWith(scene.svgFile));
  const specEls = new Map((specFrame?.elements || []).map((e) => [e.id, e]));
  const els = elementsOf(scene.svgFile);
  const ov = OVERRIDES[scene.svgFile] || {};
  const tr = ov._transition || {};
  const secs = scene.durationFrames / 30;

  const L = [];
  L.push(`FRAME_${String(specFrame ? specFrame.index : 0).padStart(2, '0')} — ${scene.label}`);
  L.push(`Appears in the video at: ${clock(scene.audioStartSec)}`);
  L.push(`Scene length: ${scene.durationFrames} frames = ${secs.toFixed(1)} seconds (30fps)`);
  if (specFrame?.archetype) L.push(`Archetype: ${specFrame.archetype}`);
  if (specFrame?.beat) L.push(`Beat: ${specFrame.beat}`);
  L.push('');
  L.push('WORLD — never enters, never exits');
  L.push('  The canvas, the wave band and the rising bubbles are drawn once by');
  L.push('  src/scenes/WorldLayer.tsx and run continuously behind every scene. This');
  L.push('  frame\'s own #bg and #waves are stripped by motion.ts (SKIP_IDS) so the');
  L.push('  water never doubles or restarts at a cut.');
  L.push('');
  L.push(`ENTRANCE — contents slide in from the ${tr.inFrom || 'right'}${tr.frames ? ` over ${tr.frames} frames` : ''}, decelerating on the brand curve.`);
  L.push('');
  L.push(`ELEMENTS (${els.length}, in the order motion.ts wraps them)`);
  L.push('');
  for (const el of els) L.push(describe(el, scene.svgFile, specEls, scene.audioStartSec));
  L.push('');
  if (ov._frame) {
    const f = ov._frame;
    L.push(`WHOLE-FRAME ADJUSTMENT (frame-overrides.json): offset ${f.x || 0},${f.y || 0}px, scale x${f.scale ?? 1}.`);
    L.push('');
  }
  L.push('HOLD — once everything has landed, the idle loops, orbit rings, wave drift and');
  L.push('  bubbles keep running. The frame is never completely still.');
  L.push('');
  L.push(`EXIT — contents slide out to the ${tr.outTo || 'left'} over the last ${tr.frames || 30} frames and fade`);
  L.push('  over the back half of that travel, so the frame is clear before the next');
  L.push('  subject arrives. The world does NOT fade — that is what stops a transition');
  L.push('  going blank.');
  L.push('');
  L.push('## Notes');
  L.push('- Generated by scripts/build-execution-text.js from sceneRegistry.ts, the frame');
  L.push('  SVG, animation.json, audio-cues.json, text-metrics.json and');
  L.push('  frame-overrides.json. Re-run it after any frame re-export rather than');
  L.push('  hand-editing, or this record drifts from what actually renders.');
  L.push('- To change any element here, edit public/animation/frame-overrides.json');
  L.push('  (see CLAUDE.md "Tweak Any Frame"). Run scripts/inspect-frame.js to see which');
  L.push('  id is which on screen.');
  const cued = els.filter((e) => e.dataT !== null && e.dataT !== undefined).length;
  if (cued) {
    L.push(`- NARRATION TIMING: ${cued} element(s) in this frame carry data-t authored into`);
    L.push('  the artwork by the design project. That timing travels WITH the element, so a');
    L.push('  future rename cannot orphan it the way the mp_v2 redesign orphaned all 133');
    L.push('  entries in audio-cues.json (those are preserved in audio-cues.pre-mp_v2.json).');
    L.push('  To retime one, prefer data-t upstream; frame-overrides.json "at" wins locally.');
  } else if (!Object.keys(CUES).length) {
    L.push('- NO NARRATION TIMING in this frame: no data-t attributes and audio-cues.json is');
    L.push('  empty, so entrances come from the guider spec or the fallback stagger, NOT');
    L.push('  from the words that name them.');
  }
  return L.join('\n') + '\n';
}

const scenes = registry();
let changed = 0;
for (const scene of scenes) {
  const file = scene.svgFile.replace(/\.svg$/, '.txt');
  const p = path.join(OUT_DIR, file);
  // Keep review rounds — they are review state, not derived from the frames.
  let review = '';
  if (fs.existsSync(p)) {
    const prev = fs.readFileSync(p, 'utf8');
    const i = prev.search(/^## Review/m);
    if (i !== -1) review = '\n' + prev.slice(i);
  }
  const next = build(scene) + review;
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (cur !== next) {
    changed++;
    if (!CHECK) fs.writeFileSync(p, next);
  }
}

if (CHECK) {
  if (changed) {
    console.error(`execution-text: ${changed} file(s) STALE — run node scripts/build-execution-text.js`);
    process.exit(1);
  }
  console.log(`execution-text: fresh — ${scenes.length} scene(s)`);
} else {
  console.log(`execution-text: rewrote ${changed} of ${scenes.length} scene file(s)`);
}
