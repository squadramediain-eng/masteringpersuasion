// ─── motion.ts ────────────────────────────────────────────────────────────────
// Remotion interpreter for the Animation Guider's per-element recipes.
// public/animation/animation.json is the SOURCE OF TRUTH: every element's timing,
// from/to, easing, direction, idle and orbit is READ from it — never re-derived.
// classify() + recipe() remain ONLY as the fallback for elements the spec omits
// (frame_13 carries no spec elements at all).
// Every animated element is WRAPPED in a fresh <g id="anim_*"> so we never clobber
// a group's own placement transform="translate(...) scale(...)".
// ────────────────────────────────────────────────────────────────────────────

import specJson from '../../public/animation/animation.json';
import cuesJson from '../../public/animation/audio-cues.json';
import metricsJson from '../../public/animation/text-metrics.json';

// Shapes that carry a stroke, for the arrow draw-on. pathLength=1 normalises every
// path to unit length so the spec's strokeDashoffset 1 -> 0 draws it regardless of size.
const DRAW_SHAPES = ['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'];

// Root-level children that are bare shapes rather than <g> — e.g. frame_4's connector
// arrows (line+polygon), frame_7's compare panels, the ship shadows. The guider only ever
// emitted <g> elements, so these carry no spec; wrapping them anyway lets them be cued,
// otherwise an arrow sits on screen pointing at a step that has not appeared yet.
const ROOT_SHAPES = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'image']);

// The world (canvas + wave band) is rendered ONCE by WorldLayer behind every scene and never
// fades. A scene must not paint its own — the bg rect is full-bleed and would hide the water,
// and a per-scene band would double up and restart at every cut.
//
// Matches BOTH namings on purpose: the current frames use `waves`, while the design system's
// re-export (2026-07-17, wave band now mandatory in all 20) uses the canonical `wave-band`,
// and its validator also accepts `wave` / `WaveLine`. Anything starting `wave` is world.
// See src/scenes/WorldLayer.tsx and knowledge-vault/12 - Motion & Frame Construction Spec.
const SKIP_IDS = /^(bg|background)$|^wave/i;

interface SpecIdle { anim: string; translateY: number[]; rotate?: number[]; dur: number; ease: string; loop: boolean }
interface SpecOrbit { anim: string; rotate: number[]; dur: number; ease: string; loop: boolean; target: string }
export interface SpecEl {
  id: string; role: string; anim: string;
  from: Record<string, number>; to: Record<string, number>;
  startMs: number; durationMs: number; easing: string; loop: boolean;
  overshoot?: number; direction?: string; note?: string;
  idle?: SpecIdle; orbit?: SpecOrbit;
}
interface Spec { frames: { index: number; file: string; elements: SpecEl[] }[] }

const SPEC = specJson as unknown as Spec;

// keyed by SVG basename, matching sceneRegistry's svgFile ("frame_0.svg")
const SPEC_BY_FILE: Record<string, Map<string, SpecEl>> = {};
for (const f of SPEC.frames) {
  SPEC_BY_FILE[f.file.split('/').pop()!] = new Map(f.elements.map((e) => [e.id, e]));
}

// Narration cues (public/animation/audio-cues.json, resolved by scripts/build-audio-cues.js).
// `at` is seconds from the scene's start and OVERRIDES the guider's startMs, so an element
// lands when the voiceover names it. Everything else about the element still comes from the
// guider. An id with no cue keeps its spec timing.
const CUES = cuesJson as { frames?: Record<string, Record<string, { at?: number }>> };
const cueFor = (svgFile: string, id: string): number | undefined =>
  CUES.frames?.[svgFile]?.[id]?.at;

// Override an element's entrance with its narration cue, leaving everything else alone.
function withCue(rec: Rec, svgFile: string, id: string): Rec {
  const at = cueFor(svgFile, id);
  return at === undefined ? rec : { ...rec, start: at * 1000 };
}

