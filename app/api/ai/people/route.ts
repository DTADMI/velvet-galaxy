import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiComplete, checkAiGate } from "@/lib/ai";

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const gate = await checkAiGate(user.id, "people_discovery");
        if (!gate.allowed) {
            return NextResponse.json(
                { error: gate.error },
                { status: gate.status, headers: gate.retryAfterMs ? { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } : {} }
            );
        }

        const body = await request.json();
        const { interests, networkSize = 20 } = body;

        const interestsStr = interests?.length
            ? `User interests: ${interests.join(", ")}.`
            : "";

        const response = await aiComplete({
            model: "deepseek-v4-pro",
            messages: [
                {
                    role: "system",
                    content: `You are a social discovery engine for Velvet Galaxy. Based on the user's interests, suggest the types of people they should connect with. Return JSON: {"suggestedProfiles": string[], "communities": string[], "reasoning": string}. suggestedProfiles should be descriptions of interesting people types. communities should be suggested community/group themes.`,
                },
                {
                    role: "user",
                    content: `${interestsStr} Suggest ${networkSize} people discovery recommendations.`,
                },
            ],
            temperature: 0.6,
            maxTokens: 512,
            feature: "people_discovery",
            userId: user.id,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return NextResponse.json(JSON.parse(jsonMatch[0]));
            }
        } catch {}

        return NextResponse.json({
            suggestedProfiles: [],
            communities: [],
            reasoning: "AI recommendations unavailable",
        });
    } catch (error) {
        console.error("[VG:AI:PeopleDiscovery]", error);
        return NextResponse.json(
            { error: "People discovery unavailable" },
            { status: 500 }
        );
    }
}
