// ============================================================================
// Hardware Source: lib/twitter/scraper.ts
// Version: 3.0.0 — 2026-01-19
// Why: Use official X API with richer signals + pagination
// Env / Identity: Helper function / Uses X_CLIENT_ID/SECRET, X_CONSUMER_KEY/SECRET, or X_BEARER_TOKEN
// ============================================================================

const X_API_BASE_URL = process.env.X_API_BASE_URL || "https://api.x.com/2";
const RAW_BEARER_TOKEN = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
const X_BEARER_TOKEN = RAW_BEARER_TOKEN ? safeDecodeURIComponent(RAW_BEARER_TOKEN) : undefined;
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const X_CONSUMER_KEY =
    process.env.X_CONSUMER_KEY ||
    process.env.TWITTER_CONSUMER_KEY ||
    process.env.TWITTER_API_KEY;
const X_CONSUMER_SECRET =
    process.env.X_CONSUMER_SECRET ||
    process.env.TWITTER_CONSUMER_SECRET ||
    process.env.TWITTER_API_SECRET;
const FETCH_TIMEOUT_MS = 10000;
const MAX_TWEETS = Math.min(
    Math.max(Number(process.env.X_TWEET_SAMPLE_SIZE || 300), 50),
    400
);
const OAUTH2_CLIENT_TOKEN_URLS = [
    "https://api.x.com/2/oauth2/token",
    "https://api.twitter.com/2/oauth2/token",
];
const OAUTH1_APP_TOKEN_URLS = [
    "https://api.x.com/oauth2/token",
    "https://api.twitter.com/oauth2/token",
];

export type TweetInteractionType = "reply" | "quote" | "retweet" | "original";

export interface ScrapedTweet {
    id: string;
    text: string;
    type: TweetInteractionType;
    hashtags: string[];
    hasUrls: boolean;
    isRetweetWithoutText: boolean;
}

export interface ScrapedUser {
    username: string;
    description: string;
    created_at?: string;
    verified?: boolean;
    public_metrics?: {
        tweet_count: number;
        followers_count: number;
        following_count: number;
        listed_count: number;
    };
}

export interface ScrapedData {
    user: ScrapedUser;
    tweets: ScrapedTweet[];
    source: "twitter_api";
}

export class XApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "XApiError";
        this.status = status;
        this.code = code;
    }
}

let cachedBearerToken: {
    token: string;
    expiresAt?: number;
    source: "oauth2" | "oauth1" | "env";
} | null = null;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

function safeDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function getBasicAuthHeader(username: string, password: string) {
    const encoded = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
    return `Basic ${encoded}`;
}

function buildApiErrorMessage(status: number, payload: any) {
    const apiMessage = payload?.errors?.[0]?.detail || payload?.title || payload?.error;
    return apiMessage ? `X API ${status}: ${apiMessage}` : `X API ${status}`;
}

async function requestBearerToken(
    url: string,
    authHeader: string
): Promise<{ token: string; expiresAt?: number }> {
    const response = await fetchWithTimeout(
        url,
        {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        },
        FETCH_TIMEOUT_MS
    );

    const text = await response.text();
    let payload: any = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    const errorCode =
        payload?.errors?.[0]?.code ||
        payload?.errors?.[0]?.title ||
        payload?.title ||
        payload?.error;

    if (!response.ok) {
        const message = buildApiErrorMessage(response.status, payload);
        throw new XApiError(message, response.status, errorCode);
    }

    if (payload?.errors?.length) {
        const message = buildApiErrorMessage(response.status, payload);
        const status = response.status === 200 ? 404 : response.status;
        throw new XApiError(message, status, errorCode);
    }

    const accessToken = payload?.access_token;
    if (!accessToken) {
        throw new Error("X OAuth token response missing access_token");
    }

    const expiresIn = typeof payload?.expires_in === "number" ? payload.expires_in : undefined;
    return {
        token: accessToken,
        expiresAt: expiresIn ? Date.now() + Math.max(expiresIn - 30, 0) * 1000 : undefined,
    };
}

async function fetchBearerFromOAuth2ClientCredentials() {
    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
        throw new Error("X_CLIENT_ID or X_CLIENT_SECRET is not set");
    }

    const authHeader = getBasicAuthHeader(X_CLIENT_ID, X_CLIENT_SECRET);
    let lastError = "unknown error";

    for (const url of OAUTH2_CLIENT_TOKEN_URLS) {
        try {
            return await requestBearerToken(url, authHeader);
        } catch (error: any) {
            lastError = typeof error?.message === "string" ? error.message : "unknown error";
        }
    }

    throw new Error(`OAuth2 client credentials failed: ${lastError}`);
}

async function fetchBearerFromConsumerKeys() {
    if (!X_CONSUMER_KEY || !X_CONSUMER_SECRET) {
        throw new Error("X_CONSUMER_KEY or X_CONSUMER_SECRET is not set");
    }

    const authHeader = getBasicAuthHeader(X_CONSUMER_KEY, X_CONSUMER_SECRET);
    let lastError = "unknown error";

    for (const url of OAUTH1_APP_TOKEN_URLS) {
        try {
            return await requestBearerToken(url, authHeader);
        } catch (error: any) {
            lastError = typeof error?.message === "string" ? error.message : "unknown error";
        }
    }

    throw new Error(`OAuth1 app-only failed: ${lastError}`);
}

