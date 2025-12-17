import {createServerClient} from "@/lib/supabase/server";

export async function requirePremium() {
    const supabase = await createServerClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return {allowed: false, reason: "not_authenticated"};
    }

    const {data: subscription} = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();

    if (!subscription || subscription.status !== "active") {
        return {allowed: false, reason: "no_subscription"};
    }

    if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        if (expiryDate < new Date()) {
            return {allowed: false, reason: "expired"};
        }
    }

    return {allowed: true};
}
