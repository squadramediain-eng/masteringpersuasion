---
tags: [design-system, motion, reference, frame-by-frame, ground-truth]
updated: 2026-07-22
source: extras/ballast_water_management_reference_video_audio/Ballast water managements.mp4 (approved, 9:11, 1920×1080, 30fps)
method: 34 settled compositions sampled as 6-second build-sequence contact sheets (2fps) and read frame-by-frame against the word-timed Whisper transcript.
---

# 14 · Reference Film — Frame-by-Frame Analysis

← rules: [[12 - Motion & Frame Construction Spec]] · pipeline: [[10 - Animation Pipeline]] · inventory: [[09 - Frame Inventory & Archetypes]]

> **Who this is for:** anyone building or animating a frame for Mastering Persuasion.
> **What it is:** the approved Ballast Water Management film taken apart scene by scene —
> every entrance, text reveal, element movement, and voice-over sync catalogued from the
> footage itself, not from memory. [[12 - Motion & Frame Construction Spec]] states the
> *rules*; this document is the *evidence* under them, plus the reusable animation
> vocabulary distilled from all 34 scenes.

---

## 0. The film in one paragraph

A single continuous underwater/maritime world that the camera never leaves. Over 9:11 it
delivers a dense safety curriculum as a sequence of ~34 settled compositions, each of which
**establishes its base within ~1–2s, then builds its content one element at a time on the
exact words that name them.** Titles and captions type on with a visible caret. The wave
band never breaks — content slides in and out over water that is always there. There is not
a single hard cut in the entire film, and there is not a single frame of red.

---

## 1. Measured fundamentals

| Fundamental | Value | Source |
|---|---|---|
| Hard cuts | **0** across 9:11 | scene-detection at threshold 0.1 |
| Transition length (per slide) | **9–15 frames (0.3–0.5s)**, outgoing slightly longer than incoming (e.g. 0:56 → out 14f / in 9f) | frame-accurate motion detection |
| Narration rate | **154 wpm** | transcript |
| Speech density | **73% talking** | transcript vs runtime |
| Base lands | **≤ ~1–2s** after a scene opens | every scene |
| Longest single hold | **21.8s** | motion profile |
| Time in holds > 2s | **65%** | motion profile |
| Alert / warning colour | **none — 100% single blue family** | every scene, incl. critical-alarm/bypass beats |

**The load-bearing numbers:** transitions are *fast* (well under half a second per slide);
holds are *long* (up to 21.8s) but never dead because the world and idle motion keep them
alive; and the film is **denser and faster-narrated than a slide deck can carry** — which is
exactly why every element is choreographed to a word instead of dumped on screen at once.

---

## 2. The animation vocabulary (distilled from all 34 scenes)

Everything below recurs across many scenes. This is the reusable grammar.

### 2.1 The three layers (confirmed universal)
- **WORLD** — wave band + ambient life (fish, bubbles, swaying seaweed, drifting birds,
  god-rays). Always on, never enters or exits, **bridges every scene unbroken.**
- **BASE** — title, subject (ship/character/table shell), containers. Lands within ~1–2s.
- **CONTENT** — the elements the narration names, one per phrase, each on its cue.

### 2.2 Titles
- **Two-tone, always.** One word or phrase in accent blue, the rest navy. The colour split
  *is* the emphasis (scenes 1, 4, 5, 12, 13, 16, 18, 19, 33, 34…).
- **Type on with a visible caret** — the house signature. Captured mid-type repeatedly:
  `Ball|` → `Ballast Managment|` (s2), `Air c|` (s10), `6 Air cha|` (s11), `Wa|`/`CW|`/`CWQ|`
  (s18), `Path to|` (s27), `compliance?|` (s34).
- **Numbered chapter dividers** use an oversized purple numeral beside the title (`2·Proactive
  Maintenance` s15, `4·The Final Word` s26).

### 2.3 Body / caption text
- Types on too, with a caret, **line by line** (s10 description, s16 checklist, s20 cards,
  s22/s24 quote paragraphs). Long text reveals top-line-solid while the next line is still
  typing.
- **Key words highlighted** in accent blue inside body copy, sometimes underlined for stress
  (s33 "familiarized"/"requirement", s24 "last resort"/"minimum").

