import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiModerate, checkAiGate } from "@/lib/ai";

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const gate = await checkAiGate(user.id, "content_moderation");
    if (!gate.allowed) {
        return NextResponse.json(
            { error: gate.error },
            { status: gate.status, headers: gate.retryAfterMs ? { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } : {} }
        );
    }

    try {
        const body = await request.json();
        const { content, contentType = "post" } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid content field" },
                { status: 400 }
            );
        }

        const result = await aiModerate(content.slice(0, 5000), contentType, user.id);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[VG:AI:Moderate]", error);
        return NextResponse.json(
            { flagged: false, categories: ["safe"], confidence: 0, error: "Moderation unavailable" },
            { status: 500 }
        );
    }
}
