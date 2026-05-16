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
        const { groupName, groupDescription, memberCount, interests = [] } = body;

        const response = await aiComplete({
            model: "deepseek-v4-pro",
            messages: [
                {
                    role: "system",
                    content: `You are an activity generator for Velvet Galaxy groups. Suggest engaging activities and events for the group "${groupName}". ${groupDescription ? `Group description: ${groupDescription}.` : ""} ${memberCount ? `Member count: ${memberCount}.` : ""} ${interests.length ? `Member interests: ${interests.join(", ")}.` : ""} Return JSON: {"activities": [{"title": string, "description": string, "format": "discussion"|"event"|"challenge"|"game", "duration": string}], "themes": string[]}. Suggest 3-5 activities.`,
                },
                {
                    role: "user",
                    content: `Generate group activities for: ${groupName}`,
                },
            ],
            temperature: 0.8,
            maxTokens: 1024,
            feature: "group_activity",
            userId: user.id,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return NextResponse.json(JSON.parse(jsonMatch[0]));
            }
        } catch {}

        return NextResponse.json({ activities: [], themes: [] });
    } catch (error) {
        console.error("[VG:AI:Group]", error);
        return NextResponse.json({ error: "Activity generator unavailable" }, { status: 500 });
    }
}
