// ============================================================================
// Hardware Source: src/lib/analysis/types.ts
// Version: 3.0.0 — 2026-01-20
// Why: Transition to Capacity-Based Discourse Profile (Neutral Framing)
// Env / Identity: Type definitions
// ============================================================================

export interface AnalysisInput {
    username: string;
    bio: string;
    tweets: string[];
    scraped_source: string;
}

export interface CapacityDimensions {
    capacity_for_structure: number;      // Was Authority
    autonomy_sensitivity: number;        // Was Liberty
    group_identity_strength: number;     // Was Tribalism
    confrontation_readiness: number;     // Was Conflict
    transformation_drive: number;        // Was Change Horizon
}

export interface AxisScore {
    value: number;
    label?: string;
    confidence?: number;
}

// New Interface for Second Chart
export interface IdeologicalProfile {
    chart_title: string;
    tendencies: {
        progressive_left: number;
        center_left_reformist: number;
        pragmatic_center: number;
        center_right_conservative: number;
        national_right: number;
        radical_left: number;
        radical_right: number;
    };
    confidence: "Low" | "Medium" | "High";
    interpretation: string;
    disclaimer: string;
}

export interface AnalysisOutput {
    profile_title: string;
    dimensions: CapacityDimensions;
    confidence: "Low" | "Medium" | "High";
    interpretation: string; // Neutral, capacity-focused explanation
    persona_summary?: string; // Human-friendly description based on tweets/hashtags/comments
    disclaimer: string;

    // New (Step 2)
    ideological_analysis?: IdeologicalProfile;

    // Legacy/Meta fields
    analysis_meta?: {
        total_signals_processed: number;
        primary_focus_area: string;
        confidence_score: number;
        timestamp: string;
        user_facing_disclaimer?: string;
    };

    // API metadata injected at runtime
    _meta?: {
        is_cached: boolean;
        last_updated: string;
        history_count: number;
        account_flags: string[];
        scraper_source?: "twitter" | "apify";
    };
}
