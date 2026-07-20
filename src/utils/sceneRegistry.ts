// ─── SCENE REGISTRY ──────────────────────────────────────────────────────────
// Single source of truth for every timeline slot in Mastering Persuasion.
// Audio: single continuous voiceover (public/audio/mastering-persuasion.mp3, 9:46).
// startFrom = audioStartSec * FPS. Timings audio-locked from the Animation Guider
// and verified against public/animation/animation.json (all 20 rows match exactly).
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 30;
export const TRANSITION_FRAMES = 30;
// Scenes now run BACK-TO-BACK: each scene's durationFrames carries it to the next scene's
// audioStartSec, so the timeline has no dead slot. It used to leave a 1s hole (567f total)
// in which nothing rendered at all — a full second of flat light with the VO still
// talking, 19 times. audioStartSec is untouched, so every narration cue still lands
// exactly where it did. See knowledge-vault/12 - Motion & Frame Construction Spec.
export const SCENE_GAP_FRAMES = 0;
export const TOTAL_SCENES = 20;
export const TOTAL_FRAMES = 17580;
export const FINAL_FRAMES = 17580; // 586s * 30 = 9:46 audio-locked

export interface SceneEntry {
  id: string;
  label: string;
  svgFile: string;
  audioStartSec: number;
  durationFrames: number;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  batch: number;
  notes: string;
}

export const SCENE_REGISTRY: SceneEntry[] = [
  { id: 'scene-00', label: 'Cover — Mastering Persuasion', svgFile: 'frame_0.svg', audioStartSec: 0, durationFrames: 1020, status: 'done', batch: 1, notes: 'Cover' },
  { id: 'scene-01', label: 'What is Persuasion — Definition', svgFile: 'frame_1.svg', audioStartSec: 34, durationFrames: 750, status: 'done', batch: 1, notes: 'E · Convergence' },
  { id: 'scene-02', label: 'Six Key Areas — Overview', svgFile: 'frame_2.svg', audioStartSec: 59, durationFrames: 900, status: 'done', batch: 1, notes: 'Icon grid' },
  { id: 'scene-03', label: 'Section 1 — Safety Tool · AB & Bosun', svgFile: 'frame_3.svg', audioStartSec: 89, durationFrames: 690, status: 'done', batch: 1, notes: 'A · Section divider' },
  { id: 'scene-04', label: 'Persuasion Steps', svgFile: 'frame_4.svg', audioStartSec: 112, durationFrames: 1080, status: 'done', batch: 2, notes: 'F · Step flow' },
  { id: 'scene-05', label: 'Master-Pilot Rel. — Bridge Ops', svgFile: 'frame_5.svg', audioStartSec: 148, durationFrames: 540, status: 'done', batch: 2, notes: 'A · Section divider' },
  { id: 'scene-06', label: 'Bridge Scenario — Sail Area', svgFile: 'frame_6.svg', audioStartSec: 166, durationFrames: 990, status: 'done', batch: 2, notes: 'H · Scenario' },
  { id: 'scene-07', label: 'Compare — Aggressive vs Assertive', svgFile: 'frame_7.svg', audioStartSec: 199, durationFrames: 960, status: 'done', batch: 2, notes: 'B · Compare X/✓' },
  { id: 'scene-08', label: 'Correcting Habits — Securing Buy-In', svgFile: 'frame_8.svg', audioStartSec: 231, durationFrames: 630, status: 'done', batch: 3, notes: 'A · Section divider' },
  { id: 'scene-09', label: 'Strategy Table', svgFile: 'frame_9.svg', audioStartSec: 252, durationFrames: 1020, status: 'done', batch: 3, notes: 'C · Table' },
  { id: 'scene-10', label: 'The 30-Second Metric', svgFile: 'frame_10.svg', audioStartSec: 286, durationFrames: 870, status: 'done', batch: 3, notes: 'D · Stat' },
  { id: 'scene-11', label: 'Resolving Disputes — Terminal Conflicts', svgFile: 'frame_11.svg', audioStartSec: 315, durationFrames: 600, status: 'done', batch: 3, notes: 'A · Section divider' },
  { id: 'scene-12', label: 'Terminal Conflict — Compromise', svgFile: 'frame_12.svg', audioStartSec: 335, durationFrames: 870, status: 'done', batch: 4, notes: 'H · Scenario' },
  { id: 'scene-13', label: 'Escalate vs Compromise', svgFile: 'frame_13.svg', audioStartSec: 364, durationFrames: 1350, status: 'done', batch: 4, notes: 'B · Compare X/✓' },
  { id: 'scene-14', label: 'New Procedures — Engine Room', svgFile: 'frame_14.svg', audioStartSec: 409, durationFrames: 780, status: 'done', batch: 4, notes: 'A · Section divider' },
  { id: 'scene-15', label: 'What\'s In It For Me', svgFile: 'frame_15.svg', audioStartSec: 435, durationFrames: 1020, status: 'done', batch: 4, notes: 'E · Convergence' },
  { id: 'scene-16', label: 'Key Behaviours — Influence Styles', svgFile: 'frame_16.svg', audioStartSec: 469, durationFrames: 420, status: 'done', batch: 5, notes: 'A · Section divider' },
  { id: 'scene-17', label: 'Behaviour & Influence Table', svgFile: 'frame_17.svg', audioStartSec: 483, durationFrames: 870, status: 'done', batch: 5, notes: 'C · Table' },
  { id: 'scene-18', label: 'Persuasive Leader Traits', svgFile: 'frame_18.svg', audioStartSec: 512, durationFrames: 1050, status: 'done', batch: 5, notes: 'G · Circle cluster' },
  { id: 'scene-19', label: 'Why Influencing Is Vital', svgFile: 'frame_19.svg', audioStartSec: 547, durationFrames: 1170, status: 'done', batch: 5, notes: 'E · Convergence' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const getSceneById = (id: string) => SCENE_REGISTRY.find(s => s.id === id);
export const getScenesByBatch = (batch: number) => SCENE_REGISTRY.filter(s => s.batch === batch);
export const getScenesByStatus = (status: SceneEntry['status']) => SCENE_REGISTRY.filter(s => s.status === status);
export const getTotalDuration = () => SCENE_REGISTRY.reduce((sum, s) => sum + s.durationFrames, 0);
export const getAudioStartFrame = (id: string) => {
  const scene = getSceneById(id);
  return scene ? scene.audioStartSec * FPS : 0;
};
