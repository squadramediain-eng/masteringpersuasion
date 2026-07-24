// ─── motion.ts ────────────────────────────────────────────────────────────────
// Remotion interpreter for the Animation Guider's per-element recipes.
// public/animation/animation.json is the SOURCE OF TRUTH: every element's timing,
// from/to, easing, direction, idle and orbit is READ from it — never re-derived.
// classify() + recipe() remain ONLY as the fallback for elements the spec omits
// (frame_13 carries no spec elements at all).
// Every animated element is WRAPPED in a fresh <g id="anim_*"> so we never clobber
// a group's own placement transform="translate(...) scale(...)".
// ────────────────────────────────────────────────────────────────────────────

import { spring } from 'remotion';
import specJson from '../../public/animation/animation.json';
import cuesJson from '../../public/animation/audio-cues.json';
import metricsJson from '../../public/animation/text-metrics.json';
import overridesJson from '../../public/animation/frame-overrides.json';

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

// Ambient LIFE inside the world layer — animated smoothly instead of frozen (see
// withData). Fish glide, seaweed/plants wave-warp, coral sways. Keyed on id.
function lifeAnim(id: string): string | null {
  if (/fish|shoal|school/i.test(id)) return 'fish-swim';
  if (/seaweed|kelp|weed|plant|algae|frond/i.test(id)) return 'plant-warp';
  if (/coral|reef|anemone/i.test(id)) return 'coral-sway';
  // The decor "bubbles" cluster (NOT a speech/thought bubble or bubble_ship).
  if (/^bubbles?$|water_?bubble|air_?bubble|rising_?bubble/i.test(id)) return 'bubble-rise';
  return null;
}
// Stable 0..2π phase from an id, so each life element moves on its own beat.
function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000 * Math.PI * 2;
}

interface SpecIdle { anim: string; translateY: number[]; rotate?: number[]; dur: number; ease: string; loop: boolean }
interface SpecOrbit { anim: string; rotate: number[]; dur: number; ease: string; loop: boolean; target: string }
export interface SpecEl {
  id: string; role: string; anim: string;
  from: Record<string, number>; to: Record<string, number>;
  startMs: number; durationMs: number; easing: string; loop: boolean;
  overshoot?: number; direction?: string; note?: string;
  idle?: SpecIdle; orbit?: SpecOrbit;
}
interface Spec { frames: { index: number; file: string; startSec: number; elements: SpecEl[] }[] }

const SPEC = specJson as unknown as Spec;

