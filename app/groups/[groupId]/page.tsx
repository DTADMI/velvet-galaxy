import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {GroupDetailView} from "./group-detail-view";

export default async function GroupDetailPage({
                                                  params,
                                              }: {
    params: Promise<{ groupId: string }>
}) {
    const {groupId} = await params;
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: group} = await supabase
        .from("groups")
        .select("*, profiles!groups_creator_id_fkey(display_name, avatar_url)")
        .eq("id", groupId)
        .single();

    if (!group) {
        redirect("/groups");
    }

    return <GroupDetailView group={group} userId={user.id}/>;
}