### 2.4 Entrance vocabulary (how CONTENT arrives)
| Pattern | Where seen |
|---|---|
| **Ring draws, then icon pops inside it** | s9, s12, s13, s19 — the badge outline appears first, glyph fills |
| **Placeholder card-frame → filled card** | s17 — empty rounded frame sits, then the icon drops in |
| **Step-flow conveyor** — cards slide in from the right, left-anchored, 1→2→3→4 | s20, s25, s30 |
| **Arrow / connector draw-on** (dash reveals along its length) | s3, s5, s14, s19, s28 |
| **Scale / pop with fade** | most icons and badges |
| **Slide from a frame edge** (bottom-up, right-in) | s5 tank, s15 STOP sign, s12 officer |
| **Row-by-row table fill**, headers before body | s29, s30, s31 |

### 2.5 Continuous idle — nothing sits frozen
Ships **bob** on the wave (floatLoop, s1/s9/s15/s21/s22/s26/s32); gears, fans, orbit-rings,
recycling-arrow badges **rotate** (s10/s11/s13/s26/s28); dashed orbit rings **travel**; fish
**swim across**, seaweed **sways**, bubbles **rise** (s4/s16/s22/s24/s34). Even a "parked"
quote card (s33) sits over drifting water. The *only* near-static hold is the s33 gravity
beat — and even it breathes below.

### 2.6 Transitions (content slides over a persistent world)
Measured 0.3–0.5s per slide. The outgoing board **exits as a single unit** — scale-down +
slide (up, or up-and-left), *never* a per-element cross-dissolve (s2 old title, s18 card row,
s27 whole board). The wave band and new typed title carry the incoming scene in. There is a
brief clear beat over unbroken water, **never a blank frame.** New title often begins typing
while the old board is still exiting (anticipation/overlap, s27).

### 2.7 Voice-over sync (the core discipline)
**Every content element lands on the exact word or clause that names it, in spoken order,
left-to-right / top-to-bottom.**
- List items build one per named term: suspended matter → sediments/microorganisms/species
  (s3); BWMS technologies → UV/electrolysis/chemical/flocculation/deox (s14); maintenance →
  design/spare-parts/chemicals/active-substances (s17); record codes A/F/H (s30).
- Timeline nodes land on their spoken dates (2004/2017/2025 s7; 2017/Feb-2025 s28).
- Stats appear as the number is hit (`30` s10, `50%` s20).
- Deferred reveals: a date/stat is withheld until its exact spoken moment (s28 "Feb 1, 2025").
- An empty slot **telegraphs "one more coming"** and paces the list to the VO (s3 empty
  third circle, s30 dim "H" badge waiting).

### 2.8 Big-stat treatment
The number is the **largest object on screen, arrives first and alone**, the unit **types on
beside it** with a caret, and it is **echoed in a rotating badge** (s10 `30` + air-turnover
arrow ring; s20 bold `50%`).

### 2.9 Character staging
- **Posed toward the content**, arm extended pointing at where it builds (officer s9, s12,
  s13) — the pose directs the eye, the icons build in the space he indicates.
- **Genuine performance where it counts** — the s23 handshake physically pumps (clasped hands
  oscillate) for the "agreement" beat.
- **Style shifts to hand-drawn line-art for human beats** (s23) vs flat-fill icons elsewhere.
- Characters are *staged*, not rigged into full limb animation.

### 2.10 Depth / craft
Cards **float above the world with soft drop shadows**; elements **overlap and layer** (a
clipboard onto a card corner s33, seaweed behind coral s8); dashed cut-out borders give a
scrapbook/artboard feel; a center timeline node is **promoted with a teal glow** to anchor
the eye (s7). Depth is *drawn*, consistently.

### 2.11 Real mockups, not descriptions
The film **recreates actual UI/documents** — ruled record-book pages with sample entries and
column headers (s29, s31), before/after tables (s29), a tilted 3D hardcover book to close
(s34). It shows the artifact rather than an icon standing in for it.

