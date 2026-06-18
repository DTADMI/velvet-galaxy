import { connection } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    await connection();
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === "subscribe") {
            const { subscription } = body;
            if (!subscription?.endpoint) {
                return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
            }

            const existingEndpoint = subscription.endpoint;
            const { data: existing } = await supabase
                .from("push_subscriptions")
                .select("id")
                .eq("user_id", user.id)
                .eq("endpoint", existingEndpoint)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("push_subscriptions")
                    .update({
                        subscription: subscription,
                        active: true,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("push_subscriptions")
                    .insert({
                        user_id: user.id,
                        endpoint: existingEndpoint,
                        subscription: subscription,
                        active: true,
                    });
            }

            return NextResponse.json({ success: true });
        }

        if (action === "unsubscribe") {
            const { endpoint } = body;
            if (!endpoint) {
                return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
            }

            await supabase
                .from("push_subscriptions")
                .update({
                    active: false,
                    deactivated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id)
                .eq("endpoint", endpoint);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[VG:API:Push] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
    await connection();
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data } = await supabase
            .from("push_subscriptions")
            .select("endpoint, active, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        return NextResponse.json({ subscriptions: data || [] });
    } catch (error) {
        console.error("[VG:API:Push:GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }
}
