import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || undefined;
        const action = searchParams.get("action") || undefined;
        const targetType = searchParams.get("targetType") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const logs = await getAuditLog({ userId, action, targetType, limit, offset });
        return NextResponse.json(logs);
    } catch (error) {
        console.error("[VG:API:Audit] Error:", error);
        return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
    }
}
