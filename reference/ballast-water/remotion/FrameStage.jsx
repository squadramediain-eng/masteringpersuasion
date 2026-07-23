/* ============================================================
   FrameStage.jsx — renders ONE storyboard scene in Remotion as the
   three-layer system from the Motion & Frame Construction Spec.

   WORLD   → rendered by <World/> ABOVE this component, once, spanning
             the whole composition. It is NEVER remounted per scene, so
             the wave band + ambient are truly continuous (no cuts).
   BASE    → drawn at local frame 0, INCLUDING ghost placeholders, so a
             scene is never empty while it waits for content.
   CONTENT → each beat enters at its cue-derived local frame.

   You supply the actual artwork via `slots` (a map of slot-id → React
   node) and `ghosts` (slot-id → low-opacity placeholder node). This file
   owns only the TIMING + ENTRANCE MOTION, which is the logic the render
   kept getting wrong.
   ============================================================ */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
} from "remotion";

const BUOY = { damping: 200, stiffness: 120, mass: 0.9 }; // one house curve

/** entrance transforms keyed by the storyboard `enter` string */
function entrance(kind, t) {
  const e = interpolate(t, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const rise = interpolate(t, [0, 1], [18, 0], { extrapolateRight: "clamp" });
  const pop = interpolate(t, [0, 1], [0.9, 1], { extrapolateRight: "clamp" });
  if (/type/i.test(kind)) return { opacity: 1, __typewriter: e }; // handled by <Typewriter/>
  if (/pop|scale|iris|badge|bloom/i.test(kind))
    return { opacity: e, transform: `scale(${pop})` };
  if (/slide|float|rise|fade/i.test(kind))
    return { opacity: e, transform: `translateY(${rise}px)` };
  return { opacity: e };
}

/** one content beat — enters at localF, then holds */
function Beat({ beat, children }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - beat.localF, fps, config: BUOY });
  const style = entrance(beat.enter || "", s);
  return (
    <div style={{ position: "absolute", inset: 0, ...style }} data-cue={beat.cue}>
      {children}
    </div>
  );
}

/** ghost placeholder — always visible from frame 0, fades OUT as its
 *  content beat arrives (so the slot is reserved, never blank). */
function Ghost({ untilF, children }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [untilF - 6, untilF], [0.18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
}

export function FrameStage({ plan, slots = {}, ghosts = {} }) {
  const { scene, beats } = plan;
  const isBuild = /build/i.test(
    (scene.__mode || "") || (beats.length > 1 ? "build" : "establish")
  );
  return (
    <div style={{ position: "absolute", inset: 0 }} data-scene={scene.n} data-archetype={scene.archetype}>
      {/* BASE — present at local frame 0, incl. ghosts for every content slot */}
      {beats.map((b, i) =>
        ghosts[b.slot || i] ? (
          <Ghost key={"g" + i} untilF={b.localF}>
            {ghosts[b.slot || i]}
          </Ghost>
        ) : null
      )}
      {/* CONTENT — each beat enters on its cue-derived local frame */}
      {beats.map((b, i) => (
        <Beat key={"b" + i} beat={b}>
          {slots[b.slot || i] || null}
        </Beat>
      ))}
    </div>
  );
}

/** WORLD — mount ONCE, outside the scene switch, to keep the water
 *  continuous across the whole module. Cheap transform loops only. */
export function World({ children }) {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 4; // seamless ambient sway
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--wash-canvas,#f6f6fc)" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift}px)` }}>
        {children /* wave band SVG + fish/bubbles/seaweed */}
      </div>
    </div>
  );
}

/** Typewriter — the house title reveal (caret + per-char). */
export function Typewriter({ text, startF = 0, cps = 22, style }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - startF) / fps) * cps));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  return (
    <span style={style}>
      {shown}
      {!done && (
        <span style={{ borderRight: "3px solid var(--periwinkle,#6084f0)", marginLeft: 2 }} />
      )}
    </span>
  );
}
