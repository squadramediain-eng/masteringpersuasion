# Execution_Text — as-built choreography + review log per scene

One `Frame_XX.txt` per scene, created once that scene is built (none exist yet — this is
a fresh template). Two things live in each file:

1. **Choreography description** — what the scene does, frame by frame, written once the
   scene is built. Header must always have these two lines (checked by
   `scripts/audit-execution-text-freshness.js` against `sceneRegistry.ts`):
   ```
   FRAME_XX — <scene name>
   Appears in the video at: M:SS
   Scene length: N frames = S.0 seconds (30fps)
   ```
2. **Review log** — a `## Review — vN` checklist per review round, seeded automatically
   by `scripts/sync-review-to-execution-text.js`. See `skills/09-review-system.md`.
