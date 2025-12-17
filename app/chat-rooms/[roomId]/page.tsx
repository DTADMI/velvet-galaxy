import {notFound, redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {ChatRoomView} from "./chat-room-view";

export default async function ChatRoomPage({
                                               params,
                                           }: {
    params: Promise<{ roomId: string }>
}) {
    const {roomId} = await params;
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: room} = await supabase.from("conversations").select("*").eq("id", roomId).single();

    if (!room || !room.is_chat_room) {
        notFound();
    }

    const {data: isMember} = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!isMember) {
        redirect("/chat-rooms");
    }

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-16">
                <ChatRoomView
                    roomId={roomId}
                    userId={user.id}
                    roomType={room.room_type || "text"}
                    roomName={room.name || "Chat Room"}
                />
            </main>
        </>
    );
}