// keyed by SVG basename, matching sceneRegistry's svgFile ("frame_0.svg")
const SPEC_BY_FILE: Record<string, Map<string, SpecEl>> = {};
// Where each scene opens on the film timeline — needed to convert the artwork's
// ABSOLUTE data-t into this scene's local clock. See withData().
const START_BY_FILE: Record<string, number> = {};
for (const f of SPEC.frames) {
  const base = f.file.split('/').pop()!;
  SPEC_BY_FILE[base] = new Map(f.elements.map((e) => [e.id, e]));
  START_BY_FILE[base] = f.startSec ?? 0;
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
const TYPE_CPS = 22;   // the reference's rate (FrameStage/SvgFrame Typewriter)
const TYPE_MAX_MS = 2500;
const CARET_BLINK_MS = 500;
// Keep the caret alive briefly after the last glyph, the way a real cursor rests.
const CARET_HOLD_MS = 700;

interface TextLine { y: number; x0: number; x1: number; xs: number[] }
interface TextMetric { lines: TextLine[]; chars: number; x0: number; x1: number; y: number; h: number; transform: string }
const METRICS = metricsJson as unknown as Record<string, Record<string, TextMetric>>;
const metricFor = (svgFile: string, id: string): TextMetric | undefined =>
  METRICS[svgFile]?.[id];

const typeDurationMs = (chars: number) => Math.min((chars / TYPE_CPS) * 1000, TYPE_MAX_MS);

// ─── EMBEDDED NARRATION BINDING (data-* on the artwork) ──────────────────────
// The design project now authors the binding INTO the SVG:
//   <g id="art_1" data-layer="content" data-beat="3" data-cue="pillar"
//      data-t="7" data-enter="pop" data-cx="443" data-cy="823">
// 209 elements across the 20 frames carry data-t.
//
// This is a better answer to the problem than the one we asked for. We asked for
// stable ids so audio-cues.json could keep binding; instead the timing travels
// WITH the element, so a rename cannot orphan it — which is what killed all 133
// cues when mp_v2 renamed everything.
//
//   data-t      ABSOLUTE seconds on the film timeline when the element lands —
//               NOT seconds from the scene's start. Verified across all 20
//               frames: every data-t falls inside its own scene's absolute
//               window (frame_9 spans 252-286s and carries t=255..276).
//               Reading it as scene-relative silently drops every element whose
//               t exceeds the scene length — frame_9's table rendered as an
//               empty header for its whole 34s, and the film came out at half
//               the file size because most content never appeared. frame_0
//               hides the bug perfectly: its scene starts at 0, so both
//               readings agree there.
//   data-enter  slide | pop | typewriter | fade
//   data-layer  world = always on, never enters (WorldLayer's rule, per spec 12 §2)
//
// Precedence: guider spec -> THIS -> audio-cues.json -> frame-overrides.json.
// It outranks the spec because it was authored against the artwork as it now
// exists, while 84% of the spec's ids no longer resolve at all.
// The mp_v5 entrance vocabulary (motion/layer-spec.md §3 + cue-bindings.json `enter`
// descriptions). Each maps a data-enter code to a from-state; `draw` is special
// (stroke draw-on, handled by the `draw` flag not a transform).
//   slide  60px from the element's near edge, settle       (34)
//   pop    scale 0.8->1 with overshoot — "circle/tile pops" (48)
//   draw   stroke reveals along its length — arrows/ticks   (22)
//   typewriter  glyph reveal is the entrance                (20)
//   row    drops in from just above — table rows            (10)
//   stagger  pop, phase-offset per index                    (5)
//   header   lays down from above with a settle — header bar(4)
//   iris   opens from scale 0 — "iris-open + glow bloom"     (2)
//   count  number scales up from small — "count 0->30"      (1)
//   marker scale-0 pop with a shake pulse — "marker pulses" (1)
//   fade   opacity only                                     (1)
// Reference entrance shapes (SvgFrame.enterTransform): pop/iris/scale = scale
// 0.9→1, slide = translateX 40→0, everything else = rise translateY 24→0, all on
// the buoy. Values match the source exactly.
const ENTER_FROM: Record<string, Record<string, number>> = {
  slide: { translateX: 40, opacity: 0 },
  pop: { scale: 0.9, opacity: 0 },
  stagger: { scale: 0.9, opacity: 0 },
  fade: { opacity: 0, translateY: 24 },
  typewriter: { opacity: 1 },   // the glyph reveal is the entrance; see TYPE-ON
  // draw must be HIDDEN before its cue. It was opacity 1 (right for a stroke that
  // draws on), but mp_v5 tags FILLED icons "draw" too — with opacity 1 those show
  // their fill from frame 0, so they appeared fully-present at scene start (the
  // "everything at once" bug). From opacity 0, the element stays hidden until its
  // cue, then fades in as its stroke draws. Correct for both stroke and fill.
  draw: { opacity: 0 },
  row: { translateY: 24, opacity: 0 },
  header: { translateY: 24, opacity: 0 },
  iris: { scale: 0.9, opacity: 0 },
  count: { scale: 0.9, opacity: 0 },
  marker: { scale: 0.9, opacity: 0 },
};
const ENTER_DUR: Record<string, number> = {
  slide: 700, pop: 520, stagger: 520, fade: 600, typewriter: 200,
  draw: 620, row: 420, header: 560, iris: 640, count: 900, marker: 500,
};

// World-like layers are on from frame 0 and never enter on a cue (motion/layer-spec.md
// §2). mp_v5 split the old single "world" into bg/env/waves/decor; keep "world" too for
// back-compat. bg/waves are additionally stripped by SKIP_IDS (WorldLayer paints them);
// env/decor stay in the frame but must not animate in — they are ambient base.
const WORLD_LAYERS = new Set(['bg', 'env', 'waves', 'decor', 'world']);

function withData(rec: Rec, el: Element, role: string, sceneStartSec: number): Rec {
  const layer = el.getAttribute('data-layer');
  const tRaw = el.getAttribute('data-t');
  const enter = el.getAttribute('data-enter') || '';
  const id = el.getAttribute('id') || '';

  // WORLD is on from frame 0 and is STATIC SCENERY — it must NOT enter and must NOT
  // get a per-element idle/spin. Applying idle to it made the frame's background
  // details, seabed and water shapes jiggle in place ("stuck bubbles / weird waves").
  // EXCEPTION — ambient LIFE (fish, seaweed, coral, plants): "the water is never dead"
  // (Comments c12/c13/c27). A frozen school of fish or a stiff seaweed reads as wrong,
  // and giving them the generic idle made them JITTER. So they get a bespoke, SMOOTH
  // loop instead: fish glide, seaweed/plants wave-warp (skew from the base), corals sway.
  // They stay `world:true` (never enter/exit) but carry a `life` anim styleFor drives.
  if (layer && WORLD_LAYERS.has(layer)) {
    const life = lifeAnim(id);
    if (life) return { ...rec, anim: life, from: {}, to: {}, start: 0, dur: 1, loop: true, world: true, lifePhase: hashPhase(id) };
    return { ...rec, start: 0, dur: 1, from: { opacity: 1 }, to: { opacity: 1 }, world: true };
  }
  if (tRaw === null) return rec;
  const abs = Number(tRaw);
  if (!isFinite(abs)) return rec;
  // Absolute film time -> this scene's local clock. Clamp at 0 so a beat authored
  // slightly before its scene opens lands with the frame rather than never.
  const t = Math.max(0, abs - sceneStartSec);

  const from = ENTER_FROM[enter];
  if (!from) return { ...rec, start: t * 1000 };
  // Slide direction follows the element's own side of the frame, so content
  // arrives from the nearest edge rather than all sweeping the same way.
  const cx = Number(el.getAttribute('data-cx'));
  const dir = isFinite(cx) && cx > 960 ? 1 : -1;
  const resolved = enter === 'slide' ? { ...from, translateX: (from.translateX ?? 60) * dir } : from;
  const beat = Number(el.getAttribute('data-beat'));
  return {
    ...rec,
    anim: enter,
    start: t * 1000,
    dur: ENTER_DUR[enter] ?? rec.dur,
    from: resolved,
    to: { opacity: 1, scale: 1, translateX: 0, translateY: 0 },
    // draw = the stroke reveals along its own length (arrows, ticks, connectors).
    ...(enter === 'draw' ? { draw: true } : {}),
    // marker "pulses alert" — a brief shake on top of its pop.
    ...(enter === 'marker' ? { shake: true } : {}),
    // stagger elements share a cue but must not land in lockstep — nudge each a
    // little later by its beat index so they cascade.
    ...(enter === 'stagger' && isFinite(beat) ? { start: t * 1000 + beat * 90 } : {}),
  };
}

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
// ─── SELECTIVE LIFE, not blanket idle ────────────────────────────────────────
// The reference's rule is literal: "Elements NOT tagged are static — nothing
// animates by accident" (SvgFrame.applyAnims). Its aliveness comes from (a) the
// persistent WORLD behind every scene and (b) a FEW logo sub-elements the artist
// tags data-anim (bell shake, fan spin, thunder blink). Our mp_v5 frames carry
// zero data-anim tags, so the WorldLayer atmosphere is our channel for that life.
//
// Blanket content drift was tried and rejected: CSS-transforming many edged content
// groups a few pixels re-rasterises their anti-aliased edges into a choppy aggregate
// (measured 37-52% frame-diff jitter at every amplitude/rate tested), whereas the
// reference and our WorldLayer move smoothly. So content HOLDS after its entrance and
// the WorldLayer atmosphere carries the ambient — the reference's "content still,
// water alive". The one exception is genuine VESSELS, which rock: it's the film's
// maritime signature, they are large smooth shapes, and one-per-scene keeps the
// aggregate clean (vessel scenes measured 12-14% jitter).
const VESSEL_RE = /^(ship|ships|boat|vessel|tug|barge|ferry|tanker|hull)(_|$)/i;
const DRIFT = { ship: { amp: 7.0, period: 4200, rot: 1.2 } };
// Elements that visibly SPIN in the reference — gears turn, ship's wheels rotate,
// fans/propellers spin. A slow continuous turn (not an oscillating bob), so the
// frame reads as machinery running, never a still poster. Directional indicators
// (compass rose) and content discs are deliberately excluded.
const SPIN_RE = /gear|cog|wheel|helm|propeller|turbine|windmill|\bfan\b/i;
function withSpin(rec: Rec, id: string): Rec {
  if (rec.world || rec.orbit || rec.loop || !SPIN_RE.test(id)) return rec;
  return { ...rec, orbit: { period: 11000, deg: 360 } };
}

// ─── FRAME OVERRIDES — the local control layer ───────────────────────────────
// public/animation/frame-overrides.json is applied LAST and always wins, over both
// the guider spec and the narration cues. Two reasons it exists:
//   1. any frame can be corrected here in minutes, without a Claude Design round-trip
//   2. those corrections SURVIVE the next export — the SVGs get overwritten wholesale
//      every round, this file does not
// Run scripts/audit-overrides.js (wired into the QA gate) to catch an override whose
// id no longer exists; otherwise a renamed element silently drops its override, which
// is exactly how this project has lost work on every export so far.
export interface ElOverride {
  at?: number; dur?: number;
  x?: number; y?: number; scale?: number; rotate?: number; opacity?: number;
  hide?: boolean;
  idle?: { amp: number; period: number; rot?: number } | false;
  orbit?: { period: number; deg: number } | false;
  // Ambient-life loop for an element the artwork mislabelled (e.g. a fish school in a
  // generic "decor" group): "fish-swim" | "plant-warp" | "coral-sway" | "bubble-rise".
  life?: string;
  // text only — cps retimes the type-on, type:false shows it instantly,
  // caret:false types without the cursor.
  cps?: number; type?: false; caret?: false;
  // Motion-direction accents:
  //   emphasis — a one-time punch-and-settle scale bump AFTER the element lands,
  //     for the beat the VO stresses a word. { scale peak, dur ms, at = sec after
  //     entrance ends }.
  emphasis?: { scale?: number; dur?: number; at?: number };
}
export interface TransitionOverride {
  inFrom?: 'right' | 'left' | 'top' | 'bottom' | 'none';
  outTo?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  distance?: number;   // px travelled
  frames?: number;     // length of each half, overrides TRANSITION_FRAMES
}
export interface FrameOverride {
  _frame?: { x?: number; y?: number; scale?: number };
  _transition?: TransitionOverride;
}
const OVERRIDES = (overridesJson as { frames?: Record<string, Record<string, ElOverride>> }).frames || {};

export const frameOverride = (svgFile: string): { x?: number; y?: number; scale?: number } | undefined =>
  (OVERRIDES[svgFile] as unknown as FrameOverride | undefined)?._frame;

// Per-scene transition, read by MainComposition's SceneWrapper. Undefined means
// the film-wide default (slide out left / in from right) applies.
export const transitionOverride = (svgFile: string): TransitionOverride | undefined =>
  (OVERRIDES[svgFile] as unknown as FrameOverride | undefined)?._transition;

const RESERVED = new Set(['_frame', '_transition']);
const overrideFor = (svgFile: string, id: string): ElOverride | undefined =>
  RESERVED.has(id) ? undefined : OVERRIDES[svgFile]?.[id];

// Returns null when the override asks for the element to be removed entirely.
function withOverride(rec: Rec, svgFile: string, id: string, sceneStartSec: number): Rec | null {
  const o = overrideFor(svgFile, id);
  if (!o) return rec;
  if (o.hide) return null;
  const next: Rec = { ...rec };
  // `at` is ABSOLUTE film time, same as data-t and cue-bindings.json — so a time
  // copied straight from the manifest lands correctly. Converted to the scene's
  // local clock here (clamped at 0), the same way withData converts data-t.
  if (o.at !== undefined) next.start = Math.max(0, o.at - sceneStartSec) * 1000;
  if (o.dur !== undefined) next.dur = o.dur;
  if (o.idle !== undefined) next.idle = o.idle === false ? undefined : o.idle;
  if (o.orbit !== undefined) next.orbit = o.orbit === false ? undefined : o.orbit;
  // Force an ambient-life loop (fish/plant/coral/bubble) onto an element whose id the
  // engine could not classify — the whole group animates smoothly, never frozen.
  if (o.life) { next.anim = o.life; next.loop = true; next.world = true; next.from = {}; next.to = {}; next.start = 0; next.dur = 1; next.lifePhase = hashPhase(id); }
  // Offsets/scale ride on top of whatever the entrance already animates, so they are
  // kept separate from from/to rather than folded in — see styleFor.
  if (o.x !== undefined || o.y !== undefined || o.scale !== undefined || o.rotate !== undefined || o.opacity !== undefined) {
    next.adjust = { x: o.x, y: o.y, scale: o.scale, rotate: o.rotate, opacity: o.opacity };
  }
  if (o.emphasis) {
    next.emphasis = { scale: o.emphasis.scale ?? 1.08, dur: o.emphasis.dur ?? 400, at: o.emphasis.at ?? 0 };
  }
  return next;
}

// Give every element its own phase so they breathe independently — a shared phase
// makes a frame pulse as one block, which reads as mechanical rather than alive.
// Gentle content drift ("characters breathe, discs drift" — kv14 §2.5). Never on
// text/arrows/world (NO_DRIFT), never re-applied where the spec or an override
// already set a loop/idle/orbit. Vessels use their id (VESSEL_RE) so a vessel the
// design mislabelled by role still rocks; everything else keys on role.
function withDrift(rec: Rec, role: string, id: string, idx: number): Rec {
  if (rec.world || rec.idle || rec.loop || rec.orbit) return rec;
  // Only genuine VESSELS drift (they rock — the film's maritime signature). Blanket
  // content drift was tested at four amplitudes/rates/phasings and every one measured
  // 37-52% frame-diff jitter, because CSS-transforming many edged content groups a
  // sub-to-few pixels re-rasterises their anti-aliased edges into a choppy aggregate —
  // whereas the reference (and our WorldLayer) move smoothly. The 13 diagram scenes
  // that already pass do so WITHOUT content drift (spec idle + draw give them smooth
  // motion); the genuinely-still scenes are lifted by the WorldLayer atmosphere, which
  // recomputes geometry and measures 0% jitter. So content holds after entrance; the
  // world carries the ambient — exactly the reference's "content still, water alive".
  if (!VESSEL_RE.test(id)) return rec;
  const phase = ((idx * 137.508) % 360) * (Math.PI / 180);
  return { ...rec, idle: { ...DRIFT.ship, phase } };
}

// Attach measured metrics to a text record and retime it to the typing rate.
// The element keeps its cued/spec START — only the duration becomes the time the
// glyphs take to arrive, so existing VO sync is untouched.
function withType(rec: Rec, svgFile: string, id: string): Rec {
  const m = metricFor(svgFile, id);
  if (!m || !m.lines?.length || !m.chars) return rec;
  const o = overrideFor(svgFile, id);
  if (o?.type === false) return rec;                    // show it whole, no typing
  const cps = o?.cps && o.cps > 0 ? o.cps : TYPE_CPS;
  const dur = Math.min((m.chars / cps) * 1000, TYPE_MAX_MS);
  return { ...rec, type: m, dur, noCaret: o?.caret === false };
}

// ─── THE HOUSE BUOY SPRING ───────────────────────────────────────────────────
// The reference has ONE entrance curve: Remotion's spring with config
// {damping:200, stiffness:120, mass:0.9} (reference/ballast-water/remotion/
// SvgFrame.jsx BUOY, driven by remotion's spring()). Remotion normalises this to
// a snappy float-in that settles ~0.7s with NO overshoot (0.32@0.1s, 0.86@0.3s,
// 0.98@0.5s, 1.0 by 0.73s). Use Remotion's own spring() so our entrances are
// bit-identical to the reference's — a hand-rolled ODE integrates to a different,
// far slower curve (0.45@1s) and is not what the reference feels like. This is the
// SOLE entrance curve now; the old cubic-bezier easeFn was retired with it, since
// the reference has no non-spring entrance and no overshoot.
const BUOY = { damping: 200, stiffness: 120, mass: 0.9 };
// Spring value 0→1 for `elapsedMs` since the entrance started.
function buoy(elapsedMs: number, fps: number): number {
  if (elapsedMs <= 0) return 0;
  return spring({ frame: (elapsedMs / 1000) * fps, fps, config: BUOY });
}

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
  loop?: boolean;
  idle?: { amp: number; period: number; rot?: number; phase?: number };
  shake?: boolean;
  orbit?: { period: number; deg: number };
  draw?: boolean;
  // Continuous marching of a dotted stroke (the decorative rings around icons, and
  // dotted rectangles). The dashes travel along the stroke — for a ring that reads
  // as rotation. Varied per element (dir + speed) so no two read the same. See the
  // dash-ring pass in planAndWrap and the 'ring-march' branch in styleFor.
  march?: { pxPerFrame: number; dir: number };
  // Phase (0..2π) for an ambient-life loop (fish-swim / plant-warp / coral-sway), so
  // each element moves on its own beat rather than the whole school pulsing as one.
  lifePhase?: number;
  // Set for <text> that has measured metrics — drives the character-exact
  // clip reveal and the caret. See TYPE-ON above.
  type?: TextMetric;
  noCaret?: boolean;
  // One-time punch-and-settle after the entrance, from frame-overrides.json emphasis.
  emphasis?: { scale: number; dur: number; at: number };
  // Static ambient composition (bg/env/waves/decor) — excluded from idle and spin.
  world?: boolean;
  // Static nudge from frame-overrides.json, applied ON TOP of whatever the
  // entrance animates, so hand-correcting a position never disturbs its motion.
  adjust?: { x?: number; y?: number; scale?: number; rotate?: number; opacity?: number };
}

