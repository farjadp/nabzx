import { NextResponse } from 'next/server';
import { DBService } from '@/lib/db/service';

export async function GET() {
    try {
        const recent = DBService.getRecentUsers(5);
        return NextResponse.json({ status: "success", data: recent });
    } catch (error: unknown) {
        console.error("Failed to fetch history", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
