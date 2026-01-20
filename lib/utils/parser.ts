import type { ScrapedTweet } from "@/lib/twitter/scraper";

const INTERACTION_WEIGHTS: Record<string, number> = {
    reply: 3,
    quote: 2,
    original: 1,
    retweet: 0.5,
};

const MAX_KEYWORDS = 40;
const MAX_BIGRAMS = 25;
const MAX_EXAMPLES = 8;
const BIGRAM_WEIGHT = 0.7;
const BIO_WEIGHT = 2;

const STOPWORDS_EN = new Set([
    "the", "and", "for", "that", "with", "this", "you", "your", "are", "but", "not",
    "have", "has", "had", "was", "were", "from", "they", "them", "their", "what",
    "when", "where", "which", "will", "would", "could", "should", "into", "onto",
    "about", "there", "here", "our", "out", "who", "why", "how", "all", "any",
    "can", "cant", "cannot", "its", "it's", "just", "like", "more", "most", "than",
    "over", "under", "been", "being", "because", "also", "only", "some", "such",
    "via", "http", "https", "com", "co", "www", "rt"
]);

const STOPWORDS_FA = new Set([
    "و", "در", "به", "از", "که", "این", "آن", "برای", "با", "است", "بود", "می",
    "شود", "شد", "ها", "های", "یک", "نه", "یا", "اما", "اگر", "هم", "همه", "روی",
    "تا", "همین", "چون", "باید", "نیست", "هست", "بودن", "کرد", "کردن", "کرده",
    "شده", "شما", "ما", "من", "او", "آنها", "ایشان", "همان", "مثل", "وضع", "بین",
    "پس", "قبل", "بعد", "ضمن", "هر", "هیچ", "دیگر"
]);

export interface SignalExtractionResult {
    hashtags: Record<string, number>;
    keywords: { term: string; weight: number }[];
    bigrams: { phrase: string; weight: number }[];
    diversity_hashtags: string[];
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
    examples: { type: string; text: string }[];
    signal_counts: {
        keyword_terms: number;
        hashtag_terms: number;
        total_weight: number;
    };
}

function normalizePersian(text: string) {
    return text
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ۀ/g, "ه")
        .replace(/أ|إ/g, "ا")
        .replace(/ؤ/g, "و");
}

