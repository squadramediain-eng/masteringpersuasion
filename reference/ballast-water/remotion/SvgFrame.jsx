/* ============================================================
   SvgFrame.jsx — loads a REAL production frame (assets/illustrations/
   Ballast water svg files/Frame_NN.svg) and reveals it on-spec.

   THE CONTRACT (this is the design-system rule that guarantees the film
   looks like the approved one):

   A production SVG should ship with its top-level groups LABELLED:
     <g data-layer="world">…</g>     persistent — handed to <World/>, not here
     <g data-layer="base">…</g>      scaffold, present at local frame 0
     <g data-layer="ghost" data-beat="2">…</g>   low-opacity slot for beat 2
     <g data-layer="content" data-beat="1" data-enter="pop">…</g>
     <g data-layer="content" data-beat="2" data-enter="slide">…</g>

   Given those, this component builds the frame BEAT-BY-BEAT: base at t=0,
   each content group entering on its VO-derived frame with the house buoy,
   its ghost fading out as it lands. That is how a BUILD scene stays full
   at t=0 yet arrives in sync — the exact behaviour v1 was missing.

   FALLBACK (flat SVG, no labels — the 28 current files are flat):
   the whole settled frame enters once with the house entrance over the
   held wave world, and the title is re-typed by <Typewriter/> on top.
   Still never empty (world persists), still on-house — but it cannot do
   beat-level build. To get beat-level build, deliver labelled layers.
   ============================================================ */

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";

const BUOY = { damping: 200, stiffness: 120, mass: 0.9 };
const FRAME_DIR = "frames/"; // put the SVGs in Remotion public/frames/

/** entrance transform for a content group, COMPOSED after its base transform, as
 *  an SVG transform-attribute string. Center-scale uses data-cx/cy (absolute for
 *  groups with no base translate; local for groups that carry one). */
