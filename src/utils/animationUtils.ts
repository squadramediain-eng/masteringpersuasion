import { interpolate, Easing } from 'remotion';

// ─── EASING PRESETS ──────────────────────────────────────────────────────────
export const ease = {
  // Smooth entry — most common for explainer elements
  smoothIn: Easing.bezier(0.4, 0, 0.2, 1),
  // Spring-like overshoot — good for icons popping in
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  // Gentle ease out — good for text reveals
  gentleOut: Easing.bezier(0, 0, 0.2, 1),
  // Linear — good for continuous loops (waves, rotation)
  linear: Easing.linear,
};

// ─── FADE ────────────────────────────────────────────────────────────────────
/**
 * Returns opacity 0→1 over durationFrames starting at delayFrames
 */
export const fadeIn = (
  frame: number,
  delayFrames = 0,
  durationFrames = 20
): number =>
  interpolate(frame, [delayFrames, delayFrames + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.smoothIn,
  });

/**
 * Returns opacity 1→0 over durationFrames starting at startFrame
 */
export const fadeOut = (
  frame: number,
  startFrame: number,
  durationFrames = 20
): number =>
  interpolate(frame, [startFrame, startFrame + durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.smoothIn,
  });

// ─── SLIDE ───────────────────────────────────────────────────────────────────
/**
 * Slide in from a direction. Returns translateX or translateY value (px).
 * direction: 'left' | 'right' | 'up' | 'down'
 */
export const slideIn = (
  frame: number,
  delayFrames = 0,
  durationFrames = 25,
  distance = 80,
  direction: 'left' | 'right' | 'up' | 'down' = 'left'
): number => {
  const from = direction === 'right' || direction === 'down' ? distance : -distance;
  return interpolate(frame, [delayFrames, delayFrames + durationFrames], [from, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.smoothIn,
  });
};

// ─── SCALE ───────────────────────────────────────────────────────────────────
/**
 * Scale in from scaleFrom to 1
 */
export const scaleIn = (
  frame: number,
  delayFrames = 0,
  durationFrames = 20,
  scaleFrom = 0.8
): number =>
  interpolate(frame, [delayFrames, delayFrames + durationFrames], [scaleFrom, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.spring,
  });

// ─── STAGGER ─────────────────────────────────────────────────────────────────
/**
 * Returns a delay offset for staggered animations.
 * Usage: fadeIn(frame, staggerDelay(index, 8))
 * index: element index (0-based)
 * staggerFrames: gap between each element's entry
 */
export const staggerDelay = (index: number, staggerFrames = 8): number =>
  index * staggerFrames;

// ─── WAVE LOOP ───────────────────────────────────────────────────────────────
/**
 * Continuous oscillation — good for wave motion.
 * Returns value between -amplitude and +amplitude
 */
export const waveLoop = (
  frame: number,
  periodFrames = 60,
  amplitude = 10,
  phaseOffset = 0
): number =>
  Math.sin(((frame + phaseOffset) / periodFrames) * 2 * Math.PI) * amplitude;

// ─── FLOAT LOOP ──────────────────────────────────────────────────────────────
/**
 * Gentle floating motion — good for ships, birds, clouds.
 * Returns translateY value in px.
 */
export const floatLoop = (
  frame: number,
  periodFrames = 90,
  amplitude = 8,
  phaseOffset = 0
): number =>
  Math.sin(((frame + phaseOffset) / periodFrames) * 2 * Math.PI) * amplitude;

// ─── SWIM ACROSS ─────────────────────────────────────────────────────────────
/**
 * Continuous one-directional drift across a wide span, wrapping seamlessly —
 * for fish/creatures that should actually swim across the frame rather than
 * idle-bob in place. Returns a translateX value in px.
 *
 * Travels `span` px over `periodFrames`, looping back to the start the
 * instant it reaches the end (no snap — the wrap point sits off-canvas when
 * `span` comfortably exceeds the visible width, e.g. 1920 + margin).
 *
 * Direction is right-to-left by default (most of this project's fish icons
 * face left, so right-to-left reads as swimming forward, not backward —
 * confirmed wrong the other way round during review). Pass a negative
 * `span` to swim left-to-right instead.
 */
export const swimAcross = (
  frame: number,
  periodFrames = 400,
  span = 2400,
  phaseOffset = 0,
  startOffset = -300,
  reverse = false
): number => {
  const t = ((frame + phaseOffset) % periodFrames) / periodFrames;
  return reverse ? startOffset + t * span : startOffset + span - t * span;
};

// ─── DRAW LINE ───────────────────────────────────────────────────────────────
/**
 * Animates strokeDashoffset to create a "draw on" line effect.
 * Pass totalLength (SVG path length) and get dashOffset back.
 */
