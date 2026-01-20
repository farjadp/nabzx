import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data-store.json");

interface UserRecord {
    username: string;
    last_analyzed_at: string;
    current_data: any;
    history: {
        date: string;
        data: any;
    }[];
}

function readDB(): Record<string, UserRecord> {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDB(data: Record<string, UserRecord>) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const DBService = {
    getUser: (username: string) => {
        const db = readDB();
        return db[username.toLowerCase()] || null;
    },

    saveUser: (username: string, analysisData: any) => {
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
    }
};