// Spec element -> Rec. The spec's `easing` is ignored now: every timed entrance
// rides the house buoy spring (see buoy()), so there is no per-element ease curve.
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
    loop: Boolean(e.loop),
    idle: e.idle ? { amp: peak(e.idle.translateY)!, period: e.idle.dur, rot: peak(e.idle.rotate) } : undefined,
    orbit: e.orbit ? { period: e.orbit.dur, deg: e.orbit.rotate[1] - e.orbit.rotate[0] } : undefined,
    draw,
  };
}

// ─── recipe by role (ported; idle/shake simplified for the interpreter) ────────
function recipe(role: string, idx: number, anchorX: number, frameMs: number): Rec {
  const stag = (n: number, g: number) => Math.round(n) * g;
  const r = recipeRaw(role, idx, anchorX, frameMs, stag);
  // "Base lands <=2s, then content builds" (knowledge-vault 14 §2.1, §4.2). recipe() is
  // the fallback for elements the design did NOT tag with data-t — i.e. base/structure,
  // since it tags real narrated content explicitly. The role stagger (e.g. default
  // 700 + idx*90) can push the 9th+ untagged element past 2s, leaving base structure
  // arriving late. Cap the fallback start so base establishes fast, together, never
  // lagging. Looping ambients (start 0) and data-t content (own start via withData)
  // are untouched — only the untagged fallback is clamped.
  if (!r.loop && r.start > 1400) r.start = 1400;
  return r;
}
function recipeRaw(role: string, idx: number, anchorX: number, frameMs: number, stag: (n: number, g: number) => number): Rec {
  switch (role) {
    case 'background': return { anim: 'fade', from: { opacity: 0 }, to: { opacity: 1 }, start: 0, dur: 400 };
    case 'ambient':    return { anim: 'wave-drift', from: { translateX: -14 }, to: { translateX: 14 }, start: 0, dur: Math.min(frameMs, 9000), loop: true };
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
      // People hold after landing (reference: only tagged things move); no idle.
      return { anim: 'slide-fade', from, to: { opacity: 1, translateX: 0, translateY: 0 }, start: 660 + stag(idx, 120), dur: 640 };
    }
    case 'circle':     return { anim: 'pop-scale', from: { opacity: 0, scale: 0.6 }, to: { opacity: 1, scale: 1 }, start: 800 + stag(idx, 150), dur: 480 };
    case 'icon':       return { anim: 'pop', from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 }, start: 900 + stag(idx, 110), dur: 440 };
    case 'arrow':      return { anim: 'draw', from: { opacity: 0 }, to: { opacity: 1 }, start: 1060 + stag(idx, 120), dur: 460 };
    case 'stat':       return { anim: 'count-scale', from: { opacity: 0, scale: 0.7 }, to: { opacity: 1, scale: 1 }, start: 500, dur: 950 };
    case 'alert':      return { anim: 'pop-shake', from: { opacity: 0, scale: 0 }, to: { opacity: 1, scale: 1 }, start: 1250, dur: 520, shake: true };
    case 'watermark':  return { anim: 'fade-pulse', from: { opacity: 0 }, to: { opacity: 0.12 }, start: 250, dur: 800, loop: true };
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

