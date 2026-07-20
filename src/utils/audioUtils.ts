// ─── AUDIO UTILITIES ─────────────────────────────────────────────────────────
// Helpers for working with voiceover MP3s in Remotion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert seconds to frames at 30fps
 */
export const secondsToFrames = (seconds: number, fps = 30): number =>
  Math.ceil(seconds * fps);

/**
 * Convert frames to seconds at 30fps
 */
export const framesToSeconds = (frames: number, fps = 30): number =>
  frames / fps;

/**
 * Add padding frames to an audio-driven duration.
 * Adds half a second before and after by default.
 * Use this when setting durationInFrames so the audio
 * doesn't get cut off right at the scene boundary.
 */
export const audioDuration = (
  durationSeconds: number,
  paddingSeconds = 0.5,
  fps = 30
): number => secondsToFrames(durationSeconds + paddingSeconds, fps);

// ─── AUDIO FILE NAMING CONVENTION ────────────────────────────────────────────
// All voiceover files go in: public/audio/
// Naming: scene-07.mp3, scene-08.mp3, ..., scene-28.mp3
// These filenames match the audioFile field in sceneRegistry.ts
//
// In Remotion components, reference as:
//   import { Audio, staticFile } from 'remotion';
//   <Audio src={staticFile('audio/scene-07.mp3')} />
//
// ─────────────────────────────────────────────────────────────────────────────
