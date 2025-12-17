import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {EventsClient} from "./events-client";

export default async function EventsPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div
                    className="bg-gradient-to-br from-royal-orange/10 via-background to-amber-600/10 border-b border-royal-orange/20">
                    <div className="container mx-auto px-4 py-12">
                        <h1 className="text-5xl font-bold text-gradient mb-4">Events</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl">
                            Discover exciting events, meet new people, and create unforgettable memories
                        </p>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <EventsClient userId={user?.id}/>
                </div>
            </main>
        </>
    );
}
