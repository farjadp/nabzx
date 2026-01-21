import fs from "fs";
import path from "path";

export type ScraperSource = "twitter" | "apify";

export interface AdminSettings {
    scraper_source: ScraperSource;
    apify_actor_id?: string;
    updated_at: string;
}

const SETTINGS_PATH = path.join(process.cwd(), "settings-store.json");
const FALLBACK_ACTOR_ID = "apify/twitter-scraper";
const DEFAULT_APIFY_ACTOR_ID = process.env.APIFY_TWITTER_ACTOR_ID || "shanes/tweet-flash";

const DEFAULT_SETTINGS: AdminSettings = {
    scraper_source: "twitter",
    apify_actor_id: DEFAULT_APIFY_ACTOR_ID,
    updated_at: new Date(0).toISOString(),
};

function readSettings(): AdminSettings {
    if (!fs.existsSync(SETTINGS_PATH)) return { ...DEFAULT_SETTINGS };
    try {
        const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) as Partial<AdminSettings>;
        const scraperSource = raw.scraper_source === "apify" ? "apify" : "twitter";
        const storedActorId = typeof raw.apify_actor_id === "string" ? raw.apify_actor_id.trim() : "";
        const apifyActorId = storedActorId && storedActorId !== FALLBACK_ACTOR_ID
            ? storedActorId
            : DEFAULT_APIFY_ACTOR_ID;
        return {
            scraper_source: scraperSource,
            apify_actor_id: apifyActorId,
            updated_at: raw.updated_at || DEFAULT_SETTINGS.updated_at,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function writeSettings(settings: AdminSettings) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export const SettingsService = {
    getSettings: () => readSettings(),

    updateSettings: (updates: Partial<AdminSettings>) => {
        const current = readSettings();
        const scraperSource = updates.scraper_source === "apify"
            ? "apify"
            : updates.scraper_source === "twitter"
                ? "twitter"
                : current.scraper_source;
        const apifyActorId = typeof updates.apify_actor_id === "string"
            ? updates.apify_actor_id.trim() || DEFAULT_APIFY_ACTOR_ID
            : current.apify_actor_id;
        const next: AdminSettings = {
            ...current,
            scraper_source: scraperSource,
            apify_actor_id: apifyActorId,
            updated_at: new Date().toISOString(),
        };
        writeSettings(next);
        return next;
    },
};
