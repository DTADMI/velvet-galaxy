import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getPeopleYouMayKnow, getContentRecommendations, getProfileGraph } from "@/lib/neo4j";

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "recommendations";
    const profileId = searchParams.get("profileId") || user.id;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    try {
        switch (type) {
            case "people": {
                const people = await getPeopleYouMayKnow(profileId, limit);
                if (people.length === 0) {
                    return NextResponse.json({
                        recommendations: [],
                        source: "supabase",
                        message: "Graph not available, using basic recommendations",
                    });
                }
                return NextResponse.json({ recommendations: people, source: "neo4j" });
            }
            case "content": {
                const postIds = await getContentRecommendations(profileId, limit);
                if (postIds.length === 0) {
                    return NextResponse.json({ recommendations: [], source: "supabase" });
                }
                const { data: posts } = await supabase
                    .from("posts")
                    .select("*, profiles(*)")
                    .in("id", postIds);
                return NextResponse.json({ recommendations: posts || [], source: "neo4j" });
            }
            case "graph": {
                const graph = await getProfileGraph(profileId, 2);
                return NextResponse.json(graph);
            }
            default:
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("[VG:Graph]", error);
        return NextResponse.json({ error: "Graph service unavailable" }, { status: 500 });
    }
}
