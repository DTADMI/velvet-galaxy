import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import DiscoveryClient from "./discovery-client";

export default async function DiscoveryPage() {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return <DiscoveryClient profile={profile}/>;
}
