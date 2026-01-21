// ============================================================================
// Hardware Source: lib/analysis/constants.ts
// Version: 3.1.0 — 2026-01-20
// Why: Capacity-Based Discourse Model Definitions
// Env / Identity: Constants
// ============================================================================

export const CAPABILITY_MAPPING = `
========================
DIMENSION MAPPING (MANDATORY)
========================
Map the raw analytical dimensions to the following POSITIVE / NEUTRAL capacities:

1. Authority  →  Capacity for Structure
   (preference for order, coordination, and centralized decision-making)

2. Liberty  →  Autonomy Sensitivity
   (attention to personal freedom, individual choice, and resistance to coercion)

3. Tribalism  →  Group Identity Strength
   (importance placed on collective identity and in-group cohesion)

4. Conflict  →  Confrontation Readiness
   (readiness to engage directly with disagreement or tension)

5. Change Horizon  →  Transformation Drive
   (energy toward gradual or rapid systemic change)
`;

export const FRAMING_RULES = `
========================
CRITICAL FRAMING RULES
========================
- You MUST NOT frame any dimension as a flaw, weakness, or moral judgment.
- You MUST describe each dimension as a form of CAPACITY, SENSITIVITY, or ORIENTATION.
- High or low values are DIFFERENT MODES, not good or bad.
- Avoid warning, alarmist, or corrective language.
`;

export const DISCLAIMER_TEXT = "This profile reflects observed discourse behavior and interaction patterns. It is not an assessment of personal beliefs, character, or values.";

// Legacy export if needed to avoid breaking other imports temporarily, though prompt.ts will be updated to not use it.
export const REFERENCE_DISCOURSE_MAP = {};
export const OPERATIONAL_RULES = [];
