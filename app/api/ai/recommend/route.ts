import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiComplete, checkAiGate } from "@/lib/ai";

export async function POST(request: Request) {
    await connection();
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const gate = await checkAiGate(user.id, "content_recommendations");
    if (!gate.allowed) {
        return NextResponse.json(
            { error: gate.error },
            { status: gate.status, headers: gate.retryAfterMs ? { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } : {} }
        );
    }

    try {
        const body = await request.json();
        const { interests, recentLikes, limit = 20 } = body;

        const interestsStr = interests?.length
            ? `User interests: ${interests.join(", ")}.`
            : "";
        const likesStr = recentLikes?.length
            ? `Recently liked content types: ${recentLikes.join(", ")}.`
            : "";

        const response = await aiComplete({
            model: "deepseek-v4-flash",
            messages: [
                {
                    role: "system",
                    content: `You are a content recommendation engine for Velvet Galaxy. Based on the user's interests and recent activity, suggest content categories and topics they might enjoy. Return JSON: {"categories": string[], "suggestedTags": string[], "reasoning": string}.`,
                },
                {
                    role: "user",
                    content: `${interestsStr} ${likesStr} Suggest ${limit} content recommendations.`,
                },
            ],
            temperature: 0.7,
            maxTokens: 512,
            feature: "content_recommendations",
            userId: user.id,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return NextResponse.json(JSON.parse(jsonMatch[0]));
            }
        } catch {}

        return NextResponse.json({
            categories: [],
            suggestedTags: [],
            reasoning: "AI recommendations unavailable",
        });
    } catch (error) {
        console.error("[VG:AI:Recommend]", error);
        return NextResponse.json(
            { error: "Recommendations unavailable" },
            { status: 500 }
        );
    }
}