// ─── TYPE-ON ────────────────────────────────────────────────────────────────
// Titles and body copy type on with a visible caret — the house signature.
// (knowledge-vault/12 §5; the old "no typewriter on text" convention was
// reversed 2026-07-17 against the approved reference film.)
//
// Measured off that film, 4 samples/sec through the 0:55-0:59 transition:
// the caret appears, then "B" -> "Ballast" -> "Ballast/W" -> "Ballast Water"
// lands in ~1.0s — about 12 chars/sec. But its body paragraphs type far
// faster (~150 chars inside ~3s at 1:00, ~50 cps), so a single cps is wrong:
// short titles want deliberate typing, long paragraphs must not crawl. Hence
// a nominal rate with a hard ceiling — long copy speeds up automatically.
const TYPE_CPS = 14;
const TYPE_MAX_MS = 2500;
const CARET_BLINK_MS = 500;
// Keep the caret alive briefly after the last glyph, the way a real cursor rests.
const CARET_HOLD_MS = 700;

interface TextMetric { charX: number[]; x0: number; x1: number; y: number; h: number; transform: string }
const METRICS = metricsJson as unknown as Record<string, Record<string, TextMetric>>;
const metricFor = (svgFile: string, id: string): TextMetric | undefined =>
  METRICS[svgFile]?.[id];

const typeDurationMs = (chars: number) => Math.min((chars / TYPE_CPS) * 1000, TYPE_MAX_MS);

// ─── DEFAULT IDLE — "the frame is never still" (spec 12 §6) ──────────────────
// Only 23 of the guider's 242 elements (10%) carry an idle loop, and 8 frames
// carry none at all — so once a scene's entrances finish, ~90% of it freezes.
// Measured consequence: v3 sat near-still 71% of the time against the reference
// film's 50%, and adding type-on + slide transitions moved the MEAN (+25%) while
// leaving the MEDIAN almost untouched (0.2884 -> 0.2999) — because the holds,
// which are most of the runtime, were still frozen.
//
// The approved film never holds on a dead frame: its vessels bob, its characters
// float, its decorative arcs turn. So anything the spec does not already animate
// gets a gentle default breathe. Amplitudes are deliberately small — this is
// ambient life, not a bounce, and the conventions still ban decorative spin on
// content.
const DEFAULT_IDLE: Record<string, { amp: number; period: number; rot?: number }> = {
  ship:      { amp: 4.5, period: 5200, rot: 0.5 },
  character: { amp: 3.0, period: 4600 },
  icon:      { amp: 2.2, period: 5000 },
  card:      { amp: 1.6, period: 6400 },
  circle:    { amp: 2.0, period: 5800 },
  prop:      { amp: 2.0, period: 5400 },
  decor:     { amp: 1.4, period: 7200 },
  stat:      { amp: 1.8, period: 6000 },
  numeral:   { amp: 1.8, period: 6600 },
  watermark: { amp: 2.4, period: 8000 },
};
// Roles that must NOT drift: text would blur against its own caret, arrows are
// anchored to what they point at, and background/ambient is the world layer's job.
const NO_IDLE = new Set(['text', 'background', 'ambient', 'arrow', 'alert']);

// Give every element its own phase so they breathe independently — a shared phase
// makes a frame pulse as one block, which reads as mechanical rather than alive.
function withIdle(rec: Rec, role: string, idx: number): Rec {
  if (rec.idle || rec.loop || NO_IDLE.has(role)) return rec;
  const d = DEFAULT_IDLE[role];
  if (!d) return rec;
  return { ...rec, idle: { ...d, phase: ((idx * 137.508) % 360) * (Math.PI / 180) } };
}

// Attach measured metrics to a text record and retime it to the typing rate.
// The element keeps its cued/spec START — only the duration becomes the time the
// glyphs take to arrive, so existing VO sync is untouched.
function withType(rec: Rec, svgFile: string, id: string): Rec {
  const m = metricFor(svgFile, id);
  if (!m || m.charX.length < 2) return rec;
  return { ...rec, type: m, dur: typeDurationMs(m.charX.length - 1) };
}

const EASE_SINE = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const EASE_LIN = (t: number) => t;

// brand curve cubic-bezier(0.16, 1, 0.3, 1)
function makeCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const fy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dfx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-4) break;
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.min(1, Math.max(0, t)));
  };
}
const EASE_BRAND = makeCubicBezier(0.16, 1, 0.3, 1);
const easeFn = (name?: string) =>
  name === 'ease-in-out' ? EASE_SINE : name === 'linear' ? EASE_LIN : EASE_BRAND;