function enterTransform(kind, s, cx, cy) {
  const e = interpolate(s, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  if (/pop|scale|iris|badge|bloom/i.test(kind)) {
    const sc = 0.9 + 0.1 * e;
    return `translate(${cx * (1 - sc)} ${cy * (1 - sc)}) scale(${sc})`; // center-scale
  }
  if (/slide/i.test(kind)) return `translate(${40 * (1 - e)} 0)`;
  return `translate(0 ${24 * (1 - e)})`; // rise/fade default
}

/** Load the SVG text once (Remotion-safe with delayRender). */
function useSvgText(file) {
  const [markup, setMarkup] = React.useState(null);
  React.useEffect(() => {
    const handle = delayRender("svg:" + file);
    fetch(staticFile(FRAME_DIR + file))
      .then((r) => r.text())
      .then((t) => { setMarkup(t); continueRender(handle); })
      .catch((e) => { console.error("SvgFrame load failed", file, e); continueRender(handle); });
  }, [file]);
  return markup;
}

/** Sub-element animation driver. Any element the illustrator tags with a
 *  data-anim keyword animates every frame; magnitude can be bound to a tweak by
 *  name via data-tweak (so it shows up as a live control), else uses data-* defaults.
 *    data-anim="spin"  data-pivot="cx cy"  data-tweak="fan"   [data-speed=deg/frame]
 *    data-anim="shake" data-pivot="cx cy"  data-tweak="bell"  [data-amp=deg] [data-freq]
 *    data-anim="sway"  data-pivot="cx cy"  data-tweak="sway"  [data-amp=deg] [data-freq]
 *    data-anim="blink" data-tweak="thunder"                    [data-period=frames] [data-min=opacity]
 *  Elements NOT tagged are static — nothing animates by accident. */
function applyAnims(host, frame, tweaks) {
  host.querySelectorAll("[data-anim]").forEach((el) => {
    const kind = el.getAttribute("data-anim");
    const piv = (el.getAttribute("data-pivot") || "0 0").split(/[ ,]+/).map(Number);
    const key = el.getAttribute("data-tweak");
    const tv = key && tweaks[key] != null ? +tweaks[key] : null;
    if (kind === "spin") {
      const spd = tv != null ? tv : +el.getAttribute("data-speed") || 3;
      el.setAttribute("transform", `rotate(${(frame * spd).toFixed(2)} ${piv[0]} ${piv[1]})`);
    } else if (kind === "shake" || kind === "sway") {
      const amp = tv != null ? tv : +el.getAttribute("data-amp") || (kind === "shake" ? 8 : 1);
      const fr = +el.getAttribute("data-freq") || (kind === "shake" ? 0.8 : 0.045);
      el.setAttribute("transform", `rotate(${(Math.sin(frame * fr) * amp).toFixed(2)} ${piv[0]} ${piv[1]})`);
    } else if (kind === "blink") {
      const per = Math.max(1, tv != null ? tv : +el.getAttribute("data-period") || 8);
      const mn = +el.getAttribute("data-min") || 0.12;
      el.style.opacity = Math.floor(frame / per) % 2 === 0 ? "1" : String(mn);
    }
  });
}

/**
 * plan   — one entry from buildTimeline() (has scene + beats with localF)
 * file   — scene.srcSvg (e.g. "Frame_10.svg")
 * tweaks — live params (from the composition schema / Remotion Studio panel)
 */
export function SvgFrame({ plan, file, tweaks = {} }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const markup = useSvgText(file);
  const hostRef = React.useRef(null);

  // Parse once; detect whether the artist labelled layers.
  const parsed = React.useMemo(() => {
    if (!markup) return null;
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.querySelector("svg");
    const labelled = svg ? svg.querySelectorAll("[data-layer]").length > 0 : false;
    return { svg, labelled };
  }, [markup]);

  // Drive per-beat reveal when the frame is labelled.
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || !parsed || !parsed.labelled) return;

    // AUTO-GHOST + capture base transform (once). Real production frames ship no
    // separate ghost art and position content with their own transform attribute,
    // so: (a) clone each content group as a dim placeholder that reserves its slot
    // at t=0, and (b) remember the base transform so the entrance COMPOSES with it
    // instead of overriding it (which would snap the element to the frame origin).
    if (!host.__ghosted) {
      host.querySelectorAll('[data-layer="content"]').forEach((g) => {
        g.dataset.base = g.getAttribute("transform") || "";
        // only auto-ghost if the artist didn't hand-author one for this beat
        const beat = g.getAttribute("data-beat");
        const hasGhost = host.querySelector('[data-layer="ghost"][data-beat="' + beat + '"]') || host.querySelector('[data-ghostfor="' + beat + '"]');
        if (!hasGhost) {
          const clone = g.cloneNode(true);
          clone.removeAttribute("data-layer");
          clone.removeAttribute("id");
          clone.setAttribute("data-ghostfor", beat);
          clone.style.opacity = "0";
          // ghosts are static placeholders — don't let them animate
          clone.removeAttribute("data-anim");
          clone.querySelectorAll("[data-anim]").forEach((n) => n.removeAttribute("data-anim"));
          g.parentNode.insertBefore(clone, g);
        }
      });
      host.__ghosted = true;
    }

    // ghosts (hand-authored or auto): dim at t=0, fade out as their beat lands
    host.querySelectorAll('[data-layer="ghost"],[data-ghostfor]').forEach((g) => {
      const beat = +(g.getAttribute("data-beat") || g.getAttribute("data-ghostfor"));
      const b = plan.beats[beat - 1];
      const untilF = b ? b.localF : 0;
      g.style.opacity = interpolate(frame, [untilF - 6, untilF], [0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    });

    host.querySelectorAll('[data-layer="content"]').forEach((g) => {
      const beat = +g.getAttribute("data-beat");
      const b = plan.beats[beat - 1];
      const startF = b ? b.localF : 0;
      const s = spring({ frame: frame - startF, fps, config: BUOY });
      // opacity on the group; entrance transform COMPOSED after the group's own
      // base transform (captions keep their position; icons scale in place).
      g.style.opacity = interpolate(s, [0, 1], [0, 1], { extrapolateRight: "clamp" });
      const base = g.dataset.base || "";
      const cx = +g.getAttribute("data-cx") || 0;
      const cy = +g.getAttribute("data-cy") || 0;
      const tr = enterTransform(g.getAttribute("data-enter") || "", s, cx, cy);
      g.setAttribute("transform", (base + " " + tr).trim());
    });

    // sub-element (logo) animations — bell shake, thunder blink, fan/ring spin, sway.
    // Tweakable live via the composition schema; see the data-anim vocabulary above.
    applyAnims(host, frame, tweaks);
  }, [frame, parsed, plan, fps, JSON.stringify(tweaks)]);

  if (!markup) return null;

  // FALLBACK: flat SVG — settle the whole frame in with the house entrance.
  if (parsed && !parsed.labelled) {
    const s = spring({ frame: frame - Math.max(0, plan.settleF - 8), fps, config: BUOY });
    const o = interpolate(s, [0, 1], [0, 1], { extrapolateRight: "clamp" });
    const rise = interpolate(s, [0, 1], [18, 0], { extrapolateRight: "clamp" });
    return (
      <div
        style={{ position: "absolute", inset: 0, opacity: o, transform: `translateY(${rise}px)` }}
        data-flat-frame={file}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }

  // LABELLED: inject markup; the effect above animates its groups per beat.
  return (
    <div
      ref={hostRef}
      style={{ position: "absolute", inset: 0 }}
      data-frame={file}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
