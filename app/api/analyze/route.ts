// ============================================================================
// Hardware Source: app/api/analyze/route.ts
// Version: 1.3.0 — 2026-01-20
// Why: Integration with OpenAI and Apify for automated analysis (Capacity + Ideology)
// Env / Identity: API Route / Uses OPENAI_API_KEY & APIFY_API_TOKEN
// ============================================================================

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/analysis/prompt';
import { generateIdeologyPrompt } from '@/lib/analysis/ideology_prompt';
import { scrapeTwitterProfile, XApiError } from '@/lib/twitter/scraper';
import { extractSignalsFromScrape } from '@/lib/utils/parser';
import { DBService } from '@/lib/db/service';
import { AnalysisOutput } from '@/lib/analysis/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const MIN_ACCOUNT_TWEETS_HARD = 100;
const MIN_ACCOUNT_TWEETS_SOFT = 300;
const MAX_ACCOUNT_TWEETS_SOFT = 5000;
const MIN_SAMPLE_TWEETS = 40;
const MIN_NON_RETWEET_RATIO_HARD = 0.2;
const MIN_NON_RETWEET_RATIO_SOFT = 0.3;
const NEWS_KEYWORDS = [
    "news", "breaking", "press", "wire", "official", "tv", "radio", "daily", "times",
    "خبر", "اخبار", "خبرگزاری", "خبرنگار", "روزنامه", "رسانه", "شبکه", "خبر فوری"
];
const BOT_KEYWORDS = [
    "bot", "automation", "auto", "rss", "feed", "api"
];

