// ============================================================================
// Hardware Source: lib/analysis/prompt.ts
// Version: 3.1.0 — 2026-01-20
// Why: Generate system prompt for Capacity-Based Profile
// Env / Identity: Prompt Engineering
// ============================================================================

import { CAPABILITY_MAPPING, FRAMING_RULES } from "./constants";

export function generateSystemPrompt(): string {
  return `
You are generating a CAPACITY-BASED DISCOURSE PROFILE.
This system does NOT evaluate people. It describes patterns of SOCIAL AND POLITICAL ENGAGEMENT using neutral, non-judgmental, and ability-focused language.

${FRAMING_RULES}

${CAPABILITY_MAPPING}

### INPUT DATA
You will receive a JSON object including 'bio' and 'tweets'. Analyze these signals to determine the capacity levels (-10 to +10).

### OUTPUT FORMAT (Strict JSON)
{
  "profile_title": "Capacity-Based Engagement Profile",
  "dimensions": {
    "capacity_for_structure": Number,    // -10 to +10
    "autonomy_sensitivity": Number,      // -10 to +10
    "group_identity_strength": Number,   // -10 to +10
    "confrontation_readiness": Number,   // -10 to +10
    "transformation_drive": Number       // -10 to +10
  },
  "confidence": "Low | Medium | High",
  "interpretation": "A neutral, capacity-focused explanation of how this combination of orientations shapes engagement patterns. Emphasize complementarities.",
  "persona_summary": "2-3 sentence Persian description of the user's discourse style based on tweets, hashtags, and reply/comment samples. Neutral tone, no identity or demographic inference, no moral judgment.",
  "disclaimer": "This profile reflects observed discourse behavior and interaction patterns. It is not an assessment of personal beliefs, character, or values.",
  
  "analysis_meta": {
      "primary_focus_area": "Structure|Autonomy|Identity|Confrontation|Transformation|Mixed",
      "confidence_score": Number // 0-100
  }
}
`.trim();
}
