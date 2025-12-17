import {redirect} from "next/navigation";

import {createClient} from "@/lib/supabase/server";

import {OnboardingFlow} from "./onboarding-flow";

export default async function OnboardingPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // If profile is complete, redirect to feed
    if (profile && profile.display_name && profile.bio) {
        redirect("/feed");
    }

    return <OnboardingFlow userId={user.id} existingProfile={profile}/>;
}
