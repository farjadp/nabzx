// ============================================================================
// Hardware Source: app/api/auth/login/route.ts
// Version: 1.0.0 — 2026-01-20
// Why: Verify credentials and set admin session cookie
// Env / Identity: API Route
// ============================================================================

import { NextResponse } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        const normalizedUsername = typeof username === "string" ? username.trim() : "";
        const normalizedPassword = typeof password === "string" ? password : "";

        if (normalizedUsername === ADMIN_USER && normalizedPassword === ADMIN_PASSWORD) {
            const response = NextResponse.json({ status: "success" });

            response.cookies.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 });
    } catch (error: unknown) {
        console.error("Admin login failed", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