### 2.12 **Alert = never red** (the biggest surprise)
Across the entire critical-alarm → bypass → prohibition sequence (s20–s24) — the most
alarming stretch of the film — **the palette never leaves blue.** Prohibition is a navy `✕`
stamped on a valve (s20) or a `⊗` crossed-circle glyph (s22/s24); urgency is the typewriter
cadence, the composition, and a bell's echo rings (s12). *Colour is never the alarm.* This
directly contradicts the instinct to reach for a red alert swatch. **Reserve `--alert`
(#ac4f55) for essentially nothing; carry gravity with glyph + cadence + composition.**

### 2.13 Ambient density scales with the topic
Richest life (fish + seaweed + coral + bubbles + god-rays) on ecosystem / emotional / human
beats (s4 "it's you", s8, s16, s22, s24, s34 close). Sparse (wave band only) on technical /
regulatory beats (s6 IMO emblem, s7 timeline, s10/s20 stats). The world is *tuned* per scene,
not uniform.

---

## 3. Per-scene teardown (all 34)

> Format per scene: settled composition · VO line · build sequence with timings · text
> reveal · element movement · VO sync · world/ambient · notable craft. Timecodes are the
> settle point of each composition.

### Scene 01 — Title / cargo-ship establish (0:10)
Asymmetric title card: two-tone "Ballast Water" (teal) / "Management" (navy) set left; a
glossy water-drop disc badge upper-right with a dashed orbit ring; a side-profile tanker
riding the wave band. **VO:** intro ("…your specific responsibilities on board…"). **Build:**
opening — title + badge already landed; the only motion is the ship drifting steadily
right-to-left with a gentle bob. **Text:** two-tone, typed before window. **Sync:** no
per-word landings; the drop badge anchors "ballast water" as a concept. **World:** wave band
across the lower third, shape shifting subtly. **Craft:** glossy disc depth, ship posed
*traveling into* the frame rather than parked.

### Scene 02 — Head-on ship / re-title (0:21)
Layout change mid-scene: the Scene-01 board exits (title scales down and slides up-right **as
a unit**) and a centered head-on hero ship + centered title "Ballast Managment" establishes.
A glass tank chip pops in bottom-right at the tail. **VO:** "let's get aligned on what ballast
water actually is…". **Text:** new title types on with caret (`Ball|`→`Ballast Managment|`);
old title does NOT retype — it leaves as a unit. **Sync:** tank chip lands as the definition
("seawater taken on board") begins. **World:** wave band bridges both layouts unbroken.
**Craft:** the deliberate contrast — old exits as unit, new types on.

### Scene 03 — Ballast intake → ecosystem impact (0:32)
Head-on ship with a cyan-glowing ballast tank; a dashed arrow draws right to an "Impact on
marine ecosystem" bubble; a top row of sample swatches builds. **VO:** "…suspended matter,
which includes sediments, microorganisms, and marine species." **Build:** tank fills →
arrow draws left-to-right → ecosystem bubble scales in at the arrowhead → swatches pop in one
at a time with connector lines dropping to the hub. **Sync:** *exact* — "sediments" → swatch
1, "microorganisms" → swatch 2, "marine species" → the still-empty third circle. **Craft:**
hub-and-spoke build; the empty third circle telegraphs the last list item.

### Scene 04 — "What is your role in protecting the oceans?" (0:48)
Left three-line two-tone title; a triad of small icons (Actions / Attention to Details /
Expertise); right side a full underwater seascape. **VO:** "…Really, it's you. Your actions,
your attention to detail, your expertise…". **Build:** settled hold — base landed before
window; motion is all ambient. **Sync:** the icon triad maps to the spoken "actions /
attention / expertise" triad (cued at build). **World:** the richest ambient scene — swaying
seaweed, growing coral, drifting fish, rising bubbles, continuous. **Craft:** living world
carries an emotional, character-free "it's you" beat; layered seascape depth.

### Scene 05 — "Ballast Water" definition / DISCHARGE↔INTAKE (1:07)
Left two-tone stacked title + 4-line live definition paragraph; right a container ship with
port cranes; two headers "DISCHARGE / INTAKE" reveal above it; a green-organism ballast tank
appears under the hull. **VO:** "…ballast water has two sides to it… on one hand… but on the
other… unintentional taxi service for invasive species…". **Text:** DISCHARGE then INTAKE
type on in sequence (caret `DISCHARG|`). **Sync:** the two headers stage "two sides / on one
hand… on the other"; the green "Discharge of organisms" tank appears on "invasive species."
**Craft:** the green organism band is a rare non-blue accent (payload = danger); two-column
framing literally stages the VO's "two sides."

### Scene 06 — IMO regulatory emblem (1:21)
Near-empty scene: a single centered IMO anchor-and-globe laurel crest fades/scales up on a
sparse ground, over the persistent wave band. **VO:** "…the regulatory backbone… The IMO
Ballast Water Management Convention…". **Build:** transition-in — the emblem is the only
element; title lands after the window. **Sync:** the crest is cued to "The IMO… Convention."
**Craft:** deliberate emptiness + slow single-emblem fade signals a *section change*; the
unbroken wave band holds continuity even through an almost-blank frame.

### Scene 07 — Convention timeline (1:37)
Top-left emblem + title; a full-width white card holding a 3-node dashed timeline: Adopted
2004 (clipboard) · **In Force 2017** (center, teal-glowing ship-ring) · Updates 2025 (gear).
**VO:** "…adopted in 2004, entered into force in 2017, and continues evolving with major
updates like the 2025 record-keeping changes." **Build:** settled; nodes animate in place
(dashed rings rotate, center glows). **Sync:** exact date triplet, left-to-right = spoken
order. **Craft:** center node promoted with teal glow; soft card drop-shadow; dashed
connectors imply chronological flow.

### Scene 08 — D1 / D2 standards + documentation (2:00)
Two pill-cards "D1 / Exchange" and "D2 / Treatment" with elbow connectors to "Documentation
For Compliance"; underwater still-life bottom-right; god-rays; a certificate card and
clipboard build last. **VO:** "…two key standards, D1… D2… every vessel must carry an
approved plan… certificate… record book." **Build:** D1/D2 settled; the paperwork
(certificate + clipboard) pops up bottom-center on the compliance-list clause. **Sync:**
D1→exchange, D2→treatment; documents land on "plan / certificate / record book." **World:**
most literal underwater frame — seaweed, coral, bubbles, god-rays. **Craft:** layered depth;
elbow connectors bind two standards into one outcome.

### Scene 09 — "Safety First" / orbiting safety icons (2:19)
Oversized purple "1" + "Safety First" + subtitle; a cargo ship bottom-left; an illustrated
officer pointing left at the title; ~7 circular safety icons (fan, respirator, padlock,
radio, gears, clipboard) build in a clockwise arc around him. **VO:** "…the safety systems
you absolutely must know inside and out…". **Build:** icons pop in one every ~0.4–0.6s (ring
first, then glyph). **Sync:** montage cluster — icons accumulate as a *set* under the
"safety systems" clause, not one-per-word. **Craft:** character posed toward the content;
icons orbit him as his domain; consistent circular-badge system.

