import {redirect} from "next/navigation";

import {createServerClient} from "@/lib/supabase/server";

import {SearchResults} from "./search-results";

export default async function SearchPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ q?: string; type?: string }>
}) {
    const params = await searchParams;
    const supabase = await createServerClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return <SearchResults query={params.q || ""} type={params.type || "all"} userId={user.id}/>;
}
