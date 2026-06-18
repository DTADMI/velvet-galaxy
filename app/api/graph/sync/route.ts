import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncInitialGraph } from "@/lib/neo4j";

export async function POST() {
    await connection();
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

    try {
        const result = await syncInitialGraph();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("[VG:Graph:Sync]", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
