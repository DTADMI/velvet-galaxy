import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {EventDetailView} from "./event-detail-view";

export default async function EventDetailPage({
                                                  params,
                                              }: {
    params: Promise<{ eventId: string }>
}) {
    const {eventId} = await params;
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: event} = await supabase
        .from("events")
        .select("*, profiles!events_creator_id_fkey(display_name, avatar_url)")
        .eq("id", eventId)
        .single();

    if (!event) {
        redirect("/events");
    }

    return <EventDetailView event={event} userId={user.id}/>;
}
