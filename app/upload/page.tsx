import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {UploadForm} from "@/components/upload-form";
import {createClient} from "@/lib/supabase/server";

export default async function UploadPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ type?: string }>
}) {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: profile} = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/auth/login");
    }

    const params = await searchParams;
    const uploadType = params.type || "picture";

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-3xl px-4">
                    <UploadForm profile={profile} initialType={uploadType}/>
                </div>
            </main>
        </>
    );
}
