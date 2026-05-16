import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
    typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:3000",
].filter(Boolean) as string[]);

export async function GET(request: Request) {
    const origin = request.headers.get("origin") || "";

    if (process.env.NODE_ENV === "production" && origin && !ALLOWED_ORIGINS.has(origin)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
}
