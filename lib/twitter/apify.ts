import { ApifyClient } from "apify-client";
import type { ScrapedData, ScrapedTweet, ScrapedUser } from "@/lib/twitter/scraper";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_TWITTER_ACTOR_ID = process.env.APIFY_TWITTER_ACTOR_ID || "apify/twitter-scraper";
const APIFY_TWEET_SAMPLE_SIZE = Math.min(Math.max(Number(process.env.APIFY_TWEET_SAMPLE_SIZE || 200), 20), 400);

type ApifyTweetItem = Record<string, unknown>;

type ApifyUser = {
    username?: string;
    userName?: string;
    screen_name?: string;
    description?: string;
    bio?: string;
    createdAt?: string;
    created_at?: string;
    statusesCount?: number;
    statuses_count?: number;
    tweet_count?: number;
    verified?: boolean;
    public_metrics?: {
        tweet_count?: number;
    };
};

function extractHashtags(text: string): string[] {
    const matches = text.match(/#[\w\u0600-\u06FF]+/g) || [];
    return matches.map((tag) => tag.trim());
}

function normalizeHandle(value?: string) {
    if (!value) return "";
    return value.replace(/^@/, "").trim().toLowerCase();
}

function getUserFromItem(item: ApifyTweetItem): ApifyUser | undefined {
    return (item.author as ApifyUser) || (item.user as ApifyUser) || (item.owner as ApifyUser) || undefined;
}

function getTweetText(item: ApifyTweetItem): string {
    return (
        (item.fullText as string) ||
        (item.text as string) ||
        (item.content as string) ||
        ""
    );
}

function mapTweetType(item: ApifyTweetItem): ScrapedTweet["type"] {
    if (item.isRetweet || item.retweetedStatusId || item.retweeted_status_id) return "retweet";
    if (item.isReply || item.inReplyToStatusId || item.in_reply_to_status_id) return "reply";
    if (item.isQuote || item.quotedStatusId || item.quoted_status_id) return "quote";
    return "original";
}

function mapApifyTweet(item: ApifyTweetItem): ScrapedTweet | null {
    const rawId = item.id || item.tweetId || item.statusId || item.id_str;
    const id = rawId ? String(rawId) : undefined;
    const text = getTweetText(item).trim();
    if (!id && !text) return null;

    const hashtagsRaw =
        (Array.isArray(item.hashtags) ? (item.hashtags as string[]) : undefined) ||
        ((item.entities as { hashtags?: Array<{ tag?: string; text?: string }> })?.hashtags || [])
            .map((tag) => tag.tag || tag.text)
            .filter(Boolean) as string[];
    const hashtags = (hashtagsRaw && hashtagsRaw.length > 0)
        ? hashtagsRaw.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        : extractHashtags(text);

    const urls =
        (Array.isArray(item.urls) ? (item.urls as unknown[]) : undefined) ||
        ((item.entities as { urls?: unknown[] })?.urls || []);

    const type = mapTweetType(item);
    const cleanedText = text.replace(/^RT\s+@\w+:\s*/i, "").trim();

    return {
        id: id || `apify-${Math.random().toString(36).slice(2, 10)}`,
        text,
        type,
        hashtags,
        hasUrls: Array.isArray(urls) && urls.length > 0,
        isRetweetWithoutText: type === "retweet" && cleanedText.length === 0,
    };
}

function resolveUser(username: string, items: ApifyTweetItem[]): ScrapedUser {
    const normalizedTarget = normalizeHandle(username);
    const itemWithUser = items.find((item) => {
        const user = getUserFromItem(item);
        const handle = normalizeHandle(user?.userName || user?.username || user?.screen_name);
        return handle && handle === normalizedTarget;
    }) || items.find((item) => getUserFromItem(item));

    const user = itemWithUser ? getUserFromItem(itemWithUser) : undefined;
    const resolvedUsername = normalizeHandle(user?.userName || user?.username || user?.screen_name) || normalizedTarget;
    const tweetCount =
        user?.tweet_count ||
        user?.statusesCount ||
        user?.statuses_count ||
        user?.public_metrics?.tweet_count;

    return {
        username: resolvedUsername || normalizedTarget,
        description: user?.description || user?.bio || "",
        created_at: user?.createdAt || user?.created_at,
        verified: user?.verified,
        public_metrics: tweetCount ? { tweet_count: tweetCount } : undefined,
    };
}

export async function scrapeTwitterProfileViaApify(username: string): Promise<ScrapedData> {
    if (!APIFY_API_TOKEN) {
        throw new Error("APIFY_API_TOKEN is not set");
    }

    const client = new ApifyClient({ token: APIFY_API_TOKEN });

    const input = {
        handles: [username],
        tweetsDesired: APIFY_TWEET_SAMPLE_SIZE,
        addUserInfo: true,
        proxyConfiguration: { useApifyProxy: true },
    };

    const run = await client.actor(APIFY_TWITTER_ACTOR_ID).call(input);
    if (!run?.defaultDatasetId) {
        throw new Error("Apify run failed to return dataset id");
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems({ limit: APIFY_TWEET_SAMPLE_SIZE });
    const items = (dataset.items || []) as ApifyTweetItem[];

    if (items.length === 0) {
        throw new Error("Apify returned no tweets");
    }

    const tweets = items.map(mapApifyTweet).filter((tweet): tweet is ScrapedTweet => Boolean(tweet));

    return {
        user: resolveUser(username, items),
        tweets,
        source: "apify",
    };
}
