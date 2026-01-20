// ============================================================================
// Hardware Source: lib/analysis/constants.ts
// Version: 3.0.0 — 2026-01-19
// Why: Provide discourse map + rules for the A/B/C/D model
// Env / Identity: Constants / Prompt Engineering
// ============================================================================

export const REFERENCE_DISCOURSE_MAP = {
    A: {
        category: "Structural Change",
        scope: "System overhaul, regime change, radical restructuring, constitutional reset",
        signals: [
            "revolution", "overthrow", "regime change", "collapse the system",
            "structural reform", "constitution", "dismantle", "end the system",
            "transition", "post-regime"
        ]
    },
    B: {
        category: "Reform & Development",
        scope: "Policy reform, institution building, elections, gradual change, governance quality",
        signals: [
            "reform", "policy", "election", "institutional", "governance",
            "development", "transparency", "accountability", "anti-corruption",
            "public services"
        ]
    },
    C: {
        category: "Resistance / Ideology",
        scope: "Identity, ideology, resistance language, religious or nationalist framing",
        signals: [
            "resistance", "ideology", "faith", "martyr", "identity",
            "anti-imperial", "anti-west", "revolutionary values",
            "tradition", "cultural purity"
        ]
    },
    D: {
        category: "Livelihood / Economy",
        scope: "Cost of living, jobs, inflation, currency, sanctions impact, daily life",
        signals: [
            "inflation", "jobs", "wages", "housing", "currency",
            "sanctions", "prices", "livelihood", "poverty",
            "economic hardship"
        ]
    }
} as const;

export const OPERATIONAL_RULES = [
    "Use weighted signals: higher weights mean stronger evidence.",
    "Retweets without added text do NOT count as core signals; they only hint at diversity.",
    "If signals are sparse or repetitive, reduce confidence and keep clusters minimal.",
    "Do not infer identity or personal belief; describe discourse patterns only.",
    "Avoid generic summaries; cite concrete signals from the input."
];
