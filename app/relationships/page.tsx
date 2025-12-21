import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {RelationshipsClient} from "./relationships-client";

export default async function RelationshipsPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="container mx-auto p-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2 text-gradient">Relationships</h1>
                    <p className="text-muted-foreground mb-8">Manage your connections and relationships</p>
                    <RelationshipsClient userId={user.id}/>
                </div>
            </div>
        </div>
    );
}