export const drawLine = (
  frame: number,
  totalLength: number,
  delayFrames = 0,
  durationFrames = 30
): number => {
  const progress = interpolate(
    frame,
    [delayFrames, delayFrames + durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) }
  );
  return totalLength * (1 - progress);
};

// ─── COUNTER ─────────────────────────────────────────────────────────────────
/**
 * Animates a number from start to end over durationFrames.
 */
export const counter = (
  frame: number,
  from: number,
  to: number,
  delayFrames = 0,
  durationFrames = 60
): number =>
  interpolate(frame, [delayFrames, delayFrames + durationFrames], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.smoothIn,
  });

// ─── TEXT ANIMATIONS ─────────────────────────────────────────────────────────
// All text durations are multiplied by TEXT_SPEED_MULTIPLIER (1.7×) so text
// reads at a comfortable pace. Use textFadeIn for opacity-only text entries
// and textReveal for left-to-right clip-path word-by-word reveals.
export const TEXT_SPEED_MULTIPLIER = 1.7;

export const textFadeIn = (
  frame: number,
  delayFrames = 0,
  durationFrames = 20
): number => fadeIn(frame, delayFrames, Math.round(durationFrames * TEXT_SPEED_MULTIPLIER));

export const textReveal = (
  frame: number,
  delayFrames = 0,
  durationFrames = 25
): number =>
  interpolate(frame, [delayFrames, delayFrames + Math.round(durationFrames * TEXT_SPEED_MULTIPLIER)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.exp),
  });

// ─── TYPEWRITER REVEAL (multi-line) ─────────────────────────────────────────
/**
 * Per-line "typing cursor" reveal for a multi-line text block.
 * A single clip-path inset can only sweep ALL lines at once (same width cut on
 * every row) — wrong for a block with more than one line. This builds a
 * staircase clip-path polygon that reveals line 1 fully, then types line 2,
 * etc., and returns where the "|" cursor should sit for the CURRENT line only
 * (not the whole block) — sized to one line's height, off (opacity 0) once
 * the whole block has finished revealing.
 *
 * `progress` should already be 0→1 eased (e.g. via Easing.out(Easing.exp)).
 * `bounds` is the text block's own bounding box in SVG coordinates.
 */
