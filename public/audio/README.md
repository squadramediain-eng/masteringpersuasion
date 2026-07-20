# Audio

Drop the continuous voiceover here as **voiceover.mp3** (9:46 runtime).
MainComposition loads it via `staticFile('audio/voiceover.mp3')`.

After adding it, run `npm run check-audio` to confirm the measured duration
matches FINAL_FRAMES (17580 frames = 586s) in src/utils/sceneRegistry.ts.