async function getBearerToken(): Promise<string> {
    if (cachedBearerToken?.token) {
        if (!cachedBearerToken.expiresAt || cachedBearerToken.expiresAt > Date.now()) {
            return cachedBearerToken.token;
        }
        cachedBearerToken = null;
    }

    const errors: string[] = [];

    if (X_CLIENT_ID && X_CLIENT_SECRET) {
        try {
            const tokenData = await fetchBearerFromOAuth2ClientCredentials();
            cachedBearerToken = { token: tokenData.token, expiresAt: tokenData.expiresAt, source: "oauth2" };
            return tokenData.token;
        } catch (error: any) {
            errors.push(typeof error?.message === "string" ? error.message : "oauth2 error");
        }
    }

    if (X_CONSUMER_KEY && X_CONSUMER_SECRET) {
        try {
            const tokenData = await fetchBearerFromConsumerKeys();
            cachedBearerToken = { token: tokenData.token, expiresAt: tokenData.expiresAt, source: "oauth1" };
            return tokenData.token;
        } catch (error: any) {
            errors.push(typeof error?.message === "string" ? error.message : "oauth1 error");
        }
    }

    if (X_BEARER_TOKEN) {
        cachedBearerToken = { token: X_BEARER_TOKEN, source: "env" };
        return X_BEARER_TOKEN;
    }

    throw new Error(`No valid X API credentials. ${errors.join(" | ")}`.trim());
}

async function fetchTwitterApi<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
    const url = new URL(`${X_API_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    const makeRequest = (token: string) =>
        fetchWithTimeout(
            url.toString(),
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            FETCH_TIMEOUT_MS
        );

    let token = await getBearerToken();
    let response = await makeRequest(token);

    if ((response.status === 401 || response.status === 403) && cachedBearerToken && cachedBearerToken.source !== "env") {
        cachedBearerToken = null;
        token = await getBearerToken();
        response = await makeRequest(token);
    }

    const text = await response.text();
    let payload: any = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    const errorCode =
        payload?.errors?.[0]?.code ||
        payload?.errors?.[0]?.title ||
        payload?.title ||
        payload?.error;

    if (!response.ok) {
        const message = buildApiErrorMessage(response.status, payload);
        throw new XApiError(message, response.status, errorCode);
    }

    if (payload?.errors?.length) {
        const message = buildApiErrorMessage(response.status, payload);
        const status = response.status === 200 ? 404 : response.status;
        throw new XApiError(message, status, errorCode);
    }

    return payload as T;
}

function mapTweetType(referenced: Array<{ type: string }>) {
    const types = new Set(referenced.map((item) => item.type));
    if (types.has("quoted")) return "quote";
    if (types.has("replied_to")) return "reply";
    if (types.has("retweeted")) return "retweet";
    return "original";
}

async function fetchUserTweets(userId: string): Promise<ScrapedTweet[]> {
    const tweets: ScrapedTweet[] = [];
    const seenIds = new Set<string>();
    let paginationToken: string | undefined;

    while (tweets.length < MAX_TWEETS) {
        const remaining = MAX_TWEETS - tweets.length;
        const pageSize = Math.min(100, remaining);

        const response = await fetchTwitterApi<{
            data?: Array<{
                id: string;
                text: string;
                entities?: { hashtags?: Array<{ tag: string }>; urls?: unknown[] };
                referenced_tweets?: Array<{ type: string }>;
            }>;
            meta?: { next_token?: string };
        }>(
            `/users/${userId}/tweets`,
            {
                "max_results": `${pageSize}`,
                "tweet.fields": "created_at,lang,entities,referenced_tweets",
                "pagination_token": paginationToken,
            }
        );

        const data = response?.data || [];
        for (const tweet of data) {
            if (!tweet?.id || seenIds.has(tweet.id)) continue;
            seenIds.add(tweet.id);

            const type = mapTweetType(tweet.referenced_tweets || []);
            const text = tweet.text || "";
            const hashtags = (tweet.entities?.hashtags || []).map((tag) => `#${tag.tag}`);
            const hasUrls = Array.isArray(tweet.entities?.urls) && tweet.entities?.urls.length > 0;
            const isRetweetWithoutText = type === "retweet";

            tweets.push({
                id: tweet.id,
                text,
                type,
                hashtags,
                hasUrls,
                isRetweetWithoutText,
            });
        }

        paginationToken = response?.meta?.next_token;
        if (!paginationToken) break;
    }

    return tweets;
}

export async function scrapeTwitterProfile(username: string): Promise<ScrapedData> {
    console.log(`Starting scrape for user: ${username}`);

    const userResponse = await fetchTwitterApi<{
        data?: {
            id: string;
            description?: string;
            created_at?: string;
            verified?: boolean;
            public_metrics?: {
                tweet_count: number;
                followers_count: number;
                following_count: number;
                listed_count: number;
            };
        };
    }>(
        `/users/by/username/${encodeURIComponent(username)}`,
        { "user.fields": "description,public_metrics,created_at,verified" }
    );

    const userId = userResponse?.data?.id;
    if (!userId) {
        throw new XApiError("X API returned no user id", 404, "UserNotFound");
    }

    const tweets = await fetchUserTweets(userId);
    const bio = userResponse.data?.description || "";

    if (!bio && tweets.length === 0) {
        throw new Error("X API returned empty bio and tweets");
    }

    console.log(`Scrape successful via X API for ${username}.`);

    return {
        user: {
            username: username.toLowerCase(),
            description: bio,
            created_at: userResponse.data?.created_at,
            verified: userResponse.data?.verified,
            public_metrics: userResponse.data?.public_metrics,
        },
        tweets,
        source: "twitter_api",
    };
}
