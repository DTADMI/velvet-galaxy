import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { aiCompose } from "@/lib/ai";

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { prompt, style = "neutral" } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid prompt field" },
                { status: 400 }
            );
        }

        if (!["casual", "professional", "flirtatious", "neutral"].includes(style)) {
            return NextResponse.json(
                { error: "Invalid style. Must be casual, professional, flirtatious, or neutral." },
                { status: 400 }
            );
        }

        const composed = await aiCompose(prompt.slice(0, 1000), style, user.id);

        return NextResponse.json({ composed });
    } catch (error) {
        console.error("[VG:AI:Compose]", error);
        return NextResponse.json(
            { error: "Writing assistant unavailable. Please try again later." },
            { status: 500 }
        );
    }
}