// ─── role classification (ported verbatim from Animation Guider) ───────────────
export function classify(id: string): string {
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

interface Rec {
  anim: string;
  from: Record<string, number>;
  to: Record<string, number>;
  start: number;   // ms
  dur: number;     // ms
  ease?: string;
  loop?: boolean;
  overshoot?: number;
  idle?: { amp: number; period: number; rot?: number; phase?: number };
  shake?: boolean;
  orbit?: { period: number; deg: number };
  draw?: boolean;
  // Set for <text> that has measured metrics — drives the character-exact
  // clip reveal and the caret. See TYPE-ON above.
  type?: TextMetric;
}

// Spec element -> Rec. The spec's `easing` is a raw cubic-bezier string for the brand
// curve, which easeFn() already falls through to.
const peak = (a?: number[]) => (a ? Math.max(...a.map(Math.abs)) : undefined);

function fromSpec(e: SpecEl): Rec {
  const draw = e.anim === 'draw' || 'strokeDashoffset' in e.from;
  // The spec hides a draw element with strokeDashoffset alone and holds opacity:1,
  // which only works on stroked geometry. Several "arrow" groups are filled shapes
  // (frame_6's swing_arrow is actually the quote card — see Execution_Text), so a dash
  // cannot hide them and they would sit on screen from t=0. Fade them in over the draw.
  const from = draw ? { ...e.from, opacity: 0 } : e.from;
  const to = draw ? { ...e.to, opacity: 1 } : e.to;
  return {
    anim: e.anim,
    from,
    to,
    start: e.startMs,
    dur: e.durationMs,
    ease: e.easing,
    loop: Boolean(e.loop),
    overshoot: e.overshoot,
    idle: e.idle ? { amp: peak(e.idle.translateY)!, period: e.idle.dur, rot: peak(e.idle.rotate) } : undefined,
    orbit: e.orbit ? { period: e.orbit.dur, deg: e.orbit.rotate[1] - e.orbit.rotate[0] } : undefined,
    draw,
  };
}

// ─── recipe by role (ported; idle/shake simplified for the interpreter) ────────
function recipe(role: string, idx: number, anchorX: number, frameMs: number): Rec {
  const stag = (n: number, g: number) => Math.round(n) * g;
  switch (role) {
    case 'background': return { anim: 'fade', from: { opacity: 0 }, to: { opacity: 1 }, start: 0, dur: 400 };
    case 'ambient':    return { anim: 'wave-drift', from: { translateX: -14 }, to: { translateX: 14 }, start: 0, dur: Math.min(frameMs, 9000), ease: 'ease-in-out', loop: true };
    case 'decor':      return { anim: 'fade-scale', from: { opacity: 0, scale: 0.96 }, to: { opacity: 1, scale: 1 }, start: 220 + stag(idx, 60), dur: 520 };
    case 'numeral':    return { anim: 'scale-fade', from: { opacity: 0, scale: 0.82 }, to: { opacity: 1, scale: 1 }, start: 300, dur: 640 };
    case 'text':       return { anim: 'rise-fade', from: { opacity: 0, translateY: 26 }, to: { opacity: 1, translateY: 0 }, start: 420 + stag(idx, 130), dur: 520 };
    case 'card':       return { anim: 'rise-scale', from: { opacity: 0, translateY: 30, scale: 0.96 }, to: { opacity: 1, translateY: 0, scale: 1 }, start: 520 + stag(idx, 90), dur: 540 };
    case 'ship': {
      const dx = anchorX > 1160 ? 90 : -90;
      return { anim: 'sail-in', from: { opacity: 0, translateX: dx }, to: { opacity: 1, translateX: 0 }, start: 560, dur: 900, idle: { amp: 8, period: 4200, rot: 1 } };
    }
    case 'character': {
      let from: Record<string, number> = { opacity: 0, translateY: 52 };
      if (anchorX < 640) from = { opacity: 0, translateX: -60 };
      else if (anchorX > 1280) from = { opacity: 0, translateX: 60 };
      return { anim: 'slide-fade', from, to: { opacity: 1, translateX: 0, translateY: 0 }, start: 660 + stag(idx, 120), dur: 640, idle: { amp: 6, period: 3800 } };
    }
    case 'circle':     return { anim: 'pop-scale', from: { opacity: 0, scale: 0.6 }, to: { opacity: 1, scale: 1 }, start: 800 + stag(idx, 150), dur: 480 };
    case 'icon':       return { anim: 'pop', from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 }, start: 900 + stag(idx, 110), dur: 440, overshoot: 1.06 };
    case 'arrow':      return { anim: 'draw', from: { opacity: 0 }, to: { opacity: 1 }, start: 1060 + stag(idx, 120), dur: 460 };
    case 'stat':       return { anim: 'count-scale', from: { opacity: 0, scale: 0.7 }, to: { opacity: 1, scale: 1 }, start: 500, dur: 950 };
    case 'alert':      return { anim: 'pop-shake', from: { opacity: 0, scale: 0 }, to: { opacity: 1, scale: 1 }, start: 1250, dur: 520, shake: true };
    case 'watermark':  return { anim: 'fade-pulse', from: { opacity: 0 }, to: { opacity: 0.12 }, start: 250, dur: 800, ease: 'ease-in-out', loop: true };
    default:           return { anim: 'fade-rise', from: { opacity: 0, translateY: 18 }, to: { opacity: 1, translateY: 0 }, start: 700 + stag(idx, 90), dur: 480 };
  }
}

