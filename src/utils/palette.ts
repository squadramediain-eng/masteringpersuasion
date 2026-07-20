// ─── SHARED COLOR PALETTE — Mastering Persuasion (single blue family + one alert) ──
// Per CLAUDE.md: translate every colour into blue; #ac4f55 is the ONLY non-blue,
// reserved for hazard/alert. Never hardcode a colour in a scene — import from here.

export const PALETTE = {
  // Scene background / transition-gap colour (light canvas)
  bg: '#f5f6fa',
  lightPanel: '#f5f6fa',

  // Blue backbone
  primary: '#3761b6',      // azure workhorse
  accent: '#3761b6',       // primary accent (alias kept for template code)
  deep: '#17439e',         // deep blue
  royal: '#0840a5',        // headings / hulls
  periwinkle: '#6084f0',   // accent + section numerals
  ink: '#253761',          // fine linework / hair detail

  // Glow base (concept-circle stroke #71afd8) — apply opacity per creative-standards
  accentGlowRGB: '113, 175, 216',
  accentGlow: (alpha: number) => `rgba(113, 175, 216, ${alpha})`,

  // The only non-blue value — hazard / destructive ONLY
  alert: '#ac4f55',

  white: '#ffffff',

  // Text
  textPrimary: '#0840a5',   // headings
  textSecondary: '#17439e', // body
  kicker: '#6685e8',        // tracked uppercase labels
  caption: '#6c7da4',
} as const;
