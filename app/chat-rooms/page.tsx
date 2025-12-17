import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {ChatRoomsClient} from "./chat-rooms-client";

export default async function ChatRoomsPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2">Chat Rooms</h1>
                        <p className="text-muted-foreground">Join public chat rooms or create your own</p>
                    </div>
                    <ChatRoomsClient userId={user?.id}/>
                </div>
            </main>
        </>
    );
}
