// Cross-references every SceneXX.tsx against its source Frame_XX.svg.
// Complements extras/svg-audit.js (which checks SVG naming QUALITY in isolation).
// This script checks the actual CODE<->SVG wiring:
//   1. IDs referenced in scene code that do NOT exist in the SVG (silent animation failures)
//   2. Real, addressable SVG ids that are NEVER referenced anywhere in the scene code
//      (candidates for "looks static / unanimated" defects — needs human triage, not all
//      are bugs: bg/structural wrappers are often intentionally static)
//
// Usage: node scripts/audit-scene-ids.js [sceneId ...]
//   no args  -> audits every scene in sceneRegistry.ts
//   sceneId  -> e.g. "scene-16" to audit just one

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SVG_DIR = path.join(ROOT, 'src/assets/scenes');
const SCENES_DIR = path.join(ROOT, 'src/scenes');
const REGISTRY_PATH = path.join(ROOT, 'src/utils/sceneRegistry.ts');

// Tag names whose `id` attribute is a definition (gradient/clip/filter/mask target),
// not an addressable visual element — these should never be expected in scene code.
const DEF_TAGS = /^(linearGradient|radialGradient|clipPath|filter|mask|symbol|pattern)$/i;

function extractSvgIds(svgSrc) {
  const real = new Set();
  const defs = new Set();
  // Walk every opening tag, capture its id + tag name.
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(svgSrc)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    const idMatch = attrs.match(/\bid="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];
    if (DEF_TAGS.test(tag)) defs.add(id);
    else real.add(id);
  }
  return { real, defs };
}

function extractCodeIds(tsxSrc) {
  const ids = new Set();
  let m;

  // Scope to the injected SVG style template literal (`const styleBlock = \`...\`;`)
  // so we don't pick up unrelated hex colors used elsewhere in the file (JSX style objects).
  // Real ids (e.g. "face", "bed") can look exactly like a hex color -- only filter out
  // hex-looking tokens when we fell back to scanning the whole file, where stray hex
  // colors are actually possible; inside the styleBlock scope, trust every match.
  const blockMatch = tsxSrc.match(/const\s+styleBlock\s*=\s*`([\s\S]*?)`\s*;/);
  const scoped = !!blockMatch;
  let scope = scoped ? blockMatch[1] : tsxSrc;

  // Dynamic/templated ids (e.g. "#c${i + 1}", built inside a .map() loop) can't be
  // statically expanded without evaluating the loop. A naive hash scan over the raw
  // text stops at the "$" and mis-records a truncated, never-real id ("c") -- both a
  // false SILENT FAILURE (that bogus id isn't in the SVG) and a false "never
  // referenced" for every real c1..cN it actually does cover. Record the prefix
  // instead and resolve it against the SVG's real ids in the main loop below; strip
  // the whole token out of scope first so the general hash scan never sees it.
  const dynamicPrefixes = new Set();
  scope = scope.replace(/#([A-Za-z_][A-Za-z0-9_-]*)\$\{[^}]*\}/g, (full, prefix) => {
    dynamicPrefixes.add(prefix);
    return '';
  });

  // Any #identifier token — covers comma-separated selectors (#a, #b {) and
  // descendant selectors (#arrow_1 polyline {), not just "#id {" directly.
  const hashRe = /#([A-Za-z_][A-Za-z0-9_\-]*)/g;
  while ((m = hashRe.exec(scope)) !== null) {
    const id = m[1];
    if (!scoped && /^[0-9a-fA-F]{3,8}$/.test(id)) continue; // skip stray hex colors only in fallback mode
    ids.add(id);
  }

  // getElementById('id') / querySelector('#id') anywhere in the file
  const jsRe = /getElementById\(['"]([^'"]+)['"]\)|querySelector\(['"]#([^'"]+)['"]\)/g;
  while ((m = jsRe.exec(tsxSrc)) !== null) ids.add(m[1] || m[2]);

  return { ids, dynamicPrefixes };
}

function extractSelfDefinedIds(tsxSrc) {
  // Some scenes inject their own <clipPath id="..."> directly into the SVG string
  // (e.g. Scene01's clipTop/clipBot) — these are self-defined, not missing from the SVG.
  const ids = new Set();
  const clipDefRe = /<clipPath\s+id="([^"]+)"/g;
  let m;
  while ((m = clipDefRe.exec(tsxSrc)) !== null) ids.add(m[1]);
  return ids;
}

function loadRegistry() {
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const entries = [];
  const entryRe = /\{\s*id:\s*'([^']+)',[^}]*?svgFile:\s*'([^']+)'/g;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    entries.push({ id: m[1], svgFile: m[2] });
  }
  return entries;
}

function sceneFileFor(sceneId) {
  // scene-01 -> Scene01.tsx ; scene-20-dup -> Scene18.tsx (reuses Scene18 component)
  if (sceneId === 'scene-20-dup') return 'Scene18.tsx';
  const num = sceneId.match(/scene-(\d+)/)[1];
  return `Scene${num}.tsx`;
}

const args = process.argv.slice(2);
const registry = loadRegistry();
const targets = args.length ? registry.filter(e => args.includes(e.id)) : registry;

let totalMismatches = 0;
let totalUnreferenced = 0;

for (const entry of targets) {
  const svgPath = path.join(SVG_DIR, entry.svgFile);
  const sceneFile = sceneFileFor(entry.id);
  const tsxPath = path.join(SCENES_DIR, sceneFile);

  if (!fs.existsSync(svgPath) || !fs.existsSync(tsxPath)) {
    console.log(`${entry.id}: SKIP (missing ${svgPath} or ${tsxPath})`);
    continue;
  }

  const svgSrc = fs.readFileSync(svgPath, 'utf8');
  const tsxSrc = fs.readFileSync(tsxPath, 'utf8');

  const { real, defs } = extractSvgIds(svgSrc);
  const { ids: codeIds, dynamicPrefixes } = extractCodeIds(tsxSrc);
  const selfDefined = extractSelfDefinedIds(tsxSrc);

  // Resolve each dynamic "#prefix${...}" against the SVG's real ids: every real id
  // matching prefix+digits (c1, c2, ... cN) counts as referenced by that one template.
  for (const prefix of dynamicPrefixes) {
    const prefixRe = new RegExp(`^${prefix}\\d+$`);
    for (const id of real) {
      if (prefixRe.test(id)) codeIds.add(id);
    }
  }

  const missingFromSvg = [...codeIds].filter(id => !real.has(id) && !defs.has(id) && !selfDefined.has(id));
  const neverReferenced = [...real].filter(id => !codeIds.has(id));

  if (missingFromSvg.length === 0 && neverReferenced.length === 0) {
    console.log(`${entry.id} (${entry.svgFile} <-> ${sceneFile}): OK`);
    continue;
  }

  console.log(`\n${entry.id} (${entry.svgFile} <-> ${sceneFile}):`);
  if (missingFromSvg.length) {
    totalMismatches += missingFromSvg.length;
    console.log(`  SILENT FAILURE — referenced in code, not in SVG: ${missingFromSvg.join(', ')}`);
  }
  if (neverReferenced.length) {
    totalUnreferenced += neverReferenced.length;
    console.log(`  Never referenced in code (review for static/missing-animation): ${neverReferenced.join(', ')}`);
  }
}

console.log(`\n--- TOTAL: ${totalMismatches} silent failures, ${totalUnreferenced} never-referenced SVG ids across ${targets.length} scenes ---`);
process.exit(totalMismatches > 0 ? 1 : 0);
