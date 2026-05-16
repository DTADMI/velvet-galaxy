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
        const { interests, goals, preferences = "" } = body;

        const interestsStr = interests?.length ? `Interests: ${interests.join(", ")}.` : "";
        const goalsStr = goals?.length ? `Goals: ${goals.join(", ")}.` : "";

        const response = await aiComplete({
            model: "deepseek-v4-flash",
            messages: [
                {
                    role: "system",
                    content: `You are an onboarding assistant for Velvet Galaxy, a social platform. Help the new user set up their profile and discover relevant communities. ${interestsStr} ${goalsStr} ${preferences}. Suggest: 1) Profile bio ideas 2) Groups to join 3) People to follow 4) First post ideas. Return JSON: {"bioSuggestions": string[], "groupSuggestions": string[], "firstPostIdeas": string[], "welcomeMessage": string}.`,
                },
                {
                    role: "user",
                    content: `Help me get started on Velvet Galaxy. ${interestsStr} ${goalsStr}`,
                },
            ],
            temperature: 0.7,
            maxTokens: 1024,
            feature: "onboarding_assistant",
            userId: user.id,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return NextResponse.json(JSON.parse(jsonMatch[0]));
            }
        } catch {}

        return NextResponse.json({
            bioSuggestions: [],
            groupSuggestions: [],
            firstPostIdeas: [],
            welcomeMessage: "Welcome to Velvet Galaxy! Let's get you set up.",
        });
    } catch (error) {
        console.error("[VG:AI:Onboarding]", error);
        return NextResponse.json({ error: "Onboarding assistant unavailable" }, { status: 500 });
    }
}