### Scene 10 — Stat "30" air changes (2:35)
Huge navy "30" upper-left; "Air changes per hour" types on beside it; a 2-line caption types
below; hazard glyphs (cloud/molecule/lightning) top; a "30" badge with rotating
air-turnover arrows bottom-right. **VO:** "…one number… 30. That's 30 air changes per hour…
mandatory standard for ventilation… gases like hydrogen." **Text:** explicit typewriter with
caret (`Air c|`); caption reveals per-line. **Sync:** "30" on screen as the word is hit; unit
types as spoken; badge reinforces on the hydrogen clause. **Craft:** textbook big-stat —
number largest, first, alone; rotating ring literalizes "changes per hour."

### Scene 11 — Ventilation room / 6-vs-30 (2:52)
"Air Changes" + subtitle "6 Air changes per hour"; a detailed line-drawn ventilation room
(ladder, tanks, cylinders); a "30" gauge with a rotating dashed ring inside the room. **VO:**
"…a reduced ventilation rate of six air changes per hour… know which standard applies." 
**Text:** subtitle types on (`6 Air cha|`). **Sync:** subtitle "6" types as "reduced rate of
six" is spoken; the persistent in-room "30" holds both numbers in tension on "know which
standard applies." **Craft:** technical line-illustration for the room; reuses the
"30 + rotating ring" badge from s10 for continuity; stages the 6-vs-30 compare.

