import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getFeatureFlags, invalidateFlagCache } from "@/lib/feature-flags.server";

export async function GET() {
    await connection();
    try {
        const flags = await getFeatureFlags();
        return NextResponse.json(flags);
    } catch (error) {
        console.error("[VG:API:FeatureFlags] GET failed:", error);
        return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
    }
}

export async function POST() {
    await connection();
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await invalidateFlagCache();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[VG:API:FeatureFlags] POST failed:", error);
        return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 });
    }
}
