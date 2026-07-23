/* ============================================================
   STS Motion — Ballast Water Management
   VO-first storyboard schema (the "logic we missed").

   Reconstructed from the founder-APPROVED film: 34 settled
   compositions, word-timed Whisper VO, and the senior
   illustrators' construction logic decoded from the keyframes.

   THE ONE LAW (top of every derived spec):
   The film is a SINGLE CONTINUOUS WORLD the camera never leaves.
   Frames do not cut — the furniture changes while the water stays.

   Every scene declares THREE layers so the animator can respect a
   distinction the artwork actually makes:
     WORLD   — always on screen, never rebuilt (wash + wave band +
               ambient sea life). This is the continuity glue.
     BASE    — the frame's scaffold, fully present at t=0, INCLUDING
               low-opacity GHOST PLACEHOLDERS that reserve every
               slot content will fill. A frame is NEVER blank while
               it waits for its content. (This is the direct fix for
               the "empty screens" bug.)
     CONTENT — the elements that ENTER, each bound to a VO cue word
               + timecode. On an ESTABLISH frame all content is in
               within 2–3s; on a BUILD frame it enters one beat at a
               time — but always into a ghost slot that already held
               the space.

   mode: "establish" | "build"
   Each content item: { el, cue (VO word that triggers it), t (sec),
     enter (entrance motion) }
   ============================================================ */

