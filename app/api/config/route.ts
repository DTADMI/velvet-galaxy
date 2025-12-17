import {NextResponse} from "next/server";

export async function GET() {
    return NextResponse.json({
        supabaseUrl:
            process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        supabaseAnonKey:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.SUPABASE_ANON_KEY,
    });
}
