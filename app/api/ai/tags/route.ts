import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiSuggestTags, checkAiGate } from "@/lib/ai";

export async function POST(request: Request) {
    await connection();
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const gate = await checkAiGate(user.id, "tag_suggestions");
    if (!gate.allowed) {
        return NextResponse.json(
            { error: gate.error },
            { status: gate.status, headers: gate.retryAfterMs ? { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } : {} }
        );
    }

    try {
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid content field" },
                { status: 400 }
            );
        }

        const tags = await aiSuggestTags(content.slice(0, 3000), user.id);

        return NextResponse.json({ tags });
    } catch (error) {
        console.error("[VG:AI:Tags]", error);
        return NextResponse.json(
            { tags: [], error: "Tag suggestions unavailable" },
            { status: 500 }
        );
    }
}
