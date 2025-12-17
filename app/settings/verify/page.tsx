import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {VerificationClient} from "./verification-client";

export default async function VerifyPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified, verification_date")
        .eq("id", user.id)
        .single();

    const {data: verificationRequest} = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", {ascending: false})
        .limit(1)
        .single();

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-2xl px-4">
                    {profile && <VerificationClient profile={profile} existingRequest={verificationRequest}/>}
                </div>
            </main>
        </>
    );
}