// ─── DOTTED-RING / -RECTANGLE MARCHING ───────────────────────────────────────
// The reference never leaves a dotted ring static: once its icon lands, the ring's
// dashes travel continuously round the stroke (which reads as a slow rotation), and
// each ring runs at its OWN speed and direction so a cluster never marches in
// lockstep. Our frames carry these as dashed <path> arcs (12 of 20 frames — often
// split into several arcs per ring, which is why we march the dashes rather than
// rotate: marching needs no centre and works on a split ring). Dashed <rect>/<circle>
// get the identical treatment when the design uses them (there are none today — see
// scripts/audit-ring-animation.js, which verifies coverage). Connector arrows are
// dashed <line>s that DRAW ON as an entrance, so <line> is excluded here — marching
// them would fight their reveal.
// The selector shared with the audit (keep the two in step):
export const RING_TAGS = ['path', 'circle', 'ellipse', 'rect'] as const;
export const RING_SKIP_ANCESTOR = /connector|arrow|link|flow|\bconn\b|draw/i;
export function isDashRing(el: Element): boolean {
  if (!(RING_TAGS as readonly string[]).includes(el.tagName.toLowerCase())) return false;
  const da = el.getAttribute('stroke-dasharray');
  if (!da || da === 'none') return false;
  if (el.hasAttribute('pathLength')) return false;              // a draw-on reveal, not a ring
  const stroke = el.getAttribute('stroke');
  if (!stroke || stroke === 'none') return false;
  for (let p: Element | null = el; p; p = p.parentElement) {
    const pid = p.getAttribute?.('id');
    if (pid && RING_SKIP_ANCESTOR.test(pid)) return false;      // inside a connector/arrow group
  }
  return true;
}
// Deterministic per-ring speed + direction from its index. Varied, never uniform:
// half the rings run one way, half the other, at 0.70–1.59 px/frame.
function marchFor(n: number): { pxPerFrame: number; dir: number } {
  const h = Math.imul(n + 1, 2654435761) >>> 0;
  // 2.4–4.3 px/frame: fast enough that the dashes VISIBLY travel round the stroke
  // (the old 0.7–1.6 read as barely moving under the icon's own bob — review: "the
  // dotted stroke is not marching"). Still varied per ring, half each direction.
  return { pxPerFrame: 2.4 + ((h >>> 3) % 20) / 10, dir: (h & 1) ? 1 : -1 };
}
// Give every dotted ring/rect a unique id and a continuous march. Run AFTER the main
// wrap so draw-groups have already stamped pathLength on their shapes (excluded above).
function markDashRings(svg: Element, plan: PlanItem[]): number {
  let n = 0;
  for (const el of Array.from(svg.querySelectorAll(RING_TAGS.join(',')))) {
    if (!isDashRing(el)) continue;
    let id = el.getAttribute('id');
    if (!id) { id = 'dring_' + n; el.setAttribute('id', id); }
    plan.push({ sel: '#' + id, role: 'dring', idx: n, rec: { anim: 'ring-march', from: {}, to: {}, start: 0, dur: 1000, loop: true, march: marchFor(n) } });
    n++;
  }
  return n;
}

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
  const sceneStartSec = START_BY_FILE[svgFile] ?? 0;

  // BORDER / CONSTRUCTION GUIDES must never render (Comments c50/c51: a partial border
  // guideline showed at scene edges — "should never appear in any frame, REMOVE"). These
  // are Illustrator artboard/guide layers (guide_grid + any *guideline*) that leaked into
  // the export. Strip them from every frame, wherever they nest.
  svg.querySelectorAll('[id="guide_grid"],[id*="guideline"],[id*="guide_grid"]').forEach((el) => el.parentNode?.removeChild(el));

  const plan: PlanItem[] = [];
  const roleCount: Record<string, number> = {};
  let dividerHead: Element | null = null;

  // text_N is assigned over EVERY <text> in the document, in document order —
  // not just root children. The mp_v2 export nests its text inside group
  // hierarchies, and a root-children-only walk found zero text in all 20 frames,
  // which silently disabled the type-on entirely (and produced an empty
  // text-metrics.json). Walking the whole tree keeps the ids stable regardless of
  // how deeply a given export decides to nest.
  // scripts/build-text-metrics.js walks identically — keep the two in step.
  // Drop stacked duplicates first. The mp_v2 export ships some titles 2-3x —
  // byte-identical content at an identical transform (frame_2 alone has "04" three
  // times and six doubled card titles; audit-fonts counts 13 across the film). Left
  // in, each copy types on its own schedule and they ghost through one another.
  // Matching on content+transform is exact, so this can never merge two genuinely
  // different labels that happen to read the same.
  // scripts/build-text-metrics.js dedupes identically — keep the two in step or
  // text_N indices diverge and every caret lands on the wrong element.
  const allTexts: Element[] = [];
  const seenText = new Set<string>();
  for (const t of Array.from(svg.querySelectorAll('text'))) {
    const key = (t.textContent || '').replace(/\s+/g, ' ').trim() + '|' + (t.getAttribute('transform') || '');
    if (seenText.has(key)) { t.parentNode?.removeChild(t); continue; }
    seenText.add(key);
    allTexts.push(t);
  }
  const textId = new Map<Element, string>();
  allTexts.forEach((t, i) => textId.set(t, 'text_' + i));
  const wrappedTexts = new Set<Element>();

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
      // One clip rect per LINE, unioned by <clipPath>. A CSS polygon() cannot do
      // this — it is a single closed path, so disjoint per-line regions (which is
      // what centred multi-line text produces) get joined into one wrong shape.
      // Each rect is drawn at full line width and revealed by CSS scaleX from its
      // own left edge, so the reveal snaps to measured character boundaries.
      const lineH = m.h / Math.max(1, m.lines.length);
      const cp = doc.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      cp.setAttribute('id', 'typeclip_' + id);
      cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
      m.lines.forEach((ln, li) => {
        const r = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('id', 'typeclip_' + id + '_' + li);
        r.setAttribute('x', String(ln.x0));
        r.setAttribute('y', String(ln.y - lineH * 0.85));
        r.setAttribute('width', String(Math.max(1, ln.x1 - ln.x0)));
        r.setAttribute('height', String(lineH * 1.15));
        cp.appendChild(r);
      });
      g.appendChild(cp);
      el.setAttribute('clip-path', 'url(#typeclip_' + id + ')');

      const caretG = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (m.transform) caretG.setAttribute('transform', m.transform);
      const caret = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      caret.setAttribute('id', 'caret_' + id);
      // Sized to the CHARACTER (cap) height, sitting on the baseline — not the full
      // line box. lineH = m.h/lines includes ascender+descender+leading, so a caret at
      // 0.85·lineH stood ~1.7x the cap height and dipped below the baseline: reviewed as
      // "the cursor is very huge" (Comments c17, a global note). Cap height is ~0.55·lineH
      // (measured: line-spacing 98 vs m.h/lines 114, caps ~59). So height=0.55·lineH with
      // the bottom on the baseline makes the caret exactly as tall as the letters.
      const capH = lineH * 0.55;
      caret.setAttribute('x', String(m.lines[0].x0));
      caret.setAttribute('y', String(m.lines[0].y - capH));
      caret.setAttribute('width', String(Math.max(2, lineH * 0.045)));
      caret.setAttribute('height', String(capH));
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
      id = textId.get(el) || null;
      if (!id) continue;
      wrappedTexts.add(el);
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
    const base = withData(se ? fromSpec(se) : recipe(role, idx, anchorX, frameMs), el, role, sceneStartSec);
    const rec = withCue(base, svgFile, id);
    const finalRec = withOverride(withSpin(withDrift(withType(rec, svgFile, id), role, id, idx), id), svgFile, id, sceneStartSec);
    // hide: true — drop the element from the DOM entirely rather than animating it to
    // opacity 0, so it costs nothing to render and cannot be caught mid-transition.
    if (!finalRec) { el.parentNode!.removeChild(el); continue; }
    wrap(el, id, role, idx, finalRec);
  }

  // Any <text> the root loop did not reach — nested inside a group, which is how
  // divider frames have always carried their labels and how the whole mp_v2 export
  // is built. Wrapping them here is what keeps type-on working no matter how deep
  // the artwork nests. A text inside an already-wrapped group still gets its own
  // wrapper: the group animates the block, this animates the glyphs.
  for (const t of allTexts) {
    if (wrappedTexts.has(t)) continue;
    const id = textId.get(t)!;
    const idx = Number(id.slice(5));
    const se = spec?.get(id);
    const base = se ? fromSpec(se) : recipe('text', idx, readAnchor(t), frameMs);
    const rec = withOverride(withType(withCue(base, svgFile, id), svgFile, id), svgFile, id, sceneStartSec);
    if (!rec) { t.parentNode!.removeChild(t); continue; }
    wrap(t, id, 'text', idx, rec);
  }

  // SEQUENTIAL HEADING TEXT (Comments c18): the title and subheading must not type at
  // the same time — the subheading types after the title finishes. Applies to a scene's
  // HEADING texts only (not inside a card: each card's text types on its own when the
  // card lands, per c15). Ordered top-to-bottom, each delayed to start after the one
  // above it completes. Only ever DELAYS (never advances), so it cannot pull a caption
  // ahead of its cue.
  const HEAD_GAP = 140;
  const tyOf = (m?: TextMetric) => {
    const n = (m?.transform || '').match(/-?\d*\.?\d+/g);
    return n && n.length >= 6 ? parseFloat(n[5]) : 0;   // matrix(a b c d e f) -> f
  };
  const heads = plan
    .filter((p) => p.role === 'text' && p.rec.type)
    .map((p) => ({ p, el: svg.querySelector(p.sel) as Element | null }))
    .filter((x) => x.el && !x.el.closest('g[data-layer="card"]'))
    .sort((a, b) => tyOf(a.p.rec.type) - tyOf(b.p.rec.type));
  let prevEnd = -Infinity;
  for (const { p } of heads) {
    if (p.rec.start < prevEnd + HEAD_GAP) p.rec.start = prevEnd + HEAD_GAP;
    prevEnd = p.rec.start + p.rec.dur;
  }

  // CONTENT AFTER THE TITLE (global build-order rule — Comments c19/c22/c31/c33/c37/c51/
  // c55/c56: "before the title text appears, no elements should appear"). Once the last
  // heading text has typed, gate every CONTENT element to start no earlier than that.
  // Only DELAYS (never advances), so a caption already cued later than the title keeps
  // its time; anything the export placed at t≈0 is held until the title is in. World
  // (waves/ambient), the heading texts themselves, and looping ambience are exempt. A
  // small per-item stagger by original order keeps the held ones from all snapping in at
  // once — the per-scene cues then refine the one-by-one build.
  const headSel = new Set(heads.map((h) => h.p.sel));
  const titleEnd = heads.length ? Math.max(...heads.map((h) => h.p.rec.start + h.p.rec.dur)) : 0;
  if (titleEnd > 0) {
    let k = 0;
    for (const p of plan) {
      if (p.rec.world || p.rec.loop || headSel.has(p.sel)) continue;
      if (p.rec.start < titleEnd) { p.rec.start = titleEnd + (k % 8) * 90; k++; }
    }
  }

  // ORPHAN OVERRIDE TARGETS. A review region often points at a NESTED shape (the helm
  // glyph inside a pillar, a mislabelled plant deep in a decor group) whose id we learn
  // from scripts/resolve-comment-targets.js. The main walk only wrapped ROOT children,
  // so those nested ids carry no plan item and their override silently did nothing. Wrap
  // any override id we did not already reach, so spin/idle/life/hide on an inner shape
  // actually applies. It rides INSIDE its animated parent, so it still enters on the
  // parent's cue and only adds its own motion.
  for (const oid of Object.keys(OVERRIDES[svgFile] || {})) {
    if (RESERVED.has(oid)) continue;
    if (plan.some((p) => p.sel === '#anim_' + oid)) continue;      // already wrapped
    const el = svg.querySelector('[id="' + oid.replace(/(["\\])/g, '\\$1') + '"]') as Element | null;
    if (!el || el.tagName.toLowerCase() === 'text') continue;
    const base: Rec = { anim: 'hold', from: { opacity: 1 }, to: { opacity: 1 }, start: 0, dur: 1 };
    const rec = withOverride(base, svgFile, oid, sceneStartSec);
    if (!rec) { el.parentNode?.removeChild(el); continue; }
    wrap(el, oid, classify(oid), 0, rec);
  }

  // Dotted rings/rectangles: mark and schedule their continuous march. Done last so
  // it sees the final tree (including pathLength stamped on any draw-group shapes).
  markDashRings(svg, plan);

  const skeleton = new XMLSerializer().serializeToString(svg);
  return { skeleton, plan };
}

// Per-frame CSS for the whole plan. localFrame is 0-based within the scene.
export function styleFor(plan: PlanItem[], localFrame: number, fps: number): string {
  const ms = (localFrame / fps) * 1000;
  const out: string[] = [];

  for (const p of plan) {
    const r = p.rec;

    // Dotted-ring / dotted-rectangle marching. Emits ONLY a stroke-dashoffset — the
    // element keeps its own dasharray and its visibility/position come from the icon
    // group it lives inside (so it appears on that icon's cue, then marches until the
    // scene ends). A continuous linear offset makes the dashes flow round the stroke;
    // dir and pxPerFrame are varied per element so three rings never move alike.
    if (r.anim === 'ring-march') {
      const off = localFrame * r.march!.pxPerFrame * r.march!.dir;
      out.push(`${p.sel}{stroke-dashoffset:${off.toFixed(2)}px;}`);
      continue;
    }

    // Ambient LIFE in the world layer — smooth, never jittery (Comments c12/c13/c27).
    // Fish glide (translate), seaweed/plants wave-warp (skewX from the base, like a
    // frond in current), coral sways (rotate from the base). Each on its own phase.
    if (r.anim === 'bubble-rise') {
      // The decor bubble cluster drifts UP and recycles, fading in low and out high —
      // the reset happens while invisible, so it loops seamlessly with no teleport.
      const t = localFrame / fps;
      const cyc = ((t / 7) + (r.lifePhase ?? 0) / (2 * Math.PI)) % 1;
      const up = -70 * cyc;
      const grow = 1 + 0.4 * cyc;
      const op = Math.sin(cyc * Math.PI);
      out.push(`${p.sel}{transform:translateY(${up.toFixed(1)}px) scale(${grow.toFixed(3)});opacity:${op.toFixed(3)};transform-box:fill-box;transform-origin:bottom center;}`);
      continue;
    }
    if (r.anim === 'fish-swim' || r.anim === 'plant-warp' || r.anim === 'coral-sway') {
      const t = localFrame / fps;
      const ph = r.lifePhase ?? 0;
      let tf: string;
      if (r.anim === 'fish-swim') {
        // A slow horizontal glide + gentle vertical rise/fall — reads as the school
        // swimming in the current, not vibrating in place.
        const gx = Math.sin((2 * Math.PI * t) / 7 + ph) * 26;
        const gy = Math.sin((2 * Math.PI * t) / 3.8 + ph * 1.3) * 6;
        tf = `transform:translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px);transform-box:fill-box;transform-origin:center;`;
      } else if (r.anim === 'plant-warp') {
        // Seaweed sway: skew from the ANCHORED base so the tips move most — the "wave
        // warp" the reviewer asked for, and inherently smooth (one slow sine).
        const sk = Math.sin((2 * Math.PI * t) / 4.6 + ph) * 6;
        const sw = Math.sin((2 * Math.PI * t) / 6.3 + ph) * 2;
        tf = `transform:skewX(${sk.toFixed(2)}deg) translateX(${sw.toFixed(2)}px);transform-box:fill-box;transform-origin:bottom center;`;
      } else {
        const ro = Math.sin((2 * Math.PI * t) / 5.2 + ph) * 3;
        tf = `transform:rotate(${ro.toFixed(2)}deg);transform-box:fill-box;transform-origin:bottom center;`;
      }
      out.push(`${p.sel}{${tf}}`);
      continue;
    }

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
      // The house BUOY spring drives every timed entrance (reference FrameStage).
      // Overdamped -> a smooth float-in with no overshoot. Opacity ramps a touch
      // faster than the transform so a card is readable before it fully settles.
      const e = buoy(ms - r.start, fps);
      const eOp = buoy((ms - r.start) * 1.6, fps);
      const lerp = (a = 0, b = 0) => a + (b - a) * e;
      if ('opacity' in r.from || 'opacity' in r.to) opacity = (r.from.opacity ?? 1) + ((r.to.opacity ?? 1) - (r.from.opacity ?? 1)) * eOp;
      if ('translateX' in r.from || 'translateX' in r.to) tx = lerp(r.from.translateX ?? 0, r.to.translateX ?? 0);
      if ('translateY' in r.from || 'translateY' in r.to) ty = lerp(r.from.translateY ?? 0, r.to.translateY ?? 0);
      if ('scale' in r.from || 'scale' in r.to) scale = lerp(r.from.scale ?? 1, r.to.scale ?? 1);
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

    // Emphasis punch — a one-time scale bump after the element lands, on the beat
    // the VO stresses it. A single sine hump (up then back to 1), so it reads as an
    // accent, not a bounce.
    if (r.emphasis) {
      const t0 = r.start + r.dur + r.emphasis.at * 1000;
      if (ms >= t0 && ms < t0 + r.emphasis.dur) {
        const e = (ms - t0) / r.emphasis.dur;             // 0..1
        scale *= 1 + (r.emphasis.scale - 1) * Math.sin(e * Math.PI);
      }
    }

    // Hand adjustments from frame-overrides.json ride ON TOP of the animated values,
    // so nudging a position never disturbs the entrance or the idle it already has.
    if (r.adjust) {
      tx += r.adjust.x ?? 0;
      ty += r.adjust.y ?? 0;
      if (r.adjust.scale !== undefined) scale *= r.adjust.scale;
      rot += r.adjust.rotate ?? 0;
      if (r.adjust.opacity !== undefined) opacity *= r.adjust.opacity;
    }

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
      const tp = Math.max(0, Math.min(1, (ms - r.start) / Math.max(1, r.dur)));
      let shown = Math.round(tp * m.chars);           // whole characters only

      // Walk the staircase: find which LINE the reveal is on and how far along it.
      // A single horizontal inset() cannot do this — it cuts every line at the same
      // width, so on line 2 the edge jumps back left and eats line 1. That is the
      // bug this replaced (mp_v2's two-line card titles rendered as "Master-l Rel.",
      // "Correctin Habits"). Same reason animationUtils.typewriterReveal builds a
      // staircase polygon rather than an inset.
      const W = (m.x1 - m.x0) || 1;
      const H = (m.y + m.h - m.y) || 1;
      const pctX = (x: number) => ((x - m.x0) / W) * 100;
      const pctY = (y: number) => ((y - m.y) / (m.h || 1)) * 100;

      let li = 0, edgeX = m.lines[0].x0, edgeY = m.lines[0].y;
      for (let i = 0; i < m.lines.length; i++) {
        const cnt = m.lines[i].xs.length - 1;
        if (shown > cnt) { shown -= cnt; li = Math.min(i + 1, m.lines.length - 1); continue; }
        li = i;
        edgeX = m.lines[i].xs[Math.max(0, Math.min(shown, cnt))];
        edgeY = m.lines[i].y;
        shown = 0;
        break;
      }
      if (tp >= 1) { li = m.lines.length - 1; edgeX = m.lines[li].x1; edgeY = m.lines[li].y; }

      // Drive each line's clip rect: fully open for lines already typed, partially
      // for the current one, closed for the rest. scaleX from the rect's own left
      // edge (transform-box:fill-box) means no coordinate maths here and no
      // dependence on how the browser resolves percentage reference boxes.
      for (let i = 0; i < m.lines.length; i++) {
        const ln = m.lines[i];
        const span = Math.max(1, ln.x1 - ln.x0);
        const k = i < li ? 1 : i > li ? 0 : Math.max(0, Math.min(1, (edgeX - ln.x0) / span));
        out.push(
          `#typeclip_${p.sel.slice(6)}_${i}{transform-box:fill-box;transform-origin:left center;` +
          `transform:scaleX(${(tp >= 1 ? 1 : k).toFixed(4)});}`
        );
      }

      // Caret rides the reveal edge — across AND down, so it follows the line break.
      const sinceDone = ms - (r.start + r.dur);
      const blinkOn = Math.floor(Math.max(0, ms - r.start) / CARET_BLINK_MS) % 2 === 0;
      const alive = ms >= r.start && sinceDone < CARET_HOLD_MS;
      const caretOp = !r.noCaret && alive && (tp < 1 || blinkOn) ? opacity : 0;
      out.push(
        `#caret_${p.sel.slice(6)}{opacity:${caretOp.toFixed(3)};` +
        `transform:translate(${(edgeX - m.lines[0].x0).toFixed(2)}px, ${(edgeY - m.lines[0].y).toFixed(2)}px);}`
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
