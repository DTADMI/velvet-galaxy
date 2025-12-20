import {redirect} from "next/navigation";

import {Navigation} from "@/components/navigation";
import {createClient} from "@/lib/supabase/server";

import {MarketplaceClient} from "./marketplace-client";

export default async function MarketplacePage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    const {data: items} = await supabase
        .from("marketplace_items")
        .select(
            `
      id,
      title,
      description,
      price,
      location,
      image_url,
      status,
      created_at,
      author_profile:profiles!user_id (
        username,
        display_name
      )
    `,
        )
        .eq("status", "active")
        .order("created_at", {ascending: false});

// Transform the data to ensure profiles is a single object
    const transformedItems = (items || []).map(item => ({
        ...item,
        author_profile: Array.isArray(item.author_profile) ? item.author_profile[0] : item.author_profile
    }));

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4">
                    <MarketplaceClient items={transformedItems}/>
                </div>
            </main>
        </>
    );
}
