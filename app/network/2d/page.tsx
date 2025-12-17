import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {Network2DVisualization} from "./network-2d-visualization";

export default async function Network2DPage() {
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <Network2DVisualization userId={user.id}/>
        </div>
    );
}
