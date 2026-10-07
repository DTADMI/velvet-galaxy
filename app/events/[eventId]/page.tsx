import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {EventDetailView} from "./event-detail-view";

export async function generateMetadata({params}: { params: Promise<{ eventId: string }> }) {
    const {eventId} = await params;
    const supabase = await createServerClient();
    const {data} = await supabase.from("events").select("*").eq("id", eventId).single();
    const title = data?.title ?? "Event";
    const description = data?.description ?? "Discover and join this community event on Velvet Galaxy.";
    return {
        title,
        description,
        alternates: {canonical: `/events/${eventId}`},
        openGraph: {title, description, url: `/events/${eventId}`},
    };
}

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
