import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {MessageSettingsClient} from "./message-settings-client";

export default async function MessageSettingsPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (!profile) {
        redirect("/auth/login");
    }

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-16">
                <MessageSettingsClient profile={profile}/>
            </main>
        </>
    );
}
