import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {MessagesClient} from "./messages-client";

export default async function MessagesPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    // Get all conversations for the user
    const {data: participations} = await supabase
        .from("conversation_participants")
        .select(
            `
      conversation_id,
      conversations (
        id,
        type,
        name,
        updated_at
      )
    `,
        )
        .eq("user_id", user.id);

    // Get the latest message for each conversation
    const conversationIds = participations?.map((p) => p.conversation_id) || [];
    const {data: latestMessages} = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", {ascending: false});

    // Get other participants for each conversation
    const {data: allParticipants} = await supabase
        .from("conversation_participants")
        .select(
            `
      conversation_id,
      user_id,
      profiles (
        username,
        display_name
      )
    `,
        )
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

    // Combine the data
    const conversations =
        participations?.map((p) => {
            const conv = p.conversations as any;
            const lastMsg = latestMessages?.find((m) => m.conversation_id === p.conversation_id);
            const otherParticipant = allParticipants?.find((ap) => ap.conversation_id === p.conversation_id);

            return {
                id: conv.id,
                type: conv.type,
                name: conv.name,
                updated_at: conv.updated_at,
                last_message: lastMsg
                    ? {
                        content: lastMsg.content,
                        created_at: lastMsg.created_at,
                    }
                    : undefined,
                other_participant: otherParticipant?.profiles
                    ? {
                        username: (otherParticipant.profiles as any).username,
                        display_name: (otherParticipant.profiles as any).display_name,
                    }
                    : undefined,
            };
        }) || [];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-16">
                <MessagesClient conversations={conversations} currentUserId={user.id}/>
            </main>
        </>
    );
}
