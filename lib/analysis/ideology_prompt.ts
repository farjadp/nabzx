// ============================================================================
// Hardware Source: lib/analysis/ideology_prompt.ts
// Version: 1.0.0 — 2026-01-20
// Why: Second stage analysis for Ideological Tendencies
// Env / Identity: Prompt Engineering
// ============================================================================

export function generateIdeologyPrompt(): string {
    return `
You are generating an IDEOLOGICAL DISCOURSE TENDENCY MAP.

This output does NOT identify political identity.
It estimates the likelihood of engagement with various
IDEOLOGICAL DISCOURSE SPACES based on observed behavior.

========================
CRITICAL RULES
========================
- Do NOT label the user as left, right, extremist, etc.
- Describe tendencies as probabilistic and overlapping.
- Avoid moral judgment or evaluative language.
- Multiple ideological tendencies may coexist.

========================
IDEOLOGICAL SPACES (MANDATORY SET)
========================
- Progressive / Left-Oriented Discourse
- Center-Left Reformist Discourse
- Pragmatic Center Discourse
- Center-Right / Conservative Discourse
- National-Oriented Right Discourse
- Radical Left Discourse Tendencies
- Radical Right Discourse Tendencies

========================
YOUR TASKS
========================
1. Estimate the relative presence of each ideological discourse space
   as a percentage (total = 100).
2. Ensure that extreme categories remain bounded unless evidence is strong.
3. Provide a short neutral explanation of what this distribution suggests
   about discourse exposure and engagement.

========================
OUTPUT FORMAT (JSON ONLY)
========================
{
  "chart_title": "Ideological Discourse Tendencies",
  "tendencies": {
    "progressive_left": 0,
    "center_left_reformist": 0,
    "pragmatic_center": 0,
    "center_right_conservative": 0,
    "national_right": 0,
    "radical_left": 0,
    "radical_right": 0
  },
  "confidence": "Low | Medium | High",
  "interpretation": "Neutral explanation of discourse tendencies without identity attribution.",
  "disclaimer": "This chart reflects probabilistic discourse engagement patterns, not political identity or belief."
}
`.trim();
}