export const typewriterReveal = (
  progress: number,
  lines: number,
  bounds: { left: number; top: number; right: number; bottom: number },
  frame = 0,
  snapPoints?: number[][]
) => {
  const { left, top, right, bottom } = bounds;
  const blockW = right - left;
  const blockH = bottom - top;
  const lineH = blockH / lines;
  // Feedback (v12): every scene's title was getting "caught" mid-type when paused
  // or scrubbed right after a scene cut — exactly when a reviewer naturally checks
  // a new scene, and exactly when a 1-3s typing window is most likely to still be
  // running. The fix isn't the cursor mechanics (already correct, see the
  // raw-progress note below) — it's that the typed-out window itself was wide
  // open to begin with. Compressing the reveal into the first ~36% of whatever
  // window each scene's own interpolate() call defines keeps every existing
  // start-frame (and therefore the VO-sync work already done) untouched, but
  // finishes "fully typed" far sooner, shrinking the catchable mid-type window to
  // a fraction of a second project-wide instead of 1-3+ seconds.
  const TYPING_SPEED_FACTOR = 2.8;
  const clamped = Math.min(1, Math.max(0, progress) * TYPING_SPEED_FACTOR);
  const lineFloat = clamped * lines;
  const currentLine = Math.min(lines - 1, Math.floor(lineFloat));
  const rawLineProgress = Math.min(1, lineFloat - currentLine);
  let lineProgress = rawLineProgress;

  // A plain width-percentage clip cuts straight through proportional-width
  // glyphs — visible as a sliver of the NEXT letter poking out past the
  // cursor (confirmed in rendered output: "Ballast Manag|g" with a stray
  // "g" leaking past the clip edge). `snapPoints[line]` holds the real
  // right-edge x-fraction of every text segment in that line, measured
  // straight from the SVG's own tspan x-positions (see
  // scripts/measure-typewriter-snap-points.js) — never hand-estimated.
  // Snapping reveal width DOWN to the nearest one means the clip edge only
  // ever lands between glyphs, never mid-glyph.
  const snaps = snapPoints?.[currentLine];
  if (snaps && snaps.length) {
    let snapped = 0;
    for (const s of snaps) {
      if (s <= lineProgress + 1e-6) snapped = s;
    }
    lineProgress = lineProgress >= 0.999 ? 1 : snapped;
  }

  // ROOT CAUSE (2026-06-26): every snapPoints/bounds measurement in this
  // project was taken by opening the raw SVG in a bare headless page with
  // NO font loaded. The title text's own stylesheet specifies
  // `font-family: DMSans-SemiBold, 'DM Sans'` — that font is only available
  // in the real Remotion render because Root.tsx calls loadFont(); the bare
  // measurement page silently fell back to a default system sans-serif.
  // Different fonts have different glyph widths (confirmed: "o" in the
  // fallback font is narrower than DM Sans Bold's "o" — the measured "end
  // of o" fraction landed at DM-Sans-rendered "o"'s visual MIDPOINT, not
  // its right edge, so the cursor drew right through the glyph, reading as
  // a "¢" symbol). Fixed at the source: scripts/full-remeasure-typewriter.js
  // now loads the real Google Fonts DM Sans stylesheet and waits for
  // document.fonts.ready before measuring, then rewrites every scene's
  // bounds AND snapPoints against the correct metrics. With accurate
  // measurements, only a tiny guard against antialiasing/hinting slop is
  // needed here — large compensations tuned earlier in this session (when
  // the measurements themselves were the actual bug) have been backed out.
  const OVERHANG_GUARD_RATIO = 0.01;
  const overhangGuard = blockW > 0 ? (lineH * OVERHANG_GUARD_RATIO) / blockW : 0;
  const clipLineProgress = lineProgress > 0 ? Math.max(0, lineProgress - overhangGuard) : 0;

  const pct = (v: number) => ((v / blockH) * 100).toFixed(2);
  const points: string[] = ['0% 0%'];
  for (let i = 0; i <= currentLine; i++) {
    const w = (i < currentLine ? 100 : clipLineProgress * 100).toFixed(2);
    points.push(`${w}% ${pct(i * lineH)}%`);
    points.push(`${w}% ${pct((i + 1) * lineH)}%`);
  }
  points.push(`0% ${pct((currentLine + 1) * lineH)}%`);

  // Cursor stays solidly visible for the whole typing pass (no blink — tried
  // blinking, the team didn't want it), but must be completely absent
  // BEFORE typing starts too (progress<=0) — was only checking the "done"
  // end, so the cursor sat visible at the text's start position for the
  // entire delay before the typewriter actually began. Same rule for every
  // scene using this utility.
  const cursorOpacity = (clamped <= 0 || clamped >= 0.99) ? 0 : 1;

  // Small fixed clearance so the cursor never sits flush against the last
  // character's own ink. Now that bounds/snapPoints are measured with the
  // real font loaded (see ROOT CAUSE note above), this only needs to cover
  // ordinary antialiasing slop, not font-mismatch drift. Sized relative to
  // line height so it scales with each scene's own font size.
  const CURSOR_GAP_RATIO = 0.035;
  const cursorGap = lineH * CURSOR_GAP_RATIO;

  // Cursor "stuck behind the last character" bug (project-wide, every scene
  // using this function): the cursor was positioned from the same SNAPPED
  // `lineProgress` as the clip edge — both held at the last completed
  // letter's position for the entire gap until the next letter's snap point
  // was crossed, so the cursor visually froze instead of leading. The clip
  // edge has to stay snapped (that's the fix for the "stray glyph poking
  // past the cursor" bug above) but the cursor itself has no glyph-overhang
  // constraint — it's a drawn rect, not a clip boundary. Using the RAW,
  // continuous per-frame progress for cursor position instead means it
  // glides smoothly ahead at a constant rate and is mathematically
  // guaranteed to sit at or ahead of the clip edge (raw >= its own snapped-
  // down value, always), never behind and never frozen.
  const cursorX = left + rawLineProgress * blockW + cursorGap;

  return {
    clipPath: `polygon(${points.join(', ')})`,
    cursorX,
    cursorY: top + currentLine * lineH,
    cursorHeight: lineH,
    cursorOpacity,
  };
};

// ─── EXPLAINER SEQUENCE ──────────────────────────────────────────────────────
/**
 * Standard explainer entry sequence timing.
 * Returns per-element opacity for a typical BG → subject → elements → text flow.
 * 
 * Usage:
 *   const seq = explainerSequence(frame);
 *   style={{ opacity: seq.bg }}
 *   style={{ opacity: seq.subject }}
 *   style={{ opacity: seq.elements }}
 *   style={{ opacity: seq.text }}
 */
export const explainerSequence = (frame: number) => ({
  bg: fadeIn(frame, 0, 15),
  subject: fadeIn(frame, 10, 20),
  elements: fadeIn(frame, 25, 20),
  text: fadeIn(frame, 40, 20),
});
