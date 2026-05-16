import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiSuggestTags } from "@/lib/ai";

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
