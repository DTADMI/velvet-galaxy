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
        const { context, goal = "conversation" } = body;
        // goal: "conversation" | "icebreaker" | "profile_tips" | "social_coaching"

        const prompts: Record<string, string> = {
            conversation: "Suggest 3 conversation starters based on the user's context.",
            icebreaker: "Suggest 3 icebreaker messages for connecting with someone new.",
            profile_tips: "Suggest 3 tips for improving the user's profile to attract more meaningful connections.",
            social_coaching: "Provide 2-3 pieces of social coaching advice for navigating relationships on a social platform.",
        };

        const response = await aiComplete({
            model: "deepseek-v4-flash",
            messages: [
                {
                    role: "system",
                    content: `You are a friendly social coach for Velvet Galaxy. ${prompts[goal] || prompts.conversation} Keep advice positive, respectful, and actionable. ${context ? `Context: ${context}` : ""}`,
                },
                {
                    role: "user",
                    content: context || "I need some social guidance.",
                },
            ],
            temperature: 0.8,
            maxTokens: 512,
            feature: "chat_assistant",
            userId: user.id,
        });

        return NextResponse.json({ advice: response.content, goal });
    } catch (error) {
        console.error("[VG:AI:Chat]", error);
        return NextResponse.json({ error: "Assistant unavailable" }, { status: 500 });
    }
}
