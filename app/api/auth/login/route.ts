// ============================================================================
// Hardware Source: app/api/auth/login/route.ts
// Version: 1.0.0 — 2026-01-20
// Why: Verify credentials and set admin session cookie
// Env / Identity: API Route
// ============================================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
            const cookieStore = await cookies();

            // Set session cookie
            cookieStore.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

            return NextResponse.json({ status: "success" });
        }

        return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 });
    } catch {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