### Scene 12 — "If You Hear A Gas Alarm" / officer (3:07)
Two-tone title with caret; a bell badge ("Audible and visual alarms will activate"); a BWMS
shutdown box ("An automatic shutdown… may occur"); officer far-right pointing left. **VO:**
"…what happens when you hear that alarm?… the BWMS… designed to automatically shut down to
protect you." **Build:** title(caret) → officer slides in from right → bell + caption →
shutdown box + caption, ~1s apart. **Sync:** "alarm"→bell, "automatically shut down / BWMS"→
shutdown box, left-to-right in spoken order. **Craft:** officer posed pointing at content;
concentric echo rings around the bell imply sound; cause→effect read left to right.

### Scene 13 — Gas-alarm 3-step icon row (3:16)
Same title; three circled icons — bell · BWMS-shutdown-box · ventilation fan — each captioned;
crew figure pointing left. **VO:** "…act immediately, verify what's going on, and make sure
that space is getting ventilated. Knowing this procedure is simply non-negotiable." **Build:**
bell + box already settled; the **third ring is empty** and the fan pops in last, completing
the row on the "ventilate" beat, then **spins continuously.** **Sync:** shutdown box on
"shut down," fan on "ventilated" — the fan completing the row is the payoff. **Craft:** empty
ring → filled reveals the build without moving settled elements; character points at content.

### Scene 14 — Principle bullets + BWMS technology cluster (3:33)
Three navy bullets (Know your system · Understand the risk · Operate safely); a big dashed
arrow loops to a cluster of tech icons (UV tube, electrolysis cabinet, chemical/ozone reactor,
flocculation press, deox canister). **VO:** "…different BWMS technologies… UV… electrolysis…
chemical, or ozone… flocculation… deoxygenation. Each has its own hazards." **Build:** bullets
static; tech icons build one-by-one on their named technology. **Sync:** exact — one icon per
named system. **Craft:** dashed arrow ties persistent principle-list → building hazard
cluster; icons overlap in the ring for depth.

### Scene 15 — Chapter divider "2 · Proactive Maintenance" (3:54)
Purple "2" + title + subtitle; helm & propeller icons; a ship in a soft circular badge rising
from the waves; a red STOP sign beside it. **VO:** "…it all starts with consistent proactive
maintenance…". **Build:** ship bobs in its badge; STOP sign slides up from the waterline.
**Sync:** thematic (section divider); STOP reinforces "don't wait / maintain." **World:**
full wave band, drifting birds, clouds. **Craft:** numbered chapter card; ship in a vignette
badge; badge-glow depth. *(Note: the STOP sign's red is a discrete prop glyph, not a palette
alert state — consistent with §2.12.)*

### Scene 16 — "Essential Maintenance" typed checklist (4:10)
Two-tone title; a 4-item checklist (inspect/calibrate sensor · monitor active substances ·
stock spare parts · stock neutralizing agents); right side a full underwater scene. **VO:**
"…this checklist… the absolute bedrock… lifeblood of your operation… proper sensor
calibration." **Text:** the clearest typewriter in the film — checklist types on line-by-line
with a visible caret mid-word. **Sync:** items type as the checklist is described (item 1 =
sensor calibration). **World:** swaying seaweed, drifting fish, rising bubbles. **Craft:**
house-signature typed checklist; underwater biome gives "ecosystem" feel without pulling focus.

### Scene 17 — "Maintenance" 4-card row builds one-by-one (4:29)
Title; four rounded icon cards — Design · Spare Parts · Chemicals · Active Substances — build
strictly left-to-right, each dropping into an **empty placeholder frame.** **VO:** "…system
design limitations… spare parts… required chemicals… active substances… monitored." **Sync:**
tight — one card per named requirement. **Text:** labels reveal per card. **Craft:**
placeholder-frame → filled-card grows the list without shifting settled cards; consistent
sizing, overlap-free grid.