var BWM_STORYBOARD = {
  module: "Ballast Water Management",
  /* srcSvg on each scene → its REAL source frame in
     assets/illustrations/Ballast water svg files/ (28 illustrator SVGs).
     null = a pure motion state (divider/breath/sub-build) of an adjacent slide. */
  source: "Founder-approved film · 1920×1080 · 30fps · 9:11",
  runtime: 551,
  law: "One continuous world the camera never leaves — the furniture changes while the water stays. No hard cuts (verified: scene detection finds none even at threshold 0.1); content slides in and out over an unbroken wave band.",
  sections: [
    { id: "intro",     name: "Intro — your responsibility",     range: "0:00–0:28", scenes: [1, 2] },
    { id: "whatis",    name: "What ballast water is · impact",   range: "0:29–1:16", scenes: [3, 4, 5] },
    { id: "reg",       name: "Regulatory backbone",              range: "1:17–2:10", scenes: [6, 7, 8] },
    { id: "safety",    name: "§1 Safety First — gas & ventilation", range: "2:11–3:43", scenes: [9, 10, 11, 12, 13, 14] },
    { id: "maint",     name: "§2 Proactive Maintenance",         range: "3:44–4:38", scenes: [15, 16, 17] },
    { id: "cwq",       name: "Challenging Water Quality",        range: "4:39–5:53", scenes: [18, 19, 20, 21] },
    { id: "bypass",    name: "Bypass & decontamination",         range: "5:54–6:33", scenes: [22, 23, 24, 25] },
    { id: "record",    name: "§4 The Final Word — record book",  range: "6:34–8:51", scenes: [26, 27, 28, 29, 30, 31, 32, 33] },
    { id: "close",     name: "Close — your vessel's voice",      range: "8:52–9:11", scenes: [34] }
  ],

  /* archetype vocabulary observed across the film — maps to the
     existing slides/F01–F10 starting frames */
  archetypes: {
    cover:       { label: "Cover",              mode: "establish", note: "Two-tone title types on; hero ship rides the wave; spotlight disc + orbit top-corner." },
    establish:   { label: "Establishing shot",  mode: "establish", note: "One hero object (ship/emblem) center on the world; title types on. Whole in 2–3s." },
    divider:     { label: "Divider / title-only", mode: "establish", note: "Title types on with a visible cursor over the bare world. Minimal — the pause between sections." },
    section:     { label: "Section header",      mode: "establish", note: "Oversized lavender numeral + two-tone title + subtitle; hero + orbiting/ghost icon discs." },
    stat:        { label: "Stat",                mode: "establish", note: "Oversized gradient figure counts up; supporting line + motif. Number is the hero." },
    question:    { label: "Question",            mode: "establish", note: "Big two-tone question + supporting scene; optional icon chips build after." },
    quote:       { label: "Quote card",          mode: "establish", note: "Centered card on tinted wash; underline draws on; anchor/clipboard motif." },
    character:   { label: "Character scene",     mode: "establish", note: "Line-art crew posed toward props; one gesture per beat (handshake, point)." },
    concept:     { label: "Concept + portholes", mode: "build",     note: "Hero object; porthole discs populate via dashed connectors + node dots." },
    portsplit:   { label: "Split concept",       mode: "build",     note: "Title+paragraph one side; two labelled scenes the other; capsule/sample between." },
    timeline:    { label: "Timeline",            mode: "build",     note: "Milestone badges enter L→R along a baseline; connectors extend between them." },
    icongrid:    { label: "Icon grid / orbit",   mode: "build",     note: "Icon discs pop into an orbit around a pointing character, synced to VO items." },
    process:     { label: "Process (ConceptBoxes)", mode: "build",  note: "Numbered dashed/solid boxes fill one beat at a time from ghost slots." },
    compare:     { label: "Comparison",          mode: "build",     note: "Two cards (before/after) reveal in sequence; center ghost ring holds the axis." },
    table:       { label: "Data table",          mode: "build",     note: "Header bar first; rows drop in one per VO item; row icons fade after." }
  },

  /* per-scene plans — kf = keyframe file in uploads/ballast-reference-keyframes/ */
  scenes: [
    { n: 1, t: "0:10", kf: "keyframe_001_00m10s.png",srcSvg: "Frame_01.svg", section: "intro", archetype: "cover",
      vo: "We'll cover everything from day-to-day operations to staying compliant,",
      world: ["wash-canvas", "wave band (4-layer)", "coaster ship bobbing on the crest"],
      base: ["cover layout", "spotlight disc (droplet) + dashed orbit ring, top-right", "orbit node dots"],
      content: [
        { el: "Title ‘Ballast Water / Management’ (two-tone)", cue: "cover everything", t: 10, enter: "typewriter, per-word, blue→periwinkle, visible caret" },
        { el: "Droplet icon settles inside disc", cue: "—", t: 8, enter: "scale-in 0.9→1 + glow bloom" }
      ],
      motion: ["ship idle bob (±6px, 4s buoy loop)", "orbit node dots drift along ring"],
      character: null,
      transitionIn: "cold open — world fades up, ship sails in from right" },

    { n: 2, t: "0:21", kf: "keyframe_002_00m21s.png", srcSvg: null, section: "intro", archetype: "establish",
      vo: "So first, let's get aligned on what ballast water actually is.",
      world: ["wash-canvas", "wave band", "faint clouds"],
      base: ["bow-front vessel center-left", "concentric radar arcs behind vessel", "check-mark ticks + node dots on arcs"],
      content: [
        { el: "Bow-front ship rises into frame", cue: "let's get aligned", t: 20, enter: "slide up from wave + settle bob" },
        { el: "Section caret / title begins", cue: "what ballast water actually is", t: 23, enter: "typewriter caret blinking (title mid-type in still)" }
      ],
      motion: ["radar arcs breathe (scale 1→1.02)", "ship idle bob"],
      character: null,
      transitionIn: "cover title slides up & out; ship slides in over the SAME wave (no cut)" },

    { n: 3, t: "0:32", kf: "keyframe_003_00m32s.png",srcSvg: "Frame_02.svg", section: "whatis", archetype: "concept",
      vo: "It carries what we call suspended matter — sediments, microorganisms, and marine species.",
      world: ["wash-canvas", "wave band", "clouds"],
      base: ["bow ship left (carried over from scene 2)", "GHOST: two empty porthole disc outlines", "GHOST: dashed connector paths + node dots"],
      content: [
        { el: "Title ‘Ballast Management’", cue: "suspended matter", t: 30, enter: "typewriter" },
        { el: "Porthole disc 1 — clean seawater", cue: "sediments", t: 33, enter: "fill ghost slot, iris-open" },
        { el: "Porthole disc 2 — marine ecosystem (fish/coral)", cue: "marine species", t: 35, enter: "connector draws → disc iris-opens" },
        { el: "Label ‘Impact on marine ecosystem’", cue: "marine species", t: 36, enter: "fade + rise 8px" }
      ],
      motion: ["connector node dots pulse when path draws", "fish inside porthole 2 loop"],
      character: null,
      transitionIn: "ship stays put; radar arcs fade to ghost portholes — world unbroken" },

    { n: 4, t: "0:48", kf: "keyframe_004_00m48s.png",srcSvg: "Frame_03.svg", section: "whatis", archetype: "question",
      vo: "You are the first — and honestly the most important — line of defense for our marine ecosystems.",
      world: ["wash-canvas", "wave band", "underwater scene: seaweed, coral, fish school, bubbles (right)"],
      base: ["question layout (left)", "GHOST: three icon-chip slots (bottom-left)"],
      content: [
        { el: "Question ‘What is your role in protecting the oceans?’", cue: "line of defense", t: 48, enter: "typewriter, 3 lines, two-tone" },
        { el: "Chip: Actions (runner icon)", cue: "You are the first", t: 50, enter: "pop into ghost slot" },
        { el: "Chip: Attention to Details", cue: "most important", t: 51, enter: "pop" },
        { el: "Chip: Expertise (magnifier)", cue: "line of defense", t: 52, enter: "pop" }
      ],
      motion: ["seaweed sway (slow)", "fish school drift L→R", "bubbles rise loop"],
      character: null,
      transitionIn: "portholes recede; underwater flora grows up from the wave band" },

    { n: 5, t: "1:07", kf: "keyframe_005_01m07s.png",srcSvg: "Frame_04.svg", section: "whatis", archetype: "portsplit",
      vo: "…it can basically become an unintentional taxi service for invasive species.",
      world: ["wash-canvas", "wave band"],
      base: ["‘Ballast Water’ title + paragraph (left)", "GHOST: DISCHARGE + INTAKE scene slots (right)", "GHOST: sample-capsule slot (center-bottom)"],
      content: [
        { el: "Title + supporting paragraph", cue: "taxi service", t: 66, enter: "typewriter title, paragraph fade-in" },
        { el: "DISCHARGE crane+ship scene", cue: "unintentional", t: 68, enter: "slide in from right into ghost" },
        { el: "INTAKE crane+ship scene", cue: "invasive species", t: 70, enter: "slide in" },
        { el: "Ballast sample capsule (organisms)", cue: "invasive species", t: 71, enter: "rise + contents shimmer" }
      ],
      motion: ["capsule organisms drift", "crane hooks micro-sway"],
      character: null,
      transitionIn: "flora clears; two terminal scenes slide in over the same water" },

    { n: 6, t: "1:21", kf: "keyframe_006_01m21s.png",srcSvg: null, section: "reg", archetype: "establish",
      vo: "Before we go deeper, you need to understand the regulatory backbone behind everything you do.",
      world: ["wash-canvas", "wave band"],
      base: ["empty stage — IMO emblem slot top-left"],
      content: [
        { el: "IMO emblem", cue: "regulatory backbone", t: 21 + 60, enter: "fade + settle scale-in" }
      ],
      motion: ["emblem breathes subtly"],
      character: null,
      transitionIn: "quiet beat — stage clears to a single emblem; this is the run-up to the timeline (scene 7)" },

    { n: 7, t: "1:37", kf: "keyframe_007_01m37s.png",srcSvg: "Frame_05.svg", section: "reg", archetype: "timeline",
      vo: "It applies to most ships engaged in international voyages, with some exceptions like warships…",
      world: ["wash-canvas", "wave band"],
      base: ["IMO emblem (carried from scene 6) + title", "GHOST: 3 milestone slots on a baseline", "GHOST: connector segments"],
      content: [
        { el: "Title ‘Ballast Water Management Convention’", cue: "applies to most ships", t: 97, enter: "typewriter" },
        { el: "Milestone 2004 · Adopted", cue: "international voyages", t: 99, enter: "badge scale-in into ghost" },
        { el: "Milestone 2017 · In Force", cue: "exceptions", t: 101, enter: "connector extends → badge" },
        { el: "Milestone 2025 · Updates", cue: "warships", t: 103, enter: "connector (chevrons) → badge" }
      ],
      motion: ["milestone ring icons rotate once on entry", "connector chevrons march"],
      character: null,
      transitionIn: "emblem slides up to title position; timeline builds beneath it" },

    { n: 8, t: "2:00", kf: "keyframe_008_02m00s.png",srcSvg: "Frame_06.svg", section: "reg", archetype: "process",
      vo: "To comply, every vessel must carry an approved plan, a valid certificate, and a record book.",
      world: ["wash-canvas (tinted brighter)", "wave band", "underwater flora + bubbles (right)"],
      base: ["GHOST: D1 + D2 floating card slots (top)", "GHOST: connector drops to a center label", "faint construction ring (left)"],
      content: [
        { el: "Card D1 · Exchange", cue: "approved plan", t: 120, enter: "float-in + soft shadow" },
        { el: "Card D2 · Treatment", cue: "valid certificate", t: 122, enter: "float-in" },
        { el: "Label ‘Documentation For Compliance’", cue: "record book", t: 124, enter: "connectors draw down → label types on" }
      ],
      motion: ["cards hover (±3px offset loop)", "bubbles rise"],
      character: null,
      transitionIn: "timeline recedes; two cards rise from the wave" },

    { n: 9, t: "2:19", kf: "keyframe_009_02m19s.png",srcSvg: "Frame_07.svg", section: "safety", archetype: "section",
      vo: "And look, this isn't just about ticking a compliance box — it's about keeping your crew safe.",
      world: ["wash-canvas", "wave band", "coaster ship bottom-left"],
      base: ["oversized ‘1’ numeral (lavender)", "GHOST: 8-disc orbit ring around a character slot (right)"],
      content: [
        { el: "Numeral ‘1’ + ‘Safety First’ + ‘Gas Alarms & Ventilation’", cue: "compliance box", t: 139, enter: "numeral slides in, title typewriter" },
        { el: "Officer character (masked, pointing)", cue: "keeping your crew safe", t: 141, enter: "slide up + settle" },
        { el: "8 icon discs pop around orbit", cue: "crew safe", t: 142, enter: "staggered pop, clockwise" }
      ],
      motion: ["character idle sway (shoulders/breath)", "orbit discs drift on ring", "ship bob"],
      character: { who: "Safety officer (detailed, masked)", pose: "points across body toward icon orbit", beat: "entrance + point gesture" },
      transitionIn: "cards clear; the section numeral wipes in — first appearance of a chapter marker" },

    { n: 10, t: "2:35", kf: "keyframe_010_02m35s.png",srcSvg: "Frame_08.svg", section: "safety", archetype: "stat",
      vo: "…the mandatory standard for ventilation in any ballast water management room…",
      world: ["wash-canvas", "wave band", "drifting cloud + spark motifs"],
      base: ["stat layout", "GHOST: large empty disc (right)"],
      content: [
        { el: "Stat ‘30’ (oversized gradient)", cue: "one number", t: 155, enter: "count 0→30 + scale settle" },
        { el: "‘Air changes per hour’ + paragraph", cue: "mandatory standard", t: 156, enter: "typewriter + fade" },
        { el: "Cloud + lightning spark motifs", cue: "explosive or toxic gases", t: 158, enter: "drift in, spark flicker" }
      ],
      motion: ["lightning sparks flicker", "clouds drift", "disc glow pulse"],
      character: null,
      transitionIn: "numeral chapter dissolves to the big stat over the same water" },

    { n: 11, t: "2:52", kf: "keyframe_011_02m52s.png",srcSvg: "Frame_09.svg", section: "safety", archetype: "establish",
      vo: "You must always know which standard applies to your vessel.",
      world: ["wash-canvas", "wave band", "molecule + bubble motifs (left), birds"],
      base: ["‘Air Changes / 6 air changes per hour’ title (left)", "BWMS room illustration slot (right)"],
      content: [
        { el: "BWMS equipment room (ladder, tank, pipes, ‘30’ cycle badge)", cue: "which standard applies", t: 172, enter: "slide in from right, ‘30’ arrows rotate" },
        { el: "Title", cue: "your vessel", t: 173, enter: "typewriter" }
      ],
      motion: ["‘30’ cycle arrows rotate continuously", "molecule bob"],
      character: null,
      transitionIn: "stat clears; equipment room slides in on the wave" },

    { n: 12, t: "3:07", kf: "keyframe_012_03m07s.png",srcSvg: "Frame_10.svg", section: "safety", archetype: "icongrid",
      vo: "Your BWMS is designed to automatically shut down to protect you.",
      world: ["wash-canvas", "wave band", "bubbles"],
      base: ["‘If You Hear A Gas Alarm:’ title", "GHOST: 3 disc slots (only 2 fill this beat)", "officer character (right, pointing)"],
      content: [
        { el: "Disc 1 — bell (audible/visual alarms)", cue: "gas alarm", t: 187, enter: "pop + ring shake" },
        { el: "Disc 2 — shutdown box (BWMS shuts down)", cue: "automatically shut down", t: 189, enter: "pop" }
      ],
      motion: ["bell disc micro-shake on entry", "character idle sway + point held"],
      character: { who: "Safety officer", pose: "points toward the alarm discs", beat: "point gesture sustained across 12→13" },
      transitionIn: "room clears; character + title slide in — SAME character as scene 9, world unbroken" },

    { n: 13, t: "3:16", kf: "keyframe_013_03m16s.png",srcSvg: "Frame_10.svg", section: "safety", archetype: "icongrid",
      vo: "Act immediately, verify, and ventilate. Knowing this procedure is non-negotiable.",
      world: ["wash-canvas", "wave band", "bubbles"],
      base: ["SAME frame as scene 12 (title + character + discs 1&2 already present)"],
      content: [
        { el: "Disc 3 — fan (verify & ventilate)", cue: "ventilate", t: 196, enter: "pop into the reserved 3rd ghost slot" }
      ],
      motion: ["fan blades spin on entry", "character point re-emphasizes toward disc 3"],
      character: { who: "Safety officer", pose: "re-points to the new disc", beat: "one added gesture — proves progressive build on a held base" },
      transitionIn: "NO transition — same composition; only the third disc arrives on its VO word (the clearest build example in the film)" },

    { n: 14, t: "3:33", kf: "keyframe_014_03m33s.png",srcSvg: "Frame_11.svg", section: "safety", archetype: "icongrid",
      vo: "Different technologies carry different risks — UV, electrolysis, chemical, flocculation, deoxygenation.",
      world: ["wash-canvas", "wave band"],
      base: ["3 bullets (Know your system / Understand the risk / Operate safely) left", "GHOST: 5 equipment disc slots (right)", "GHOST: curved dashed arrow path"],
      content: [
        { el: "Bullet list", cue: "different technologies", t: 213, enter: "bullets stagger in" },
        { el: "5 equipment discs (UV, electrolysis, chemical, flocculation, deoxygenation)", cue: "UV… deoxygenation", t: 214, enter: "each disc pops as its tech is named, following the arrow" }
      ],
      motion: ["curved arrow draws between disc clusters", "disc contents micro-animate"],
      character: null,
      transitionIn: "discs re-arrange from orbit to a flow row (morph, not cut)" },

    { n: 15, t: "3:54", kf: "keyframe_015_03m54s.png",srcSvg: "Frame_12.svg", section: "maint", archetype: "section",
      vo: "It all starts with consistent, proactive maintenance.",
      world: ["wash-canvas", "wave band", "birds"],
      base: ["oversized ‘2’ numeral", "GHOST: 2 icon disc slots (helm, life-ring)", "ship + STOP-sign scene slot (right)"],
      content: [
        { el: "Numeral ‘2’ + ‘Proactive Maintenance’ + ‘Your System's Health’", cue: "proactive maintenance", t: 234, enter: "numeral slide + typewriter" },
        { el: "Ship + STOP sign scene", cue: "starts with", t: 236, enter: "slide in, STOP sign plants" },
        { el: "Ghost discs settle (helm, life-ring)", cue: "maintenance", t: 237, enter: "fade from ghost to soft-active" }
      ],
      motion: ["ship bob", "STOP sign micro-wobble on plant"],
      character: null,
      transitionIn: "chapter 2 numeral wipes in — mirrors scene 9's section pattern" },

    { n: 16, t: "4:10", kf: "keyframe_016_04m10s.png",srcSvg: "Frame_13.svg", section: "maint", archetype: "process",
      vo: "This checklist is the lifeblood of your operation — proper sensor calibration, and more.",
      world: ["wash-canvas", "wave band", "coral + seaweed + fish + bubbles (right)"],
      base: ["‘Essential Maintenance’ title (two-tone)", "GHOST: 4 bullet slots (left)"],
      content: [
        { el: "Bullet: Inspect, clean & calibrate sensor", cue: "sensor calibration", t: 250, enter: "checkmark draw + text" },
        { el: "Bullet: Monitor active substances", cue: "lifeblood", t: 252, enter: "stagger" },
        { el: "Bullet: Stock approved spare parts", cue: "operation", t: 253, enter: "stagger" },
        { el: "Bullet: Stock neutralizing agents", cue: "operation", t: 254, enter: "stagger" }
      ],
      motion: ["seaweed sway", "fish drift", "bubbles rise"],
      character: null,
      transitionIn: "numeral clears; underwater garden grows up on the right, list builds left" },

    { n: 17, t: "4:29", kf: "keyframe_017_04m29s.png",srcSvg: "Frame_14.svg", section: "maint", archetype: "process",
      vo: "…active substances are continuously monitored within safe limits.",
      world: ["wash-canvas", "wave band"],
      base: ["‘Maintenance’ title", "GHOST: 4 ConceptBox slots (dashed) + faint ring"],
      content: [
        { el: "Box: Design (control unit)", cue: "monitored", t: 269, enter: "fill ghost box, icon draws" },
        { el: "Box: Spare Parts", cue: "safe limits", t: 270, enter: "stagger" },
        { el: "Box: Chemicals (flasks)", cue: "safe limits", t: 271, enter: "stagger" },
        { el: "Box: Lab bench", cue: "safe limits", t: 272, enter: "stagger" }
      ],
      motion: ["box contents settle", "ring rotates slowly"],
      character: null,
      transitionIn: "bullets morph into four labelled boxes (same water)" },

    { n: 18, t: "4:41", kf: "keyframe_018_04m41s.png",srcSvg: null, section: "cwq", archetype: "divider",
      vo: "…a situation you're pretty much guaranteed to face at some point.",
      world: ["wash-canvas", "wave band (front crests emphasized)"],
      base: ["bare stage — title slot center-top"],
      content: [
        { el: "Title ‘Challenging Water Quality’", cue: "guaranteed to face", t: 281, enter: "typewriter, caret visible mid-type (‘Challenging Water Qual|’ in still)" }
      ],
      motion: ["wave crests roll gently"],
      character: null,
      transitionIn: "boxes clear to an almost-empty world — the section breath; only the title types on" },

    { n: 19, t: "4:56", kf: "keyframe_019_04m56s.png",srcSvg: "Frame_15.svg", section: "cwq", archetype: "concept",
      vo: "CWQ — water conditions where the BWMS cannot operate within its approved limits.",
      world: ["wash-canvas", "wave band"],
      base: ["‘Challenging Water Quality’ title (settled)", "‘CWQ’ center label slot", "GHOST: 3 disc slots + dashed arrows radiating"],
      content: [
        { el: "‘CWQ’ center label", cue: "CWQ", t: 296, enter: "scale-in" },
        { el: "Disc — High Turbidity", cue: "cannot operate", t: 298, enter: "arrow draws → disc" },
        { el: "Disc — High Biological Load", cue: "approved limits", t: 300, enter: "arrow → disc" },
        { el: "Disc — Sediments", cue: "biological load", t: 302, enter: "arrow → disc" }
      ],
      motion: ["arrowheads pulse", "turbidity/organism textures drift inside discs"],
      character: null,
      transitionIn: "title stays; CWQ acronym and its three causes branch out" },

    { n: 20, t: "5:18", kf: "keyframe_020_05m18s.png",srcSvg: "Frame_16.svg", section: "cwq", archetype: "process",
      vo: "…operations must not exceed 50% of the system's treatment-rated capacity.",
      world: ["wash-canvas", "wave band", "filter + clock motifs (corners)"],
      base: ["‘CWQ Procedure’ title", "pipe-network illustration framing the boxes", "GHOST: 2 numbered box slots"],
      content: [
        { el: "Box 1 · Assess & Troubleshoot (verify valves, clean filters, slow flow)", cue: "troubleshoot", t: 318, enter: "fill ghost, number badge pops" },
        { el: "Box 2 · Use Alternatives (restrict flow to a minimum)", cue: "50% capacity", t: 320, enter: "connector → box, text typewriter (mid-type in still)" }
      ],
      motion: ["fluid pulse travels along pipes", "filter icon spins"],
      character: null,
      transitionIn: "discs clear; pipe network slides in and frames the two-step process" },

    { n: 21, t: "5:38", kf: "keyframe_021_05m38s.png",srcSvg: "Frame_17.svg", section: "cwq", archetype: "question",
      vo: "But what if you've done all that — and the alarm still won't clear? This is the critical moment.",
      world: ["wash-canvas", "wave band"],
      base: ["bulk-carrier inside an arch/porthole (left)", "GHOST: 4 gear/alert disc slots", "question layout (right)"],
      content: [
        { el: "Ship-in-arch scene", cue: "done all that", t: 338, enter: "iris-open" },
        { el: "Question ‘What if troubleshooting isn't enough?’", cue: "critical moment", t: 340, enter: "typewriter two-tone" },
        { el: "Gear + shield discs", cue: "critical moment", t: 341, enter: "pop, staggered" }
      ],
      motion: ["gears turn", "ship bob inside arch"],
      character: null,
      transitionIn: "pipes clear; the ship rises inside an arch, question types on opposite" },

    { n: 22, t: "5:54", kf: "keyframe_022_05m54s.png",srcSvg: "Frame_18.svg", section: "bypass", archetype: "divider",
      vo: "It is something you only do as a last resort…",
      world: ["wash-canvas", "wave band", "seaweed + coral + fish + sparkles (bottom)"],
      base: ["title slot (left)", "small filter disc (right)"],
      content: [
        { el: "Line 1 ‘A bypass is a last resort, used only’", cue: "last resort", t: 354, enter: "typewriter, line 1 only (still shows line 1)" }
      ],
      motion: ["fish drift", "sparkles twinkle", "seaweed sway"],
      character: null,
      transitionIn: "question clears; underwater garden returns (callback to scene 4's world) as the bypass text begins" },

    { n: 23, t: "6:10", kf: "keyframe_023_06m10s.png",srcSvg: "Frame_19.svg", section: "bypass", archetype: "character",
      vo: "…agreement from the Port State Authority must be obtained before proceeding with a bypass.",
      world: ["wash-canvas", "wave band", "bubbles"],
      base: ["APPROVED clipboard + BYPASS button (left)", "two-officer handshake scene slot (right)", "radar arcs behind handshake"],
      content: [
        { el: "Clipboard signs ‘APPROVED’", cue: "agreement", t: 370, enter: "signature draws on" },
        { el: "Two officers shake hands (line-art)", cue: "Port State Authority", t: 371, enter: "characters slide in, arms meet on ‘agreement’" },
        { el: "BYPASS button", cue: "before proceeding", t: 373, enter: "button press depress" }
      ],
      motion: ["handshake subtle up-down", "characters idle sway", "arcs breathe"],
      character: { who: "Two officers (simple line-art crew)", pose: "handshake — agreement beat", beat: "entrance + handshake gesture (one beat)" },
      transitionIn: "text holds at edge; the human beat enters — the film's emotional punctuation" },

    { n: 24, t: "6:16", kf: "keyframe_024_06m16s.png",srcSvg: "Frame_18.svg", section: "bypass", archetype: "divider",
      vo: "Just bypassing preemptively because you think you might have a problem is strongly discouraged.",
      world: ["wash-canvas", "wave band", "seaweed + coral + fish (SAME as scene 22)"],
      base: ["bypass text block (carried from scene 22)", "filter disc (right)"],
      content: [
        { el: "Lines 2–3 ‘when a critical alarm is triggered / to load the minimum…’", cue: "strongly discouraged", t: 376, enter: "typewriter continues lines 2–3 (mid-type in still)" }
      ],
      motion: ["same ambient loop as scene 22 (unbroken)"],
      character: null,
      transitionIn: "handshake recedes; we return to the exact bypass-text world and finish typing it — continuity proof" },

    { n: 25, t: "6:27", kf: "keyframe_025_06m27s.png",srcSvg: "Frame_20.svg", section: "bypass", archetype: "process",
      vo: "Full ballast water exchange, then treat, flush the tanks, and refill with compliant water.",
      world: ["wash-canvas", "wave band"],
      base: ["‘Post-Bypass / Decontamination’ title", "GHOST: 4 step-box slots + ghost ring (right)"],
      content: [
        { el: "Box 1 · Exchange (ship at sea)", cue: "full exchange", t: 387, enter: "fills first (only one active in still)" },
        { el: "Box 2 · Treat", cue: "treat", t: 389, enter: "fills next" },
        { el: "Box 3 · Flush", cue: "flush the tanks", t: 390, enter: "fills" },
        { el: "Box 4 · Refill", cue: "refill", t: 392, enter: "fills" }
      ],
      motion: ["ghost ring rotates", "each box icon animates on fill"],
      character: null,
      transitionIn: "text clears; the 4-step decontamination boxes fill in VO order (still caught mid-build — box 1 only)" },

    { n: 26, t: "6:41", kf: "keyframe_026_06m41s.png",srcSvg: "Frame_21.svg", section: "record", archetype: "section",
      vo: "It's the official story of your vessel's compliance — and it has to be perfect.",
      world: ["wash-canvas", "wave band", "coaster ship top-right"],
      base: ["oversized ‘4’ numeral", "‘The Final Word / New Record Book Rules’", "GHOST: book+magnifier and doc→shield slots"],
      content: [
        { el: "Numeral ‘4’ + title", cue: "official story", t: 401, enter: "numeral slide + typewriter" },
        { el: "Book + magnifier icon", cue: "compliance", t: 403, enter: "fade + rise" },
        { el: "Doc → shield flow", cue: "perfect", t: 404, enter: "arrow draws doc→shield" }
      ],
      motion: ["ship bob", "shield glint"],
      character: null,
      transitionIn: "chapter 4 numeral wipes in (note: film labels jump 1→2→4; §3 folded into CWQ/Bypass)" },

    { n: 27, t: "6:49", kf: "keyframe_027_06m49s.png",srcSvg: null, section: "record", archetype: "divider",
      vo: "A major change is on the horizon, and you've got to be ready for it.",
      world: ["wash-canvas", "wave band", "fish (small school)"],
      base: ["title slot (left)", "GHOST: large disc (right)"],
      content: [
        { el: "Title ‘Path to New Record Keeping’", cue: "major change", t: 409, enter: "typewriter, caret visible in still" },
        { el: "Ghost disc begins to form", cue: "on the horizon", t: 411, enter: "ring draws (pre-build for timeline)" }
      ],
      motion: ["fish drift", "disc ring shimmer"],
      character: null,
      transitionIn: "numeral clears to a title-only breath; disc pre-forms for the coming timeline" },

    { n: 28, t: "6:59", kf: "keyframe_028_06m59s.png",srcSvg: "Frame_22.svg", section: "record", archetype: "timeline",
      vo: "…a totally new coded format for the ballast water record book becomes mandatory.",
      world: ["wash-canvas", "wave band", "fish"],
      base: ["‘Path to New Record Keeping’ (settled)", "GHOST: 2 milestone slots on a baseline"],
      content: [
        { el: "Milestone Sep 2017 · Convention in force (ship)", cue: "new coded format", t: 419, enter: "badge in + baseline draws" },
        { el: "Milestone Feb 1 2025 · New book mandatory (book)", cue: "becomes mandatory", t: 421, enter: "baseline extends → badge" }
      ],
      motion: ["baseline node dots slide", "book icon flips open on entry"],
      character: null,
      transitionIn: "the pre-formed disc splits into a 2-point timeline (same water, same fish)" },

    { n: 29, t: "7:15", kf: "keyframe_029_07m15s.png",srcSvg: "Frame_23.svg", section: "record", archetype: "compare",
      vo: "The very first column in the record book was split into two.",
      world: ["wash-canvas", "wave band", "fish"],
      base: ["GHOST: two document-card slots + center ghost ring (the split axis)"],
      content: [
        { el: "Card ‘Previous Format’ (single column table)", cue: "first column", t: 435, enter: "slide from left" },
        { el: "Card ‘From Feb 2025’ (split table, Date|Code)", cue: "split into two", t: 437, enter: "slide from right; a divider line draws down the old card to ‘split’ it" }
      ],
      motion: ["center ring holds the axis and rotates slowly", "split line draws on cue"],
      character: null,
      transitionIn: "timeline recedes; two record-book pages slide in to compare" },

    { n: 30, t: "7:41", kf: "keyframe_030_07m41s.png",srcSvg: "Frame_24.svg", section: "record", archetype: "table",
      vo: "A is for taking on ballast. F is for failure of the BWMS. H is for other procedures.",
      world: ["wash-canvas", "wave band"],
      base: ["table header bar (Code / Description / Your Action)", "GHOST: 3 empty rows (A, F, H)"],
      content: [
        { el: "Row A — Ballast taken on board · Log all ballasting", cue: "A is for", t: 461, enter: "row drops in + icon" },
        { el: "Row F — Failure of the BWMS · Document malfunction", cue: "F is for", t: 464, enter: "row drops in + gear/wrench icon" },
        { el: "Row H — Other procedures", cue: "H is for", t: 466, enter: "row drops (caught empty in still — mid-build)" }
      ],
      motion: ["row icons settle", "header bar sheen on entry"],
      character: null,
      transitionIn: "compare cards clear; the code table header lays down, rows drop per letter named" },

    { n: 31, t: "8:02", kf: "keyframe_031_08m02s.png",srcSvg: "Frame_25.svg", section: "record", archetype: "compare",
      vo: "B for de-ballasting, C for exchange/treatment, D for discharge to a reception facility…",
      world: ["wash-canvas", "wave band"],
      base: ["GHOST: two book-card slots + center spotlight disc"],
      content: [
        { el: "Card — Record Book cover (‘Ballast Water Record Book’)", cue: "additional codes", t: 482, enter: "slide in, book cover" },
        { el: "Card — Inside pages (handwritten log)", cue: "discharge", t: 484, enter: "slide in; pages flip" }
      ],
      motion: ["spotlight disc glow", "page corners lift"],
      character: null,
      transitionIn: "table clears; the physical record book itself is shown, cover + inside" },

    { n: 32, t: "8:22", kf: "keyframe_032_08m22s.png",srcSvg: "Frame_26.svg", section: "record", archetype: "character",
      vo: "…tanks affected, any bypass decision, and the complete decontamination process.",
      world: ["wash-canvas", "wave band", "coaster ship discharging (right)"],
      base: ["‘BYPASS ✓’ text (left)", "spotlight disc + orbit (top-right)", "ship-discharging scene slot"],
      content: [
        { el: "Ship discharging at sea", cue: "decontamination process", t: 502, enter: "slide in, discharge plume animates" },
        { el: "‘BYPASS ✓’", cue: "bypass decision", t: 503, enter: "checkmark draws on" }
      ],
      motion: ["discharge plume flows", "ship bob", "disc droplet settle"],
      character: null,
      transitionIn: "book clears; the resolved ship (bypass complete) sails on the same water" },

    { n: 33, t: "8:43", kf: "keyframe_033_08m43s.png",srcSvg: "Frame_27.svg", section: "record", archetype: "quote",
      vo: "The Master must keep a record proving every officer and engineer has been trained.",
      world: ["wash-canvas (tinted)", "wave band", "anchor motif + clipboard"],
      base: ["centered quote card slot", "GHOST: underline rule"],
      content: [
        { el: "Quote card ‘The Master must maintain a record confirming every officer and engineer has been familiarized with this requirement.’", cue: "Master must keep", t: 523, enter: "card fades up, text types on, two-tone emphasis" },
        { el: "Underline rule", cue: "trained", t: 526, enter: "line draws L→R" }
      ],
      motion: ["anchor sways gently", "clipboard checkmarks tick in"],
      character: null,
      transitionIn: "world tints slightly for gravity; a single centered card holds the key rule" },

    { n: 34, t: "9:02", kf: "keyframe_034_09m02s.png",srcSvg: "Frame_28.svg", section: "close", archetype: "question",
      vo: "Your logbook tells the complete story of your professionalism and your commitment to our oceans.",
      world: ["wash-canvas", "wave band", "heavy fish school + bubbles (the fullest ambient in the film)"],
      base: ["record-book icon (left)", "closing-question layout (right)"],
      content: [
        { el: "Record book icon", cue: "your logbook", t: 542, enter: "book settles, slight float" },
        { el: "Question ‘Are you recording the complete story of your vessel's compliance?’", cue: "complete story", t: 544, enter: "typewriter two-tone" }
      ],
      motion: ["full fish school drifts", "bubbles rise", "book float loop"],
      character: null,
      transitionIn: "quote clears; the world fills with life for the closing question — the sea we've been protecting, at its richest" }
  ]
};

/* dual-mode export: <script> (browser viewer) sets window; Remotion/Node imports it */
if (typeof window !== "undefined") window.BWM_STORYBOARD = BWM_STORYBOARD;
if (typeof module !== "undefined" && module.exports) module.exports = BWM_STORYBOARD;
