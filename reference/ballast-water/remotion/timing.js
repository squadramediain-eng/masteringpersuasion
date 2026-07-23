/* ============================================================
   timing.js — VO cue → frame-number resolver
   The bridge that makes visuals match narration BY CONSTRUCTION.

   Every CONTENT item in storyboard-data.js declares { cue, t }.
   `t` is the seconds value read from the word-timed transcript
   (uploads/ballast-reference-keyframes/00_transcript_timed.txt).
   Remotion works in frames, so we convert once here.

   If real timing is ever missing for a module, resolveByWords()
   estimates a timecode from word position at a speaking rate —
   good enough to block out a build, replace with real `t` later.
   ============================================================ */

const FPS = 30; // must match the Remotion composition fps

/** seconds → frame index */
export const sec = (s) => Math.round(s * FPS);

/** A scene's absolute start (seconds) is its first content beat, or its
 *  keyframe timecode "m:ss". Scene length runs to the next scene's start. */
export function parseTC(tc) {
  const [m, s] = String(tc).split(":").map(Number);
  return m * 60 + s;
}

/** Build an absolute timeline over ONE continuous world (no cuts).
 *  A scene's keyframe timecode `t` is the moment it is fully SETTLED, so the
 *  scene is on screen from partway through its transition-in until the next
 *  scene settles. We split adjacent scenes at the MIDPOINT between their
 *  settled timecodes, and pin scene 0 to frame 0 (cold open). Content beats
 *  keep their absolute timecodes, expressed as local frame offsets. */
export function buildTimeline(story, tailSec = 3) {
  const scenes = story.scenes;
  const settle = scenes.map((s) => parseTC(s.t));
  const startS = settle.map((s, i) =>
    i === 0 ? 0 : (settle[i - 1] + settle[i]) / 2
  );
  return scenes.map((s, i) => {
    const a = startS[i];
    const b = i + 1 < scenes.length ? startS[i + 1] : settle[i] + tailSec;
    return {
      scene: s,
      startF: sec(a),
      durF: Math.max(1, sec(b - a)),
      settleF: sec(settle[i] - a), // when the scene is fully composed
      beats: (s.content || []).map((c) => ({
        ...c,
        localF: Math.max(0, sec((c.t ?? settle[i]) - a)),
      })),
    };
  });
}

/** Fallback when a module has no real timings: estimate seconds from the
 *  cue word's position in the transcript at ~2.6 words/sec. */
export function resolveByWords(transcript, cue, wps = 2.6) {
  if (!cue || cue === "—") return null;
  const words = transcript.toLowerCase().split(/\s+/);
  const needle = cue.toLowerCase().split(/\s+/)[0];
  const idx = words.findIndex((w) => w.includes(needle));
  return idx < 0 ? null : idx / wps;
}