### Scene 18 — Maintenance → "Challenging Water Quality" transition (4:41)
The completed 4-card row holds, then **slides up-and-left as a unit**; a wave band slides up
from below; "Challenging Water Quality" types on + a "CWQ" monogram types beneath. **VO:**
"…monitored within safe limits. Okay, let's dive into a situation you're pretty much
guaranteed to face…". **Text:** caret on both title (`Wa|`) and monogram (`CW|`→`CWQ|`).
**Craft:** textbook "content slides over a persistent world" transition — old board exits as
a group, wave band + new typed title establish the next chapter, no blank frame.

### Scene 19 — CWQ definition / hub-and-spoke (4:56)
Two-tone title + "CWQ"; three nodes fan out (High Turbidity · High Biological Load ·
Sediments) with dashed connector arrows from the hub; ring draw-on per node. **VO:**
"…often due to high turbidity, sediments, or biological load." **Sync:** each node staggered
onto its named cause. **Craft:** hub-and-spoke; dashed arrows imply causation; single-blue
palette throughout.

### Scene 20 — CWQ procedure / 50% / no-bypass (5:18)
Title "CWQ Procedure"; a pipe-and-valve schematic; numbered step cards ① Assess &
Troubleshoot ② Use Alternatives (below 50%) ③ (late/empty); a navy **✕** stamps onto the
top-right gate valve. **VO:** "…troubleshoot. Slow the flow, clean the filters… do not exceed
50%… avoid a system bypass at all costs." **Text:** cards type line-by-line with caret; "50%"
bolded. **Sync:** ① on "troubleshoot," ② on the 50% clause, the **✕ on "avoid a bypass at all
costs."** **Craft:** prohibition = a **navy ✕** on a valve (no red); bold stat; clock icon =
time pressure. *(§2.12.)*

### Scene 21 — "What if troubleshooting isn't enough?" (5:38)
A detailed bulk-carrier in a soft dome; three-line two-tone question right; orbiting gear +
dashed ring, shield, and alert-bell accents. **VO:** "…still getting a critical alarm that
just won't clear. Well, this is that critical moment… safety of the vessel and crew becomes
priority number one." **Build:** ship settles + bobs; gear pops with dashed ring drawing;
shield/bell settle. **Sync:** ship="vessel," shield="safety," gear/orbit="system won't clear."
**Craft:** tension pivot signalled by bell + composition, **still entirely blue** — restraint
is the choice.

### Scene 22 — "A bypass is a last resort…" quote (early) (5:54)
Full-bleed underwater world (kelp, coral, shell, fish, bubbles); text top-left types on
("A bypass is a **last resort,** used only…"); a ⊗ prohibition glyph top-right. **VO:**
"…Hitting that bypass button… is a massive deal. It is something you only do as a last
resort…". **Text:** definitive typewriter with visible I-beam caret, line by line; "last
resort" highlighted. **World:** richest ambient — seaweed sways, fish swims, bubbles rise.
**Craft:** gravity via ⊗ + typewriter cadence, **no red**; calm world under a heavy warning =
intentional tonal contrast.

### Scene 23 — Port State Authority handshake (6:10)
Two line-art characters shaking hands inside a soft disc with a drawing dashed ring; an
upper-left clipboard with an "APPROVED" stamp; a lower-left folder tab that types "BYPASS."
**VO:** "…must not be taken in isolation. Agreement from the Port State Authority must be
obtained before proceeding with a bypass." **Build:** clipboard settles → characters settle
mid-shake → ring draws → "BYPASS" types on. **Movement:** **genuine performance — the
handshake pumps** (hands/arms oscillate). **Sync:** handshake="agreement," APPROVED="obtained,"
label="bypass." **Craft:** style shifts to hand-drawn line-art for the human/negotiation beat.

