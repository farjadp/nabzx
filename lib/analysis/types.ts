// ============================================================================
// Hardware Source: src/lib/analysis/types.ts
// Version: 2.1.0 — 2026-01-19
// Why: Align with discourse analysis schema used by the API/UI
// Env / Identity: Type definitions
// ============================================================================

export interface AnalysisInput {
    account: {
        username: string;
        tweet_count: number | null;
        sample_size: number;
        created_at: string | null;
        flags?: string[];
        interaction_summary: {
            reply: number;
            quote: number;
            original: number;
            retweet: number;
            retweet_without_text: number;
            total: number;
        };
        sample_stats: {
            link_ratio: number;
            hashtag_ratio: number;
            retweet_ratio: number;
            reply_ratio: number;
            quote_ratio: number;
            original_ratio: number;
            unique_text_ratio: number;
        };
    };
    weighted_hashtags: Record<string, number>;
    weighted_keywords: { term: string; weight: number }[];
    weighted_bigrams: { phrase: string; weight: number }[];
    diversity_hashtags: string[];
    example_tweets: { type: string; text: string }[];
    comment_samples?: { text: string }[];
    signal_summary: {
        keyword_terms: number;
        hashtag_terms: number;
        total_weight: number;
    };
}

export interface DiscourseCluster {
    cluster_name: string;
    mapped_category: "A" | "B" | "C" | "D";
    description: string;
    associated_signals: string[];
    engagement_level: "Low" | "Medium" | "High";
}

export interface AxisScore {
    value: number;
    confidence: "Low" | "Medium" | "High";
    evidence: string[];
}

export interface AnalysisOutput {
    status: "success";
    analysis_meta: {
        total_signals_processed: number;
        primary_focus_area: string;
        confidence_score: number;
    };
    axis_scores: {
        authority_orientation: AxisScore;
        liberty_orientation: AxisScore;
        ingroup_outgroup: AxisScore;
        conflict_tolerance: AxisScore;
    };
    dominant_tendency: {
        label: string;
        explanation: string;
    };
    discourse_clusters: DiscourseCluster[];
    discourse_diversity: {
        rating: "Echo Chamber" | "Focused" | "Balanced" | "Chaotic";
        explanation: string;
    };
    user_facing_disclaimer: string;
    _meta?: {
        is_cached: boolean;
        last_updated: string;
        history_count?: number;
        account_flags?: string[];
    };
}