function normalizeText(input: string) {
    return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function isLikelyNewsAccount(username: string, bio: string, stats: {
    link_ratio: number;
    reply_ratio: number;
    quote_ratio: number;
    retweet_ratio: number;
}) {
    const combined = `${username} ${bio}`.toLowerCase();
    const hasKeyword = NEWS_KEYWORDS.some((keyword) => combined.includes(keyword));
    const engagementRatio = stats.reply_ratio + stats.quote_ratio;
    return (
        (hasKeyword && stats.link_ratio >= 0.6) ||
        (stats.link_ratio >= 0.75 && engagementRatio < 0.1 && stats.retweet_ratio < 0.6)
    );
}

function isLikelyBot(username: string, bio: string, stats: {
    retweet_ratio: number;
    unique_text_ratio: number;
}, tweetsPerDay?: number) {
    const combined = `${username} ${bio}`.toLowerCase();
    const hasBotKeyword = BOT_KEYWORDS.some((keyword) => combined.includes(keyword));
    const highVolume = typeof tweetsPerDay === "number" && tweetsPerDay > 250;
    return hasBotKeyword || (highVolume && stats.retweet_ratio > 0.7 && stats.unique_text_ratio < 0.35);
}

function assessAccountEligibility(input: {
    username: string;
    bio: string;
    tweet_count?: number;
    created_at?: string;
    interaction_summary: {
        reply: number;
        quote: number;
        original: number;
        retweet: number;
        total: number;
    };
    sample_stats: {
        link_ratio: number;
        reply_ratio: number;
        quote_ratio: number;
        retweet_ratio: number;
        unique_text_ratio: number;
    };
}) {
    const flags: string[] = [];
    if (typeof input.tweet_count === "number") {
        if (input.tweet_count < MIN_ACCOUNT_TWEETS_HARD) {
            return { ok: false, status: 422, code: "LowActivity", message: "اکانت کمتر از ۱۰۰ توییت دارد و قابل تحلیل نیست." };
        }
        if (input.tweet_count < MIN_ACCOUNT_TWEETS_SOFT) {
            flags.push("LowSignalVolume");
        }
        if (input.tweet_count > MAX_ACCOUNT_TWEETS_SOFT) {
            flags.push("HighVolumeAccount");
        }
    }

    if (input.interaction_summary.total < MIN_SAMPLE_TWEETS) {
        return { ok: false, status: 422, code: "InsufficientSample", message: "نمونه‌ی توییت کافی نیست؛ برای تحلیل دقیق‌تر داده بیشتری لازم است." };
    }

    const nonRetweetCount = input.interaction_summary.reply + input.interaction_summary.quote + input.interaction_summary.original;
    const nonRetweetRatio = nonRetweetCount / Math.max(input.interaction_summary.total, 1);
    if (nonRetweetRatio < MIN_NON_RETWEET_RATIO_HARD) {
        return { ok: false, status: 422, code: "RetweetHeavy", message: "این اکانت بیشتر ری‌توئیت‌محور است و سیگنال کافی ندارد." };
    }
    if (nonRetweetRatio < MIN_NON_RETWEET_RATIO_SOFT) {
        flags.push("RetweetHeavy");
    }

    const bioNormalized = normalizeText(input.bio);
    if (isLikelyNewsAccount(input.username, bioNormalized, input.sample_stats)) {
        return { ok: false, status: 422, code: "NewsAccount", message: "این اکانت ماهیت خبری/رسانه‌ای دارد و تحلیل گفتمانی شخصی نیست." };
    }

    let tweetsPerDay: number | undefined;
    if (input.created_at && input.tweet_count) {
        const createdAt = new Date(input.created_at).getTime();
        const days = Math.max((Date.now() - createdAt) / (1000 * 60 * 60 * 24), 1);
        tweetsPerDay = input.tweet_count / days;
    }

    if (isLikelyBot(input.username, bioNormalized, input.sample_stats, tweetsPerDay)) {
        return { ok: false, status: 422, code: "BotLike", message: "الگوی فعالیت این اکانت شبیه ربات یا فید خودکار است." };
    }

    return { ok: true, flags };
}

function isValidAnalysisResult(result: unknown): result is AnalysisOutput {
    if (!result || typeof result !== "object") return false;
    const record = result as Record<string, unknown>;
    const dimensions = record.dimensions as Record<string, unknown> | undefined;
    if (!dimensions) return false;
    const requiredDims = [
        "capacity_for_structure",
        "autonomy_sensitivity",
        "group_identity_strength",
        "confrontation_readiness",
        "transformation_drive",
    ];
    if (!requiredDims.every((key) => typeof dimensions[key] === "number")) return false;

    const analysisMeta = record.analysis_meta as Record<string, unknown> | undefined;
    if (!analysisMeta) return false;
    if (typeof analysisMeta.confidence_score !== "number") return false;

    return true;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let { username } = body;
        let normalizedUsername: string | null = null;

        // --- Auto-Scraping Logic ---
        if (username) {
            // Sanitize username (remove @, url parts)
            username = username.replace('@', '').trim();
            if (username.includes('twitter.com/') || username.includes('x.com/')) {
                const parts = username.split('/');
                username = (parts[parts.length - 1] || parts[parts.length - 2]).split('?')[0];
            }
            // Remove query parameters if any remaining
            if (username.includes('?')) username = username.split('?')[0];
            normalizedUsername = username;

            console.log(`🤖 Auto-scraping for @${username}...`);

            const existingRecord = DBService.getUser(username);
            let historyCount = 0;
            if (existingRecord) {
                const lastUpdate = new Date(existingRecord.last_analyzed_at).getTime();
                const now = Date.now();
                const diff = now - lastUpdate;
                historyCount = existingRecord.history.length;

                if (diff < SIX_MONTHS_MS) {
                    if (isValidAnalysisResult(existingRecord.current_data)) {
                        console.log(`♻️ Returning cached data for ${username}`);
                        return NextResponse.json({
                            ...existingRecord.current_data,
                            _meta: {
                                is_cached: true,
                                last_updated: existingRecord.last_analyzed_at,
                                history_count: existingRecord.history.length
                            }
                        });
                    }
                    console.log(`♻️ Cached data missing new schema, re-analyzing...`);
                }

                console.log(`⏳ Data is old (${Math.floor(diff / (1000 * 60 * 60 * 24))} days). Re-analyzing...`);
            }

            // 1. Scrape data
            const scrapedData = await scrapeTwitterProfile(username);

            const signals = extractSignalsFromScrape(scrapedData.user.description, scrapedData.tweets);
            const eligibility = assessAccountEligibility({
                username,
                bio: scrapedData.user.description,
                tweet_count: scrapedData.user.public_metrics?.tweet_count,
                created_at: scrapedData.user.created_at,
                interaction_summary: signals.interaction_summary,
                sample_stats: signals.sample_stats,
            });

            if (!eligibility.ok) {
                return NextResponse.json(
                    {
                        status: "error",
                        message: eligibility.message,
                        code: eligibility.code
                    },
                    { status: eligibility.status }
                );
            }

            const commentSamples = signals.examples
                .filter((example) => example.type === "reply")
                .slice(0, 4)
                .map((example) => ({ text: example.text }));

            const analysisInput = {
                account: {
                    username,
                    tweet_count: scrapedData.user.public_metrics?.tweet_count ?? null,
                    sample_size: signals.interaction_summary.total,
                    created_at: scrapedData.user.created_at ?? null,
                    flags: eligibility.flags,
                    interaction_summary: signals.interaction_summary,
                    sample_stats: signals.sample_stats,
                },
                weighted_hashtags: signals.hashtags,
                weighted_keywords: signals.keywords,
                weighted_bigrams: signals.bigrams,
                diversity_hashtags: signals.diversity_hashtags,
                example_tweets: signals.examples,
                comment_samples: commentSamples,
                signal_summary: signals.signal_counts,
            };

            console.log(
                `Scrape successful via ${scrapedData.source}. Signals: ${Object.keys(signals.hashtags).length} hashtags, ${signals.keywords.length} keywords, ${signals.bigrams.length} bigrams.`
            );

            if (signals.keywords.length === 0 && Object.keys(signals.hashtags).length === 0) {
                return NextResponse.json(
                    {
                        status: "error",
                        message: "سیگنال معناداری در نمونه‌ی توییت‌ها پیدا نشد.",
                        code: "NoSignals"
                    },
                    { status: 400 }
                );
            }

            // OpenAI Analysis Step 1: Capacity Profile
            const systemPromptV1 = generateSystemPrompt();
            const userMessageContent = JSON.stringify(analysisInput);

            console.log("--- Sending Request to AI (Step 1: Capacity) ---");
            const completionV1 = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPromptV1 },
                    { role: "user", content: userMessageContent },
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const aiContentV1 = completionV1.choices[0].message.content;
            if (!aiContentV1) throw new Error("AI Step 1 returned empty content");

            let capacityResult: AnalysisOutput;
            try {
                const parsed = JSON.parse(aiContentV1) as unknown;
                if (!isValidAnalysisResult(parsed)) {
                    throw new Error("AI Step 1 result missing required fields");
                }
                capacityResult = parsed;
            } catch {
                throw new Error("AI Step 1 JSON Parse Error");
            }

            // OpenAI Analysis Step 2: Ideological Tendency
            const systemPromptV2 = generateIdeologyPrompt();
            // Input for Step 2 includes the Capacity Profile we just generated + original signals
            const step2Input = {
                capacity_profile: capacityResult,
                evidence_summary: analysisInput.signal_summary,
                // We pass limited context to save tokens, the specific signals
                key_signals: {
                    hashtags: analysisInput.weighted_hashtags,
                    keywords: analysisInput.weighted_keywords
                }
            };

            console.log("--- Sending Request to AI (Step 2: Ideology) ---");
            const completionV2 = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPromptV2 },
                    { role: "user", content: JSON.stringify(step2Input) },
                ],
                response_format: { type: "json_object" },
                temperature: 0.2, // Slightly higher temp for interpretive variety
            });

            const aiContentV2 = completionV2.choices[0].message.content;
            let ideologyResult: AnalysisOutput["ideological_analysis"] | null = null;
            if (aiContentV2) {
                try {
                    ideologyResult = JSON.parse(aiContentV2) as AnalysisOutput["ideological_analysis"];
                } catch {
                    ideologyResult = null;
                }
            }

            // Merge Results
            const finalResult = {
                ...capacityResult,
                ideological_analysis: ideologyResult ?? undefined, // Attach Step 2 result
                analysis_meta: {
                    ...capacityResult.analysis_meta,
                    primary_focus_area: capacityResult.analysis_meta?.primary_focus_area ?? "Mixed",
                    confidence_score: capacityResult.analysis_meta?.confidence_score ?? 0,
                    total_signals_processed: signals.interaction_summary.total,
                    timestamp: new Date().toISOString()
                }
            };

            // Validate
            if (!isValidAnalysisResult(finalResult)) {
                console.warn("Validation failed on merged result");
            }

            console.log("--- AI Analysis Complete (Both Steps) ---");

            if (normalizedUsername) {
                DBService.saveUser(normalizedUsername, finalResult);
            }

            return NextResponse.json({
                ...finalResult,
                _meta: {
                    is_cached: false,
                    last_updated: new Date().toISOString(),
                    history_count: historyCount,
                    account_flags: eligibility.flags || []
                }
            });
        }
        return NextResponse.json(
            { status: "error", message: "Username is required." },
            { status: 400 }
        );

    } catch (error: unknown) {
        console.error("Server Error:", error);

        if (error instanceof XApiError) {
            if (error.status === 402) {
                return NextResponse.json(
                    {
                        status: "error",
                        message: "اعتبار X API تمام شده است. لطفاً از پنل X مقدار Credits را شارژ کنید.",
                        code: error.code || "CreditsDepleted"
                    },
                    { status: 402 }
                );
            }

            if (error.status === 404) {
                return NextResponse.json(
                    {
                        status: "error",
                        message: "یوزرنیم پیدا نشد یا دسترسی کافی نداریم.",
                        code: error.code || "UserNotFound"
                    },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    status: "error",
                    message: error.message || "X API Error",
                    code: error.code
                },
                { status: error.status }
            );
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json(
            {
                status: "error",
                message
            },
            { status: 500 }
        );
    }
}