### Scene 24 — "A bypass is a last resort…" quote (complete) (6:16)
Same underwater world as s22; text completes to the full 4-line paragraph ("…to load the
**minimum** water necessary for safety."); ⊗ glyph top-right. **VO:** "…bypassing preemptively
… is strongly, strongly discouraged." **Text:** full type-on from an empty world through to
the closing period; caret throughout; "last resort" + "minimum" highlighted. **Distinct from
s22:** s22 = early state settling ~5:54; s24 = the complete paragraph typing from near-empty
and the seaweed world *rebuilding* during the type-on. **Craft:** ⊗ + typewriter gravity, no
red.

### Scene 25 — Post-bypass decontamination: 4 steps (6:27)
Title "Post-Bypass Decontamination"; a left-to-right row of dashed thumbnail cards building
Exchange → treat → flush → refill. **VO:** "…full ballast water exchange way out in the middle
of the ocean, then treat that new water, flush the tanks, and finally refill…". **Build:**
step-flow conveyor — cards slide in from the right, left-anchored, 1-2-3-4; captions type per
step (`Exch|`→`Exchange`). **Sync:** exchange→ship card, treat→plant icon, refill→water-glass.
**Craft:** numbered process reveal mapping 1:1 to four spoken steps; offset drop shadows.

### Scene 26 — Chapter divider "4 · The Final Word" (6:41)
Purple "4" + "The Final Word" + subtitle "New Record Book Rules"; book-and-magnifier icon; a
document + shield-check + rotating-arrows verification loop; a ship sailing the top wave band.
**VO:** "…the paper trail, the record book. This is where you prove you've done your job
right… it has to be perfect." **Text:** title + subtitle type on with caret, subtitle
progressively. **Sync:** "record book"→book icon, "prove/compliance"→verification loop.
**Movement:** arrows spin (idle), ship translates continuously. **Craft:** compound
"verification" glyph in one animated unit; ship kept alive for the single-world feel.

### Scene 27 — Transition into "Path to New Record Keeping" (6:49)
Outgoing "Final Word" content slides **up and off**; new two-line title types on lower-left; a
porthole ring fades in center-right with its rim stroke drawing on; fish drift. **VO:**
"Listen up… A major change is on the horizon…". **Text:** caret (`Path to|` / `New Record
Keepin|`); second line in accent blue. **Craft:** content slides over persistent water (no
cut); new title begins typing **while the prior scene is still exiting** (overlap/anticipation).

### Scene 28 — Timeline: convention → new format (6:59)
Title; a white card with a horizontal timeline — ship node "Sep 2017" left, book-with-gear
node "Feb 1, 2025" right; connector draws; gear spins; a check stamps on the book. **VO:**
"…around since 2017… but starting February 1, 2025, a totally new coded format… becomes
mandatory. No exceptions." **Text:** the **date reveal is deferred** — "Feb 1, 2025" types on
last, landing on the spoken deadline. **Sync:** 2017→left, Feb-2025→right (past-left /
mandate-right). **Craft:** before/after timeline in a floating card; gear+check = "coded/
verified format."

### Scene 29 — Column split: "Previous Format" vs "From Feb 2025" (7:15)
Two record-book table cards side by side; the right table's first column is split into two
(Date | Code Letter). **VO:** "…The very first column in the record book was split into two.
If an existing book was being used, a line was drawn down the middle." **Build:** headers
draw, then rows fill top-to-bottom; the split is shown *structurally* (right table carries the
extra narrow column). **Sync:** "split into two"→the two-column render; "line down the middle"→
the added divider. **Craft:** **realistic record-book page mockups** with ruled rows and
sample entries — clean before/after documentary treatment, not an animated cut.

### Scene 30 — Code table A / F / H (7:41)
A table (Code | Description | Your Action); circular badges A · F · H down the left; rows fill
with text + action icons. **VO:** "…focus on three… A is for taking on ballast. F is for any
failure or malfunction of the BWMS." **Build:** empty structure first, then row A fills
(ship+doc icons pop from the right), then row F (gear+wrench); **row H stays dim/waiting.**
**Sync:** A→ship/ballast, F→gear+wrench/failure; each row on its spoken letter. **Craft:**
active-vs-pending badge states (A/F filled, H dim) telegraph "more coming"; literal action
icons reinforce each row.

### Scene 31 — Record book: codes fill in (8:02)
Three cards — a "Ballast Water Record Book" cover (signature + "From:" line ink on), a center
checkmark disc, a right-hand "Record of Ballast Water Operations" grid. **VO:** "…B for double
lasting, C for… D for… E for… and G for tank cleaning operations." **Build:** the right table
**fills row-by-row** as codes are named; the cover's signature/"From:" ink in progressively.
**Text:** **handwritten-style ink fills**, not typewriter — signature scribble + code rows
drop in. **Sync:** rows accrue on the spoken B/C/D/E/G list. **Craft:** layered cards with
soft shadows + dashed cut-out borders (scrapbook feel); the document is literally *being
written* as the VO enumerates codes.

### Scene 32 — Ship + bypass toggle (8:22)
A tanker riding the wave band; top-left "BYPASS" with a checkmark that resolves from partial→
full; top-right a rotating water-droplet gauge. **VO:** "…any bypass decision, and the
complete decontamination process… Being precise in your logging here is everything." **Build:**
the tick beside BYPASS grows/pulses to a confirmed state on "any bypass decision"; droplet
gauge rotates. **Movement:** the ship **bobs continuously** on the live water (waterline shifts
noticeably). **Craft:** toggle-check micro-interaction = a verified beat; the recurring ship
integrated into live water, not pasted on.

### Scene 33 — "Master must maintain a record" quote card (8:43)
A large floating white quote card (soft shadow): "The Master must maintain a record confirming
every officer and engineer has been **familiarized** with this **requirement.**" — keywords in
accent blue, "requirement." underlined; anchor icon lower-left; clipboard overlapping the card
corner. **VO:** "…It is a hard and fast regulatory requirement. The master has to keep a
training record…". **Text:** shown as a block (not typed in-window); two-tone keyword highlight
+ underline is the emphasis. **Movement:** deliberately near-static — a "read this" gravity
hold — over drifting water. **Craft:** elevated card + generous shadow; clipboard overlaps the
corner for layering; the film's one intentional still beat.

### Scene 34 — Closing: "vessel's compliance?" (9:02)
Closing composition: a tilted 3D hardcover "Ballast Water Record Book" left (soft shadow,
faint helm motif behind); right the closing question "Are you recording the complete story of
your vessel's **compliance?**" — "compliance?" in accent blue. **VO:** "…Your logbook… it's
your vessel's voice… make sure it's telling the right one." **Text:** headline types on with a
visible caret (`compliance?|`), then holds. **Movement:** the book has a gentle continuous
idle bob. **World:** richest ambient of the closing stretch — drifting fish, rising bubbles,
helm motif. **Craft:** resolution beat — returns to the hero object as a tangible 3D book
(closing the loop from the open); caret-typed rhetorical question + accent word leaves the
viewer on the thesis; fullest ambient life ties to "keeping our oceans safe."

---

## 4. What this requires of Mastering Persuasion

The reference is not a style to admire — it is a **spec to hit.** Translating §2 into
requirements this project must meet:

1. **Every content element cued to its word.** Not a role-based stagger — the actual noun. Our
   `data-t` narration binding (209 elements) is the mechanism; it must cover every list,
   stat, node, and step, in spoken order. *(This is the single biggest lever.)*
2. **Base lands ≤2s, then content builds on the voice.** Never withhold the base; never dump
   the whole cast at once.
3. **Titles + body type on with a caret, two-tone, key word highlighted.** Already built —
   keep it on everything, per-line for multi-line.
4. **Transitions 0.3–0.5s per slide, board exits as a unit, world never breaks, no blank
   frame, no cross-dissolve.** Already tuned (15-frame slides); hold the line.
5. **Nothing sits frozen** — default idle on every settled element; ambient world always on.
   Built (default idle + WorldLayer bubbles/fish/atmosphere).
6. **Big stats: number first, largest, alone; unit types beside; echo badge.**
7. **Lists build one item per named term, with an empty slot telegraphing "more coming."**
8. **Depth is drawn** — soft card shadows, overlap, layering. Mostly the artwork's job.
9. **Alert is never colour.** Carry gravity with `✕`/`⊗` glyphs, typewriter cadence, and
   composition. **`--alert` #ac4f55 should be used essentially never** — this contradicts the
   current palette's alert role and is worth correcting.
10. **Recreate real artifacts** (record pages, tables, device UI) rather than iconifying them
    — an artwork-side requirement for Claude Design.
11. **Characters posed toward their content**, performing only where a beat demands it
    (a handshake, a point) — artwork-side.
12. **Ambient density tuned per scene** — rich on human/ecosystem beats, sparse on technical
    ones.

Items 1–7 are the film-pipeline's to hold and are largely in place. Items 8–12 are the
artwork's (Claude Design's) and are the substance of any upstream art brief.