function readAnchor(el: Element): number {
  const t = el.getAttribute('transform') || '';
  const m = t.match(/translate\(\s*(-?\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);
  const c = el.querySelector('[cx],[x]');
  if (c) {
    const v = c.getAttribute('cx') || c.getAttribute('x');
    if (v) return parseFloat(v);
  }
  return 960;
}

export interface PlanItem { sel: string; role: string; idx: number; rec: Rec; }

// Parse the SVG, wrap every animatable root child in <g id="anim_*">, return the
// serialized skeleton + the per-element plan. Done ONCE per scene (memoized).
// svgFile ("frame_0.svg") keys into the guider spec; anything the spec omits falls
// back to classify() + recipe().
export function planAndWrap(svgString: string, frameMs: number, svgFile: string): { skeleton: string; plan: PlanItem[] } {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return { skeleton: svgString, plan: [] };
  svg.setAttribute('width', '1920');
  svg.setAttribute('height', '1080');
  const root = (svg.querySelector('g[isolation]') as Element) || svg;
  const spec = SPEC_BY_FILE[svgFile];

  const plan: PlanItem[] = [];
  let textIdx = 0;
  const roleCount: Record<string, number> = {};
  let dividerHead: Element | null = null;

  const wrap = (el: Element, id: string, role: string, idx: number, rec: Rec) => {
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'anim_' + id);
    el.parentNode!.insertBefore(g, el);
    g.appendChild(el);
    if (rec.draw) {
      g.querySelectorAll(DRAW_SHAPES.join(',')).forEach((s) => s.setAttribute('pathLength', '1'));
    }
    // Type-on: give the text a caret sibling. It carries the <text>'s OWN transform so
    // both share one local space — text-metrics.json records charX in exactly that space,
    // so the caret can be placed by translateX with no further conversion.
    if (rec.type) {
      const m = rec.type;
      // Two nested nodes on purpose, same reason the anim_* wrapper exists: a CSS
      // `transform` REPLACES the SVG transform attribute, so putting the placement
      // and the per-frame slide on one node throws the caret off-screen. Outer <g>
      // holds the text's placement (attribute, never touched); the rect inside takes
      // only the CSS translateX along the line.
      const caretG = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (m.transform) caretG.setAttribute('transform', m.transform);
      const caret = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      caret.setAttribute('id', 'caret_' + id);
      // Bbox height includes descenders, which makes a full-height bar read as too
      // tall next to the caps. Inset it toward cap height, as the reference's does.
      caret.setAttribute('x', String(m.charX[0]));
      caret.setAttribute('y', String(m.y + m.h * 0.1));
      caret.setAttribute('width', String(Math.max(2, m.h * 0.045)));
      caret.setAttribute('height', String(m.h * 0.8));
      caret.setAttribute('fill', el.getAttribute('fill') || '#0840a5');
      caretG.appendChild(caret);
      g.appendChild(caretG);
    }
    plan.push({ sel: '#anim_' + id, role, idx, rec });
  };

  for (const el of Array.from(root.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'defs') continue;
    let id: string | null, role: string, anchorX = 960;
    if (tag === 'text') {
      id = 'text_' + textIdx++;
      role = 'text';
      anchorX = readAnchor(el);
    } else if (tag === 'g' || ROOT_SHAPES.has(tag)) {
      id = el.getAttribute('id');
      if (!id || /__|clip|grad|mask|filter/i.test(id)) continue;
      if (SKIP_IDS.test(id)) { el.parentNode!.removeChild(el); continue; }
      if (id === 'divider_head') dividerHead = el;
      role = classify(id);
      anchorX = readAnchor(el);
    } else {
      continue;
    }
    const idx = (roleCount[role] = roleCount[role] || 0);
    roleCount[role]++;
    const se = spec?.get(id);
    // Cue applies to whatever recipe was built — spec OR fallback. frame_13 has no spec
    // elements at all, so gating this on the spec would leave the longest scene uncued.
    const rec = withCue(se ? fromSpec(se) : recipe(role, idx, anchorX, frameMs), svgFile, id);
    wrap(el, id, role, idx, withIdle(withType(rec, svgFile, id), role, idx));
  }

  // Divider frames nest their 3 label texts inside #divider_head; the first <text> is
  // the big numeral, which rides the group. The spec addresses the labels as text_0..2,
  // so they are unreachable from the root loop above.
  if (dividerHead && textIdx === 0 && spec?.has('text_0')) {
    Array.from(dividerHead.querySelectorAll('text')).slice(1).forEach((t, i) => {
      const se = spec.get('text_' + i);
      if (se) wrap(t, 'text_' + i, 'text', i, withType(withCue(fromSpec(se), svgFile, 'text_' + i), svgFile, 'text_' + i));
    });
  }

  const skeleton = new XMLSerializer().serializeToString(svg);
  return { skeleton, plan };
}

// Per-frame CSS for the whole plan. localFrame is 0-based within the scene.
export function styleFor(plan: PlanItem[], localFrame: number, fps: number): string {
  const ms = (localFrame / fps) * 1000;
  const out: string[] = [];

  for (const p of plan) {
    const r = p.rec;
    let opacity = 1, tx = 0, ty = 0, scale = 1, rot = 0;
    let dash: number | null = null;

    if (r.loop) {
      // r.dur is the loop period — for waves the spec sets it to the whole frame,
      // so the band drifts once across the scene as the through-line.
      const periodF = Math.max(1, (r.dur / 1000) * fps);
      if (r.anim === 'wave-drift') {
        const amp = Math.abs((r.to.translateX ?? 14) - (r.from.translateX ?? -14)) / 2;
        const phase = p.idx * 0.7;
        tx = Math.sin((2 * Math.PI * localFrame) / (periodF * (1 + p.idx * 0.25)) + phase) * amp;
        ty = Math.sin((2 * Math.PI * localFrame) / (periodF * 1.6) + phase) * 3;
      } else if (r.anim === 'fade-pulse') {
        const fadeIn = Math.min(1, ms / (r.start + r.dur));
        opacity = (0.06 + 0.06 * (0.5 + 0.5 * Math.sin(localFrame * 0.03))) * fadeIn;
      }
    } else {
      const p01 = Math.max(0, Math.min(1, (ms - r.start) / r.dur));
      const e = easeFn(r.ease)(p01);
      const lerp = (a = 0, b = 0) => a + (b - a) * e;
      if ('opacity' in r.from || 'opacity' in r.to) opacity = lerp(r.from.opacity ?? 1, r.to.opacity ?? 1);
      if ('translateX' in r.from || 'translateX' in r.to) tx = lerp(r.from.translateX ?? 0, r.to.translateX ?? 0);
      if ('translateY' in r.from || 'translateY' in r.to) ty = lerp(r.from.translateY ?? 0, r.to.translateY ?? 0);
      if ('scale' in r.from || 'scale' in r.to) {
        scale = lerp(r.from.scale ?? 1, r.to.scale ?? 1);
        if (r.overshoot && p01 > 0.5 && p01 < 1) scale += (r.overshoot - 1) * Math.sin((p01 - 0.5) * Math.PI * 2) * 0.5;
      }
      // arrows draw on along their own path (unit-normalised via pathLength=1)
      if (r.draw) dash = lerp(r.from.strokeDashoffset ?? 1, r.to.strokeDashoffset ?? 0);
      // brief shake for the alert beat
      if (r.shake && p01 > 0.2 && p01 < 1) rot = Math.sin(p01 * Math.PI * 6) * 4 * (1 - p01);
      // idle loop once the entrance has settled
      if (r.idle && ms > r.start + r.dur) {
        const idleF = (localFrame / fps) * 1000 - (r.start + r.dur);
        const ph = (2 * Math.PI * idleF) / r.idle.period + (r.idle.phase ?? 0);
        // Ease the loop in over its first cycle so an element never jerks from a
        // dead stop into full amplitude the instant its entrance finishes.
        const ramp = Math.min(1, idleF / r.idle.period);
        ty += Math.sin(ph) * r.idle.amp * ramp;
        if (r.idle.rot) rot += Math.sin(ph) * r.idle.rot * ramp;
      }
    }

    // Orbit rings — the only spin the conventions allow. Rotating the whole spot_*
    // group about its own centre travels the dashes and carries the bead round; the
    // icon is a sibling group, so it stays upright.
    if (r.orbit) rot += (ms / r.orbit.period) * r.orbit.deg;

    const parts: string[] = [];
    if (tx || ty) parts.push(`translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`);
    if (scale !== 1) parts.push(`scale(${scale.toFixed(4)})`);
    if (rot) parts.push(`rotate(${rot.toFixed(3)}deg)`);
    const transform = parts.length ? `transform:${parts.join(' ')};transform-box:fill-box;transform-origin:center;` : '';

    // ── Type-on ──────────────────────────────────────────────────────────
    // Reveal by clipping to a real character boundary. charX holds the measured
    // start-x of every glyph (plus the end), so the clip edge NEVER lands inside a
    // glyph — the failure mode a naive width-percentage wipe produces ("Ballast
    // Manag|g", a sliver of the next letter leaking past the cursor).
    if (r.type) {
      const m = r.type;
      const chars = m.charX.length - 1;
      const tp = Math.max(0, Math.min(1, (ms - r.start) / Math.max(1, r.dur)));
      const shown = Math.round(tp * chars);           // whole characters only
      const edge = m.charX[shown];
      const span = m.x1 - m.x0 || 1;
      // inset() percentages resolve against the element's own bounding box.
      const rightPct = Math.max(0, Math.min(100, (1 - (edge - m.x0) / span) * 100));
      // Clip the <text> ITSELF, not the wrapper: the caret is a sibling inside that
      // wrapper and sits exactly on the reveal edge, so clipping the group would eat
      // the caret at every frame. Percentages resolve against the text's own bbox,
      // which is what x0/x1 measure.
      out.push(`${p.sel} text{clip-path:inset(-25% ${rightPct.toFixed(3)}% -25% -25%);}`);

      // Caret rides the same edge, blinks, and retires shortly after the last glyph.
      const sinceDone = ms - (r.start + r.dur);
      const blinkOn = Math.floor(Math.max(0, ms - r.start) / CARET_BLINK_MS) % 2 === 0;
      const alive = ms >= r.start && sinceDone < CARET_HOLD_MS;
      const caretOp = alive && (tp < 1 || blinkOn) ? opacity : 0;
      out.push(
        `#caret_${p.sel.slice(6)}{opacity:${caretOp.toFixed(3)};` +
        `transform:translateX(${(edge - m.charX[0]).toFixed(2)}px);}`
      );
    }

    out.push(`${p.sel}{opacity:${opacity.toFixed(3)};${transform}}`);
    if (dash !== null) {
      const sel = DRAW_SHAPES.map((s) => `${p.sel} ${s}`).join(',');
      out.push(`${sel}{stroke-dasharray:1;stroke-dashoffset:${dash.toFixed(4)};}`);
    }
  }
  return out.join('');
}
