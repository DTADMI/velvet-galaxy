import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiComplete } from "@/lib/ai/factory";

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { mediaType, context = "" } = body;

        const response = await aiComplete({
            model: "deepseek-v4-flash",
            messages: [
                {
                    role: "system",
                    content: `You are a media captioning assistant for Velvet Galaxy. Generate a concise, engaging caption for this ${mediaType}. ${context ? `Context: ${context}` : ""} Return ONLY the caption text, no explanations.`,
                },
                {
                    role: "user",
                    content: `Generate a caption for my ${mediaType} post. ${context}`,
                },
            ],
            temperature: 0.7,
            maxTokens: 200,
            feature: "media_caption",
            userId: user.id,
        });

        return NextResponse.json({ caption: response.content });
    } catch (error) {
        console.error("[VG:AI:Caption]", error);
        return NextResponse.json({ error: "Captioning unavailable" }, { status: 500 });
    }
}