function cleanText(text: string) {
    return normalizePersian(text)
        .replace(/https?:\/\/\S+/gi, " ")
        .replace(/@\w+/g, " ")
        .replace(/#[\w\u0600-\u06FF]+/g, " ")
        .replace(/[^\w\u0600-\u06FF\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(text: string) {
    const tokens = text.match(/[A-Za-z]{2,}|[\u0600-\u06FF]{2,}/g) || [];
    return tokens
        .map((token) => token.toLowerCase())
        .filter((token) => !STOPWORDS_EN.has(token))
        .filter((token) => !STOPWORDS_FA.has(token));
}

function extractHashtags(text: string) {
    const hashtagRegex = /#[\w\u0600-\u06FF]+/g;
    return (text.match(hashtagRegex) || []).map((tag) => tag.trim());
}

function normalizeForUniqueness(text: string) {
    return cleanText(text).toLowerCase();
}

function finalizeWeightedList(counts: Record<string, number>, maxItems: number) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxItems)
        .map(([term, weight]) => ({
            term,
            weight: Number(weight.toFixed(2)),
        }));
}

export function extractSignalsFromScrape(bio: string, tweets: ScrapedTweet[]): SignalExtractionResult {
    const hashtagCounts: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};
    const bigramCounts: Record<string, number> = {};
    const diversityHashtags = new Set<string>();
    const examples: Array<{ type: string; text: string; weight: number }> = [];

    let replyCount = 0;
    let quoteCount = 0;
    let originalCount = 0;
    let retweetCount = 0;
    let retweetWithoutTextCount = 0;
    let tweetsWithUrls = 0;
    let tweetsWithHashtags = 0;
    let totalWeight = 0;

    const uniqueText = new Set<string>();

    for (const tweet of tweets) {
        const weight = INTERACTION_WEIGHTS[tweet.type] || 1;
        const keywordWeight = tweet.isRetweetWithoutText ? 0 : weight;

        if (tweet.type === "reply") replyCount += 1;
        if (tweet.type === "quote") quoteCount += 1;
        if (tweet.type === "original") originalCount += 1;
        if (tweet.type === "retweet") retweetCount += 1;
        if (tweet.isRetweetWithoutText) retweetWithoutTextCount += 1;

        if (tweet.hasUrls) tweetsWithUrls += 1;

        const resolvedHashtags = tweet.hashtags.length > 0 ? tweet.hashtags : extractHashtags(tweet.text);
        if (resolvedHashtags.length > 0) tweetsWithHashtags += 1;

        if (tweet.text) {
            uniqueText.add(normalizeForUniqueness(tweet.text));
        }

        if (tweet.isRetweetWithoutText) {
            resolvedHashtags.forEach((tag) => diversityHashtags.add(tag));
        } else {
            resolvedHashtags.forEach((tag) => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + weight;
            });
        }

        if (keywordWeight > 0) {
            const tokens = tokenize(cleanText(tweet.text));
            tokens.forEach((token) => {
                keywordCounts[token] = (keywordCounts[token] || 0) + keywordWeight;
                totalWeight += keywordWeight;
            });

            for (let i = 0; i < tokens.length - 1; i += 1) {
                const phrase = `${tokens[i]} ${tokens[i + 1]}`;
                bigramCounts[phrase] = (bigramCounts[phrase] || 0) + keywordWeight * BIGRAM_WEIGHT;
            }

            if (tokens.length > 0) {
                examples.push({
                    type: tweet.type,
                    text: tweet.text,
                    weight: keywordWeight,
                });
            }
        }
    }

    const bioHashtags = extractHashtags(bio);
    if (bioHashtags.length > 0) {
        bioHashtags.forEach((tag) => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + BIO_WEIGHT;
        });
    }

    const bioTokens = tokenize(cleanText(bio));
    bioTokens.forEach((token) => {
        keywordCounts[token] = (keywordCounts[token] || 0) + BIO_WEIGHT;
        totalWeight += BIO_WEIGHT;
    });

    const keywords = finalizeWeightedList(keywordCounts, MAX_KEYWORDS);
    const bigrams = Object.entries(bigramCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_BIGRAMS)
        .map(([phrase, weight]) => ({ phrase, weight: Number(weight.toFixed(2)) }));

    const sortedHashtags = Object.fromEntries(
        Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([tag, weight]) => [tag, Number(weight.toFixed(2))])
    );

    const totalTweets = tweets.length || 1;
    const uniqueRatio = uniqueText.size / totalTweets;

    const exampleTweets = examples
        .sort((a, b) => b.weight - a.weight)
        .slice(0, MAX_EXAMPLES)
        .map((example) => ({
            type: example.type,
            text: example.text,
        }));

    return {
        hashtags: sortedHashtags,
        keywords,
        bigrams,
        diversity_hashtags: Array.from(diversityHashtags).slice(0, 25),
        interaction_summary: {
            reply: replyCount,
            quote: quoteCount,
            original: originalCount,
            retweet: retweetCount,
            retweet_without_text: retweetWithoutTextCount,
            total: tweets.length,
        },
        sample_stats: {
            link_ratio: Number((tweetsWithUrls / totalTweets).toFixed(2)),
            hashtag_ratio: Number((tweetsWithHashtags / totalTweets).toFixed(2)),
            retweet_ratio: Number((retweetCount / totalTweets).toFixed(2)),
            reply_ratio: Number((replyCount / totalTweets).toFixed(2)),
            quote_ratio: Number((quoteCount / totalTweets).toFixed(2)),
            original_ratio: Number((originalCount / totalTweets).toFixed(2)),
            unique_text_ratio: Number(uniqueRatio.toFixed(2)),
        },
        examples: exampleTweets,
        signal_counts: {
            keyword_terms: keywords.length,
            hashtag_terms: Object.keys(sortedHashtags).length,
            total_weight: Number(totalWeight.toFixed(2)),
        },
    };
}
