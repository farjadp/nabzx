// ============================================================================
// Hardware Source: app/api/admin/route.ts
// Version: 1.0.0 — 2026-01-20
// Why: Admin Dashboard Data Provider
// Env / Identity: API Route
// ============================================================================

import { NextResponse } from 'next/server';
import { DBService } from '@/lib/db/service';

export async function GET() {
    try {
        const stats = DBService.getStats();
        const logs = DBService.getAllUsers();

        return NextResponse.json({
            status: "success",
            stats: {
                total_analyzed: stats.total_analyzed,
                cache_hit_rate: 87, // Mocked for demo as we don't track reads vs writes strictly yet
                est_cost_saved: (stats.total_history_points * 0.05).toFixed(2), // Mock calculation
                system_status: stats.status
            },
            logs: logs
        });
    } catch (error: unknown) {
        console.error("Failed to fetch admin data", error);
        return NextResponse.json({ status: "error", message: "Failed to fetch admin data" }, { status: 500 });
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
