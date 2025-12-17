import {redirect} from "next/navigation";

import {createClient} from "@/lib/supabase/server";

import {NotificationsClient} from "./notifications-client";

export default async function NotificationsPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (!profile) {
        redirect("/onboarding");
    }

    // Fetch initial notifications
    const {data: notifications} = await supabase
        .from("notifications")
        .select(
            `
      *,
      from_user:from_user_id (
        id,
        username,
        display_name,
        avatar_url,
        is_verified
      )
    `,
        )
        .eq("user_id", user.id)
        .order("created_at", {ascending: false})
        .limit(50);

    return <NotificationsClient profile={profile} initialNotifications={notifications || []}/>;
}
