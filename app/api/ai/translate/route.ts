import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiTranslate, checkAiGate } from "@/lib/ai";

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const gate = await checkAiGate(user.id, "translation");
    if (!gate.allowed) {
        return NextResponse.json(
            { error: gate.error },
            { status: gate.status, headers: gate.retryAfterMs ? { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } : {} }
        );
    }

    try {
        const body = await request.json();
        const { content, targetLanguage } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid content field" },
                { status: 400 }
            );
        }

        if (!targetLanguage || !["en", "fr"].includes(targetLanguage)) {
            return NextResponse.json(
                { error: "Invalid target language. Must be 'en' or 'fr'." },
                { status: 400 }
            );
        }

        const translated = await aiTranslate(content.slice(0, 5000), targetLanguage, user.id);

        return NextResponse.json({ translated });
    } catch (error) {
        console.error("[VG:AI:Translate]", error);
        return NextResponse.json(
            { error: "Translation unavailable. Please try again later." },
            { status: 500 }
        );
    }
}
