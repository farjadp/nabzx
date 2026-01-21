import fs from "fs";
import path from "path";
import { AnalysisOutput } from "@/lib/analysis/types";

const DB_PATH = path.join(process.cwd(), "data-store.json");

type StoredAnalysis = Partial<AnalysisOutput> & {
    dominant_tendency?: { label?: string };
    discourse_diversity?: { rating?: string };
};

interface UserRecord {
    username: string;
    last_analyzed_at: string;
    current_data: StoredAnalysis;
    history: {
        date: string;
        data: StoredAnalysis;
    }[];
}

function readDB(): Record<string, UserRecord> {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Record<string, UserRecord>;
}

function writeDB(data: Record<string, UserRecord>) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const DBService = {
    getUser: (username: string) => {
        const db = readDB();
        return db[username.toLowerCase()] || null;
    },

    saveUser: (username: string, analysisData: StoredAnalysis) => {
        const db = readDB();
        const key = username.toLowerCase();
        const existingUser = db[key];
        const now = new Date().toISOString();

        if (existingUser) {
            existingUser.history.push({
                date: existingUser.last_analyzed_at,
                data: existingUser.current_data
            });
            existingUser.current_data = analysisData;
            existingUser.last_analyzed_at = now;
            db[key] = existingUser;
        } else {
            db[key] = {
                username: key,
                last_analyzed_at: now,
                current_data: analysisData,
                history: []
            };
        }
        writeDB(db);
    },

    getRecentUsers: (limit: number = 5) => {
        const db = readDB();
        return Object.values(db)
            .sort((a, b) => new Date(b.last_analyzed_at).getTime() - new Date(a.last_analyzed_at).getTime())
            .slice(0, limit)
            .map(u => ({
                username: u.username,
                last_analyzed_at: u.last_analyzed_at,
                focus: u.current_data?.analysis_meta?.primary_focus_area || "N/A",
                confidence: u.current_data?.analysis_meta?.confidence_score || 0,
                tendency: u.current_data?.dominant_tendency?.label || "نامشخص",
                diversity: u.current_data?.discourse_diversity?.rating || "نامشخص"
            }));
    },

    getAllUsers: () => {
        const db = readDB();
        return Object.values(db).map(u => ({
            username: u.username,
            last_analyzed_at: u.last_analyzed_at,
            category: u.current_data?.analysis_meta?.primary_focus_area || "N/A",
            confidence: u.current_data?.analysis_meta?.confidence_score || 0,
        })).sort((a, b) => new Date(b.last_analyzed_at).getTime() - new Date(a.last_analyzed_at).getTime());
    },

    deleteUser: (username: string) => {
        const db = readDB();
        const key = username.toLowerCase();
        if (db[key]) {
            delete db[key];
            writeDB(db);
            return true;
        }
        return false;
    },

    getStats: () => {
        const db = readDB();
        const users = Object.values(db);
        const total = users.length;
        const totalHistory = users.reduce((acc, u) => acc + u.history.length, 0);
        // Estimate saved: Assuming $0.10 per analysis. Cached = history items (archived runs)??
        // Actually, let's just use total records for now as "Analyzed".
        return {
            total_analyzed: total,
            total_history_points: totalHistory,
            db_size_bytes: JSON.stringify(db).length,
            status: "Online"
        };
    }
};
