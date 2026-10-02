import {Navigation} from "@/components/navigation";
import {createServerClient} from "@/lib/supabase/server";

import {GroupsClient} from "./groups-client";

export const metadata = {
    title: "Groups",
    description: "Join groups and communities on Velvet Galaxy.",
    alternates: {canonical: "/groups"},
    openGraph: {
        title: "Groups",
        description: "Join groups and communities on Velvet Galaxy.",
        url: "/groups",
    },
};

export default async function GroupsPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div
                    className="bg-gradient-to-br from-royal-green/10 via-background to-emerald-600/10 border-b border-royal-green/20">
                    <div className="container mx-auto px-4 py-12">
                        <h1 className="text-5xl font-bold text-gradient mb-4">Groups</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl">
                            Connect with like-minded people, share experiences, and build lasting communities
                        </p>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <GroupsClient userId={user?.id}/>
                </div>
            </main>
        </>
    );
}
