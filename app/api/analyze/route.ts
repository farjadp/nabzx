// ============================================================================
// Hardware Source: app/api/analyze/route.ts
// Version: 1.2.0 — 2026-01-19
// Why: Integration with OpenAI and Apify for automated analysis
// Env / Identity: API Route / Uses OPENAI_API_KEY & APIFY_API_TOKEN
// ============================================================================

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/analysis/prompt';
import { scrapeTwitterProfile, XApiError } from '@/lib/twitter/scraper';
import { extractSignalsFromScrape } from '@/lib/utils/parser';
import { DBService } from '@/lib/db/service';

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

const ANALYSIS_SCHEMA_GUIDE = `
{
  "status": "success",
  "analysis_meta": {
    "total_signals_processed": 0,
    "primary_focus_area": "A|B|C|D|Mixed",
    "confidence_score": 0
  },
  "axis_scores": {
    "authority_orientation": { "value": 0, "confidence": "Low|Medium|High", "evidence": ["signal"] },
    "liberty_orientation": { "value": 0, "confidence": "Low|Medium|High", "evidence": ["signal"] },
    "ingroup_outgroup": { "value": 0, "confidence": "Low|Medium|High", "evidence": ["signal"] },
    "conflict_tolerance": { "value": 0, "confidence": "Low|Medium|High", "evidence": ["signal"] }
  },
  "dominant_tendency": {
    "label": "String",
    "explanation": "String"
  },
  "discourse_clusters": [
    {
      "cluster_name": "String",
      "mapped_category": "A|B|C|D",
      "description": "String",
      "associated_signals": ["#tag1", "#tag2"],
      "engagement_level": "Low|Medium|High"
    }
  ],
  "discourse_diversity": {
    "rating": "Echo Chamber|Focused|Balanced|Chaotic",
    "explanation": "String"
  },
  "user_facing_disclaimer": "String"
}`.trim();

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

function isValidAnalysisResult(result: any) {
    if (!result || result.status !== "success") return false;
    if (!result.analysis_meta) return false;
    if (typeof result.analysis_meta.total_signals_processed !== "number") return false;
    if (typeof result.analysis_meta.primary_focus_area !== "string") return false;
    if (typeof result.analysis_meta.confidence_score !== "number") return false;
    if (!result.axis_scores) return false;
    if (!result.axis_scores.authority_orientation) return false;
    if (!result.axis_scores.liberty_orientation) return false;
    if (!result.axis_scores.ingroup_outgroup) return false;
    if (!result.axis_scores.conflict_tolerance) return false;
    const axisEntries = [
        result.axis_scores.authority_orientation,
        result.axis_scores.liberty_orientation,
        result.axis_scores.ingroup_outgroup,
        result.axis_scores.conflict_tolerance,
    ];
    if (!axisEntries.every((axis: any) => {
        return (
            axis &&
            typeof axis.value === "number" &&
            axis.value >= -10 &&
            axis.value <= 10 &&
            ["Low", "Medium", "High"].includes(axis.confidence) &&
            Array.isArray(axis.evidence) &&
            axis.evidence.every((item: any) => typeof item === "string")
        );
    })) {
        return false;
    }
    if (!result.dominant_tendency) return false;
    if (typeof result.dominant_tendency.label !== "string") return false;
    if (typeof result.dominant_tendency.explanation !== "string") return false;
    if (!Array.isArray(result.discourse_clusters)) return false;
    if (!result.discourse_clusters.every((cluster: any) => {
        return (
            cluster &&
            typeof cluster.cluster_name === "string" &&
            ["A", "B", "C", "D"].includes(cluster.mapped_category) &&
            typeof cluster.description === "string" &&
            Array.isArray(cluster.associated_signals) &&
            cluster.associated_signals.every((signal: any) => typeof signal === "string") &&
            ["Low", "Medium", "High"].includes(cluster.engagement_level)
        );
    })) {
        return false;
    }
    if (!result.discourse_diversity) return false;
    if (!["Echo Chamber", "Focused", "Balanced", "Chaotic"].includes(result.discourse_diversity.rating)) {
        return false;
    }
    if (typeof result.discourse_diversity.explanation !== "string") return false;
    if (typeof result.user_facing_disclaimer !== "string") return false;
    return true;
}

async function repairAnalysisPayload(rawOutput: string, inputPayload: string) {
    const repairPrompt = [
        "You are a strict JSON repair tool.",
        "Return ONLY valid JSON that matches this schema exactly:",
        ANALYSIS_SCHEMA_GUIDE,
        "If fields are missing, infer them from the input; if uncertain, use safe defaults.",
        "Do not add extra keys. Do not include markdown.",
        "",
        "Input payload:",
        inputPayload,
        "",
        "Raw model output:",
        rawOutput
    ].join("\n");

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
            { role: "system", content: "You output strict JSON only." },
            { role: "user", content: repairPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
    });

    const content = completion.choices[0].message.content;
    if (!content) return null;

    try {
        return JSON.parse(content);
    } catch {
        return null;
    }
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

            // OpenAI Analysis
            const systemPrompt = generateSystemPrompt();
            const userMessageContent = JSON.stringify(analysisInput);

            console.log("--- Sending Request to AI ---");

            const completion = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessageContent },
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const aiContent = completion.choices[0].message.content;

            if (!aiContent) {
                throw new Error("AI returned empty content");
            }

            let analysisResult: any = null;
            try {
                analysisResult = JSON.parse(aiContent);
            } catch {
                analysisResult = null;
            }

            if (!isValidAnalysisResult(analysisResult)) {
                console.warn("AI returned invalid payload. Attempting repair.");
                const repaired = await repairAnalysisPayload(aiContent, userMessageContent);
                if (!isValidAnalysisResult(repaired)) {
                    throw new Error("AI returned invalid analysis payload");
                }
                analysisResult = repaired;
            }
            console.log("--- AI Analysis Complete ---");

            if (normalizedUsername) {
                DBService.saveUser(normalizedUsername, analysisResult);
            }

            return NextResponse.json({
                ...analysisResult,
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

    } catch (error: any) {
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

        return NextResponse.json(
            {
                status: "error",
                message: error.message || "Internal Server Error"
            },
            { status: 500 }
        );
    }
}
