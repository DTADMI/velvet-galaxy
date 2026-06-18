import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
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

        const health = await getSystemHealth();
        return NextResponse.json(health);
    } catch (error) {
        console.error("[VG:API:Health] Error:", error);
        return NextResponse.json(
            { error: "Health check unavailable", timestamp: Date.now() },
            { status: 500 }
        );
    }
}
