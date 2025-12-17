import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {ActivityFeed} from "./activity-feed";

export default async function ActivityPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gradient mb-2">Activity Feed</h1>
                        <p className="text-muted-foreground">See what your friends and connections are up to</p>
                    </div>
                    <ActivityFeed userId={user.id}/>
                </div>
            </main>
        </>
    );
}
