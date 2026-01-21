// ============================================================================
// Hardware Source: app/api/admin/route.ts
// Version: 1.0.0 — 2026-01-20
// Why: Admin Dashboard Data Provider
// Env / Identity: API Route
// ============================================================================

import { NextResponse } from 'next/server';
import { DBService } from '@/lib/db/service';
import { SettingsService } from '@/lib/db/settings';

export async function GET() {
    try {
        const stats = DBService.getStats();
        const logs = DBService.getAllUsers();
        const settings = SettingsService.getSettings();

        return NextResponse.json({
            status: "success",
            stats: {
                total_analyzed: stats.total_analyzed,
                cache_hit_rate: 87, // Mocked for demo as we don't track reads vs writes strictly yet
                est_cost_saved: (stats.total_history_points * 0.05).toFixed(2), // Mock calculation
                system_status: stats.status
            },
            logs: logs,
            settings
        });
    } catch (error: unknown) {
        console.error("Failed to fetch admin data", error);
        return NextResponse.json({ status: "error", message: "Failed to fetch admin data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, scraper_source } = body;

        if (action === "set_scraper_source") {
            if (scraper_source !== "twitter" && scraper_source !== "apify") {
                return NextResponse.json({ status: "error", message: "Invalid scraper source" }, { status: 400 });
            }
            const settings = SettingsService.updateSettings({ scraper_source });
            return NextResponse.json({ status: "success", settings });
        }

        return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
        console.error("Failed to update admin settings", error);
        return NextResponse.json({ status: "error", message: "Failed to update settings" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { username, action } = body;

        if (action === "delete_user" && username) {
            const success = DBService.deleteUser(username);
            return NextResponse.json({ status: success ? "success" : "error" });
        }

        return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
    } catch {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
